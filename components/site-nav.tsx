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
      <Link className="brand" href="/">
        provenn<span>.</span>
      </Link>
      <Link className={dark ? "pill" : "pill-light"} href={ctaHref}>
        {ctaLabel}
      </Link>
    </nav>
  );
}
