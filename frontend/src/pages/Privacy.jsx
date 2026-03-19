import React from 'react';
import SEO from '../components/SEO';
import '../styles/Legal.css';

const Privacy = () => {
    return (
        <div className="legal-page container">
            <SEO title="Privacy Policy" description="Privacy Policy outlining data protection on The Alfaz-E-Diaries." />
            <div className="glass-card legal-card">
                <h1>Privacy <span className="text-gradient">Policy</span></h1>
                <p className="last-updated">Last Updated: March 2026</p>
                
                <section>
                    <h3>1. Information We Collect</h3>
                    <p>We collect information you provide directly to us when you register for an account, such as your username and email address.</p>
                </section>

                <section>
                    <h3>2. How We Use Information</h3>
                    <p>We use the information we collect to provide, maintain, and improve our services, and to communicate with you.</p>
                </section>

                <section>
                    <h3>3. Data Security</h3>
                    <p>We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access.</p>
                </section>

                <section>
                    <h3>4. Your Choices</h3>
                    <p>You may update or correct your account information at any time by logging into your account.</p>
                </section>
            </div>
        </div>
    );
};

export default Privacy;
