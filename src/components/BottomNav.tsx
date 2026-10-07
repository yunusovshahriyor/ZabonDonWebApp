import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, glass } from '../theme';
import { t } from '../strings';
import { Icon, IconName } from './Icon';

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

// Нави поёнӣ: панҷ тугма, "Асосӣ" — тугмаи сабзи баланд дар марказ.
export function BottomNav({ active = 'home', onChange }: Props) {
  const Tab = ({ item }: { item: Item }) => {
    const on = active === item.key;
    const color = on ? colors.green : colors.navInactive;
    return (
      <Pressable style={styles.tab} onPress={() => onChange?.(item.key)}>
        <Icon name={item.icon} size={22} color={color} />
        <Text style={[styles.label, { color }]} numberOfLines={1}>
          {item.label}
        </Text>
        <View style={[styles.underline, on && { backgroundColor: colors.green }]} />
      </Pressable>
    );
  };

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        {left.map((it) => (
          <Tab key={it.key} item={it} />
        ))}
        <Pressable style={styles.homeTab} onPress={() => onChange?.('home')}>
          <View style={[styles.homeBtn, active !== 'home' && { opacity: 0.85 }]}>
            <Icon name="home" size={24} color="#fff" />
          </View>
          <Text style={[styles.label, { color: colors.green, marginTop: 4 }]}>{t.navHome}</Text>
        </Pressable>
        {right.map((it) => (
          <Tab key={it.key} item={it} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 'fixed' — ба экрани браузер часпонида мешавад
  bar: {
    position: 'fixed' as unknown as 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    alignItems: 'center',
    backgroundColor: colors.navBg,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    ...glass,
  },
  row: { flexDirection: 'row', width: '100%', maxWidth: 480, paddingHorizontal: 8, paddingTop: 8, paddingBottom: 6 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  homeTab: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  homeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginTop: -24,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0px 8px 20px ${colors.green}55`,
  },
  label: { fontSize: 10, fontWeight: '500', marginTop: 3 },
  underline: { width: 22, height: 3, borderRadius: 2, marginTop: 4, backgroundColor: 'transparent' },
});
