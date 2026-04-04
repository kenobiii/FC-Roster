// ─── ErrorBoundary — eagerly loaded, wraps the entire app ────────────────────
import React from "react";
import { BRAND } from "../tokens.js";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch() {}
  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center"
          style={{ minHeight:"100dvh", background:BRAND.colors.navy, color:"#fff",
                   fontFamily:BRAND.fonts.body, padding:24, textAlign:"center" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>⚽</div>
          <div className="font-black mb-2"
            style={{ fontFamily:BRAND.fonts.display, fontSize:24, letterSpacing:1 }}>
            SOMETHING WENT WRONG
          </div>
          <p className="text-sm mb-6" style={{ color:"#64748b", maxWidth:320 }}>
            An unexpected error occurred. Refresh the page to get back in the game.
          </p>
          <button onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl font-black text-sm tracking-wide"
            style={{ background:BRAND.colors.green, color:"#fff", border:"none",
                     cursor:"pointer", fontFamily:BRAND.fonts.display, letterSpacing:1 }}>
            RELOAD PAGE
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
