import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../api';
import '../styles/Auth.css';

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return setError('Passwords do not match');
        }
        
        setLoading(true);
        setError('');
        try {
            await resetPassword(token, password);
            setMessage('Password reset successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page container">
            <div className="auth-content-centered">
                <div className="auth-brand-icon animate-slide-in-top">
                    <div className="icon-circle">
                         <Lock size={40} />
                    </div>
                </div>

                <div className="auth-card-v2 glass-card animate-zoom-in">
                    <div className="auth-header-v2">
                        <h2>Reset <span className="pink-text">Password</span></h2>
                        <p>Create a strong new password for your account.</p>
                    </div>

                    {message && (
                        <div className="success-msg-v2">
                            <CheckCircle size={18} /> {message}
                        </div>
                    )}
                    {error && <div className="error-msg-v2">{error}</div>}

                    {!message && (
                        <form onSubmit={handleSubmit} className="auth-form-v2">
                            <div className="form-group-v2">
                                <label>New Password</label>
                                <input 
                                    type="password" required 
                                    placeholder="••••••••"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <div className="form-group-v2">
                                <label>Confirm New Password</label>
                                <input 
                                    type="password" required 
                                    placeholder="••••••••"
                                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-full btn-lg shadow-neon mt-2" disabled={loading}>
                                {loading ? 'Updating...' : 'UPDATE PASSWORD'}
                            </button>
                        </form>
                    )}

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

export default ResetPassword;
