import type { FooterContent } from "@/lib/validations/content.schema";

import { TplContainer, TplIcon } from "./_shared";

export function Footer({ data }: { data: FooterContent | null }) {
  if (!data) return null;

  return (
    <footer className="border-t border-[var(--tpl-border)] py-10">
      <TplContainer className="flex flex-col items-center gap-4 text-center">
        {data.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.logo.url} alt={data.logo.alt ?? ""} className="h-8" />
        ) : null}
        {data.tagline ? (
          <p className="text-sm text-[var(--tpl-muted)]">{data.tagline}</p>
        ) : null}
        {data.links.length > 0 ? (
          <nav className="flex flex-wrap justify-center gap-4">
            {data.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-[var(--tpl-muted)] hover:text-[var(--tpl-foreground)]"
              >
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
        {data.socialLinks.length > 0 ? (
          <div className="flex gap-3">
            {data.socialLinks.map((social) => (
              <a
                key={social.href}
                href={social.href}
                aria-label={social.platform}
                className="flex size-8 items-center justify-center rounded-full border border-[var(--tpl-border)] text-[var(--tpl-muted)] hover:text-[var(--tpl-foreground)]"
              >
                <TplIcon name={social.platform} className="size-4" />
              </a>
            ))}
          </div>
        ) : null}
        {data.copyrightText ? (
          <p className="text-xs text-[var(--tpl-muted)]">{data.copyrightText}</p>
        ) : null}
      </TplContainer>
    </footer>
  );
}
