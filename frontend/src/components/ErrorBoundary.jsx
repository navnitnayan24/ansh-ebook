import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("[ErrorBoundary] Caught:", error, errorInfo);
    }

    handleReload = () => {
        // Clear all retry flags and caches
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('retry-lazy-')) {
                sessionStorage.removeItem(key);
            }
        }
        window.location.reload();
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
                        ⚡
                    </div>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: '700' }}>
                        New Update Available!
                    </h2>
                    <p style={{ 
                        color: 'rgba(255,255,255,0.6)', 
                        fontSize: '0.9rem', 
                        maxWidth: '400px',
                        marginBottom: '2rem',
                        lineHeight: '1.6'
                    }}>
                        Ansh Ebook has been updated. Please refresh to load the latest version.
                    </p>
                    <button 
                        onClick={this.handleReload}
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
                        REFRESH NOW
                    </button>
                    <p style={{ 
                        marginTop: '3rem',
                        fontSize: '0.7rem',
                        color: 'rgba(255,255,255,0.2)'
                    }}>
                        If this keeps happening, clear your browser cache (Ctrl+Shift+Delete)
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
