import { addDays, diffDays } from '@dayli/core';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { FlatList, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

/** Ten years of weeks either side of the one Plan opened on. */
const SPAN = 520;
const PAGES = Array.from({ length: SPAN * 2 + 1 }, (_, i) => i);

/**
 * Plan's week chart as native pages. The week follows the finger, a flick carries its speed
 * into the system's paging, and the weeks either side are already drawn, so nothing pops in
 * after the swipe. A change from elsewhere (Today, the month grid) slides the pages there when
 * it is near and jumps when it is far. `onWeek` gets how many weeks the swipe moved.
 */
export function WeekPager({ weekStart, renderWeek, onWeek, scrollEnabled = true }: {
  weekStart: string; renderWeek: (start: string) => ReactElement; onWeek: (step: number) => void; scrollEnabled?: boolean;
}) {
  const window = useWindowDimensions();
  const [width, setWidth] = useState(window.width);
  const [base] = useState(weekStart);
  const indexOf = (start: string) => SPAN + Math.round(diffDays(base, start) / 7);
  const list = useRef<FlatList<number>>(null);
  // The page the list is on, as far as this component knows; a swipe and a jump both update it.
  const [first] = useState(() => indexOf(weekStart));
  const at = useRef(first);

  useEffect(() => {
    const target = SPAN + Math.round(diffDays(base, weekStart) / 7);
    if (target === at.current) return;
    const near = Math.abs(target - at.current) <= 4;
    at.current = target;
    list.current?.scrollToIndex({ index: target, animated: near });
  }, [weekStart, base]);

  // A new width (rotation, a resized window) moves every page; stay on the same one.
  useEffect(() => {
    list.current?.scrollToIndex({ index: at.current, animated: false });
  }, [width]);

  const settle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i === at.current) return;
    const step = i - at.current;
    at.current = i;
    onWeek(step);
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <FlatList
        ref={list}
        data={PAGES}
        keyExtractor={(i) => String(i)}
        horizontal
        pagingEnabled
        scrollEnabled={scrollEnabled}
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={first}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
        extraData={renderWeek}
        onMomentumScrollEnd={settle}
        renderItem={({ item }) => <View style={{ width }}>{renderWeek(addDays(base, (item - SPAN) * 7))}</View>}
      />
    </View>
  );
}
