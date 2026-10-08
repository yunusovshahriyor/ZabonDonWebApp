import { ReactNode, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, ScrollView, ScrollViewProps, StyleSheet, View } from 'react-native';
import { colors } from '../theme';
import { ProgressRing } from './ProgressRing';

const THRESHOLD = 80; // ба пикселҳо: то ин масофа кашида шавад, саҳифа навсозӣ мешавад
const MAX_PULL = 130;
const HOLD = 68; // ҳангоми навсозӣ саҳифа дар ин баландӣ меистад ва спиннер чарх мезанад
const BADGE = 44;

const ease = { transition: 'transform 320ms cubic-bezier(0.2, 0.9, 0.25, 1), opacity 200ms ease' } as object;
const noEase = { transition: 'none' } as object;

/**
 * Кашидани саҳифа аз боло ба поён (pull-to-refresh) — саҳифа аз нав бор мешавад.
 * Танҳо вақте кор мекунад, ки скролл дар сари саҳифа (scrollTop = 0) бошад.
 * Дар веб бо рӯйдодҳои touch кор мекунад, зеро RefreshControl-и React Native Web амал намекунад.
 *
 * Аниматсия: нишондиҳанда ҳангоми кашидан калон ва равшан мешавад ва бо ангушт чарх мезанад;
 * ҳангоми расидан ба ҳад вибратсияи сабук медиҳад; раҳо кардан — бозгашти мулоим; навсозӣ — чархиши муттасил.
 */
export function PullToRefresh({ children, onRefresh, ...props }: { children: ReactNode; onRefresh?: () => void } & ScrollViewProps) {
  const ref = useRef<ScrollView>(null);
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const state = useRef({ startY: 0, active: false, pull: 0, busy: false, armed: false });
  const spin = useRef(new Animated.Value(0)).current;

  // Чархиши муттасил ҳангоми навсозӣ
  useEffect(() => {
    if (!refreshing) return;
    const loop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [refreshing, spin]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const el = (ref.current as unknown as { getScrollableNode?: () => HTMLElement } | null)?.getScrollableNode?.();
    if (!el) return;
    const st = state.current;
    const tick = () => {
      try {
        navigator.vibrate?.(10);
      } catch {
        /* вибратсия дастнорас аст */
      }
    };

    const start = (e: TouchEvent) => {
      if (st.busy) return;
      st.active = el.scrollTop <= 0;
      st.startY = e.touches[0].clientY;
      st.pull = 0;
      st.armed = false;
    };
    const move = (e: TouchEvent) => {
      if (!st.active || st.busy) return;
      const dy = e.touches[0].clientY - st.startY;
      if (dy <= 0 || el.scrollTop > 0) {
        if (st.pull !== 0) {
          setPull(0);
          setDragging(false);
        }
        st.pull = 0;
        return;
      }
      // Муқовимати афзоянда: ҳар қадар бештар кашед, ҳамон қадар вазнинтар
      const raw = dy * 0.5;
      st.pull = Math.min(MAX_PULL, MAX_PULL * (1 - Math.exp(-raw / MAX_PULL)) * 1.25);
      if (!st.armed && st.pull >= THRESHOLD) {
        st.armed = true;
        tick();
      } else if (st.armed && st.pull < THRESHOLD) {
        st.armed = false;
      }
      setDragging(true);
      setPull(st.pull);
    };
    const end = () => {
      if (!st.active) return;
      st.active = false;
      setDragging(false);
      if (st.pull >= THRESHOLD && !st.busy) {
        st.busy = true;
        setRefreshing(true);
        setPull(HOLD);
        setTimeout(() => (onRefresh ? onRefresh() : window.location.reload()), 700);
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

  const t = Math.min(1, pull / THRESHOLD);
  const ready = pull >= THRESHOLD;
  const scale = refreshing ? 1 : 0.5 + 0.5 * t + (ready ? 0.08 : 0);
  const rotate = refreshing ? spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) : `${t * 300}deg`;
  const motion = dragging ? noEase : ease;

  return (
    <View style={{ flex: 1 }}>
      <View
        pointerEvents="none"
        style={[
          s.badge,
          motion,
          { opacity: refreshing ? 1 : Math.min(1, pull / 24), transform: [{ translateY: pull / 2 - BADGE / 2 }, { scale }] },
        ]}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ProgressRing size={26} stroke={3.5} progress={refreshing ? 0.7 : t} color={colors.green} trackColor={colors.track} />
        </Animated.View>
      </View>
      <View style={[{ flex: 1, transform: [{ translateY: pull }] }, motion]}>
        <ScrollView ref={ref} {...props}>
          {children}
        </ScrollView>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: BADGE,
    height: BADGE,
    borderRadius: BADGE / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
    boxShadow: '0px 4px 14px rgba(30, 127, 85, 0.22)',
  },
});
