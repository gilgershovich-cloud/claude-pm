"use client";

import { useMemo, useState, useEffect } from "react";
import { Play, X } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import {
  CATEGORIES,
  PORTFOLIO_ITEMS,
  type CategoryId,
  type PortfolioItem,
} from "@/lib/portfolio";

type Filter = CategoryId | "all";

export function PortfolioGallery({
  locale,
  allLabel,
  watchLabel,
  comingSoonLabel,
}: {
  locale: Locale;
  allLabel: string;
  watchLabel: string;
  comingSoonLabel: string;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState<PortfolioItem | null>(null);

  const tabs = useMemo(
    () => [...CATEGORIES].sort((a, b) => a.order - b.order),
    [],
  );

  const items = useMemo(() => {
    const list =
      filter === "all"
        ? PORTFOLIO_ITEMS
        : PORTFOLIO_ITEMS.filter((i) => i.category === filter);
    return [...list].sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [filter]);

  // Close lightbox on Escape and lock body scroll while open.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  return (
    <>
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        <FilterButton
          active={filter === "all"}
          onClick={() => setFilter("all")}
          label={allLabel}
        />
        {tabs.map((cat) => (
          <FilterButton
            key={cat.id}
            active={filter === cat.id}
            onClick={() => setFilter(cat.id)}
            label={cat.label[locale]}
          />
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item)}
            className="group relative overflow-hidden rounded-2xl border border-line bg-cream text-start shadow-sm transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="relative block aspect-video overflow-hidden">
              {/* Placeholder thumbnails — swap files in /public/portfolio for real stills. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbnail}
                alt={item.alt[locale]}
                width={640}
                height={360}
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute inset-0 grid place-items-center bg-black/0 transition group-hover:bg-black/30">
                <span className="grid size-14 scale-90 place-items-center rounded-full bg-accent text-white opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
                  <Play className="size-6 ps-1" aria-hidden="true" />
                </span>
              </span>
            </span>
            <span className="flex items-center justify-between gap-2 p-4">
              <span className="font-semibold text-ink">{item.title[locale]}</span>
              <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent-strong">
                {item.eventType[locale]}
              </span>
            </span>
          </button>
        ))}
      </div>

      {active ? (
        <Lightbox
          item={active}
          locale={locale}
          watchLabel={watchLabel}
          comingSoonLabel={comingSoonLabel}
          onClose={() => setActive(null)}
        />
      ) : null}
    </>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active
          ? "bg-ink text-white"
          : "border border-line bg-surface text-muted hover:border-accent/50 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

function Lightbox({
  item,
  locale,
  watchLabel,
  comingSoonLabel,
  onClose,
}: {
  item: PortfolioItem;
  locale: Locale;
  watchLabel: string;
  comingSoonLabel: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-black/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={item.title[locale]}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-night text-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute end-3 top-3 z-10 grid size-9 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        >
          <X className="size-5" aria-hidden="true" />
        </button>

        <div className="aspect-video w-full bg-black">
          {item.videoUrl ? (
            <iframe
              src={item.videoUrl}
              title={item.title[locale]}
              className="size-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-3 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.thumbnail}
                alt={item.alt[locale]}
                className="absolute inset-0 size-full object-cover opacity-30"
              />
              <span className="relative rounded-full bg-accent px-4 py-1.5 text-sm font-semibold">
                {comingSoonLabel}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 p-5">
          <div>
            <h3 className="text-lg font-bold">{item.title[locale]}</h3>
            <p className="text-sm text-white/60">{item.eventType[locale]}</p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
            {watchLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
