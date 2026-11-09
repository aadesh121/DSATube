// "Related videos": score every video against the one being watched.
const STOP = new Set(("the and for with from how what why you your into this that are using use part video full course " +
  "tutorial explained complete learn code coding english hindi best easy simple vs lecture new all about step guide " +
  "problem problems solution interview questions beginners beginner python java cpp dsa data structures structure " +
  "algorithm algorithms lesson series playlist").split(" "));

export function tokens(title) {
  const out = new Set();
  for (const t of title.toLowerCase().match(/[a-z0-9+#]+/g) || []) if (t.length >= 3 && !STOP.has(t)) out.add(t);
  return [...out];
}

export function buildIdf(videos) {
  const df = new Map();
  for (const v of videos) for (const t of v.tok) df.set(t, (df.get(t) || 0) + 1);
  const idf = new Map();
  df.forEach((c, t) => idf.set(t, Math.log(1 + videos.length / c)));
  return idf;
}

export function related(v, videos, idf, k = 40) {
  const mine = new Set(v.tok);
  const scored = [];
  for (const u of videos) {
    if (u.id === v.id) continue;
    let s = Math.log10(u.views + 10) * 0.3;         // popularity breaks ties
    for (const t of u.tok) if (mine.has(t)) s += idf.get(t);
    if (u.topic === v.topic) s += 4;
    if (u.channel && u.channel === v.channel) s += 3;
    scored.push([s, u]);
  }
  scored.sort((a, b) => b[0] - a[0]);
  return scored.slice(0, k).map((x) => x[1]);
}
