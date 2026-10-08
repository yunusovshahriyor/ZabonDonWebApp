import { ReactNode, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { ProgressRing } from './ProgressRing';

const THRESHOLD = 80; // ба пикселҳо: то ин масофа кашида шавад, саҳифа навсозӣ мешавад
const MAX_PULL = 120;
const RING = 36;

/**
 * Кашидани саҳифа аз боло ба поён (pull-to-refresh) — саҳифа аз нав бор мешавад.
 * Танҳо вақте кор мекунад, ки скролл дар сари саҳифа (scrollTop = 0) бошад.
 * Дар веб бо рӯйдодҳои touch кор мекунад, зеро RefreshControl-и React Native Web амал намекунад.
 */
export function PullToRefresh({ children, onRefresh, ...props }: { children: ReactNode; onRefresh?: () => void } & ScrollViewProps) {
  const ref = useRef<ScrollView>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const state = useRef({ startY: 0, active: false, pull: 0, busy: false });

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = (ref.current as unknown as { getScrollableNode?: () => HTMLElement } | null)?.getScrollableNode?.();
    if (!el) return;
    const st = state.current;

    const start = (e: TouchEvent) => {
      if (st.busy) return;
      st.active = el.scrollTop <= 0;
      st.startY = e.touches[0].clientY;
      st.pull = 0;
    };
    const move = (e: TouchEvent) => {
      if (!st.active || st.busy) return;
      const dy = e.touches[0].clientY - st.startY;
      if (dy <= 0 || el.scrollTop > 0) {
        if (st.pull !== 0) setPull(0);
        st.pull = 0;
        return;
      }
      st.pull = Math.min(MAX_PULL, dy * 0.5); // қувваи муқовимат
      setPull(st.pull);
    };
    const end = () => {
      if (!st.active) return;
      st.active = false;
      if (st.pull >= THRESHOLD && !st.busy) {
        st.busy = true;
        setRefreshing(true);
        setPull(RING + 24);
        setTimeout(() => (onRefresh ? onRefresh() : window.location.reload()), 350);
      } else {
        setPull(0);
      }
      st.pull = 0;
    };

    el.addEventListener('touchstart', start, { passive: true });
    el.addEventListener('touchmove', move, { passive: true });
    el.addEventListener('touchend', end);
    el.addEventListener('touchcancel', end);
    return () => {
      el.removeEventListener('touchstart', start);
      el.removeEventListener('touchmove', move);
      el.removeEventListener('touchend', end);
      el.removeEventListener('touchcancel', end);
    };
  }, [onRefresh]);

  return (
    <View style={{ flex: 1 }}>
      <View style={[s.indicator, { opacity: Math.min(1, pull / 30) }]} pointerEvents="none">
        <ProgressRing size={RING} stroke={4} progress={refreshing ? 0.75 : pull / THRESHOLD} color={colors.green} trackColor={colors.track} />
      </View>
      <View style={{ flex: 1, transform: [{ translateY: pull }] }}>
        <ScrollView ref={ref} {...props}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  indicator: { position: 'absolute', top: 12, left: 0, right: 0, alignItems: 'center', zIndex: 0 },
});
