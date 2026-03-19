const { connectDB } = require('../db');
require('dotenv').config();

const Category = require('../models/Category');
const Shayari = require('../models/Shayari');
const Music = require('../models/Music');
const Podcast = require('../models/Podcast');
const Ebook = require('../models/Ebook');

const Admin = require('../models/Admin');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        await connectDB();

        // Clear existing data
        await Category.deleteMany({});
        await Shayari.deleteMany({});
        await Music.deleteMany({});
        await Podcast.deleteMany({});
        await Ebook.deleteMany({});
        await Admin.deleteMany({});
        await User.deleteMany({});

        const hashedPassword = await bcrypt.hash('admin123', 10);
        await Admin.create({ 
            username: 'admin', 
            password: hashedPassword, 
            email: 'admin@ansh.com', 
            profile_name: 'Ansh Sharma' 
        });

        const userPassword = await bcrypt.hash('user123', 10);
        await User.create({
            username: 'testuser',
            email: 'user@ansh.com',
            password: userPassword
        });

        // 1. Categories
        const categories = await Category.insertMany([
            { section: 'shayari', name: 'Love' },
            { section: 'shayari', name: 'Sad' },
            { section: 'music', name: 'Pop' },
            { section: 'music', name: 'Lo-Fi' },
            { section: 'podcast', name: 'Stories' },
            { section: 'ebook', name: 'Fiction' }
        ]);

        const catMap = {};
        categories.forEach(c => catMap[`${c.section}_${c.name}`] = c._id);

        // 2. Shayari
        await Shayari.insertMany([
            { content: 'Mohabbat bhi kya cheez hai...', likes_count: 120, category_id: catMap['shayari_Love'] },
            { content: 'Zindagi ki raahon mein...', likes_count: 85, category_id: catMap['shayari_Sad'] }
        ]);

        // 3. Music
        await Music.insertMany([
            { title: 'Soulful Winds', artist: 'Ansh Sharma', file_url: '#', cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&q=80', category_id: catMap['music_Lo-Fi'] }
        ]);

        // 4. Podcasts
        await Podcast.insertMany([
            { title: 'The Silent Journey', description: 'A story about inner peace and finding yourself.', file_url: '#', thumbnail_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=500&q=80' }
        ]);

        // 5. Ebooks
        await Ebook.insertMany([
            { title: 'Digital Sanctuary', description: 'A guide to modern mindfulness.', author: 'Ansh Sharma', file_url: '#', cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80', price: 0 }
        ]);

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seedData();
