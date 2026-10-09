import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { PullToRefresh } from '../components/PullToRefresh';
import { Tap } from '../components/Tap';
import { demo, useProgress } from '../data';
import { signOut, useAuth } from '../auth';
import { useInstall } from '../pwa';
import type { AuthMode } from '../useNav';
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

/** Корти меҳмон: аватар, "Ворид шудан" ва "Сабти ном". */
function GuestCard({ onAuth }: { onAuth: (mode: AuthMode) => void }) {
  return (
    <View style={s.card}>
      <View style={s.guestTop}>
        <View style={s.avatar}>
          <Icon name="user" size={34} color={colors.green} strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.guestName}>{t.guestName}</Text>
          <Text style={s.guestSub}>{t.guestSub}</Text>
        </View>
      </View>
      <Tap style={s.btn} onPress={() => onAuth('signin')}>
        <Text style={s.btnText}>{t.signIn}</Text>
        <Icon name="arrow" size={20} color="#fff" />
      </Tap>
      <Tap style={s.btnOutline} onPress={() => onAuth('signup')}>
        <Text style={s.btnOutlineText}>{t.signUp}</Text>
      </Tap>
    </View>
  );
}

/** Корти корбари воридшуда: ҳарфи аввали ном, ном, почта ва баромад аз ҳисоб. */
function SignedInCard({ name, email }: { name: string; email: string }) {
  const letter = (name || email).charAt(0).toUpperCase();
  return (
    <View style={s.card}>
      <View style={s.guestTop}>
        <View style={s.avatar}>
          <Text style={s.avatarLetter}>{letter}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={s.guestName} numberOfLines={1}>
            {name || t.signedInAs}
          </Text>
          <Text style={s.guestSub} numberOfLines={1}>
            {email}
          </Text>
        </View>
      </View>
      <Tap style={s.btnOutline} onPress={signOut}>
        <Text style={s.btnOutlineText}>{t.signOut}</Text>
      </Tap>
    </View>
  );
}

/** Афзалиятҳои воридшавӣ. */
function Benefits() {
  return (
    <View style={s.card}>
      <Text style={s.sectionTitle}>{t.whySignIn}</Text>
      <View style={{ marginTop: 12, gap: 14 }}>
        {t.benefits.map((b) => (
          <View key={b.title} style={s.row}>
            <View style={s.iconSquare}>
              <Icon name={b.icon} size={20} color={colors.green} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.benefitTitle}>{b.title}</Text>
              <Text style={s.cardDesc}>{b.sub}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Пешравии маҳаллӣ (дар ин дастгоҳ): серия, тангаҳо, калимаҳои омӯхташуда. */
function LocalStats() {
  useProgress();
  const items: { icon: 'flame' | 'star' | 'check'; value: string; label: string; sub?: string; tint: string; bg: string }[] = [
    { icon: 'flame', value: String(demo.streak), label: t.statStreak, sub: t.streakBest(demo.bestStreak), tint: '#D9622B', bg: '#FCE7D9' },
    { icon: 'star', value: demo.coins, label: t.statCoins, tint: '#B96A00', bg: '#FBEBCB' },
    { icon: 'check', value: String(demo.learned), label: t.statLearned, tint: colors.green, bg: colors.greenSoft },
  ];
  return (
    <View>
      <Text style={[s.sectionTitle, { paddingHorizontal: 4, marginBottom: 10 }]}>{t.localProgress}</Text>
      <View style={s.statsRow}>
        {items.map((it) => (
          <View key={it.label} style={s.stat}>
            <View style={[s.statIcon, { backgroundColor: it.bg }]}>
              <Icon name={it.icon} size={18} color={it.tint} strokeWidth={2} />
            </View>
            <Text style={s.statValue} numberOfLines={1}>
              {it.value}
            </Text>
            <Text style={s.statLabel} numberOfLines={1}>
              {it.label}
            </Text>
            {it.sub ? (
              <Text style={[s.statLabel, { marginTop: 1, fontSize: 10 }]} numberOfLines={1}>
                {it.sub}
              </Text>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

/** Профил: меҳмон (воридшавӣ/сабти ном ва афзалиятҳо) ё корбари воридшуда; пешравии маҳаллӣ ва насб кардани барнома. */
export function ProfileScreen({ onAuth }: { onAuth: (mode: AuthMode) => void }) {
  const user = useAuth();
  return (
    <PullToRefresh style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 16, paddingBottom: 110, gap: 14 }} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>{t.profileTitle}</Text>
      {user ? <SignedInCard name={user.name} email={user.email} /> : <GuestCard onAuth={onAuth} />}
      {user ? null : <Benefits />}
      <LocalStats />
      <InstallCard />
      <Text style={s.version}>{t.appVersion}</Text>
    </PullToRefresh>
  );
}

const s = StyleSheet.create({
  guestTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarLetter: { fontSize: 28, fontWeight: '800', color: colors.green },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  guestName: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  guestSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  btnOutline: { marginTop: 10, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: colors.greenLine, alignItems: 'center', justifyContent: 'center' },
  btnOutlineText: { color: colors.green, fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text, letterSpacing: -0.2 },
  iconSquare: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontSize: 14.5, fontWeight: '700', color: colors.text },
  statsRow: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, minWidth: 0, backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center', ...softShadow, ...glass },
  statIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 8, letterSpacing: -0.4 },
  statLabel: { fontSize: 11.5, color: colors.textSecondary, marginTop: 2 },
  version: { textAlign: 'center', fontSize: 12, color: colors.textTertiary, marginTop: 4 },
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
