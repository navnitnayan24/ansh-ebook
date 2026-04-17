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
                    background: '#000',
                    color: 'white',
                    fontFamily: "'Poppins', sans-serif",
                    textAlign: 'center',
                    padding: '2rem'
                }}>
                    <div className="spinner-mini" style={{ marginBottom: '1.5rem', width: '40px', height: '40px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-pink)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                    <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: '600', letterSpacing: '1px' }}>
                        OPTIMIZING EXPERIENCE...
                    </h2>
                    <p style={{ 
                        color: 'rgba(255,255,255,0.5)', 
                        fontSize: '0.85rem', 
                        maxWidth: '300px',
                        lineHeight: '1.6'
                    }}>
                        Loading the latest stable version of Ansh Ebook. Please wait a moment.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
