import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CRITICAL UI CRASH:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback-container" style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0110',
          color: '#ff1493',
          textAlign: 'center',
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>ECHO OF AN ERROR</h1>
          <p style={{ color: 'white', maxWidth: '600px', marginBottom: '2rem' }}>
            The creative flow was interrupted by an unexpected event. We are working to restore the harmony.
          </p>
          <pre style={{ 
            background: 'rgba(255, 20, 147, 0.1)', 
            padding: '1rem', 
            borderRadius: '10px',
            fontSize: '0.8rem',
            maxWidth: '90vw',
            overflow: 'auto',
            color: '#ff69b4'
          }}>
            {this.state.error?.message || "Unknown error occurred"}
          </pre>
          <button 
            onClick={() => window.location.reload()}
            className="btn btn-primary shadow-neon"
            style={{ marginTop: '2rem' }}
          >
            RESTORE CONNECTION
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
