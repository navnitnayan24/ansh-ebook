import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, MapPin, Send } from 'lucide-react';
import emailjs from '@emailjs/browser';
import SEO from '../components/SEO';

const Contact = () => {
    const [status, setStatus] = useState({ message: '', success: false });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const sendEmail = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ message: '', success: false });

        // User should replace these with their actual EmailJS credentials via env variables
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID';
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_PUBLIC_KEY';

        emailjs.sendForm(serviceId, templateId, e.target, publicKey)
            .then((result) => {
                setStatus({ message: 'Message sent successfully! We will get back to you soon.', success: true });
                e.target.reset();
            }, (error) => {
                setStatus({ message: 'Failed to send the message. Please try again or email directly.', success: false });
                console.error(error.text);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };
    return (
        <motion.div className="container" style={{ paddingBottom: '80px', minHeight: '100vh' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <SEO 
                title="Contact Ansh Ebook" 
                description="Get in touch with Ansh Ebook. Direct inquiries for collaborations, feedback, or support for Ansh Sharma's Ansh Ebook." 
            />
            <h1 className="pink-gradient-text" style={{ fontSize: '3rem', marginBottom: '2rem', textAlign: 'center' }}>Contact Ansh Ebook</h1>
            
            <div className="glass-card page-content-box contact-card-main">
                <h2 className="mb-4" style={{ color: 'var(--text-primary)' }}>Get In Touch</h2>
                <p className="mb-5 text-muted" style={{ fontSize: '1.1rem', lineHeight: '1.6' }}>
                    We would love to hear from you! Whether you have questions regarding our content, need support, or simply want to share your feedback about our Shayari, Music, or Podcasts, feel free to reach out.
                </p>

                <div className="contact-methods-grid">
                    {/* Left Side - Info */}
                    <div className="contact-info">
                        <div className="contact-item d-flex align-items-center" style={{ gap: '15px' }}>
                            <div className="icon-wrapper" style={{ background: 'rgba(255,20,147,0.1)', padding: '15px', borderRadius: '50%' }}>
                                <Mail className="pink-text" size={28} />
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Us</span>
                                <a href="mailto:anshbgmi24@gmail.com" className="hover-pink" style={{ fontSize: '1.1rem', fontWeight: 'bold', textDecoration: 'none', color: 'var(--text-primary)' }}>anshbgmi24@gmail.com</a>
                            </div>
                        </div>

                        <div className="contact-item d-flex align-items-center" style={{ gap: '15px', marginTop: '2rem' }}>
                            <div className="icon-wrapper" style={{ background: 'rgba(255,20,147,0.1)', padding: '15px', borderRadius: '50%' }}>
                                <MapPin className="pink-text" size={28} />
                            </div>
                            <div>
                                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Location</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--text-primary)' }}>India</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Form */}
                    <div className="contact-form-wrapper">
                        <form className="glass-form" onSubmit={sendEmail} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Your Name</label>
                                <input type="text" name="user_name" required className="glass-input-sidebar w-100" style={{ padding: '0.8rem', borderRadius: '8px' }} placeholder="John Doe" />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Your Email</label>
                                <input type="email" name="user_email" required className="glass-input-sidebar w-100" style={{ padding: '0.8rem', borderRadius: '8px' }} placeholder="john@example.com" />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Message</label>
                                <textarea name="message" required className="glass-input-sidebar w-100" style={{ padding: '0.8rem', borderRadius: '8px', minHeight: '120px', resize: 'vertical' }} placeholder="How can we help you?"></textarea>
                            </div>
                            
                            <button type="submit" disabled={isSubmitting} className="btn btn-primary shadow-neon w-100 mt-2" style={{ padding: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}>
                                {isSubmitting ? 'SENDING...' : <><Send size={18} /> SEND MESSAGE</>}
                            </button>

                            {status.message && (
                                <div className={`form-status mt-3 text-center ${status.success ? 'text-success' : 'text-danger'}`} style={{ fontSize: '0.9rem' }}>
                                    {status.message}
                                </div>
                            )}
                        </form>
                    </div>
                </div>

                <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--glass-border)' }}>
                    <p className="text-muted" style={{ fontSize: '0.9rem' }}>We typically respond to all correspondence within 24-48 hours. Thank you for your interest in Ansh-Ebook.</p>
                </div>
            </div>
        </motion.div>
    );
};

export default Contact;
