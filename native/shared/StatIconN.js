// Icone delle statistiche (Matchup e Migliori Giocatori), stesse del sito: linea nel colore passato, dettagli a colori fissi.
import React from 'react';
import Svg, { Path, Rect, Circle, Ellipse, G, Mask, Defs } from 'react-native-svg';

const Y = '#F5C84C';
const R = '#E5484D';
const GR = '#1FA45B';

export default function StatIconN({ k, size = 22, color = '#fff' }) {
  const p = { viewBox: '0 0 24 24', width: size, height: size, fill: 'none' };
  const ln = { strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (k === 'corner') {
    return (
      <Svg {...p}>
        <Path d="M7 3v18" stroke={color} strokeWidth="1.6" {...ln} />
        <Path d="M7 4l12 4.2L7 12.4z" fill={R} />
        <Ellipse cx="7" cy="21" rx="3.6" ry="1.1" fill={color} fillOpacity=".35" />
      </Svg>
    );
  }
  if (k === 'cards' || k === 'cards1') {
    return (
      <Svg {...p}>
        <Rect x="4" y="5" width="9" height="13" rx="1.6" transform="rotate(-8 8 11)" fill={Y} />
        <Rect x="11" y="6" width="9" height="13" rx="1.6" transform="rotate(8 16 12)" fill={R} />
      </Svg>
    );
  }
  if (k === 'referees') {
    return (
      <Svg {...p}>
        <G stroke={color} strokeWidth="1.4" {...ln}>
          <Path d="M3.6 9.6h8.7a4.2 4.2 0 0 1 0 8.4H8.2a4.6 4.6 0 0 1-4.6-4.6V9.6Z" />
          <Path d="M16.5 10.8h3.9v2.6h-3.9" />
          <Circle cx="9.5" cy="13.8" r="1.6" />
        </G>
      </Svg>
    );
  }
  if (k === 'shots') {
    return (
      <Svg {...p}>
        <Defs>
          <Mask id={`sb${size}`}>
            <Rect width="24" height="24" fill="#fff" />
            <Path d="M12 8.4l3.1 2.2-1.2 3.7h-3.8l-1.2-3.7z" fill="#000" />
            <Path d="M12 8.4V3M15.1 10.6l5-1.7M13.9 14.3l3.2 4.2M10.1 14.3l-3.2 4.2M8.9 10.6l-5-1.7" stroke="#000" strokeWidth="1.1" />
          </Mask>
        </Defs>
        <Circle cx="12" cy="12" r="9.2" fill={color} mask={`url(#sb${size})`} />
      </Svg>
    );
  }
  if (k === 'sot') {
    return (
      <Svg {...p}>
        <G stroke={color} strokeWidth="1.3">
          <Path d="M1.5 18.5V6.5h21v12" />
          <Path d="M1.5 10.5h21M6.5 6.5v12M11.5 6.5v12M16.5 6.5v12" strokeOpacity=".3" />
        </G>
        <Circle cx="19" cy="9.4" r="2" fill={Y} />
      </Svg>
    );
  }
  if (k === 'fc' || k === 'fs') {
    return (
      <Svg {...p}>
        <G stroke={color} strokeWidth="1.5" {...ln}>
          <Path d="M3.6 11h8.7a4.2 4.2 0 0 1 0 8.4H8.2A4.6 4.6 0 0 1 3.6 14.8V11Z" />
          <Path d="M16.5 12.2h3.9v2.6h-3.9" />
          <Circle cx="9.5" cy="15.2" r="1.6" />
        </G>
        {k === 'fc'
          ? <Path d="M18 3.5v5.2M15.6 6.3 18 8.7l2.4-2.4" stroke={R} strokeWidth="1.8" {...ln} />
          : <Path d="M18 8.7V3.5M15.6 5.9 18 3.5l2.4 2.4" stroke={GR} strokeWidth="1.8" {...ln} />}
      </Svg>
    );
  }
  if (k === 'fouls') {
    return (
      <Svg {...p}>
        <G transform="rotate(-45 12 12)">
          <Rect x="2.2" y="7.6" width="19.6" height="8.8" rx="4.4" fill={Y} fillOpacity=".9" stroke={color} strokeWidth="1.3" />
          <Rect x="8.4" y="7.6" width="7.2" height="8.8" fill={color} fillOpacity=".25" stroke={color} strokeWidth="1.1" />
          <Circle cx="10.6" cy="10.8" r=".7" fill={color} />
          <Circle cx="13.4" cy="10.8" r=".7" fill={color} />
          <Circle cx="10.6" cy="13.2" r=".7" fill={color} />
          <Circle cx="13.4" cy="13.2" r=".7" fill={color} />
        </G>
      </Svg>
    );
  }
  const cells = [];
  for (let i = 0; i < 4; i += 1) for (let j = 0; j < 3; j += 1) cells.push(<Rect key={`${i}${j}`} x={9 + i * 3.25} y={7.5 + j * 3.4} width="3.25" height="3.4" fill={(i + j) % 2 === 0 ? Y : R} />);
  return (
    <Svg {...p}>
      <Path d="M2.5 7H21.5" stroke={color} strokeWidth="1.8" {...ln} />
      {cells}
      <Rect x="9" y="7.5" width="13" height="10.2" stroke={color} strokeWidth="1" />
    </Svg>
  );
}
