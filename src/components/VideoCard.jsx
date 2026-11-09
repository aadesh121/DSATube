import { Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Thumb } from "@/components/Thumb";
import { cn, compact, dur } from "@/lib/utils";

export function VideoCard({ v, liked, onOpen, onLike, index }) {
  return (
    <article className="rise group" style={{ animationDelay: `${Math.min(index % 24, 11) * 30}ms` }}>
      <div className="relative">
        <button
          onClick={() => onOpen(v.id)}
          className="block aspect-video w-full cursor-pointer overflow-hidden rounded-xl bg-muted outline-none ring-offset-2 ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Play ${v.title}`}
        >
          <Thumb id={v.id} className="transition duration-500 group-hover:scale-[1.03]" />
        </button>
        <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-medium text-white tabular-nums">
          {dur(v.dur)}
        </span>
        <button
          onClick={() => onLike(v.id)}
          aria-pressed={liked}
          aria-label={liked ? "Remove like" : "Like"}
          className={cn(
            "absolute right-2 top-2 cursor-pointer rounded-full bg-black/55 p-1.5 text-white backdrop-blur transition hover:bg-black/75 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
            liked && "sm:opacity-100"
          )}
        >
          <Heart className={cn("size-4", liked && "fill-red-500 text-red-500")} />
        </button>
      </div>
      <h3 className="mt-2.5 line-clamp-2 text-[15px] font-medium leading-snug">{v.title}</h3>
      <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
        {v.channel}{v.views ? ` · ${compact(v.views)} views` : ""}
      </p>
      <div className="mt-1.5"><Badge>{v.topic}</Badge></div>
    </article>
  );
}
