// Sigla del ruolo (TD, DCD, CC, ED, AS, ATT...) in un badge dorato sull'angolo del volto (concept B).
// Ruoli dal modulo FotMob con le modifiche dell'utente (`data/calcRoles.js`, `docs/regole/calcolatore-migliori.md`). Senza ruolo non si mostra niente.
export default function RoleBadge({ role, size = 'sm' }) {
  if (!role) return null;
  const big = size === 'lg';
  return (
    <span
      className="absolute grid place-items-center font-extrabold leading-none"
      style={{
        right: big ? -8 : -6,
        bottom: big ? -4 : -3,
        minWidth: big ? 30 : 24,
        height: big ? 20 : 16,
        padding: big ? '0 6px' : '0 4px',
        borderRadius: 999,
        fontSize: big ? 11 : 9.5,
        letterSpacing: '.02em',
        color: '#2e2100',
        background: 'linear-gradient(135deg, color-mix(in srgb, var(--gold) 45%, #fff) 0%, var(--gold) 50%, color-mix(in srgb, var(--gold) 70%, #000) 100%)',
        border: '1.5px solid var(--hair-2)',
        boxShadow: big ? '0 0 10px color-mix(in srgb, var(--gold) 55%, transparent)' : 'none',
      }}
    >
      {role}
    </span>
  );
}
