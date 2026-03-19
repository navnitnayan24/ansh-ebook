import React from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';

const Disclaimer = () => {
    return (
        <motion.div className="container" style={{ paddingBottom: '80px', minHeight: '100vh' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <SEO title="Disclaimer" description="Official Disclaimer for the The Alfaz-E-Diaries platform." />
            <h1 className="pink-gradient-text" style={{ fontSize: '3rem', marginBottom: '2rem', textAlign: 'center' }}>Disclaimer</h1>
            <div className="glass-card page-content-box" style={{ padding: '3rem', lineHeight: '1.8', fontSize: '1.1rem', maxWidth: '800px', margin: '0 auto' }}>
                <p>Welcome to <strong>THE ALFAZ-E-DIARIES</strong>.</p>
                <h3 className="pink-gradient-text mt-4 mb-2">General Information</h3>
                <p>
                    All the information on this website - kalam-se-dil-tak.com - is published in good faith and for general information purpose only. We do not make any warranties about the completeness, reliability, and accuracy of this information. Any action you take upon the information you find on this website is strictly at your own risk.
                </p>
                
                <h3 className="pink-gradient-text mt-4 mb-2">Original Content</h3>
                <p>
                    The poetry, podcasts, and music available on this platform are original creations. While we strive to provide authentic and high-quality artistic content, interpretations of art and literature are subjective. We are not liable for any misunderstandings or personal interpretations derived from our creative works.
                </p>

                <h3 className="pink-gradient-text mt-4 mb-2">Consent</h3>
                <p>
                    By using our website, you hereby consent to our disclaimer and agree to its terms.
                </p>

                <h3 className="pink-gradient-text mt-4 mb-2">Update</h3>
                <p>
                    Should we update, amend or make any changes to this document, those changes will be prominently posted here.
                </p>
                <p className="mt-4">
                    If you require any more information or have any questions about our site's disclaimer, please feel free to contact us by email at <a href="mailto:anshbgmi24@gmail.com" className="hover-pink" style={{ color: 'var(--accent)' }}>anshbgmi24@gmail.com</a>.
                </p>
            </div>
        </motion.div>
    );
};

export default Disclaimer;
