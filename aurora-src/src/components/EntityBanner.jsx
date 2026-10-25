import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';
import useCollapse from '@/hooks/useCollapse';

// Banner a tutta larghezza (campionato / squadra): gradiente del colore principale,
// tassello logo + nome + sottotitolo, logo gigante sfumato a destra, texture diagonale
// e dissolvenza verso lo sfondo in basso. Slot pronti per logoUrl e photoUrl.
export default function EntityBanner({
  name,
  subtitle,
  meta,
  colors = ['#1E4BD8', '#7FB6E8'],
  logoUrl = null,
  photoUrl = null,
  initials = '',
  bigText = '',
  liveCount = 0,
  collapse = 160,
}) {
  const navigate = useNavigate();
  const p = useCollapse(collapse);
  const gradient = `linear-gradient(150deg, ${colors[0]} 0%, ${colors[1]} 100%)`;

  const Tile = ({ size }) => (
    <span
      className="flex flex-none items-center justify-center overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        background: 'rgba(255,255,255,.20)',
        border: '1px solid rgba(255,255,255,.38)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {logoUrl ? (
        <Image src={logoUrl} alt={name} className="h-full w-full" fittingType="fit" />
      ) : (
        <span className="tnum font-semibold" style={{ fontSize: Math.max(10, Math.round(size * 0.3)), color: '#fff' }}>
          {initials}
        </span>
      )}
    </span>
  );

  const Live = ({ tone }) =>
    liveCount > 0 ? (
      <span
        className="ml-auto flex items-center gap-1.5 text-[11.5px] font-semibold tracking-[.02em]"
        style={{ color: tone === 'light' ? '#fff' : 'var(--live)' }}
      >
        <span className="live-dot" />
        {liveCount} LIVE
      </span>
    ) : null;

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30" style={{ opacity: p, pointerEvents: p > 0.7 ? 'auto' : 'none' }}>
        <div
          className="mx-auto flex max-w-[430px] items-center gap-3 px-5 py-2.5"
          style={{
            background: 'color-mix(in srgb, var(--sky-2) 78%, transparent)',
            backdropFilter: 'blur(20px) saturate(160%)',
            WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          }}
        >
          <button type="button" className="icon-btn -ml-1" aria-label="Indietro" onClick={() => navigate(-1)}>
            <ChevronLeft size={22} strokeWidth={1.25} />
          </button>
          <Tile size={24} />
          <span className="truncate text-[13.5px]" style={{ color: 'var(--ink)' }}>
            {name}
          </span>
          <Live tone="dark" />
        </div>
      </header>

      <section
        className="relative w-full overflow-hidden"
        style={{
          background: gradient,
          transform: `scale(${1 - p * 0.05})`,
          transformOrigin: 'top center',
          opacity: Math.max(0, 1 - p * 1.15),
        }}
      >
        {photoUrl ? (
          <Image src={photoUrl} alt="" className="absolute inset-0 h-full w-full" fittingType="fill" />
        ) : null}
        {photoUrl ? <span className="absolute inset-0" style={{ background: gradient, opacity: 0.72 }} /> : null}

        <span
          className="absolute inset-0"
          style={{ background: 'linear-gradient(150deg, rgba(8,14,28,.34) 0%, rgba(8,14,28,.10) 58%, rgba(8,14,28,0) 100%)' }}
        />
        <span className="banner-lines absolute inset-0" aria-hidden="true" />

        <span
          className="pointer-events-none absolute"
          style={{ right: '-5%', bottom: '-18%', opacity: 0.15 }}
          aria-hidden="true"
        >
          {logoUrl ? (
            <Image src={logoUrl} alt="" className="h-[170px] w-[170px]" fittingType="fill" />
          ) : (
            <span className="title-xl" style={{ fontSize: 148, color: '#fff', letterSpacing: '-.05em' }}>
              {bigText || initials}
            </span>
          )}
        </span>

        <span
          className="pointer-events-none absolute inset-x-0 bottom-0 h-14"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--sky-2) 100%)' }}
          aria-hidden="true"
        />

        <div className="relative px-5 pb-5" style={{ paddingTop: 52 }}>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="icon-btn -ml-1"
              aria-label="Indietro"
              onClick={() => navigate(-1)}
              style={{ color: 'rgba(255,255,255,.92)' }}
            >
              <ChevronLeft size={22} strokeWidth={1.4} />
            </button>
            <Live tone="light" />
          </div>

          <div className="mt-4 flex items-center gap-3.5">
            <Tile size={44} />
            <div className="min-w-0">
              <h1 className="title-xl truncate text-[27px]" style={{ color: '#fff', textShadow: '0 2px 18px rgba(10,17,32,.28)' }}>
                {name}
              </h1>
              {subtitle ? (
                <p className="mt-1 truncate text-[11.5px]" style={{ color: 'rgba(255,255,255,.82)' }}>
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          {meta ? <div className="mt-3.5">{meta}</div> : null}
        </div>
      </section>
    </>
  );
}
