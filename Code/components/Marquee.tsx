"use client";

import type { CSSProperties } from "react";
import { useI18n } from "./i18n";
import { Icon, type IconName } from "./Icons";

const ICONS: IconName[] = ["code", "brand", "layers", "play", "web", "chart", "gauge"];

export default function Marquee() {
  const { t } = useI18n();
  return (
    <section aria-label={t.marquee.join(", ")} className="relative z-20 bg-mata text-sand">
      <div className="marquee-mask overflow-hidden py-5 lg:py-7">
        <div className="marquee flex w-max">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 items-center gap-10 pr-10 lg:gap-14 lg:pr-14">
              {t.marquee.map((label, i) => (
                <li key={label} className="flex items-center gap-4 whitespace-nowrap font-display text-[clamp(1.6rem,3.2vw,3rem)] font-extrabold tracking-[-0.02em]">
                  <span
                    className="grid size-[clamp(48px,4.4vw,64px)] place-items-center rounded-[18px] bg-sol text-mata-deep shadow-[0_6px_0_rgb(0_0_0_/_.12)]"
                    style={{ "--icon-accent": "rgb(255 255 255 / .55)", rotate: `${i % 2 ? 6 : -6}deg` } as CSSProperties}
                  >
                    <Icon name={ICONS[i % ICONS.length]} className="size-[62%]" />
                  </span>
                  {label}
                  <Icon name="spark" className="ml-4 size-6 text-sol lg:ml-6" />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
      {/* Beach-kiosk scallop that hangs into the next section */}
      <div aria-hidden className="scallop absolute inset-x-0 top-full h-[18px]" />
    </section>
  );
}
