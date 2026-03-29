require('dotenv').config();

// FAIL-SAFE: The app must NOT start if critical secrets are missing
function checkEnv() {
    const required = ['JWT_SECRET', 'MONGODB_URI', 'CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length > 0) {
        console.error(`💥 CRITICAL ERROR: Missing environment variables: ${missing.join(', ')}`);
        console.error('🚀 FIX: Add these to your Render Dashboard settings.');
        process.exit(1);
    }
}
checkEnv();

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
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "img-src": ["'self'", "data:", "https://res.cloudinary.com", "https://*.cloudinary.com", "https://api.dicebear.com"],
            "media-src": ["'self'", "https://res.cloudinary.com", "https://*.cloudinary.com"],
            "script-src": ["'self'", "'unsafe-inline'", "https://pagead2.googlesyndication.com", "https://*.googlesyndication.com"],
            "frame-src": ["'self'", "https://googleads.g.doubleclick.net", "https://*.googlesyndication.com", "https://res.cloudinary.com", "https://*.cloudinary.com"],
            "object-src": ["'none'", "https://res.cloudinary.com", "https://*.cloudinary.com"],
            "connect-src": ["'self'", "https://res.cloudinary.com", "https://*.cloudinary.com", "https://ansh-ebook.onrender.com", "wss://ansh-ebook.onrender.com", "stun:*", "turn:*"]
        },
    },
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
app.use('/api/realtime', require('./realtime-module/routes/chat.routes')); // Realtime Module Hook
app.use('/api', contentRoutes);

// Serve static files from the React app
const distPath = path.resolve(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
}

// Catch-all wildcard for React SPA
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'API Endpoint Not Found' });
    }
    
    const indexPath = path.resolve(__dirname, '../frontend/dist/index.html');
    if (fs.existsSync(indexPath)) {
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
