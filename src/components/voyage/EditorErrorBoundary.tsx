import React from "react";

interface Props {
  children: React.ReactNode;
  /** Called when the boundary catches an error so the parent can surface a message. */
  onError?: (err: Error) => void;
  /** Render in place of the children when an error has been caught. */
  fallback?: (err: Error, reset: () => void) => React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Contains rendering errors from the rich-text editor and any heavy AI-generated
 * markdown so that a single bad rewrite never unmounts the surrounding modal.
 * The parent component's React state (draft content, audit items, etc.) is
 * preserved because only this subtree fails to render.
 */
export default class EditorErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[EditorErrorBoundary] caught", error, info);
    this.props.onError?.(error);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      if (this.props.fallback) return this.props.fallback(this.state.error, this.reset);
      return (
        <div className="rounded border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <div className="font-semibold mb-1">The editor hit a rendering error.</div>
          <div className="opacity-80 mb-2">{this.state.error.message}</div>
          <button
            type="button"
            onClick={this.reset}
            className="px-3 py-1.5 rounded bg-ink text-voyage-white text-xs uppercase tracking-wider"
          >
            Reload editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
