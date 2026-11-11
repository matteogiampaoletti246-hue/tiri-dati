const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);
// alias '@' come nel sito: i moduli dati/calcoli del sito si usano tali e quali in nativo
const prev = config.resolver.resolveRequest;
config.resolver.resolveRequest = (ctx, name, platform) => {
  if (name.startsWith('@/')) return (prev || ctx.resolveRequest)(ctx, path.join(__dirname, 'src', name.slice(2)), platform);
  // 'react-native' dei file dell'app -> shared/rn.js (testi a dimensione fissa); 'react-native-real' e' il vero modulo
  if (name === 'react-native-real') return (prev || ctx.resolveRequest)(ctx, 'react-native', platform);
  if (name === 'react-native' && ctx.originModulePath && !ctx.originModulePath.includes('node_modules') && !ctx.originModulePath.endsWith('shared/rn.js')) return { type: 'sourceFile', filePath: path.join(__dirname, 'shared', 'rn.js') };
  return (prev || ctx.resolveRequest)(ctx, name, platform);
};
module.exports = config;
