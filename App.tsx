import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { PullToRefresh } from './src/components/PullToRefresh';
import { BottomNav } from './src/components/BottomNav';
import { loadContent } from './src/content';
import { CategoryScreen } from './src/screens/CategoryScreen';
import { DictionariesScreen } from './src/screens/DictionariesScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { StudyScreen } from './src/screens/StudyScreen';
import { setupPwa } from './src/pwa';
import { GAMES_KEY, STUDY_KEY, clearSession } from './src/session';
import { useNav } from './src/useNav';
import { t } from './src/strings';
import { colors } from './src/theme';

// Мундариҷа (категорияҳо ва калимаҳо) аз Firestore: аз кэш фавран, баъд аз база нав мешавад.
loadContent();

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

/** Тоаст дар поёни экран (болотар аз менюи поёнӣ); бо шаффофият пайдо ва нопадид мешавад. */
function Toast({ text, visible }: { text: string; visible: boolean }) {
  return (
    <View pointerEvents="none" style={[styles.toastWrap, { opacity: visible ? 1 : 0, transform: [{ translateY: visible ? 0 : 12 }] }, toastMotion]}>
      <View style={styles.toast}>
        <Text style={styles.toastText}>{text}</Text>
      </View>
    </View>
  );
}
const toastMotion = { transition: 'opacity 220ms ease, transform 220ms ease' } as object;

// Дар телефон экрани пурра; дар компютер — сутуни марказии 480px.
export default function App() {
  useGlobalStyles();
  const { tab, studying, studyCategory, category, toast, goTab, openStudy, closeStudy, openCategory, closeCategory } = useNav();


  // Ҷаласаи омӯзиш экрани пурра аст (бе менюи поёнӣ)
  if (studying) {
    return (
      <View style={styles.outer}>
        <View style={styles.page}>
          <StudyScreen
            onClose={() => {
              clearSession(STUDY_KEY, GAMES_KEY);
              closeStudy();
            }}
            categoryId={studyCategory}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.outer}>
      <View style={styles.page}>
        {tab === 'home' && (
          <HomeScreen
            onStudy={() => {
              clearSession(STUDY_KEY, GAMES_KEY); // ҷаласаи нав
              openStudy();
            }}
          />
        )}
        {tab === 'dict' &&
          (category ? (
            <CategoryScreen
              categoryId={category}
              onBack={closeCategory}
              onStudy={(id) => {
                clearSession(STUDY_KEY, GAMES_KEY);
                openStudy(id);
              }}
            />
          ) : (
            <DictionariesScreen onOpen={openCategory} />
          ))}
        {tab === 'profile' && <ProfileScreen />}
        {tab !== 'home' && tab !== 'dict' && tab !== 'profile' && <Soon />}
      </View>
      <BottomNav active={tab} onChange={goTab} />
      <StatusBar style="dark" />
      <Toast text={t.exitToast} visible={toast} />
    </View>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 108, alignItems: 'center', paddingHorizontal: 24, zIndex: 100 },
  toast: { maxWidth: 360, backgroundColor: 'rgba(19, 37, 28, 0.92)', borderRadius: 22, paddingHorizontal: 18, paddingVertical: 12, boxShadow: '0px 10px 28px rgba(18, 52, 36, 0.28)' },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
  outer: { flex: 1, alignItems: 'center', backgroundColor: 'transparent' },
  page: { flex: 1, width: '100%', maxWidth: 480, backgroundColor: 'transparent' },
  soon: { flexGrow: 1, alignItems: 'center', justifyContent: 'center' },
  soonText: { fontSize: 18, fontWeight: '600', color: colors.textSecondary },
});
