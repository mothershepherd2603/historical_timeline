const mongoose = require('mongoose');
require('dotenv').config();
const Infrastructure = require('./models/Infrastructure');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

/**
 * Migration script to add built_year and demolish_year fields to existing infrastructure
 * 
 * This script will:
 * 1. Find all infrastructure records without built_year
 * 2. Add default built_year (1947) and demolish_year (null)
 * 3. List infrastructure that needs manual year verification
 */
async function migrateInfrastructureYears() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find records without built_year
    const recordsWithoutYear = await Infrastructure.find({ 
      built_year: { $exists: false } 
    });
    
    console.log(`\nFound ${recordsWithoutYear.length} infrastructure records without built_year`);
    
    if (recordsWithoutYear.length === 0) {
      console.log('✓ All infrastructure records already have year fields');
      await mongoose.connection.close();
      return;
    }
    
    // Update records with default values
    const result = await Infrastructure.updateMany(
      { built_year: { $exists: false } },
      {
        $set: {
          built_year: 1947, // Default year - India's independence
          demolish_year: null, // Assume still active
        },
      }
    );
    
    console.log(`\n✓ Updated ${result.modifiedCount} infrastructure records with default years`);
    
    // List all infrastructure that needs manual year verification
    const needsReview = await Infrastructure.find({ built_year: 1947 });
    
    if (needsReview.length > 0) {
      console.log('\n⚠ Infrastructure items that need built_year verification:');
      console.log('='.repeat(80));
      needsReview.forEach((item, index) => {
        console.log(`${index + 1}. ${item.name} (${item.type}) - ${item.state || 'N/A'}`);
        console.log(`   ID: ${item._id}`);
        console.log(`   Current: built_year=${item.built_year}, demolish_year=${item.demolish_year}`);
        console.log('');
      });
      console.log('='.repeat(80));
      console.log('\nTo update specific infrastructure:');
      console.log('Use the admin panel or run commands like:');
      console.log('```');
      console.log('await Infrastructure.updateOne(');
      console.log('  { name: "Infrastructure Name" },');
      console.log('  { built_year: ACTUAL_YEAR, demolish_year: null }');
      console.log(');');
      console.log('```');
    }
    
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

// Run the migration
migrateInfrastructureYears();
