import { useState } from 'react';
import PageShell from '@/components/PageShell';
import TopBar from '@/components/TopBar';
import CREDITI_STADI from '@/data/creditiStadi';

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
  {
    id: 'crediti-foto',
    title: 'Crediti foto stadi',
    body: [
      'Le foto degli stadi provengono da Wikimedia Commons e sono pubblicate con licenze libere (Creative Commons). Autori e licenze:',
      CREDITI_STADI,
    ],
  },
];

export default function Guidelines() {
  const [open, setOpen] = useState(null);
  return (
    <PageShell>
      <TopBar title="Linee guida" subtitle="Come nascono i numeri" back={false} />

      {/* FAQ concept B (21st "Accent Accordion", ai2): carte separate; aprendo una voce cresce a sinistra una barra azzurra
          che brilla, il + ruota e diventa -, il testo scende morbido (altezza animata con grid-template-rows, niente salti). */}
      <div className="mt-2 flex flex-col gap-2 px-4">
        {SECTIONS.map((s) => {
          const on = open === s.id;
          return (
            <div key={s.id} className={`faq-b glass${on ? ' open' : ''}`}>
              <button
                type="button"
                aria-expanded={on}
                className="press flex w-full items-center gap-3 py-4 pl-5 pr-4 text-left text-[15px] font-semibold tracking-[-.01em]"
                style={{ color: 'var(--ink)' }}
                onClick={() => setOpen(on ? null : s.id)}
              >
                {s.title}
                <span className="faq-pm ml-auto" aria-hidden="true"><i /><i /></span>
              </button>
              <div className="faq-body">
                <div>
                  <div className="pb-5 pl-5 pr-4 text-[13px] leading-relaxed" style={{ color: 'var(--ink-2)' }}>
                    {s.body.map((t, i) => (
                      <p key={i} className={i ? 'mt-3' : ''}>
                        {t}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}
