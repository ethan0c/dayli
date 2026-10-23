import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/*
 * The web only: a file dropped on the window, or an image pasted with ⌘V, opens Add and imports
 * it. The file waits here because a route can't carry one; Add takes it when it arrives.
 */

let waiting: File | null = null;

/** The dropped or pasted file Add should import, once. */
export function takeDroppedFile(): File | null {
  const file = waiting;
  waiting = null;
  return file;
}

function hand(file: File) {
  waiting = file;
  router.navigate({ pathname: '/add', params: { source: 'drop', at: String(Date.now()) } });
}

const hasFiles = (e: DragEvent) => !!e.dataTransfer && [...e.dataTransfer.types].includes('Files');

/** Listens for drops and pastes on the whole window. True while a file is dragged over it, for the drop hint. */
export function useWebFileDrop(enabled: boolean): boolean {
  const [over, setOver] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;
    let depth = 0;
    const enter = (e: DragEvent) => { if (!hasFiles(e)) return; e.preventDefault(); depth += 1; setOver(true); };
    const leave = (e: DragEvent) => { if (!hasFiles(e)) return; depth = Math.max(0, depth - 1); if (!depth) setOver(false); };
    const overWindow = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setOver(false);
      const file = e.dataTransfer?.files[0];
      if (file) hand(file);
    };
    // Text pastes stay with the field they land in; only a pasted file (a screenshot) becomes an import.
    const paste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files[0];
      if (!file) return;
      e.preventDefault();
      hand(file);
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', overWindow);
    window.addEventListener('drop', drop);
    window.addEventListener('paste', paste);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', overWindow);
      window.removeEventListener('drop', drop);
      window.removeEventListener('paste', paste);
    };
  }, [enabled]);
  return over;
}
