const { connectDB } = require('../db');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const Category = require('../models/Category');
const Shayari = require('../models/Shayari');
const Music = require('../models/Music');
const Podcast = require('../models/Podcast');
const Ebook = require('../models/Ebook');
const User = require('../models/User');
const Admin = require('../models/Admin');

async function migrate() {
    try {
        await connectDB();

        const connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DATABASE
        });
        console.log(`🔗 Connected to MySQL: ${process.env.MYSQL_DATABASE}`);

        // 1. Migrate Categories
        console.log('Migrating Categories...');
        const [categories] = await connection.execute('SELECT * FROM categories');
        const categoryMap = {}; // To map SQL ID to MongoDB ObjectID
        for (const cat of categories) {
            const newCat = await Category.findOneAndUpdate(
                { section: cat.section, name: cat.name },
                { section: cat.section, name: cat.name },
                { upsert: true, new: true }
            );
            categoryMap[cat.id] = newCat._id;
        }

        // 2. Migrate Shayari
        console.log('Migrating Shayari...');
        const [shayari] = await connection.execute('SELECT * FROM shayari');
        for (const s of shayari) {
            if (!categoryMap[s.category_id]) {
                console.warn(`⚠️ Shayari category not found in map: ${s.category_id}. Skipping.`);
                continue;
            }
            await Shayari.create({
                content: s.content,
                likes_count: s.likes_count,
                category_id: categoryMap[s.category_id],
                createdAt: s.created_at
            });
        }

        // 3. Migrate Music
        console.log('Migrating Music...');
        const [music] = await connection.execute('SELECT * FROM music');
        for (const m of music) {
            await Music.create({
                title: m.title,
                artist: m.artist,
                file_url: m.file_url,
                cover_url: m.cover_url,
                duration: m.duration,
                category_id: categoryMap[m.category_id],
                createdAt: m.created_at
            });
        }

        // 4. Migrate Podcasts
        console.log('Migrating Podcasts...');
        const [podcasts] = await connection.execute('SELECT * FROM podcasts');
        for (const p of podcasts) {
            await Podcast.create({
                title: p.title,
                description: p.description,
                file_url: p.file_url,
                thumbnail_url: p.thumbnail_url,
                duration: p.duration,
                createdAt: p.created_at
            });
        }

        // 5. Migrate Ebooks
        console.log('Migrating Ebooks...');
        const [ebooks] = await connection.execute('SELECT * FROM ebooks');
        for (const e of ebooks) {
            await Ebook.create({
                title: e.title,
                description: e.description,
                author: e.author,
                cover_url: e.cover_url,
                file_url: e.file_url,
                price: parseFloat(e.price),
                createdAt: e.created_at
            });
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrate();
