const API_CONFIG = {
    // Change this to your production API URL when deploying
    development: 'http://localhost:3000/api',
    production: 'https://api.maanchitra.in/api', // or 'https://maanchitra.in/api' if backend is on same domain
    
    // Automatically use the right URL based on hostname
    getBaseUrl: function() {
        // If running on localhost, use development URL
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return this.development;
        }
        // Otherwise use production URL
        return this.production;
    }
};

// Export for use in other files
window.API_CONFIG = API_CONFIG;
