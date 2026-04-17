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
            
            // Force a hard reload INSTANTLY
            window.location.reload();
            
        } catch (err) {
            console.error("Auto-recovery cache clear failed:", err);
            window.location.reload();
        }
    };

    render() {
        if (this.state.hasError) {
            // Truly silent recovery: render nothing while the page reloads instantly
            return null;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
