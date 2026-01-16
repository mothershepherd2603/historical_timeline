const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    summary: {
        type: String,
        required: true,
        trim: true
    },
    // Multilingual Support
    description_hindi: {
        type: String,
        trim: true
    },
    description_hinglish: {
        type: String,
        trim: true
    },
    // Event Type (point vs period)
    event_type: {
        type: String,
        enum: ['point', 'period'],
        default: 'point'
    },
    // Original fields for point events
    year: {
        type: Number,
        required: false  // Not required anymore - depends on event_type
    },
    date: {
        type: Date,
        required: false  // Optional, primarily for Current Affairs
    },
    // Period Event Fields
    start_year: {
        type: Number
    },
    end_year: {
        type: Number
    },
    start_date: {
        type: Date
    },
    end_date: {
        type: Date
    },
    // Location Type (point vs area)
    location_type: {
        type: String,
        enum: ['point', 'area'],
        default: 'point'
    },
    // Original location fields (for point locations)
    latitude: {
        type: Number,
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        min: -180,
        max: 180
    },
    place_name: {
        type: String,
        trim: true
    },
    // Geographic Area Fields (for area locations)
    geographic_scope: {
        type: String,
        enum: ['country', 'state', 'district', 'region']
    },
    area_name: {
        type: String,
        trim: true
    },
    period_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Period'
    },
    tags: [{
        type: String,
        trim: true
    }],
    media_ids: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media'
    }],
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Virtual field to expose _id as id
eventSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        return ret;
    }
});

eventSchema.set('toObject', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        return ret;
    }
});

// Update timestamp on save
eventSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

// Custom validation for event_type and location_type constraints
eventSchema.pre('validate', function(next) {
    // Validate event_type constraints
    if (this.event_type === 'point') {
        // Point events require year
        if (!this.year && this.year !== 0) {
            return next(new Error('Point events require a year field'));
        }
        // Point events should not have period fields
        if (this.start_year || this.end_year || this.start_date || this.end_date) {
            // Clear period fields for point events
            this.start_year = undefined;
            this.end_year = undefined;
            this.start_date = undefined;
            this.end_date = undefined;
        }
        // Require date for point events >= 1947
        if (this.year >= 1947 && !this.date) {
            return next(new Error('Point events from 1947 onwards require a specific date'));
        }
    } else if (this.event_type === 'period') {
        // Period events require start_year and end_year
        if (!this.start_year && this.start_year !== 0) {
            return next(new Error('Period events require a start_year field'));
        }
        if (!this.end_year && this.end_year !== 0) {
            return next(new Error('Period events require an end_year field'));
        }
        // Validate that end_year >= start_year
        if (this.end_year < this.start_year) {
            return next(new Error('end_year must be greater than or equal to start_year'));
        }
        // Period events should not have year field
        if (this.year) {
            this.year = undefined;
        }
        if (this.date) {
            this.date = undefined;
        }
        // Require dates for period events >= 1947
        if (this.start_year >= 1947 && !this.start_date) {
            return next(new Error('Period events from 1947 onwards require a start_date'));
        }
        if (this.end_year >= 1947 && !this.end_date) {
            return next(new Error('Period events from 1947 onwards require an end_date'));
        }
        // Validate date range if both dates are provided
        if (this.start_date && this.end_date && this.end_date < this.start_date) {
            return next(new Error('end_date must be greater than or equal to start_date'));
        }
    }
    
    // Validate location_type constraints
    if (this.location_type === 'point') {
        // Point locations require latitude and longitude
        if ((this.latitude === undefined || this.latitude === null) || 
            (this.longitude === undefined || this.longitude === null)) {
            return next(new Error('Point locations require latitude and longitude'));
        }
        // Clear area fields for point locations
        if (this.geographic_scope || this.area_name) {
            this.geographic_scope = undefined;
            this.area_name = undefined;
        }
    } else if (this.location_type === 'area') {
        // Area locations require geographic_scope and area_name
        if (!this.geographic_scope) {
            return next(new Error('Area locations require a geographic_scope field'));
        }
        if (!this.area_name) {
            return next(new Error('Area locations require an area_name field'));
        }
    }
    
    next();
});

module.exports = mongoose.model('Event', eventSchema);
