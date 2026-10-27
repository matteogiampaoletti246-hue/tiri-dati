import { useEffect, useState } from 'react';

// Ri-renderizza a intervalli regolari (minuto live, orologio).
export default function useTicker(interval = 30000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), interval);
    return () => clearInterval(id);
  }, [interval]);
  return tick;
}
