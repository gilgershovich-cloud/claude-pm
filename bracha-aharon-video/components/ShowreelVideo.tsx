import { Play } from "lucide-react";

// Showreel placeholder. When a real file exists, pass `src` (and optionally
// `poster`) to render a native <video> with poster + preload="none" so it never
// blocks LCP. Until then it renders a clearly-marked placeholder panel.
export function ShowreelVideo({
  label,
  src,
  poster,
}: {
  label: string;
  src?: string;
  poster?: string;
}) {
  if (src) {
    return (
      <video
        className="aspect-video w-full rounded-2xl border border-white/10 bg-black object-cover shadow-2xl"
        controls
        preload="none"
        poster={poster}
        playsInline
      >
        <source src={src} type="video/mp4" />
      </video>
    );
  }

  return (
    <div
      className="relative grid aspect-video w-full place-items-center overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
      style={{
        background:
          "radial-gradient(120% 120% at 70% 20%, #2a2a36 0%, #15151d 55%, #0c0c11 100%)",
      }}
      data-placeholder="showreel"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 7px, rgba(255,255,255,.04) 7px 8px)",
        }}
        aria-hidden="true"
      />
      <div className="relative flex flex-col items-center gap-3 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-accent text-white shadow-lg">
          <Play className="size-7 ps-1" aria-hidden="true" />
        </span>
        <span className="text-sm font-medium uppercase tracking-widest text-white/70">
          {label}
        </span>
      </div>
    </div>
  );
}
