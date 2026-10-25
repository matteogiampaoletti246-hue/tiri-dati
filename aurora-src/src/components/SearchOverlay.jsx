import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import Crest from './Crest';
import LeagueBadge from './LeagueBadge';
import { TEAMS } from '@/data/teams';
import { LEAGUES } from '@/data/leagues';
import { PLAYERS } from '@/data/players';
import { REFEREES } from '@/data/referees';

const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function SearchOverlay({ open, onClose }) {
  const [q, setQ] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ('');
      const id = setTimeout(() => inputRef.current && inputRef.current.focus(), 60);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  const needle = norm(q);
  const teams = needle ? TEAMS.filter((t) => norm(t.name).includes(needle)).slice(0, 8) : [];
  const leagues = needle ? LEAGUES.filter((l) => norm(l.name).includes(needle)).slice(0, 6) : [];
  const players = needle ? PLAYERS.filter((p) => norm(p.name).includes(needle)).slice(0, 8) : [];
  const referees = needle ? REFEREES.filter((r) => norm(r.name).includes(needle)).slice(0, 8) : [];

  const go = (path) => {
    onClose();
    navigate(path);
  };

  const Section = ({ title, children }) => (
    <div className="mt-6">
      <p className="label-sm px-5">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );

  const Row = ({ children, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-opacity active:opacity-50"
    >
      {children}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 fade-in" style={{ background: 'color-mix(in srgb, var(--sky-2) 92%, transparent)', backdropFilter: 'blur(24px)' }}>
      <div className="mx-auto min-h-screen w-full max-w-[430px]">
        <div className="flex items-center gap-3 px-5 py-4">
          <Search size={18} strokeWidth={1.25} style={{ color: 'var(--ink-3)' }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cerca"
            className="w-full bg-transparent text-[17px] font-light outline-none"
            style={{ color: 'var(--ink)' }}
          />
          <button type="button" className="icon-btn" aria-label="Chiudi" onClick={onClose}>
            <X size={20} strokeWidth={1.25} />
          </button>
        </div>

        <div className="hide-sb max-h-[calc(100vh-80px)] overflow-y-auto pb-16">
          {!needle ? null : (
            <>
              {leagues.length ? (
                <Section title="Campionati">
                  {leagues.map((l) => (
                    <Row key={l.id} onClick={() => go(`/campionato/${l.id}`)}>
                      <LeagueBadge league={l} size={26} />
                      <span className="text-[14.5px]" style={{ color: 'var(--ink)' }}>
                        {l.name}
                      </span>
                    </Row>
                  ))}
                </Section>
              ) : null}
              {teams.length ? (
                <Section title="Squadre">
                  {teams.map((t) => (
                    <Row key={t.id} onClick={() => go(`/squadra/${t.id}`)}>
                      <Crest team={t} size={26} />
                      <span className="text-[14.5px]" style={{ color: 'var(--ink)' }}>
                        {t.name}
                      </span>
                    </Row>
                  ))}
                </Section>
              ) : null}
              {players.length ? (
                <Section title="Giocatori">
                  {players.map((p) => (
                    <Row key={p.id} onClick={() => go(`/giocatore/${p.id}`)}>
                      <span className="avatar h-[26px] w-[26px] text-[10px]">{p.initials}</span>
                      <span className="text-[14.5px]" style={{ color: 'var(--ink)' }}>
                        {p.name}
                      </span>
                    </Row>
                  ))}
                </Section>
              ) : null}
              {referees.length ? (
                <Section title="Arbitri">
                  {referees.map((r) => (
                    <Row key={r.id} onClick={() => go(`/arbitro/${r.id}`)}>
                      <span className="avatar h-[26px] w-[26px] text-[10px]">
                        {r.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-[14.5px]" style={{ color: 'var(--ink)' }}>
                        {r.name}
                      </span>
                    </Row>
                  ))}
                </Section>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
