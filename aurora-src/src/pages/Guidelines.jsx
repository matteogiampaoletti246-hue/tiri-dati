import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';

const SECTIONS = [
  {
    id: 'giocatori',
    title: 'Calcolo giocatori',
    body: [
      'Il voto di ogni giocatore parte dalla media attesa, corretta dalla difficoltà dell’avversario e dal rendimento delle ultime cinque partite giocate.',
      'Le soglie Over 0,5, Over 1,5 e Over 2,5 richiedono un contributo crescente tra gol, assist e tiri: alzando la soglia il voto atteso si avvicina alla media attesa e i giocatori con rendimento più alto restano in cima alla lista.',
      'I 90′ medi indicano i minuti giocati in media, mentre il voto di stagione è normalizzato su 90 minuti: così chi entra a gara in corso resta confrontabile con chi gioca dal primo minuto.',
      'La classifica è ordinata per voto atteso e mostra solo i giocatori il cui club scende in campo nella data selezionata.',
    ],
  },
  {
    id: 'tiri',
    title: 'Calcolo tiri squadre',
    body: [
      'I tiri attesi di una squadra sono la media per gara delle conclusioni registrate, divise tra tiri totali, tiri in porta, tiri fuori e conclusioni da fuori area.',
      'Ogni totale di stagione viene diviso per le partite giocate dalla squadra, così il valore resta confrontabile anche tra club con calendari diversi.',
      'L’xG misura la qualità delle conclusioni: è la somma delle probabilità di gol di ogni tiro. Il divario tra due squadre è la differenza tra i valori attesi, calcolata per angoli, cartellini, tiri, falli e fuorigioco.',
      'Le partite usate indicano quante gare di campionato sono entrate nel calcolo per la squadra di casa e per quella in trasferta.',
    ],
  },
];

export default function Guidelines() {
  const [open, setOpen] = useState(null);
  return (
    <PageShell>
      <TopBar title="Linee guida" subtitle="Come nascono i numeri" back={false} />

      <div className="mt-2 px-5">
        {SECTIONS.map((s) => {
          const on = open === s.id;
          return (
            <div key={s.id} style={{ borderBottom: '1px solid var(--hair-2)' }}>
              <button
                type="button"
                className="flex w-full items-center py-5 text-left text-[16px] font-light tracking-[-.02em]"
                style={{ color: 'var(--ink)' }}
                onClick={() => setOpen(on ? null : s.id)}
              >
                {s.title}
                <ChevronDown
                  size={16}
                  strokeWidth={1.2}
                  className="ml-auto transition-transform duration-300"
                  style={{ transform: on ? 'rotate(180deg)' : 'none', color: 'var(--ink-3)' }}
                />
              </button>
              {on ? (
                <div className="fade-in pb-6 text-[13px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                  {s.body.map((t, i) => (
                    <p key={i} className={i ? 'mt-3' : ''}>
                      {t}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
