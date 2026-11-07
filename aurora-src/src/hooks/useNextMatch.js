import { useEffect, useState } from 'react';
import { nextMatchOf } from '@/data/extras';
import { syncDayTimes, refreshStatus } from '@/data/fotmob';
import { romeDay } from '@/data/util';

// Prossima partita di una squadra che si aggiorna da sola: finche' la partita di oggi non e' finita (anche live) resta quella;
// appena la fonte (FotMob) la da' per finita si passa alla successiva, senza riaprire la scheda. Controllo ogni 60 s solo se la partita e' di oggi.
export default function useNextMatch(teamId, comp) {
  const [, bump] = useState(0);
  const next = nextMatchOf(teamId, comp);
  const today = romeDay(Date.now());
  const watch = !!next && next.date <= today;
  const key = next ? next.id : '';
  useEffect(() => {
    if (!watch) return undefined;
    let on = true;
    const check = () => {
      if (typeof document !== 'undefined' && document.hidden) return;
      Promise.all([syncDayTimes(today, true).catch(() => 0), refreshStatus().catch(() => 0)])
        .then(() => { if (on && nextMatchOf(teamId, comp) !== next) bump((x) => x + 1); });
    };
    check();
    const id = setInterval(check, 60000);
    document.addEventListener('visibilitychange', check);
    return () => { on = false; clearInterval(id); document.removeEventListener('visibilitychange', check); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, comp, key, watch]);
  return next;
}
