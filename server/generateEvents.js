const mongoose = require('mongoose');
const Event = require('./models/Event');
const Period = require('./models/Period');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Historical event templates
const eventTemplates = {
    ancient: [
        { title: 'Trade Route Establishment', tags: ['economic', 'cultural'], desc: 'A new trade route was established connecting major cities, facilitating the exchange of goods, ideas, and cultural practices.' },
        { title: 'Temple Construction', tags: ['religious', 'cultural'], desc: 'Construction of a significant temple dedicated to local deities, serving as a center for worship and community gathering.' },
        { title: 'Agricultural Innovation', tags: ['technological', 'economic'], desc: 'Introduction of new farming techniques and irrigation systems that improved crop yields and agricultural productivity.' },
        { title: 'Military Campaign', tags: ['military', 'political'], desc: 'A major military expedition launched to expand territorial control and establish dominance over neighboring regions.' },
        { title: 'Dynasty Foundation', tags: ['political', 'history'], desc: 'Establishment of a new ruling dynasty that would govern the region for generations to come.' },
        { title: 'Philosophical School', tags: ['cultural', 'social'], desc: 'Foundation of a new school of philosophical thought that influenced social and religious practices.' },
        { title: 'City Foundation', tags: ['history', 'economic'], desc: 'Establishment of a new urban center that became an important hub for trade, culture, and governance.' },
        { title: 'Religious Reform', tags: ['religious', 'social'], desc: 'Implementation of significant changes to religious practices and beliefs, affecting daily life and social structure.' },
        { title: 'Astronomical Observation', tags: ['technological', 'cultural'], desc: 'Recording of important celestial events and development of astronomical knowledge for calendar and agricultural purposes.' },
        { title: 'Artistic Movement', tags: ['cultural', 'history'], desc: 'Emergence of a distinctive artistic style in sculpture, painting, and architecture that defined the era.' }
    ],
    medieval: [
        { title: 'Fort Construction', tags: ['military', 'political'], desc: 'Construction of a strategic fortress to defend the kingdom and serve as an administrative center.' },
        { title: 'Royal Marriage Alliance', tags: ['political', 'social'], desc: 'A diplomatic marriage between royal families that strengthened political alliances and territorial claims.' },
        { title: 'Religious Monument', tags: ['religious', 'cultural'], desc: 'Construction of a grand religious monument that showcased architectural excellence and devotional commitment.' },
        { title: 'Trade Guild Formation', tags: ['economic', 'social'], desc: 'Establishment of merchant and artisan guilds that regulated trade and craft production.' },
        { title: 'Land Grant', tags: ['political', 'economic'], desc: 'Royal grant of land to nobles or religious institutions, establishing feudal relationships and economic structures.' },
        { title: 'Military Victory', tags: ['military', 'political'], desc: 'A decisive military victory that altered the balance of power and expanded territorial control.' },
        { title: 'Cultural Festival', tags: ['cultural', 'social'], desc: 'Institution of an annual cultural festival celebrating local traditions, arts, and religious observances.' },
        { title: 'Literary Work', tags: ['cultural', 'history'], desc: 'Composition of a significant literary work in poetry or prose that preserved historical knowledge and cultural values.' },
        { title: 'Diplomatic Treaty', tags: ['political', 'history'], desc: 'Signing of an important treaty establishing peace, trade relations, or military alliances between kingdoms.' },
        { title: 'Architectural Innovation', tags: ['technological', 'cultural'], desc: 'Introduction of new architectural techniques in temple and palace construction, creating enduring monuments.' }
    ],
    modern: [
        { title: 'Colonial Resistance', tags: ['political', 'military'], desc: 'Organized resistance against colonial rule, including protests, armed conflicts, and political movements.' },
        { title: 'Social Reform Movement', tags: ['social', 'cultural'], desc: 'Progressive movement advocating for social reforms in education, caste system, and women\'s rights.' },
        { title: 'Railway Expansion', tags: ['technological', 'economic'], desc: 'Extension of railway networks connecting major cities and facilitating trade and passenger transport.' },
        { title: 'Educational Institution', tags: ['cultural', 'social'], desc: 'Establishment of modern educational institutions promoting Western and traditional knowledge systems.' },
        { title: 'Independence Movement', tags: ['political', 'history'], desc: 'Participation in the broader struggle for independence through civil disobedience and political activism.' },
        { title: 'Industrial Development', tags: ['economic', 'technological'], desc: 'Establishment of factories and industries introducing modern manufacturing techniques and employment.' },
        { title: 'Press Publication', tags: ['cultural', 'political'], desc: 'Launch of newspapers and periodicals promoting nationalist ideas and social awareness.' },
        { title: 'Legal Reform', tags: ['political', 'social'], desc: 'Implementation of new legal codes and judicial systems affecting property rights and social relations.' },
        { title: 'Religious Revival', tags: ['religious', 'cultural'], desc: 'Movement to revive and reform religious practices in response to colonial influence and modernization.' },
        { title: 'Economic Policy', tags: ['economic', 'political'], desc: 'Introduction of new economic policies affecting taxation, trade, and agricultural production.' }
    ],
    current: [
        { title: 'Technology Hub Development', tags: ['technological', 'economic'], desc: 'Establishment of IT parks and technology centers driving innovation and economic growth in the digital sector.' },
        { title: 'Infrastructure Project', tags: ['economic', 'technological'], desc: 'Launch of major infrastructure projects including highways, metro systems, and smart city initiatives.' },
        { title: 'Environmental Initiative', tags: ['social', 'political'], desc: 'Implementation of environmental protection measures and sustainable development programs.' },
        { title: 'Space Mission', tags: ['technological', 'history'], desc: 'Launch of satellite missions and space exploration programs demonstrating technological advancement.' },
        { title: 'Political Election', tags: ['political', 'history'], desc: 'Significant electoral outcomes reflecting changing political dynamics and public sentiment.' },
        { title: 'Economic Reform', tags: ['economic', 'political'], desc: 'Major economic policy changes promoting liberalization, privatization, and global integration.' },
        { title: 'Cultural Festival', tags: ['cultural', 'social'], desc: 'Organization of international cultural festivals showcasing diverse traditions and artistic expressions.' },
        { title: 'Healthcare Initiative', tags: ['social', 'political'], desc: 'Launch of public health programs addressing disease prevention, sanitation, and medical accessibility.' },
        { title: 'Digital Transformation', tags: ['technological', 'economic'], desc: 'Implementation of digital governance systems and e-commerce platforms transforming daily life.' },
        { title: 'International Relations', tags: ['political', 'economic'], desc: 'Signing of international agreements on trade, security, and cultural exchange strengthening global ties.' }
    ]
};

