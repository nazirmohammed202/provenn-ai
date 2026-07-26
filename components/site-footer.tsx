import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

function monadExplorerUrl() {
  return (
    process.env.NEXT_PUBLIC_MONAD_EXPLORER_URL ||
    process.env.MONAD_EXPLORER_URL ||
    "https://testnet.monadexplorer.com"
  ).replace(/\/$/, "");
}

const productLinks = [
  { href: "/analyze", label: "Analyze a contract" },
  { href: "/verify", label: "Verify a document" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell site-footer-inner">
        <div className="site-footer-brand">
          <BrandLogo size="sm" />
          <p className="site-footer-tagline">
            Understand every contract. Prove every version on Monad.
          </p>
        </div>

        <div className="site-footer-columns">
          <nav className="site-footer-col" aria-label="Product">
            <h3>Product</h3>
            <ul>
              {productLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link href={href}>{label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer-col" aria-label="Network">
            <h3>Network</h3>
            <ul>
              <li>
                <a href={monadExplorerUrl()} target="_blank" rel="noreferrer">
                  Monad testnet explorer
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="site-footer-bottom">
        <div className="shell site-footer-bottom-inner">
          <p>
            © {year} Provenn AI. AI analysis is informational, not legal advice.
          </p>
          <p className="site-footer-note">
            Only document hashes are stored on-chain — never file contents.
          </p>
        </div>
      </div>
    </footer>
  );
}
