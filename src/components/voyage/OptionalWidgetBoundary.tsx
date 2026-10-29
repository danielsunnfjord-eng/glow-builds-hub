import { Component, type ReactNode } from "react";
import { isModuleLoadError } from "@/lib/retryDynamicImport";

/** An unavailable optional widget must never remove the travel pages. */
export default class OptionalWidgetBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      if (isModuleLoadError(this.state.error)) return null;
      throw this.state.error;
    }
    return this.props.children;
  }
}