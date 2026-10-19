import { localParts } from '@dayli/core';
import { Button as SwiftButton, DatePicker, Host, Toggle } from '@expo/ui/swift-ui';
import type { ComponentProps } from 'react';
import { accessibilityLabel, buttonBorderShape, buttonStyle, controlSize, datePickerStyle, tint } from '@expo/ui/swift-ui/modifiers';

import type { DateFieldProps, NativeButtonProps, ToggleProps } from '@/components/Native';
import { useTheme } from '@/theme';

function toDate(date: string | null, time: string | null): Date {
  const [y, m, d] = (date ?? localParts(new Date()).date).split('-').map(Number);
  const [hh, mm] = (time ?? '09:00').split(':').map(Number);
  return new Date(y!, m! - 1, d!, hh!, mm!);
}

/** SwiftUI compact date picker; the system sheet handles the calendar. */
export function DateField({ date, time, onChange, disabled }: DateFieldProps) {
  return (
    <Host style={{ height: 34, width: 124 }} matchContents>
      <DatePicker
        selection={toDate(date, time)}
        displayedComponents={['date']}
        onDateChange={(d) => onChange(localParts(d).date)}
        modifiers={[datePickerStyle('compact')]}
      />
    </Host>
  );
}

export function TimeField({ date, time, onChange }: DateFieldProps) {
  return (
    <Host style={{ height: 34, width: 92 }} matchContents>
      <DatePicker
        selection={toDate(date, time)}
        displayedComponents={['hourAndMinute']}
        onDateChange={(d) => onChange(localParts(d).time)}
        modifiers={[datePickerStyle('compact')]}
      />
    </Host>
  );
}

export function NativeToggle({ value, onChange, label }: ToggleProps) {
  const { c } = useTheme();
  return (
    <Host style={{ width: 52, height: 32 }} matchContents>
      <Toggle isOn={value} onIsOnChange={onChange} modifiers={[tint(c.inkPrimary), ...(label ? [accessibilityLabel(label)] : [])]} />
    </Host>
  );
}

/** A real SwiftUI button for secondary actions (delete, done). Primary CTAs stay brand-styled. */
export function NativeButton({ label, onPress, role, color, systemImage }: NativeButtonProps) {
  return (
    <Host style={{ height: 50, alignSelf: 'center' }} matchContents>
      <SwiftButton
        label={label}
        onPress={onPress}
        role={role}
        systemImage={systemImage as ComponentProps<typeof SwiftButton>['systemImage']}
        modifiers={[buttonStyle('bordered'), controlSize('large'), buttonBorderShape('capsule'), ...(color ? [tint(color)] : [])]}
      />
    </Host>
  );
}
