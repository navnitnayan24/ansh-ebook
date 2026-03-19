require('dotenv').config();
const mongoose = require('mongoose');
const Shayari = require('./models/Shayari');
const Music = require('./models/Music');
const Podcast = require('./models/Podcast');
const Ebook = require('./models/Ebook');

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Shayari.deleteMany({});
        await Music.deleteMany({});
        await Podcast.deleteMany({});
        await Ebook.deleteMany({});

        // Seed Shayari
        await Shayari.insertMany([
            { content: 'Dil se nikli baat, seedhe dil tak jati hai.', category: 'Love' },
            { content: 'Andheron se mat dar, sitare wahin chamakte hain.', category: 'Motivation' },
            { content: 'Khamoshi mein bhi ek shor hota hai, bas sunne wala chahiye.', category: 'Sad' }
        ]);

        // Seed Music
        await Music.insertMany([
            { title: 'Soulful Melody', file_url: '/mock-audio.mp3', cover_url: '/mock-cover.jpg', category: 'Instrumental' },
            { title: 'Deep Thoughts', file_url: '/mock-audio.mp3', cover_url: '/mock-cover.jpg', category: 'Lo-fi' }
        ]);

        // Seed Podcasts
        await Podcast.insertMany([
            { title: 'Episode 1: The Beginning', description: 'Exploring the journey of writing.', file_url: '/mock-audio.mp3', thumbnail_url: '/mock-pod.jpg' },
            { title: 'Episode 2: Facing Fears', description: 'A deep dive into overcoming obstacles.', file_url: '/mock-audio.mp3', thumbnail_url: '/mock-pod.jpg' }
        ]);

        // Seed Ebooks
        await Ebook.insertMany([
            { title: 'The Art of Words', description: 'A comprehensive guide to modern poetry.', price: 499, category: 'Literature' },
            { title: 'Mindset Mastery', description: 'Daily affirmations for creators.', price: 0, category: 'Self-Help' }
        ]);

        console.log('Database seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
