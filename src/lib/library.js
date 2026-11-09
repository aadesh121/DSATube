import { useCallback, useEffect, useState } from "react";

const KEYS = ["liked", "later", "history"];
const read = (k) => {
  try { const v = JSON.parse(localStorage.getItem("dsatube:" + k)); return Array.isArray(v) ? v : []; }
  catch { return []; }
};

export function useLibrary() {
  const [lib, setLib] = useState(() => Object.fromEntries(KEYS.map((k) => [k, read(k)])));

  useEffect(() => {
    try { KEYS.forEach((k) => localStorage.setItem("dsatube:" + k, JSON.stringify(lib[k]))); } catch {}
  }, [lib]);

  const toggle = useCallback((k, id) =>
    setLib((l) => ({ ...l, [k]: l[k].includes(id) ? l[k].filter((x) => x !== id) : [id, ...l[k]] })), []);
  const visit = useCallback((id) =>
    setLib((l) => ({ ...l, history: [id, ...l.history.filter((x) => x !== id)].slice(0, 200) })), []);
  const clear = useCallback((k) => setLib((l) => ({ ...l, [k]: [] })), []);

  return { lib, toggle, visit, clear };
}
