import { Play, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Thumb } from "@/components/Thumb";
import { VideoRow } from "@/components/VideoRow";

export function PlaylistPage({ playlist: p, queue, go }) {
  const total = queue.reduce((s, v) => s + v.dur, 0);
  const hours = total >= 3600 ? `${Math.floor(total / 3600)} hr ${Math.round((total % 3600) / 60)} min` : `${Math.round(total / 60)} min`;
  const play = (v) => go(`watch/${v.id}/${p.id}`);
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 pt-5 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="lg:sticky lg:top-[4.5rem] lg:self-start">
        <div className="aspect-video overflow-hidden rounded-xl bg-muted shadow-lg">
          <Thumb id={queue[0].id} eager />
        </div>
        <h1 className="mt-4 text-xl font-semibold leading-snug">{p.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{p.channel || "DSATube"}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {queue.length} videos · {hours} · {p.kind === "yt" ? "YouTube playlist" : "DSATube collection"}
        </p>
        <div className="mt-4 flex gap-2">
          <Button className="flex-1" onClick={() => play(queue[0])}><Play className="fill-current" />Play all</Button>
          <Button variant="secondary" className="flex-1" onClick={() => play(queue[Math.floor(Math.random() * queue.length)])}><Shuffle />Shuffle</Button>
        </div>
        {p.kind === "yt" && (
          <a href={`https://www.youtube.com/playlist?list=${p.id}`} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-xs text-muted-foreground underline-offset-2 hover:underline">
            Open on YouTube
          </a>
        )}
      </div>
      <div>
        {queue.map((v, i) => <VideoRow key={v.id} v={v} index={i + 1} big onClick={() => play(v)} />)}
      </div>
    </div>
  );
}
