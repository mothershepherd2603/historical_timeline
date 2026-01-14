const mongoose = require('mongoose');
const Event = require('./models/Event');
const Period = require('./models/Period');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/historical_timeline')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

async function addCurrentAffairs() {
    try {
        console.log('Adding Current Affairs for 10-01-2026...\n');
        
        // Get Current Affairs period
        const currentPeriod = await Period.findOne({ name: 'Current Affairs' });
        if (!currentPeriod) {
            console.error('Current Affairs period not found!');
            process.exit(1);
        }

        const events = [
            {
                title: 'Supreme Court Denies Bail in Delhi Riots Case Under UAPA',
                summary: 'Supreme Court of India denied bail in 2020 Delhi riots case, relying on wide definition of "terrorist act" under Section 15 of UAPA 1967, renewing debate on anti-terror law expansion.',
                description: `The Supreme Court of India denied bail in the 2020 Delhi riots case, relying on the wide definition of a "terrorist act" under Section 15 of the Unlawful Activities (Prevention) Act, 1967. This decision has renewed debate on how the anti-terror law has expanded far beyond conventional notions of terrorism. The UAPA has evolved from a limited post-Independence law into a wide-ranging anti-terror framework, with Section 15's broad definition of terrorism and stringent bail norms extending the law far beyond conventional notions of terrorism. While the UAPA remains crucial for national security and global counterterror commitments, targeted reforms such as clearer definitions, fairer bail provisions, speedy trials, compensation for wrongful detention, and stronger oversight are essential to balance security with democratic values. The law traces its origins to the National Integration Council formed under Jawaharlal Nehru, aimed at tackling communalism, regionalism, and linguistic chauvinism. Key amendments include: 2004 Amendment introducing terrorism, 2008 Amendment after 26/11 Mumbai attacks widening Section 15, 2012 Amendment expanding to economic security, and 2019 Amendment permitting designation of individuals as terrorists. Arguments favor protection of national security and international alignment, while concerns include violations of Article 21, arbitrary designations, overbroad definitions, and criminalization of dissent.`,
                year: 2026,
                date: new Date('2026-01-10'),
                period_id: currentPeriod._id,
                latitude: 28.6139,
                longitude: 77.2090,
                tags: ['political', 'legal', 'social', 'security'],
                media_ids: []
            },
            {
                title: 'UAPA 1967 - Evolution and Constitutional Implications',
                summary: 'Analysis of Unlawful Activities (Prevention) Act 1967 evolution from post-Independence law to comprehensive anti-terror framework, examining balance between national security and civil liberties.',
                description: `The UAPA, 1967 is India's principal anti-terror and national security law to curb activities threatening sovereignty, unity, and integrity of India. Originally enacted in 1967, the law initially targeted unlawful activities threatening India's sovereignty and territorial integrity in the post-Independence period marked by secessionist and anti-national movements, and did not address terrorism in its original form. The law has undergone significant evolution through multiple amendments: The 2004 Amendment introduced terrorism into the UAPA by adding Chapter IV (Sections 15–23) on terrorist acts and punishments. The 2008 Amendment after the 26/11 Mumbai terror attacks widened Section 15 by adding "by any other means," tightened bail norms, extended custody periods, and introduced presumption of guilt. The 2012 Amendment expanded definition to include threats to economic security, covering financial, food, energy, livelihood, and environmental security. The 2019 Amendment permitted designation of individuals as terrorists and enhanced National Investigation Agency powers. Under Section 15, a "terrorist act" is defined as any act committed with intent to threaten unity, integrity, sovereignty, security, or economic security of India, or to strike terror among people. Reforms needed include clarifying vague definitions, reforming stringent bail provisions, ensuring speedy trials (less than 3% conviction rate 2015-2020), introducing compensation framework for wrongful detention, and strengthening oversight and transparency.`,
                year: 2026,
                date: new Date('2026-01-10'),
                period_id: currentPeriod._id,
                latitude: 28.6139,
                longitude: 77.2090,
                tags: ['political', 'legal', 'history'],
                media_ids: []
            },
            {
                title: 'Transgender Healthcare Discrimination and Systemic Barriers Highlighted',
                summary: 'Reports reveal trans men and gender-diverse persons face severe discrimination in healthcare access, with 27% refused medical care, highlighting gaps in transgender welfare implementation.',
                description: `Recent reports highlight that trans men and gender-diverse persons assigned female at birth (AFAB) continue to face systemic discrimination, medical ignorance, and structural barriers in accessing even basic healthcare. This has brought renewed attention to the gaps in affirmative, ethical, and evidence-based transgender welfare in India. Nearly 27% report being refused medical care due to their gender identity. Healthcare lacks training on trans men, leading to misgendering, denial of care, and reliance on untrained gynecologists due to binary gender views and invisibility. Barriers force unsafe self-medication risking stroke/kidney disease amid no pan-India protocols or affirming specialists. Major challenges include social stigma causing alarming suicide rates (31% dying by suicide, 50% attempting before age 20), economic exclusion with 92% affected and 48% unemployment rate, barriers in education with literacy rate at 56.1% compared to national 74%, ineffective legal implementation with National Portal issuing only 277 certificates since 2020, and political under-representation. Despite progressive laws like Transgender Persons (Protection of Rights) Act 2019 and landmark judicial rulings including NALSA v. Union of India (2014), implementation gaps and societal stigma remain major hurdles. According to Census 2011, India has a transgender population of approximately 4.88 lakh, with top states being Uttar Pradesh, Andhra Pradesh, and Maharashtra.`,
                year: 2026,
                date: new Date('2026-01-10'),
                period_id: currentPeriod._id,
                latitude: 28.6139,
                longitude: 77.2090,
                tags: ['social', 'healthcare', 'rights', 'gender'],
                media_ids: []
            },
            {
                title: 'Transgender Welfare in India - Legal Framework and Implementation Gaps',
                summary: 'Analysis of transgender welfare measures in India including judicial interventions, legislative framework, and welfare schemes, highlighting need for convergent action in legal enforcement.',
                description: `Transgender persons in India face systemic discrimination in healthcare, education, and the economy despite landmark laws and judicial interventions. Key judicial interventions include NALSA v. Union of India (2014) legally recognizing transgender persons as third gender, Puttaswamy v. Union of India (2017) declaring right to privacy including protection of sexual orientation, Navtej Singh Johar v. Union of India (2018) decriminalizing consensual same-sex relations, and Ms. X v. State of Karnataka (2024) upholding right to change name and gender on birth certificates. The Transgender Persons (Protection of Rights) Act, 2019 provides legal framework prohibiting discrimination, allows self-identification through District Magistrate-issued Certificate, and establishes National Council for Transgender Persons. Welfare schemes include SMILE Scheme for livelihood support, Ayushman Bharat TG Plus providing Rs 5 lakh health insurance, Transgender Pension Scheme, and National Portal for Transgender Persons. State-level initiatives show Kerala providing university reservations, Maharashtra establishing welfare cells, and Tamil Nadu pioneering free gender-affirming surgeries. However, major challenges persist: healthcare access with medical discrimination, social stigma causing mental health crisis, economic exclusion with 92% affected, barriers in education with 56.1% literacy rate, ineffective legal implementation with only 16% application processing rate, and minimal political representation. Empowerment requires full enforcement of existing laws, economic inclusion through job reservations like Karnataka's 1% quota, accessible healthcare including gender-affirming treatments under Ayushman Bharat, and sustained social awareness campaigns.`,
                year: 2026,
                date: new Date('2026-01-10'),
                period_id: currentPeriod._id,
                latitude: 19.0760,
                longitude: 72.8777,
                tags: ['social', 'legal', 'rights', 'welfare'],
                media_ids: []
            },
            {
                title: 'National Council for Transgender Persons - Policy Framework and Challenges',
                summary: 'Establishment and functioning of NCTP under 2019 Act for policy oversight, examining welfare schemes, electoral measures, and administrative initiatives for transgender empowerment.',
                description: `The National Council for Transgender Persons (NCTP) was constituted in 2020 under the Transgender Persons (Protection of Rights) Act, 2019 for policy oversight and grievances. The legislative framework provides for prohibition of discrimination in education, employment, healthcare, housing, and public services. The Transgender Persons (Protection of Rights) Rules, 2020 lay down procedures for identity certification and operationalize non-discrimination mandates. Electoral measures include Election Commission's 2009 directive introducing "Others" gender option, with voter turnout rising to 25% in 2024 Lok Sabha polls. Welfare schemes operational include SMILE Scheme (Support for Marginalised Individuals for Livelihood and Enterprise) as umbrella scheme for livelihood, education, health, and shelter through Garima Greh sub-scheme, Ayushman Bharat TG Plus providing health insurance of Rs 5 lakh per beneficiary, and Transgender Pension Scheme under Indira Gandhi National Disability Pension Scheme. Administrative measures include 2022 Ministry of Home Affairs guidelines ensuring privacy, safety, and dignity of transgender inmates in prisons. Despite these frameworks, implementation remains weak with National Portal having processed only 16% of applications and issued merely 277 certificates since November 2020 launch. Further measures required include full enforcement through efficient grievance redressal cells, economic inclusion scaling up successful models like Karnataka's 1% job reservation and Tata Steel's diversity hiring, accessible healthcare with gender-affirming treatments covered under insurance, and social awareness through campaigns like "I Am Also Human" and cultural advocacy such as Koovagam Festival in Tamil Nadu.`,
                year: 2026,
                date: new Date('2026-01-10'),
                period_id: currentPeriod._id,
                latitude: 28.6139,
                longitude: 77.2090,
                tags: ['political', 'social', 'welfare', 'policy'],
                media_ids: []
            }
        ];

        // Insert events
        console.log(`Inserting ${events.length} current affairs events...`);
        const result = await Event.insertMany(events);
        
        console.log(`\n✓ Successfully added ${result.length} current affairs events for 10-01-2026`);
        console.log('\nEvents added:');
        result.forEach((event, index) => {
            console.log(`${index + 1}. ${event.title}`);
            console.log(`   Year: ${event.year}`);
            console.log(`   Tags: ${event.tags.join(', ')}`);
            console.log('');
        });

        process.exit(0);
    } catch (error) {
        console.error('Error adding current affairs:', error);
        process.exit(1);
    }
}

// Run the function
addCurrentAffairs();
