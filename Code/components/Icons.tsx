import type { CSSProperties, ReactNode } from "react";

/* Duotone icon set drawn on a 48-unit grid: a soft accent shape sits behind crisp strokes.
   The accent colour comes from --icon-accent so each context can tune it. */

const A = ({ children }: { children: ReactNode }) => (
  <g fill="var(--icon-accent, var(--color-sol))" stroke="none" opacity={0.85}>
    {children}
  </g>
);
const dot = (cx: number, cy: number) => <circle cx={cx} cy={cy} r={1.4} fill="currentColor" stroke="none" />;

const ICONS = {
  code: (
    <>
      <A><rect x="9" y="13" width="34" height="27" rx="8" /></A>
      <rect x="5" y="8" width="38" height="32" rx="9" />
      <path d="M19 19l-6 5 6 5M29 19l6 5-6 5M26 16.5l-4 15" />
    </>
  ),
  pen: (
    <>
      <A><circle cx="31" cy="31" r="11" /></A>
      <path d="M24 42L13 23 24 7l11 16z" />
      <path d="M24 42V28" />
      <circle cx="24" cy="24.5" r="2.6" />
      <path d="M4 12h8M36 12h8" />
    </>
  ),
  play: (
    <>
      <A><rect x="10" y="14" width="33" height="26" rx="8" /></A>
      <rect x="5" y="8" width="38" height="31" rx="9" />
      <path d="M20 18v12.5l10.5-6.25z" fill="currentColor" />
    </>
  ),
  chart: (
    <>
      <A><circle cx="33" cy="15" r="9" /></A>
      <path d="M7 7v34h34" />
      <path d="M14 32l8-9 6 5 11-13" />
      <path d="M33 15h6v6" />
    </>
  ),
  briefcase: (
    <>
      <A><rect x="9" y="20" width="34" height="21" rx="6" /></A>
      <rect x="5" y="15" width="38" height="26" rx="7" />
      <path d="M17 15v-3.5A3.5 3.5 0 0 1 20.5 8h7a3.5 3.5 0 0 1 3.5 3.5V15" />
      <path d="M18 28l4 4 8-8" />
    </>
  ),
  web: (
    <>
      <A><rect x="10" y="21" width="15" height="14" rx="4" /></A>
      <rect x="5" y="8" width="38" height="32" rx="8" />
      <path d="M5 17h38M30 24h7M30 30h5" />
      {dot(11, 12.5)}
      {dot(15.5, 12.5)}
      {dot(20, 12.5)}
    </>
  ),
  phone: (
    <>
      <A><circle cx="24" cy="26" r="10" /></A>
      <rect x="13" y="4" width="22" height="40" rx="7" />
      <path d="M21 9h6M21 38.5h6" />
    </>
  ),
  brand: (
    <>
      <A><circle cx="24" cy="25" r="16" /></A>
      <path d="M15 36l9-23 9 23M18.6 28.5h10.8" />
      <path d="M38 5v7M34.5 8.5h7" />
    </>
  ),
  poster: (
    <>
      <A><circle cx="24" cy="19" r="6" /></A>
      <rect x="10" y="5" width="28" height="38" rx="4" />
      <path d="M15 37l7-8 5 5 4-4 4 7" />
    </>
  ),
  brush: (
    <>
      <A><circle cx="14" cy="35" r="9" /></A>
      <path d="M38.5 6.5L22 24l3.5 3.5L43 11a3.2 3.2 0 0 0-4.5-4.5z" />
      <path d="M21.5 28.5c-3-1.6-7-.4-8.3 3.4-1 3-1.8 5.6-6.2 6.1 3.6 3.2 11.4 2.6 14.2-1.3 2-2.8 2-5.6.3-8.2z" />
    </>
  ),
  shirt: (
    <>
      <A><rect x="16" y="22" width="16" height="18" rx="3" /></A>
      <path d="M17 7L6 13l4 9 5-2.5V41h18V19.5l5 2.5 4-9-11-6c-1.2 3-4 5-7 5s-5.8-2-7-5z" />
    </>
  ),
  hanger: (
    <>
      <A><path d="M9 36h30L24 26z" /></A>
      <path d="M20 12a4 4 0 1 1 6 3.5c-1.3.7-2 1.6-2 3V22" />
      <path d="M24 22L6.5 34.5A2 2 0 0 0 7.7 38h32.6a2 2 0 0 0 1.2-3.5z" />
    </>
  ),
  layers: (
    <>
      <A><path d="M24 26l17-8.5L24 9 7 17.5z" /></A>
      <path d="M24 8L6 17l18 9 18-9z" />
      <path d="M6 25l18 9 18-9M6 33l18 9 18-9" />
    </>
  ),
  globe: (
    <>
      <A><circle cx="24" cy="24" r="16" /></A>
      <circle cx="24" cy="24" r="18" />
      <path d="M6 24h36M24 6c5 5 7 11 7 18s-2 13-7 18c-5-5-7-11-7-18s2-13 7-18z" />
    </>
  ),
  sun: (
    <>
      <A><circle cx="24" cy="24" r="9" /></A>
      <circle cx="24" cy="24" r="9" />
      <path d="M24 4v5M24 39v5M4 24h5M39 24h5M9.9 9.9l3.5 3.5M34.6 34.6l3.5 3.5M9.9 38.1l3.5-3.5M34.6 13.4l3.5-3.5" />
    </>
  ),
  pin: (
    <>
      <A><circle cx="24" cy="20" r="8" /></A>
      <path d="M24 44s14-12.5 14-24a14 14 0 0 0-28 0c0 11.5 14 24 14 24z" />
      <circle cx="24" cy="20" r="5" />
    </>
  ),
  cap: (
    <>
      <A><path d="M12 24v8c0 3 5.4 6 12 6s12-3 12-6v-8l-12 6z" /></A>
      <path d="M4 18l20-10 20 10-20 10z" />
      <path d="M12 22v10c0 3 5.4 6 12 6s12-3 12-6V22M44 18v10" />
    </>
  ),
  chat: (
    <>
      <A><rect x="8" y="9" width="26" height="19" rx="8" /></A>
      <path d="M6 14a8 8 0 0 1 8-8h14a8 8 0 0 1 8 8v6a8 8 0 0 1-8 8h-9l-8 6v-6.5A8 8 0 0 1 6 20z" />
      <path d="M38.5 18A6 6 0 0 1 42 23.5v6a6 6 0 0 1-6 6V41l-6.5-5.5H24" />
    </>
  ),
  spark: (
    <path
      d="M24 5c1.5 9 5 12.5 14 14-9 1.5-12.5 5-14 14-1.5-9-5-12.5-14-14 9-1.5 12.5-5 14-14z"
      fill="currentColor"
    />
  ),
  search: (
    <>
      <A><circle cx="21" cy="21" r="11" /></A>
      <circle cx="21" cy="21" r="13" />
      <path d="M31 31l11 11" />
    </>
  ),
  rocket: (
    <>
      <A><path d="M41 7c-9 0-17 5-22 13l9 9c8-5 13-13 13-22z" /></A>
      <path d="M41 7c-9 0-17 5-22 13l9 9c8-5 13-13 13-22z" />
      <circle cx="31" cy="17" r="3.5" />
      <path d="M19 20h-7l-5 6 8 2M28 29v7l-6 5-2-8M12.5 35.5C10 37 8 40 8 40s3-2 4.5-4.5" />
    </>
  ),
  gauge: (
    <>
      <A><path d="M8 34a16 16 0 0 1 32 0z" /></A>
      <path d="M6 34a18 18 0 0 1 36 0" />
      <path d="M24 34l8-10M6 41h36" />
      <circle cx="24" cy="34" r="3" />
    </>
  ),
  film: (
    <>
      <A><rect x="14" y="8" width="20" height="32" /></A>
      <rect x="6" y="8" width="36" height="32" rx="6" />
      <path d="M14 8v32M34 8v32M6 18h8M6 30h8M34 18h8M34 30h8" />
    </>
  ),
  grid: (
    <>
      <A><rect x="8" y="8" width="14" height="14" rx="4" /></A>
      <rect x="6" y="6" width="15" height="15" rx="4.5" />
      <rect x="27" y="6" width="15" height="15" rx="4.5" />
      <rect x="6" y="27" width="15" height="15" rx="4.5" />
      <rect x="27" y="27" width="15" height="15" rx="4.5" />
    </>
  ),
  cursor: (
    <>
      <A><path d="M12 9l24 11-10 4-4 10z" /></A>
      <path d="M10 6l28 13-12 4.5L21.5 36z" />
      <path d="M27 25l10 10" />
    </>
  ),
  check: <path d="M10 25l9 9 19-19" />,
  arrowRight: <path d="M8 24h32M28 12l12 12-12 12" />,
  arrowUpRight: <path d="M14 34L34 14M18 14h16v16" />,
  arrowUp: <path d="M24 40V8M12 20L24 8l12 12" />,
  close: <path d="M12 12l24 24M36 12L12 36" />,
  chevronLeft: <path d="M30 10L16 24l14 14" />,
  chevronRight: <path d="M18 10l14 14-14 14" />,
  pause: <path d="M17 12v24M31 12v24" />,
  playSolid: <path d="M16 10v28l23-14z" fill="currentColor" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  className = "size-6",
  strokeWidth = 2.6,
  style,
  title,
}: {
  name: IconName;
  className?: string;
  strokeWidth?: number;
  style?: CSSProperties;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title ? <title>{title}</title> : null}
      {ICONS[name]}
    </svg>
  );
}
