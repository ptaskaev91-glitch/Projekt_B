import { Component, ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : "Неизвестная ошибка" };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error("UI error boundary:", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: "" });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f1117] px-4 text-white">
          <div className="max-w-lg rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center shadow-2xl">
            <h2 className="text-xl font-semibold">Что-то пошло не так</h2>
            <p className="mt-3 text-sm text-rose-100">{this.state.message}</p>
            <button
              onClick={this.handleReset}
              className="mt-4 rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400"
              type="button"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
