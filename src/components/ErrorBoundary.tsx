'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Error Boundary - catches rendering errors
 * Never exposes stack traces or internal details to users
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    // Log securely - never expose to user
    console.error('[ErrorBoundary]', error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-6 text-center">
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Algo salió mal
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Ha ocurrido un error inesperado. Inténtalo de nuevo.
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
