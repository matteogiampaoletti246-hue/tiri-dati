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
  if (map.size > max) {
    // si butta un blocco di voci vecchie in un colpo solo: togliere una voce alla volta dalla testa di una Map costringe a riscorrere ogni volta
    // le voci gia' cancellate (con migliaia di nomi diversi era il punto piu' lento dell'avvio); la capienza non supera mai `max`
    let n = map.size - max + (max >> 3);
    for (const old of map.keys()) {
      const ov = onDrop ? map.get(old) : undefined;
      map.delete(old);
      if (onDrop) try { onDrop(old, ov); } catch (e) { /* ignora */ }
      if (--n <= 0) break;
    }
  }
}
