import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  children: React.ReactNode;
  /** Max height of the collapsed section on mobile (in pixels) */
  collapsedHeight?: number;
  /** Max height of the collapsed section on tablet+desktop (in pixels) */
  collapsedHeightDesktop?: number;
  /** Optional label appended to the See More / Show Less button */
  label?: string;
  /** Tailwind classes for the outer wrapper */
  className?: string;
  /** When true, no fade gradient at the bottom of the collapsed view (use on dark sections) */
  noFade?: boolean;
}

/**
 * Wraps any section so it appears in a shortened "preview" view by default,
 * with a See More button to expand and Show Less to collapse again.
 * Automatically hides the toggle if the content already fits.
 */
export default function CollapsibleSection({
  children,
  collapsedHeight = 540,
  collapsedHeightDesktop = 880,
  label,
  className = '',
  noFade = false,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const [maxH, setMaxH] = useState(collapsedHeight);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Pick the right max-height for the current viewport
  useEffect(() => {
    const update = () => {
      const isDesktop = window.innerWidth >= 1024;
      setMaxH(isDesktop ? collapsedHeightDesktop : collapsedHeight);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [collapsedHeight, collapsedHeightDesktop]);

  // Watch the inner content and decide whether the toggle is needed
  useEffect(() => {
    if (!contentRef.current) return;

    const check = () => {
      if (!contentRef.current) return;
      const scrollHeight = contentRef.current.scrollHeight;
      // Small buffer so we don't show the toggle for content that's just slightly taller
      setNeedsToggle(scrollHeight > maxH + 60);
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [maxH, children]);

  const handleToggle = useCallback(() => {
    const willCollapse = expanded;
    setExpanded((v) => !v);
    // When collapsing, scroll the toggle button into view so the user keeps context
    if (willCollapse) {
      requestAnimationFrame(() => {
        buttonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }
  }, [expanded]);

  const isCollapsed = needsToggle && !expanded;
  const effectiveMaxHeight = isCollapsed ? `${maxH}px` : 'none';

  return (
    <div className={`relative ${className}`}>
      <div
        className="relative overflow-hidden transition-[max-height] duration-500 ease-in-out"
        style={{ maxHeight: effectiveMaxHeight }}
      >
        <div ref={contentRef}>{children}</div>

        {isCollapsed && !noFade && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white/90 via-white/40 to-transparent"
            aria-hidden="true"
          />
        )}
      </div>

      {needsToggle && (
        <div ref={buttonRef} className="flex justify-center -mt-3 mb-4 relative z-10">
          <Button
            onClick={handleToggle}
            variant="outline"
            size="sm"
            className="bg-white shadow-md border-champagne/60 text-navy hover:bg-champagne/10 hover:border-champagne rounded-full px-6 py-2 font-semibold"
            data-testid="button-toggle-section"
          >
            {expanded ? (
              <>
                Show less{label ? ` ${label}` : ''}
                <ChevronUp className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>
                See more{label ? ` ${label}` : ''}
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
