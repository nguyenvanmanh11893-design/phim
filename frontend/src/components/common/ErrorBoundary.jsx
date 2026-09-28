import React from 'react';
import ErrorState from './ErrorState';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <ErrorState
            message={this.state.error?.message || 'Đã xảy ra sự cố ngoài ý muốn trong quá trình hiển thị giao diện.'}
            onRetry={this.handleReset}
            minHeight="350px"
          />
        </div>
      );
    }

    return this.props.children;
  }
}
