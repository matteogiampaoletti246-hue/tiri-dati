// Bordo luminoso che gira attorno ai tasti delle tendine (.halo-trigger): va messo come primo figlio del tasto.
// Gira con transform (compositore), non ridisegna nulla: regole in index.css (.halo-ring).
export default function HaloRing() {
  return <span className="halo-ring" aria-hidden="true"><i /></span>;
}
