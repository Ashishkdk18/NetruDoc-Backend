# Sprint 3 Database Migration Guide

## Overview

This migration updates the NetruDoc database to support the new appointment booking system features implemented in Sprint 3. The migration includes schema enhancements, data transformations, and performance optimizations.

## What's Changed

### Appointment Collection
- **Pre-consultation Form**: Added structured validation for symptoms, medications, allergies, medical history, and additional notes
- **Reschedule System**: Added fields for reschedule requests, approvals, and tracking
- **Validation**: Enhanced pre-save validation to ensure data integrity
- **Indexes**: Added compound index for double booking prevention

### User Collection
- **Doctor Availability**: Enhanced availability structure for all doctors
- **Default Schedules**: Added default working hours for new doctors

### Performance Improvements
- **Double Booking Prevention**: Unique compound index prevents concurrent bookings
- **Query Optimization**: Added indexes for common query patterns
- **Reschedule Queries**: Optimized indexes for reschedule management

## Migration Steps

### 1. Prerequisites
- MongoDB must be running
- Database connection configured in `.env`
- Node.js and npm installed

### 2. Run Migration

```bash
# Navigate to backend directory
cd NetruDoc/backend

# Run the migration
npm run migrate:sprint3
```

### 3. Alternative Commands

```bash
# Direct node execution
node migrate-sprint3.js

# Reset database and seed fresh data (if migration fails)
npm run reset
```

## What the Migration Does

### Step 1: Database Connection Check
- Validates MongoDB connection
- Counts existing collections

### Step 2: Data Backup
- Creates backups of `users` and `appointments` collections
- Enables automatic rollback on failure

### Step 3: User Collection Migration
- Ensures all doctors have availability schedules
- Adds default working hours for doctors without availability
- Updates existing doctor records

### Step 4: Appointment Collection Migration
- Adds missing pre-consultation form structures
- Initializes reschedule status fields
- Validates existing appointment data

### Step 5: Index Creation
- Creates double booking prevention index
- Adds performance optimization indexes
- Safely handles existing indexes

### Step 6: Validation
- Verifies migration success
- Checks data integrity
- Reports migration statistics

## Rollback Capabilities

The migration includes automatic rollback functionality:

- **Automatic Rollback**: On any step failure, previous steps are automatically rolled back
- **Data Restoration**: Backed up collections are restored to their original state
- **Index Cleanup**: Created indexes are dropped during rollback

## Troubleshooting

### Migration Fails
1. Check MongoDB connection: `mongosh` or MongoDB Compass
2. Verify `.env` file has correct `DATABASE_URI`
3. Ensure no other processes are using the database

### Rollback Issues
1. Run `npm run reset` to reset database completely
2. Check MongoDB logs for connection issues
3. Manually verify database state

### Data Validation Warnings
- Warnings about missing availability are normal for existing doctors
- These doctors can set their availability through the admin panel

## Post-Migration Testing

After successful migration:

1. **Start the application**:
   ```bash
   npm run dev
   ```

2. **Test key features**:
   - Patient appointment booking
   - Doctor availability management
   - Admin appointment overview
   - Reschedule request workflow

3. **Verify data integrity**:
   - Check existing appointments display correctly
   - Verify doctor profiles show availability
   - Test booking conflict prevention

## Migration Safety

- **Non-destructive**: Existing data is preserved
- **Transactional**: Uses safe update operations
- **Recoverable**: Full rollback capability
- **Validated**: Comprehensive post-migration checks

## Support

If you encounter issues:

1. Check the console output for detailed error messages
2. Review MongoDB logs for connection issues
3. Run `npm run reset` for a clean state
4. Contact the development team for assistance

---

**Migration Version**: Sprint 3
**Date**: January 2025
**Compatible With**: NetruDoc v1.0.0+