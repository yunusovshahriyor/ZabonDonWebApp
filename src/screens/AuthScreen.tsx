import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Tap } from '../components/Tap';
import { authConfigured, authErrorMessage, resetPassword, signIn, signUp } from '../auth';
import { t } from '../strings';
import { colors, radius, softShadow } from '../theme';
import type { AuthMode } from '../useNav';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Props = { mode: AuthMode; onMode: (m: AuthMode) => void; onClose: () => void; onDone: () => void };

/** Воридшавӣ / сабти ном бо почта ва парол (Firebase Auth); барқарор кардани парол — дар ҳамин экран. */
export function AuthScreen({ mode, onMode, onClose, onDone }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [reset, setReset] = useState(false); // «Паролро фаромӯш кардед?»
  const [tried, setTried] = useState(false); // хатоҳои майдонҳо пас аз аввалин кӯшиш нишон дода мешаванд
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const signup = mode === 'signup';
  const errs = {
    name: signup && name.trim().length < 2 ? t.errName : '',
    email: !EMAIL_RE.test(email.trim()) ? t.errEmail : '',
    password: !reset && password.length < 6 ? t.errPassword : '',
    confirm: signup && !reset && confirm !== password ? t.errConfirm : '',
  };
  const valid = !errs.name && !errs.email && !errs.password && !errs.confirm;

  const submit = async () => {
    if (busy) return;
    setTried(true);
    setError('');
    if (!valid) return;
    setBusy(true);
    try {
      if (reset) {
        await resetPassword(email.trim());
        setSent(true);
      } else if (signup) {
        await signUp(name.trim(), email.trim(), password);
        onDone();
      } else {
        await signIn(email.trim(), password);
        onDone();
      }
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (m: AuthMode) => {
    setError('');
    setTried(false);
    setReset(false);
    setSent(false);
    onMode(m);
  };

  const title = reset ? t.resetTitle : signup ? t.authSignUpTitle : t.authSignInTitle;
  const sub = reset ? t.resetSub : signup ? t.authSignUpSub : t.authSignInSub;
  const cta = reset ? t.resetSend : signup ? t.signUp : t.signIn;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.top}>
        <Tap style={s.back} onPress={onClose} accessibilityLabel={t.goalCancel}>
          <Icon name="back" size={22} color={colors.text} strokeWidth={2.2} />
        </Tap>
        <Text style={s.topTitle}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {!reset ? (
          <View style={s.segment}>
            {(['signin', 'signup'] as AuthMode[]).map((m) => (
              <Tap key={m} style={[s.segBtn, mode === m && s.segOn]} onPress={() => mode !== m && switchMode(m)}>
                <Text style={[s.segText, mode === m && s.segTextOn]}>{m === 'signin' ? t.signIn : t.signUp}</Text>
              </Tap>
            ))}
          </View>
        ) : null}

        <View style={s.card}>
          <Text style={s.sub}>{sub}</Text>

          {!authConfigured ? (
            <View style={s.warn}>
              <Text style={s.warnText}>{t.authNotConfiguredBanner}</Text>
            </View>
          ) : null}
          {error ? (
            <View style={s.err} accessibilityRole="alert">
              <Icon name="close" size={16} color="#C0392B" strokeWidth={2.6} />
              <Text style={s.errText}>{error}</Text>
            </View>
          ) : null}
          {sent ? (
            <View style={s.ok}>
              <Icon name="check" size={16} color={colors.green} strokeWidth={2.6} />
              <Text style={s.okText}>{t.resetSent}</Text>
            </View>
          ) : null}

          {signup && !reset ? (
            <Field label={t.fieldName} error={tried ? errs.name : ''}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t.fieldNamePh}
                placeholderTextColor={colors.textTertiary}
                autoComplete="name"
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailRef.current?.focus()}
                style={s.input as object}
              />
            </Field>
          ) : null}

          <Field label={t.fieldEmail} error={tried ? errs.email : ''}>
            <TextInput
              ref={emailRef}
              value={email}
              onChangeText={setEmail}
              placeholder={t.fieldEmailPh}
              placeholderTextColor={colors.textTertiary}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType={reset ? 'send' : 'next'}
              onSubmitEditing={() => (reset ? submit() : passRef.current?.focus())}
              style={s.input as object}
            />
          </Field>

          {!reset ? (
            <Field label={t.fieldPassword} error={tried ? errs.password : ''}>
              <View style={s.passRow}>
                <TextInput
                  ref={passRef}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t.fieldPasswordPh}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!show}
                  autoComplete={signup ? 'new-password' : 'current-password'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType={signup ? 'next' : 'go'}
                  onSubmitEditing={() => (signup ? confirmRef.current?.focus() : submit())}
                  style={[s.input, { paddingRight: 96 }] as object}
                />
                <Tap style={s.eye} onPress={() => setShow((v) => !v)} accessibilityLabel={show ? t.hidePassword : t.showPassword}>
                  <Text style={s.eyeText}>{show ? t.hidePassword : t.showPassword}</Text>
                </Tap>
              </View>
            </Field>
          ) : null}

          {signup && !reset ? (
            <Field label={t.fieldConfirm} error={tried ? errs.confirm : ''}>
              <TextInput
                ref={confirmRef}
                value={confirm}
                onChangeText={setConfirm}
                placeholder={t.fieldPasswordPh}
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!show}
                autoComplete="new-password"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmitEditing={submit}
                style={s.input as object}
              />
            </Field>
          ) : null}

          {!signup && !reset ? (
            <Tap style={{ alignSelf: 'flex-end', marginTop: 2 }} onPress={() => { setReset(true); setError(''); setTried(false); }}>
              <Text style={s.link}>{t.forgotPassword}</Text>
            </Tap>
          ) : null}

          <Tap style={[s.cta, busy && { opacity: 0.6 }]} onPress={submit} accessibilityState={{ disabled: busy, busy }}>
            <Text style={s.ctaText}>{busy ? '…' : cta}</Text>
            {busy ? null : <Icon name="arrow" size={20} color="#fff" />}
          </Tap>
        </View>

        <View style={s.switchRow}>
          {reset ? (
            <Tap onPress={() => { setReset(false); setSent(false); setError(''); }}>
              <Text style={s.link}>{t.backToSignIn}</Text>
            </Tap>
          ) : (
            <>
              <Text style={s.switchText}>{signup ? t.haveAccount : t.noAccount}</Text>
              <Tap onPress={() => switchMode(signup ? 'signin' : 'signup')}>
                <Text style={s.link}>{signup ? t.signIn : t.signUp}</Text>
              </Tap>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={s.label}>{label}</Text>
      {children}
      {error ? <Text style={s.fieldErr}>{error}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.4 },
  scroll: { padding: 16, paddingBottom: 60 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: 999, backgroundColor: 'rgba(19, 37, 28, 0.06)', marginBottom: 14 },
  segBtn: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  segOn: { backgroundColor: '#fff', boxShadow: '0px 2px 8px rgba(18, 52, 36, 0.12)' },
  segText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  segTextOn: { color: colors.green, fontWeight: '800' },
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, ...softShadow },
  sub: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 6 },
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 1.5,
    borderColor: colors.greenLine,
    fontSize: 16,
    color: colors.text,
    ...({ outlineStyle: 'none' } as object),
  },
  passRow: { justifyContent: 'center' },
  eye: { position: 'absolute', right: 6, height: 38, paddingHorizontal: 10, justifyContent: 'center' },
  eyeText: { fontSize: 12.5, fontWeight: '700', color: colors.green },
  fieldErr: { fontSize: 12.5, color: '#C0392B', marginTop: 5, fontWeight: '600' },
  warn: { marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#FBEBCB', borderWidth: 1, borderColor: '#F0D08A' },
  warnText: { fontSize: 13, color: '#8A5200', fontWeight: '600', lineHeight: 18 },
  err: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#FBE0DD', borderWidth: 1, borderColor: '#F0B3AC' },
  errText: { flex: 1, fontSize: 13.5, color: '#C0392B', fontWeight: '600', lineHeight: 18 },
  ok: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 14, backgroundColor: '#DCF3E5', borderWidth: 1, borderColor: '#A9DDBF' },
  okText: { flex: 1, fontSize: 13.5, color: colors.greenDark, fontWeight: '600', lineHeight: 18 },
  link: { fontSize: 14, fontWeight: '700', color: colors.green },
  cta: { marginTop: 18, height: 52, borderRadius: 26, backgroundColor: colors.green, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0px 8px 20px rgba(30, 127, 85, 0.28)' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18 },
  switchText: { fontSize: 14, color: colors.textSecondary },
});
