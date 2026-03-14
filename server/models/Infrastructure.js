const mongoose = require('mongoose');

const infrastructureSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    enum: [
      'coal_mine',
      'refinery',
      'power_plant',
      'steel_plant',
      'port',
      'airport',
      'railway',
      'dam',
      'hospital',
      'university',
      'factory',
      'mall',
      'temple',
      'monument',
    ],
  },
  state: {
    type: String,
  },
  built_year: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: 'Built year must be an integer',
    },
  },
  demolish_year: {
    type: Number,
    default: null,
    validate: {
      validator: function (value) {
        // If demolish_year is provided, it must be an integer and greater than built_year
        return (
          value === null ||
          value === undefined ||
          (Number.isInteger(value) && value > this.built_year)
        );
      },
      message: 'Demolish year must be an integer greater than built year',
    },
  },
  latitude: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  icon: {
    type: String, // Emoji icon
    default: null,
  },
  color: {
    type: String, // Hex color code
    default: '#3498db',
  },
  details: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create indexes for efficient queries
infrastructureSchema.index({ type: 1 });
infrastructureSchema.index({ name: 'text', details: 'text' });
infrastructureSchema.index({ built_year: 1, demolish_year: 1 }); // For year-based filtering

const Infrastructure = mongoose.model('Infrastructure', infrastructureSchema);

module.exports = Infrastructure;
