const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password_hash: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    // Profile information
    full_name: {
        type: String,
        trim: true
    },
    mobile: {
        type: String,
        trim: true
    },
    user_type: {
        type: String,
        enum: ['student', 'teacher', 'professional'],
        trim: true
    },
    date_of_birth: {
        type: Date
    },
    gender: {
        type: String,
        enum: ['male', 'female', 'other', 'prefer_not_to_say'],
        trim: true
    },
    // Address information
    address: {
        street: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        pincode: {
            type: String,
            trim: true
        },
        country: {
            type: String,
            trim: true,
            default: 'India'
        }
    },
    // Student details
    student_details: {
        school: {
            type: String,
            trim: true
        },
        grade: {
            type: String,
            trim: true
        },
        stream: {
            type: String,
            trim: true
        },
        board: {
            type: String,
            trim: true
        }
    },
    // Teacher details
    teacher_details: {
        institution: {
            type: String,
            trim: true
        },
        subject: {
            type: String,
            trim: true
        },
        experience: {
            type: String,
            trim: true
        },
        qualification: {
            type: String,
            trim: true
        }
    },
    // Professional details
    professional_details: {
        company: {
            type: String,
            trim: true
        },
        designation: {
            type: String,
            trim: true
        },
        industry: {
            type: String,
            trim: true
        },
        experience: {
            type: String,
            trim: true
        }
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Update timestamp on save
userSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

module.exports = mongoose.model('User', userSchema);
