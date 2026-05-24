"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Faq as FaqItem } from "@/lib/content";

export function Faq({ heading, items }: { heading: string; items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="section-pad bg-surface">
      <div className="container-page max-w-3xl">
        <h2 className="mb-10 text-center text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {heading}
        </h2>
        <ul className="divide-y divide-line rounded-2xl border border-line bg-cream/30">
          {items.map((item, i) => {
            const isOpen = open === i;
            return (
              <li key={item.question}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 text-start"
                >
                  <span className="font-semibold text-ink">{item.question}</span>
                  <ChevronDown
                    className={`size-5 shrink-0 text-accent transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen ? (
                  <div className="px-5 pb-5 leading-relaxed text-muted">
                    {item.answer}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
