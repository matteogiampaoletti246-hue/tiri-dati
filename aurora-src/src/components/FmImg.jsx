import { useState } from 'react';
import { User } from 'lucide-react';
import { teamLogo, playerFace } from '@/data/archive';

const initials = (name) => String(name || '?').split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase();

// Stemma da codice FotMob; se manca compare lo scudo con le iniziali.
export function TeamLogo({ id, name, size = 24 }) {
  const [bad, setBad] = useState(false);
  if (!id || bad) {
    return (
      <span className="flex flex-none items-center justify-center rounded-full font-extrabold" style={{ width: size, height: size, fontSize: Math.max(8, size * 0.36), background: 'var(--panel-2)', color: 'var(--ink-2)', border: '1px solid var(--hair)' }}>
        {initials(name)}
      </span>
    );
  }
  return <img src={teamLogo(id)} alt={name || ''} width={size} height={size} loading="lazy" decoding="async" onError={() => setBad(true)} className="flex-none object-contain" style={{ width: size, height: size }} />;
}

// Volto del giocatore; se manca, l'icona persona.
export function PlayerFace({ id, name, size = 40 }) {
  const [bad, setBad] = useState(false);
  return (
    <span className="flex flex-none items-center justify-center overflow-hidden rounded-full" style={{ width: size, height: size, background: 'var(--panel-2)', border: '1px solid var(--hair)', color: 'var(--ink-3)' }}>
      {id && !bad ? (
        <img src={playerFace(id)} alt={name || ''} width={size} height={size} loading="lazy" decoding="async" onError={() => setBad(true)} className="h-full w-full object-cover object-top" />
      ) : (
        <User size={size * 0.55} strokeWidth={1.6} />
      )}
    </span>
  );
}
