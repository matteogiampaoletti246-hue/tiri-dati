import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';

// Niente zoom con due dita né doppio tocco: l'app resta ferma, si muove solo con lo scorrimento.
const stop = (e) => e.preventDefault();
['gesturestart', 'gesturechange', 'gestureend'].forEach((n) => document.addEventListener(n, stop, { passive: false }));
document.addEventListener('touchmove', (e) => { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
// Se un pezzo di pagina va in errore non si resta con lo schermo bianco: si riprova da solo.
class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: 0 }; }
  static getDerivedStateFromError() { return { err: Date.now() }; }
  componentDidCatch() { setTimeout(() => this.setState({ err: 0 }), 400); }
  render() {
    if (this.state.err) return <div style={{ minHeight: '100vh' }} />;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(<Boundary><App /></Boundary>);
