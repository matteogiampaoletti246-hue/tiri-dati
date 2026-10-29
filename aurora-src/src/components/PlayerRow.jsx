import PlayerPhoto from '@/components/PlayerPhoto';
import { Link } from 'react-router-dom';
import { Image } from '@/components/ui/image';
import { comma } from '@/lib/format';

const POS = { GK: 'Portiere', DEF: 'Difensore', MID: 'Centrocampista', WNG: 'Ala', ATT: 'Attaccante' };

export default function PlayerRow({ player, rank, value, valueLabel, link = false, divider = true }) {
  if (!player) return null;

  const inner = (
    <>
      <span className="avatar h-[28px] w-[28px] text-[10px]">
        <PlayerPhoto src={player.photo} alt={player.name} />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
          {player.name}
        </span>
        <span className="block text-[10.5px]" style={{ color: 'var(--ink-3)' }}>
          {POS[player.position] || player.position}
        </span>
      </span>
      {value !== undefined ? (
        <span className="ml-auto text-right">
          <span className="tnum block text-[14px] font-medium" style={{ color: 'var(--ink)' }}>
            {typeof value === 'number' ? comma(value) : value}
          </span>
          {valueLabel ? (
            <span className="block text-[10px]" style={{ color: 'var(--ink-3)' }}>
              {valueLabel}
            </span>
          ) : null}
        </span>
      ) : null}
    </>
  );

  const rowClass = 'flex flex-1 items-center gap-3 py-2.5 pr-5 transition-opacity active:opacity-60';
  const rowStyle = { paddingLeft: rank ? 0 : 20 };

  return (
    <div className="flex items-center" style={{ borderTop: divider ? '1px solid var(--hair-2)' : 'none' }}>
      {rank ? (
        <span className="tnum w-[34px] flex-none pl-5 text-[11px]" style={{ color: 'var(--ink-3)' }}>
          {rank}
        </span>
      ) : null}
      {link ? (
        <Link to={`/giocatore/${player.id}`} className={rowClass} style={rowStyle}>
          {inner}
        </Link>
      ) : (
        <div className={rowClass} style={rowStyle}>
          {inner}
        </div>
      )}
    </div>
  );
}
