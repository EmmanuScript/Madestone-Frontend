import React from "react";

// Global error boundary to prevent crashes and show a friendly fallback
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console; could integrate with external logging later
    console.error("Unhandled UI error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ padding: 16 }}>
          <h3>Something went wrong</h3>
          <p style={{ color: "#b00" }}>
            An unexpected error occurred in the UI. Try navigating back or
            refreshing the page.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Dismiss
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
