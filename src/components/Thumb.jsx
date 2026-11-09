import { useState } from "react";
import { cn } from "@/lib/utils";

// YouTube's biggest thumbnail is maxresdefault (up to 1280x720; there is no 4K thumbnail).
// If a video has no maxres version we step down to the next best one.
const CHAIN = [
  (id) => `https://i.ytimg.com/vi_webp/${id}/maxresdefault.webp`,
  (id) => `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
  (id) => `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
  (id) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
];

export function Thumb({ id, className, eager }) {
  const [i, setI] = useState(0);
  const [ready, setReady] = useState(false);
  const next = () => setI((n) => Math.min(n + 1, CHAIN.length - 1));
  return (
    <img
      src={CHAIN[i](id)}
      alt=""
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onLoad={(e) => (e.currentTarget.naturalWidth <= 160 && i < CHAIN.length - 1 ? next() : setReady(true))}
      onError={() => (i < CHAIN.length - 1 ? next() : setReady(false))}
      className={cn("size-full object-cover transition-opacity duration-300", ready ? "opacity-100" : "opacity-0", className)}
    />
  );
}
