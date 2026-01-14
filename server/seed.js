const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const User = require('./models/User');
const Period = require('./models/Period');
const Event = require('./models/Event');
const SubscriptionPlan = require('./models/SubscriptionPlan');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await User.deleteMany({});
        await Period.deleteMany({});
        await Event.deleteMany({});
        await SubscriptionPlan.deleteMany({});
        console.log('Cleared existing data');

        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const admin = await User.create({
            username: 'admin',
            email: 'admin@timeline.com',
            password_hash: hashedPassword,
            role: 'admin'
        });
        console.log('Created admin user: admin / admin123');

        // Create periods
        const periods = await Period.insertMany([
            {
                name: 'Ancient India',
                description: 'From prehistoric times to around 500 CE',
                start_year: -3000,
                end_year: 500,
                requires_subscription: false
            },
            {
                name: 'Medieval India',
                description: 'From 500 CE to 1500 CE',
                start_year: 500,
                end_year: 1500,
                requires_subscription: true
            },
            {
                name: 'Modern India',
                description: 'From 1500 CE to 1947 CE',
                start_year: 1500,
                end_year: 1947,
                requires_subscription: true
            },
            {
                name: 'Current Affairs',
                description: 'Post-independence India',
                start_year: 1947,
                end_year: 9999,
                requires_subscription: true
            }
        ]);
        console.log('Created periods:', periods.length);

        // Create sample events
        const events = await Event.insertMany([
            {
                title: 'Indus Valley Civilization',
                year: -2600,
                description: 'One of the world\'s earliest urban civilizations flourished in the Indus Valley',
                summary: 'Ancient urban civilization with advanced city planning and drainage systems',
                period_id: periods[0]._id,
                tags: ['civilization', 'ancient', 'urban planning'],
                latitude: 27.17,
                longitude: 68.83
            },
            {
                title: 'Vedic Period Begins',
                year: -1500,
                description: 'The Vedic period marks the composition of the Vedas, ancient Hindu scriptures',
                summary: 'Beginning of Vedic civilization and composition of sacred Hindu texts',
                period_id: periods[0]._id,
                tags: ['religion', 'literature', 'culture'],
                latitude: 28.65,
                longitude: 77.23
            },
            {
                title: 'Buddha\'s Enlightenment',
                year: -528,
                description: 'Gautama Buddha attained enlightenment under the Bodhi tree in Bodh Gaya',
                summary: 'Buddha achieved enlightenment, founding Buddhism',
                period_id: periods[0]._id,
                tags: ['religion', 'philosophy', 'Buddhism'],
                latitude: 24.69,
                longitude: 84.99
            },
            {
                title: 'Delhi Sultanate Established',
                year: 1206,
                description: 'Qutb ud-Din Aibak established the Delhi Sultanate',
                summary: 'Foundation of the Delhi Sultanate marking Islamic rule in North India',
                period_id: periods[1]._id,
                tags: ['political', 'medieval', 'sultanate'],
                latitude: 28.61,
                longitude: 77.21
            },
            {
                title: 'Mughal Empire Founded',
                year: 1526,
                description: 'Babur defeated Ibrahim Lodi in the First Battle of Panipat, establishing the Mughal Empire',
                summary: 'Babur established the Mughal Empire after victory at Panipat',
                period_id: periods[2]._id,
                tags: ['political', 'empire', 'warfare'],
                latitude: 29.39,
                longitude: 76.97
            },
            {
                title: 'Battle of Plassey',
                year: 1757,
                description: 'British East India Company defeated the Nawab of Bengal, marking the beginning of British rule',
                summary: 'British victory leading to colonial dominance in India',
                period_id: periods[2]._id,
                tags: ['colonial', 'warfare', 'political'],
                latitude: 23.79,
                longitude: 88.25
            },
            {
                title: 'Indian Independence',
                year: 1947,
                description: 'India gained independence from British rule on August 15, 1947',
                summary: 'India achieved freedom from British colonial rule',
                period_id: periods[3]._id,
                tags: ['independence', 'political', 'freedom'],
                latitude: 28.61,
                longitude: 77.21
            },
            {
                title: 'Indian Republic Day',
                year: 1950,
                description: 'India became a republic with the adoption of its constitution on January 26, 1950',
                summary: 'India adopted its constitution and became a sovereign republic',
                period_id: periods[3]._id,
                tags: ['political', 'constitution', 'republic'],
                latitude: 28.61,
                longitude: 77.21
            }
        ]);
        console.log('Created sample events:', events.length);

        // Create subscription plans
        const plans = await SubscriptionPlan.insertMany([
            {
                name: 'monthly',
                description: 'Monthly subscription with full access',
                price: 99,
                duration_days: 30
            },
            {
                name: 'yearly',
                description: 'Annual subscription with 16% discount',
                price: 999,
                duration_days: 365
            }
        ]);
        console.log('Created subscription plans:', plans.length);

        console.log('\n✅ Database seeded successfully!');
        console.log('\n📝 Admin Credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('\n🌐 Access the admin panel at: http://localhost:3000/admin.html');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
