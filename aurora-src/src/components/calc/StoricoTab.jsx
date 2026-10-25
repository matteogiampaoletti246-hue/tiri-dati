import { useRef, useState } from 'react';
import PanelTitle from '@/components/PanelTitle';
import { comma, longDate } from '@/lib/format';
import StatBox from './StatBox';

const dateTime = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${longDate(d)} · ${hh}:${mm}`;
};

export default function StoricoTab({ plays, onRemove, onMerge }) {
  const fileRef = useRef(null);
  const [message, setMessage] = useState('');

  const mean = (pick) => (plays.length ? plays.reduce((acc, p) => acc + (pick(p) || 0), 0) / plays.length : null);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(plays, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `storico-calcolatore-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage(`Backup esportato · ${plays.length} giocate`);
  };

  const importJson = (event) => {
    const file = event.target.files && event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        const list = Array.isArray(data) ? data.filter((p) => p && p.id) : [];
        if (!list.length) {
          setMessage('File non valido: nessuna giocata trovata');
          return;
        }
        onMerge(list);
        setMessage(`Backup importato · ${list.length} giocate`);
      } catch {
        setMessage('File non valido: impossibile leggere il backup');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="px-5 pb-8 pt-5">
      <PanelTitle>Riepilogo</PanelTitle>
      <div className="flex gap-2">
        <StatBox label="Giocate" value={String(plays.length)} />
        <StatBox label="Affidabilità media" value={comma(mean((p) => p.score), 1)} />
      </div>
      <div className="mt-2 flex gap-2">
        <StatBox label="Stake medio" value={comma(mean((p) => p.stake), 2)} />
        <StatBox label="Valore medio" value={comma(mean((p) => p.comboValue), 2)} />
      </div>

      <div className="mt-4 flex items-center justify-end gap-5">
        <button
          type="button"
          onClick={exportJson}
          disabled={!plays.length}
          className="filter-btn is-on transition-opacity active:opacity-50 disabled:opacity-30"
          style={{ color: 'var(--accent)' }}
        >
          Esporta backup
        </button>
        <button
          type="button"
          onClick={() => fileRef.current && fileRef.current.click()}
          className="filter-btn is-on transition-opacity active:opacity-50"
          style={{ color: 'var(--accent)' }}
        >
          Importa backup
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} />
      </div>
      {message ? (
        <p className="mt-2 text-right text-[11px]" style={{ color: 'var(--ink-3)' }}>
          {message}
        </p>
      ) : null}

      <div className="mt-7">
        <PanelTitle>Giocate salvate</PanelTitle>
        {plays.length ? (
          <div className="flex flex-col gap-2">
            {plays.map((p) => (
              <div key={p.id} className="panel-flat px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px]" style={{ color: 'var(--ink)' }}>
                      {p.title}
                    </p>
                    <p className="truncate text-[11.5px]" style={{ color: 'var(--ink-3)' }}>
                      {p.subtitle}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="tnum text-[19px] font-light" style={{ color: 'var(--ink)' }}>
                      {comma(p.score, 1)}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--ink-3)' }}>
                      affidabilità
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <p className="tnum text-[11.5px]" style={{ color: 'var(--ink-2)' }}>
                    Stake {comma(p.stake, 2)} · Quota {comma(p.odds, 2)}
                  </p>
                  <p className="ml-auto truncate text-[11px]" style={{ color: 'var(--ink-3)' }}>
                    {p.comboLabel} · {p.tierLabel}
                  </p>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
                    {dateTime(p.date)}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRemove(p.id)}
                    className="filter-btn ml-auto transition-opacity active:opacity-50"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel px-5 py-9 text-center">
            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink-3)' }}>
              Nessuna giocata salvata: compila un calcolo e tocca «Gioca!».
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
