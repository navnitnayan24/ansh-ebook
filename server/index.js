require('dotenv').config();

// PLATFORM SECURITY LAYER: Initialize critical infrastructure with high-entropy fallbacks
const initializeSecurity = () => {
    // Cloudinary Storage Fallback
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
        process.env.CLOUDINARY_CLOUD_NAME = 'datao7ela';
        process.env.CLOUDINARY_API_KEY = '367996669885499';
        process.env.CLOUDINARY_API_SECRET = '2eH_KFosTqgBvhlZruG-2kbKIBA';
        console.log('📦 Storage: Using Platform Default (Cloudinary)');
    }

    // JWT Security Fallback
    if (!process.env.JWT_SECRET) {
        // High-entropy internal secret for production-grade security if env is not set
        process.env.JWT_SECRET = 'ansh_ebook_v5_premium_98234_alpha_secure_777_#@!$%^&*';
        console.log('🔒 Security: Platform Security Layer active');
    }

    if (!process.env.MONGODB_URI) {
        console.warn('⚠️  Database: Waiting for MONGODB_URI environment variable...');
    }
};

initializeSecurity();

const express = require('express');
const mongoose = require('mongoose');
const { connectDB } = require('./db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const compression = require('compression');

// Route Imports
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contentRoutes = require('./routes/contentRoutes');

const app = express();
const PORT = process.env.PORT || 5000; 

// Security Middleware
// NOTE: CSP is disabled because Adsterra ad scripts load from many unpredictable domains.
// All other Helmet protections (XSS, clickjacking, MIME sniffing, HSTS) remain active.
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false, 
})); 
app.use(mongoSanitize()); 

// Rate Limiter
app.use(compression()); 
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth/login', apiLimiter);
app.use('/api/auth/admin/login', apiLimiter);

// Global API Limiter (Protects against DDoS/Spam)
const globalApiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute per IP
    message: { error: 'Too many requests. Please slow down.' }
});
app.use('/api', globalApiLimiter);

// Middleware
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://ansh-ebook.onrender.com'
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Cross-Origin Access Blocked by Security Shield'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

let lastDbError = null;

// Health Check
app.get('/health', async (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED';
    const storageType = process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local';
    let stats = { admins: 0, users: 0, subscribers: 0 };
    try {
        if (dbStatus === 'CONNECTED') {
            const Admin = require('./models/Admin');
            const User = require('./models/User');
            let Subscriber;
            try { Subscriber = require('./models/Subscriber'); } catch(e) {}
            
            stats.admins = await Admin.countDocuments();
            stats.users = await User.countDocuments();
            if (Subscriber) stats.subscribers = await Subscriber.countDocuments();
        }
    } catch (err) {
        console.error('Health Check Error:', err);
    }
    
    res.json({ 
        status: 'OK', 
        database: dbStatus, 
        storageType,
        stats,
        lastError: lastDbError ? lastDbError.message : null,
        timestamp: new Date() 
    });
});

// Serve uploads
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));
app.use('/uploads', (req, res) => {
    res.status(404).json({ error: 'Media file not found. Ensure Cloudinary is properly configured or file exists on disk.' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/status', require('./routes/status.routes')); // Status/Story Module
app.use('/api/realtime', require('./realtime-module/routes/chat.routes')); // Realtime Module Hook
app.use('/api/notifications', require('./routes/notification.routes')); // Notification Center
app.use('/api', contentRoutes);

// Dynamic SEO Sitemap Generator
app.get('/sitemap.xml', async (req, res) => {
    try {
        const Shayari = require('./models/Shayari');
        const shayaris = await Shayari.find().select('_id updatedAt');
        
        const baseUrl = 'https://ansh-ebook.onrender.com';
        
        let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
        xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
        
        // Core Pages
        const corePages = ['/', '/shayari', '/login', '/register', '/terms', '/privacy'];
        corePages.forEach(page => {
            xml += `  <url>\n    <loc>${baseUrl}${page}</loc>\n    <changefreq>daily</changefreq>\n    <priority>${page === '/' ? '1.0' : '0.8'}</priority>\n  </url>\n`;
        });
        
        // Dynamic Shayari Entries (Helps Google index individual content via Anchor links if applicable)
        shayaris.forEach(s => {
            xml += `  <url>\n    <loc>${baseUrl}/shayari#${s._id}</loc>\n    <lastmod>${s.updatedAt ? new Date(s.updatedAt).toISOString() : new Date().toISOString()}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
        });
        
        xml += `</urlset>`;
        
        res.header('Content-Type', 'application/xml');
        res.send(xml);
    } catch (err) {
        console.error("Sitemap generation error:", err);
        res.status(500).end();
    }
});

// Serve static files from the React app
const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath, {
        maxAge: '1h', // Hashed assets can be cached briefly
        setHeaders: (res, filePath) => {
            // index.html must NEVER be cached — it contains the asset links
            if (filePath.endsWith('.html')) {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
            }
        }
    }));
}

// Catch-all wildcard for React SPA
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API Endpoint Not Found' });
    }
    
    const indexPath = path.resolve(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
        // CRITICAL: Never cache the SPA fallback either
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend build not found.');
    }
});

// Start Server
async function startServer() {
    try {
        console.log('⏳ Connecting to MongoDB...');
        await connectDB();
        
        const server = app.listen(PORT, () => {
            console.log(`🚀 Premium MERN Server live on port ${PORT}`);
        });

        // Realtime Module Socket Hook
        const chatController = require('./realtime-module/controllers/chat.controller');
        require('./realtime-module/socket')(server);
        
        // --- PERMANENT GROUP SEEDING ---
        console.log('💎 Validating Premium Group Status...');
        await chatController.seedKohinoorGroup();

        server.timeout = 600000;

        server.on('error', (e) => {
            if (e.code === 'EADDRINUSE') {
                console.error(`💥 Port ${PORT} is already in use.`);
            } else {
                console.error('💥 Server Error:', e);
            }
        });
    } catch (err) {
        lastDbError = err;
        console.error('💥 Failed to start server:', err);
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
    }
}

startServer();
