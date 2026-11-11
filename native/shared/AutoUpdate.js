// Aggiornamento automatico in Expo Go: all'apertura (solo da fredda) confronta la versione dell'app
// (build.json, scritto dalla CI) con native-link/latest.json e, se e' uscita una versione piu' nuova, la apre da sola.
import { useEffect } from 'react';
import { Linking } from 'react-native';
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
    if (last.sha === j.sha) return; // una versione si apre una volta sola: mai cicli, mai riaperture sotto le mani
    await AsyncStorage.setItem(KEY, JSON.stringify({ sha: j.sha, t: Date.now() })).catch(() => {});
    Linking.openURL('exp://u.expo.dev/' + j.id + '/group/' + j.group).catch(() => {});
  } catch (e) { /* offline: resta questa versione */ }
}

export function useAutoUpdate() {
  useEffect(() => {
    // solo all'avvio a freddo: al ritorno dal background non si ricarica mai l'app (prima poteva riaprirla o bloccare il tocco)
    const t = setTimeout(check, 1500);
    return () => clearTimeout(t);
  }, []);
}
