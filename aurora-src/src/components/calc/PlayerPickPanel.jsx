import { teamGrad } from '@/lib/tint';
import InjuryIcon from '@/components/InjuryIcon';
import { injuryOf } from '@/data/injuries';
import Alert from '@/components/Alert';
import { primeKeyboard } from '@/lib/keyboard';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PanelTitle from '@/components/PanelTitle';
import TextFilter from '@/components/TextFilter';
import { PLAYERS } from '@/data/players';
import { teamById } from '@/data/teams';
import { HIT_OPTIONS, LINE_OPTIONS } from '@/lib/calc';
import CompBannerSelect from './CompBannerSelect';
import { playerComps } from './calcComp';
import FieldRow from './FieldRow';
import SedeButtons from './SedeButtons';
import NumInput from './NumInput';
import PickerSheet from './PickerSheet';
import MiniSelect from './MiniSelect';
import Crest from '@/components/Crest';
import ClubNatLine from '@/components/ClubNatLine';
import { countryIt } from '@/data/carriere';
import { PlayerFace } from '@/components/SearchOverlay';
import SelectRow from './SelectRow';
import CalcStatSelect from './CalcStatSelect';
import TintSweep from './TintSweep';
import RoleBadge from './RoleBadge';
import useNextMatch from '@/hooks/useNextMatch';
import { nextMatchVs } from '@/data/extras';
import { MONTHS, WEEKDAYS } from '@/lib/format';
import { romeTime } from '@/data/util';
import { cupOf } from '@/data/calcData';

const EMPTY_OPTS = [];
const nrm = (s) => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  // lettere che NFD non scompone (Tıknaz = tiknaz, Ødegaard = odegaard)
  .replace(/[ı]/g, 'i').replace(/[øœ]/g, 'o').replace(/ł/g, 'l').replace(/[đð]/g, 'd').replace(/æ/g, 'ae').replace(/ß/g, 'ss').replace(/þ/g, 'th');
// opzione leggera: avatar, sfondo e riga club/nazionale sono getter (creati solo per le righe visibili)
class PickOpt {
  constructor(p, sub) { this.p = p; this.value = p.id; this.label = p.name; this.alias = [p.nick, p.natView && p.natView.name !== p.name ? p.natView.name : null, p.natView ? p.natView.nick : null].filter(Boolean).join(' '); /* anche il nome come nel profilo della nazionale */ this.sub = sub; this._l = nrm(p.name); this._h = `${this._l}|${nrm(sub)}|${nrm(this.alias)}`; }
  get avatar() { return <PlayerFace p={this.p} size={52} />; }
  get bg() { const p = this.p; return teamGrad((p.nat ? null : teamById(p.teamId)) || teamById(p.teamId), 0x55); }
  get subNode() { return <ClubNatLine p={this.p} className="mt-0.5 text-[12px]" />; }
}
let optsCache = { n: -1, list: EMPTY_OPTS };
function buildPlayerOptions() {
  if (optsCache.n === PLAYERS.length) return optsCache.list;
  // il profilo della nazionale di un giocatore di club non e' un risultato a parte: sta nello stesso banner del club
  const list = PLAYERS.filter((p) => !(p.nat && p.club)).map((p) => {
    const t = p.nat ? null : teamById(p.teamId);
    const ct = p.nat && p.clubName ? p.clubName : '';
    return new PickOpt(p, [t ? t.name : p.teamName || '', ct, p.natView ? `${p.natView.teamName} ${countryIt(p.natView.teamName)}` : p.nat ? countryIt(p.teamName) : ''].filter(Boolean).join(' '));
  });
  list.sort((a, b) => (a._l < b._l ? -1 : a._l > b._l ? 1 : 0));
  optsCache = { n: PLAYERS.length, list };
  return list;
}

