import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, User, Mail, Lock } from 'lucide-react';
import { register } from '../api';
import '../styles/Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await register(formData);
            setSuccess('Registration successful! Redirecting to login...');
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page container">
            <div className="auth-content-centered">
                <div className="auth-brand-icon animate-slide-in-top">
                    <div className="icon-circle">
                         <UserPlus size={40} />
                    </div>
                </div>

                <div className="auth-card-v2 glass-card animate-zoom-in">
                    <div className="auth-header-v2">
                        <h2>Create <span className="pink-text">Account</span></h2>
                        <p>Join the digital community.</p>
                    </div>

                    {error && <div className="error-msg-v2">{error}</div>}
                    {success && <div className="error-msg-v2" style={{borderColor: 'var(--accent)', color: 'var(--accent)'}}>{success}</div>}

                    <form onSubmit={handleSubmit} className="auth-form-v2">
                        <div className="form-group-v2">
                            <label>Username</label>
                            <input 
                                type="text" name="username" required 
                                placeholder="modi123"
                                value={formData.username} onChange={handleChange}
                            />
                        </div>
                        <div className="form-group-v2">
                            <label>Email Address</label>
                            <input 
                                type="email" name="email" required 
                                placeholder="Enter email"
                                value={formData.email} onChange={handleChange}
                            />
                        </div>
                        <div className="form-group-v2">
                            <label>Password</label>
                            <input 
                                type="password" name="password" required 
                                placeholder="••••••••"
                                value={formData.password} onChange={handleChange}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg shadow-neon mt-2" disabled={loading}>
                            {loading ? 'Creating Account...' : 'CREATE ACCOUNT'}
                        </button>
                    </form>

                    <div className="auth-footer-v2">
                        <p>Already have an account? <Link to="/login" className="pink-link">Login Here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
