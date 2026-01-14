const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    start_year: {
        type: Number,
        required: true
    },
    end_year: {
        type: Number,
        required: true
    },
    requires_subscription: {
        type: Boolean,
        default: false
    }
});

// Virtual field to expose _id as id
periodSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        return ret;
    }
});

periodSchema.set('toObject', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        return ret;
    }
});

module.exports = mongoose.model('Period', periodSchema);
