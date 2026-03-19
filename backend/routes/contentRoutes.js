const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const {
    getShayari, createShayari, updateShayari, deleteShayari,
    getMusic, createMusic, updateMusic, deleteMusic,
    getPodcast, createPodcast, updatePodcast, deletePodcast,
    getEbook, createEbook, updateEbook, deleteEbook,
    getCategories
} = require('../controllers/contentController');
const upload = require('../middleware/upload');

/*
// Categories
router.get('/categories/:section', getCategories);

// Shayari
router.route('/shayari').get(getShayari).post(protect, admin, upload.single('thumbnail'), createShayari);
router.route('/shayari/:id').put(protect, admin, upload.single('thumbnail'), updateShayari).delete(protect, admin, deleteShayari);

// Music
router.route('/music').get(getMusic).post(protect, admin, upload.single('thumbnail'), createMusic);
router.route('/music/:id').put(protect, admin, upload.single('thumbnail'), updateMusic).delete(protect, admin, deleteMusic);

// Podcast
router.route('/podcast').get(getPodcast).post(protect, admin, upload.single('thumbnail'), createPodcast);
router.route('/podcast/:id').put(protect, admin, upload.single('thumbnail'), updatePodcast).delete(protect, admin, deletePodcast);

// Ebook
router.route('/ebook').get(getEbook).post(protect, admin, upload.single('thumbnail'), createEbook);
router.route('/ebook/:id').put(protect, admin, upload.single('thumbnail'), updateEbook).delete(protect, admin, deleteEbook);
*/

module.exports = router;
