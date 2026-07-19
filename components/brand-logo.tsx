import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  light = false,
}: {
  className?: string;
  light?: boolean;
}) {
  return (
    <svg
      className={cn("brand-mark", className)}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        width="64"
        height="64"
        rx="16"
        fill={light ? "#E8FFF5" : "#123A31"}
      />
      <path
        d="M18 14h20c4.4 0 8 3.6 8 8v28l-8-5.5-8 5.5V22c0-2.2-1.8-4-4-4H18V14z"
        fill={light ? "#123A31" : "#9EF0CB"}
        opacity="0.35"
      />
      <path
        d="M14 18h22c3.3 0 6 2.7 6 6v26l-7-4.8-7 4.8V24c0-1.7-1.3-3-3-3H14V18z"
        fill={light ? "#123A31" : "#E8FFF5"}
      />
      <path
        d="M22 31.5l5.2 5.2L39 24.8"
        stroke={light ? "#E8FFF5" : "#123A31"}
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({
  href = "/",
  light = false,
  size = "md",
  showWordmark = true,
  className,
}: {
  href?: string;
  light?: boolean;
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("brand-logo", light && "brand-logo-light", size, className)}
      aria-label="Provenn home"
    >
      <BrandMark light={light} />
      {showWordmark && (
        <span className="brand-wordmark">
          provenn<span>.</span>
        </span>
      )}
    </Link>
  );
}
