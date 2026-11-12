// InteractionManager e' stato tolto da react-native (ultimo SDK): stessa interfaccia, solo timer (nessuna attesa delle animazioni).
export const InteractionManager = {
  runAfterInteractions(fn) {
    const t = setTimeout(() => { if (typeof fn === 'function') fn(); }, 0);
    return { cancel: () => clearTimeout(t), then: (cb) => { setTimeout(cb, 0); } };
  },
};
