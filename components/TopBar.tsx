import { shortAddr, relTime } from "@/lib/format";

export function TopBar({ operator, lastSync }: { operator: string; lastSync: Date }) {
  return (
    <header className="border-b border-[var(--color-border)] bg-white">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--color-accent)] text-white text-[11px] font-semibold tracking-wider">D</div>
          <span className="text-[13px] font-semibold tracking-wide">DASH</span>
          <span className="text-[11px] text-[var(--color-subtle)] uppercase tracking-wider">Polymarket Mirror</span>
        </div>
        <div className="flex items-center gap-5 text-[12px] text-[var(--color-muted)]">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-positive)] pulse-dot" />
            <span>Live</span>
          </div>
          <div className="hidden sm:block">Last sync · <span className="text-[var(--color-fg)] tabular">{relTime(lastSync)}</span></div>
          <div className="mono text-[var(--color-fg)]">{shortAddr(operator)}</div>
        </div>
      </div>
    </header>
  );
}
