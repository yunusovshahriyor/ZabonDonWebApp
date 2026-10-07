import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { BottomNav, TabKey } from './src/components/BottomNav';
import { HomeScreen } from './src/screens/HomeScreen';
import { StudyScreen } from './src/screens/StudyScreen';
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
  }, []);
}

function Soon() {
  return (
    <View style={styles.soon}>
      <Text style={styles.soonText}>Ба зудӣ</Text>
    </View>
  );
}

// Дар телефон экрани пурра; дар компютер — сутуни марказии 480px.
export default function App() {
  useGlobalStyles();
  const [tab, setTab] = useState<TabKey>('home');
  const [studying, setStudying] = useState(false);

  // Ҷаласаи омӯзиш экрани пурра аст (бе менюи поёнӣ)
  if (studying) {
    return (
      <View style={styles.outer}>
        <View style={styles.page}>
          <StudyScreen onClose={() => setStudying(false)} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <View style={styles.page}>
        {tab === 'home' && <HomeScreen onStudy={() => setStudying(true)} />}
        {tab !== 'home' && <Soon />}
      </View>
      <BottomNav active={tab} onChange={setTab} />
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', backgroundColor: 'transparent' },
  page: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: 'transparent' },
  soon: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  soonText: { fontSize: 18, fontWeight: '600', color: colors.textSecondary },
});
