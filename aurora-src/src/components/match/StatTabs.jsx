import { useState } from 'react';
import { norm } from '@/data/util';

const TABS = [
  ['Tiri', ['goals', 'total_shots', 'ShotsOnTarget', 'ShotsOffTarget', 'blocked_shots', 'shot_accuracy', 'expected_goals', 'expected_goals_on_target_variant', 'expected_goals_non_penalty', 'big_chance_missed_title', 'shots_woodwork']],
  ['Passaggi', ['assists', 'expected_assists', 'xg_and_xa', 'accurate_passes', 'passes_into_final_third', 'accurate_crosses', 'long_balls_accurate', 'line_breaking_passes', 'chances_created', 'big_chance_created_team_title', 'touches', 'touches_opp_box', 'corners']],
  ['Dribbling', ['dribbles_succeeded', 'was_fouled', 'dispossessed']],
  ['Difesa', ['Offsides', 'yellow', 'red', 'fouls', 'defensive_actions', 'matchstats.headers.tackles', 'shot_blocks', 'clearances', 'headed_clearance', 'interceptions', 'recoveries', 'dribbled_past', 'duel_won', 'duel_lost', 'ground_duels_won', 'aerials_won']],
];
const SKIP = new Set(['rating_title', 'minutes_played']);

export function tabRows(c) {
  const used = new Set();
  const y = c.evs.filter((e) => e.type === 'yellow' && norm(e.name) === norm(c.name)).length;
  const r = c.evs.filter((e) => e.type === 'red' && norm(e.name) === norm(c.name)).length;
  const virt = { yellow: { k: 'yellow', label: 'Gialli', text: String(y) }, red: { k: 'red', label: 'Rossi', text: String(r) } };
  const out = TABS.map(([title, keys]) => ({ title, rows: keys.map((k) => { used.add(k); return virt[k] || c.flat[k]; }).filter(Boolean) }));
  const rest = [];
  c.groups.forEach((g) => g.rows.forEach((x) => { if (!used.has(x.k) && !SKIP.has(x.k)) { used.add(x.k); rest.push(x); } }));
  out[3].rows.push(...rest);
  return out;
}

export default function StatTabs({ c, concept }) {
  const [i, setI] = useState(0);
  const tabs = tabRows(c);
  const cur = tabs[i];
  const bar = concept === 'b' ? (
    <div className="flex gap-6 px-1">
      {tabs.map((t, k) => (
        <button key={t.title} type="button" onClick={() => setI(k)} className="press relative pb-2 text-[14px] font-bold" style={{ color: k === i ? 'var(--ink)' : 'var(--ink-3)' }}>
          {t.title}
          {k === i ? <span className="absolute inset-x-0 bottom-0 h-[2.5px] rounded-full" style={{ background: 'var(--accent)' }} /> : null}
        </button>
      ))}
    </div>
  ) : concept === 'c' ? (
    <div className="grid grid-cols-4 gap-2">
      {tabs.map((t, k) => (
        <button key={t.title} type="button" onClick={() => setI(k)} className="press rounded-[16px] py-3 text-[12px] font-bold" style={{ background: k === i ? 'var(--accent)' : 'var(--hair-2)', color: k === i ? '#fff' : 'var(--ink-2)' }}>{t.title}</button>
      ))}
    </div>
  ) : (
    <div className="flex rounded-full p-1" style={{ background: 'var(--pill-bg)', border: '1px solid var(--glass-border)' }}>
      {tabs.map((t, k) => (
        <button key={t.title} type="button" onClick={() => setI(k)} className="press flex-1 rounded-full py-2 text-[12.5px] font-bold" style={{ background: k === i ? 'var(--ink)' : 'transparent', color: k === i ? 'var(--sky-2)' : 'var(--ink-2)' }}>{t.title}</button>
      ))}
    </div>
  );
  const rows = cur.rows;
  return (
    <div className="flex flex-col gap-3">
      {bar}
      {concept === 'c' ? (
        <div className="grid grid-cols-2 gap-2.5">
          {rows.map((r) => (
            <div key={r.k} className="rounded-[16px] px-3.5 py-3" style={{ background: 'var(--hair-2)' }}>
              <p className="tnum text-[18px] font-semibold leading-none">{r.text}</p>
              <p className="mt-1.5 text-[11px] leading-tight" style={{ color: 'var(--ink-3)' }}>{r.label}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[18px] px-4 py-1" style={{ background: concept === 'b' ? 'transparent' : 'var(--hair-2)' }}>
          {rows.map((r, k) => (
            <div key={r.k} className="flex items-center justify-between py-[10px]" style={{ borderTop: k ? '1px solid var(--hair-2)' : 'none' }}>
              <span className="text-[13.5px]" style={{ color: 'var(--ink-2)' }}>{r.label}</span>
              <span className="tnum text-[13.5px] font-bold">{r.text}</span>
            </div>
          ))}
          {!rows.length ? <p className="py-6 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Nessun dato</p> : null}
        </div>
      )}
    </div>
  );
}
