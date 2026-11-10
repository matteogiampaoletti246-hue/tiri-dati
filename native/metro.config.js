const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const config = getDefaultConfig(__dirname);
// alias '@' come nel sito: i moduli dati/calcoli del sito si usano tali e quali in nativo
const prev = config.resolver.resolveRequest;
config.resolver.resolveRequest = (ctx, name, platform) => {
  if (name.startsWith('@/')) return (prev || ctx.resolveRequest)(ctx, path.join(__dirname, 'src', name.slice(2)), platform);
  return (prev || ctx.resolveRequest)(ctx, name, platform);
};
module.exports = config;
