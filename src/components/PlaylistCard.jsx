import { ListVideo } from "lucide-react";
import { Thumb } from "@/components/Thumb";

export function PlaylistCard({ p, first, onOpen, index }) {
  return (
    <article className="rise group" style={{ animationDelay: `${Math.min(index % 24, 11) * 30}ms` }}>
      <div className="relative pt-2">
        {/* the two "stacked" edges that make it look like a playlist */}
        <div className="absolute inset-x-5 top-0 h-3 rounded-t-xl bg-muted-foreground/25" />
        <div className="absolute inset-x-2.5 top-1 h-3 rounded-t-xl bg-muted-foreground/45" />
        <button
          onClick={() => onOpen(p.id)}
          className="relative block aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-muted outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Open playlist ${p.title}`}
        >
          <Thumb id={first.id} className="transition duration-500 group-hover:scale-[1.03]" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 px-3 py-2 text-xs font-medium text-white backdrop-blur-sm">
            <span>Play all</span>
            <span className="inline-flex items-center gap-1.5"><ListVideo className="size-4" />{p.count} videos</span>
          </div>
        </button>
      </div>
      <h3 className="mt-2.5 line-clamp-2 text-[15px] font-medium leading-snug">{p.title}</h3>
      <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
        {p.channel || "DSATube"} · {p.kind === "yt" ? "YouTube playlist" : "DSATube collection"}
      </p>
      <button onClick={() => onOpen(p.id)} className="mt-1 cursor-pointer text-[13px] font-medium text-muted-foreground transition hover:text-foreground">
        View full playlist
      </button>
    </article>
  );
}
