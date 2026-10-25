import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, RotateCw } from 'lucide-react';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import Logo, { getLogoVariant, setLogoVariant } from '@/components/Logo';

const OPTS = [
  { k: 'a', name: 'A · Pallone', note: 'Il pallone si disegna e la scritta esce da dietro.' },
  { k: 'b', name: 'B · Scudetto', note: 'Uno scudetto con la S e la pallina.' },
  { k: 'c', name: 'C · Tiro in porta', note: 'Un tiro disegna la traiettoria e finisce in porta.' },
];

function Card({ o, chosen, onPick }) {
  const [n, setN] = useState(0);
  return (
    <div className="glass mx-4 mt-4 rounded-[26px] p-4">
      <div className="flex h-[120px] items-center justify-center gap-3" key={n}>
        <Logo size={64} draw variant={o.k} />
        <motion.span
          className="title-lg overflow-hidden whitespace-nowrap"
          style={{ fontSize: 30, letterSpacing: '-.04em', paddingBottom: 4, paddingRight: 6 }}
          initial={{ opacity: 0, x: -30, maxWidth: 0 }}
          animate={{ opacity: 1, x: 0, maxWidth: 220 }}
          transition={{ delay: 1.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          ScalperLab
        </motion.span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[14px] font-extrabold">{o.name}</div>
          <div className="text-[11.5px]" style={{ color: 'var(--ink-3)' }}>{o.note}</div>
        </div>
        <button type="button" onClick={() => setN(n + 1)} className="glass press flex h-9 w-9 shrink-0 items-center justify-center rounded-full" aria-label="Rivedi">
          <RotateCw size={15} />
        </button>
        <button
          type="button"
          onClick={() => onPick(o.k)}
          className="press flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold"
          style={{ background: chosen ? 'var(--accent)' : 'var(--pill-active)', color: chosen ? '#fff' : 'var(--ink)' }}
        >
          {chosen ? <Check size={14} /> : null}
          {chosen ? 'Scelto' : 'Scegli'}
        </button>
      </div>
    </div>
  );
}

export default function ProveLogo() {
  const [cur, setCur] = useState(getLogoVariant());
  return (
    <PageShell>
      <TopBar title="Prove logo" />
      <p className="px-5 pt-3 text-[12.5px]" style={{ color: 'var(--ink-3)' }}>
        Tocca ↻ per rivedere l'animazione, poi "Scegli". Il logo scelto si vede all'avvio e in alto a sinistra.
      </p>
      {OPTS.map((o) => (
        <Card
          key={o.k}
          o={o}
          chosen={cur === o.k}
          onPick={(k) => {
            setLogoVariant(k);
            setCur(k);
          }}
        />
      ))}
    </PageShell>
  );
}
