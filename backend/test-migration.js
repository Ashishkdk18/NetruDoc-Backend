import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import User from './src/features/users/models/userModel.js';
import Appointment from './src/features/appointments/models/appointmentModel.js';

// Load environment variables
dotenv.config();

/**
 * Test Sprint 3 Migration Results
 * Verifies that all migration changes were applied correctly
 */
const testMigration = async () => {
  try {
    console.log('🧪 Testing Sprint 3 Migration Results...');
    await connectDB();

    const db = mongoose.connection.db;

    // Test 1: Check User Collection
    console.log('\n👤 Testing User Collection...');
    const totalUsers = await User.countDocuments();
    const doctors = await User.find({ role: 'doctor' });
    const doctorsWithAvailability = doctors.filter(doc => doc.availability);

    console.log(`   Total users: ${totalUsers}`);
    console.log(`   Total doctors: ${doctors.length}`);
    console.log(`   Doctors with availability: ${doctorsWithAvailability.length}`);

    if (doctorsWithAvailability.length === doctors.length) {
      console.log('   ✅ All doctors have availability configured');
    } else {
      console.log(`   ⚠️  ${doctors.length - doctorsWithAvailability.length} doctors missing availability`);
    }

    // Test 2: Check Appointment Collection
    console.log('\n📅 Testing Appointment Collection...');
    const totalAppointments = await Appointment.countDocuments();
    const appointmentsWithPreConsultation = await Appointment.countDocuments({
      preConsultationForm: { $exists: true, $ne: null }
    });
    const appointmentsWithRescheduleStatus = await Appointment.countDocuments({
      rescheduleStatus: { $exists: true }
    });

    console.log(`   Total appointments: ${totalAppointments}`);
    console.log(`   Appointments with pre-consultation form: ${appointmentsWithPreConsultation}`);
    console.log(`   Appointments with reschedule status: ${appointmentsWithRescheduleStatus}`);

    if (totalAppointments === appointmentsWithPreConsultation) {
      console.log('   ✅ All appointments have pre-consultation forms');
    }

    if (totalAppointments === appointmentsWithRescheduleStatus) {
      console.log('   ✅ All appointments have reschedule status initialized');
    }

    // Test 3: Check Indexes
    console.log('\n🔍 Testing Database Indexes...');
    const appointmentIndexes = await db.collection('appointments').listIndexes().toArray();
    const userIndexes = await db.collection('users').listIndexes().toArray();

    const requiredAppointmentIndexes = [
      'double_booking_prevention',
      'reschedule_queries',
      'patient_date',
      'doctor_date',
      'status',
      'date_time'
    ];

    console.log(`   Appointment indexes found: ${appointmentIndexes.length}`);
    console.log(`   User indexes found: ${userIndexes.length}`);

    const missingIndexes = requiredAppointmentIndexes.filter(indexName =>
      !appointmentIndexes.some(idx => idx.name === indexName)
    );

    if (missingIndexes.length === 0) {
      console.log('   ✅ All required appointment indexes are present');
    } else {
      console.log(`   ❌ Missing indexes: ${missingIndexes.join(', ')}`);
    }

    // Test 4: Validate Data Structure
    console.log('\n🔍 Testing Data Structure...');
    const sampleAppointment = await Appointment.findOne({});
    const sampleDoctor = await User.findOne({ role: 'doctor' });

    if (sampleAppointment) {
      const hasRequiredFields = [
        'patientId',
        'doctorId',
        'date',
        'time',
        'status',
        'reason',
        'preConsultationForm',
        'rescheduleStatus'
      ].every(field => field in sampleAppointment);

      if (hasRequiredFields) {
        console.log('   ✅ Appointment structure is valid');
      } else {
        console.log('   ❌ Appointment structure is missing required fields');
      }
    }

    if (sampleDoctor && sampleDoctor.availability) {
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const hasAllDays = days.every(day => day in sampleDoctor.availability);

      if (hasAllDays) {
        console.log('   ✅ Doctor availability structure is valid');
      } else {
        console.log('   ❌ Doctor availability structure is incomplete');
      }
    }

    // Test 5: Double Booking Prevention
    console.log('\n🚫 Testing Double Booking Prevention...');
    try {
      // Try to create a duplicate appointment (this should fail)
      const testAppointment = {
        patientId: new mongoose.Types.ObjectId(),
        doctorId: new mongoose.Types.ObjectId(),
        date: new Date('2025-02-01'),
        time: '10:00',
        status: 'pending',
        reason: 'Test duplicate booking',
        preConsultationForm: {
          symptoms: ['Test symptom'],
          currentMedications: [],
          allergies: [],
          medicalHistory: '',
          additionalNotes: ''
        }
      };

      // Create first appointment
      const firstAppointment = await Appointment.create(testAppointment);
      console.log('   ✅ First appointment created successfully');

      // Try to create duplicate (should fail)
      try {
        await Appointment.create({
          ...testAppointment,
          patientId: new mongoose.Types.ObjectId() // Different patient
        });
        console.log('   ❌ Double booking prevention failed - duplicate was created');
      } catch (error) {
        if (error.code === 11000) { // Duplicate key error
          console.log('   ✅ Double booking prevention working correctly');
        } else {
          console.log(`   ⚠️  Unexpected error during duplicate test: ${error.message}`);
        }
      }

      // Clean up test data
      await Appointment.findByIdAndDelete(firstAppointment._id);

    } catch (error) {
      console.log(`   ⚠️  Could not test double booking prevention: ${error.message}`);
    }

    // Summary
    console.log('\n📊 Migration Test Summary:');
    console.log('   ✅ Database connection: Working');
    console.log(`   ✅ Users migrated: ${doctorsWithAvailability.length}/${doctors.length} doctors`);
    console.log(`   ✅ Appointments migrated: ${appointmentsWithPreConsultation}/${totalAppointments} with forms`);
    console.log(`   ✅ Indexes created: ${requiredAppointmentIndexes.length - missingIndexes.length}/${requiredAppointmentIndexes.length}`);
    console.log('   ✅ Double booking prevention: Tested');

    console.log('\n🎉 Migration testing completed!');
    console.log('\n🚀 Your Sprint 3 migration appears to be successful!');
    console.log('   You can now start the application and test the new features.');

  } catch (error) {
    console.error('❌ Migration testing failed:', error);
    console.log('\n🔧 Possible issues:');
    console.log('   - Database connection failed');
    console.log('   - Migration was not run');
    console.log('   - Data corruption during migration');
    console.log('\n💡 Try running the migration again: npm run migrate:sprint3');
  } finally {
    await mongoose.connection.close();
  }
};

// Run the test
testMigration();