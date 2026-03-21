import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Book, Mic, Quote, ArrowRight, BookOpen, Instagram, Youtube, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchHomeContent } from '../api';
import { MEDIA_URL } from '../config';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/Home.css';

const Home = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState({ latest_shayari: [], latest_music: [], latest_podcasts: [], featured_ebooks: [] });
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [email, setEmail] = useState('');
    const [subStatus, setSubStatus] = useState({ message: '', success: false });
    const [contactStatus, setContactStatus] = useState({ message: '', success: false });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Hash Scroll Handling
    useEffect(() => {
        const handleHashScroll = () => {
            const hash = window.location.hash;
            if (hash) {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            }
        };

        handleHashScroll();
        window.addEventListener('hashchange', handleHashScroll);
        return () => window.removeEventListener('hashchange', handleHashScroll);
    }, []);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser && savedUser !== 'undefined') {
            try {
                setUser(JSON.parse(savedUser));
            } catch (err) {
                console.error("User state error:", err);
            }
        }
    }, []);

    useEffect(() => {
        const getHomeData = async () => {
            try {
                const { data } = await fetchHomeContent();
                setContent(data);
            } catch (err) {
                console.error('Error fetching home content:', err);
            } finally {
                setLoading(false);
            }
        };
        getHomeData();
    }, []);

    const handleSubscribe = async (e) => {
        e.preventDefault();
        try {
            const { subscribeUser } = await import('../api');
            await subscribeUser(email);
            setSubStatus({ message: 'Welcome to the Inner Circle! ✨', success: true });
            setEmail('');
        } catch (err) {
            setSubStatus({ message: err.response?.data?.message || 'Subscription failed.', success: false });
        }
    };

    // Only lock Music, Podcast, Ebook — NOT Shayari
    const checkPremiumAccess = (e) => {
        if (!user) {
            e.preventDefault();
            navigate('/login');
        }
    };

    const sendEmail = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setContactStatus({ message: '', success: false });
        
        import('@emailjs/browser').then((emailjs) => {
            emailjs.sendForm(
                import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_id',
                import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_id',
                e.target,
                import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'public_key'
            ).then(() => {
                setContactStatus({ message: 'Message sent! We\'ll connect soon. ✨', success: true });
                e.target.reset();
            }).catch(() => {
                setContactStatus({ message: 'Failed to send. Please email us directly.', success: false });
            }).finally(() => setIsSubmitting(false));
        });
    };

    const faqData = [
        { q: "What is Ansh Ebook?", a: "Ansh-Ebook is a premium creative platform specializing in original Shayari, music, podcasts, and E-books." },
        { q: "Is the content original?", a: "Yes, 100%. Every piece is an original creation by Ansh Sharma or our verified partners." },
        { q: "Can I download E-books?", a: "Yes, our E-books are available in PDF format. Some are free, while premium ones can be purchased securely." },
        { q: "How can I stay updated?", a: "Subscribe to our newsletter or join our official WhatsApp and YouTube channels." }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { 
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    if (loading) return (
        <div className="premium-loader-container">
            <motion.div 
                className="premium-loader"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
            <p className="loading-text">UNFOLDING CREATIVITY...</p>
        </div>
    );

    return (
        <motion.div 
            className="home-page"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            <SEO 
                title="Ansh Ebook - Free Shayari, Music, Podcasts" 
                description="Welcome to Ansh-Ebook. Explore original premium Hindi Shayari, soulful Music, Podcasts, and E-Books."
            />
            
            {/* HERO SECTION */}
            <section id="hero" className="hero-section">
                <div className="bg-blob blob-1"></div>
                <div className="bg-blob blob-2"></div>
                <div className="bg-blob blob-3"></div>
                <motion.div className="hero-content" variants={itemVariants}>
                    <motion.h1 className="hero-welcome-v2">Welcome to</motion.h1>
                    <motion.h2 className="hero-main-branding"><span className="pink-gradient-text">Ansh-Ebook</span></motion.h2>
                    <motion.p className="hero-description-v2">A digital sanctuary where words find meaning, melodies touch the soul, and stories inspire greatness.</motion.p>
                    <div className="hero-actions-v2">
                        <a href="#shayari" className="btn btn-primary btn-lg shadow-neon">READ SHAYARI</a>
                        <a href="#premium" className="btn btn-dark-outline btn-lg">PREMIUM CONTENT</a>
                    </div>
                </motion.div>
            </section>

            {/* EXPLORE SECTION */}
            <section id="explore" className="featured-section container">
                <motion.div className="section-header text-center" variants={itemVariants}>
                    <h2 className="w-100">Explore our <span className="text-gradient">World</span></h2>
                </motion.div>
                <div className="explore-grid">
                    {/* Shayari — FREE, no login needed */}
                    <motion.a href="#shayari" className="explore-card glass-card" variants={itemVariants} whileHover={{ y: -10 }}>
                        <Quote size={40} className="pink-text mb-3" />
                        <h3>Shayari</h3>
                        <p>Deep words for every emotion.</p>
                        <span className="access-label free">🔓 FREE</span>
                    </motion.a>

                    {/* Music — Login Required */}
                    <motion.a href="#premium" className="explore-card glass-card" onClick={checkPremiumAccess} variants={itemVariants} whileHover={{ y: -10 }}>
                        <Play size={40} className="pink-text mb-3" />
                        <h3>Music</h3>
                        <p>Soulful melodies.</p>
                        <span className="access-label locked">🔒 LOGIN</span>
                    </motion.a>

                    {/* Podcast — Login Required */}
                    <motion.a href="#premium" className="explore-card glass-card" onClick={checkPremiumAccess} variants={itemVariants} whileHover={{ y: -10 }}>
                        <Mic size={40} className="pink-text mb-3" />
                        <h3>Podcast</h3>
                        <p>Inspiring stories.</p>
                        <span className="access-label locked">🔒 LOGIN</span>
                    </motion.a>

                    {/* E-Books — Login Required */}
                    <motion.a href="#premium" className="explore-card glass-card" onClick={checkPremiumAccess} variants={itemVariants} whileHover={{ y: -10 }}>
                        <Book size={40} className="pink-text mb-3" />
                        <h3>E-Books</h3>
                        <p>Literary gems.</p>
                        <span className="access-label locked">🔒 LOGIN</span>
                    </motion.a>
                </div>
            </section>

            {/* AD SPACE 1 */}
            <AdSpace type="horizontal" id="home-ad-1" />

            {/* SHAYARI SECTION — FREE for everyone, no login required */}
            <section id="shayari" className="featured-section container">
                <motion.div className="section-header" variants={itemVariants}>
                    <h2>Heartfelt <span className="text-gradient">Shayari</span> <span className="access-label free ml-3">🔓 FREE</span></h2>
                    <Link to="/shayari" className="view-all-link">View All <ArrowRight size={16} /></Link>
                </motion.div>
                <div className="grid-3">
                    {content?.latest_shayari?.slice(0, 6).map((item, idx) => (
                        <motion.div key={item?._id || idx} className="glass-card shayari-card hover-tilt" variants={itemVariants}>
                            <Quote className="quote-icon pink-text" size={32} />
                            <p className="shayari-text">{item?.content}</p>
                            <div className="card-footer">
                                <span className="cat-badge-mini">{item?.category_id?.name || 'SHAYARI'}</span>
                                <button className="like-btn">❤️ {item?.likes_count || 0}</button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* PREMIUM SECTION — Music, Podcast, E-Books (Login Required) */}
            <section id="premium" className="featured-section container">
                <motion.div className="section-header" variants={itemVariants}>
                    <h2>Premium <span className="text-gradient">Collection</span> <span className="access-label locked ml-3">🔒 LOGIN</span></h2>
                </motion.div>
                
                <div className="premium-tabs-v2">
                    <div className="premium-sub-section mb-5">
                        <h3 className="premium-sub-title mb-4"><Mic size={20} className="mr-2"/> Podcasts</h3>
                        <div className="grid-2">
                            {content?.latest_podcasts?.map((pod, idx) => (
                                <motion.div key={pod?._id || idx} className={`glass-card podcast-card-mini ${!user ? 'restricted-content' : ''}`} onClick={checkPremiumAccess} variants={itemVariants}>
                                        <div className="podcast-thumb">
                                            <img src={pod?.thumbnail?.startsWith('/uploads') ? `${MEDIA_URL}${pod.thumbnail}` : (pod?.thumbnail || '/default-podcast.png')} alt={pod?.title} loading="lazy" />
                                            {!user && <div className="lock-overlay"><div className="lock-circle">🔒</div></div>}
                                        </div>
                                    <div className="podcast-info">
                                        <h3>{pod?.title}</h3>
                                        <p>{pod?.description?.substring(0, 80)}...</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="premium-sub-section">
                        <h3 className="premium-sub-title mb-4"><BookOpen size={20} className="mr-2"/> E-Books</h3>
                        <div className="grid-4">
                            {content?.featured_ebooks?.length > 0 ? (
                                content.featured_ebooks.map((book, idx) => (
                                    <motion.div key={book?._id || idx} className={`glass-card ebook-card-mini ${!user ? 'restricted-content' : ''}`} onClick={checkPremiumAccess} variants={itemVariants}>
                                        <div className="ebook-cover">
                                            <img src={book?.cover_url?.startsWith('/uploads') ? `${MEDIA_URL}${book.cover_url}` : (book?.cover_url || '/default-ebook.png')} alt={book?.title} loading="lazy" />
                                            {!user && <div className="lock-overlay"><div className="lock-circle">🔒</div></div>}
                                        </div>
                                        <div className="ebook-info">
                                            <h3>{book?.title}</h3>
                                            <p className="price-tag">₹{book?.price || 0}</p>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="glass-card text-center w-100 placeholder-card-premium" style={{ gridColumn: '1/-1', padding: '4rem 2rem' }}>
                                    <BookOpen size={48} className="pink-text mb-3" style={{ opacity: 0.3 }} />
                                    <h4 className="text-muted">Coming Soon</h4>
                                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>We are crafting some extraordinary literary gems. Stay tuned!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* AD SPACE 2 */}
            <AdSpace type="horizontal" id="home-ad-2" />

            {/* ABOUT & FAQ SECTION */}
            <section id="about" className="featured-section container">
                <div className="grid-2">
                    <div className="glass-card" style={{ padding: '3rem' }}>
                        <h2 className="pink-gradient-text mb-4">Our Story</h2>
                        <p style={{ lineHeight: '1.8', opacity: 0.9 }}>
                            Ansh-Ebook is a digital sanctuary dedicated to the beauty of words and the profound impact of melodies. Founded by <strong>Ansh Sharma</strong>, we bring together high-quality original Shayari, soulful Music, and inspiring Podcasts.
                        </p>
                        <p className="mt-3" style={{ lineHeight: '1.8', opacity: 0.9 }}>
                            Every piece of content is crafted with passion and authenticity, ensuring a premium experience for every visitor.
                        </p>
                    </div>
                    <div className="glass-card" style={{ padding: '3rem' }}>
                        <h2 className="pink-gradient-text mb-4">FAQ</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {faqData.map(faq => (
                                <div key={faq.q}>
                                    <h4 className="pink-text mb-1" style={{fontSize: '1rem'}}>{faq.q}</h4>
                                    <p style={{fontSize: '0.9rem', opacity: 0.7}}>{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* SUBSCRIBE SECTION */}
            <section id="subscribe" className="newsletter-banner container">
                <div className="glass-card shadow-neon newsletter-inner">
                    <h2>Join the <span className="pink-gradient-text">Inner Circle</span></h2>
                    <p>Subscribe for exclusive poetry and early access to original content.</p>
                    <form className="newsletter-form" onSubmit={handleSubscribe}>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Your email..."
                            className="glass-input-sidebar"
                        />
                        <button type="submit" className="btn btn-primary shadow-neon">JOIN</button>
                    </form>
                    {subStatus.message && (
                        <p style={{ 
                            marginTop: '1rem', 
                            fontSize: '0.9rem',
                            color: subStatus.success ? '#4ade80' : '#f87171',
                            fontWeight: '500'
                        }}>
                            {subStatus.message}
                        </p>
                    )}
                </div>
            </section>

            {/* CONNECT & CONTACT SECTION */}
            <section id="connect" className="featured-section container mb-5">
                <div className="grid-2">
                    <div className="glass-card" style={{ padding: '3rem' }}>
                        <h2 className="pink-gradient-text mb-4">Let's Connect</h2>
                        <div className="mb-4">
                            <h4 className="pink-text mb-1">Email</h4>
                            <a href="mailto:anshbgmi24@gmail.com" style={{color:'white', textDecoration:'none'}}>anshbgmi24@gmail.com</a>
                        </div>
                        <div>
                            <h4 className="pink-text mb-3">Follow Us</h4>
                            <div className="drawer-socials" style={{ justifyContent: 'flex-start', padding: 0, border: 'none', gap: '20px' }}>
                                <a href="https://www.instagram.com/_.unknown_shadow?igsh=MXczMmZ2a3N2cGs0Mw==" target="_blank" rel="noopener noreferrer"><Instagram size={28} /></a>
                                <a href="https://youtube.com/@vibexmusicx?si=-h93up_MiovLiyS8" target="_blank" rel="noopener noreferrer"><Youtube size={28} /></a>
                                <a href="https://whatsapp.com/channel/0029VaFlezo3QxSA5zNTQF0b" target="_blank" rel="noopener noreferrer"><MessageCircle size={28} /></a>
                            </div>
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '3rem' }}>
                        <h2 className="pink-gradient-text mb-4">Send a Message</h2>
                        <form onSubmit={sendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" name="user_name" required placeholder="Your Name" className="glass-input-sidebar" />
                            <input type="email" name="user_email" required placeholder="Your Email" className="glass-input-sidebar" />
                            <textarea name="message" required placeholder="Your Message" className="glass-input-sidebar" style={{ minHeight: '100px' }}></textarea>
                            <button type="submit" disabled={isSubmitting} className="btn btn-primary shadow-neon w-100">
                                {isSubmitting ? 'SENDING...' : 'SEND MESSAGE'}
                            </button>
                            {contactStatus.message && <p className={`mt-2 text-center ${contactStatus.success ? 'text-success' : 'text-danger'}`}>{contactStatus.message}</p>}
                        </form>
                    </div>
                </div>
            </section>

        </motion.div>
    );
};

export default Home;
