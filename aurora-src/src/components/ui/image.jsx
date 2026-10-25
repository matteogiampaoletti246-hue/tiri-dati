// Sostituto semplice dell'Image di Base44 (stessa API usata dal design).
export function Image({ src, alt = '', className = '', fittingType = 'fit', ...rest }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
      style={{ objectFit: fittingType === 'fill' ? 'cover' : 'contain' }}
      {...rest}
    />
  );
}
export default Image;
