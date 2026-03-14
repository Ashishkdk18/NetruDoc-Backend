import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './src/config/database.js';
import MigrationHelper from './migration-helper.js';
import User from './src/features/users/models/userModel.js';
import { defaultAvailability } from './src/features/users/utils/defaultAvailability.js';

// Load environment variables
dotenv.config();

const migrateDoctorAvailability = async () => {
  const migrationHelper = new MigrationHelper();

  try {
    console.log('🚀 Starting Doctor Availability Migration...');
    await connectDB();

    // Step 1: Backup users collection
    await migrationHelper.executeStep(
      'Backup Users Collection',
      async () => {
        await migrationHelper.backupCollection('users');
      }
    );

    // Step 2: Overwrite availability for all doctors
    let updatedCount = 0;
    await migrationHelper.executeStep(
      'Overwrite Doctor Availability',
      async () => {
        const result = await User.updateMany(
          { role: 'doctor' },
          { $set: { availability: defaultAvailability } }
        );
        updatedCount = result.modifiedCount || result.nModified || 0;
        console.log(`✅ Updated availability for ${updatedCount} doctors.`);
      }
    );

    // Step 3: Validate doctors have availability
    await migrationHelper.executeStep(
      'Validate Doctor Availability',
      async () => {
        const doctorsWithoutAvailability = await User.countDocuments({
          role: 'doctor',
          availability: { $exists: false }
        });

        if (doctorsWithoutAvailability > 0) {
          console.log(`⚠️  Warning: ${doctorsWithoutAvailability} doctors still don't have availability set`);
        } else {
          console.log('✅ All doctors have availability configured');
        }
      }
    );

    const summary = migrationHelper.getSummary();
    console.log('\n🎉 Doctor Availability Migration Completed Successfully!');
    console.log('\n📋 Migration Statistics:');
    console.log(`   - Steps executed: ${summary.stepsExecuted}`);
    console.log(`   - Collections backed up: ${summary.backedUpCollections.join(', ')}`);
    console.log(`   - Doctors updated: ${summary.steps.includes('Overwrite Doctor Availability') ? 'see logs above' : 'n/a'}`);
  } catch (error) {
    console.error('❌ Doctor availability migration failed:', error);

    try {
      await migrationHelper.rollbackAll();
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
    }
  } finally {
    await mongoose.connection.close();
  }
};

migrateDoctorAvailability();

