import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[App] render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100svh',
            padding: 24,
            background: '#0a0f1e',
            color: '#e8edf5',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 12 }}>Ошибка загрузки</h1>
          <p style={{ fontSize: 14, opacity: 0.85 }}>
            {this.state.error.message || 'Неизвестная ошибка'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
