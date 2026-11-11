// Aggiornamento automatico in Expo Go: all'apertura e al ritorno dal background confronta la versione dell'app
// (build.json, scritto dalla CI) con native-link/latest.json e, se e' uscita una versione piu' nuova, la apre da sola.
import { useEffect } from 'react';
import { AppState, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BUILD from '../build.json';

const API = 'https://api.github.com/repos/matteogiampaoletti246-hue/tiri-dati/contents/native-link/latest.json?ref=main';
const KEY = 'sl-autoupd';

async function check() {
  if (!BUILD.sha || BUILD.sha === 'dev') return;
  try {
    const r = await fetch(API + '&t=' + Date.now(), { headers: { Accept: 'application/vnd.github.raw+json' } });
    if (!r.ok) return;
    const j = await r.json();
    if (!j || !j.sha || j.sha === BUILD.sha || !j.id || !j.group) return;
    const last = JSON.parse((await AsyncStorage.getItem(KEY).catch(() => null)) || '{}');
    if (last.sha === j.sha && Date.now() - last.t < 180000) return; // niente cicli se la nuova versione non si carica
    await AsyncStorage.setItem(KEY, JSON.stringify({ sha: j.sha, t: Date.now() })).catch(() => {});
    Linking.openURL('exp://u.expo.dev/' + j.id + '/group/' + j.group).catch(() => {});
  } catch (e) { /* offline: resta questa versione */ }
}

export function useAutoUpdate() {
  useEffect(() => {
    check();
    const sub = AppState.addEventListener('change', (st) => { if (st === 'active') check(); });
    return () => sub.remove();
  }, []);
}
