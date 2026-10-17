import Home from '@/components/game/GameRoot';
import '@/standalone/fonts.css';
import GameErrorBoundary from '@/components/game/GameErrorBoundary';

// Standalone entry — no Base44 auth shell, no router, no providers.
// The game manages its own screen state internally via useState.
export default function App() {
  return <GameErrorBoundary><Home /></GameErrorBoundary>;
}