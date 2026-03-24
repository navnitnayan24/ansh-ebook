import React from 'react';
import SEO from '../components/SEO';
import '../styles/Legal.css';

const Privacy = () => {
    return (
        <div className="legal-page container">
            <SEO title="Privacy Policy - Ansh Ebook" description="Privacy Policy outlining data protection and privacy standards on Ansh Ebook." />
            <div className="glass-card legal-card">
                <h1>Privacy <span className="text-gradient">Policy</span></h1>
                <p className="last-updated">Last Updated: March 2026</p>
                
                <section>
                    <h3>1. Information We Collect</h3>
                    <p>We collect information you provide directly to Ansh Ebook when you register for an account, subscribe to our newsletter, or contact us. This may include your username, email address, and any messages you send.</p>
                </section>

                <section>
                    <h3>2. Data Usage & Cookies</h3>
                    <p>We use your information to personalize your experience, provide customer support, and send periodic updates. We may use cookies to improve our site's performance and analytics.</p>
                </section>

                <section>
                    <h3>3. Third-Party Disclosures</h3>
                    <p>We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties. This does not include trusted third parties who assist us in operating our website.</p>
                </section>

                <section>
                    <h3>4. Data Security & Protection</h3>
                    <p>We implement a variety of security measures to maintain the safety of your personal information. However, no method of transmission over the Internet is 100% secure.</p>
                </section>

                <section>
                    <h3>5. Your Rights</h3>
                    <p>You have the right to request access to, correction of, or deletion of your personal data held by Ansh Ebook.</p>
                </section>
            </div>
        </div>
    );
};

export default Privacy;
