import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, glass } from '../theme';
import { t } from '../strings';
import { Icon, IconName } from './Icon';
import { Tap } from './Tap';

export type TabKey = 'dict' | 'stats' | 'home' | 'rank' | 'profile';

type Item = { key: TabKey; icon: IconName; label: string };

const left: Item[] = [
  { key: 'dict', icon: 'book', label: t.navDictionaries },
  { key: 'stats', icon: 'stats', label: t.navStats },
];
const right: Item[] = [
  { key: 'rank', icon: 'award', label: t.navLeaderboard },
  { key: 'profile', icon: 'user', label: t.navProfile },
];

type Props = { active?: TabKey; onChange?: (k: TabKey) => void };

// Гузариши тез (90мс): ҳолати пахш дар лаҳзаи ламс намоён мешавад (бо Tap бе таъхир).
const smooth = { transition: 'background-color 90ms ease-out, transform 90ms ease-out, opacity 90ms ease-out' } as object;

function Tab({ item, on, fontSize, onPress }: { item: Item; on: boolean; fontSize: number; onPress: () => void }) {
  const color = on ? colors.green : colors.navInactive;
  return (
    <Tap style={styles.tab} onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={item.label}>
      {({ pressed }) => (
        <>
          {/* Ҳангоми ламс "ҳаб" фавран пайдо мешавад (ҳатто барои тугмаи ғайрифаъол) */}
          <View style={[styles.pill, on && styles.pillOn, pressed && !on && styles.pillPressed, smooth]}>
            <Icon name={item.icon} size={22} color={pressed ? colors.green : color} strokeWidth={on || pressed ? 2.2 : 1.8} />
          </View>
          <Text style={[styles.label, { fontSize, color: pressed ? colors.green : color, fontWeight: on ? '700' : '500' }]} numberOfLines={1}>
            {item.label}
          </Text>
        </>
      )}
    </Tap>
  );
}

/**
 * Нави поёнӣ: панели шиша ("ҷазира") бо канораҳои мудаввар; панҷ тугма, "Асосӣ" — тугмаи сабзи баландшуда дар марказ.
 * Тугмаи фаъол дар "ҳаб"-и сабзи мулоим; дар экранҳои хурд (<350px) ҳарфҳо каме хурдтаранд.
 */
export function BottomNav({ active = 'home', onChange }: Props) {
  const { width } = useWindowDimensions();
  const fontSize = width < 350 ? 9.5 : width < 380 ? 10.5 : 11; // ҳарфҳо ба паҳнои экран мутобиқ мешаванд, то нишонаҳо бурида нашаванд
  const homeOn = active === 'home';
  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={[styles.row, glass]}>
        {left.map((it) => (
          <Tab key={it.key} item={it} on={active === it.key} fontSize={fontSize} onPress={() => onChange?.(it.key)} />
        ))}
        <Tap style={styles.homeTab} onPress={() => onChange?.('home')} accessibilityRole="tab" accessibilityState={{ selected: homeOn }} accessibilityLabel={t.navHome}>
          {({ pressed }) => (
            <>
              <View style={[styles.homeBtn, !homeOn && styles.homeBtnIdle, pressed && styles.homeBtnPressed, smooth]}>
                <Icon name="home" size={25} color="#fff" strokeWidth={2} />
              </View>
              <Text style={[styles.label, { fontSize, color: colors.green, fontWeight: '700' }]} numberOfLines={1}>
                {t.navHome}
              </Text>
            </>
          )}
        </Tap>
        {right.map((it) => (
          <Tab key={it.key} item={it} on={active === it.key} fontSize={fontSize} onPress={() => onChange?.(it.key)} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 'fixed' — ба экрани браузер часпонида мешавад
  wrap: {
    position: 'fixed' as unknown as 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
    ...({ paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))' } as object),
  },
  row: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 456,
    height: 64,
    paddingHorizontal: 2,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    boxShadow: '0px 10px 30px rgba(18, 52, 36, 0.16), 0px 1px 0px rgba(19, 37, 28, 0.04)',
  },
  tab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', gap: 2 },
  pill: { width: 46, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  pillOn: { backgroundColor: colors.greenSoft },
  pillPressed: { backgroundColor: 'rgba(30, 127, 85, 0.14)' },
  homeTab: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 7 },
  homeBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginBottom: 3,
    flexShrink: 0, // кӯтоҳ нашавад, вақте мундариҷа аз баландии панел зиёд аст (тугма болотар мебарояд)
    backgroundColor: colors.green,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 8px 18px ${colors.green}55`,
  },
  homeBtnIdle: { opacity: 0.9, transform: [{ scale: 0.94 }] },
  homeBtnPressed: { backgroundColor: colors.greenDark, opacity: 1, transform: [{ scale: 0.9 }] },
  label: { letterSpacing: -0.2, maxWidth: '100%', flexShrink: 0 },
});
