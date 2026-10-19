/** Shared copy keeps import errors consistent on the website and in the app. */
export const IMPORT_MESSAGES = {
  unavailable: "Dayli can't read this right now. Please try again in a few minutes.",
  busy: 'Dayli is busy right now. Please try again in a minute.',
  timeout: 'This is taking longer than expected. Try again, or send a shorter message or a smaller file.',
  connection: "We couldn't reach Dayli. Check your internet connection and try again.",
  request: "We couldn't read what you sent. Try sending your message or file again.",
  tooLarge: 'This file is too large. Choose a file of 20 MB or less, or send just the pages you need.',
  unsupported: 'Choose a PDF or an image in PNG, JPEG, WebP, or GIF format.',
  file: "We couldn't open this file. Choose it again, or try another PDF or image.",
  empty: "We couldn't find anything to add. Include an event or to-do and when it happens, then try again.",
} as const;

export function importErrorForStatus(status: number): string {
  if (status === 400 || status === 422) return IMPORT_MESSAGES.request;
  if (status === 408 || status === 504) return IMPORT_MESSAGES.timeout;
  if (status === 413) return IMPORT_MESSAGES.tooLarge;
  if (status === 415) return IMPORT_MESSAGES.unsupported;
  if (status === 429) return IMPORT_MESSAGES.busy;
  return IMPORT_MESSAGES.unavailable;
}
