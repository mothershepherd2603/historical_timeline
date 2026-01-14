const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['image', 'video', 'audio']
    },
    url: {
        type: String,
        required: true,
        trim: true
    },
    caption: {
        type: String,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    upload_date: {
        type: Date,
        default: Date.now
    },
    uploader_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Virtual field to expose _id as id
mediaSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        return ret;
    }
});

mediaSchema.set('toObject', {
    virtuals: true,
    transform: function(doc, ret) {
        ret.id = ret._id;
        return ret;
    }
});

module.exports = mongoose.model('Media', mediaSchema);
