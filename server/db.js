const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

let mongod = null;

async function connectDB() {
    try {
        let uri = process.env.MONGODB_URI;

        if (!uri) {
            console.log('🍃 No MONGODB_URI found. Starting MongoMemoryServer...');
            if (mongod) {
                console.log('🛑 Stopping existing MongoMemoryServer...');
                await mongod.stop();
            }
            console.log('📦 Creating new MongoMemoryServer instance (this may take time if binary is downloading)...');
            mongod = await MongoMemoryServer.create();
            uri = mongod.getUri();
            console.log('✅ MongoMemoryServer live at:', uri);
        }

        console.log('🔗 Connecting mongoose to:', uri);
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000 // 30 second timeout for cloud stability
        });
        console.log('💎 MongoDB Connected Successfully');
        await autoSeed();
    } catch (err) {
        console.error('❌ Connection Error:', err.message);
        // We will allow the server to start, but subsequent DB operations will fail fast
    }
}

async function autoSeed() {
    const Category = require('./models/Category');
    const Admin = require('./models/Admin');
    const Settings = require('./models/Settings');
    const Shayari = require('./models/Shayari');
    const Music = require('./models/Music');
    const Podcast = require('./models/Podcast');
    const Ebook = require('./models/Ebook');
    const bcrypt = require('bcryptjs');

    try {
        // Check if data already exists to avoid wiping on every restart
        const adminCount = await Admin.countDocuments();
        const forceSeed = process.env.SEED_FORCE === 'true';

        if (adminCount > 0 && !forceSeed) {
            console.log('✅ Database already has data. Skipping auto-seed.');
            return;
        }

        if (forceSeed) {
            console.log('🧹 FORCE_SEED detected. Purging existing data...');
            await Promise.all([
                Category.deleteMany({}),
                Admin.deleteMany({}),
                Settings.deleteMany({}),
                Shayari.deleteMany({}),
                Music.deleteMany({}),
                Podcast.deleteMany({}),
                Ebook.deleteMany({})
            ]);
        } else {
            console.log('🌱 Database is empty. Starting initial seed...');
        }

        // 1. Settings
        await Settings.insertMany([
            { key: 'google_adsense', value: '<!-- AdSense -->', description: 'AdSense script' },
            { key: 'meta_tags', value: '<meta name="description" content="THE ALFAZ-E-DIARIES - Premium Shayari & E-books">', description: 'SEO Meta Tags' }
        ]);

        // 2. Admin
        const hashedPassword = await bcrypt.hash('ansh@sh2002', 10);
        await Admin.create({
            username: 'anshsharma2026',
            password: hashedPassword,
            email: 'anshbgmi24@gmail.com',
            profile_name: 'Ansh Sharma'
        });

        // 3. Categories (Meticulously synced with screenshots)
        const categories = await Category.insertMany([
            { section: 'shayari', name: 'Love' },
            { section: 'shayari', name: 'Sad' },
            { section: 'shayari', name: 'Motivation' },
            { section: 'shayari', name: 'Life' },
            { section: 'shayari', name: 'Romantic' },
            { section: 'shayari', name: 'Attitude' },
            { section: 'shayari', name: 'Friendship' },
            { section: 'shayari', name: 'Funny' },
            { section: 'shayari', name: 'Heartbreak' },
            { section: 'music', name: 'Pop' },
            { section: 'music', name: 'Classical' },
            { section: 'music', name: 'Lo-Fi' },
            { section: 'podcasts', name: 'Stories' },
            { section: 'ebooks', name: 'Poetry' },
            { section: 'ebooks', name: 'Self-help' }
        ]);

        const catMap = {};
        categories.forEach(c => catMap[`${c.section}_${c.name}`] = c._id);

        // 4. Sample Content (High Quality)
        await Shayari.create({
            content: 'Zindagi mein koshish karte raho,\nManzil mile ya na mile,\nRaaste ki haseen yaadein\nZindagi sanwar deti hai.',
            likes_count: 524,
            category_id: catMap['shayari_Life']
        });

        await Music.create({
            title: 'Whispering Heart',
            artist: 'Ansh Sharma',
            cover_url: 'https://images.unsplash.com/photo-1514525253361-bee8d48700df?w=500&q=80',
            file_url: '#',
            duration: '3:20',
            category_id: catMap['music_Lo-Fi']
        });

        console.log('🚀 Clean premium data seeded successfully!');
    } catch (err) {
        console.error('⚠️ Seed failed:', err.message);
    }
}

async function closeDB() {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
}

module.exports = { connectDB, closeDB };
