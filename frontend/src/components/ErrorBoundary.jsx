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
        
        // Attempt a silent auto-recovery if it hasn't happened in the last 2 seconds
        const lastRecover = sessionStorage.getItem('last-error-recover');
        const now = Date.now();
        if (!lastRecover || (now - parseInt(lastRecover)) > 2000) {
            sessionStorage.setItem('last-error-recover', now.toString());
            this.handleSilentReload();
        }
    }

    handleSilentReload = async () => {
        try {
            // Prevent multiple concurrent reloads
            if (this.state.autoRecovering) return;
            this.setState({ autoRecovering: true });

            // Clear all retry flags and caches
            for (let i = sessionStorage.length - 1; i >= 0; i--) {
                const key = sessionStorage.key(i);
                if (key && key.startsWith('retry-lazy-')) {
                    sessionStorage.removeItem(key);
                }
            }
            
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
            }
            
            // Force a hard reload to ignore cache
            setTimeout(() => {
                window.location.reload();
            }, 300);
            
        } catch (err) {
            console.error("Auto-recovery cache clear failed:", err);
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            // Minimal, non-intrusive feedback instead of pure black
            return (
                <div style={{
                    minHeight: '100vh',
                    background: '#0a0110', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="pulse-dot" style={{
                        width: '8px',
                        height: '8px',
                        background: '#ff1493',
                        borderRadius: '50%',
                        opacity: 0.4,
                        animation: 'pulse-tiny 1s ease-in-out infinite'
                    }}></div>
                    <style>{`
                        @keyframes pulse-tiny {
                            0%, 100% { transform: scale(0.8); opacity: 0.2; }
                            50% { transform: scale(1.2); opacity: 0.5; }
                        }
                    `}</style>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
