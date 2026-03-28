import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', background: '#ff3333', color: 'white', zIndex: 99999, position: 'absolute', inset: 0, overflow: 'auto' }}>
                    <h2>React Crashed!</h2>
                    <p style={{ fontWeight: 'bold' }}>{this.state.error && this.state.error.toString()}</p>
                    <pre style={{ fontSize: '12px', background: '#111', padding: '10px', borderRadius: '5px' }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </pre>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
