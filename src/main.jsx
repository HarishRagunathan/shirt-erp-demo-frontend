import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
class ErrorBoundary extends React.Component {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <main style={{ padding: 40, fontFamily: "sans-serif" }}>
        <h1>Something went wrong</h1>
        <p>Please reload the workspace to try again. </p>
        <button onClick={() => location.reload()}>Reload workspace</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
