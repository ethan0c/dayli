import { localParts } from '@dayli/core';
import { IMPORT_MESSAGES, type ExtractContext, type ExtractRequest } from '@dayli/schema';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { useStore } from '@/store';

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const;
type ImageType = (typeof IMAGE_TYPES)[number];
export const MAX_BYTES = 20 * 1024 * 1024;

/** Thrown with a sentence the user can read. */
export class InputError extends Error {}

/** Everything the extractor needs to know about this user, from the store. */
export function extractionContext(): ExtractContext {
  const { settings, courses, schedules } = useStore.getState();
  return {
    name: settings.name,
    today: localParts(new Date()).date,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    courses: courses.map((k) => ({ code: k.code, title: k.title })),
    employers: [...new Set(schedules.map((s) => s.employer))],
  };
}

/** Photo library or camera → image input, or null if the user cancelled. */
export async function pickImageInput(fromCamera: boolean): Promise<{ input: ExtractRequest['input']; source: string } | null> {
  const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    throw new InputError(
      fromCamera
        ? 'To take a photo, allow Semli to use your camera in your device settings. You can also type the details instead.'
        : 'To choose a screenshot, allow Semli to access your photos in your device settings. You can also type the details instead.',
    );
  }
  const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.85 };
  const result = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  if (asset.fileSize && asset.fileSize > MAX_BYTES) throw new InputError(IMPORT_MESSAGES.tooLarge);
  const data = await new File(asset.uri).base64();
  const guess = asset.mimeType ?? (asset.uri.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  const mediaType = (IMAGE_TYPES as readonly string[]).includes(guess) ? (guess as ImageType) : 'image/jpeg';
  return { input: { kind: 'image', mediaType, data }, source: fromCamera ? 'Photo' : 'Screenshot' };
}

/** Files app → PDF input, or null if cancelled. */
export async function pickPdfInput(): Promise<{ input: ExtractRequest['input']; source: string } | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const asset = result.assets[0];
  if (!asset) return null;
  if (asset.size && asset.size > MAX_BYTES) throw new InputError(IMPORT_MESSAGES.tooLarge);
  const data = await new File(asset.uri).base64();
  return { input: { kind: 'pdf', data }, source: asset.name };
}
