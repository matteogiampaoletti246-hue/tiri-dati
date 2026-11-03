import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isNative } from '@/lib/carousel';

// Vecchi link alla pagina di ricerca: aprono la Home con la tendina di ricerca aperta (nell'app nativa la Home e la tendina sono native).
export default function Cerca() {
  const navigate = useNavigate();
  useEffect(() => {
    if (isNative()) { try { window.ReactNativeWebView.postMessage('home'); window.ReactNativeWebView.postMessage('ui:search'); } catch (e) { /* ignora */ } return; }
    navigate('/', { replace: true, state: { open: 'search' } });
  }, [navigate]);
  return null;
}
