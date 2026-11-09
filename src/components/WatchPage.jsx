import { useEffect, useState } from "react";
import { Bookmark, ChevronLeft, ChevronRight, ExternalLink, Heart, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoRow } from "@/components/VideoRow";
import { cn } from "@/lib/utils";

// Player on the left, suggestions on the right (below the player on phones).
// When the viewer taps the player's fullscreen button, the browser shows the player alone.
export function WatchPage({ video: v, queue, playlist, suggestions, lib, toggle, go }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => setCopied(false), [v.id]);
  const i = queue ? queue.findIndex((x) => x.id === v.id) : -1;
  const step = (d) => queue?.[i + d] && go(`watch/${queue[i + d].id}/${playlist.id}`);
  const open = (id) => go(playlist ? `watch/${id}/${playlist.id}` : `watch/${id}`);
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {}
  };

  return (
    <div className="mx-auto grid max-w-[1500px] gap-6 px-4 pb-16 pt-4 lg:grid-cols-[minmax(0,1fr)_400px]">
      <section className="min-w-0">
        <div className="aspect-video w-full overflow-hidden rounded-xl bg-black shadow-lg">
          <iframe
            key={v.id}
            className="size-full"
            src={`https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&rel=0&playsinline=1`}
            title={v.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
        <h1 className="mt-4 text-lg font-semibold leading-snug sm:text-xl">{v.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{v.channel} · {v.topic}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => toggle("liked", v.id)}>
            <Heart className={cn(lib.liked.includes(v.id) && "fill-red-500 text-red-500")} />
            {lib.liked.includes(v.id) ? "Liked" : "Like"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => toggle("later", v.id)}>
            <Bookmark className={cn(lib.later.includes(v.id) && "fill-current")} />
            {lib.later.includes(v.id) ? "Saved" : "Watch later"}
          </Button>
          <Button variant="secondary" size="sm" onClick={copy}><Link2 />{copied ? "Link copied" : "Copy link"}</Button>
          <Button variant="ghost" size="sm" asChild>
            <a href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer"><ExternalLink />YouTube</a>
          </Button>
        </div>
      </section>

      <aside className="min-w-0 space-y-5 lg:sticky lg:top-[4.5rem] lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto">
        {queue && (
          <div className="overflow-hidden rounded-xl border">
            <div className="flex items-center gap-2 border-b bg-muted/60 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <button onClick={() => go(`playlist/${playlist.id}`)} className="block max-w-full cursor-pointer truncate text-left text-sm font-semibold hover:underline">{playlist.title}</button>
                <p className="text-xs text-muted-foreground">{playlist.channel || "DSATube"} · {i + 1} / {queue.length}</p>
              </div>
              <Button variant="outline" size="icon" className="size-8" disabled={i <= 0} onClick={() => step(-1)} aria-label="Previous in playlist"><ChevronLeft /></Button>
              <Button variant="outline" size="icon" className="size-8" disabled={i < 0 || i >= queue.length - 1} onClick={() => step(1)} aria-label="Next in playlist"><ChevronRight /></Button>
            </div>
            <div className="max-h-80 overflow-y-auto p-1">
              {queue.map((x, n) => <VideoRow key={x.id} v={x} index={n + 1} active={x.id === v.id} onClick={() => open(x.id)} />)}
            </div>
          </div>
        )}
        <div>
          <h2 className="mb-1.5 px-1.5 text-sm font-semibold">Related videos</h2>
          <div>{suggestions.map((s) => <VideoRow key={s.id} v={s} onClick={() => open(s.id)} />)}</div>
        </div>
      </aside>
    </div>
  );
}
