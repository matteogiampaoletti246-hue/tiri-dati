// Gol di una squadra raggruppati per marcatore: un nome solo con tutti i minuti (doppiette, triplette...), in ordine di primo gol.
export function groupGoals(goals) {
  const out = [];
  const by = new Map();
  for (const g of goals || []) {
    const k = g.pid || g.playerId || g.name || `#${out.length}`;
    let r = by.get(k);
    if (!r) { r = { name: g.name, mins: [] }; by.set(k, r); out.push(r); }
    r.mins.push({ m: g.minute, pen: !!g.pen, og: !!g.og });
  }
  return out;
}
export const minLabel = (x) => `${x.m}'${x.pen ? ' (rig.)' : ''}${x.og ? ' (aut.)' : ''}`;