// Indian cities and coordinates
const locations = [
    { name: 'Delhi', lat: 28.6139, lng: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
    { name: 'Kolkata', lat: 22.5726, lng: 88.3639 },
    { name: 'Chennai', lat: 13.0827, lng: 80.2707 },
    { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
    { name: 'Hyderabad', lat: 17.3850, lng: 78.4867 },
    { name: 'Ahmedabad', lat: 23.0225, lng: 72.5714 },
    { name: 'Pune', lat: 18.5204, lng: 73.8567 },
    { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
    { name: 'Lucknow', lat: 26.8467, lng: 80.9462 },
    { name: 'Varanasi', lat: 25.3176, lng: 82.9739 },
    { name: 'Agra', lat: 27.1767, lng: 78.0081 },
    { name: 'Patna', lat: 25.5941, lng: 85.1376 },
    { name: 'Surat', lat: 21.1702, lng: 72.8311 },
    { name: 'Kanpur', lat: 26.4499, lng: 80.3319 },
    { name: 'Nagpur', lat: 21.1458, lng: 79.0882 },
    { name: 'Indore', lat: 22.7196, lng: 75.8577 },
    { name: 'Bhopal', lat: 23.2599, lng: 77.4126 },
    { name: 'Visakhapatnam', lat: 17.6868, lng: 83.2185 },
    { name: 'Kochi', lat: 9.9312, lng: 76.2673 }
];

// Generate a random number in a range
function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Get random item from array
function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Add variation to location coordinates
function varyLocation(location) {
    return {
        lat: location.lat + (Math.random() - 0.5) * 2,
        lng: location.lng + (Math.random() - 0.5) * 2
    };
}

// Generate events for a period
async function generateEventsForPeriod(periodName, periodId, startYear, endYear, count) {
    const templates = eventTemplates[periodName];
    const events = [];
    
    console.log(`Generating ${count} events for ${periodName} period (${startYear} to ${endYear})...`);
    
    for (let i = 0; i < count; i++) {
        const template = randomItem(templates);
        const location = randomItem(locations);
        const variedLocation = varyLocation(location);
        const year = randomInRange(startYear, endYear);
        
        // Create unique title by adding location and year reference
        const title = `${template.title} in ${location.name} Region`;
        
        // Expand description with specific details
        const description = `${template.desc} This significant event took place around the year ${Math.abs(year)} ${year < 0 ? 'BCE' : 'CE'} in the ${location.name} region, marking an important moment in local history. The impact of this development was felt across the region, influencing social structures, economic patterns, and cultural practices for generations. Historical records and archaeological evidence provide insights into how this event shaped the trajectory of the area's development and contributed to the broader historical narrative of Indian civilization.`;
        
        const event = {
            title: title,
            description: description,
            summary: template.desc,
            year: year,
            period_id: periodId,
            latitude: variedLocation.lat,
            longitude: variedLocation.lng,
            tags: template.tags,
            media_ids: []
        };
        
        events.push(event);
        
        // Log progress every 5000 events
        if ((i + 1) % 5000 === 0) {
            console.log(`  Generated ${i + 1}/${count} events...`);
        }
    }
    
    return events;
}

// Main function to generate all events
async function generateAllEvents() {
    try {
        console.log('Starting event generation...\n');
        
        // Get periods from database
        const periods = await Period.find({});
        const periodMap = {};
        periods.forEach(p => {
            periodMap[p.name.toLowerCase().split(' ')[0]] = p;
        });
        
        // Delete existing events
        console.log('Deleting existing events...');
        await Event.deleteMany({});
        console.log('Existing events deleted.\n');
        
        const allEvents = [];
        
        // Generate events for each period
        // Ancient: 40,000 events
        if (periodMap.ancient) {
            const ancientEvents = await generateEventsForPeriod(
                'ancient',
                periodMap.ancient._id,
                -3000,
                500,
                40000
            );
            allEvents.push(...ancientEvents);
        }
        
        // Medieval: 35,000 events
        if (periodMap.medieval) {
            const medievalEvents = await generateEventsForPeriod(
                'medieval',
                periodMap.medieval._id,
                500,
                1500,
                35000
            );
            allEvents.push(...medievalEvents);
        }
        
        // Modern: 30,000 events
        if (periodMap.modern) {
            const modernEvents = await generateEventsForPeriod(
                'modern',
                periodMap.modern._id,
                1500,
                1947,
                30000
            );
            allEvents.push(...modernEvents);
        }
        
        // Current: 5,000 events (smaller period, more recent)
        if (periodMap.current) {
            const currentEvents = await generateEventsForPeriod(
                'current',
                periodMap.current._id,
                1947,
                2025,
                5000
            );
            allEvents.push(...currentEvents);
        }
        
        // Insert all events in batches
        console.log(`\nInserting ${allEvents.length} total events into database...`);
        const batchSize = 1000;
        for (let i = 0; i < allEvents.length; i += batchSize) {
            const batch = allEvents.slice(i, i + batchSize);
            await Event.insertMany(batch);
            console.log(`  Inserted ${Math.min(i + batchSize, allEvents.length)}/${allEvents.length} events...`);
        }
        
        console.log('\n✓ Event generation complete!');
        console.log(`Total events created: ${allEvents.length}`);
        
        // Show some statistics
        const stats = await Event.aggregate([
            {
                $group: {
                    _id: '$period_id',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        console.log('\nEvents per period:');
        for (const stat of stats) {
            const period = periods.find(p => p._id.toString() === stat._id.toString());
            console.log(`  ${period.name}: ${stat.count} events`);
        }
        
        process.exit(0);
    } catch (error) {
        console.error('Error generating events:', error);
        process.exit(1);
    }
}

// Run the generator
generateAllEvents();
