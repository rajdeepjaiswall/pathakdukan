import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import type { AboutSection } from '@shared/schema';

// ---------------- Style block (scoped to about page) ----------------
const ABOUT_STYLES = `
  .about-page { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #1e1b18; background: #fff8f4; }
  .about-page .newsreader, .about-page h1, .about-page h2, .about-page h3 { font-family: 'Newsreader', Georgia, serif; }

  @keyframes about-ken-burns { 0% { transform: scale(1); } 100% { transform: scale(1.15); } }
  @keyframes about-fade-in-up { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
  @keyframes about-spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

  .about-ken-burns { animation: about-ken-burns 20s ease-in-out infinite alternate; }
  .about-fade-in-up { animation: about-fade-in-up 0.9s ease-out forwards; }
  .about-spin-slow { animation: about-spin-slow 20s linear infinite; }

  .about-scroll-reveal { opacity: 0; transform: translateY(30px); transition: opacity 0.8s cubic-bezier(0.4,0,0.2,1), transform 0.8s cubic-bezier(0.4,0,0.2,1); }
  .about-scroll-reveal.is-visible { opacity: 1; transform: translateY(0); }

  .about-fade-stack > .about-fade-slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1.2s ease-in-out; }
  .about-fade-stack > .about-fade-slide.is-active { opacity: 1; }
  .about-fade-stack > .about-fade-slide > img,
  .about-fade-stack > .about-fade-slide > video { width: 100%; height: 100%; object-fit: cover; display: block; }

  .about-grayscale-img { filter: grayscale(1); }

  .about-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

// ---------------- Hooks ----------------
function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && el.classList.add('is-visible')),
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function useAutoIndex(length: number, intervalMs: number) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (length <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % length), intervalMs);
    return () => clearInterval(id);
  }, [length, intervalMs]);
  return [index, setIndex] as const;
}

// ---------------- Section helpers ----------------
const hasContent = (s: AboutSection) => {
  const media = (s.media || []).filter((m) => typeof m === 'string' && m.trim().length > 0);
  return Boolean(s.title || s.subtitle || s.description || media.length > 0 || s.ctaText);
};

const cleanMedia = (m: string[] | null | undefined): string[] =>
  (m || []).filter((u) => typeof u === 'string' && u.trim().length > 0);

const detectMediaTypeFromUrl = (url: string): 'image' | 'video' => {
  if (!url) return 'image';
  if (url.startsWith('data:video/')) return 'video';
  if (url.startsWith('data:image/')) return 'image';
  const lower = url.split('?')[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v|ogv)$/.test(lower)) return 'video';
  return 'image';
};

type HeroSlide = { url: string; type: 'image' | 'video' };

const HERO_IMAGE_DURATION_MS = 3000;

// ---------------- Section renderers ----------------

function HeroSection({ section }: { section: AboutSection }) {
  const slides: HeroSlide[] = useMemo(() => {
    const urls = cleanMedia(section.media);
    const types = (section.mediaTypes || []) as string[];
    return urls.map((url, i) => {
      const declared = types[i];
      const type: 'image' | 'video' =
        declared === 'video' || declared === 'image'
          ? declared
          : detectMediaTypeFromUrl(url);
      return { url, type };
    });
  }, [section.media, section.mediaTypes]);

  const hasSlides = slides.length > 0;
  const [active, setActive] = useState(0);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  // Reset position if media list changes
  useEffect(() => {
    setActive(0);
  }, [slides.length]);

  const advance = useCallback(() => {
    setActive((i) => (slides.length > 0 ? (i + 1) % slides.length : 0));
  }, [slides.length]);

  // Image autoplay timer (3s). Skipped for videos — they advance on `ended`.
  useEffect(() => {
    if (slides.length <= 1) return;
    const cur = slides[active];
    if (!cur || cur.type !== 'image') return;
    const t = setTimeout(advance, HERO_IMAGE_DURATION_MS);
    return () => clearTimeout(t);
  }, [active, slides, advance]);

  // Drive video playback in sync with active index.
  useEffect(() => {
    slides.forEach((s, i) => {
      const v = videoRefs.current[i];
      if (!v) return;
      if (s.type !== 'video') return;
      if (i === active) {
        try {
          v.currentTime = 0;
          const p = v.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {
              // Autoplay blocked or playback failed — skip to next slide
              if (slides.length > 1) advance();
            });
          }
        } catch {
          if (slides.length > 1) advance();
        }
      } else {
        try {
          v.pause();
        } catch {}
      }
    });
  }, [active, slides, advance]);

  return (
    <section
      className="relative h-[80vh] md:h-[85vh] overflow-hidden bg-gradient-to-br from-[#47160b] to-[#9b4518]"
      data-testid="about-hero"
    >
      {/* Background carousel */}
      <div className="about-fade-stack absolute inset-0 z-0">
        {hasSlides ? (
          slides.map((s, i) => (
            <div key={`${s.url}-${i}`} className={`about-fade-slide ${i === active ? 'is-active' : ''}`}>
              {s.type === 'video' ? (
                <video
                  ref={(el) => {
                    videoRefs.current[i] = el;
                  }}
                  src={s.url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                  autoPlay={i === 0}
                  onEnded={() => {
                    if (slides.length > 1) advance();
                  }}
                  onError={() => {
                    if (slides.length > 1) advance();
                  }}
                  data-testid={`hero-video-${i}`}
                />
              ) : (
                <img
                  src={s.url}
                  alt=""
                  className="w-full h-full object-cover about-ken-burns"
                  onError={() => {
                    if (slides.length > 1 && i === active) advance();
                  }}
                  data-testid={`hero-image-${i}`}
                />
              )}
            </div>
          ))
        ) : (
          <div className="about-fade-slide is-active">
            <div className="w-full h-full bg-gradient-to-br from-[#47160b] to-[#9b4518]" />
          </div>
        )}
      </div>
      {/* Always-on dark overlay for text legibility */}
      <div className="absolute inset-0 z-[1] bg-black/55" />

      {/* Hero content */}
      <div className="relative z-10 h-full flex items-center justify-center text-center px-6">
        <div className="max-w-4xl space-y-7 text-white">
          {section.subtitle && (
            <p
              className="text-sm md:text-base uppercase tracking-[0.3em] font-bold text-[#ffb595] about-fade-in-up"
              data-testid="hero-overline"
            >
              {section.subtitle}
            </p>
          )}
          {section.title && (
            <h1
              className="newsreader text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] about-fade-in-up"
              style={{ animationDelay: '100ms' }}
              data-testid="hero-heading"
            >
              {section.title}
            </h1>
          )}
          {section.description && (
            <p
              className="text-base md:text-xl max-w-2xl mx-auto opacity-90 about-fade-in-up about-clamp-3"
              style={{ animationDelay: '250ms' }}
              data-testid="hero-description"
            >
              {section.description}
            </p>
          )}
          {section.ctaText && (
            <div className="flex justify-center pt-2 about-fade-in-up" style={{ animationDelay: '400ms' }}>
              <a
                href={section.ctaLink || '#'}
                className="bg-[#47160b] text-white px-8 py-4 md:px-10 md:py-5 rounded-xl font-bold text-base md:text-lg hover:scale-105 transition-all shadow-2xl flex items-center gap-3"
                data-testid="hero-cta"
              >
                {section.ctaText}
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Indicators */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {slides.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === active ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function FounderSection({ section }: { section: AboutSection }) {
  const ref = useScrollReveal<HTMLDivElement>();
  // For founder, treat description as multiple founders separated by ||| if present, else single founder.
  // To keep simple per-section model: each FounderSection = one founder card.
  const media = cleanMedia(section.media);
  const portrait = media[0] || '';

  return (
    <section className="py-16 md:py-24 bg-[#fbf2ec] relative overflow-hidden" data-testid="about-founder">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#ffb595]/10 blur-[120px] rounded-full -z-0" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-10 md:mb-12 about-scroll-reveal" ref={ref}>
          {section.subtitle && (
            <span className="text-[#9b4518] font-bold uppercase tracking-[0.3em] text-xs md:text-sm">
              {section.subtitle}
            </span>
          )}
          {section.title && (
            <h2 className="newsreader text-3xl sm:text-4xl md:text-5xl font-bold text-[#47160b] mt-4">
              {section.title}
            </h2>
          )}
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-[#fff8f4] p-6 sm:p-10 rounded-[2rem] md:rounded-[3rem] border border-[#d8c2bd]/40 shadow-xl flex flex-col items-center text-center">
            {portrait && (
              <div className="relative mb-6 md:mb-8">
                <div className="absolute -inset-4 border-2 border-dashed border-[#9b4518]/30 rounded-full about-spin-slow" />
                <div className="w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-8 border-[#efe7e1] shadow-2xl">
                  <img src={portrait} alt={section.title || 'Founder'} className="w-full h-full object-cover about-grayscale-img" />
                </div>
              </div>
            )}
            {section.title && (
              <h3 className="newsreader text-2xl md:text-3xl font-bold text-[#47160b] mb-2">{section.title}</h3>
            )}
            {section.subtitle && portrait && (
              <p className="text-[#9b4518] font-bold uppercase tracking-widest text-[10px] md:text-xs mb-4 md:mb-6">
                {section.subtitle}
              </p>
            )}
            {section.description && (
              <p className="newsreader text-[#534340] text-base md:text-lg leading-relaxed italic">
                "{section.description}"
              </p>
            )}
            {section.ctaText && (
              <a
                href={section.ctaLink || '#'}
                className="mt-6 inline-flex items-center gap-2 text-[#47160b] font-bold uppercase tracking-widest text-xs hover:gap-3 transition-all"
              >
                {section.ctaText} <ArrowRight className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function StorySection({ section }: { section: AboutSection }) {
  const ref = useScrollReveal<HTMLDivElement>();
  const refImg = useScrollReveal<HTMLDivElement>();
  const media = cleanMedia(section.media);
  const m1 = media[0];
  const m2 = media[1];
  const m3 = media[2];
  const m4 = media[3];

  const hasGrid = media.length > 0;

  return (
    <section className="bg-[#fff8f4] py-16 md:py-24" data-testid="about-story">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center gap-10 md:gap-16">
        {hasGrid && (
          <div className="relative w-full md:w-auto md:flex-1 about-scroll-reveal" ref={refImg}>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-3 md:space-y-4">
                {m1 && (
                  <div className="h-48 md:h-64 rounded-2xl overflow-hidden bg-[#f5ece7]">
                    <img src={m1} alt="" className="w-full h-full object-cover about-grayscale-img opacity-90" />
                  </div>
                )}
                {m2 && (
                  <div className="h-36 md:h-48 rounded-2xl overflow-hidden bg-[#f5ece7]">
                    <img src={m2} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <div className="pt-8 md:pt-12 space-y-3 md:space-y-4">
                {m3 && (
                  <div className="h-36 md:h-48 rounded-2xl overflow-hidden bg-[#f5ece7]">
                    <img src={m3} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                {m4 && (
                  <div className="h-48 md:h-64 rounded-2xl overflow-hidden bg-[#f5ece7]">
                    <img src={m4} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 space-y-5 md:space-y-6 about-scroll-reveal" ref={ref}>
          {section.subtitle && (
            <span className="text-[#9b4518] font-bold uppercase tracking-widest text-xs md:text-sm">
              {section.subtitle}
            </span>
          )}
          {section.title && (
            <h2 className="newsreader text-3xl md:text-5xl font-bold text-[#47160b]">{section.title}</h2>
          )}
          {section.description && (
            <p className="text-[#534340] text-base md:text-lg leading-relaxed whitespace-pre-line">
              {section.description}
            </p>
          )}
          {section.ctaText && (
            <a
              href={section.ctaLink || '#'}
              className="inline-flex items-center gap-2 bg-[#47160b] text-white px-6 py-3 rounded-xl font-bold text-sm hover:scale-105 transition-all"
            >
              {section.ctaText} <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function GallerySection({ section }: { section: AboutSection }) {
  const ref = useScrollReveal<HTMLDivElement>();
  const media = cleanMedia(section.media);
  if (media.length === 0 && !section.title) return null;

  return (
    <section className="py-16 md:py-24 bg-[#e9e1dc]" data-testid="about-gallery">
      <div className="max-w-7xl mx-auto px-6">
        {(section.title || section.subtitle || section.description) && (
          <div className="text-center mb-10 md:mb-14 about-scroll-reveal" ref={ref}>
            {section.subtitle && (
              <span className="text-[#9b4518] font-bold uppercase tracking-[0.3em] text-xs md:text-sm">
                {section.subtitle}
              </span>
            )}
            {section.title && (
              <h2 className="newsreader text-3xl md:text-5xl font-bold text-[#47160b] mt-3">
                {section.title}
              </h2>
            )}
            {section.description && (
              <p className="text-[#534340] text-base md:text-lg mt-4 max-w-2xl mx-auto">{section.description}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {media.map((src, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-2xl md:rounded-[2rem] bg-[#f5ece7] ${
                i % 5 === 0 ? 'col-span-2 row-span-2 md:col-span-2 md:row-span-2 aspect-square md:aspect-auto md:h-[500px]' : 'aspect-square'
              }`}
            >
              <img
                src={src}
                alt=""
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[#47160b]/10 group-hover:bg-transparent transition-colors duration-500" />
            </div>
          ))}
        </div>

        {section.ctaText && (
          <div className="text-center mt-10">
            <a
              href={section.ctaLink || '#'}
              className="inline-flex items-center gap-2 bg-[#47160b] text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
            >
              {section.ctaText} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function TeamSection({ section }: { section: AboutSection }) {
  const ref = useScrollReveal<HTMLDivElement>();
  const media = cleanMedia(section.media);
  const hero = media[0];
  const sub1 = media[1];
  // Description can be split into a quote (after |||) — optional
  const [body, quote] = (section.description || '').split('|||').map((s) => s.trim());

  return (
    <section className="py-16 md:py-24 bg-[#e9e1dc]" data-testid="about-team">
      <div className="max-w-7xl mx-auto px-6">
        <div
          className="flex flex-col md:flex-row md:justify-between md:items-end mb-10 md:mb-16 gap-6 md:gap-8 about-scroll-reveal"
          ref={ref}
        >
          <div className="max-w-2xl space-y-4">
            {section.title && (
              <h2 className="newsreader text-3xl md:text-5xl font-bold text-[#47160b]">{section.title}</h2>
            )}
            {body && <p className="text-[#534340] text-base md:text-lg">{body}</p>}
          </div>
          {section.subtitle && (
            <div className="bg-[#47160b] px-6 py-5 md:px-8 md:py-6 rounded-3xl text-white text-center md:text-left shadow-xl hover:rotate-2 transition-transform">
              <span className="block text-3xl md:text-4xl font-bold newsreader">
                {section.subtitle.split('—')[0]?.trim() || section.subtitle}
              </span>
              {section.subtitle.includes('—') && (
                <span className="uppercase tracking-widest text-[10px] md:text-xs opacity-80">
                  {section.subtitle.split('—')[1]?.trim()}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-12 gap-4 md:gap-6">
          {hero && (
            <div className="md:col-span-7 aspect-[16/9] md:aspect-auto md:h-[480px] rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group relative">
              <div className="absolute inset-0 bg-[#47160b]/20 group-hover:bg-transparent transition-colors duration-500 z-10 pointer-events-none" />
              <img
                src={hero}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          )}
          <div className={`${hero ? 'md:col-span-5' : 'md:col-span-12'} grid grid-rows-2 gap-4 md:gap-6`}>
            {sub1 && (
              <div className="rounded-[2rem] md:rounded-[2.5rem] overflow-hidden group relative">
                <img
                  src={sub1}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 min-h-[200px]"
                />
              </div>
            )}
            {quote && (
              <div className="bg-[#ffdbcd] rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-8 flex flex-col justify-center">
                <p className="newsreader text-[#7c2e01] text-lg md:text-xl font-medium italic leading-relaxed">
                  "{quote}"
                </p>
              </div>
            )}
          </div>
        </div>

        {section.ctaText && (
          <div className="text-center mt-10">
            <a
              href={section.ctaLink || '#'}
              className="inline-flex items-center gap-2 bg-[#47160b] text-white px-8 py-4 rounded-xl font-bold hover:scale-105 transition-all shadow-lg"
            >
              {section.ctaText} <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------- Main page ----------------
const RENDERERS: Record<string, (s: AboutSection) => JSX.Element> = {
  hero: (s) => <HeroSection key={s.id} section={s} />,
  founder: (s) => <FounderSection key={s.id} section={s} />,
  story: (s) => <StorySection key={s.id} section={s} />,
  gallery: (s) => <GallerySection key={s.id} section={s} />,
  team: (s) => <TeamSection key={s.id} section={s} />,
};

export default function AboutUs() {
  const { data: sections = [], isLoading } = useQuery<AboutSection[]>({
    queryKey: ['/api/about-sections'],
  });

  // Inject style block once on mount
  useEffect(() => {
    const id = 'about-page-styles';
    if (document.getElementById(id)) return;
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = ABOUT_STYLES;
    document.head.appendChild(style);
  }, []);

  const visible = sections
    .filter((s) => s.isActive && hasContent(s))
    .slice()
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  return (
    <div className="min-h-screen bg-[#fff8f4]">
      <Header />
      <main className="about-page">
        {isLoading ? (
          <div className="max-w-4xl mx-auto px-4 py-20">
            <div className="animate-pulse space-y-6">
              <div className="h-12 bg-[#efe7e1] rounded w-2/3 mx-auto" />
              <div className="h-4 bg-[#efe7e1] rounded w-1/2 mx-auto" />
              <div className="h-72 bg-[#efe7e1] rounded mt-8" />
            </div>
          </div>
        ) : visible.length === 0 ? (
          <div className="max-w-3xl mx-auto px-6 py-24 text-center">
            <h1 className="newsreader text-4xl md:text-5xl font-bold text-[#47160b] mb-6">
              About Pathak Bhandar
            </h1>
            <p className="text-[#534340] text-lg leading-relaxed">
              Welcome to Pathak Bhandar — your destination for fresh artisan breads, cakes, pastries and traditional sweets in Prayagraj. Our story will be shared here soon.
            </p>
          </div>
        ) : (
          visible.map((s) => RENDERERS[s.sectionType]?.(s) ?? null)
        )}
      </main>
      <Footer />
    </div>
  );
}
