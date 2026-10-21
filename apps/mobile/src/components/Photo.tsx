import { Image } from 'expo-image';
import type { StyleProp, ImageStyle } from 'react-native';

import { photoSource } from '@/lib/images';

/** A bundled photo, drawn from the decoded copy when `preloadPhotos` already has it. */
export function Photo({ source, style, onLoad }: { source: number; style?: StyleProp<ImageStyle>; onLoad?: () => void }) {
  return <Image source={photoSource(source)} contentFit="cover" transition={0} style={style} onLoad={onLoad} accessibilityIgnoresInvertColors />;
}
