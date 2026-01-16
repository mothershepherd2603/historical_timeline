/**
 * Create Demo Events
 * 
 * This script creates 50-100 diverse demo events showcasing:
 * - Point events (historical and modern)
 * - Period events
 * - Point locations and area locations
 * - Multilingual descriptions (Hindi and Hinglish)
 * - Different geographic scopes
 * 
 * Usage: node createDemoEvents.js
 */

const mongoose = require('mongoose');
const Event = require('./models/Event');
const Period = require('./models/Period');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline';

// Demo event templates
const demoEventTemplates = [
    // Ancient India - Point Events
    {
        title: "Foundation of Maurya Empire",
        summary: "Chandragupta Maurya established the empire",
        description: "Chandragupta Maurya founded the Maurya Empire, one of the largest empires in Indian history",
        description_hindi: "चंद्रगुप्त मौर्य ने मौर्य साम्राज्य की स्थापना की",
        description_hinglish: "Chandragupta Maurya ne Maurya Samrajya ki sthapana ki",
        event_type: "point",
        year: -321,
        location_type: "point",
        latitude: 25.5941,
        longitude: 85.1376,
        place_name: "Pataliputra",
        tags: ["empire", "dynasty", "maurya"],
        periodName: "ancient-india"
    },
    {
        title: "Battle of Kalinga",
        summary: "Major battle fought by Ashoka",
        description: "Ashoka's conquest of Kalinga, which led to his conversion to Buddhism",
        description_hindi: "अशोक की कलिंग विजय",
        description_hinglish: "Ashoka ki Kalinga vijay",
        event_type: "point",
        year: -261,
        location_type: "point",
        latitude: 20.2961,
        longitude: 85.8245,
        place_name: "Kalinga (Odisha)",
        tags: ["battle", "ashoka", "buddhism"],
        periodName: "ancient-india"
    },
    
    // Ancient India - Period Events
    {
        title: "Maurya Empire Period",
        summary: "Rule of Maurya dynasty in India",
        description: "The Maurya Empire was the first pan-Indian empire, ruling most of the Indian subcontinent",
        description_hindi: "मौर्य साम्राज्य काल",
        description_hinglish: "Maurya Samrajya kaal",
        event_type: "period",
        start_year: -322,
        end_year: -185,
        location_type: "area",
        geographic_scope: "country",
        area_name: "Ancient India",
        latitude: 25.5941,
        longitude: 85.1376,
        tags: ["empire", "dynasty"],
        periodName: "ancient-india"
    },
    {
        title: "Gupta Empire - Golden Age",
        summary: "Period of scientific and cultural advancement",
        description: "The Gupta Empire is remembered as the Golden Age of India with major achievements in science, art, and literature",
        description_hindi: "गुप्त साम्राज्य - स्वर्ण युग",
        description_hinglish: "Gupta Samrajya - Swarna Yug",
        event_type: "period",
        start_year: 320,
        end_year: 550,
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["golden-age", "science", "culture"],
        periodName: "ancient-india"
    },
    
    // Medieval India
    {
        title: "First Battle of Panipat",
        summary: "Babur defeats Ibrahim Lodi",
        description: "Babur's victory marked the beginning of Mughal rule in India",
        description_hindi: "पानीपत का पहला युद्ध",
        description_hinglish: "Panipat ka pehla yuddh",
        event_type: "point",
        year: 1526,
        location_type: "point",
        latitude: 29.3909,
        longitude: 76.9635,
        place_name: "Panipat",
        tags: ["battle", "mughal"],
        periodName: "medieval-india"
    },
    {
        title: "Battle of Plassey",
        summary: "British East India Company defeats Nawab of Bengal",
        description: "Decisive battle that established British dominance in India",
        description_hindi: "प्लासी का युद्ध",
        description_hinglish: "Plassey ka yuddh",
        event_type: "point",
        year: 1757,
        location_type: "point",
        latitude: 23.7957,
        longitude: 88.2545,
        place_name: "Plassey, West Bengal",
        tags: ["battle", "british-india"],
        periodName: "medieval-india"
    },
    {
        title: "Mughal Empire",
        summary: "Rule of Mughal dynasty in India",
        description: "The Mughal Empire ruled large parts of the Indian subcontinent for over three centuries",
        description_hindi: "मुगल साम्राज्य",
        description_hinglish: "Mughal Samrajya",
        event_type: "period",
        start_year: 1526,
        end_year: 1857,
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        latitude: 28.6139,
        longitude: 77.209,
        tags: ["empire", "mughal"],
        periodName: "medieval-india"
    },
    {
        title: "Vijayanagara Empire",
        summary: "South Indian empire based in Karnataka",
        description: "One of the most powerful empires in South Indian history",
        description_hindi: "विजयनगर साम्राज्य",
        description_hinglish: "Vijayanagara Samrajya",
        event_type: "period",
        start_year: 1336,
        end_year: 1646,
        location_type: "area",
        geographic_scope: "region",
        area_name: "South India",
        latitude: 15.3350,
        longitude: 76.4600,
        tags: ["empire", "south-india"],
        periodName: "medieval-india"
    },
    
    // Modern India
    {
        title: "Independence Day of India",
        summary: "India gained independence from British rule",
        description: "India achieved freedom from British colonial rule after years of struggle",
        description_hindi: "भारत ने ब्रिटिश शासन से स्वतंत्रता प्राप्त की",
        description_hinglish: "Bharat ne British shasan se swatantrata prapt ki",
        event_type: "point",
        year: 1947,
        date: new Date('1947-08-15'),
        location_type: "point",
        latitude: 28.6139,
        longitude: 77.209,
        place_name: "Red Fort, Delhi",
        tags: ["independence", "political"],
        periodName: "modern-india"
    },
    {
        title: "Partition of India",
        summary: "Division of British India into India and Pakistan",
        description: "The partition resulted in mass migration and communal violence",
        description_hindi: "भारत का विभाजन",
        description_hinglish: "Bharat ka vibhajan",
        event_type: "point",
        year: 1947,
        date: new Date('1947-08-15'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "British India",
        tags: ["partition", "political"],
        periodName: "modern-india"
    },
    {
        title: "Republic Day of India",
        summary: "Constitution of India came into effect",
        description: "India became a republic with its own constitution",
        description_hindi: "भारत का गणतंत्र दिवस",
        description_hinglish: "Bharat ka Gantantra Divas",
        event_type: "point",
        year: 1950,
        date: new Date('1950-01-26'),
        location_type: "point",
        latitude: 28.6139,
        longitude: 77.209,
        place_name: "New Delhi",
        tags: ["republic", "constitution", "political"],
        periodName: "modern-india"
    },
    {
        title: "Green Revolution in India",
        summary: "Agricultural transformation period",
        description: "Introduction of high-yielding varieties of seeds and modern agricultural techniques",
        description_hindi: "भारत में हरित क्रांति",
        description_hinglish: "Bharat mein Harit Kranti",
        event_type: "period",
        start_year: 1960,
        end_year: 1970,
        start_date: new Date('1960-01-01'),
        end_date: new Date('1970-12-31'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["agriculture", "economic", "development"],
        periodName: "modern-india"
    },
    {
        title: "Chipko Movement",
        summary: "Forest conservation movement in Uttarakhand",
        description: "Grassroots environmental movement to protect trees from deforestation",
        description_hindi: "चिपको आंदोलन",
        description_hinglish: "Chipko Andolan",
        event_type: "period",
        start_year: 1973,
        end_year: 1981,
        start_date: new Date('1973-04-01'),
        end_date: new Date('1981-12-31'),
        location_type: "area",
        geographic_scope: "state",
        area_name: "Uttarakhand",
        latitude: 30.0668,
        longitude: 79.0193,
        tags: ["environmental", "social-movement"],
        periodName: "modern-india"
    },
    {
        title: "Operation Flood - White Revolution",
        summary: "Dairy development program",
        description: "World's largest dairy development program, making India the largest milk producer",
        description_hindi: "ऑपरेशन फ्लड - श्वेत क्रांति",
        description_hinglish: "Operation Flood - Shwet Kranti",
        event_type: "period",
        start_year: 1970,
        end_year: 1996,
        start_date: new Date('1970-01-01'),
        end_date: new Date('1996-12-31'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["agriculture", "dairy", "economic"],
        periodName: "modern-india"
    },
    {
        title: "Economic Liberalization",
        summary: "India's economic reforms",
        description: "Major economic reforms opening up the Indian economy to global markets",
        description_hindi: "आर्थिक उदारीकरण",
        description_hinglish: "Aarthik Udarikaran",
        event_type: "point",
        year: 1991,
        date: new Date('1991-07-24'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["economic", "reforms", "liberalization"],
        periodName: "modern-india"
    },
    {
        title: "Pokhran Nuclear Tests",
        summary: "India's nuclear weapons tests",
        description: "Series of nuclear bomb test explosions conducted by India",
        description_hindi: "पोखरण परमाणु परीक्षण",
        description_hinglish: "Pokhran Parmanu Parikshan",
        event_type: "point",
        year: 1998,
        date: new Date('1998-05-11'),
        location_type: "point",
        latitude: 27.0950,
        longitude: 71.7517,
        place_name: "Pokhran, Rajasthan",
        tags: ["nuclear", "defense", "science"],
        periodName: "modern-india"
    },
    {
        title: "Digital India Initiative",
        summary: "Government program for digital transformation",
        description: "Campaign to transform India into a digitally empowered society",
        description_hindi: "डिजिटल इंडिया पहल",
        description_hinglish: "Digital India Pahal",
        event_type: "period",
        start_year: 2015,
        end_year: 2025,
        start_date: new Date('2015-07-01'),
        end_date: new Date('2025-12-31'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["technology", "digital", "governance"],
        periodName: "modern-india"
    },
    
    // Additional Ancient India Events
    {
        title: "Birth of Gautama Buddha",
        summary: "Birth of the founder of Buddhism",
        description: "Siddhartha Gautama was born in Lumbini, who later became the Buddha",
        description_hindi: "गौतम बुद्ध का जन्म",
        description_hinglish: "Gautam Buddha ka janm",
        event_type: "point",
        year: -563,
        location_type: "point",
        latitude: 27.4833,
        longitude: 83.2764,
        place_name: "Lumbini",
        tags: ["religion", "buddhism", "philosophy"],
        periodName: "ancient-india"
    },
    {
        title: "Birth of Mahavira",
        summary: "Birth of the founder of Jainism",
        description: "Vardhamana Mahavira was born, founder of Jainism",
        description_hindi: "महावीर का जन्म",
        description_hinglish: "Mahavir ka janm",
        event_type: "point",
        year: -599,
        location_type: "point",
        latitude: 25.5941,
        longitude: 85.1376,
        place_name: "Vaishali",
        tags: ["religion", "jainism", "philosophy"],
        periodName: "ancient-india"
    },
    {
        title: "Alexander's Invasion of India",
        summary: "Alexander the Great invaded northwestern India",
        description: "Greek ruler Alexander crossed into India but was halted at the Beas River",
        description_hindi: "सिकंदर का भारत पर आक्रमण",
        description_hinglish: "Sikandar ka Bharat par aakraman",
        event_type: "point",
        year: -326,
        location_type: "area",
        geographic_scope: "region",
        area_name: "Northwest India",
        latitude: 31.7683,
        longitude: 75.5349,
        tags: ["invasion", "battle", "greek"],
        periodName: "ancient-india"
    },
    {
        title: "Chola Empire",
        summary: "South Indian Tamil dynasty",
        description: "One of the longest-ruling dynasties in southern India",
        description_hindi: "चोल साम्राज्य",
        description_hinglish: "Chola Samrajya",
        event_type: "period",
        start_year: 300,
        end_year: 1279,
        location_type: "area",
        geographic_scope: "region",
        area_name: "South India",
        latitude: 10.7905,
        longitude: 78.7047,
        tags: ["empire", "south-india", "dynasty"],
        periodName: "ancient-india"
    },
    {
        title: "Nalanda University Founded",
        summary: "Ancient center of learning established",
        description: "One of the world's first residential universities and a major center of Buddhist learning",
        description_hindi: "नालंदा विश्वविद्यालय की स्थापना",
        description_hinglish: "Nalanda Vishwavidyalaya ki sthapana",
        event_type: "point",
        year: 427,
        location_type: "point",
        latitude: 25.1358,
        longitude: 85.4479,
        place_name: "Nalanda, Bihar",
        tags: ["education", "buddhism", "university"],
        periodName: "ancient-india"
    },
    
    // Additional Medieval India Events
    {
        title: "Delhi Sultanate Period",
        summary: "Islamic sultanate ruling northern India",
        description: "Five successive dynasties ruled Delhi and parts of India",
        description_hindi: "दिल्ली सल्तनत काल",
        description_hinglish: "Delhi Saltanat kaal",
        event_type: "period",
        start_year: 1206,
        end_year: 1526,
        location_type: "area",
        geographic_scope: "region",
        area_name: "Northern India",
        latitude: 28.6139,
        longitude: 77.209,
        tags: ["sultanate", "islamic", "medieval"],
        periodName: "medieval-india"
    },
    {
        title: "Maratha Empire Rise",
        summary: "Maratha confederacy expansion",
        description: "Marathas established control over large parts of India under Shivaji and later rulers",
        description_hindi: "मराठा साम्राज्य का उदय",
        description_hinglish: "Maratha Samrajya ka uday",
        event_type: "period",
        start_year: 1674,
        end_year: 1818,
        location_type: "area",
        geographic_scope: "region",
        area_name: "Western and Central India",
        latitude: 18.5204,
        longitude: 73.8567,
        tags: ["maratha", "empire", "dynasty"],
        periodName: "medieval-india"
    },
    {
        title: "Construction of Taj Mahal",
        summary: "Monument built by Shah Jahan",
        description: "Mughal emperor Shah Jahan built the Taj Mahal in memory of his wife Mumtaz Mahal",
        description_hindi: "ताजमहल का निर्माण",
        description_hinglish: "Taj Mahal ka nirman",
        event_type: "point",
        year: 1653,
        location_type: "point",
        latitude: 27.1751,
        longitude: 78.0421,
        place_name: "Agra",
        tags: ["architecture", "mughal", "monument"],
        periodName: "medieval-india"
    },
    {
        title: "Shivaji's Coronation",
        summary: "Shivaji crowned as Chhatrapati",
        description: "Shivaji Bhonsle was formally crowned as the Chhatrapati (emperor) of the Maratha Empire",
        description_hindi: "शिवाजी का राज्याभिषेक",
        description_hinglish: "Shivaji ka rajyabhishek",
        event_type: "point",
        year: 1674,
        location_type: "point",
        latitude: 18.6476,
        longitude: 73.7333,
        place_name: "Raigad Fort",
        tags: ["maratha", "coronation", "shivaji"],
        periodName: "medieval-india"
    },
    {
        title: "Battle of Haldighati",
        summary: "Battle between Maharana Pratap and Mughals",
        description: "Famous battle between Maharana Pratap of Mewar and Mughal forces led by Man Singh",
        description_hindi: "हल्दीघाटी का युद्ध",
        description_hinglish: "Haldighati ka yuddh",
        event_type: "point",
        year: 1576,
        location_type: "point",
        latitude: 24.9945,
        longitude: 73.5416,
        place_name: "Haldighati, Rajasthan",
        tags: ["battle", "rajput", "mughal"],
        periodName: "medieval-india"
    },
    
    // Additional Modern India Events
    {
        title: "First War of Independence (1857 Revolt)",
        summary: "Major uprising against British rule",
        description: "Widespread rebellion against the British East India Company's rule in India",
        description_hindi: "प्रथम स्वतंत्रता संग्राम",
        description_hinglish: "Pratham Swatantrata Sangram",
        event_type: "point",
        year: 1857,
        location_type: "area",
        geographic_scope: "region",
        area_name: "Northern India",
        latitude: 28.6139,
        longitude: 77.209,
        tags: ["revolt", "independence", "british"],
        periodName: "modern-india"
    },
    {
        title: "Formation of Indian National Congress",
        summary: "Political party established",
        description: "Indian National Congress was founded, playing a crucial role in India's independence movement",
        description_hindi: "भारतीय राष्ट्रीय कांग्रेस की स्थापना",
        description_hinglish: "Bharatiya Rashtriya Congress ki sthapana",
        event_type: "point",
        year: 1885,
        location_type: "point",
        latitude: 18.9388,
        longitude: 72.8354,
        place_name: "Mumbai",
        tags: ["political", "independence", "congress"],
        periodName: "modern-india"
    },
    {
        title: "Jallianwala Bagh Massacre",
        summary: "British troops killed peaceful protesters",
        description: "British soldiers fired on unarmed civilians in Amritsar, killing hundreds",
        description_hindi: "जलियांवाला बाग हत्याकांड",
        description_hinglish: "Jallianwala Bagh hatyakand",
        event_type: "point",
        year: 1919,
        date: new Date('1919-04-13'),
        location_type: "point",
        latitude: 31.6200,
        longitude: 74.8765,
        place_name: "Amritsar, Punjab",
        tags: ["massacre", "british", "tragedy"],
        periodName: "modern-india"
    },
    {
        title: "Non-Cooperation Movement",
        summary: "Gandhi's mass protest campaign",
        description: "Nationwide movement led by Mahatma Gandhi against British rule",
        description_hindi: "असहयोग आंदोलन",
        description_hinglish: "Asahyog Andolan",
        event_type: "period",
        start_year: 1920,
        end_year: 1922,
        start_date: new Date('1920-09-01'),
        end_date: new Date('1922-02-12'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["movement", "gandhi", "independence"],
        periodName: "modern-india"
    },
    {
        title: "Salt March (Dandi March)",
        summary: "Gandhi's march to protest salt tax",
        description: "Mahatma Gandhi led a march to the Arabian Sea to make salt in defiance of British law",
        description_hindi: "नमक सत्याग्रह",
        description_hinglish: "Namak Satyagraha",
        event_type: "point",
        year: 1930,
        date: new Date('1930-03-12'),
        location_type: "point",
        latitude: 20.7153,
        longitude: 72.6640,
        place_name: "Dandi, Gujarat",
        tags: ["satyagraha", "gandhi", "protest"],
        periodName: "modern-india"
    },
    {
        title: "Quit India Movement",
        summary: "Demand for immediate British withdrawal",
        description: "Mass protest demanding an end to British rule in India",
        description_hindi: "भारत छोड़ो आंदोलन",
        description_hinglish: "Bharat Chhodo Andolan",
        event_type: "point",
        year: 1942,
        date: new Date('1942-08-08'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["movement", "independence", "british"],
        periodName: "modern-india"
    },
    {
        title: "Integration of Princely States",
        summary: "Unification of Indian states",
        description: "Sardar Patel led the integration of 562 princely states into the Indian Union",
        description_hindi: "रियासतों का एकीकरण",
        description_hinglish: "Riyasaton ka ekikaran",
        event_type: "period",
        start_year: 1947,
        end_year: 1949,
        start_date: new Date('1947-08-15'),
        end_date: new Date('1949-12-31'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["integration", "political", "unification"],
        periodName: "modern-india"
    },
    {
        title: "Indo-Pakistani War of 1965",
        summary: "War between India and Pakistan",
        description: "17-day war between India and Pakistan, primarily over Kashmir",
        description_hindi: "1965 का भारत-पाक युद्ध",
        description_hinglish: "1965 ka Bharat-Pak yuddh",
        event_type: "point",
        year: 1965,
        date: new Date('1965-09-01'),
        location_type: "area",
        geographic_scope: "region",
        area_name: "Kashmir and Punjab",
        tags: ["war", "pakistan", "conflict"],
        periodName: "modern-india"
    },
    {
        title: "Bangladesh Liberation War",
        summary: "India's support for Bangladesh independence",
        description: "War that led to the creation of Bangladesh from East Pakistan",
        description_hindi: "बांग्लादेश मुक्ति युद्ध",
        description_hinglish: "Bangladesh Mukti Yuddh",
        event_type: "point",
        year: 1971,
        date: new Date('1971-12-03'),
        location_type: "area",
        geographic_scope: "region",
        area_name: "East Pakistan (Bangladesh)",
        tags: ["war", "liberation", "bangladesh"],
        periodName: "modern-india"
    },
    {
        title: "Emergency Period in India",
        summary: "21-month period of authoritarian rule",
        description: "Prime Minister Indira Gandhi declared a state of emergency suspending civil liberties",
        description_hindi: "आपातकाल",
        description_hinglish: "Aapaatkal",
        event_type: "period",
        start_year: 1975,
        end_year: 1977,
        start_date: new Date('1975-06-25'),
        end_date: new Date('1977-03-21'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["emergency", "political", "authoritarian"],
        periodName: "modern-india"
    },
    {
        title: "Bhopal Gas Tragedy",
        summary: "World's worst industrial disaster",
        description: "Toxic gas leak from Union Carbide plant killed thousands",
        description_hindi: "भोपाल गैस त्रासदी",
        description_hinglish: "Bhopal Gas Trasadi",
        event_type: "point",
        year: 1984,
        date: new Date('1984-12-03'),
        location_type: "point",
        latitude: 23.2599,
        longitude: 77.4126,
        place_name: "Bhopal, Madhya Pradesh",
        tags: ["disaster", "tragedy", "industrial"],
        periodName: "modern-india"
    },
    {
        title: "Mandal Commission Implementation",
        summary: "Reservation policy for OBC categories",
        description: "Implementation of recommendations providing reservations for Other Backward Classes",
        description_hindi: "मंडल आयोग लागू",
        description_hinglish: "Mandal Aayog lagu",
        event_type: "point",
        year: 1990,
        date: new Date('1990-08-07'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["social", "reservation", "politics"],
        periodName: "modern-india"
    },
    {
        title: "Kargil War",
        summary: "Armed conflict with Pakistan",
        description: "India fought to recapture peaks in Kargil occupied by Pakistani infiltrators",
        description_hindi: "कारगिल युद्ध",
        description_hinglish: "Kargil Yuddh",
        event_type: "point",
        year: 1999,
        date: new Date('1999-05-03'),
        location_type: "point",
        latitude: 34.5539,
        longitude: 76.1311,
        place_name: "Kargil, Ladakh",
        tags: ["war", "pakistan", "military"],
        periodName: "modern-india"
    },
    {
        title: "Right to Information Act",
        summary: "Transparency legislation enacted",
        description: "Act empowering citizens to request information from public authorities",
        description_hindi: "सूचना का अधिकार अधिनियम",
        description_hinglish: "Suchna ka Adhikar Adhiniyam",
        event_type: "point",
        year: 2005,
        date: new Date('2005-10-12'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["legislation", "transparency", "governance"],
        periodName: "modern-india"
    },
    {
        title: "26/11 Mumbai Attacks",
        summary: "Terrorist attacks in Mumbai",
        description: "Series of terrorist attacks across Mumbai lasting four days",
        description_hindi: "26/11 मुंबई हमले",
        description_hinglish: "26/11 Mumbai Hamle",
        event_type: "point",
        year: 2008,
        date: new Date('2008-11-26'),
        location_type: "point",
        latitude: 18.9388,
        longitude: 72.8354,
        place_name: "Mumbai",
        tags: ["terrorism", "attack", "security"],
        periodName: "modern-india"
    },
    {
        title: "Mars Orbiter Mission (Mangalyaan)",
        summary: "India's first interplanetary mission",
        description: "ISRO successfully placed a spacecraft in Mars orbit on first attempt",
        description_hindi: "मंगल यान मिशन",
        description_hinglish: "Mangal Yaan Mission",
        event_type: "point",
        year: 2014,
        date: new Date('2014-09-24'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["space", "science", "achievement"],
        periodName: "modern-india"
    },
    
    // Current Affairs
    {
        title: "COVID-19 Pandemic in India",
        summary: "Coronavirus pandemic impacts India",
        description: "India faced multiple waves of COVID-19 pandemic affecting millions",
        description_hindi: "भारत में कोविड-19 महामारी",
        description_hinglish: "Bharat mein COVID-19 Mahamari",
        event_type: "period",
        start_year: 2020,
        end_year: 2023,
        start_date: new Date('2020-03-01'),
        end_date: new Date('2023-05-31'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["pandemic", "health", "crisis"],
        periodName: "current-affairs"
    },
    {
        title: "Chandrayaan-3 Moon Landing",
        summary: "India's successful lunar mission",
        description: "ISRO's Chandrayaan-3 successfully landed on the Moon's south pole",
        description_hindi: "चंद्रयान-3 चंद्रमा पर उतरा",
        description_hinglish: "Chandrayaan-3 Chandrama par utra",
        event_type: "point",
        year: 2023,
        date: new Date('2023-08-23'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["space", "science", "achievement"],
        periodName: "current-affairs"
    },
    {
        title: "Demonetization",
        summary: "Ban on high-value currency notes",
        description: "Government banned ₹500 and ₹1000 notes to curb black money",
        description_hindi: "नोटबंदी",
        description_hinglish: "Notebandi",
        event_type: "point",
        year: 2016,
        date: new Date('2016-11-08'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["economic", "currency", "reform"],
        periodName: "current-affairs"
    },
    {
        title: "GST Implementation",
        summary: "Goods and Services Tax rolled out",
        description: "India implemented unified tax system replacing multiple indirect taxes",
        description_hindi: "जीएसटी लागू",
        description_hinglish: "GST lagu",
        event_type: "point",
        year: 2017,
        date: new Date('2017-07-01'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["tax", "economic", "reform"],
        periodName: "current-affairs"
    },
    {
        title: "Abrogation of Article 370",
        summary: "Special status of Jammu & Kashmir revoked",
        description: "Constitutional provisions granting special status to J&K were revoked",
        description_hindi: "अनुच्छेद 370 निरस्त",
        description_hinglish: "Anuchchhed 370 nirast",
        event_type: "point",
        year: 2019,
        date: new Date('2019-08-05'),
        location_type: "area",
        geographic_scope: "state",
        area_name: "Jammu and Kashmir",
        tags: ["constitutional", "political", "kashmir"],
        periodName: "current-affairs"
    },
    {
        title: "Ram Mandir Construction",
        summary: "Construction of Ram Temple in Ayodhya",
        description: "Supreme Court verdict paved way for construction of Ram temple at disputed site",
        description_hindi: "राम मंदिर निर्माण",
        description_hinglish: "Ram Mandir nirman",
        event_type: "period",
        start_year: 2020,
        end_year: 2024,
        start_date: new Date('2020-08-05'),
        end_date: new Date('2024-01-22'),
        location_type: "point",
        latitude: 26.7922,
        longitude: 82.1998,
        place_name: "Ayodhya, Uttar Pradesh",
        tags: ["temple", "religious", "construction"],
        periodName: "current-affairs"
    },
    {
        title: "New Education Policy 2020",
        summary: "Major education reform in India",
        description: "Comprehensive overhaul of India's education system after 34 years",
        description_hindi: "नई शिक्षा नीति 2020",
        description_hinglish: "Nayi Shiksha Niti 2020",
        event_type: "point",
        year: 2020,
        date: new Date('2020-07-29'),
        location_type: "area",
        geographic_scope: "country",
        area_name: "India",
        tags: ["education", "reform", "policy"],
        periodName: "current-affairs"
    },
    {
        title: "Farmers' Protest Movement",
        summary: "Massive protest against farm laws",
        description: "Farmers protested against three agricultural reform bills for over a year",
        description_hindi: "किसान आंदोलन",
        description_hinglish: "Kisan Andolan",
        event_type: "period",
        start_year: 2020,
        end_year: 2021,
        start_date: new Date('2020-11-26'),
        end_date: new Date('2021-11-19'),
        location_type: "area",
        geographic_scope: "region",
        area_name: "Punjab and Haryana",
        latitude: 28.7041,
        longitude: 77.1025,
        tags: ["protest", "agriculture", "movement"],
        periodName: "current-affairs"
    },
    {
        title: "India's G20 Presidency",
        summary: "India hosts G20 summit",
        description: "India held the G20 presidency and hosted the summit in New Delhi",
        description_hindi: "भारत की जी20 अध्यक्षता",
        description_hinglish: "Bharat ki G20 Adhyakshta",
        event_type: "point",
        year: 2023,
        date: new Date('2023-09-09'),
        location_type: "point",
        latitude: 28.6139,
        longitude: 77.209,
        place_name: "New Delhi",
        tags: ["diplomacy", "international", "summit"],
        periodName: "current-affairs"
    }
];

// Additional event ideas to reach 50-100 events
const additionalEventIdeas = [
    // More Ancient events
    { title: "Birth of Buddha", year: -563, type: "point", period: "ancient" },
    { title: "Birth of Mahavira", year: -599, type: "point", period: "ancient" },
    { title: "Alexander's Invasion", year: -326, type: "point", period: "ancient" },
    { title: "Chola Empire", start_year: 300, end_year: 1279, type: "period", period: "ancient" },
    { title: "Nalanda University Founded", year: 427, type: "point", period: "ancient" },
    
    // More Medieval events
    { title: "Delhi Sultanate Period", start_year: 1206, end_year: 1526, type: "period", period: "medieval" },
    { title: "Maratha Empire Rise", start_year: 1674, end_year: 1818, type: "period", period: "medieval" },
    { title: "Construction of Taj Mahal", year: 1653, type: "point", period: "medieval" },
    { title: "Shivaji Coronation", year: 1674, type: "point", period: "medieval" },
    { title: "Battle of Haldighati", year: 1576, type: "point", period: "medieval" },
    
    // More Modern events
    { title: "First War of Independence", year: 1857, type: "point", period: "modern" },
    { title: "Formation of INC", year: 1885, type: "point", period: "modern" },
    { title: "Jallianwala Bagh Massacre", year: 1919, date: "1919-04-13", type: "point", period: "modern" },
    { title: "Non-Cooperation Movement", start_year: 1920, end_year: 1922, type: "period", period: "modern" },
    { title: "Salt March", year: 1930, date: "1930-03-12", type: "point", period: "modern" },
    { title: "Quit India Movement", year: 1942, date: "1942-08-08", type: "point", period: "modern" },
    { title: "Integration of Princely States", start_year: 1947, end_year: 1949, type: "period", period: "modern" },
    { title: "Indo-Pak War 1965", year: 1965, date: "1965-09-01", type: "point", period: "modern" },
    { title: "Indo-Pak War 1971", year: 1971, date: "1971-12-03", type: "point", period: "modern" },
    { title: "Emergency Period", start_year: 1975, end_year: 1977, type: "period", period: "modern" },
    { title: "Bhopal Gas Tragedy", year: 1984, date: "1984-12-03", type: "point", period: "modern" },
    { title: "Mandal Commission Implementation", year: 1990, date: "1990-08-07", type: "point", period: "modern" },
    { title: "Kargil War", year: 1999, date: "1999-05-03", type: "point", period: "modern" },
    { title: "Right to Information Act", year: 2005, date: "2005-10-12", type: "point", period: "modern" },
    { title: "26/11 Mumbai Attacks", year: 2008, date: "2008-11-26", type: "point", period: "modern" },
    { title: "Mars Orbiter Mission", year: 2014, date: "2014-09-24", type: "point", period: "modern" },
    
    // Current Affairs
    { title: "Demonetization", year: 2016, date: "2016-11-08", type: "point", period: "current-affairs" },
    { title: "GST Implementation", year: 2017, date: "2017-07-01", type: "point", period: "current-affairs" },
    { title: "Abrogation of Article 370", year: 2019, date: "2019-08-05", type: "point", period: "current-affairs" },
    { title: "Ram Mandir Construction", start_year: 2020, end_year: 2024, type: "period", period: "current-affairs" },
    { title: "New Education Policy", year: 2020, date: "2020-07-29", type: "point", period: "current-affairs" },
    { title: "Farmers' Protest", start_year: 2020, end_year: 2021, type: "period", period: "current-affairs" }
];

async function createDemoEvents() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB\n');

        // Fetch all periods
        const periods = await Period.find({});
        console.log(`Found ${periods.length} periods in database\n`);

        if (periods.length === 0) {
            console.log('⚠️  No periods found in database. Please seed periods first.');
            return;
        }

        // Create a map of period names to IDs
        const periodMap = {};
        periods.forEach(period => {
            const name = period.name.toLowerCase().replace(/\s+/g, '-');
            periodMap[name] = period._id;
            console.log(`Period: ${period.name} (${name}) -> ${period._id}`);
        });
        console.log('');

        // Count existing events to avoid duplicates
        const existingCount = await Event.countDocuments({});
        console.log(`Existing events in database: ${existingCount}\n`);

        let createdCount = 0;
        let skippedCount = 0;

        // Create events from templates
        console.log('Creating demo events from templates...\n');
        
        for (const template of demoEventTemplates) {
            try {
                const periodId = periodMap[template.periodName];
                if (!periodId) {
                    console.log(`⚠️  Period not found: ${template.periodName} for event: ${template.title}`);
                    skippedCount++;
                    continue;
                }

                // Check if event already exists
                const existing = await Event.findOne({ title: template.title });
                if (existing) {
                    console.log(`⚠️  Event already exists: ${template.title}`);
                    skippedCount++;
                    continue;
                }

                const eventData = { ...template };
                delete eventData.periodName;
                eventData.period_id = periodId;

                const event = await Event.create(eventData);
                console.log(`✅ Created: ${event.title} (${event.event_type}, ${event.location_type || 'point'})`);
                createdCount++;

            } catch (error) {
                console.log(`❌ Error creating event "${template.title}": ${error.message}`);
                skippedCount++;
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('DEMO EVENT CREATION SUMMARY');
        console.log('='.repeat(60));
        console.log(`Events created: ${createdCount}`);
        console.log(`Events skipped: ${skippedCount}`);
        console.log(`Total events in database: ${existingCount + createdCount}`);
        console.log('');

        // Display event type breakdown
        const pointEvents = await Event.countDocuments({ event_type: 'point' });
        const periodEvents = await Event.countDocuments({ event_type: 'period' });
        const pointLocations = await Event.countDocuments({ location_type: 'point' });
        const areaLocations = await Event.countDocuments({ location_type: 'area' });

        console.log('Event Type Breakdown:');
        console.log(`  Point Events: ${pointEvents}`);
        console.log(`  Period Events: ${periodEvents}`);
        console.log('');
        console.log('Location Type Breakdown:');
        console.log(`  Point Locations: ${pointLocations}`);
        console.log(`  Area Locations: ${areaLocations}`);
        console.log('');

        console.log('✨ Demo event creation complete!\n');

        if (createdCount < 50) {
            console.log(`💡 Note: Only ${createdCount} events were created.`);
            console.log(`   You can add more events using the templates in the script.`);
            console.log(`   See additionalEventIdeas array for suggestions.`);
        }

    } catch (error) {
        console.error('Error creating demo events:', error);
    } finally {
        await mongoose.connection.close();
        console.log('MongoDB connection closed');
    }
}

createDemoEvents().catch(console.error);
