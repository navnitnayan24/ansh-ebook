import React from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/SEO';
import '../styles/Legal.css';

const Disclaimer = () => {
    return (
        <motion.div
            className="legal-page container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <SEO title="Disclaimer - Ansh Ebook" description="Official Disclaimer for the Ansh Ebook platform. All content is original and authentic." />
            <div className="glass-card legal-card">
                <h1><span className="text-gradient">Disclaimer</span></h1>
                <p className="last-updated">Last Updated: March 2026</p>

                <section>
                    <h3>General Information</h3>
                    <p>
                        All the information on this website — <strong>anshebook.com</strong> — is published in good faith and for general information purpose only. We do not make any warranties about the completeness, reliability, and accuracy of this information. Any action you take upon the information you find on this website is strictly at your own risk.
                    </p>
                </section>

                <section>
                    <h3>Original Content</h3>
                    <p>
                        The poetry, podcasts, and music available on this platform are original creations. While we strive to provide authentic and high-quality artistic content, interpretations of art and literature are subjective. We are not liable for any misunderstandings or personal interpretations derived from our creative works.
                    </p>
                </section>

                <section>
                    <h3>Consent</h3>
                    <p>
                        By using our website, you hereby consent to our disclaimer and agree to its terms.
                    </p>
                </section>

                <section>
                    <h3>Update</h3>
                    <p>
                        Should we update, amend or make any changes to this document, those changes will be prominently posted here.
                    </p>
                    <p className="mt-3">
                        If you require any more information or have any questions about our site's disclaimer, please feel free to contact us by email at{' '}
                        <a href="mailto:anshbgmi24@gmail.com" style={{ color: 'var(--accent)' }}>anshbgmi24@gmail.com</a>.
                    </p>
                </section>
            </div>
        </motion.div>
    );
};

export default Disclaimer;
