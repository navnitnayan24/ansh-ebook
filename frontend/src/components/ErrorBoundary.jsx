import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, autoRecovering: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary] Caught:", error, errorInfo);
        
        // Attempt a silent auto-recovery if it hasn't happened in the last 15 seconds
        const lastRecover = sessionStorage.getItem('last-error-recover');
        const now = Date.now();
        if (!lastRecover || (now - parseInt(lastRecover)) > 15000) {
            sessionStorage.setItem('last-error-recover', now.toString());
            this.setState({ autoRecovering: true });
            this.handleSilentReload();
        }
    }

    handleSilentReload = async () => {
        try {
            // Clear all retry flags and caches
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('retry-lazy-')) {
                    sessionStorage.removeItem(key);
                }
            }
            
            // Actually empty full browser caches (the Ctrl+Shift+Delete equivalent for PWA/SW)
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            
            // Force a hard reload
            setTimeout(() => {
                window.location.reload(true);
            }, 500);
            
        } catch (err) {
            console.error("Auto-recovery cache clear failed:", err);
            window.location.reload(true);
        }
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'radial-gradient(circle at center, #1b0a2e 0%, #000 100%)',
                    color: 'white',
                    fontFamily: "'Poppins', sans-serif",
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff1493, #7c3aed)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        marginBottom: '1.5rem',
                        boxShadow: '0 0 30px rgba(255, 20, 147, 0.4)'
                    }}>
                        {this.state.autoRecovering ? '✨' : '⚡'}
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>
                        {this.state.autoRecovering ? 'Optimizing Update...' : 'New Update Available!'}
                    </h2>
                    <p style={{ 
                        color: 'rgba(255,255,255,0.6)', 
                        fontSize: '0.9rem', 
                        maxWidth: '400px',
                        marginBottom: '2rem',
                        lineHeight: '1.6'
                    }}>
                        {this.state.autoRecovering 
                            ? 'Please hold on, we are automatically clearing caches and loading the latest stable version for you.'
                            : 'Ansh Ebook has been updated. Please refresh to load the latest version.'}
                    </p>
                    
                    {!this.state.autoRecovering && (
                        <button 
                            onClick={this.handleSilentReload}
                            style={{
                                background: 'linear-gradient(90deg, #ff1493, #ad1457)',
                                color: 'white',
                                border: 'none',
                                padding: '0.8rem 2.5rem',
                                borderRadius: '50px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                letterSpacing: '1px',
                                textTransform: 'uppercase',
                                boxShadow: '0 0 20px rgba(255, 20, 147, 0.3)'
                            }}
                        >
                            CLEAR CACHE & REFRESH NOW
                        </button>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
