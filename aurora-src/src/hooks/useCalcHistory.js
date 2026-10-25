import { useCallback, useEffect, useState } from 'react';

const KEY = 'scalperlab.calc.plays.v1';

const read = () => {
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const byDate = (a, b) => new Date(b.date || 0) - new Date(a.date || 0);

export default function useCalcHistory() {
  const [plays, setPlays] = useState(read);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(plays));
    } catch {
      /* spazio non disponibile: lo storico resta in memoria */
    }
  }, [plays]);

  const add = useCallback((play) => setPlays((prev) => [play, ...prev].sort(byDate)), []);

  const remove = useCallback((id) => setPlays((prev) => prev.filter((p) => p.id !== id)), []);

  const merge = useCallback(
    (incoming) =>
      setPlays((prev) => {
        const map = new Map(prev.map((p) => [p.id, p]));
        incoming.forEach((p) => {
          if (p && p.id) map.set(p.id, p);
        });
        return Array.from(map.values()).sort(byDate);
      }),
    [],
  );

  return { plays, add, remove, merge };
}
