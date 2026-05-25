import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  title?: string;
}

interface State {
  hasError: boolean;
  message: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page">
          <h1 className="title">{this.props.title ?? 'Ошибка'}</h1>
          <p className="error">
            Не удалось отобразить раздел. Обновите страницу или вернитесь
            назад.
          </p>
          {import.meta.env.DEV && (
            <p className="placeholder" style={{ marginTop: 12 }}>
              {this.state.message}
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
