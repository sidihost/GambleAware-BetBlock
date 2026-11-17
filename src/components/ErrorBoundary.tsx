import React from 'react';
import { RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    let displayMsg = error.message || 'An unexpected error occurred.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string; operationType?: string };
      if (parsed && parsed.error) {
        if (parsed.error.includes('Quota exceeded')) {
          displayMsg =
            'Free daily Cloud Sync quota was reached for today and will reset tomorrow. Your protection and local data remain saved on-device.';
        } else {
          displayMsg = parsed.error;
        }
      }
    } catch {
      // Plain error message
    }
    return { hasError: true, message: displayMsg };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--canvas)] px-4 text-[var(--ink)]">
          <div className="w-full max-w-[420px] rounded-[26px] border border-[var(--glass-border)] bg-[var(--glass-fill)] p-6 text-center backdrop-blur-xl">
            <h1 className="font-display text-lg font-bold">Protection State Interrupted</h1>
            <p className="mt-2 text-xs leading-relaxed text-[var(--ink-muted)]">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: null })}
              className="mt-5 inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-[var(--active-fill)] px-5 text-sm font-semibold text-[var(--active-content)] hover:opacity-90"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Resume GambleAware</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
