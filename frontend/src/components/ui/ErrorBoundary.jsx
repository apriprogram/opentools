import React from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-page flex flex-col items-center justify-center p-6 text-center font-sans">
          <div className="bg-card border border-border p-8 rounded-2xl max-w-md w-full shadow-sm flex flex-col items-center">
            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-2xl font-bold text-primary mb-3 tracking-tight">Oops! Something went wrong.</h1>
            <p className="text-secondary text-[15px] leading-relaxed mb-8">
              We encountered an unexpected error while trying to display this page.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 bg-accent-black dark:bg-white text-white dark:text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-accent-black-hover dark:hover:bg-zinc-200 transition-colors"
              >
                <RefreshCcw size={18} />
                Refresh Page
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="flex-1 flex items-center justify-center gap-2 bg-card border border-border text-primary font-semibold px-4 py-2.5 rounded-lg hover:bg-card-muted transition-colors"
              >
                <Home size={18} />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
