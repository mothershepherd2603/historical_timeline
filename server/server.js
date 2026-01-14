const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const Razorpay = require('razorpay');
const crypto = require('crypto');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Period = require('./models/Period');
const Event = require('./models/Event');
const Media = require('./models/Media');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const UserSubscription = require('./models/UserSubscription');

const app = express();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',') 
    : ['http://localhost:3000', 'http://127.0.0.1:3000', '*'];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf('*') !== -1 || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(bodyParser.json());

// Request logging middleware (for debugging)
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

app.use(express.static(path.join(__dirname, '../client')));

// JWT Secret (should be in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// Razorpay configuration
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_key_secret'
});

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Admin check middleware
function checkAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
});

// User registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log('Registration attempt:', { username, email });
        
        // Validate input
        if (!username || !email || !password) {
            console.log('Registration failed: Missing fields');
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            console.log('Registration failed: User already exists');
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        
        // Hash password
        const password_hash = await bcrypt.hash(password, 10);
        
        // Create user
        const newUser = await User.create({
            username,
            email,
            password_hash
        });
        
        console.log('User registered successfully:', newUser.username);
        
        res.status(201).json({
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log('Login attempt for username:', username);
        
        // Find user
        const user = await User.findOne({ username });
        if (!user) {
            console.log('User not found:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        console.log('User found, checking password...');
        // Check password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            console.log('Invalid password for user:', username);
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        console.log('Login successful for user:', username);
        // Create JWT
        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get all periods
app.get('/api/periods', async (req, res) => {
    try {
        const periods = await Period.find().sort({ start_year: 1 });
        res.json(periods);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get events
app.get('/api/events', async (req, res) => {
    try {
        const { period_id, start_year, end_year, date } = req.query;
        
        let query = {};
        
        if (period_id) {
            query.period_id = period_id;
            
            // Check if period requires subscription
            const period = await Period.findById(period_id);
            if (period && period.requires_subscription) {
                const token = req.headers['authorization']?.split(' ')[1];
                if (!token) {
                    return res.status(402).json({ error: 'Subscription required' });
                }
                
                try {
                    const decoded = jwt.verify(token, JWT_SECRET);
                    
                    // Skip subscription check for admin users
                    if (decoded.role !== 'admin') {
                        const subscription = await UserSubscription.findOne({
                            user_id: decoded.id,
                            end_date: { $gt: new Date() },
                            is_active: true
                        });
                        
                        if (!subscription) {
                            return res.status(402).json({ error: 'Subscription required' });
                        }
                    }
                } catch (err) {
                    return res.status(402).json({ error: 'Subscription required' });
                }
            }
        }
        
        if (start_year) query.year = { ...query.year, $gte: parseInt(start_year) };
        if (end_year) query.year = { ...query.year, $lte: parseInt(end_year) };
        
        // Add date filter for Current Affairs (exact date match)
        if (date) {
            const selectedDate = new Date(date);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            query.date = {
                $gte: selectedDate,
                $lt: nextDay
            };
        }
        
        // Add limit parameter support to prevent overwhelming the client
        const limit = req.query.limit ? parseInt(req.query.limit) : 0; // 0 means no limit
        
        const events = await Event.find(query)
            .sort({ date: -1, year: 1 })
            .limit(limit);
        
        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get event by ID
app.get('/api/events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        
        // Validate ObjectId
        if (!eventId || eventId === 'undefined' || !mongoose.Types.ObjectId.isValid(eventId)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }
        
        const event = await Event.findById(eventId).populate('period_id');
        
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        // Check if period requires subscription
        if (event.period_id && event.period_id.requires_subscription) {
            const token = req.headers['authorization']?.split(' ')[1];
            if (!token) {
                return res.status(402).json({ error: 'Subscription required' });
            }
            
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                
                // Skip subscription check for admin users
                if (decoded.role !== 'admin') {
                    const subscription = await UserSubscription.findOne({
                        user_id: decoded.id,
                        end_date: { $gt: new Date() },
                        is_active: true
                    });
                    
                    if (!subscription) {
                        return res.status(402).json({ error: 'Subscription required' });
                    }
                }
            } catch (err) {
                return res.status(402).json({ error: 'Subscription required' });
            }
        }
        
        res.json(event);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create Razorpay order for subscription
app.post('/api/subscribe/create-order', authenticateToken, async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.user.id;
        
        // Validate plan
        if (!plan || (plan !== 'monthly' && plan !== 'yearly')) {
            return res.status(400).json({ error: 'Invalid subscription plan' });
        }
        
        // Get plan details
        const planDetails = await SubscriptionPlan.findOne({ name: plan });
        if (!planDetails) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        
        // Check if user already has an active subscription
        const existingSubscription = await UserSubscription.findOne({
            user_id: userId,
            end_date: { $gt: new Date() },
            is_active: true
        });
        
        if (existingSubscription) {
            return res.status(400).json({ error: 'You already have an active subscription' });
        }
        
        // Create Razorpay order
        const options = {
            amount: Math.round(planDetails.price * 100), // amount in paise
            currency: 'INR',
            receipt: `sub_${Date.now().toString().slice(-10)}`,
            notes: {
                user_id: userId.toString(),
                plan_id: planDetails._id.toString(),
                plan_name: planDetails.name
            }
        };
        
        const order = await razorpay.orders.create(options);
        
        res.status(201).json({
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            plan: planDetails,
            razorpay_key: process.env.RAZORPAY_KEY_ID || 'rzp_test_your_key_id'
        });
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ error: 'Server error: ' + err.message });
    }
});

// Verify Razorpay payment and create subscription
app.post('/api/subscribe/verify-payment', authenticateToken, async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;
        const userId = req.user.id;
        
        // Verify signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_key_secret')
            .update(body.toString())
            .digest('hex');
        
        if (expectedSignature !== razorpay_signature) {
            return res.status(400).json({ error: 'Invalid payment signature' });
        }
        
        // Get plan details
        const planDetails = await SubscriptionPlan.findOne({ name: plan });
        if (!planDetails) {
            return res.status(404).json({ error: 'Plan not found' });
        }
        
        // Calculate end date
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + planDetails.duration_days);
        
        // Create subscription
        const newSubscription = await UserSubscription.create({
            user_id: userId,
            plan_id: planDetails._id,
            start_date: startDate,
            end_date: endDate,
            is_active: true,
            payment_method: 'razorpay',
            payment_amount: planDetails.price,
            payment_id: razorpay_payment_id,
            order_id: razorpay_order_id
        });
        
        res.status(201).json({
            message: 'Subscription activated successfully',
            subscription: newSubscription,
            plan: planDetails
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Check subscription status
app.get('/api/subscription/status', authenticateToken, async (req, res) => {
    try {
        const subscription = await UserSubscription.findOne({
            user_id: req.user.id,
            end_date: { $gt: new Date() },
            is_active: true
        }).populate('plan_id');
        
        if (!subscription) {
            return res.json({ isActive: false });
        }
        
        res.json({
            isActive: true,
            subscription: {
                ...subscription.toObject(),
                plan_name: subscription.plan_id.name,
                price: subscription.plan_id.price,
                duration_days: subscription.plan_id.duration_days
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Cancel subscription
app.post('/api/subscription/cancel', authenticateToken, async (req, res) => {
    try {
        const subscription = await UserSubscription.findOneAndUpdate(
            {
                user_id: req.user.id,
                end_date: { $gt: new Date() },
                is_active: true
            },
            { is_active: false },
            { new: true }
        );
        
        if (!subscription) {
            return res.status(404).json({ error: 'No active subscription found' });
        }
        
        res.json({
            message: 'Subscription cancelled successfully',
            subscription
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin routes
app.use('/api/admin', authenticateToken, checkAdmin);

// Period management routes
app.get('/api/admin/periods', async (req, res) => {
    try {
        const periods = await Period.find().sort({ start_year: 1 });
        res.json(periods);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/periods', async (req, res) => {
    try {
        const { name, start_year, end_year, requires_subscription, description } = req.body;
        
        if (!name || start_year === undefined || end_year === undefined) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        
        const newPeriod = await Period.create({
            name,
            description,
            start_year,
            end_year,
            requires_subscription: requires_subscription || false
        });
        
        res.status(201).json(newPeriod);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/admin/periods/:id', async (req, res) => {
    try {
        const { name, start_year, end_year, requires_subscription, description } = req.body;
        
        if (!name || start_year === undefined || end_year === undefined) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        
        const updatedPeriod = await Period.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                start_year,
                end_year,
                requires_subscription: requires_subscription || false
            },
            { new: true }
        );
        
        if (!updatedPeriod) {
            return res.status(404).json({ error: 'Period not found' });
        }
        
        res.json(updatedPeriod);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/admin/periods/:id', async (req, res) => {
    try {
        // Check if period has events
        const eventCount = await Event.countDocuments({ period_id: req.params.id });
        if (eventCount > 0) {
            return res.status(400).json({
                error: 'Cannot delete period with existing events',
                eventCount
            });
        }
        
        const result = await Period.findByIdAndDelete(req.params.id);
        
        if (!result) {
            return res.status(404).json({ error: 'Period not found' });
        }
        
        res.json({ message: 'Period deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Event management routes
app.post('/api/admin/events', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { title, description, summary, year, period_id, latitude, longitude, tags, media_ids } = req.body;
        
        console.log('Creating event with data:', { title, summary, year, period_id });
        
        if (!title || !summary || !year || !period_id) {
            console.log('Validation failed:', { title: !!title, summary: !!summary, year: !!year, period_id: !!period_id });
            return res.status(400).json({ error: 'Required fields missing: title, summary, year, and period_id are required' });
        }
        
        const newEvent = await Event.create({
            title,
            description,
            summary,
            year,
            period_id,
            latitude,
            longitude,
            tags: tags || [],
            media_ids: media_ids || [],
            created_by: req.user.id
        });
        
        res.status(201).json(newEvent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/admin/events/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { title, description, summary, year, period_id, latitude, longitude, tags, media_ids } = req.body;
        
        if (!title || !summary || !year || !period_id) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            {
                title,
                description,
                summary,
                year,
                period_id,
                latitude,
                longitude,
                tags: tags || [],
                media_ids: media_ids || [],
                updated_at: Date.now()
            },
            { new: true }
        );
        
        if (!updatedEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json(updatedEvent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/admin/events/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const result = await Event.findByIdAndDelete(req.params.id);
        
        if (!result) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json({ message: 'Event deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Media management routes
app.get('/api/admin/media', async (req, res) => {
    try {
        const media = await Media.find().sort({ upload_date: -1 });
        res.json(media);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/admin/media', async (req, res) => {
    try {
        const { type, url, caption, description } = req.body;
        
        if (!type || !url || !caption) {
            return res.status(400).json({ error: 'Required fields missing' });
        }
        
        const newMedia = await Media.create({
            type,
            url,
            caption,
            description,
            uploader_id: req.user.id
        });
        
        res.status(201).json(newMedia);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/admin/media/:id', async (req, res) => {
    try {
        // Check if media is used in any events
        const eventCount = await Event.countDocuments({ media_ids: req.params.id });
        if (eventCount > 0) {
            return res.status(400).json({
                error: 'Media is used in events and cannot be deleted',
                eventCount
            });
        }
        
        const result = await Media.findByIdAndDelete(req.params.id);
        
        if (!result) {
            return res.status(404).json({ error: 'Media not found' });
        }
        
        res.json({ message: 'Media deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// User management routes
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find()
            .select('-password_hash')
            .sort({ created_at: -1 });
        res.json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Subscription management routes
app.get('/api/admin/subscriptions/stats', async (req, res) => {
    try {
        const totalSubscribers = await UserSubscription.countDocuments({
            end_date: { $gt: new Date() },
            is_active: true
        });
        
        const subscriptions = await UserSubscription.find({
            end_date: { $gt: new Date() },
            is_active: true
        }).populate('plan_id');
        
        const monthlyRevenue = subscriptions.reduce((total, sub) => {
            if (sub.plan_id) {
                const monthlyRate = sub.plan_id.duration_days === 365
                    ? sub.plan_id.price / 12
                    : sub.plan_id.price;
                return total + monthlyRate;
            }
            return total;
        }, 0);
        
        res.json({
            total_subscribers: totalSubscribers,
            monthly_revenue: monthlyRevenue
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/api/admin/subscriptions', async (req, res) => {
    try {
        const subscriptions = await UserSubscription.find({
            end_date: { $gt: new Date() },
            is_active: true
        })
            .populate('user_id', 'username')
            .populate('plan_id', 'name')
            .sort({ end_date: -1 });
        
        const formattedSubscriptions = subscriptions.map(sub => ({
            ...sub.toObject(),
            username: sub.user_id?.username || 'Unknown',
            plan_name: sub.plan_id?.name || 'Unknown'
        }));
        
        res.json(formattedSubscriptions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// 404 handler for undefined routes
app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log('404 - Route not found:', req.method, req.originalUrl);
        res.status(404).json({ 
            error: 'API endpoint not found',
            path: req.originalUrl,
            method: req.method
        });
    } else {
        next();
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
    console.log(`MongoDB URI: ${MONGODB_URI}`);
});
