const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
    console.log('✅ Cloudinary Storage initialized (Production Mode)');
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: async (req, file) => {
        let folder = 'ansh-ebook/general';
        let resource_type = 'auto';

        if (file.mimetype.startsWith('image/')) {
            folder = 'ansh-ebook/images';
            resource_type = 'auto';
        } else if (file.mimetype.startsWith('audio/') || file.mimetype.startsWith('video/')) {
            folder = 'ansh-ebook/audio';
            resource_type = 'video';
        } else if (file.mimetype === 'application/pdf' || file.mimetype.includes('ebook')) {
            folder = 'ansh-ebook/pdfs';
            resource_type = 'image'; // Cloudinary handles PDFs best as 'image'
        }

        return {
          folder: folder,
          resource_type: resource_type,
        };
      },
    });
} else {
    // Fallback to local storage (WARNING: Files will be lost on Render restarts)
    if (process.env.NODE_ENV === 'production') {
        console.warn('⚠️  WARNING: CLOUDINARY_CLOUD_NAME is not set! Falling back to LOCAL storage. Files will be EPHEMERAL on Render.');
    } else {
        console.log('ℹ️  Using local storage for development fallback.');
    }
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });
}

const fileFilter = (req, file, cb) => {
    // Allow images, audios, and documents (pdfs/ebooks)
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/') || file.mimetype.startsWith('application/')) {
        cb(null, true);
    } else {
        cb(new Error('File type not supported!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

module.exports = upload;
