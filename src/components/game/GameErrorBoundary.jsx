import React from 'react';

export default class GameErrorBoundary extends React.Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="dark fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <h1 className="font-heading text-xl">The game could not continue</h1>
        <p className="max-w-sm text-sm">Reload to try again. This will not clear your saved progress.</p>
        <button type="button" className="rounded-xl bg-primary px-6 py-3 text-primary-foreground" onClick={() => window.location.reload()}>Reload Game</button>
      </div>
    );
  }
}