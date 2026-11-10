// Linee guida nativa (tappa 1 della migrazione): stesso testo della pagina del sito, nessuna WebView.
// Colori dal tema passato dall'app (C), mai fissi. Accordion con la LayoutAnimation nativa come le tendine della Home.
import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CREDITI_STADI from './creditiStadi';

const SECTIONS = [
  { id: 'giocatori', title: 'Calcolo giocatori', body: [
    'Il voto di ogni giocatore parte dalla media attesa, corretta dalla difficoltà dell’avversario e dal rendimento delle ultime cinque partite giocate.',
    'Le soglie Over 0,5, Over 1,5 e Over 2,5 richiedono un contributo crescente tra gol, assist e tiri: alzando la soglia il voto atteso si avvicina alla media attesa e i giocatori con rendimento più costante salgono in classifica.',
    'I 90′ medi indicano i minuti giocati in media, mentre il voto di stagione è normalizzato su 90 minuti: così chi entra a gara in corso resta confrontabile con chi gioca dal primo minuto.',
    'La classifica è ordinata per voto atteso e mostra solo i giocatori il cui club scende in campo nella data selezionata.',
  ] },
  { id: 'tiri', title: 'Calcolo tiri squadre', body: [
    'I tiri attesi di una squadra sono la media per gara delle conclusioni registrate, divise tra tiri totali, tiri in porta, tiri fuori e conclusioni da fuori area.',
    'Ogni totale di stagione viene diviso per le partite giocate dalla squadra, così il valore resta confrontabile anche tra club con calendari diversi.',
    'L’xG misura la qualità delle conclusioni: è la somma delle probabilità di gol di ogni tiro. Il divario tra due squadre è la differenza tra i valori attesi.',
    'Le partite usate indicano quante gare di campionato sono entrate nel calcolo per la squadra di casa e per quella in trasferta.',
  ] },
  { id: 'crediti-foto', title: 'Crediti foto stadi', body: [
    'Le foto degli stadi provengono da Wikimedia Commons e sono pubblicate con licenze libere (Creative Commons). Autori e licenze:',
    CREDITI_STADI,
  ] },
];

export default function Guidelines({ C, top, onBack }) {
  const [open, setOpen] = useState(null);
  const toggle = (id) => {
    LayoutAnimation.configureNext({ duration: 260, create: { type: 'easeInEaseOut', property: 'opacity' }, update: { type: 'easeInEaseOut' }, delete: { type: 'easeInEaseOut', property: 'opacity' } });
    setOpen(open === id ? null : id);
  };
  return (
    <View style={{ flex: 1, backgroundColor: 'transparent', paddingTop: top }}>
      <Pressable onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, height: 40 }}>
        <Ionicons name="chevron-back" size={20} color={C.accent} /><Text style={{ color: C.accent, fontSize: 16 }}>Home</Text>
      </Pressable>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 60 }}>
        <Text style={{ color: C.ink, fontSize: 26, fontWeight: '800', marginTop: 4 }}>Linee guida</Text>
        <Text style={{ color: C.ink3, fontSize: 13, marginTop: 2, marginBottom: 14 }}>Come nascono i numeri</Text>
        {SECTIONS.map((s) => {
          const on = open === s.id;
          return (
            <View key={s.id} style={{ marginBottom: 8, borderRadius: 18, overflow: 'hidden', backgroundColor: C.card2, borderWidth: 1, borderColor: on ? C.accRing : C.border }}>
              <Pressable onPress={() => toggle(s.id)} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingLeft: 20, paddingRight: 16 }}>
                <Text style={{ flex: 1, color: C.ink, fontSize: 15, fontWeight: '600' }}>{s.title}</Text>
                <Ionicons name={on ? 'remove' : 'add'} size={20} color={C.accent} />
              </Pressable>
              {on ? (
                <View style={{ paddingHorizontal: 20, paddingBottom: 18 }}>
                  {s.body.map((t, i) => <Text key={i} style={{ color: C.ink2, fontSize: 13, lineHeight: 20, marginTop: i ? 12 : 0 }}>{t}</Text>)}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
