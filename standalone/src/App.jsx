import Home from '@/pages/Home';

// Standalone entry — no Base44 auth shell, no router, no providers.
// The game manages its own screen state internally via useState.
export default function App() {
  return <Home />;
}