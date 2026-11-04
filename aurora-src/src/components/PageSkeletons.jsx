import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { goBack } from '@/lib/carousel';
import { cn } from '@/lib/utils';
import Sk from './LoaderSkeleton';

// Scheletri con la stessa forma delle pagine vere (stile C: la cornice resta vera, il grigio solo dove arrivano i dati).
// I testi finti usano le stesse classi del testo vero con le lettere invisibili: l'altezza della riga e' quella vera,
// cosi' all'arrivo dei dati niente salti. Tutto dentro `.sk-delay`: sotto i 150 ms non si vede (niente lampi).

// quante righe servono per riempire lo schermo (negli elenchi lunghi gli scheletri sono solo quelli visibili)
export const fill = (rowH, top = 0, max = 14) => Math.max(2, Math.min(max, Math.ceil(((typeof window !== 'undefined' ? window.innerHeight : 800) - top) / rowH)));

// riga di testo finta: alta come il testo vero con quelle classi, larga `w`
export function SkText({ className = '', w = '60%', as: Tag = 'span', style }) {
  return (
    <Tag className={cn('relative block', className)} style={style}>
      <span style={{ visibility: 'hidden' }}>Mg</span>
      <Sk className="absolute left-0 rounded-md" style={{ top: '22%', bottom: '22%', width: w }} />
    </Tag>
  );
}

// riga d'elenco: foto/logo tondo e una o due righe di testo
export function SkRow({ h = 52, avatar = 26, lines = 1, right = true, className = '' }) {
  return (
    <div className={cn('flex items-center gap-3', className)} style={{ height: h, borderBottom: '1px solid var(--hair-2)' }}>
      {avatar ? <Sk className="flex-none rounded-full" width={avatar} height={avatar} /> : null}
      <div className="min-w-0 flex-1">
        <Sk className="rounded-md" width="52%" height={11} />
        {lines > 1 ? <Sk className="mt-2 rounded-md" width="32%" height={9} /> : null}
      </div>
      {right ? <Sk className="flex-none rounded-md" width={30} height={11} /> : null}
    </div>
  );
}

export function SkList({ rowH = 52, avatar = 26, lines = 1, top = 260, className = 'px-5' }) {
  const n = fill(rowH, top);
  return <div className={className}>{Array.from({ length: n }, (_, i) => <SkRow key={i} h={rowH} avatar={avatar} lines={lines} />)}</div>;
}

// scheda (card) vuota con qualche barra dentro
export function SkCard({ h = 120, r = 24, className = '', children }) {
  return (
    <div className={cn('sk-card overflow-hidden p-4', className)} style={{ height: h, borderRadius: r }}>
      {children || (
        <>
          <Sk className="rounded-md" width="38%" height={11} />
          <Sk className="mt-3 rounded-md" width="70%" height={9} />
          <Sk className="mt-2 rounded-md" width="55%" height={9} />
        </>
      )}
    </div>
  );
}

// riga delle schede: stesse classi della barra di SwipeTabs, nomi coperti dal grigio
export function SkTabs({ labels = ['Panoramica', 'Formazioni', 'Statistiche', 'Classifica'], className = '' }) {
  return (
    <div className={cn('overflow-hidden px-5 pt-2.5', className)} aria-hidden="true">
      <div className="flex items-center gap-6">
        {labels.map((l) => (
          <span key={l} className="tab-btn relative">
            <span style={{ visibility: 'hidden' }}>{l}</span>
            <Sk className="absolute left-0 right-0 rounded-md" style={{ top: 3, height: 12 }} />
          </span>
        ))}
      </div>
    </div>
  );
}

// pannello generico in attesa (liste di partite, statistiche, stagioni passate)
export function PanelSkeleton({ kind = 'rows', rowH = 52, avatar = 26, lines = 1, top = 300, className = '' }) {
  return (
    <div className={cn('sk-delay', className)} role="status" aria-label="Caricamento">
      {kind === 'cards' ? (
        <div className="space-y-3 px-5 pt-4">
          {Array.from({ length: fill(132, top, 6) }, (_, i) => <SkCard key={i} h={120} />)}
        </div>
      ) : (
        <SkList rowH={rowH} avatar={avatar} lines={lines} top={top} className="px-5 pt-2" />
      )}
    </div>
  );
}

