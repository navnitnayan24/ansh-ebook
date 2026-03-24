const mongoose = require('mongoose');

async function connectDB() {
    try {
        const uri = process.env.MONGODB_URI;

        if (!uri) {
            console.error('❌ FATAL ERROR: MONGODB_URI is not defined!');
            throw new Error('MONGODB_URI is missing. Set it in Render dashboard.');
        }

        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 30000 
        });
        console.log('💎 MongoDB Connected Successfully');
        await autoSeed();
    } catch (err) {
        console.error('❌ Connection Error:', err.message);
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
        const adminCount = await Admin.countDocuments();
        const forceSeed = process.env.SEED_FORCE === 'true';

        if (adminCount > 0 && !forceSeed) {
            console.log('✅ Database already has data. Skipping auto-seed.');
            return;
        }

        if (forceSeed) {
            console.log('🧹 FORCE_SEED detected. Purging data...');
            await Promise.all([
                Category.deleteMany({}),
                Admin.deleteMany({}),
                Settings.deleteMany({}),
                Shayari.deleteMany({}),
                Music.deleteMany({}),
                Podcast.deleteMany({}),
                Ebook.deleteMany({})
            ]);
        }

        // 1. Settings
        await Settings.insertMany([
            { key: 'google_adsense', value: '<!-- AdSense -->', description: 'AdSense script' },
            { key: 'meta_tags', value: '<meta name="description" content="THE ALFAZ-E-DIARIES - Premium Shayari & E-books">', description: 'SEO Meta Tags' }
        ]);

        // 2. Admin
        const adminUsername = 'ansh24';
        const adminEmail = 'anshbgmi24@gmail.com';
        const adminPassword = await bcrypt.hash('ansh@sh2002', 10);
        
        await Admin.findOneAndUpdate(
            { $or: [{ username: adminUsername }, { email: adminEmail }] },
            { 
                username: adminUsername,
                password: adminPassword,
                email: adminEmail,
                profile_name: 'Ansh Sharma'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        // 3. Categories
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
            { section: 'music', name: 'Soulful' },
            { section: 'music', name: 'Instrumental' },
            { section: 'music', name: 'Devotional' },
            { section: 'music', name: 'Hip-Hop' },
            { section: 'music', name: 'Folk' },
            { section: 'music', name: 'Cinematic' },
            { section: 'podcasts', name: 'Stories' },
            { section: 'podcasts', name: 'Interviews' },
            { section: 'podcasts', name: 'Growth' },
            { section: 'podcasts', name: 'Tech' },
            { section: 'podcasts', name: 'Crime' },
            { section: 'podcasts', name: 'Comedy' },
            { section: 'podcasts', name: 'Mythology' },
            { section: 'podcasts', name: 'Poetry' },
            { section: 'podcasts', name: 'Reflection' },
            { section: 'ebooks', name: 'Poetry' },
            { section: 'ebooks', name: 'Self-help' },
            { section: 'ebooks', name: 'Fiction' },
            { section: 'ebooks', name: 'Non-Fiction' },
            { section: 'ebooks', name: 'Biography' },
            { section: 'ebooks', name: 'History' },
            { section: 'ebooks', name: 'Philosophy' },
            { section: 'ebooks', name: 'Art' },
            { section: 'ebooks', name: 'Education' }
        ]);

        const catMap = {};
        categories.forEach(c => catMap[`${c.section}_${c.name}`] = c._id);

        // 4. Sample Content
        await Shayari.create({
            content: 'Zindagi mein koshish karte raho,\nManzil mile ya na mile,\nRaaste ki haseen yaadein\nZindagi sanwar deti hai.',
            likes_count: 524,
            category_id: catMap['shayari_Life']
        });

        console.log('🚀 Seeded successfully!');
    } catch (err) {
        console.error('⚠️ Seed failed:', err.message);
    }
}

async function closeDB() {
    await mongoose.disconnect();
}

module.exports = { connectDB, closeDB };
