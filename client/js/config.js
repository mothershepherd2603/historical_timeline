const API_CONFIG = {
    // Change this to your production API URL when deploying
    development: 'http://localhost:3000/api',
    
    // UPDATE THIS BASED ON YOUR BACKEND DEPLOYMENT:
    // Option 1: Backend on subdomain
    // production: 'https://api.maanchitra.in/api',
    
    // Option 2: Backend in subfolder on same domain
    // production: 'https://maanchitra.in/server/api',
    
    // Option 3: Backend on external service (Render, etc)
    // production: 'https://your-app-name.onrender.com/api',
    
    // CURRENT SETTING:
    production: 'https://api.maanchitra.in/api',
    
    // Automatically use the right URL based on hostname
    getBaseUrl: function() {
        // If running on localhost, use development URL
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Using development API:', this.development);
            return this.development;
        }
        // Otherwise use production URL
        console.log('Using production API:', this.production);
        return this.production;
    }
};

// Export for use in other files
window.API_CONFIG = API_CONFIG;
