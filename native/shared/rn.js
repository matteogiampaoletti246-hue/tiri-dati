// 'react-native' con Text e TextInput a dimensione fissa: il sito non segue "Dimensione testo" di iPhone, l'app nativa nemmeno (stessi font e stesse misure).
// Metro (metro.config.js) manda qui ogni import di 'react-native' fatto dai file dell'app.
import React from 'react';
import * as RN from 'react-native-real';

const T = RN.Text;
const TI = RN.TextInput;
export const Text = React.forwardRef((p, ref) => <T ref={ref} allowFontScaling={false} {...p} />);
Text.displayName = 'Text';
export const TextInput = React.forwardRef((p, ref) => <TI ref={ref} allowFontScaling={false} {...p} />);
TextInput.displayName = 'TextInput';
export * from 'react-native-real';
