import { useEffect } from 'react';
import Home from '@/pages/Home';
import { isNative } from '@/lib/carousel';

// Nell'app nativa la Home e' quella nativa: se il sito finisce sul suo "/" (tasto Home della barra, indietro, link) si torna alla Home nativa
// e la Home del sito non si disegna mai (era quella vecchia, con le bandiere vecchie e a scatti).
export default function NativeHomeGuard() {
  const native = isNative();
  useEffect(() => { if (native) { try { window.ReactNativeWebView.postMessage('home'); } catch (e) { /* ignora */ } } }, [native]);
  return native ? null : <Home />;
}
