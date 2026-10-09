import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { t } from '../strings';
import { colors } from '../theme';
import { Coin } from './Coin';
import { Tap } from './Tap';

type Props = { title: string; message: string; onClose: () => void; coin?: boolean };

/** Диалоги маълумотӣ (қоидаҳои тангаҳо, "Танга чист?"): сарлавҳа, матн, тугмаи «Фаҳмо». Мисли RusLearnInfoDialog/CoinRulesDialog дар Android. */
export function InfoDialog({ title, message, onClose, coin = true }: Props) {
  // Escape — бастан (веб)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const node = (
    <View style={s.overlay}>
      <Tap style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t.gotIt} />
      <View style={s.dialog} accessibilityRole="alert">
        <View style={s.head}>
          {coin ? <Coin size={26} /> : null}
          <Text style={s.title}>{title}</Text>
        </View>
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          <Text style={s.message}>{message}</Text>
        </ScrollView>
        <Tap style={s.btn} onPress={onClose}>
          <Text style={s.btnText}>{t.gotIt}</Text>
        </Tap>
      </View>
    </View>
  );
  // Веб: ба document.body (болотар аз менюи поёнӣ), мисли GoalDialog
  return Platform.OS === 'web' && typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}

const s = StyleSheet.create({
  overlay: {
    position: 'fixed' as unknown as 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
    backgroundColor: 'rgba(19, 37, 28, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 26, padding: 22, boxShadow: '0px 18px 48px rgba(18, 52, 36, 0.28)' },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { flex: 1, fontSize: 19, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  message: { fontSize: 15, color: colors.textSecondary, marginTop: 12, lineHeight: 22 },
  btn: { height: 48, borderRadius: 24, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginTop: 18, boxShadow: '0px 8px 20px rgba(30, 127, 85, 0.28)' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
