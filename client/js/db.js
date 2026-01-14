// This would be used to connect to the database from the frontend via API calls
// In a real application, you wouldn't connect directly from the frontend to PostgreSQL

class Database {
    constructor() {
        this.baseUrl = window.API_CONFIG ? window.API_CONFIG.getBaseUrl() : 'http://localhost:3000/api';
        this.token = localStorage.getItem('authToken');
    }
    
    async fetchWithAuth(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        const response = await fetch(`${this.baseUrl}${url}`, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Request failed');
        }
        
        return response.json();
    }
    
    // User methods
    async login(username, password) {
        const response = await fetch(`${this.baseUrl}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            this.token = data.token;
            localStorage.setItem('authToken', this.token);
        }
        
        return data;
    }
    
    logout() {
        this.token = null;
        localStorage.removeItem('authToken');
    }
    
    // Period methods
    async getPeriods() {
        return this.fetchWithAuth('/periods');
    }
    
    // Event methods
    async getEvents(periodId, startYear, endYear) {
        const params = new URLSearchParams();
        if (periodId) params.append('period_id', periodId);
        if (startYear) params.append('start_year', startYear);
        if (endYear) params.append('end_year', endYear);
        
        return this.fetchWithAuth(`/events?${params.toString()}`);
    }
    
    async getEventById(id) {
        return this.fetchWithAuth(`/events/${id}`);
    }
    
    // Admin methods
    async createEvent(eventData) {
        return this.fetchWithAuth('/admin/events', {
            method: 'POST',
            body: JSON.stringify(eventData)
        });
    }
    
    async updateEvent(id, eventData) {
        return this.fetchWithAuth(`/admin/events/${id}`, {
            method: 'PUT',
            body: JSON.stringify(eventData)
        });
    }
    
    async deleteEvent(id) {
        return this.fetchWithAuth(`/admin/events/${id}`, {
            method: 'DELETE'
        });
    }
    
    async getMedia() {
        return this.fetchWithAuth('/admin/media');
    }
    
    async uploadMedia(mediaData) {
        return this.fetchWithAuth('/admin/media', {
            method: 'POST',
            body: JSON.stringify(mediaData)
        });
    }
    
    async deleteMedia(id) {
        return this.fetchWithAuth(`/admin/media/${id}`, {
            method: 'DELETE'
        });
    }
    
    async getUsers() {
        return this.fetchWithAuth('/admin/users');
    }
    
    async getSubscriptionStats() {
        return this.fetchWithAuth('/admin/subscriptions/stats');
    }
    
    async getActiveSubscriptions() {
        return this.fetchWithAuth('/admin/subscriptions');
    }
}

const db = new Database();