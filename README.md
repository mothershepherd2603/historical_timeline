# Historical Timeline Web Application

A comprehensive web application for exploring Indian historical events from ancient times to current affairs, with interactive timeline visualization, map integration, and subscription-based premium content.

## 🌟 Features

- **Interactive Timeline:** Browse historical events from 3300 BCE to present
- **Map Visualization:** View events on an interactive Leaflet map
- **Period-based Navigation:** Ancient India, Medieval India, Modern India, Current Affairs
- **Subscription System:** Premium content with Razorpay payment integration
- **Admin Panel:** Comprehensive event and content management
- **User Authentication:** Secure login and registration system
- **Responsive Design:** Works on desktop, tablet, and mobile devices

## 🚀 Live Demo

- **Website:** https://maanchitra.in
- **Admin Panel:** https://maanchitra.in/admin.html

## 🛠️ Technology Stack

### Frontend

- HTML5, CSS3, JavaScript (Vanilla)
- Leaflet.js for maps
- Razorpay Checkout for payments

### Backend

- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- bcrypt for password hashing

## 📋 Local Development Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/yourusername/historical-timeline.git
   cd historical-timeline
   ```

2. **Install backend dependencies:**

   ```bash
   cd server
   npm install
   ```

3. **Configure environment variables:**
   Create `server/.env` file:

   ```env
   MONGODB_URI=mongodb://localhost:27017/historical_timeline
   JWT_SECRET=your_jwt_secret_key_here
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   PORT=3000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Seed the database:**

   ```bash
   npm run seed
   ```

5. **Start the server:**

   ```bash
   npm start
   ```

6. **Open the application:**
   - Frontend: http://localhost:3000
   - Admin Panel: http://localhost:3000/admin.html

## 🌐 Deployment

See [QUICK_DEPLOY.md](QUICK_DEPLOY.md) for quick deployment steps or [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for comprehensive deployment instructions.

### Quick Summary:

1. Set up MongoDB Atlas (cloud database)
2. Deploy backend to Render
3. Deploy frontend to Vercel
4. Configure custom domain (maanchitra.in)

## 📁 Project Structure

```
Historical Timeline Web Application/
├── client/                  # Frontend application
│   ├── index.html          # Main timeline page
│   ├── admin.html          # Admin panel
│   ├── css/                # Stylesheets
│   ├── js/                 # JavaScript files
│   │   ├── config.js       # API configuration
│   │   ├── app.js          # Main app logic
│   │   ├── admin.js        # Admin panel logic
│   │   └── db.js           # Database API wrapper
│   └── assets/             # Static assets
├── server/                  # Backend API
│   ├── server.js           # Express server
│   ├── seed.js             # Database seeding
│   ├── models/             # Mongoose models
│   │   ├── Event.js
│   │   ├── Period.js
│   │   ├── User.js
│   │   ├── Media.js
│   │   ├── SubscriptionPlan.js
│   │   └── UserSubscription.js
│   ├── package.json        # Node dependencies
│   └── .env.example        # Environment variables template
├── DEPLOYMENT_GUIDE.md     # Detailed deployment guide
├── QUICK_DEPLOY.md         # Quick deployment steps
└── README.md               # This file
```

## 👤 Admin Access

Default admin credentials (change after first login):

- **Username:** admin
- **Password:** admin123

## 🔐 Security Notes

- Change default admin password immediately
- Use strong JWT_SECRET in production
- Enable MongoDB IP whitelist
- Use environment variables for all secrets
- Never commit .env file to version control

## 🎯 Subscription Plans

- **Free:** Access to Ancient India period
- **Monthly:** ₹100/month - Access to all periods
- **Yearly:** ₹999/year - All features + priority support

## 📊 Database Schema

### Collections:

- **users** - User accounts and authentication
- **periods** - Historical periods (Ancient, Medieval, Modern, Current)
- **events** - Historical events with timeline data
- **media** - Images, videos, and audio files
- **subscriptionplans** - Payment plan details
- **usersubscriptions** - User subscription records

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📧 Support

For support and queries:

- Email: support@maanchitra.in
- Website: https://maanchitra.in

## 🙏 Acknowledgments

- Leaflet.js for map integration
- OpenStreetMap for geocoding
- Razorpay for payment processing
- MongoDB Atlas for database hosting
- Vercel and Render for hosting services

---

Made with ❤️ for history enthusiasts
