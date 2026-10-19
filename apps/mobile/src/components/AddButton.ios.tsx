import { Button, Host } from '@expo/ui/swift-ui';
import { buttonBorderShape, buttonStyle, controlSize, foregroundColor, labelStyle, tint } from '@expo/ui/swift-ui/modifiers';
import { Platform } from 'react-native';
import type { AddButtonProps } from '@/components/AddButton';
import { useTheme } from '@/theme';

export function AddButton({ bottom, onPress }: AddButtonProps) {
  const { c } = useTheme();
  return <Host style={{ position: 'absolute', right: 16, bottom }} matchContents>
    <Button label="Add" systemImage="plus" onPress={onPress} modifiers={[
      buttonStyle(Number(Platform.Version) >= 26 ? 'glassProminent' : 'borderedProminent'),
      buttonBorderShape('circle'), controlSize('extraLarge'), labelStyle('iconOnly'), tint(c.inkPrimary), foregroundColor(c.onPrimary),
    ]} />
  </Host>;
}
