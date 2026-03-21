import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Key } from 'lucide-react';
import { forgotPassword } from '../api';
import '../styles/Auth.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const { data } = await forgotPassword(email);
            setMessage('A password reset link has been sent to your email (Please check your inbox/spam).');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to send reset link');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page container">
            <div className="auth-content-centered">
                <div className="auth-brand-icon animate-slide-in-top">
                    <div className="icon-circle">
                         <Key size={40} />
                    </div>
                </div>

                <div className="auth-card-v2 glass-card animate-zoom-in">
                    <div className="auth-header-v2">
                        <h2>Lost your <span className="pink-text">Password?</span></h2>
                        <p>Enter your email to receive a recovery link.</p>
                    </div>

                    {message && <div className="success-msg-v2">{message}</div>}
                    {error && <div className="error-msg-v2">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form-v2">
                        <div className="form-group-v2">
                            <label>Email Address</label>
                            <div className="input-with-icon">
                                <Mail size={18} className="input-icon" />
                                <input 
                                    type="email" required 
                                    placeholder="Enter your registered email"
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg shadow-neon mt-2" disabled={loading}>
                            {loading ? 'Sending...' : 'SEND RESET LINK'}
                        </button>
                    </form>

                    <div className="auth-footer-v2">
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} /> Back to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
