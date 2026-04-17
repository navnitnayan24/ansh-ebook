import React from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const About = () => {
    return (
        <motion.div className="container" style={{ paddingBottom: '80px', minHeight: '100vh' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <SEO 
                title="About Ansh Ebook" 
                description="Learn more about Ansh Ebook - a premium sanctuary for poetry, music, and art by Ansh Sharma." 
            />
            <h1 className="pink-gradient-text" style={{ fontSize: '3rem', marginBottom: '2rem', textAlign: 'center' }}>About Ansh Ebook</h1>
            <div className="glass-card page-content-box" style={{ padding: '3rem', lineHeight: '1.8', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto' }}>
                <p>Welcome to <strong>Ansh-Ebook</strong>.</p>
                <p className="mt-4">
                    Our platform is a digital sanctuary dedicated to the beauty of words and the profound impact of melodies. 
                    Established with a deep passion for literature and creative arts by <strong>Ansh Sharma</strong>, we bring together high-quality, original Shayari, the <strong>Ansh Gazette</strong>, and soulful Music into one premium experience.
                </p>
                <p className="mt-4">
                    Every piece of content on this platform is crafted carefully through rigorous research, dedication, and genuine emotion, ensuring that our readers and listeners receive true value. Whether you are looking for heartfelt poetry, engaging audio stories, or relaxing soundscapes, <strong>Ansh Ebook</strong> is here to connect deeply with you.
                </p>
                <h3 className="pink-gradient-text mt-5 mb-3">Our Mission</h3>
                <p>
                    To inspire, heal, and connect hearts globally through original literary and musical masterpieces. We strongly believe in authenticity and the power of original content.
                </p>

                <div className="faq-section mt-5 pt-5" style={{ borderTop: '1px solid var(--glass-border)' }}>
                    <h3 className="text-center mb-4" style={{ color: 'var(--text-primary)' }}>Frequently Asked <span className="pink-gradient-text">Questions</span></h3>
                    
                    <div className="faq-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div className="faq-item glass-card" style={{ padding: '1.5rem' }}>
                            <h4 className="pink-text" style={{ fontSize: '1.2rem', marginBottom: '0.8rem' }}>1. What is Ansh Ebook?</h4>
                            <p className="text-muted">Ansh-Ebook is a premium creative platform. We specialize in original Hindi/Urdu Shayari, soulful music tracks, insightful real-time news in our Gazette, and literary E-books.</p>
                        </div>
                        
                        <div className="faq-item glass-card" style={{ padding: '1.5rem' }}>
                            <h4 className="pink-text" style={{ fontSize: '1.2rem', marginBottom: '0.8rem' }}>2. Is the content original?</h4>
                            <p className="text-muted">Yes, 100%. Every piece of poetry, every melody, and every news entry hosted here is an original creation by our team or our verified partners.</p>
                        </div>

                        <div className="faq-item glass-card" style={{ padding: '1.5rem' }}>
                            <h4 className="pink-text" style={{ fontSize: '1.2rem', marginBottom: '0.8rem' }}>3. Can I download the E-books?</h4>
                            <p className="text-muted">Yes, our E-books are available in downloadable PDF formats. Some are free, while premium collections can be purchased via our secure payment gateways.</p>
                        </div>

                        <div className="faq-item glass-card" style={{ padding: '1.5rem' }}>
                            <h4 className="pink-text" style={{ fontSize: '1.2rem', marginBottom: '0.8rem' }}>4. How can I stay updated?</h4>
                            <p className="text-muted">You can subscribe to our newsletter via the footer or join our official WhatsApp and YouTube channels linked in the 'Connect' section of our sidebar.</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default About;
