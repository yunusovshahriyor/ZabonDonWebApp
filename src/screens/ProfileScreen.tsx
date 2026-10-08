import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { PullToRefresh } from '../components/PullToRefresh';
import { Tap } from '../components/Tap';
import { useInstall } from '../pwa';
import { t } from '../strings';
import { colors, glass, radius, softShadow } from '../theme';

function Steps({ title, steps }: { title: string; steps: string[] }) {
  return (
    <View style={{ marginTop: 14, gap: 8 }}>
      <Text style={s.stepsTitle}>{title}</Text>
      {steps.map((text, i) => (
        <View key={i} style={s.step}>
          <View style={s.stepNum}>
            <Text style={s.stepNumText}>{i + 1}</Text>
          </View>
          <Text style={s.stepText}>{text}</Text>
        </View>
      ))}
    </View>
  );
}

/** Корти "Насб кардан ҳамчун барнома" (PWA). */
function InstallCard() {
  const { installed, canPrompt, ios, install } = useInstall();
  return (
    <View style={s.card}>
      <View style={s.row}>
        <View style={s.iconCircle}>
          <Icon name={installed ? 'check' : 'download'} size={24} color={colors.green} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{installed ? t.installedTitle : t.installTitle}</Text>
          <Text style={s.cardDesc}>{installed ? t.installedDesc : t.installDesc}</Text>
        </View>
      </View>
      {installed ? null : canPrompt ? (
        <Tap style={s.btn} onPress={install}>
          <Text style={s.btnText}>{t.installBtn}</Text>
          <Icon name="download" size={20} color="#fff" />
        </Tap>
      ) : ios ? (
        <Steps title={t.installIosTitle} steps={t.installIosSteps} />
      ) : (
        <Steps title={t.installManualTitle} steps={t.installManualSteps} />
      )}
    </View>
  );
}

export function ProfileScreen() {
  return (
    <PullToRefresh style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 16, paddingBottom: 100, gap: 12 }} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>{t.profileTitle}</Text>
      <InstallCard />
    </PullToRefresh>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.6, paddingHorizontal: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, ...softShadow, ...glass },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  cardDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 3, lineHeight: 18 },
  btn: {
    marginTop: 16,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0px 8px 20px rgba(30, 127, 85, 0.28)',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  stepsTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 12, fontWeight: '800', color: colors.green },
  stepText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 19 },
});
