import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ArrowLeft, 
    Share2, 
    MessageSquare, 
    Heart, 
    Clock, 
    Calendar, 
    MoreHorizontal, 
    Lock,
    UserPlus,
    X,
    Bookmark
} from 'lucide-react';
import { API } from '../api';
import { MEDIA_URL, getAvatarUrl, maskEmail } from '../config';
import Avatar from '../components/Avatar';
import AdSpace from '../components/AdSpace';
import SEO from '../components/SEO';
import '../styles/NewsArticle.css';

const NewsArticle = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [claps, setClaps] = useState(0);
    const [hasClapped, setHasClapped] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const isLoggedIn = !!user;

    useEffect(() => {
        const fetchArticle = async () => {
            try {
                // We use the podcast endpoint but for detailed view
                const { data } = await API.get(`/podcast/${id}`);
                setArticle(data);
                setClaps(data.likes_count || 0);
                
                // Trigger paywall if article is premium and user is guest
                if (data.is_premium && !isLoggedIn) {
                    setShowPaywall(true);
                }
            } catch (err) {
                console.error('Failed to fetch article:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchArticle();
        window.scrollTo(0, 0);
    }, [id, isLoggedIn]);

    const handleClap = async () => {
        if (!isLoggedIn) {
            setShowPaywall(true);
            return;
        }
        if (hasClapped) return;
        
        try {
            setClaps(prev => prev + 1);
            setHasClapped(true);
            await API.post(`/podcast/${id}/like`);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (!article) return <div className="p-5 text-center"><h3>Story not found</h3><Link to="/news">Return to Gazette</Link></div>;

    const readTime = Math.ceil((article.body_content?.split(' ').length || 200) / 200) + ' min read';

    return (
        <div className="article-page-container">
            <SEO 
                title={`${article.title} - Ansh Gazette`} 
                description={article.description} 
                image={article.thumbnail_url}
            />

            <div className="article-header-nav container">
                <Link to="/news" className="back-btn-minimal">
                    <ArrowLeft size={18} /> <span>Ansh Gazette</span>
                </Link>
                <div className="header-actions">
                    <button className="action-icon"><Share2 size={18} /></button>
                    <button className="action-icon"><Bookmark size={18}/></button>
                </div>
            </div>

            <main className="article-main container">
                <header className="article-title-segment">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="article-hero-title"
                    >
                        {article.title}
                    </motion.h1>
                    
                    <div className="author-meta-premium">
                        <Avatar pic={null} username="Ansh Sharma" style={{ width: '48px', height: '48px' }} />
                        <div className="meta-text">
                            <div className="author-name-row">
                                <span className="author-name">Ansh Sharma</span>
                                <span className="follow-btn-mini">Follow</span>
                            </div>
                            <div className="article-sub-meta">
                                <span>{readTime}</span>
                                <span className="meta-dot"></span>
                                <span>{new Date(article.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="article-interactions-bar border-top border-bottom">
                    <div className="interaction-left">
                        <button className={`clap-btn ${hasClapped ? 'active' : ''}`} onClick={handleClap}>
                            <Heart size={20} fill={hasClapped ? "var(--accent)" : "transparent"} />
                            <span>{claps}</span>
                        </button>
                        <button className="comment-btn">
                            <MessageSquare size={20} />
                            <span>4</span>
                        </button>
                    </div>
                    <div className="interaction-right">
                        <Share2 size={20} style={{ opacity: 0.6, cursor: 'pointer' }} />
                        <MoreHorizontal size={20} style={{ opacity: 0.6, cursor: 'pointer' }} />
                    </div>
                </div>

                <article className={`article-body-content ${showPaywall ? 'content-locked' : ''}`}>
                    {article.thumbnail_url && (
                        <figure className="article-feature-image">
                            <img src={article.thumbnail_url.startsWith('/uploads') ? `${MEDIA_URL}${article.thumbnail_url}` : article.thumbnail_url} alt="Feature" />
                            <figcaption className="text-center mt-2 opacity-50" style={{fontSize: '0.8rem'}}>
                                Photograph: Editorial Content / Ansh Gazette
                            </figcaption>
                        </figure>
                    )}

                    <div className="article-rich-text">
                        {/* We render the first few paragraphs even if locked */}
                        <div dangerouslySetInnerHTML={{ 
                            __html: showPaywall 
                                ? (article.body_content?.split('\n\n').slice(0, 3).join('<br/><br/>') + '...') 
                                : (article.body_content?.replace(/\n\n/g, '<br/><br/>')) 
                        }} />
                    </div>

                    {showPaywall && (
                        <div className="member-paywall-overlay">
                            <div className="paywall-gradient"></div>
                            <div className="paywall-content-box glass-card shadow-neon">
                                <div className="paywall-icon">
                                    <Lock size={40} className="pink-text" />
                                </div>
                                <h2>Member-only story</h2>
                                <p>Create an account to read the full story and support quality journalism on Ansh Gazette.</p>
                                
                                <div className="auth-options-stack">
                                    <button className="auth-provider-btn google" onClick={() => navigate('/register')}>
                                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width="18" />
                                        Sign up with Google
                                    </button>
                                    <button className="auth-provider-btn github" onClick={() => navigate('/register')}>
                                        <UserPlus size={18} />
                                        Sign up with Email
                                    </button>
                                </div>
                                
                                <p className="already-account mt-4">
                                    Already have an account? <Link to="/login" className="pink-text">Sign in</Link>
                                </p>
                            </div>
                        </div>
                    )}
                </article>

                <footer className="article-footer-segment mt-5 pt-5 border-top">
                   <AdSpace type="horizontal" id="article-bottom-ad" />
                   
                   <div className="related-profile glass-card p-4 mt-5">
                       <div className="d-flex align-items-center gap-3">
                           <Avatar pic={null} username="Ansh Sharma" style={{ width: '80px', height: '80px' }} />
                           <div>
                               <h4>Written by Ansh Sharma</h4>
                               <p className="opacity-70" style={{fontSize: '0.9rem'}}>Editor-in-Chief of Ansh Gazette. Insights on finance, global politics, and soulful poetry.</p>
                               <div className="d-flex gap-3 mt-2">
                                   <button className="btn btn-primary btn-sm btn-pill">Follow</button>
                                   <button className="btn btn-outline btn-sm btn-pill"><Mail size={16}/></button>
                               </div>
                           </div>
                       </div>
                   </div>
                </footer>
            </main>
        </div>
    );
};

export default NewsArticle;
