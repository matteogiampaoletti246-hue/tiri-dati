// Aggiornamento automatico in Expo Go: all'apertura (solo da fredda) confronta la versione dell'app
// (build.json, scritto dalla CI) con native-link/latest.json e, se questa non e' l'ultima (anche se si e' ripartiti da un link vecchio), apre l'ultima.
import { useEffect } from 'react';
import { Linking, AppState } from 'react-native';
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
    // 21/11/2026: prima "una versione si apre una volta sola" -> se Expo Go ripartiva da un link vecchio (elenco dei recenti) restava sulla
    // versione vecchia per sempre e tornavano i problemi gia' corretti (formazioni sparite dopo 10-20 ore). Ora, finche' questa non e' l'ultima,
    // si riapre l'ultima a ogni avvio a freddo; contro i cicli: non prima di 2 minuti dal tentativo precedente e al massimo 3 tentativi ogni 6 ore.
    const now = Date.now();
    const same = last.sha === j.sha;
    const n = same && now - (last.t0 || 0) < 6 * 3600000 ? (last.n || 0) : 0;
    if (same && (now - (last.t || 0) < 120000 || n >= 3)) return;
    await AsyncStorage.setItem(KEY, JSON.stringify({ sha: j.sha, t: now, t0: n ? last.t0 : now, n: n + 1 })).catch(() => {});
    Linking.openURL('exp://u.expo.dev/' + j.id + '/group/' + j.group).catch(() => {});
  } catch (e) { /* offline: resta questa versione */ }
}

// versione in uso, mandata al worker (/v) all'avvio e al ritorno dal background (al massimo ogni 10 minuti): serve a verificare
// da remoto quale versione gira davvero sul telefono quando un problema gia' corretto sembra tornare
let pingAt = 0;
const ping = (e) => {
  if (!BUILD.sha || Date.now() - pingAt < 600000) return;
  pingAt = Date.now();
  fetch('https://scalperlab-live.matteo-giampaoletti04.workers.dev/v?sha=' + BUILD.sha + '&e=' + e).catch(() => {});
};

export function useAutoUpdate() {
  useEffect(() => {
    ping('start');
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') ping('resume'); });
    return () => sub.remove();
  }, []);
  useEffect(() => {
    // solo all'avvio a freddo: al ritorno dal background non si ricarica mai l'app (prima poteva riaprirla o bloccare il tocco)
    const t = setTimeout(check, 1500);
    return () => clearTimeout(t);
  }, []);
}
