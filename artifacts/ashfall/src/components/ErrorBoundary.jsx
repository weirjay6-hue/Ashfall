import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Ashfall game error:', error, info);
  }

  dismiss() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          {this.props.children && (
            <div style={{ opacity: 0, pointerEvents: 'none', position: 'absolute' }} />
          )}
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(3,14,7,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}>
            <div style={{
              background: '#0c0c18',
              border: '1px solid #1c1c2c',
              borderRadius: '8px',
              padding: '32px 40px',
              maxWidth: '420px',
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 4px 24px rgba(0,0,0,0.7)',
            }}>
              <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚒</div>
              <h2 style={{
                fontFamily: 'Cinzel, serif',
                color: '#c8b820',
                fontSize: '18px',
                letterSpacing: '0.1em',
                marginBottom: '12px',
              }}>
                Not Currently Implemented
              </h2>
              <p style={{
                color: '#7a9a78',
                fontSize: '14px',
                lineHeight: 1.6,
                marginBottom: '24px',
                fontFamily: 'Crimson Text, serif',
              }}>
                This feature is still being forged in the fires of development.
                Check back soon, traveler.
              </p>
              {this.state.error && (
                <p style={{
                  color: '#c23030',
                  fontSize: '11px',
                  fontFamily: 'Share Tech Mono, monospace',
                  background: '#080810',
                  border: '1px solid #1c1c2c',
                  borderRadius: '4px',
                  padding: '8px',
                  marginBottom: '20px',
                  textAlign: 'left',
                  wordBreak: 'break-all',
                }}>
                  {this.state.error.message}
                </p>
              )}
              <button
                onClick={() => this.dismiss()}
                style={{
                  background: 'linear-gradient(180deg, #c8882a 0%, #6a4010 100%)',
                  color: '#fff',
                  border: '1px solid #e8a840',
                  borderRadius: '4px',
                  padding: '10px 32px',
                  fontFamily: 'Cinzel, serif',
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                OK
              </button>
            </div>
          </div>
        </>
      );
    }
    return this.props.children;
  }
}
