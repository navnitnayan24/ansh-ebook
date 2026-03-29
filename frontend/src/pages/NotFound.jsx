import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Ghost, Home, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const NotFound = () => {
    return (
        <div className="not-found-page container" style={{ 
            minHeight: '60vh', 
            padding: '4rem 0',
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            textAlign: 'center'
        }}>
            <SEO title="404 - Page Not Found" description="The page you looking for doesn't exist." />
            
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className="ghost-icon-wrapper" style={{ position: 'relative', marginBottom: '2rem' }}>
                    <motion.div 
                        animate={{ y: [0, -20, 0] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    >
                        <Ghost size={120} color="var(--accent)" style={{ opacity: 0.2 }} />
                    </motion.div>
                    <h1 style={{ 
                        fontSize: '8rem', 
                        margin: 0, 
                        position: 'absolute', 
                        top: '50%', 
                        left: '50%', 
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1,
                        opacity: 0.8
                    }} className="pink-gradient-text">404</h1>
                </div>

                <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>LOST IN THE ECHOES?</h2>
                <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 2.5rem auto', fontSize: '1.2rem' }}>
                    The page you are looking for has faded away into the silence. Let's get you back to the melodies.
                </p>

                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <Link to="/" className="btn btn-primary shadow-neon">
                        <Home size={18} /> GO TO HOME
                    </Link>
                    <button onClick={() => window.history.back()} className="btn btn-outline">
                        <ArrowLeft size={18} /> GO BACK
                    </button>
                </div>

                {/* Native Bar 404 Slot */}
                <div style={{ marginTop: '3rem', width: '100%', maxWidth: '400px', opacity: 0.6 }}>
                    <div id="container-fc31d37af05da68c422a1508c61daeb3"></div>
                </div>
            </motion.div>

        </div>
    );
};

export default NotFound;
