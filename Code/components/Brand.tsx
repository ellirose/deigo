import type { Lang } from "@/lib/i18n";

/* Logo mark: an azulejo-like rounded tile, a "D" with the sun rising behind it,
   and a Copacabana wave underneath for the "S". */
export function LogoMark({ className = "size-12", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title ? <title>{title}</title> : null}
      <rect width="48" height="48" rx="14" fill="var(--color-mata)" />
      <circle cx="33.5" cy="14.5" r="7.5" fill="var(--color-sol)" />
      <path d="M11.5 10.5h10a13.25 13.25 0 0 1 0 26.5h-10z" fill="var(--color-sand)" />
      <path d="M17 16h4.4a7.75 7.75 0 0 1 0 15.5H17z" fill="var(--color-mata)" />
      <path
        d="M6 41.5c3.4-2.8 6.8-2.8 10.2 0s6.8 2.8 10.2 0 6.8-2.8 10.2 0 3.4 2.2 5.4 1.2"
        stroke="var(--color-mar)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Wordmark({ role, className = "" }: { role: string; className?: string }) {
  return (
    <span className={`leading-none ${className}`}>
      <span className="block font-display text-[1.4rem] font-extrabold tracking-[-0.03em] text-ink">
        Diego <span className="text-mata">Silveira</span>
      </span>
      <span className="mt-1 block text-[10.5px] font-extrabold uppercase tracking-[.24em] text-muted">{role}</span>
    </span>
  );
}

/* Circular national flags, simplified for small sizes. */
export function Flag({ code, className = "size-7" }: { code: Lang; className?: string }) {
  return (
    <svg viewBox="0 0 30 30" className={`shrink-0 overflow-hidden rounded-full ${className}`} aria-hidden>
      {code === "pt" && (
        <>
          <rect width="30" height="30" fill="#009C3B" />
          <path d="M15 4.5L28 15 15 25.5 2 15z" fill="#FFDF00" />
          <circle cx="15" cy="15" r="6.6" fill="#002776" />
          <path d="M8.6 13.6c4.4-1.1 9-.4 12.7 2.3" stroke="#fff" strokeWidth="1.3" fill="none" />
          <circle cx="12.4" cy="17.4" r=".6" fill="#fff" />
          <circle cx="15.6" cy="18.6" r=".6" fill="#fff" />
          <circle cx="18" cy="17.6" r=".5" fill="#fff" />
        </>
      )}
      {code === "es" && (
        <>
          <rect width="30" height="30" fill="#AA151B" />
          <rect y="7.5" width="30" height="15" fill="#F1BF00" />
          <rect x="7" y="12" width="4" height="6" rx="1" fill="#AA151B" opacity=".55" />
        </>
      )}
      {code === "en" && (
        <>
          <rect width="30" height="30" fill="#fff" />
          {Array.from({ length: 7 }, (_, i) => (
            <rect key={i} y={i * (30 / 6.5)} width="30" height={30 / 13} fill="#B22234" />
          ))}
          <rect width="15" height="16.2" fill="#3C3B6E" />
          {[3, 7.5, 12].map((x) =>
            [3.2, 8, 12.8].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r=".95" fill="#fff" />),
          )}
        </>
      )}
      <circle cx="15" cy="15" r="14.4" fill="none" stroke="rgba(0,0,0,.12)" strokeWidth="1.2" />
    </svg>
  );
}
