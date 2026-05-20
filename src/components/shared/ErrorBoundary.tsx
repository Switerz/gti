import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
          <p className="font-medium text-destructive">Ocorreu um erro inesperado.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-3 text-sm text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Tentar novamente
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
