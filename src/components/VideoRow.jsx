import { Thumb } from "@/components/Thumb";
import { cn, compact, dur } from "@/lib/utils";

// compact "thumbnail on the left, text on the right" row, used for suggestions and playlist queues
export function VideoRow({ v, onClick, active, index, big }) {
  return (
    <button
      onClick={onClick}
      className={cn("group flex w-full cursor-pointer gap-3 rounded-lg p-1.5 text-left outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring", active && "bg-accent")}
    >
      {index != null && (
        <span className="w-5 shrink-0 self-center text-center text-xs tabular-nums text-muted-foreground">{active ? "▶" : index}</span>
      )}
      <div className={cn("relative aspect-video shrink-0 overflow-hidden rounded-lg bg-muted", big ? "w-44 sm:w-56" : "w-36 sm:w-40")}>
        <Thumb id={v.id} />
        <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 py-px text-[10px] font-medium text-white tabular-nums">{dur(v.dur)}</span>
      </div>
      <div className="min-w-0 py-0.5">
        <h4 className="line-clamp-2 text-[13px] font-medium leading-snug sm:text-sm">{v.title}</h4>
        <p className="mt-1 truncate text-xs text-muted-foreground">{v.channel}</p>
        {v.views > 0 && <p className="text-xs text-muted-foreground">{compact(v.views)} views</p>}
      </div>
    </button>
  );
}
