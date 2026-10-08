import { Platform, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../components/Icon';
import { Tap } from '../../components/Tap';
import { colors } from '../../theme';

export function speak(text: string) {
  if (Platform.OS !== 'web' || typeof speechSynthesis === 'undefined') return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU';
    u.rate = 0.9;
    speechSynthesis.speak(u);
  } catch {
    /* овоздиҳӣ дастнорас аст */
  }
}

/** Вибратсия (Web Vibration API; дар iOS Safari дастгирӣ намешавад): дуруст — хеле сабук, хато — қавитар. */
export function haptic(kind: 'right' | 'wrong') {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(kind === 'right' ? 8 : [120, 60, 160]);
  } catch {
    /* вибратсия дастнорас аст */
  }
}

/** Боло: пӯшидан, навори пешравӣ, нишондиҳандаи марҳала. */
export function StudyHeader({ onClose, progress, label }: { onClose: () => void; progress: number; label: string }) {
  return (
    <View style={c.top}>
      <Tap style={c.closeBtn} onPress={onClose}>
        <Icon name="close" size={20} color={colors.text} />
      </Tap>
      <View style={c.track}>
        <View style={[c.fill, { width: `${Math.max(0, Math.min(1, progress)) * 100}%` }]} />
      </View>
      <Text style={c.label}>{label}</Text>
    </View>
  );
}

export function PrimaryBtn({
  label,
  onPress,
  disabled,
  tone = 'green',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  tone?: 'green' | 'red';
}) {
  return (
    <Tap
      onPress={disabled ? undefined : onPress}
      style={[c.primary, tone === 'red' && { backgroundColor: '#D8483B', boxShadow: '0px 8px 20px rgba(216, 72, 59, 0.28)' }, disabled && { opacity: 0.45 }]}
    >
      <Text style={c.primaryText}>{label}</Text>
    </Tap>
  );
}

export const c = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.track, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: colors.green },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, minWidth: 64, textAlign: 'right' },
  actions: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, paddingBottom: 24 },
  primary: {
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    boxShadow: '0px 8px 20px rgba(30, 127, 85, 0.28)',
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.greenSoft },
  chipText: { fontSize: 12, fontWeight: '700', color: colors.green, letterSpacing: 0.4 },
});
