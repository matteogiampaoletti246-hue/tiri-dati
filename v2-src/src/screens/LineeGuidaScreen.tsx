import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export const LineeGuidaScreen: React.FC = () => {
  const [openPlayerCalc, setOpenPlayerCalc] = useState(true);
  const [openTeamCalc, setOpenTeamCalc] = useState(false);

  return (
    <div className="flex flex-col w-full pb-10 p-4 gap-4">
      <div className="bg-slate-900 border-b border-slate-800 -mx-4 -mt-4 p-4 mb-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-400" />
          <h1 className="font-display font-bold text-lg text-white">
            Linee Guida & Metodologia
          </h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Architettura quantitativa, formule matematiche e criteri di ponderazione adottati da ScalperLab.
        </p>
      </div>

      {/* Accordion 1: Calcolo giocatori */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setOpenPlayerCalc(!openPlayerCalc)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex flex-col">
            <h2 className="font-display font-bold text-sm text-slate-100">
              Calcolo giocatori (Modello di Poisson)
            </h2>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Normalizzazione a 90 minuti, fattore difensivo ed esponenti
            </span>
          </div>
          {openPlayerCalc ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openPlayerCalc && (
          <div className="p-4 pt-1 border-t border-slate-800/80 flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11.5px] text-emerald-400">
              λ = tasso_90' × fattore_avversario<sup>0,85</sup> × fattore_squadra<sup>0,35</sup> × fattore_sede
            </div>

            <p>
              <b>λ (lambda)</b> rappresenta il valore atteso di tiri (totali o nello specchio) del giocatore nella specifica partita analizzata.
            </p>

            <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
              <li>
                <b className="text-slate-200">Tasso normalizzato a 90 minuti:</b> i tiri e i minuti del calciatore vengono sommati su tutte le competizioni compilate (campionato, coppe europee, nazionali), dividendo il totale tiri per i minuti totali e moltiplicando per 90. Non è una media di medie: le gare con maggior minutaggio pesano proporzionalmente di più.
              </li>
              <li>
                <b className="text-slate-200">Fattore squadra avversaria (esponente 0,85):</b> misura quanto l'avversario concede rispetto alla media del campionato. Pesa l'85% perché la capacità di contenimento difensivo è cruciale per la produzione offensiva del singolo.
              </li>
              <li>
                <b className="text-slate-200">Fattore squadra compagna (esponente 0,35):</b> misura la produzione offensiva della squadra del giocatore. Ha peso più leggero (0,35) per evitare doppi conteggi, dato che i tiratori primari generano già una fetta rilevante dei tiri totali del club.
              </li>
              <li>
                <b className="text-slate-200">Fattore sede (±6%):</b> Casa (×1,06), Trasferta (×0,94), oppure 1,00 in caso di "Nessun effetto" o campo neutro.
              </li>
              <li>
                <b className="text-slate-200">Integrazione Hit Rate ultime 5:</b> la probabilità Poisson (60%) viene combinata con il dato reale delle ultime 5 gare (40%), riflettendo lo stato di forma recente senza farsi dominare dalla varianza del piccolo campione.
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* Accordion 2: Calcolo tiri squadre */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <button
          onClick={() => setOpenTeamCalc(!openTeamCalc)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850 transition-colors"
        >
          <div className="flex flex-col">
            <h2 className="font-display font-bold text-sm text-slate-100">
              Calcolo tiri squadre (Media prevista)
            </h2>
            <span className="text-[11px] text-slate-400 mt-0.5">
              Media grezza bilaterale e correzione fattore sede ±12%
            </span>
          </div>
          {openTeamCalc ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {openTeamCalc && (
          <div className="p-4 pt-1 border-t border-slate-800/80 flex flex-col gap-3 text-xs text-slate-300 leading-relaxed">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11.5px] text-blue-400">
              media_grezza = (tiri fatti dalla squadra + tiri subiti dall'ospite) ÷ 2<br />
              media_prevista (λ) = media_grezza × fattore_sede
            </div>

            <p>
              Per le linee squadra, la media prevista integra la tendenza realizzativa del club con la vulnerabilità dell'avversario.
            </p>

            <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
              <li>
                <b className="text-slate-200">Fattore Sede ±12%:</b> Casa (×1,12), Trasferta (×0,88). Pesa il doppio rispetto al modello giocatore (±6%) poiché l'ambiente stadio condiziona l'intero collettivo per 90 minuti.
              </li>
              <li>
                <b className="text-slate-200">Coppe europee:</b> per le squadre in Champions League o Europa League, il dato viene calcolato come media ponderata tra la statistica nel campionato domestico e il rendimento internazionale.
              </li>
              <li>
                <b className="text-slate-200">Modello Stake:</b> quota tra 1,60 e 2,45 richiede voto minimo 8,00. Quote basse (&lt;1,60) subiscono riduzione proporzionale dello stake per incentivare giocate raddoppio.
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
