import { useEffect, useRef, useState, type ReactNode } from "react";

interface DeferUntilVisibleProps {
  children: ReactNode;
  /** Placeholder rendered before the content mounts (keeps layout stable). */
  placeholder?: ReactNode;
  /** Distance from the viewport at which the content should mount. */
  rootMargin?: string;
  /** Minimum height of the placeholder wrapper. */
  minHeight?: number;
}

/**
 * Mounts children only once the wrapper scrolls near the viewport.
 * Used to keep heavy below-the-fold embeds (third-party iframes, widgets) out
 * of the initial page load without changing the visual design.
 */
export function DeferUntilVisible({
  children,
  placeholder = null,
  rootMargin = "300px",
  minHeight,
}: DeferUntilVisibleProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <div ref={ref} style={minHeight && !visible ? { minHeight } : undefined}>
      {visible ? children : placeholder}
    </div>
  );
}
