import React from 'react';
import SEO from '../components/SEO';
import '../styles/Legal.css';

const Terms = () => {
    return (
        <div className="legal-page container">
            <SEO title="Terms Of Service - Ansh Ebook" description="Terms of Service and usage conditions for the Ansh Ebook platform." />
            <div className="glass-card legal-card">
                <h1>Terms of <span className="text-gradient">Service</span></h1>
                <p className="last-updated">Last Updated: March 2026</p>
                
                <section>
                    <h3>1. Acceptance of Terms</h3>
                    <p>By accessing and using Ansh Ebook, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please refrain from using the platform.</p>
                </section>

                <section>
                    <h3>2. IP & Usage of Content</h3>
                    <p>The Shayari, music, and ebooks provided on Ansh Ebook are original intellectual properties of Ansh Sharma. Unauthorized reproduction, distribution, or commercial use without explicit permission is strictly prohibited.</p>
                </section>

                <section>
                    <h3>3. User Accounts & Responsibilities</h3>
                    <p>Users are responsible for maintaining the confidentiality of their account credentials. You agree to notify us immediately of any unauthorized use of your account.</p>
                </section>

                <section>
                    <h3>4. Content Accuracy & Quality</h3>
                    <p>While we strive for excellence, the content is provided "as is". We do not guarantee that the content will be error-free or meet all your expectations.</p>
                </section>

                <section>
                    <h3>5. Governing Law</h3>
                    <p>These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in India.</p>
                </section>
            </div>
        </div>
    );
};

export default Terms;
