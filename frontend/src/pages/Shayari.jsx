import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Quote, Heart, Copy, Search, ArrowLeft, Share2, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentByType, fetchCategories } from '../api';
import SEO from '../components/SEO';
import AdSpace from '../components/AdSpace';
import '../styles/Shayari.css';

const Shayari = () => {
    const [shayaris, setShayaris] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [shRes, catRes] = await Promise.all([
                    fetchContentByType('shayari'),
                    fetchCategories('shayari')
                ]);
                setShayaris(shRes.data);
                setAllCategories(catRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedCategory, searchQuery]);

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const toggleLike = async (id) => {
        try {
            const { data } = await (await import('../api')).API.post(`shayari/${id}/like`);
            setShayaris(shayaris.map(s => 
                s._id === id ? { ...s, likes_count: data.likes_count } : s
            ));
        } catch (err) {
            console.error("Like error:", err);
            // Fallback to local increment if API fails
            setShayaris(shayaris.map(s => 
                s._id === id ? { ...s, likes_count: s.likes_count + 1 } : s
            ));
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Shayari copied to clipboard!');
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div 
            className="shayari-page container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <SEO 
                title="Heartfelt Hindi Shayari" 
                description="Read premium, original Hindi and Urdu Shayari. Explore poetry on love, life, sadness, and motivation." 
            />
            <div className="page-header mb-4">
                <Link to="/" className="back-btn btn btn-outline btn-sm btn-pill">
                    <ArrowLeft size={16} /> Back to Home
                </Link>
            </div>

            <motion.div className="main-title-area text-center mb-5" variants={itemVariants}>
                <h1 className="main-title display-4">Shayari <span className="pink-gradient-text">Collection</span></h1>
                <p className="sub-title muted-text">Explore words that resonate with your soul.</p>
            </motion.div>

            <div className="shayari-layout">
                <motion.aside className="sidebar" variants={itemVariants}>
                    <div className="glass-card sidebar-widget search-widget mb-4">
                        <h3 className="widget-title">Search</h3>
                        <div className="sidebar-search-wrapper">
                            <input 
                                type="text" 
                                placeholder="Keywords..." 
                                className="glass-input-sidebar"
                                value={searchQuery}
                                onChange={handleSearch}
                            />
                            <Search className="search-icon-sidebar" size={18} />
                        </div>
                    </div>

                    <div className="glass-card sidebar-widget category-widget mb-4">
                        <h3 className="widget-title">Categories</h3>
                        <div className="category-list-sidebar">
                            <button 
                                className={`cat-link-sidebar ${!selectedCategory ? 'active' : ''}`}
                                onClick={() => setSelectedCategory('')}
                            >
                                All Shayari
                            </button>
                            {allCategories && allCategories.length > 0 && allCategories.map(cat => (
                                <button 
                                    key={cat._id} 
                                    className={`cat-link-sidebar ${selectedCategory === cat._id ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat._id)}
                                >
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="glass-card sidebar-widget ad-widget">
                        <AdSpace type="square" id="shayari-sidebar-ad" />
                    </div>
                </motion.aside>

                <main className="content-area">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)', letterSpacing: '2px', fontSize: '0.85rem' }}>LOADING...</div>
                    ) : (
                        <motion.div className="shayari-content-wrapper" variants={containerVariants}>
                            <AnimatePresence mode='popLayout'>
                                {Array.isArray(shayaris) && shayaris.length > 0 ? (
                                    <div className="shayari-grid">
                                        {shayaris.map((s) => (
                                            <motion.div 
                                                key={s._id} 
                                                className="glass-card shayari-card"
                                                variants={itemVariants}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                whileHover={{ y: -5 }}
                                            >
                                                <Quote className="quote-icon" />
                                                <p className="shayari-content">{s.content}</p>
                                                <div className="shayari-footer">
                                                    <button className="like-btn" onClick={() => toggleLike(s._id)}>
                                                        <Heart size={18} fill={s.likes_count > 500 ? "#ff2e63" : "none"} />
                                                        <span>{s.likes_count}</span>
                                                    </button>
                                                    <button className="icon-btn-plain ml-2" onClick={() => copyToClipboard(s.content)}>
                                                        <Share2 size={16} />
                                                    </button>
                                                    <div className="shayari-meta ml-auto">
                                                        <span className="date-tag mr-2">{new Date(s.createdAt).toLocaleDateString()}</span>
                                                        <span className="cat-tag">{s.category_id?.name || 'General'}</span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <motion.div className="glass-card empty-card-main" variants={itemVariants}>
                                        <div className="empty-icon-wrapper">
                                            <PenTool className="pink-text pulse-animation" size={60} />
                                        </div>
                                        <h3 className="mt-4">No Shayari Found</h3>
                                        <p className="muted-text">Try adjusting your search or category filter.</p>
                                        <button className="btn btn-outline btn-pill mt-3 btn-sm" onClick={() => {setSearchQuery(''); setSelectedCategory('');}}>
                                            CLEAR FILTERS
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </main>
            </div>
        </motion.div>
    );
};

export default Shayari;
