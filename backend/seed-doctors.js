import dotenv from 'dotenv';
import connectDB from './src/config/database.js';
import { seedDatabase } from './src/seed/seedDatabase.js';

// Load environment variables
dotenv.config();

const seedDoctors = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();

    console.log('👨‍⚕️ Seeding doctors...');
    await seedDatabase();

    console.log('✅ Doctors seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
    process.exit(1);
  }
};

seedDoctors();
