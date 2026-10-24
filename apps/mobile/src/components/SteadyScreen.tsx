import type { ComponentType } from 'react';
import { LayoutAnimationConfig } from 'react-native-reanimated';

/**
 * A tab screen that is simply there the first time it is seen. Rows already on it skip their
 * entrance, which would otherwise read as loading; rows that arrive later (a new to-do, another
 * day on Plan) still fade in. Tabs stay mounted, so this only ever touches the first view.
 */
export function steadyScreen<P extends object>(Screen: ComponentType<P>): ComponentType<P> {
  function Steady(props: P) {
    return (
      <LayoutAnimationConfig skipEntering>
        <Screen {...props} />
      </LayoutAnimationConfig>
    );
  }
  Steady.displayName = `Steady(${Screen.displayName ?? Screen.name})`;
  return Steady;
}
