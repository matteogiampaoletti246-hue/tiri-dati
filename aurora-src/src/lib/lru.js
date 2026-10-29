// Memoria a capienza fissa: tenendo l'app aperta a lungo non cresce all'infinito (le voci usate meno di recente si buttano).
export function lruGet(map, k) {
  if (!map.has(k)) return undefined;
  const v = map.get(k);
  map.delete(k);
  map.set(k, v);
  return v;
}
export function lruSet(map, k, v, max, onDrop) {
  map.delete(k);
  map.set(k, v);
  while (map.size > max) {
    const old = map.keys().next().value;
    const ov = map.get(old);
    map.delete(old);
    if (onDrop) try { onDrop(old, ov); } catch (e) { /* ignora */ }
  }
}
