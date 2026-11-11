// Bandiera RETTANGOLARE (4:3) come le bandiere vere, mai tonda ne' quadrata: PNG 128x96 da flag-icons in native-link/flags43/.
// `size` e' la larghezza (come prima il diametro): l'altezza e' i 3/4. Mai emoji.
export const FLAG_RECT = `${SITE}native-link/flags43/`;
export const flagRectUrl = (code) => (code ? `${FLAG_RECT}${code}.png` : null);

export const FlagN = ({ code, name, size = 15, C, bare }) => {
  const c = code || flagCode(name);
  if (!c) return null;
  const h = Math.round(size * 0.75 * 10) / 10;
  const r = Math.max(2, Math.round(size / 8));
  return (
    <View style={{ width: size, height: h, borderRadius: r, overflow: 'hidden', backgroundColor: C ? C.chip : 'rgba(128,128,128,.25)' }}>
      <Image source={{ uri: flagRectUrl(c) }} style={{ position: 'absolute', left: 0, top: 0, width: size, height: h }} contentFit="cover" cachePolicy="memory-disk" transition={0} />
      {bare ? null : <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, borderRadius: r, borderWidth: 1, borderColor: 'rgba(255,255,255,.28)' }} />}
    </View>
  );
};

// nazionalita' del giocatore: dalla nazionale collegata o dalla carriera; { code, name } oppure null
export const natOf = (p) => {
  if (!p) return null;
  let en = p.natView ? p.natView.teamName : null;
  if (!en) { try { const c = carriereOf(p.id); en = c && c.c; } catch (e) { en = null; } }
  const code = en ? flagCode(en) : '';
  return code ? { code, name: countryIt(en) } : null;
};

// riga "stemma squadra | bandiera nazione" sotto il nome (stessa del sito: ClubNatLine)
export const ClubNatN = ({ C, team, teamName, nat, size = 15, style, own }) => (
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 7 }, style]}>
    {team ? <Image source={{ uri: team.crest }} style={{ width: size + 3, height: size + 3 }} contentFit="contain" cachePolicy="memory-disk" /> : null}
    <Text numberOfLines={1} style={{ flexShrink: 1, color: own || C.ink2, fontSize: 12.5 }}>{teamName}</Text>
    {nat ? <View style={{ width: 1, height: 13, backgroundColor: C.ink3, opacity: 0.5 }} /> : null}
    {nat ? <FlagN code={nat.code} size={size} C={C} /> : null}
    {nat ? <Text numberOfLines={1} style={{ flexShrink: 1, color: own || C.ink2, fontSize: 12.5 }}>{nat.name}</Text> : null}
  </View>
);

// nazionalita' di un risultato di ricerca: se non c'e' gia', si legge dalla carriera FotMob del giocatore (un file piccolo, ricordato)
export function useNatFor(p) {
  const [n, setN] = useState(p.nat || null);
  useEffect(() => {
    if (p.nat) { setN(p.nat); return undefined; }
    if (!p.fmId) return undefined;
    let on = true;
    careerByFm(p.fmId).then((c) => { const fc = c && c.c ? flagCode(c.c) : ''; if (on && fc) setN({ name: countryIt(c.c), fc }); }).catch(() => {});
    return () => { on = false; };
  }, [p.id]);
  return n;
}
