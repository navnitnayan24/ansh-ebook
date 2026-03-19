import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, User, Lock } from 'lucide-react';
import { login, adminLogin } from '../api';
import '../styles/Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [isAdmin, setIsAdmin] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Handle dual field (some login use username, some email)
        if (e.target.name === 'email') {
            setFormData(prev => ({ ...prev, username: e.target.value, email: e.target.value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const loginFunc = isAdmin ? adminLogin : login;
            const { data } = await loginFunc(formData);
            
            localStorage.setItem('token', data.token);
            // Sync with backend structure (flat)
            const userObj = {
                _id: data._id,
                username: data.username,
                email: data.email,
                role: data.role,
                profile_name: data.profile_name // for admin
            };
            localStorage.setItem('user', JSON.stringify(userObj));
            
            navigate(isAdmin ? '/admin' : '/');
            // Suggesting to use a context/state update instead of reload if possible, 
            // but keeping it simple as per user request "neat and clean".
            setTimeout(() => window.location.reload(), 100);
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page container">
            <div className="auth-content-centered">
                <div className="auth-brand-icon animate-slide-in-top">
                    <div className="icon-circle">
                         <LogIn size={40} />
                    </div>
                </div>

                <div className="auth-card-v2 glass-card animate-zoom-in">
                    <div className="auth-header-v2">
                        <h2>Welcome <span className="pink-text">Back</span></h2>
                        <p>Login to your account.</p>
                    </div>

                    <div className="mode-toggle-pill">
                        <button className={!isAdmin ? 'active' : ''} onClick={() => setIsAdmin(false)}>User</button>
                        <button className={isAdmin ? 'active' : ''} onClick={() => setIsAdmin(true)}>Admin</button>
                    </div>

                    {error && <div className="error-msg-v2">{error}</div>}

                    <form onSubmit={handleSubmit} className="auth-form-v2">
                        <div className="form-group-v2">
                            <label>Username or Email</label>
                            <input 
                                type="text" name="email" required 
                                placeholder="Username or Email"
                                value={formData.email || ''} onChange={handleChange}
                            />
                        </div>
                        <div className="form-group-v2">
                            <label>Password</label>
                            <input 
                                type="password" name="password" required 
                                placeholder="••••••••"
                                value={formData.password} onChange={handleChange}
                            />
                            <div className="forgot-password-link-container">
                                <Link to="/forgot-password" title="Forgot Password?">Forgot Password?</Link>
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-full btn-lg shadow-neon mt-2" disabled={loading}>
                            {loading ? 'Processing...' : (isAdmin ? 'SECURE ADMIN LOGIN' : 'SECURE LOGIN')}
                        </button>
                    </form>

                    <div className="auth-footer-v2">
                        <p>Don't have an account? <Link to="/register" className="pink-link">Register here</Link></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
