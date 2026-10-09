import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Animated, Easing, Platform, StyleSheet, Text, View } from 'react-native';
import { currentStreak, currentWeekDays } from '../streak';
import { t } from '../strings';
import { colors } from '../theme';
import { Tap } from './Tap';

// Ранги серия — аз Android (ruslearn_streak_accent / day_subtle_bg)
const ACCENT = '#FF9600';
const SUBTLE_BG = '#FFF4E5';

/** Табрики рӯзи фаъол: оташ бо рақами серия, ҳафта (Дш → Яш) ва тавсиф. Мувофиқи StreakCelebrationDialog дар Android. */
export function StreakDialog({ onClose }: { onClose: () => void }) {
  const streak = currentStreak();
  const week = currentWeekDays();
  const scale = useRef(new Animated.Value(0.35)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 5, tension: 70, useNativeDriver: false }).start();
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, delay: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(rise, { toValue: 0, duration: 420, delay: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  }, [scale, fade, rise]);

  const node = (
    <View style={s.overlay}>
      <View style={s.panel}>
        <Animated.View style={[s.hero, { transform: [{ scale }], opacity: scale.interpolate({ inputRange: [0.35, 1], outputRange: [0, 1] }) }]}>
          <Text style={s.flame}>🔥</Text>
          <Text style={s.number}>{streak}</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }], alignSelf: 'stretch', alignItems: 'center' }}>
          <Text style={s.title}>{t.streakTitle(streak)}</Text>

          <View style={s.week}>
            {week.map((d) => (
              <View key={d.dayLabel} style={s.cell}>
                <Text style={[s.label, { color: d.isActive || d.isToday ? colors.text : colors.textTertiary }, d.isToday && d.isActive && { color: ACCENT }]}>
                  {d.dayLabel}
                </Text>
                <View style={s.dateWrap}>
                  {d.isToday && d.isActive ? <Text style={s.miniFlame}>🔥</Text> : null}
                  <View
                    style={[
                      s.circle,
                      d.isToday && d.isActive && { backgroundColor: ACCENT },
                      d.isActive && !d.isToday && { backgroundColor: SUBTLE_BG },
                    ]}
                  >
                    <Text
                      style={[
                        s.date,
                        { color: d.isActive || d.isToday ? colors.text : colors.textTertiary },
                        d.isToday && d.isActive && { color: '#fff' },
                        d.isActive && !d.isToday && { color: ACCENT },
                      ]}
                    >
                      {d.dayOfMonth}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <Text style={s.desc}>{t.streakDesc(streak)}</Text>
        </Animated.View>

        <Tap style={s.button} onPress={onClose}>
          <Text style={s.buttonText}>{t.streakGreat}</Text>
        </Tap>
      </View>
    </View>
  );
  // Portal ба document.body: болои менюи поёнӣ ва бе таъсири transform/backdrop-filter-и падарон (мисли GoalDialog)
  return Platform.OS === 'web' && typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}

const s = StyleSheet.create({
  overlay: {
    position: 'fixed' as unknown as 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFBF5',
  },
  panel: { width: '100%', maxWidth: 480, flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  hero: { width: 168, height: 168, alignItems: 'center', justifyContent: 'center' },
  flame: { fontSize: 128, lineHeight: 150 },
  number: { position: 'absolute', top: 76, fontSize: 40, fontWeight: '800', color: '#fff', textShadow: '0px 2px 6px rgba(160, 80, 0, 0.45)' } as object,
  title: { fontSize: 26, fontWeight: '800', color: ACCENT, letterSpacing: -0.4 },
  week: { flexDirection: 'row', alignSelf: 'stretch', marginTop: 22 },
  cell: { flex: 1, alignItems: 'center', gap: 6 },
  label: { fontSize: 12, fontWeight: '700' },
  dateWrap: { alignItems: 'center', justifyContent: 'flex-end', height: 52 },
  miniFlame: { fontSize: 14, lineHeight: 16 },
  circle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  date: { fontSize: 15, fontWeight: '800' },
  desc: { marginTop: 20, fontSize: 16, lineHeight: 23, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 6 },
  button: {
    alignSelf: 'stretch',
    height: 52,
    marginTop: 18,
    borderRadius: 26,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 8px 22px rgba(255, 150, 0, 0.35)',
  },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
