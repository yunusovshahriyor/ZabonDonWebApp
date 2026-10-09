import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { GOAL_MAX, GOAL_MIN } from '../data';
import { t } from '../strings';
import { colors } from '../theme';
import { Icon } from './Icon';
import { Tap } from './Tap';

const PRESETS = [3, 5, 10, 15, 20, 30];

type Props = { visible: boolean; current: number; onClose: () => void; onSave: (goal: number) => void };

/** Диалоги «Мақсади рӯзона»: − / + ва интихоби зуд; "Захира кардан" мақсадро иваз мекунад. */
export function GoalDialog({ visible, current, onClose, onSave }: Props) {
  const [value, setValue] = useState(current);

  // Ҳар дафъаи кушодан аз мақсади ҷорӣ оғоз мекунем.
  useEffect(() => {
    if (visible) setValue(current);
  }, [visible, current]);

  // Escape — бастан (веб)
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose]);

  if (!visible) return null;
  const clamp = (n: number) => Math.max(GOAL_MIN, Math.min(GOAL_MAX, n));

  const node = (
    <View style={s.overlay}>
      {/* Пахши фон — бастан */}
      <Tap style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={t.goalCancel} />
      <View style={s.dialog} accessibilityRole="alert">
        <Text style={s.title}>{t.goalTitle}</Text>
        <Text style={s.desc}>{t.goalDesc}</Text>

        <View style={s.stepper}>
          <Tap style={[s.stepBtn, value <= GOAL_MIN && s.stepBtnOff]} onPress={() => setValue((v) => clamp(v - 1))} accessibilityLabel="−">
            <Text style={s.stepText}>−</Text>
          </Tap>
          <View style={s.valueBox}>
            <Text style={s.value}>{value}</Text>
            <Text style={s.unit}>{t.goalUnit}</Text>
          </View>
          <Tap style={[s.stepBtn, value >= GOAL_MAX && s.stepBtnOff]} onPress={() => setValue((v) => clamp(v + 1))} accessibilityLabel="+">
            <Text style={s.stepText}>+</Text>
          </Tap>
        </View>

        <View style={s.presets}>
          {PRESETS.map((p) => {
            const on = p === value;
            return (
              <Tap key={p} style={[s.chip, on && s.chipOn]} onPress={() => setValue(p)}>
                <Text style={[s.chipText, on && s.chipTextOn]}>{p}</Text>
              </Tap>
            );
          })}
        </View>

        <View style={s.row}>
          <Tap style={[s.btn, s.btnGhost]} onPress={onClose}>
            <Text style={s.btnGhostText}>{t.goalCancel}</Text>
          </Tap>
          <Tap
            style={[s.btn, s.btnMain]}
            onPress={() => {
              onSave(value);
              onClose();
            }}
          >
            <Icon name="check" size={18} color="#fff" strokeWidth={2.6} />
            <Text style={s.btnMainText}>{t.goalSave}</Text>
          </Tap>
        </View>
      </View>
    </View>
  );
  // Веб: ба document.body мебарем — ҳар View дар React Native Web z-index:0 дорад ва контексти ҷудо месозад, барои ҳамин
  // дар дохили саҳифа диалог аз зери менюи поёнӣ (z-index 10) баромада наметавонад.
  return Platform.OS === 'web' && typeof document !== 'undefined' ? createPortal(node, document.body) : node;
}

const s = StyleSheet.create({
  overlay: {
    // 'fixed' — ба экрани браузер часпонида мешавад (болотар аз менюи поёнӣ)
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
  title: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  desc: { fontSize: 14, color: colors.textSecondary, marginTop: 6, lineHeight: 20 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 },
  stepBtn: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  stepBtnOff: { opacity: 0.4 },
  stepText: { fontSize: 28, fontWeight: '600', color: colors.green, lineHeight: 32 },
  valueBox: { alignItems: 'center', flex: 1 },
  value: { fontSize: 46, fontWeight: '800', color: colors.text, letterSpacing: -1, lineHeight: 52 },
  unit: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  presets: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 18 },
  chip: { minWidth: 44, height: 38, paddingHorizontal: 8, borderRadius: 19, backgroundColor: 'rgba(19, 37, 28, 0.05)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'transparent' },
  chipOn: { backgroundColor: colors.greenSoft, borderColor: colors.green },
  chipText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  chipTextOn: { color: colors.green },
  row: { flexDirection: 'row', gap: 10, marginTop: 22 },
  btn: { flex: 1, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  btnGhost: { backgroundColor: 'rgba(19, 37, 28, 0.06)' },
  btnGhostText: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  btnMain: { backgroundColor: colors.green, boxShadow: '0px 8px 20px rgba(30, 127, 85, 0.28)' },
  btnMainText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