// banner di squadra / giocatore / campionato (come EntityBanner "tall"): freccia vera, nome e righe sotto grigi.
// kind: 'team' (forma + posizione/allenatore), 'league' (gare/squadre + tasto stagione), 'person' (foto a destra)
export function SkBanner({ kind = 'team' }) {
  const navigate = useNavigate();
  return (
    <div className="safe-top relative pb-7 pl-1.5 pr-4 pt-5">
      {kind === 'person' ? <Sk className="absolute right-3 rounded-[22px]" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 4px)' }} width={96} height={96} /> : null}
      <div className="flex items-start gap-0.5">
        <button type="button" className="press -my-1 flex h-[38px] w-8 shrink-0 items-center justify-center" style={{ color: 'var(--ink)' }} aria-label="Indietro" onClick={() => goBack(navigate)}>
          <ChevronLeft size={22} strokeWidth={1.5} />
        </button>
        <div className="min-w-0 flex-1">
          <SkText as="div" className="title-lg text-[22px]" w="58%" />
          <SkText as="div" className="text-[12px]" w="34%" />
          {kind === 'team' ? <div className="mt-1"><Sk className="rounded-md" width={98} height={14} /></div> : null}
          {kind === 'league' ? <div className="mt-1"><Sk className="rounded-full" width={150} height={33} /></div> : null}
        </div>
      </div>
      {kind === 'team' ? <div className="mt-2.5 min-w-0 pl-[34px]"><SkText as="div" className="text-[16px]" w={170} /></div> : null}
    </div>
  );
}

// pagina di squadra / giocatore / campionato ancora in arrivo
export function EntitySkeleton({ kind = 'team', tabs }) {
  const T = { person: ['Profilo', 'Partite', 'Statistiche', 'Carriera'], league: ['Partite', 'Classifica', 'Stat. squadre', 'Giocatori'], team: ['Partite', 'Classifica', 'Squadra', 'Giocatori'] };
  return (
    <div className="sk-delay" role="status" aria-label="Caricamento">
      <SkBanner kind={kind} />
      {/* la barra vera delle schede sta 2 px sotto il banner fisso (--ent-h) */}
      <SkTabs className="mt-[2px]" labels={tabs || T[kind] || T.team} />
      <div className="space-y-3 px-5 pt-5">
        <SkCard h={134} />
        <SkCard h={240} />
        <SkCard h={180} />
      </div>
    </div>
  );
}

// intestazione della partita (come MatchHero) quando la partita non e' ancora nota
export function SkMatchHero() {
  const navigate = useNavigate();
  const side = (
    <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
      <Sk className="rounded-full" width={54} height={54} />
      <SkText className="text-[13px] leading-tight" w={78} style={{ width: 78 }} />
      <Sk className="rounded-full" width={80} height={13} />
    </div>
  );
  return (
    <section className="safe-top px-4 pb-3">
      <div className="flex items-center gap-2">
        <button type="button" className="glass press flex h-9 w-9 items-center justify-center rounded-full" aria-label="Indietro" onClick={() => goBack(navigate)}>
          <ChevronLeft size={19} />
        </button>
        <Sk className="mx-auto rounded-md" width={150} height={12} />
        <span className="h-9 w-9" />
      </div>
      <div className="glass mt-3 rounded-[28px] px-4 pb-4 pt-5">
        <div className="flex items-start">
          {side}
          <div className="flex w-[104px] flex-none flex-col items-center pt-3">
            <SkText className="title-xl text-[30px]" w={72} style={{ width: 72 }} />
            <SkText className="mt-1.5 text-[11px]" w={66} style={{ width: 66 }} />
          </div>
          {side}
        </div>
      </div>
    </section>
  );
}

// pagina partita in preparazione, sotto l'intestazione (vera se la partita e' gia' nota, altrimenti SkMatchHero)
export function SkMatchBody() {
  return (
    <div className="sk-delay pt-2" role="status" aria-label="Caricamento">
      <SkTabs />
      <div className="space-y-3 px-5 pt-4">
        <SkCard h={284} />
        <SkCard h={186} />
      </div>
    </div>
  );
}
