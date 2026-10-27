import { useParams } from 'react-router-dom';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import Skeleton from '@/components/Skeleton';
import EntityBanner from '@/components/EntityBanner';
import { TeamLogo } from '@/components/FmImg';
import useAsync from '@/hooks/useAsync';
import { loadSeason, loadSeasonStats, seasonLabel, playerFace, SEASON_STAT_IT, prettyKey } from '@/data/archive';
import { useTeamColors } from '@/components/archive/parts';

const fmt = (k, v) => (/rating|per_90|expected/.test(k) ? Number(v).toFixed(2).replace('.', ',') : Number.isInteger(v) ? String(v) : Number(v).toFixed(1).replace('.', ','));

// Scheda del giocatore in quella stagione: tutte le statistiche in cui compare, con la sua posizione in classifica
export default function ArchivePlayer() {
  const { fm, sk, pid } = useParams();
  const col = useTeamColors();
  const { data: season } = useAsync(() => loadSeason(fm, sk), [fm, sk]);
  const { data: stats, loading } = useAsync(() => loadSeasonStats(fm, sk), [fm, sk]);
  if (loading) return <PageShell bar={false}><TopBar title="Giocatore" /><div className="px-5 pt-8"><Skeleton className="h-[52px] w-full" /></div></PageShell>;
  const lists = (stats && stats.players) || {};
  const rows = [];
  let me = null;
  Object.keys(lists).forEach((k) => {
    if (k.startsWith('_')) return;
    const i = lists[k].findIndex((r) => String(r[0]) === pid);
    if (i >= 0) { me = me || lists[k][i]; rows.push({ k, v: lists[k][i][3], pos: i + 1 }); }
  });
  if (!me) return <PageShell bar={false}><TopBar title="Giocatore" /><p className="px-5 py-14 text-center text-[13px]" style={{ color: 'var(--ink-3)' }}>Giocatore non trovato</p></PageShell>;
  const names = (season && season.teams) || {};
  const tn = names[me[2]] || '';
  rows.sort((a, b) => (SEASON_STAT_IT[a.k] ? 0 : 1) - (SEASON_STAT_IT[b.k] ? 0 : 1));
  return (
    <PageShell swipeBack={false}>
      <EntityBanner
        name={me[1]}
        subtitle={`${tn} · ${seasonLabel(sk)}`}
        meta={<span className="tnum text-[11.5px]" style={{ color: 'var(--ink-2)' }}>{me[5] ? `${me[5]} partite` : ''}{me[4] ? ` · ${me[4]}'` : ''}</span>}
        colors={col(me[2], tn).colors}
        logoUrl={playerFace(pid)}
        initials={me[1].split(' ').map((w) => w[0]).join('').slice(0, 2)}
        tall
      />
      <div className="px-4 pb-8" style={{ paddingTop: 'calc(var(--ent-h, 0px) + 12px)' }}>
        <section className="glass overflow-hidden rounded-[24px]">
          <div className="flex items-center gap-2 px-4 pb-1 pt-3.5"><TeamLogo id={me[2]} name={tn} size={20} /><h3 className="text-[12.5px] font-extrabold uppercase tracking-wider">Statistiche stagionali</h3></div>
          {rows.map((r, i) => (
            <div key={r.k} className="flex items-center gap-3 px-4 py-2.5" style={{ borderTop: '1px solid var(--hair-2)' }}>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold">{SEASON_STAT_IT[r.k] || prettyKey(r.k)}</span>
              <span className="tnum text-[11px]" style={{ color: 'var(--ink-3)' }}>{r.pos}° in classifica</span>
              <span className="tnum w-14 text-right text-[14.5px] font-extrabold">{fmt(r.k, r.v)}</span>
            </div>
          ))}
        </section>
      </div>
    </PageShell>
  );
}
