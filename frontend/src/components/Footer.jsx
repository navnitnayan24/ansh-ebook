import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { 
    Facebook, Twitter, Instagram, Youtube, Send, Globe, Linkedin, MessageCircle,
    Music, Quote, Mic, Book, Info, Mail, MonitorPlay, PlayCircle, Tv
} from 'lucide-react';
import { subscribeUser } from '../api';
import '../styles/Footer.css';

const Footer = () => {
    const [email, setEmail] = React.useState('');
    const [status, setStatus] = React.useState({ message: '', success: false });

    const handleSubscribe = async (e) => {
        e.preventDefault();
        if (!email) return;
        try {
            await subscribeUser(email);
            setStatus({ message: 'Subscribed! ✨', success: true });
            setEmail('');
            setTimeout(() => setStatus({ message: '', success: false }), 5000);
        } catch (err) {
            setStatus({ message: 'Failed.', success: false });
        }
    };
    return (
        <footer className="site-footer">
            <div className="footer-container">
                <div className="footer-grid-v2">
                    {/* Explore Column */}
                    <div className="footer-col">
                        <h4>Explore</h4>
                        <ul className="footer-links-v2">
                            <li><a href="/#music-section"><Music size={16} /> Music & Melodies</a></li>
                            <li><a href="/#shayari"><Quote size={16} /> Heartfelt Shayari</a></li>
                            <li><a href="/#podcast-section"><Mic size={16} /> Original Podcasts</a></li>
                            <li><a href="/#ebook-section"><Book size={16} /> Premium E-books</a></li>
                            <li><a href="/#about"><Info size={16} /> About Us</a></li>
                            <li><a href="/#connect"><Mail size={16} /> Get In Touch</a></li>
                        </ul>
                    </div>

                    {/* Subscribe Column */}
                    <div className="footer-col">
                        <h4>Subscribe</h4>
                        <p className="footer-col-text">Stay updated with our latest stories and melodies.</p>
                        <form className="footer-newsletter-v2" onSubmit={handleSubscribe}>
                            <input 
                                type="email" 
                                placeholder="Your email..." 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <button type="submit"><Send size={18} /></button>
                        </form>
                        {status.message && (
                            <p style={{ 
                                fontSize: '0.75rem', 
                                marginTop: '8px', 
                                color: status.success ? '#4ade80' : '#f87171',
                                fontWeight: '500'
                            }}>
                                {status.message}
                            </p>
                        )}
                    </div>

                    {/* Connect Column */}
                    <div className="footer-col">
                        <h4>Connect</h4>
                        <div className="footer-social-v2">
                            <a href="https://www.facebook.com/share/1PNsduGWcq/" target="_blank" rel="noopener noreferrer" className="social-icon-v2" title="Facebook"><Facebook size={20} /></a>
                            <a href="https://www.instagram.com/_.unknown_shadow?igsh=MXczMmZ2a3N2cGs0Mw==" target="_blank" rel="noopener noreferrer" className="social-icon-v2" title="Instagram Main"><Instagram size={20} /></a>
                            <a href="https://www.instagram.com/gumnaam_shayar__24" target="_blank" rel="noopener noreferrer" className="social-icon-v2" title="Instagram Poetry"><Instagram size={20} /></a>
                            <a href="https://whatsapp.com/channel/0029VaFlezo3QxSA5zNTQF0b" target="_blank" rel="noopener noreferrer" className="social-icon-v2" title="WhatsApp Channel"><MessageCircle size={20} /></a>
                            <a href="https://youtube.com/@vibexmusicx?si=-h93up_MiovLiyS8" target="_blank" rel="noopener noreferrer" className="social-icon-v2" title="YouTube Channel 1"><Youtube size={20} /></a>
                            <a href="https://youtube.com/@vibexmusicx2.0?si=ayi0mTYKrqq1WhKO" target="_blank" rel="noopener noreferrer" className="social-icon-v2" title="YouTube Channel 2"><MonitorPlay size={20} /></a>
                            <a href="https://youtube.com/@vibexmusicx3.0?si=ayi0mTYKrqq1WhKO" target="_blank" rel="noopener noreferrer" className="social-icon-v2" title="YouTube Channel 3"><PlayCircle size={20} /></a>
                            <a href="https://youtube.com/@ToonXIndia-24?si=ayi0mTYKrqq1WhKO" target="_blank" rel="noopener noreferrer" className="social-icon-v2" title="ToonX India"><Tv size={20} /></a>
                            <a href="https://www.linkedin.com/in/navnit-nayan-14b4b9278?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" target="_blank" rel="noopener noreferrer" className="social-icon-v2" title="LinkedIn"><Linkedin size={20} /></a>
                        </div>
                    </div>
                </div>

                <div className="footer-credits-v2">
                    <p>@2026 Ansh-Ebook All Rights Reserved.</p>
                    <div className="legal-v2">
                        <Link to="/about">About Us</Link>
                        <Link to="/contact">Contact</Link>
                        <Link to="/disclaimer">Disclaimer</Link>
                        <Link to="/terms">Terms</Link>
                        <Link to="/privacy">Privacy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
