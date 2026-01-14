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
    year: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: false  // Optional, primarily for Current Affairs
    },
    period_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Period'
    },
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

module.exports = mongoose.model('Event', eventSchema);
