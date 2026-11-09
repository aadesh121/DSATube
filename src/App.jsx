import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Moon, Search, Sun } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoCard } from "@/components/VideoCard";
import { PlaylistCard } from "@/components/PlaylistCard";
import { WatchPage } from "@/components/WatchPage";
import { PlaylistPage } from "@/components/PlaylistPage";
import { useLibrary } from "@/lib/library";
import { buildIdf, related, tokens } from "@/lib/related";

const PAGE = 24;
const TABS = [["home", "Home"], ["playlists", "Playlists"], ["later", "Watch later"], ["liked", "Liked videos"], ["history", "Watch history"]];
const LENGTHS = [["any", "Any length"], ["short", "Under 10 min"], ["mid", "10–60 min"], ["long", "Over 1 hour"]];
const lengthOk = { any: () => true, short: (d) => d < 600, mid: (d) => d >= 600 && d <= 3600, long: (d) => d > 3600 };
const EMPTY = {
  liked: "Videos you like will show up here.",
  later: "Videos you save will be kept here.",
  history: "Nothing watched yet.",
  playlists: "No playlists yet. Run python collect.py to build them.",
};
const parse = () => location.hash.replace(/^#\/?/, "").split("/").filter(Boolean).map(decodeURIComponent);
const fmt = (n) => n.toLocaleString("en");

// videos.json / playlists.json use short keys to stay small; expand them once on load
const expand = (r) => ({
  id: r.id, title: r.t, channel: r.c, topic: r.tp, views: r.v, dur: r.d,
  tok: tokens(r.t), q: `${r.t} ${r.c} ${r.tp}`.toLowerCase(),
});

const Grid = ({ children }) => <div className="grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{children}</div>;
const Note = ({ children }) => <p className="py-24 text-center text-sm text-muted-foreground">{children}</p>;
const Code = ({ children }) => <code className="rounded bg-muted px-1">{children}</code>;

export default function App() {
  const [videos, setVideos] = useState(null);
  const [rawPlaylists, setRawPlaylists] = useState([]);
  const [failed, setFailed] = useState(false);
  const [parts, setParts] = useState(parse);
  const [topic, setTopic] = useState("All");
  const [length, setLength] = useState("any");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const { lib, toggle, visit, clear } = useLibrary();
  const search = useRef(null);
  const sentinel = useRef(null);
  const saved = useRef({});
  const q = useDeferredValue(query.trim().toLowerCase());

  const view = parts[0] === "watch" ? "watch" : parts[0] === "playlist" ? "playlist" : "list";
  const tab = TABS.some((t) => t[0] === parts[0]) ? parts[0] : "home";
  const key = parts.join("/") || "home";
  const keyRef = useRef(key);
  keyRef.current = key;

  const go = useCallback((path) => {
    saved.current[keyRef.current] = window.scrollY;   // remember where the list was
    location.hash = "/" + path;
  }, []);

  useEffect(() => {
    const on = () => setParts(parse());
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  useLayoutEffect(() => { window.scrollTo(0, view === "list" ? saved.current[key] || 0 : 0); }, [key, view]);

  useEffect(() => {
    const base = import.meta.env.BASE_URL;
    const json = (f) => fetch(base + f, { cache: "no-cache" }).then((r) => (r.ok ? r.json() : Promise.reject()));
    json("videos.json").then((d) => setVideos(d.videos.map(expand))).catch(() => setFailed(true));
    json("playlists.json").then((d) => setRawPlaylists(d.playlists)).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "/" && !/input|textarea/i.test(document.activeElement?.tagName)) {
        e.preventDefault();
        search.current?.focus();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);

  const all = videos ?? [];
  const byId = useMemo(() => new Map(all.map((v) => [v.id, v])), [videos]);
  const idf = useMemo(() => buildIdf(all), [videos]);
  const playlists = useMemo(() => rawPlaylists
    .map((p) => {
      const ids = p.v.filter((id) => byId.has(id));
      return { id: p.id, title: p.t, channel: p.c, topic: p.tp, kind: p.k, ids, count: ids.length };
    })
    .filter((p) => p.count >= 3), [rawPlaylists, byId]);
  const plById = useMemo(() => new Map(playlists.map((p) => [p.id, p])), [playlists]);

  const countTopics = (items) => {
    const c = {};
    items.forEach((x) => (c[x.topic] = (c[x.topic] || 0) + 1));
    return Object.keys(c).sort((a, b) => c[b] - c[a]).map((t) => [t, c[t]]);
  };
  const chipSource = tab === "playlists" ? playlists : all;
  const topics = useMemo(() => countTopics(chipSource), [tab, videos, playlists]);

  const videoList = useMemo(() => {
    let l = all; // already sorted by views in videos.json
    if (tab === "later" || tab === "liked" || tab === "history") l = lib[tab].map((id) => byId.get(id)).filter(Boolean);
    if (tab === "home" && topic !== "All") l = l.filter((v) => v.topic === topic);
    if (tab === "home" && length !== "any") l = l.filter((v) => lengthOk[length](v.dur));
    if (q) l = l.filter((v) => v.q.includes(q));
    return l;
  }, [videos, byId, tab, topic, length, q, lib]);

  const playlistList = useMemo(() => {
    let l = playlists;
    if (topic !== "All") l = l.filter((p) => p.topic === topic);
    if (q) l = l.filter((p) => `${p.title} ${p.channel}`.toLowerCase().includes(q));
    return l;
  }, [playlists, topic, q]);

  const items = tab === "playlists" ? playlistList : videoList;

  useEffect(() => setTopic("All"), [tab]);
  useEffect(() => setShown(PAGE), [tab, topic, length, q]);
  useEffect(() => {  // infinite scroll
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShown((s) => s + PAGE * 2), { rootMargin: "900px" });
    io.observe(el);
    return () => io.disconnect();
  }, [items, shown, view]);

  // ----- watch / playlist routes -----
  const video = view === "watch" ? byId.get(parts[1]) : null;
  const watchList = view === "watch" && parts[2] ? plById.get(parts[2]) : null;
  const openPlaylist = view === "playlist" ? plById.get(parts[1]) : null;
  const suggestions = useMemo(() => (video ? related(video, all, idf, 40) : []), [video?.id, videos]);
  useEffect(() => { if (video) visit(video.id); }, [video?.id]);
  useEffect(() => { document.title = video ? `${video.title} · DSATube` : "DSATube"; }, [video?.id]);
  const queueOf = (p) => p.ids.map((id) => byId.get(id));

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1500px] items-center gap-3 px-4">
          <button onClick={() => go("home")} className="cursor-pointer text-[17px] font-semibold tracking-tight">
            dsa<span className="text-muted-foreground">tube</span>
          </button>
          <div className="relative ml-auto w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input ref={search} value={query}
                   onChange={(e) => { setQuery(e.target.value); if (view !== "list") go(tab); }}
                   placeholder={tab === "playlists" ? `Search playlists` : videos ? `Search videos` : "Search videos"}
                   className="pl-8 pr-8" aria-label="Search" />
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border px-1.5 text-[10px] text-muted-foreground sm:block">/</kbd>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setDark((d) => !d)} aria-label="Toggle theme">
            {dark ? <Sun /> : <Moon />}
          </Button>
        </div>
      </header>

      {view === "watch" && (video
        ? <WatchPage video={video} queue={watchList ? queueOf(watchList) : null} playlist={watchList}
                     suggestions={suggestions} lib={lib} toggle={toggle} go={go} />
        : <Note>{videos ? <>Video not found. <button className="underline" onClick={() => go("home")}>Back to home</button></> : "Loading…"}</Note>)}

      {view === "playlist" && (openPlaylist
        ? <PlaylistPage playlist={openPlaylist} queue={queueOf(openPlaylist)} go={go} />
        : <Note>{videos ? <>Playlist not found. <button className="underline" onClick={() => go("playlists")}>All playlists</button></> : "Loading…"}</Note>)}

      {/* the list stays mounted (just hidden) so Back returns to exactly where you were */}
      <main className={`mx-auto max-w-[1500px] px-4 pb-20 pt-5 ${view === "list" ? "" : "hidden"}`}>
        <div className="mb-5 space-y-3">
          <div className="-mx-4 overflow-x-auto px-4">
            <Tabs value={tab} onValueChange={go}>
              <TabsList>{TABS.map(([k, l]) => <TabsTrigger key={k} value={k}>{l}</TabsTrigger>)}</TabsList>
            </Tabs>
          </div>
          {(tab === "home" || tab === "playlists") && topics.length > 1 && (
            <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4">
              {[["All", chipSource.length], ...topics].map(([t, n]) => (
                <Button key={t} size="sm" variant={topic === t ? "default" : "secondary"} onClick={() => setTopic(t)} className="rounded-full">
                  {t}<span className="text-[11px] opacity-60">{n > 999 ? `${Math.round(n / 100) / 10}k` : n}</span>
                </Button>
              ))}
            </div>
          )}
          {videos?.length > 0 && (
            <div className="-mx-4 flex items-center gap-1.5 overflow-x-auto px-4">
              {tab === "home" && LENGTHS.map(([k, l]) => (
                <Button key={k} size="sm" variant={length === k ? "outline" : "ghost"}
                        className={length === k ? "border-foreground/40" : "text-muted-foreground"} onClick={() => setLength(k)}>
                  {l}
                </Button>
              ))}
              <span className="ml-auto shrink-0 pl-3 text-xs text-muted-foreground">
                {fmt(items.length)} {tab === "playlists" ? "playlists" : "videos"}
              </span>
            </div>
          )}
        </div>

        {!videos && !failed && (
          <Grid>{Array.from({ length: 8 }, (_, i) => (
            <div key={i}><Skeleton className="aspect-video rounded-xl" /><Skeleton className="mt-3 h-4 w-11/12" /><Skeleton className="mt-2 h-3 w-1/2" /></div>
          ))}</Grid>
        )}
        {failed && <Note>Couldn't load <Code>videos.json</Code>. Run <Code>python collect.py</Code>, then reload.</Note>}
        {videos?.length === 0 && <Note>No videos yet. Run <Code>python collect.py</Code> to fetch some.</Note>}

        {videos?.length > 0 && (items.length === 0
          ? <Note>{q ? `Nothing found for "${query}".` : EMPTY[tab] ?? "No videos match these filters."}</Note>
          : (
            <>
              {(tab === "later" || tab === "liked" || tab === "history") && (
                <div className="mb-4 flex justify-end"><Button variant="ghost" size="sm" onClick={() => clear(tab)}>Clear</Button></div>
              )}
              <Grid key={tab + topic + length}>
                {tab === "playlists"
                  ? items.slice(0, shown).map((p, i) => <PlaylistCard key={p.id} p={p} index={i} first={byId.get(p.ids[0])} onOpen={(id) => go(`playlist/${id}`)} />)
                  : items.slice(0, shown).map((v, i) => <VideoCard key={v.id} v={v} index={i} liked={lib.liked.includes(v.id)} onOpen={(id) => go(`watch/${id}`)} onLike={(id) => toggle("liked", id)} />)}
              </Grid>
              {shown < items.length && <div ref={sentinel} className="h-24" aria-hidden />}
            </>
          ))}
      </main>
    </div>
  );
}
