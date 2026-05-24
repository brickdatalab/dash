"use client";
import { useEffect, useState } from "react";
import { shortAddr } from "@/lib/format";

export function TopBar({ operator }: { operator: string }) {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const update = () => setNow(new Date().toLocaleTimeString("en-US", { hour12: false }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <header className="border-b border-[var(--color-border)] bg-white sticky top-0 z-30 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 sm:px-6 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)] text-white text-[11px] font-semibold tracking-wider">D</div>
          <span className="text-[13px] font-semibold tracking-wide shrink-0">DASH</span>
          <span className="hidden sm:inline text-[11px] text-[var(--color-subtle)] uppercase tracking-wider truncate">Polymarket Mirror</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 text-[12px] text-[var(--color-muted)] shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)] pulse-dot" />
            <span className="hidden xs:inline">Live</span>
            <span className="hidden sm:inline">stream</span>
          </div>
          <div className="hidden md:block mono tabular text-[var(--color-fg)]">{now}</div>
          <div className="mono text-[var(--color-fg)] text-[11px] sm:text-[12px]">{shortAddr(operator)}</div>
        </div>
      </div>
    </header>
  );
}
