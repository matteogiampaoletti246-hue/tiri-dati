// Icone gol e assist (stesse del sito): pallone e scarpino, mai emoji.
import React from 'react';
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from 'react-native-svg';

export const BallIcon = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10.4" fill="#fff" stroke="#10131A" strokeWidth="1.6" />
    <Path d="M12 7.1l4.1 3-1.6 4.8H9.5L7.9 10.1z" fill="#10131A" />
    <Path d="M12 7.1V2M16.1 10.1l5-1.6M14.5 14.9l3 4.2M9.5 14.9l-3 4.2M7.9 10.1l-5-1.6" stroke="#10131A" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const BootIcon = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 64 64">
    <Defs><LinearGradient id="slg" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#FFD966" /><Stop offset="1" stopColor="#F2B825" /></LinearGradient></Defs>
    <Path d="M7 15Q8 9 15 9L22 9Q24 16 30 19Q34 12 37 10L41 11Q47 30 56 41Q61 47 58 53Q54 56 49 53L33 45Q16 38 9 31Q6 24 7 15Z" fill="url(#slg)" />
    <Path d="M33 24Q40 36 47 44Q40 42 34 37Q31 30 33 24Z" fill="#B9810A" fillOpacity=".75" />
    <Path d="M12 33l-2 4.5M20 37.5l-2 4.5M28 41.5l-2 4.5M36 46l-2 4.5M44 50l-2 4.5" stroke="#B9810A" strokeWidth="3.2" strokeLinecap="round" />
  </Svg>
);

// icona infortunato: croce bianca su cerchio rosso
export const InjuryIconN = ({ size = 15 }) => (
  <Svg width={size} height={size} viewBox="0 0 16 16"><Circle cx="8" cy="8" r="8" fill="#E5484D" /><Path d="M8 3.6v8.8M3.6 8h8.8" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" /></Svg>
);
