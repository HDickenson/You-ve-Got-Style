import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Last resort, not the enforcement layer. Guardrails fail closed on their
 * own data (see `guardrails.ts`); this exists only so a bug nobody caught —
 * anywhere in the tree, not only discovery — replaces the screen with a
 * sentence instead of leaving a blank one, which reads to a customer as the
 * app being broken rather than a look being filtered.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface p-6 text-center"
      >
        <p className="max-w-measure text-body text-fg-muted">
          Something went wrong loading this screen. Nothing unsafe was shown.
        </p>
        <Button size="sm" onClick={() => window.location.assign(window.location.pathname)}>
          Start over
        </Button>
      </div>
    );
  }
}
