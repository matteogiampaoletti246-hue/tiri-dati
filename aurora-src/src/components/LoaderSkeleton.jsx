import { cn } from '@/lib/utils';

// Barra di caricamento: grigio del tema con un riflesso che scorre (solo transform, in CSS: `.sk` in index.css).
// Colori dai temi (--sk-base / --sk-hi); con "riduci movimento" resta ferma.
export default function LoaderSkeleton({ className, width, height, borderRadius, baseColor, highlightColor, duration, style, ...props }) {
  return (
    <div
      aria-hidden="true"
      className={cn('sk', className)}
      style={{
        ...(width !== undefined && { width }),
        ...(height !== undefined && { height }),
        ...(borderRadius !== undefined && { borderRadius }),
        ...(baseColor && { background: baseColor }),
        ...(highlightColor && { '--sk-hi': highlightColor }),
        ...(duration && { '--sk-dur': `${duration}s` }),
        ...style,
      }}
      {...props}
    />
  );
}
