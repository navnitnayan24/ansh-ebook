import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Download, ArrowLeft, Book } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchContentByType, fetchCategories } from '../api';
import { MEDIA_URL } from '../config';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/Ebooks.css';

const Ebooks = () => {
    const [ebooks, setEbooks] = useState([]);
    const [allCategories, setAllCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPdfUrl, setSelectedPdfUrl] = useState(null);

    useEffect(() => {
        // No top back bar logic
        const fetchData = async () => {
            try {
                const [ebRes, catRes] = await Promise.all([
                    fetchContentByType('ebooks'),
                    fetchCategories('ebooks')
                ]);
                setEbooks(ebRes.data);
                setAllCategories(catRes.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
        return () => {}; // No cleanup needed for has-top-bar
    }, []);

    const categories = ['All', ...allCategories.map(c => c.name)];

    const filteredEbooks = Array.isArray(ebooks) ? ebooks.filter(book => {
        const matchesSearch = (book.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                             (book.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || book.category_id?.name === selectedCategory;
        return matchesSearch && matchesCategory;
    }) : [];

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
            className="ebooks-page container"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <SEO 
                title="Ansh Ebook - Premium E-Books" 
                description="Build your digital library with premium original e-books, poetry collections, and creative guides by Ansh Sharma on Ansh Ebook." 
            />

            <motion.div className="main-title-area text-center mb-5" variants={itemVariants}>
                <Link to="/" className="back-link pink-text" style={{display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '1rem', textDecoration: 'none', fontWeight: 'bold'}}>
                    <ArrowLeft size={20} /> Back to Home
                </Link>
                <h1 className="main-title display-4">Ansh Ebook <span className="pink-gradient-text">Library</span></h1>
                <p className="sub-title muted-text">Downloadable literature and comprehensive guides by Ansh Sharma.</p>
            </motion.div>

            <div className="ebooks-layout">
                <motion.aside className="sidebar" variants={itemVariants}>
                    <div className="search-box-ebooks sidebar-widget glass-card mb-4">
                        <div className="sidebar-search-wrapper">
                            <BookOpen size={18} className="search-icon-sidebar" />
                            <input 
                                type="text" 
                                className="glass-input-sidebar"
                                placeholder="Search library..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="glass-card filter-card-sidebar mb-4" style={{ padding: '1.5rem', borderRadius: '15px' }}>
                        <h4 style={{ fontSize: '1rem', marginBottom: '1rem', letterSpacing: '1px', opacity: 0.7 }}>CATEGORIES</h4>
                        <div className="category-list-vertical" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {categories.map(cat => (
                                            <button 
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                style={{ 
                                                    textAlign: 'left',
                                                    padding: '0.8rem 1rem',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: selectedCategory === cat ? 'rgba(255,20,147,0.15)' : 'transparent',
                                                    color: selectedCategory === cat ? 'var(--pink-primary)' : 'var(--text-primary)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                        </div>
                    </div>

                    <div className="glass-card promo-card-sidebar text-center mb-4">
                        <div className="promo-icon-wrapper mb-3">
                            <BookOpen className="pink-text pulse-animation" size={40} />
                        </div>
                        <h3>Read Anywhere</h3>
                        <p className="muted-text small">Download PDF copies of premium works to read offline on your favorite devices.</p>
                    </div>

                    <AdSpace type="square" id="ebooks-sidebar-ad" />
                </motion.aside>

                <main className="content-area">
                    {loading ? (
                        <div className="loader-container"><div className="loader"></div></div>
                    ) : (
                        <motion.div className="ebooks-content-wrapper" variants={containerVariants} layout>
                            <AnimatePresence mode='popLayout'>
                                {filteredEbooks && filteredEbooks.length > 0 ? (
                                    <div className="ebook-grid">
                                        {filteredEbooks.map((book) => (
                                            <motion.div 
                                                key={book._id} 
                                                className="glass-card ebook-card-main"
                                                variants={itemVariants}
                                                layout
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                whileHover={{ y: -15, scale: 1.02 }}
                                            >
                                                <div className="ebook-cover-wrapper">
                                                    {(() => {
                                                        const albumArt = book.cover_url || book.thumbnail || book.thumbnail_url;
                                                        const imgSrc = albumArt?.startsWith('/uploads') ? `${MEDIA_URL}${albumArt}` : (albumArt || '/default-ebook.png');
                                                        return <img src={imgSrc} alt={`${book.title} - Ansh Ebook E-book`} />;
                                                    })()}
                                                </div>
                                                <div className="ebook-details-main">
                                                    <div className="ebook-meta-top">
                                                        <span className="category-tag-plain">{book.category_id?.name || 'General'}</span>
                                                        <span className="date-tag-mini">{new Date(book.createdAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <h2>{book.title}</h2>
                                                    <p className="ebook-desc-short">{book.description?.substring(0, 100)}...</p>
                                                    <div className="ebook-footer-actions">
                                                        <button 
                                                            className="btn btn-primary btn-sm btn-pill shadow-neon w-100"
                                                            onClick={() => {
                                                                let target = book.pdfUrl || book.file_url || book.pdf_content_url || book.html_content_url || book.link;
                                                                if (target && target.includes('\\uploads\\')) {
                                                                    target = '/uploads/' + target.split('\\uploads\\').pop();
                                                                } else if (target && target.includes('/uploads/')) {
                                                                    target = '/uploads/' + target.split('/uploads/').pop();
                                                                }
                                                                const finalUrl = target?.startsWith('/uploads') ? `${MEDIA_URL}${target}` : target;
                                                                if (finalUrl) {
                                                                    setSelectedPdfUrl(finalUrl);
                                                                } else {
                                                                    alert('Link coming soon! ✨');
                                                                }
                                                            }}
                                                        >
                                                            <BookOpen size={16}/> READ NOW
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <motion.div className="glass-card empty-card-main" variants={itemVariants} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <div className="empty-icon-wrapper">
                                            <Book className="pink-text pulse-animation" size={60} />
                                        </div>
                                        <h3 className="mt-4">No Matches Found</h3>
                                        <p className="muted-text">Try searching for a different title or exploring another category.</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </main>
            </div>

            <AnimatePresence>
                {selectedPdfUrl && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)'}}
                    >
                        <div style={{width: '100%', maxWidth: '900px', display: 'flex', justifyContent: 'flex-end', marginBottom: '10px'}}>
                            <button className="btn btn-primary btn-sm btn-pill" onClick={() => setSelectedPdfUrl(null)}>Close PDF</button>
                        </div>
                        <div style={{width: '100%', maxWidth: '900px', background: 'white', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'}}>
                            <iframe src={selectedPdfUrl} width="100%" height="600px" style={{border: 'none'}} title="PDF Viewer"></iframe>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default Ebooks;