// Tasto "Prossima partita" sotto il banner: apre la partita (contro l'avversaria scelta nel Calcolatore, altrimenti la prossima
// della squadra) sopra il Calcolatore, che resta com'era al ritorno. Senza una prossima partita il tasto non si mostra.
// comp: solo partite di quella competizione (banner squadra del Calcolatore: campionato o coppa scelta); glass: dentro un banner colorato
export function NextMatchButton({ ownId, oppId, onOpen, comp, glass = false }) {
  const first = useNextMatch(ownId, comp);
  // la partita contro l'avversaria scelta solo se e' quella vicina (es. aperto da Migliori Giocatori per una data): se e' gia' finita vale la prossima vera
  const vs00 = ownId && oppId ? nextMatchVs(ownId, oppId) : null;
  const vs0 = vs00 && (!comp || vs00.leagueId === comp) ? vs00 : null;
  const m = vs0 && (!first || Math.abs(vs0.ts - first.ts) < 3 * 864e5) ? vs0 : first;
  if (!m) return null;
  const vsId = m.homeId === ownId || (teamById(m.homeId) || {}).name === (teamById(ownId) || {}).name ? m.awayId : m.homeId;
  const vs = teamById(vsId);
  const d = new Date(`${m.date}T12:00:00`);
  const when = `${WEEKDAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}${m.timeKnown === false ? '' : ` · ${m.kickoff || romeTime(m.ts)}`}`;
  return (
    <button
      type="button"
      onClick={() => onOpen(m.id)}
      className="press relative mt-3 flex w-full items-center gap-2.5 rounded-[14px] px-3 py-2.5 text-left"
      style={glass ? { background: 'hsl(var(--background) / .45)', border: '1px solid color-mix(in srgb, var(--ink) 14%, transparent)' } : { background: 'color-mix(in srgb, var(--ink) 7%, transparent)', border: '1px solid var(--hair)' }}
      aria-label={`Apri la prossima partita${vs ? ` contro ${vs.name}` : ''}`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[10.5px] font-bold uppercase tracking-[.08em]" style={{ color: 'var(--ink-3)' }}>Prossima partita</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[13.5px] font-bold" style={{ color: 'var(--ink)' }}>
          <span style={{ color: 'var(--ink-3)' }}>vs</span>
          {vs ? <Crest team={vs} size={16} /> : null}
          <span className="truncate">{vs ? vs.name : ''}</span>
        </span>
      </span>
      <span className="shrink-0 text-[12px] font-semibold tnum" style={{ color: 'var(--ink-2)' }}>{when}</span>
      <svg width="8" height="13" viewBox="0 0 8 13" aria-hidden="true" className="shrink-0"><path d="M1.5 1.5l5 5-5 5" fill="none" stroke="var(--ink-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}


// Impostazioni di base della giocata su un giocatore.
export default function PlayerPickPanel({ form, set, player, hint, onSelectPlayer, stat = 'tiri', onStat, tint, role, natHit = null }) {
  const navigate = useNavigate();
  const [picker, setPicker] = useState(null);
  const hitLabel = HIT_OPTIONS.find((o) => o.value === form.hitRate)?.label ?? null;
  // partite con almeno 50' usate per l'Hit Rate: meno di 5 (anche con la stagione passata) -> "su N partite"
  const hitTitle = form.playerId && form.hitN > 0 && form.hitN < 5 ? `Hit rate su ${form.hitN} ${form.hitN === 1 ? 'partita' : 'partite'}` : 'Hit rate ultime 5';
  const team = player ? teamById((player.nat && player.club ? player.club : player).teamId) : null;
  const compOptions = useMemo(() => playerComps(player), [player]);

  // ~36k giocatori: l'elenco si costruisce solo alla prima apertura della ricerca (le parti grafiche sono calcolate al momento, solo per le 60 righe mostrate)
  const pickerOpen = picker === 'player';
  const playerOptions = useMemo(() => (pickerOpen ? buildPlayerOptions() : EMPTY_OPTS), [pickerOpen, PLAYERS.length]);

  return (
    <section>
      <PanelTitle>Giocatore</PanelTitle>
      <div className="panel has-tint relative z-10">
        <TintSweep tint={tint} strength={14} />
        {player ? (
          <div
            className="has-tint relative w-full px-4 py-3.5"
            style={{ borderRadius: 'inherit', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            <TintSweep tint={tint && { ...tint, color: team ? team.colors[0] : tint.color }} strength={55} />
            <div className="relative flex w-full items-center gap-3">
            {/* banner e volto aprono la scheda del giocatore; per cambiare giocatore c'e' il tasto Cambia */}
            <button type="button" onClick={() => navigate(`/giocatore/${(player.nat && player.club ? player.club : player).id}`)} className="press flex min-w-0 flex-1 items-center gap-3 text-left" aria-label={`Apri la scheda di ${player.name}`}>
              <span className="relative block shrink-0" style={{ width: 56, height: 56 }}>
                <PlayerFace p={player} size={56} />
                <RoleBadge role={role} size="lg" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[17px] font-extrabold"><span className="truncate">{player.name}</span>{injuryOf(player.id) ? <InjuryIcon size={17} /> : null}</span>
                <ClubNatLine p={player} size={15} className="mt-0.5 text-[12.5px]" />
              </span>
            </button>
            <button type="button" onClick={() => { primeKeyboard(); setPicker('player'); }} className="press shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-bold text-white" style={{ background: 'var(--accent)' }}>Cambia</button>
            </div>
            {injuryOf(player.id) ? (
              <Alert tone="red" className="mt-3 w-full" icon={<InjuryIcon size={18} />} title="Infortunato">{injuryOf(player.id).reason}{injuryOf(player.id).label ? ` · Rientro previsto: ${injuryOf(player.id).label}` : ''}</Alert>
            ) : null}
            {(() => {
              // partita legata alla competizione selezionata: Coppa europea = la coppa della squadra (nessuna coppa = nessun tasto), altrimenti il campionato del blocco squadra
              const ownId = form.team && form.team.id ? form.team.id : player.teamId;
              const comp = form.competizione === 'coppa' ? cupOf(teamById(ownId)) || 'nessuna' : (form.team && form.team.leagueId) || undefined;
              return <NextMatchButton ownId={ownId} oppId={form.opp && form.opp.id} comp={comp} onOpen={(id) => navigate(`/match/${id}`)} />;
            })()}
          </div>
        ) : (
          <SelectRow
            first
            label="Giocatore"
            value={null}
            sub={null}
            placeholder="Cerca e seleziona"
            onClick={() => { primeKeyboard(); setPicker('player'); }}
          />
        )}
        <CalcStatSelect value={stat} onChange={onStat} />
        <FieldRow label="Tipo linea" noSwipe>
          <TextFilter fit options={LINE_OPTIONS} value={form.lineType} onChange={(v) => set('lineType', v)} />
        </FieldRow>
        <FieldRow label="Valore linea" hint={hint}>
          <MiniSelect
            ariaLabel="Valore linea"
            width={96}
            value={form.line}
            placeholder="—"
            onChange={(v) => set('line', v)}
            options={['0,5', '1,5', '2,5', '3,5'].map((x) => ({ value: x, label: x }))}
          />
        </FieldRow>
        <FieldRow label="Quota">
          <NumInput value={form.odds} onChange={(v) => set('odds', v)} ariaLabel="Quota" />
        </FieldRow>
        <SedeButtons value={form.sede} onChange={(v) => set('sede', v)} />
        {compOptions.length ? (
          <FieldRow label="Competizione" noSwipe>
            <CompBannerSelect value={form.competizione} options={compOptions} onChange={(v) => set('competizione', v)} />
          </FieldRow>
        ) : null}
        <FieldRow label={hitTitle}>
          <MiniSelect
            ariaLabel={hitTitle}
            width={124}
            value={form.hitRate}
            placeholder="Nessuna"
            onChange={(v) => set('hitRate', v)}
            options={[{ value: '', label: 'Nessuna' }, ...HIT_OPTIONS]}
          />
        </FieldRow>
        {/* Nations League: Hit Rate delle partite con la nazionale in questa stagione (pesa insieme a quello normale) */}
        {natHit ? (
          <FieldRow label="Hit rate nazionale">
            <span data-nat-hit="" className="tnum flex h-10 items-center rounded-xl px-3 text-[15px]" style={{ width: 124, background: 'var(--panel-2)', border: '1px solid var(--hair)', color: 'var(--ink)' }}>
              {natHit.hit}/{natHit.n}
            </span>
          </FieldRow>
        ) : null}
      </div>

      <PickerSheet
        open={picker === 'player'}
        title="Giocatore"
        placeholder="Cerca giocatore o squadra"
        cards
        requireQuery
        hint="Cerca per nome o per squadra, poi tocca per selezionare."
        options={playerOptions}
        onSelect={(o) => onSelectPlayer(o.value)}
        onClose={() => setPicker(null)}
      />
    </section>
  );
}
