const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Category = require('../models/Category');
const Podcast = require('../models/Podcast');

const sampleNews = [
    {
        title: "India's Tech Boom: Bangalore's AI Revolution",
        description: "Bangalore continues to lead India's tech evolution with a new wave of AI-driven startups attracting global investment. Experts predict a 40% growth in the sector this fiscal year.",
        file_url: "https://www.reuters.com/technology",
        thumbnail_url: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?auto=format&fit=crop&q=80&w=800",
        duration: "Read time: 5 mins"
    },
    {
        title: "Cricket Update: India Dominates in Home Series",
        description: "A spectacular performance by the top order ensures a commanding lead for India in the ongoing test series against Australia. Fans celebrate across the nation.",
        file_url: "https://www.espncricinfo.com",
        thumbnail_url: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&q=80&w=800",
        duration: "Read time: 3 mins"
    },
    {
        title: "Cultural Spotlight: Varanasi's Gange Aarti Goes Viral",
        description: "Breathtaking drone footage of the evening Aarti in Varanasi captures the hearts of millions worldwide, boosting spiritual tourism in North India.",
        file_url: "https://www.incredibleindia.org",
        thumbnail_url: "https://images.unsplash.com/photo-1518105027582-706dcc6d6ff0?auto=format&fit=crop&q=80&w=800",
        duration: "Experience: 8 mins"
    }
];

async function seed() {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        let newsCategory = await Category.findOne({ name: 'Trending' });
        if (!newsCategory) {
            newsCategory = await Category.create({ name: 'Trending', section: 'podcasts' });
        }

        console.log('Clearing existing news items...');
        // await Podcast.deleteMany({}); // Optional: clear existing

        for (const news of sampleNews) {
            await Podcast.create({
                ...news,
                category_id: newsCategory._id
            });
            console.log(`Added: ${news.title}`);
        }

        console.log('Seeding complete!');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        mongoose.connection.close();
    }
}

seed();
