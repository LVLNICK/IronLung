import { Component, type ErrorInfo, type ReactNode } from "react";
import { MobileButton } from "./MobilePrimitives";

interface AppErrorBoundaryState {
  message: string;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { message: "" };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { message: error instanceof Error ? error.message : "IronLog Analyzer hit a browser runtime error." };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("IronLog Analyzer runtime error", error, info);
  }

  render() {
    if (!this.state.message) return this.props.children;
    return (
      <main className="grid min-h-screen place-items-center bg-ink p-6 text-white">
        <section className="w-full max-w-sm rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-center">
          <div className="text-lg font-black">IronLog Analyzer could not open</div>
          <p className="mt-2 text-sm leading-relaxed text-red-100">{this.state.message}</p>
          <p className="mt-3 text-xs leading-relaxed text-white/60">
            Refresh Safari. If this keeps happening, clear website data for lvlnick.github.io and reopen the app.
          </p>
          <MobileButton className="mt-4 w-full" onClick={() => window.location.reload()}>Reload</MobileButton>
        </section>
      </main>
    );
  }
}
