const mongoose = require('mongoose');
require('dotenv').config();
const Infrastructure = require('./models/Infrastructure');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

const initialInfrastructure = [
  {
    name: 'Jharia Coalfield',
    type: 'coal_mine',
    state: 'Jharkhand',
    built_year: 1894,
    demolish_year: null, // Still active
    latitude: 23.75,
    longitude: 86.4167,
    icon: '⛏',
    color: '#34495e',
    details: 'One of India\'s largest coal reserves, discovered in 1894',
  },
  {
    name: 'Jamnagar Refinery',
    type: 'refinery',
    state: 'Gujarat',
    built_year: 1999,
    demolish_year: null, // Still active
    latitude: 22.4707,
    longitude: 70.0577,
    icon: '🏭',
    color: '#e67e22',
    details: 'World\'s largest refinery complex (Reliance)',
  },
  {
    name: 'Vindhyachal Thermal Power',
    type: 'power_plant',
    state: 'Madhya Pradesh',
    built_year: 1987,
    demolish_year: null, // Still active
    latitude: 24.1,
    longitude: 82.6,
    icon: '⚡',
    color: '#f39c12',
    details: 'Largest thermal power station in India',
  },
  {
    name: 'Bhilai Steel Plant',
    type: 'steel_plant',
    state: 'Chhattisgarh',
    built_year: 1959,
    demolish_year: null, // Still active
    latitude: 21.2167,
    longitude: 81.4333,
    icon: '🏗',
    color: '#95a5a6',
    details: 'SAIL steel plant, established with Soviet assistance',
  },
  {
    name: 'Mundra Port',
    type: 'port',
    state: 'Gujarat',
    built_year: 1998,
    demolish_year: null, // Still active
    latitude: 22.84,
    longitude: 69.7217,
    icon: '⚓',
    color: '#3498db',
    details: 'Largest private port in India',
  },
  {
    name: 'Old Delhi Railway Station',
    type: 'railway',
    state: 'Delhi',
    built_year: 1864,
    demolish_year: 1903, // Replaced by New Delhi Railway Station
    latitude: 28.6415,
    longitude: 77.2167,
    icon: '🚂',
    color: '#8e44ad',
    details: 'Original Delhi railway station, replaced in 1903',
  },
  {
    name: 'Indira Gandhi International Airport',
    type: 'airport',
    state: 'Delhi',
    built_year: 1962,
    demolish_year: null,
    latitude: 28.5562,
    longitude: 77.1000,
    icon: '✈️',
    color: '#16a085',
    details: 'Major international airport serving Delhi NCR',
  },
  {
    name: 'Bhakra Nangal Dam',
    type: 'dam',
    state: 'Himachal Pradesh',
    built_year: 1963,
    demolish_year: null,
    latitude: 31.4105,
    longitude: 76.4380,
    icon: '🌊',
    color: '#2980b9',
    details: 'One of India\'s highest gravity dams on the Sutlej River',
  },
  {
    name: 'AIIMS Delhi',
    type: 'hospital',
    state: 'Delhi',
    built_year: 1956,
    demolish_year: null,
    latitude: 28.5672,
    longitude: 77.2100,
    icon: '🏥',
    color: '#e74c3c',
    details: 'All India Institute of Medical Sciences, premier medical institution',
  },
  {
    name: 'IIT Kharagpur',
    type: 'university',
    state: 'West Bengal',
    built_year: 1951,
    demolish_year: null,
    latitude: 22.3149,
    longitude: 87.3105,
    icon: '🎓',
    color: '#27ae60',
    details: 'First IIT established in India',
  },
  {
    name: 'Tata Steel Jamshedpur',
    type: 'steel_plant',
    state: 'Jharkhand',
    built_year: 1907,
    demolish_year: null,
    latitude: 22.8046,
    longitude: 86.2029,
    icon: '🏗',
    color: '#95a5a6',
    details: 'First integrated steel plant in India, established by Jamsetji Tata',
  },
  {
    name: 'Gateway of India',
    type: 'monument',
    state: 'Maharashtra',
    built_year: 1924,
    demolish_year: null,
    latitude: 18.9220,
    longitude: 72.8347,
    icon: '🗿',
    color: '#d35400',
    details: 'Iconic monument in Mumbai, built to commemorate King George V\'s visit',
  },
  {
    name: 'Golden Temple Amritsar',
    type: 'temple',
    state: 'Punjab',
    built_year: 1604,
    demolish_year: null,
    latitude: 31.6200,
    longitude: 74.8765,
    icon: '🛕',
    color: '#f39c12',
    details: 'Holiest Gurdwara of Sikhism, built in the 17th century',
  },
  {
    name: 'Ambala Cantt Railway Junction',
    type: 'railway',
    state: 'Haryana',
    built_year: 1891,
    demolish_year: null,
    latitude: 30.3752,
    longitude: 76.8343,
    icon: '🚂',
    color: '#8e44ad',
    details: 'Important railway junction connecting North India',
  },
  {
    name: 'Paradip Port',
    type: 'port',
    state: 'Odisha',
    built_year: 1966,
    demolish_year: null,
    latitude: 20.3156,
    longitude: 86.6080,
    icon: '⚓',
    color: '#3498db',
    details: 'Major port on the east coast of India',
  },
];

async function seedInfrastructure() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const count = await Infrastructure.countDocuments();
    console.log(`Current infrastructure count: ${count}`);
    
    if (count === 0) {
      await Infrastructure.insertMany(initialInfrastructure);
      console.log(`✓ Successfully seeded ${initialInfrastructure.length} infrastructure items`);
    } else {
      console.log('⚠ Infrastructure collection already has data. Skipping seed.');
      console.log('To force re-seed, first delete existing data or use a migration script.');
    }
    
    await mongoose.connection.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding infrastructure:', error);
    process.exit(1);
  }
}

// Run the seed function
seedInfrastructure();
