import React from 'react';
import SEO from '../components/SEO';
import '../styles/Legal.css';

const Terms = () => {
    return (
        <div className="legal-page container">
            <SEO title="Terms of Service" description="Terms and conditions for using the The Alfaz-E-Diaries platform." />
            <div className="glass-card legal-card">
                <h1>Terms of <span className="text-gradient">Service</span></h1>
                <p className="last-updated">Last Updated: March 2026</p>
                
                <section>
                    <h3>1. Acceptance of Terms</h3>
                    <p>By accessing and using The Alfaz-E-Diaries, you agree to comply with and be bound by these Terms of Service.</p>
                </section>

                <section>
                    <h3>2. Use of Content</h3>
                    <p>The Shayari, music, and ebooks provided on this platform are for personal use only. Unauthorized reproduction or distribution is prohibited.</p>
                </section>

                <section>
                    <h3>3. User Accounts</h3>
                    <p>Users are responsible for maintaining the confidentiality of their account credentials and for all activities that occur under their account.</p>
                </section>

                <section>
                    <h3>4. Disclaimer</h3>
                    <p>The content is provided "as is" without warranties of any kind. We do not guarantee the accuracy or completeness of the content.</p>
                </section>
            </div>
        </div>
    );
};

export default Terms;
