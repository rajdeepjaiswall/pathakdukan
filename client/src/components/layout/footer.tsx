import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { COMPANY_INFO } from '@/lib/constants';
import type { FooterConfig, HeaderConfig, FoundationContent } from '@shared/schema';

type LegalPageType = 'privacy' | 'terms' | 'shipping' | 'invoice';
type LegalPageSummary = { pageType: LegalPageType; hasContent: boolean };

const LEGAL_PAGE_LINKS: Record<LegalPageType, { name: string; href: string }> = {
  privacy: { name: 'Privacy Policy', href: '/privacy-policy' },
  terms: { name: 'Terms of Service', href: '/terms-of-service' },
  shipping: { name: 'Shipping Policy', href: '/shipping-policy' },
  invoice: { name: 'Invoice Terms', href: '/invoice-terms' },
};

const DEFAULT_SITEMAP = [
  { title: 'Home', link: '/' },
  { title: 'Products', link: '/products' },
  { title: 'About', link: '/about' },
  { title: 'Contact', link: '/contact-us' },
];

export default function Footer() {
  const { data: legalSummary = [] } = useQuery<LegalPageSummary[]>({
    queryKey: ['/api/legal-pages'],
  });

  const { data: siteConfig } = useQuery<{ header: HeaderConfig; footer: FooterConfig }>({
    queryKey: ['/api/site-settings'],
  });

  const { data: foundation } = useQuery<FoundationContent>({
    queryKey: ['/api/foundation'],
  });

  const footerCfg = siteConfig?.footer || {};
  const description = footerCfg.description || 'Premium bakery and confectionery store in Prayagraj, specialising in authentic local biscuits and cookies. Experience the taste of tradition with every bite.';
  const sitemap = (footerCfg.sitemap && footerCfg.sitemap.length > 0) ? footerCfg.sitemap : DEFAULT_SITEMAP;
  const showBadge = footerCfg.showFoundationBadge !== false; // default ON

  const policies = legalSummary
    .filter((s) => s.hasContent && LEGAL_PAGE_LINKS[s.pageType])
    .map((s) => LEGAL_PAGE_LINKS[s.pageType]);

  return (
    <footer className="bg-navy text-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top: Logo + description */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          <div className="flex items-start gap-4 max-w-2xl">
            {footerCfg.logo ? (
              <img
                src={footerCfg.logo}
                alt={`${COMPANY_INFO.name} Logo`}
                className="h-14 w-14 object-contain rounded-lg bg-cream/5 p-1"
              />
            ) : (
              <div className="w-14 h-14 bg-champagne rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-navy font-bold text-xl">PB</span>
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{COMPANY_INFO.name}</h3>
              <p className="text-sm text-cream/70 mb-2">{COMPANY_INFO.tagline}</p>
              <p className="text-cream/80 text-sm leading-relaxed" data-testid="text-footer-description">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Horizontal sitemap */}
        <div className="mt-10 border-t border-cream/15 pt-6">
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3" data-testid="nav-footer-sitemap">
            {sitemap.map((item, idx) => (
              <Link
                key={`${item.title}-${idx}`}
                href={item.link}
                className="text-sm text-cream/85 hover:text-champagne transition-colors font-medium"
                data-testid={`link-footer-sitemap-${idx}`}
              >
                {item.title}
              </Link>
            ))}
            {policies.map((policy) => (
              <Link
                key={policy.name}
                href={policy.href}
                className="text-sm text-cream/70 hover:text-champagne transition-colors"
                data-testid={`link-footer-policy-${policy.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {policy.name}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom: copyright + Foundation badge */}
        <div className="mt-8 border-t border-cream/15 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-cream/60 text-xs">
            © {new Date().getFullYear()} {COMPANY_INFO.name}. All rights reserved.
          </p>

          {showBadge && (
            <Link
              href="/getdown-foundation"
              className="group flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-400/40 hover:bg-emerald-500/20 hover:border-emerald-300/60 transition-all duration-300"
              style={{ boxShadow: '0 0 18px rgba(34,197,94,0.18)' }}
              data-testid="link-foundation-badge"
            >
              {foundation?.logo ? (
                <img src={foundation.logo} alt="GetDown Foundation" className="h-5 w-5 rounded object-contain" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
              <span className="text-emerald-300 text-xs font-semibold tracking-wide group-hover:text-emerald-200">
                Managed and created by GetDown Foundation
              </span>
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
