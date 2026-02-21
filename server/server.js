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
    
    console.log('Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('Token extracted:', token ? 'Yes' : 'No');
    
    if (!token) {
        console.log('401 - No token provided');
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    jwt.verify(token, JWT_SECRET, async (err, user) => {
        if (err) {
            console.log('403 - Token verification failed:', err.message);
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        
        // Check if this token is the current active token for the user
        try {
            const dbUser = await User.findById(user.id);
            if (!dbUser) {
                console.log('401 - User not found in DB:', user.id);
                return res.status(401).json({ error: 'User not found' });
            }
            
            if (dbUser.current_token !== token) {
                console.log('401 - Token mismatch. DB token and provided token differ.');
                console.log('User:', dbUser.username);
                return res.status(401).json({ error: 'Session expired. Please login again.' });
            }
            
            console.log('Authentication successful for user:', dbUser.username);
            req.user = user;
            next();
        } catch (error) {
            console.log('500 - Auth error:', error);
            return res.status(500).json({ error: 'Authentication error' });
        }
    });
}

// Admin check middleware
function checkAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// Helper function to convert S3 URLs to proxy URLs (bypass CORS issues)
function convertToProxyUrl(s3Url, req) {
    if (!s3Url) return s3Url;
    
    // Only convert S3 URLs
    if (s3Url.includes('s3.') && s3Url.includes('amazonaws.com')) {
        // Get the server's base URL
        const protocol = req.protocol || 'https';
        const host = req.get('host') || 'historical-timeline-a223.onrender.com';
        const baseUrl = `${protocol}://${host}`;
        
        // Create proxy URL
        return `${baseUrl}/api/media/proxy?url=${encodeURIComponent(s3Url)}`;
    }
    
    return s3Url;
}

// Helper function to convert media objects to use proxy URLs
function convertMediaToProxy(media, req) {
    if (!media) return media;
    
    if (Array.isArray(media)) {
        return media.map(m => convertMediaToProxy(m, req));
    }
    
    const mediaObj = media.toObject ? media.toObject() : media;
    if (mediaObj.url) {
        mediaObj.url = convertToProxyUrl(mediaObj.url, req);
    }
    
    return mediaObj;
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
        
        // Store the token in database to prevent multiple logins
        user.current_token = token;
        await user.save();
        
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

// User logout
app.post('/api/logout', authenticateToken, async (req, res) => {
    try {
        console.log('Logout request for user:', req.user.username);
        
        const user = await User.findById(req.user.id);
        if (user) {
            user.current_token = null;
            await user.save();
        }
        
        res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user profile
app.get('/api/profile', authenticateToken, async (req, res) => {
    try {
        console.log('GET /api/profile - User ID:', req.user.id);
        
        const user = await User.findById(req.user.id).select('-password_hash');
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Construct profile response
        const profile = {
            username: user.username,
            email: user.email,
            full_name: user.full_name || '',
            mobile: user.mobile || '',
            user_type: user.user_type || '',
            date_of_birth: user.date_of_birth || '',
            gender: user.gender || '',
            address: {
                street: user.address?.street || '',
                city: user.address?.city || '',
                state: user.address?.state || '',
                pincode: user.address?.pincode || '',
                country: user.address?.country || 'India'
            }
        };
        
        // Add user type specific details
        if (user.user_type === 'student') {
            profile.student_details = {
                school: user.student_details?.school || '',
                grade: user.student_details?.grade || '',
                stream: user.student_details?.stream || '',
                board: user.student_details?.board || ''
            };
        } else if (user.user_type === 'teacher') {
            profile.teacher_details = {
                institution: user.teacher_details?.institution || '',
                subject: user.teacher_details?.subject || '',
                experience: user.teacher_details?.experience || '',
                qualification: user.teacher_details?.qualification || ''
            };
        } else if (user.user_type === 'professional') {
            profile.professional_details = {
                company: user.professional_details?.company || '',
                designation: user.professional_details?.designation || '',
                industry: user.professional_details?.industry || '',
                experience: user.professional_details?.experience || ''
            };
        }
        
        res.json(profile);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
app.put('/api/profile/update', authenticateToken, async (req, res) => {
    try {
        console.log('PUT /api/profile/update - User ID:', req.user.id);
        
        const {
            email,
            full_name,
            mobile,
            user_type,
            date_of_birth,
            gender,
            address,
            student_details,
            teacher_details,
            professional_details
        } = req.body;
        
        // Find the user
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Validate email format if provided
        if (email && email !== user.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }
            
            // Check if email is already taken
            const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }
            user.email = email;
        }
        
        // Validate mobile format if provided
        if (mobile) {
            const mobileRegex = /^\+?[0-9]{10,15}$/;
            const cleanMobile = mobile.replace(/\s+/g, '');
            if (!mobileRegex.test(cleanMobile)) {
                return res.status(400).json({ error: 'Invalid mobile number format' });
            }
            user.mobile = mobile;
        }
        
        // Validate gender if provided
        if (gender) {
            const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
            if (!validGenders.includes(gender)) {
                return res.status(400).json({ error: 'Invalid gender value' });
            }
            user.gender = gender;
        }
        
        // Validate user type if provided
        if (user_type) {
            const validUserTypes = ['student', 'teacher', 'professional'];
            if (!validUserTypes.includes(user_type)) {
                return res.status(400).json({ error: 'Invalid user type' });
            }
            user.user_type = user_type;
        }
        
        // Update basic fields
        if (full_name !== undefined) user.full_name = full_name;
        if (date_of_birth !== undefined) user.date_of_birth = date_of_birth;
        
        // Update address
        if (address) {
            if (!user.address) user.address = {};
            if (address.street !== undefined) user.address.street = address.street;
            if (address.city !== undefined) user.address.city = address.city;
            if (address.state !== undefined) user.address.state = address.state;
            if (address.pincode !== undefined) {
                // Validate pincode format (6 digits for India)
                if (address.pincode && !/^\d{6}$/.test(address.pincode)) {
                    return res.status(400).json({ error: 'Invalid PIN code format (must be 6 digits)' });
                }
                user.address.pincode = address.pincode;
            }
            if (address.country !== undefined) user.address.country = address.country;
        }
        
        // Update user type specific details based on user_type
        if (user_type === 'student' && student_details) {
            if (!user.student_details) user.student_details = {};
            if (student_details.school !== undefined) user.student_details.school = student_details.school;
            if (student_details.grade !== undefined) user.student_details.grade = student_details.grade;
            if (student_details.stream !== undefined) user.student_details.stream = student_details.stream;
            if (student_details.board !== undefined) user.student_details.board = student_details.board;
            
            // Clear other type details
            user.teacher_details = undefined;
            user.professional_details = undefined;
        } else if (user_type === 'teacher' && teacher_details) {
            if (!user.teacher_details) user.teacher_details = {};
            if (teacher_details.institution !== undefined) user.teacher_details.institution = teacher_details.institution;
            if (teacher_details.subject !== undefined) user.teacher_details.subject = teacher_details.subject;
            if (teacher_details.experience !== undefined) user.teacher_details.experience = teacher_details.experience;
            if (teacher_details.qualification !== undefined) user.teacher_details.qualification = teacher_details.qualification;
            
            // Clear other type details
            user.student_details = undefined;
            user.professional_details = undefined;
        } else if (user_type === 'professional' && professional_details) {
            if (!user.professional_details) user.professional_details = {};
            if (professional_details.company !== undefined) user.professional_details.company = professional_details.company;
            if (professional_details.designation !== undefined) user.professional_details.designation = professional_details.designation;
            if (professional_details.industry !== undefined) user.professional_details.industry = professional_details.industry;
            if (professional_details.experience !== undefined) user.professional_details.experience = professional_details.experience;
            
            // Clear other type details
            user.student_details = undefined;
            user.teacher_details = undefined;
        }
        
        // Save the updated user
        await user.save();
        
        console.log('Profile updated successfully for user:', user.username);
        
        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
    } catch (err) {
        console.error('Profile update error:', err);
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
        console.log('GET /api/events - Query params:', req.query);
        const { 
            period_id, start_year, end_year, date, year,
            event_type, location_type, geographic_scope 
        } = req.query;
        
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
        
        // Filter by event_type
        if (event_type) {
            query.event_type = event_type;
        }
        
        // Filter by location_type
        if (location_type) {
            query.location_type = location_type;
        }
        
        // Filter by geographic_scope
        if (geographic_scope) {
            query.geographic_scope = geographic_scope;
        }
        
        // CRITICAL: Year and Date filtering must return overlapping period events
        
        // Parse year parameter - must return both point events AND overlapping period events
        if (year !== undefined && year !== null && year !== '') {
            const yearNum = parseInt(year);
            if (!isNaN(yearNum)) {
                // Query must return:
                // 1. Point events where year = yearNum
                // 2. Period events where start_year <= yearNum AND end_year >= yearNum
                query.$or = [
                    { event_type: 'point', year: yearNum },
                    { 
                        event_type: 'period', 
                        start_year: { $lte: yearNum },
                        end_year: { $gte: yearNum }
                    }
                ];
            }
        } else if (start_year !== undefined || end_year !== undefined) {
            // Year range filtering - applies to both point and period events
            const $or = [];
            
            // For point events: filter by year field
            const pointQuery = { event_type: 'point' };
            if (start_year !== undefined && start_year !== null && start_year !== '') {
                const startYearNum = parseInt(start_year);
                if (!isNaN(startYearNum)) {
                    pointQuery.year = { ...pointQuery.year, $gte: startYearNum };
                }
            }
            if (end_year !== undefined && end_year !== null && end_year !== '') {
                const endYearNum = parseInt(end_year);
                if (!isNaN(endYearNum)) {
                    pointQuery.year = { ...pointQuery.year, $lte: endYearNum };
                }
            }
            if (Object.keys(pointQuery).length > 1) { // More than just event_type
                $or.push(pointQuery);
            }
            
            // For period events: filter by start_year and end_year
            const periodQuery = { event_type: 'period' };
            if (start_year !== undefined && start_year !== null && start_year !== '') {
                const startYearNum = parseInt(start_year);
                if (!isNaN(startYearNum)) {
                    // Period overlaps if: period.end_year >= filter.start_year
                    periodQuery.end_year = { $gte: startYearNum };
                }
            }
            if (end_year !== undefined && end_year !== null && end_year !== '') {
                const endYearNum = parseInt(end_year);
                if (!isNaN(endYearNum)) {
                    // Period overlaps if: period.start_year <= filter.end_year
                    periodQuery.start_year = { $lte: endYearNum };
                }
            }
            if (Object.keys(periodQuery).length > 1) { // More than just event_type
                $or.push(periodQuery);
            }
            
            if ($or.length > 0) {
                query.$or = $or;
            }
        }
        
        // Add date filter - must return both point events AND overlapping period events
        if (date) {
            const selectedDate = new Date(date);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            // Query must return:
            // 1. Point events where date matches
            // 2. Period events where start_date <= date AND end_date >= date
            query.$or = [
                {
                    event_type: 'point',
                    date: {
                        $gte: selectedDate,
                        $lt: nextDay
                    }
                },
                {
                    event_type: 'period',
                    start_date: { $lte: selectedDate },
                    end_date: { $gte: selectedDate }
                }
            ];
        }
        
        console.log('Events query:', JSON.stringify(query));
        
        // Legacy date filter handling (if not already processed above)
        if (false && date) {
            const selectedDate = new Date(date);
            const nextDay = new Date(selectedDate);
            nextDay.setDate(nextDay.getDate() + 1);
            
            query.date = {
                $gte: selectedDate,
                $lt: nextDay
            };
        }
        
        // Add limit parameter support to prevent overwhelming the client
        // Default limit is 500 to prevent memory/timeout issues on free tier servers
        // Frontend can request more with ?limit=10000 if needed
        const defaultLimit = 500;
        const limit = req.query.limit ? parseInt(req.query.limit) : defaultLimit;
        const skip = req.query.skip ? parseInt(req.query.skip) : 0;
        
        console.log('Fetching events with limit:', limit, 'skip:', skip);
        
        // Sort by year (ascending) - for point events use year, for period events use start_year
        const events = await Event.find(query)
            .populate('media_ids')
            .populate('period_id')
            .sort({ year: 1, start_year: 1, date: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean() for better performance
        
        // Convert S3 URLs to proxy URLs to bypass CORS issues
        const eventsWithProxyUrls = events.map(event => {
            if (event.media_ids && event.media_ids.length > 0) {
                event.media_ids = event.media_ids.map(media => {
                    if (media && media.url) {
                        return {
                            ...media,
                            url: convertToProxyUrl(media.url, req)
                        };
                    }
                    return media;
                });
            }
            return event;
        });
        
        console.log('Returning', eventsWithProxyUrls.length, 'events');
        
        res.json(eventsWithProxyUrls);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
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
        
        const event = await Event.findById(eventId)
            .populate('media_ids')
            .populate('period_id');
        
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
        
        // Convert S3 URLs to proxy URLs to bypass CORS issues
        const eventObj = event.toObject();
        if (eventObj.media_ids && eventObj.media_ids.length > 0) {
            eventObj.media_ids = eventObj.media_ids.map(media => {
                if (media && media.url) {
                    return {
                        ...media,
                        url: convertToProxyUrl(media.url, req)
                    };
                }
                return media;
            });
        }
        
        res.json(eventObj);
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
        const { 
            title, description, summary, 
            description_hindi, description_hinglish,
            event_type, year, start_year, end_year,
            date, start_date, end_date,
            location_type, latitude, longitude, place_name,
            geographic_scope, area_name, geojson_boundary,
            period_id, tags, media_ids 
        } = req.body;
        
        console.log('Creating event with data:', { 
            title, summary, event_type, year, start_year, end_year,
            location_type, geographic_scope, area_name, period_id 
        });
        
        // Basic required fields
        if (!title || !summary || !period_id) {
            console.log('Validation failed:', { title: !!title, summary: !!summary, period_id: !!period_id });
            return res.status(400).json({ error: 'Required fields missing: title, summary, and period_id are required' });
        }
        
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(period_id)) {
            return res.status(400).json({ error: 'Invalid period_id: must be a valid ObjectId' });
        }
        
        // Construct event data object
        const eventData = {
            title,
            description,
            summary,
            description_hindi,
            description_hinglish,
            event_type: event_type || 'point',
            location_type: location_type || 'point',
            period_id,
            tags: tags || [],
            media_ids: media_ids || [],
            created_by: req.user.id
        };
        
        // Add event type specific fields
        if (eventData.event_type === 'point') {
            eventData.year = year;
            eventData.date = date;
        } else if (eventData.event_type === 'period') {
            eventData.start_year = start_year;
            eventData.end_year = end_year;
            eventData.start_date = start_date;
            eventData.end_date = end_date;
        }
        
        // Add location type specific fields
        if (eventData.location_type === 'point') {
            eventData.latitude = latitude;
            eventData.longitude = longitude;
            eventData.place_name = place_name;
        } else if (eventData.location_type === 'area') {
            eventData.geographic_scope = geographic_scope;
            eventData.area_name = area_name;
            eventData.geojson_boundary = geojson_boundary;
            // Allow optional coordinates for area center
            if (latitude !== undefined) eventData.latitude = latitude;
            if (longitude !== undefined) eventData.longitude = longitude;
        }
        
        const newEvent = await Event.create(eventData);
        
        res.status(201).json(newEvent);
    } catch (err) {
        console.error('Error creating event:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

app.put('/api/admin/events/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        const { 
            title, description, summary,
            description_hindi, description_hinglish,
            event_type, year, start_year, end_year,
            date, start_date, end_date,
            location_type, latitude, longitude, place_name,
            geographic_scope, area_name, geojson_boundary,
            period_id, tags, media_ids 
        } = req.body;
        
        // Basic required fields
        if (!title || !summary || !period_id) {
            return res.status(400).json({ error: 'Required fields missing: title, summary, and period_id are required' });
        }
        
        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid event ID' });
        }
        if (!mongoose.Types.ObjectId.isValid(period_id)) {
            return res.status(400).json({ error: 'Invalid period_id: must be a valid ObjectId' });
        }
        
        // Construct update data object
        const updateData = {
            title,
            description,
            summary,
            description_hindi,
            description_hinglish,
            event_type: event_type || 'point',
            location_type: location_type || 'point',
            period_id,
            tags: tags || [],
            media_ids: media_ids || [],
            updated_at: Date.now()
        };
        
        // Add event type specific fields
        if (updateData.event_type === 'point') {
            updateData.year = year;
            updateData.date = date;
            // Clear period fields
            updateData.start_year = undefined;
            updateData.end_year = undefined;
            updateData.start_date = undefined;
            updateData.end_date = undefined;
        } else if (updateData.event_type === 'period') {
            updateData.start_year = start_year;
            updateData.end_year = end_year;
            updateData.start_date = start_date;
            updateData.end_date = end_date;
            // Clear point event fields
            updateData.year = undefined;
            updateData.date = undefined;
        }
        
        // Add location type specific fields
        if (updateData.location_type === 'point') {
            updateData.latitude = latitude;
            updateData.longitude = longitude;
            updateData.place_name = place_name;
            // Clear area fields
            updateData.geographic_scope = undefined;
            updateData.area_name = undefined;
            updateData.geojson_boundary = undefined;
        } else if (updateData.location_type === 'area') {
            updateData.geographic_scope = geographic_scope;
            updateData.area_name = area_name;
            updateData.geojson_boundary = geojson_boundary;
            // Allow optional coordinates for area center
            if (latitude !== undefined) updateData.latitude = latitude;
            if (longitude !== undefined) updateData.longitude = longitude;
            if (place_name !== undefined) updateData.place_name = place_name;
        }
        
        const updatedEvent = await Event.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );
        
        if (!updatedEvent) {
            return res.status(404).json({ error: 'Event not found' });
        }
        
        res.json(updatedEvent);
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ error: 'Server error', message: err.message });
    }
});

app.delete('/api/admin/events/:id', authenticateToken, checkAdmin, async (req, res) => {
    try {
        // Validate ObjectId
        if (!req.params.id || !mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid or missing event ID' });
        }
        
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

// Public media route (no authentication required)
app.get('/api/media', async (req, res) => {
    try {
        const media = await Media.find().sort({ upload_date: -1 });
        res.json(media);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single media item by ID (public)
app.get('/api/media/:id', async (req, res) => {
    try {
        const media = await Media.findById(req.params.id);
        if (!media) {
            return res.status(404).json({ error: 'Media not found' });
        }
        res.json(media);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Admin media management routes
app.get('/api/admin/media', async (req, res) => {
    try {
        const media = await Media.find().sort({ upload_date: -1 });
        
        // Convert S3 URLs to proxy URLs to bypass CORS issues
        const mediaWithProxyUrls = media.map(m => {
            const mediaObj = m.toObject();
            if (mediaObj.url) {
                mediaObj.url = convertToProxyUrl(mediaObj.url, req);
            }
            return mediaObj;
        });
        
        res.json(mediaWithProxyUrls);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// S3 upload dependencies
const multer = require('multer');
const { uploadToS3 } = require('./utils/s3Upload');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max (adjust per type)
    }
});

app.post('/api/admin/media', authenticateToken, upload.single('file'), async (req, res) => {
    try {
        console.log('Media upload request received');
        console.log('User:', req.user ? req.user.id : 'No user');
        console.log('Body:', req.body);
        console.log('File:', req.file ? req.file.originalname : 'No file');
        
        const { type, caption, description } = req.body;
        const file = req.file;

        if (!type || !file || !caption) {
            console.log('Missing required fields - type:', type, 'file:', !!file, 'caption:', caption);
            return res.status(400).json({ error: 'Required fields missing' });
        }

        // Validate file type and size (strict)
        const allowedTypes = {
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            video: ['video/mp4', 'video/webm', 'video/quicktime'],
            document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        };
        const maxFileSizes = {
            image: 5 * 1024 * 1024, // 5MB
            video: 100 * 1024 * 1024, // 100MB
            document: 10 * 1024 * 1024 // 10MB
        };
        if (!allowedTypes[type] || !allowedTypes[type].includes(file.mimetype)) {
            return res.status(400).json({ error: 'Invalid file type' });
        }
        if (file.size > maxFileSizes[type]) {
            return res.status(400).json({ error: `File too large. Max size for ${type}: ${maxFileSizes[type] / (1024*1024)}MB` });
        }
        // Prevent path traversal in filename
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const s3Key = `media/${type}s/${Date.now()}_${safeName}`;

        // Upload to S3
        const s3Result = await uploadToS3(file.buffer, s3Key, file.mimetype);

        const newMedia = await Media.create({
            type,
            url: s3Result.Location,
            caption,
            description,
            uploader_id: req.user.id,
            s3_key: s3Result.Key,
            bucket: s3Result.Bucket,
            etag: s3Result.ETag,
            file_size: file.size,
            file_type: file.mimetype
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

// Media proxy endpoint - bypass S3 CORS by proxying through backend
app.get('/api/media/proxy', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }
        
        // Validate that URL is from our S3 bucket
        if (!url.includes('historical-timeline.s3') && !url.includes('s3.ap-south-1.amazonaws.com')) {
            return res.status(403).json({ error: 'Invalid media URL' });
        }
        
        // Extract S3 key from URL
        const urlParts = url.split('/');
        const keyIndex = urlParts.indexOf('media');
        if (keyIndex === -1) {
            return res.status(400).json({ error: 'Invalid S3 URL format' });
        }
        const s3Key = urlParts.slice(keyIndex).join('/');
        
        console.log('Proxying media from S3:', s3Key);
        
        // Fetch from S3
        const s3 = require('./utils/s3');
        const params = {
            Bucket: process.env.AWS_BUCKET_NAME || 'historical-timeline',
            Key: s3Key
        };
        
        const s3Object = await s3.getObject(params).promise();
        
        // Set appropriate headers
        res.set('Content-Type', s3Object.ContentType || 'application/octet-stream');
        res.set('Content-Length', s3Object.ContentLength);
        res.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        res.set('Access-Control-Allow-Origin', '*'); // Allow all origins since we're controlling access
        
        // Send the file
        res.send(s3Object.Body);
    } catch (err) {
        console.error('Media proxy error:', err);
        if (err.code === 'NoSuchKey') {
            return res.status(404).json({ error: 'Media file not found' });
        }
        res.status(500).json({ error: 'Failed to fetch media', message: err.message });
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
