import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import User from './src/features/users/models/userModel.js';
import Appointment from './src/features/appointments/models/appointmentModel.js';
import MigrationHelper from './migration-helper.js';

// Load environment variables
dotenv.config();

/**
 * Sprint 3 Database Migration
 * Migrates database schema and data for appointment system enhancements
 */
const migrateSprint3 = async () => {
  const migrationHelper = new MigrationHelper();

  try {
    console.log('🚀 Starting Sprint 3 Database Migration...');
    await connectDB();

    // Step 1: Database connection validation
    await migrationHelper.executeStep(
      'Database Connection Check',
      async () => {
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log(`📋 Found ${collections.length} collections in database`);
      }
    );

    // Step 2: Backup critical collections
    await migrationHelper.executeStep(
      'Backup Collections',
      async () => {
        await migrationHelper.backupCollection('users');
        await migrationHelper.backupCollection('appointments');
      },
      async () => {
        // Rollback: Collections will be restored automatically by MigrationHelper
      }
    );

    // Step 3: Migrate User Collection - Ensure availability structure
    let usersUpdated = 0;
    await migrationHelper.executeStep(
      'Migrate User Collection',
      async () => {
        const users = await User.find({});
        usersUpdated = 0;

        for (const user of users) {
          let needsUpdate = false;

          // Ensure doctor availability structure
          if (user.role === 'doctor') {
            if (!user.availability) {
              user.availability = {
                monday: { start: '09:00', end: '17:00', available: true },
                tuesday: { start: '09:00', end: '17:00', available: true },
                wednesday: { start: '09:00', end: '17:00', available: true },
                thursday: { start: '09:00', end: '17:00', available: true },
                friday: { start: '09:00', end: '17:00', available: true },
                saturday: { start: '09:00', end: '13:00', available: false },
                sunday: { start: '09:00', end: '13:00', available: false }
              };
              needsUpdate = true;
              console.log(`📝 Added default availability for doctor: ${user.name}`);
            }
          }

          if (needsUpdate) {
            await user.save();
            usersUpdated++;
          }
        }

        console.log(`✅ User migration completed. Updated ${usersUpdated} users.`);
      },
      async () => {
        // Rollback: Restore users collection
        await migrationHelper.restoreCollection('users');
      }
    );

    // Step 4: Migrate Appointment Collection - Add new fields and validation
    let appointmentsUpdated = 0;
    await migrationHelper.executeStep(
      'Migrate Appointment Collection',
      async () => {
        const appointments = await Appointment.find({});
        appointmentsUpdated = 0;

        for (const appointment of appointments) {
          let needsUpdate = false;

          // Ensure preConsultationForm structure
          if (!appointment.preConsultationForm) {
            appointment.preConsultationForm = {
              symptoms: [],
              currentMedications: [],
              allergies: [],
              medicalHistory: '',
              additionalNotes: ''
            };
            needsUpdate = true;
            console.log(`📝 Added default pre-consultation form for appointment: ${appointment._id}`);
          }

          // Initialize reschedule fields if not present
          if (appointment.rescheduleStatus === undefined) {
            appointment.rescheduleStatus = 'none';
            needsUpdate = true;
          }

          if (needsUpdate) {
            await appointment.save();
            appointmentsUpdated++;
          }
        }

        console.log(`✅ Appointment migration completed. Updated ${appointmentsUpdated} appointments.`);
      },
      async () => {
        // Rollback: Restore appointments collection
        await migrationHelper.restoreCollection('appointments');
      }
    );

    // Step 5: Create Database Indexes
    await migrationHelper.executeStep(
      'Create Database Indexes',
      async () => {
        // Drop conflicting indexes first
        await migrationHelper.dropIndex('appointments', 'double_booking_prevention');

        // Create new indexes using helper
        await migrationHelper.createIndex(
          'appointments',
          { doctorId: 1, date: 1, time: 1, status: 1 },
          {
            unique: true,
            partialFilterExpression: {
              status: { $in: ['pending', 'confirmed'] }
            },
            name: 'double_booking_prevention'
          }
        );

        await migrationHelper.createIndex(
          'appointments',
          { rescheduleStatus: 1, rescheduleRequestedAt: -1 },
          { name: 'reschedule_queries' }
        );

        await migrationHelper.createIndex(
          'appointments',
          { patientId: 1, date: -1 },
          { name: 'patient_date' }
        );

        await migrationHelper.createIndex(
          'appointments',
          { doctorId: 1, date: -1 },
          { name: 'doctor_date' }
        );

        await migrationHelper.createIndex(
          'appointments',
          { status: 1 },
          { name: 'status' }
        );

        await migrationHelper.createIndex(
          'appointments',
          { date: 1, time: 1 },
          { name: 'date_time' }
        );
      },
      async () => {
        // Rollback: Drop created indexes (they will be recreated on next run)
        try {
          await migrationHelper.dropIndex('appointments', 'double_booking_prevention');
          await migrationHelper.dropIndex('appointments', 'reschedule_queries');
        } catch (error) {
          console.log('⚠️  Some indexes could not be dropped during rollback');
        }
      }
    );

    // Step 6: Validate Migration
    await migrationHelper.executeStep(
      'Validate Migration',
      async () => {
        // Check that all doctors have availability
        const doctorsWithoutAvailability = await User.countDocuments({
          role: 'doctor',
          availability: { $exists: false }
        });

        if (doctorsWithoutAvailability > 0) {
          console.log(`⚠️  Warning: ${doctorsWithoutAvailability} doctors still don't have availability set`);
        } else {
          console.log('✅ All doctors have availability configured');
        }

        // Check appointment counts
        const totalAppointments = await Appointment.countDocuments();
        const pendingAppointments = await Appointment.countDocuments({ status: 'pending' });
        const confirmedAppointments = await Appointment.countDocuments({ status: 'confirmed' });

        console.log(`📊 Migration Summary:`);
        console.log(`   - Total appointments: ${totalAppointments}`);
        console.log(`   - Pending appointments: ${pendingAppointments}`);
        console.log(`   - Confirmed appointments: ${confirmedAppointments}`);
        console.log(`   - Users updated: ${usersUpdated}`);
        console.log(`   - Appointments updated: ${appointmentsUpdated}`);

        // Validate collection structures
        await migrationHelper.validateCollection('users', ['name', 'email', 'role']);
        await migrationHelper.validateCollection('appointments', ['patientId', 'doctorId', 'date', 'time', 'status']);
      }
    );

    // Step 7: Migration Complete
    const summary = migrationHelper.getSummary();
    console.log('\n🎉 Sprint 3 Database Migration Completed Successfully!');
    console.log('\n📋 Migration Changes Applied:');
    console.log('   ✅ Enhanced appointment schema with pre-consultation form validation');
    console.log('   ✅ Added reschedule fields to appointment model');
    console.log('   ✅ Created double booking prevention index');
    console.log('   ✅ Added doctor availability structure');
    console.log('   ✅ Created performance optimization indexes');
    console.log('\n📊 Migration Statistics:');
    console.log(`   - Steps executed: ${summary.stepsExecuted}`);
    console.log(`   - Collections backed up: ${summary.backedUpCollections.join(', ')}`);
    console.log('\n🚀 Your database is now ready for Sprint 3 features!');
    console.log('\n💡 Next Steps:');
    console.log('   1. Start the application: npm run dev');
    console.log('   2. Test the new appointment booking features');
    console.log('   3. Verify doctor availability management works');
    console.log('   4. Test admin appointment overview');

  } catch (error) {
    console.error('❌ Migration failed:', error);

    // Attempt rollback
    try {
      console.log('\n🔄 Attempting to rollback migration...');
      await migrationHelper.rollbackAll();
      console.log('✅ Migration rolled back successfully');
    } catch (rollbackError) {
      console.error('❌ Rollback also failed:', rollbackError.message);
      console.log('\n🚨 Manual intervention may be required!');
      console.log('   - Check MongoDB connection');
      console.log('   - Review database state manually');
      console.log('   - Consider running: npm run reset');
    }

    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure MongoDB is running');
    console.log('   2. Check your .env file has correct DATABASE_URI');
    console.log('   3. Run: npm run reset (to reset and seed fresh data)');
    console.log('   4. Or run this migration again after fixing the issue');

    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

// Run migration
migrateSprint3();