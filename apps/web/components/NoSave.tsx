'use client';

import { useEffect } from 'react';

/**
 * Stops "Save image as…" and "Copy image" on our photos, phone captures and codes by cancelling
 * the context menu over them. Text and links keep their normal menu. A determined visitor can
 * still take a screenshot or open the network tab; this only removes the one-click save.
 */
export function NoSave() {
  useEffect(() => {
    const stop = (e: MouseEvent) => {
      if (e.target instanceof Element && e.target.closest('img, svg, video, picture, [data-no-save]')) e.preventDefault();
    };
    const noDrag = (e: DragEvent) => {
      if (e.target instanceof Element && e.target.closest('img, svg, video, picture')) e.preventDefault();
    };
    document.addEventListener('contextmenu', stop);
    document.addEventListener('dragstart', noDrag);
    return () => {
      document.removeEventListener('contextmenu', stop);
      document.removeEventListener('dragstart', noDrag);
    };
  }, []);
  return null;
}
