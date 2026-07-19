import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";

export function SiteNav({
  ctaHref = "/verify",
  ctaLabel = "Verify a document",
  dark = false,
}: {
  ctaHref?: string;
  ctaLabel?: string;
  dark?: boolean;
}) {
  return (
    <nav className={`nav shell ${dark ? "nav-dark" : ""}`}>
      <BrandLogo light={dark} />
      <Link className={dark ? "pill" : "pill-light"} href={ctaHref}>
        {ctaLabel}
      </Link>
    </nav>
  );
}
