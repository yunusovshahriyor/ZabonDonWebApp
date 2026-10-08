import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { PullToRefresh } from './src/components/PullToRefresh';
import { BottomNav, TabKey } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { StudyScreen } from './src/screens/StudyScreen';
import { setupPwa } from './src/pwa';
import { GAMES_KEY, NAV_KEY, STUDY_KEY, clearSession, getSession, setSession } from './src/session';
import { colors } from './src/theme';

// Шрифти Inter (кириллика) + фони мулоими мятӣ барои тамоми сайт.
function useGlobalStyles() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent =
      `html,body{height:100%;overflow:hidden;overscroll-behavior:none;background:${colors.pageBgCss};background-attachment:fixed}` +
      '#root{position:fixed;top:0;right:0;bottom:0;left:0;overflow:hidden;background:transparent}' +
      'body,input{font-family:Inter,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}';
    document.head.appendChild(style);
    setupPwa();
  }, []);
}

function Soon() {
  return (
    <PullToRefresh style={{ flex: 1 }} contentContainerStyle={styles.soon}>
      <Text style={styles.soonText}>Ба зудӣ</Text>
    </PullToRefresh>
  );
}

// Дар телефон экрани пурра; дар компютер — сутуни марказии 480px.
export default function App() {
  useGlobalStyles();
  // Пас аз навсозии саҳифа (кашидан ё F5) корбар дар ҳамон саҳифа мемонад.
  const [saved] = useState(() => getSession<{ tab: TabKey; studying: boolean }>(NAV_KEY));
  const [tab, setTab] = useState<TabKey>(saved?.tab ?? 'home');
  const [studying, setStudying] = useState(saved?.studying ?? false);
  useEffect(() => {
    setSession(NAV_KEY, { tab, studying });
  }, [tab, studying]);

  // Ҷаласаи омӯзиш экрани пурра аст (бе менюи поёнӣ)
  if (studying) {
    return (
      <View style={styles.outer}>
        <View style={styles.page}>
          <StudyScreen
            onClose={() => {
              clearSession(STUDY_KEY, GAMES_KEY);
              setStudying(false);
            }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <View style={styles.page}>
        {tab === 'home' && <HomeScreen
            onStudy={() => {
              clearSession(STUDY_KEY, GAMES_KEY); // ҷаласаи нав
              setStudying(true);
            }}
          />}
        {tab === 'profile' && <ProfileScreen />}
        {tab !== 'home' && tab !== 'profile' && <Soon />}
      </View>
      <BottomNav active={tab} onChange={setTab} />
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', backgroundColor: 'transparent' },
  page: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: 'transparent' },
  soon: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  soonText: { fontSize: 18, fontWeight: '600', color: colors.textSecondary },
});
