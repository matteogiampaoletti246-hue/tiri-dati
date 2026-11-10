// Classifiche giocatori del campionato dell'app (giocatori con statistiche): sezioni per StatListsN.
// Stessa logica di LeaguePlayersPanel.jsx del sito. Campionato: almeno 180 minuti; squadra: tutti quelli che hanno giocato.
import React from 'react';
import { PLAYERS } from '@/data/players';
import { teamsOf, teamById } from '@/data/teams';
import { comma } from '@/lib/format';
import { ratioColor } from '@/components/player/playerCalc';
import { Face } from './ui';

export const METRICS = [
  { key: 'goals', label: 'Gol', group: 'Attacco', f: (p) => p.goals, p90: true },
  { key: 'assists', label: 'Assist', group: 'Attacco', f: (p) => p.assists, p90: true },
  { key: 'xg', label: 'xG', group: 'Attacco', f: (p) => p.xg, p90: true },
  { key: 'shots', label: 'Tiri', group: 'Attacco', f: (p) => p.shots, p90: true },
  { key: 'sot', label: 'Tiri in porta', group: 'Attacco', f: (p) => p.shotsOnTarget, p90: true },
  { key: 'rating', label: 'Voto medio', group: 'Rendimento', f: (p) => p.rating, avg: true },
  { key: 'apps', label: 'Presenze', group: 'Rendimento', f: (p) => p.appearances },
  { key: 'min', label: 'Minuti', group: 'Rendimento', f: (p) => p.minutes },
  { key: 'foulsC', label: 'Falli commessi', group: 'Disciplina', f: (p) => p.foulsCommitted, p90: true },
  { key: 'foulsD', label: 'Falli subiti', group: 'Disciplina', f: (p) => p.foulsDrawn, p90: true },
  { key: 'yel', label: 'Gialli', group: 'Disciplina', f: (p) => p.yellows },
  { key: 'red', label: 'Rossi', group: 'Disciplina', f: (p) => p.reds },
  { key: 'off', label: 'Fuorigioco', group: 'Disciplina', f: (p) => p.offsides, p90: true },
];
const NEGK = ['foulsC', 'yel', 'red', 'off'];
const fmt = (v) => (Number.isInteger(v) ? String(v) : comma(v, 2));
const hex6 = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : '#2C3E66');

export function appPlayerSections(C, leagueId, teamId, mode) {
  const ids = new Set(teamsOf(leagueId).map((t) => t.id));
  const pool = PLAYERS.filter((p) => (teamId ? p.teamId === teamId : ids.has(p.teamId) && p.minutes >= 180) && p.hasStats);
  const lgPool = PLAYERS.filter((p) => ids.has(p.teamId) && p.hasStats && p.minutes >= 270);
  const avgCache = {};
  const gradeOf = (m, p) => {
    const val = (q) => { const r = m.f(q); return r == null ? null : m.p90 ? (r * 90) / q.minutes : r; };
    const mine = val(p);
    if (mine == null) return null;
    const ck = `${m.key}|${p.position}`;
    if (!(ck in avgCache)) {
      const all = lgPool.filter((q) => !p.position || q.position === p.position).map(val).filter((v) => v != null);
      avgCache[ck] = all.length < 5 ? null : all.reduce((x, y) => x + y, 0) / all.length;
    }
    const avg = avgCache[ck];
    if (!(avg > 0)) return null;
    return ratioColor(mine / avg, NEGK.includes(m.key));
  };
  const sections = [];
  METRICS.forEach((m) => {
    if (mode === 'p90' && !m.p90) return;
    const rows = pool
      .filter((p) => (mode === 'p90' ? p.minutes >= 180 : true))
      .map((p) => { const raw = m.f(p); const v = raw == null ? null : mode === 'p90' ? (raw * 90) / p.minutes : raw; return { p, v }; })
      .filter((x) => x.v !== null && x.v > 0)
      .sort((a, b) => b.v - a.v)
      .map(({ p, v }) => {
        const tc = hex6((teamById(p.teamId) || {}).colors && teamById(p.teamId).colors[0]);
        return { id: p.id, to: `/giocatore/${p.id}`, left: <Face uri={p.photo} color={tc} size={30} />, name: p.name, bg: true, tc, sub: p.teamName, value: fmt(v), color: m.key === 'min' || m.key === 'apps' ? null : gradeOf(m, p) };
      });
    if (rows.length) sections.push({ id: m.key, group: m.group, title: mode === 'p90' ? `${m.label} / 90'` : m.label, rows });
  });
  return sections;
}
