const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

const subscriptionPlanSchema = new mongoose.Schema({
    name: String,
    description: String,
    plan_type: String,
    price: Number,
    duration_days: Number,
    features: [String],
    is_recommended: Boolean,
    is_active: Boolean,
    created_at: Date,
    updated_at: Date
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

async function fixPlans() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');
        
        // Get all plans
        const plans = await SubscriptionPlan.find({});
        console.log(`\nFound ${plans.length} subscription plans:\n`);
        
        for (const plan of plans) {
            console.log(`Plan: ${plan.name}`);
            console.log(`  ID: ${plan._id}`);
            console.log(`  plan_type: ${plan.plan_type || 'MISSING ❌'}`);
            console.log(`  price: ${plan.price}`);
            console.log(`  duration_days: ${plan.duration_days}`);
            
            // Fix missing plan_type
            if (!plan.plan_type) {
                // Infer from name or duration
                let inferredType = null;
                
                if (plan.name.toLowerCase().includes('month')) {
                    inferredType = 'monthly';
                } else if (plan.name.toLowerCase().includes('year')) {
                    inferredType = 'yearly';
                } else if (plan.duration_days === 30 || plan.duration_days === 31) {
                    inferredType = 'monthly';
                } else if (plan.duration_days === 365 || plan.duration_days === 366) {
                    inferredType = 'yearly';
                } else if (plan.duration_days === 90) {
                    inferredType = 'quarterly';
                } else if (plan.duration_days > 3650) {
                    inferredType = 'lifetime';
                }
                
                if (inferredType) {
                    console.log(`  → Fixing: Setting plan_type to "${inferredType}"`);
                    plan.plan_type = inferredType;
                    await plan.save();
                    console.log(`  ✓ Updated successfully\n`);
                } else {
                    console.log(`  ⚠ Could not infer plan_type - please update manually\n`);
                }
            } else {
                console.log(`  ✓ plan_type is set correctly\n`);
            }
        }
        
        console.log('\n=== Summary ===');
        const updatedPlans = await SubscriptionPlan.find({});
        console.log('\nCurrent plans:');
        updatedPlans.forEach(plan => {
            console.log(`  - ${plan.name}: plan_type="${plan.plan_type}", price=${plan.price}, duration=${plan.duration_days} days`);
        });
        
        await mongoose.disconnect();
        console.log('\nDone!');
        
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixPlans();
