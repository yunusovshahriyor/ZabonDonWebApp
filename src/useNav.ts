import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { TabKey } from './components/BottomNav';

export type Nav = { tab: TabKey; studying: boolean };

type HState = { zd: 1; tab: TabKey; studying: boolean } | { zd: 'exit' };

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
const depthOf = (n: Nav) => (n.tab !== 'home' ? 1 : 0) + (n.studying ? 1 : 0);

/**
 * Навигатсия бо History API, то тугмаи "Назад"-и телефон/браузер кор кунад:
 *  • дар саҳифаҳои дигар — як қадам ба қафо (омӯзиш → саҳифаи пештара → асосӣ);
 *  • дар саҳифаи асосӣ — диалоги пурсиши баромад.
 *
 * Стек: [сентинел "exit"] → [асосӣ] → [таб] → [омӯзиш]. Сентинел ва "асосӣ" танҳо бо аввалин ламс сохта мешаванд:
 * Chrome вуруди таърихеро, ки бе амали корбар илова шудааст, ҳангоми "Назад" мегузаронад.
 * Пас аз навсозии саҳифа стек ва ҳолат аз history.state барқарор мешаванд.
 */
export function useNav() {
  const [nav, setNavState] = useState<Nav>(() => {
    const st = isWeb ? (history.state as HState | null) : null;
    return st && st.zd === 1 ? { tab: st.tab, studying: st.studying } : { tab: 'home', studying: false };
  });
  const [exitOpen, setExitOpen] = useState(false);
  const [exited, setExited] = useState(false); // баромад имконнопазир буд (таб бе таърихи пештара) — экрани «баста шуд»
  const navRef = useRef(nav);
  navRef.current = nav;
  const exitOpenRef = useRef(false);
  exitOpenRef.current = exitOpen;
  // Агар навсозӣ дар миёнаи стек бошад, стек аллакай ҳаст.
  const stackReady = useRef(isWeb && (history.state as HState | null)?.zd === 1);

  const ensureStack = useCallback(() => {
    if (!isWeb || stackReady.current) return;
    stackReady.current = true;
    history.replaceState({ zd: 'exit' } satisfies HState, '');
    history.pushState({ zd: 1, tab: 'home', studying: false } satisfies HState, '');
  }, []);

  useEffect(() => {
    if (!isWeb) return;
    // Аввалин ламс: стекро месозад (бояд дар доираи амали корбар бошад).
    const onFirstTouch = () => ensureStack();
    window.addEventListener('pointerup', onFirstTouch, { once: true, capture: true });
    const onPop = (e: PopStateEvent) => {
      const st = e.state as HState | null;
      if (st?.zd === 'exit') {
        // Ба сентинел расидем: дафъаи аввал — диалоги баромад, дафъаи дуюм — баромад.
        if (exitOpenRef.current) confirmExit();
        else setExitOpen(true);
      } else if (st?.zd === 1) {
        setExitOpen(false);
        setNavState({ tab: st.tab, studying: st.studying });
      }
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('pointerup', onFirstTouch, true);
      window.removeEventListener('popstate', onPop);
    };
  }, [ensureStack]);

  const goTab = useCallback(
    (tab: TabKey) => {
      const cur = navRef.current;
      if (tab === cur.tab) return;
      if (!isWeb) return setNavState({ tab, studying: false });
      ensureStack();
      if (tab === 'home') {
        const d = depthOf(cur);
        if (d > 0) history.go(-d); // popstate ҳолатро ба "асосӣ" бармегардонад
        else setNavState({ tab, studying: false });
        return;
      }
      const s: HState = { zd: 1, tab, studying: false };
      if (cur.tab === 'home') history.pushState(s, '');
      else history.replaceState(s, '');
      setNavState({ tab, studying: false });
    },
    [ensureStack],
  );

  const openStudy = useCallback(() => {
    const cur = navRef.current;
    if (isWeb) {
      ensureStack();
      history.pushState({ zd: 1, tab: cur.tab, studying: true } satisfies HState, '');
    }
    setNavState({ tab: cur.tab, studying: true });
  }, [ensureStack]);

  const closeStudy = useCallback(() => {
    if (isWeb && stackReady.current) history.back(); // popstate ҳолатро барқарор мекунад
    else setNavState({ tab: navRef.current.tab, studying: false });
  }, []);

  const cancelExit = useCallback(() => {
    if (isWeb) history.go(1); // ба вуруди "асосӣ" бармегардем
    setExitOpen(false);
  }, []);

  /**
   * Баромад: (1) "Назад" ба саҳифаи пеш; (2) window.close() (дар PWA-и насбшуда кор мекунад);
   * (3) агар ҳеҷ кадом кор накард (таби браузер бе таърих) — экрани «Барнома баста шуд».
   */
  const confirmExit = useCallback(() => {
    if (!isWeb) return;
    let left = false;
    const mark = () => {
      left = true;
    };
    window.addEventListener('pagehide', mark, { once: true });
    document.addEventListener('visibilitychange', () => document.hidden && mark(), { once: true });
    history.back();
    setTimeout(() => {
      if (left) return;
      window.close();
      setTimeout(() => {
        if (!left) setExited(true);
      }, 300);
    }, 300);
  }, []);

  const reopen = useCallback(() => {
    setExited(false);
    setExitOpen(false);
    if (isWeb) history.go(1);
  }, []);

  return { ...nav, exitOpen, exited, goTab, openStudy, closeStudy, cancelExit, confirmExit, reopen };
}
