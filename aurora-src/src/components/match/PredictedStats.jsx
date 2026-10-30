import Crest from '@/components/Crest';
import TeamLink from '@/components/TeamLink';
import { metricOf } from '@/data/standings';
import { archiveMetrics } from '@/data/archiveMetrics';
import { comma } from '@/lib/format';

// Statistiche previste: per ogni squadra (fatti suoi + subiti dall'avversaria) / 2.
// Fattore casa/trasferta piccolo (+15% / -15%) solo su tiri, tiri in porta e corner: falli, fuorigioco e cartellini non cambiano in casa.
const HOME_F = 1.15;
const AWAY_F = 0.85;
// [etichetta, statistica fatta, stessa statistica subita dall'avversaria, fattore casa]
const ROWS = [
  ['Tiri', 'tiri', 'tiriConcessi', true],
  ['Tiri in porta', 'tiriInPorta', 'tiriInPortaConcessi', true],
  ['Corner', 'corner', 'cornerConcessi', true],
  ['Falli', 'falli', 'fallisubiti', false],
  ['Fuorigioco', 'fuorigioco', 'fuorigiocoAvv', false],
  ['Cartellini', 'gialli', 'gialliAvv', false],
];

const hex = (c) => (/^#[0-9a-f]{6}$/i.test(c || '') ? c : null);
const dist = (a, b) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const x = p(a); const y = p(b);
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};
const lift = (c) => `color-mix(in srgb, ${c} 62%, white)`;
// colore sociale della squadra, abbastanza chiaro per vedersi sul fondo scuro
const pick = (t, i = 0) => hex(t && t.colors && t.colors[i]) || '#4A78F0';
const bright = (c) => { const x = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)); return 0.299 * x[0] + 0.587 * x[1] + 0.114 * x[2]; };

export default function PredictedStats({ home, away, match }) {
  if (!home || !away) return null;
  const am = match && match.archive ? archiveMetrics(match) : null;
  const val = (team, key) => (am ? am.value(team.id === home.id ? match.archive.hid : match.archive.aid, key) : metricOf(team.id, key));
  const rows = ROWS.map(([label, own, conc, hf]) => {
    const a1 = val(home, own); const a2 = val(away, conc);
    const b1 = val(away, own); const b2 = val(home, conc);
    if ([a1, a2, b1, b2].some((v) => v === null || v === undefined || Number.isNaN(v))) return null;
    const h = ((a1 + a2) / 2) * (hf ? HOME_F : 1);
    const a = ((b1 + b2) / 2) * (hf ? AWAY_F : 1);
    if (!(h + a > 0)) return null;
    return { label, h, a, hf };
  }).filter(Boolean);
  if (!rows.length) return null;

  let ch = pick(home);
  let ca = pick(away);
  if (dist(ch, ca) < 90) ca = pick(away, 1);
  if (dist(ch, ca) < 90) ca = '#8592A6';
  const base = (c) => (bright(c) < 70 ? lift(c) : c);
  const g = (c, rev) => `linear-gradient(${rev ? 270 : 90}deg, ${base(c)}, ${lift(base(c))})`;
  const f = (v) => comma(v, 1);

  return (
    <section className="glass tint-card mx-4 mb-4 overflow-hidden rounded-[26px]" aria-label="Statistiche previste">
      <div className="grid items-center gap-2 px-5 py-4" style={{ gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', borderBottom: '1px solid var(--glass-border)' }}>
        <TeamLink team={home} className="flex min-w-0 items-center gap-2.5"><Crest team={home} size={34} /><span className="truncate text-[14px] font-bold">{home.name}</span></TeamLink>
        <span className="px-1 text-center text-[10.5px] font-extrabold uppercase tracking-[.1em]" style={{ color: 'var(--ink-3)' }}>Previste</span>
        <TeamLink team={away} className="flex min-w-0 items-center justify-end gap-2.5"><span className="truncate text-[14px] font-bold">{away.name}</span><Crest team={away} size={34} /></TeamLink>
      </div>
      {rows.map((r, i) => {
        const pa = (r.h / (r.h + r.a)) * 100;
        return (
          <div key={r.label} className="px-5 pb-[15px] pt-3.5" style={i ? { borderTop: '1px solid var(--glass-border)' } : null}>
            <div className="flex items-center justify-between">
              <span className="tnum text-[22px] font-extrabold tracking-tight">{f(r.h)}</span>
              <span className="flex flex-col items-center gap-[3px]">
                <span className="text-[12px] font-bold" style={{ color: 'var(--ink-2)' }}>{r.label}</span>
                {r.hf ? <span className="rounded-full px-[7px] py-[2px] text-[9.5px] font-bold uppercase tracking-[.06em]" style={{ color: 'var(--accent)', background: 'var(--accent-soft)' }}>Fattore casa</span> : null}
              </span>
              <span className="tnum text-[22px] font-extrabold tracking-tight">{f(r.a)}</span>
            </div>
            <div className="mt-2.5 flex h-[10px] gap-[3px]">
              <span style={{ width: `${pa}%`, flex: 'none', background: g(ch), borderRadius: '5px 2px 2px 5px' }} />
              <span style={{ flex: '1 1 0%', minWidth: 0, background: g(ca), borderRadius: '2px 5px 5px 2px' }} />
            </div>
          </div>
        );
      })}
    </section>
  );
}
