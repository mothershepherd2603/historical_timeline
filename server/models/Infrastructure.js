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

const Infrastructure = mongoose.model('Infrastructure', infrastructureSchema);

module.exports = Infrastructure;
