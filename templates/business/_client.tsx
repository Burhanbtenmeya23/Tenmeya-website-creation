"use client";

import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { isVideoUrl } from "./_shared";

function useCountdown(endsAt: string) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (remaining == null) return null;

  const totalSeconds = Math.floor(remaining / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function CountdownTimer({
  endsAt,
  labels,
}: {
  endsAt: string;
  labels: { days: string; hours: string; minutes: string; seconds: string };
}) {
  const remaining = useCountdown(endsAt);

  if (!remaining) return null;

  const units: [number, string][] = [
    [remaining.days, labels.days],
    [remaining.hours, labels.hours],
    [remaining.minutes, labels.minutes],
    [remaining.seconds, labels.seconds],
  ];

  return (
    <div
      className="inline-flex items-center gap-3 rounded-full px-5 py-2.5"
      style={{
        background: `linear-gradient(90deg, var(--tpl-accent-gradient-from), var(--tpl-accent-gradient-to))`,
      }}
    >
      {units.map(([value, label], index) => (
        <div key={label} className="flex items-center gap-3">
          {index > 0 ? (
            <span className="text-[var(--tpl-accent-foreground)]/40">:</span>
          ) : null}
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold tabular-nums text-[var(--tpl-accent-foreground)]">
              {String(value).padStart(2, "0")}
            </span>
            <span className="text-[10px] text-[var(--tpl-accent-foreground)]/80">
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroMedia({ url, alt }: { url: string; alt?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const video = isVideoUrl(url);

  if (!video) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt ?? ""} className="h-full w-full object-cover" />;
  }

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        src={url}
        className="h-full w-full object-cover"
        playsInline
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause video" : "Play video"}
        className="absolute inset-0 flex items-center justify-center"
      >
        {!playing ? (
          <span className="flex size-16 items-center justify-center rounded-full bg-white shadow-lg">
            <Play className="ms-1 size-6 fill-[var(--tpl-foreground)] text-[var(--tpl-foreground)]" />
          </span>
        ) : (
          <span className="flex size-12 items-center justify-center rounded-full bg-white/80 opacity-0 shadow-lg transition-opacity hover:opacity-100">
            <Pause className="size-5 fill-[var(--tpl-foreground)] text-[var(--tpl-foreground)]" />
          </span>
        )}
      </button>
    </div>
  );
}

export function TplAccordion({
  items,
}: {
  items: { key: string; trigger: React.ReactNode; content: React.ReactNode }[];
}) {
  return (
    <AccordionPrimitive.Root type="single" collapsible className="w-full">
      {items.map((item) => (
        <AccordionPrimitive.Item
          key={item.key}
          value={item.key}
          className="border-b border-[var(--tpl-border)] last:border-b-0"
        >
          <AccordionPrimitive.Header>
            <AccordionPrimitive.Trigger className="flex w-full items-center justify-between gap-4 py-4 text-start font-semibold text-[var(--tpl-foreground)] [&[data-state=open]>svg]:rotate-180">
              {item.trigger}
              <ChevronDown className="size-5 shrink-0 text-[var(--tpl-muted)] transition-transform duration-200" />
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          <AccordionPrimitive.Content className="overflow-hidden text-[var(--tpl-muted)] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
            <div className="pb-4">{item.content}</div>
          </AccordionPrimitive.Content>
        </AccordionPrimitive.Item>
      ))}
    </AccordionPrimitive.Root>
  );
}
