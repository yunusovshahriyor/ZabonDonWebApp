import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { TabKey } from './components/BottomNav';

export type Nav = { tab: TabKey; studying: boolean };

type HState = { zd: 1; tab: TabKey; studying: boolean } | { zd: 'exit' };

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
const depthOf = (n: Nav) => (n.tab !== 'home' ? 1 : 0) + (n.studying ? 1 : 0);
const HOME: HState = { zd: 1, tab: 'home', studying: false };

/** Чанд сония тоаст намоён мемонад; дар ин вақт "Назад"-и дуюм барномаро мебарорад. */
export const EXIT_TOAST_MS = 3000;

/**
 * Навигатсия бо History API, то тугмаи "Назад"-и телефон/браузер кор кунад:
 *  • дар саҳифаҳои дигар — як қадам ба қафо (омӯзиш → саҳифаи пештара → асосӣ);
 *  • дар саҳифаи асосӣ — тоасти «Барои баромад "Назад"-ро боз пахш кунед» (3 сония).
 *    Агар дар ин муддат "Назад" боз пахш шавад — барнома мебарояд; вагарна тоаст нест мешавад
 *    ва "Назад"-и навбатӣ боз тоастро нишон медиҳад.
 *
 * Стек: [сентинел "exit"] → [асосӣ] → [таб] → [омӯзиш]. Сентинел ва "асосӣ" танҳо бо аввалин ламс сохта мешаванд:
 * Chrome вуруди таърихеро, ки бе амали корбар илова шудааст, ҳангоми "Назад" мегузаронад.
 * "Назад"-и аввал дар "асосӣ" ба сентинел меояд (тоаст); "Назад"-и дуюм аз сентинел мебарояд (дар PWA — аз барнома).
 * Агар вақт гузашт, ба "асосӣ" бармегардем (history.go(1)).
 * Пас аз навсозии саҳифа стек ва ҳолат аз history.state барқарор мешаванд.
 */
export function useNav() {
  const [nav, setNavState] = useState<Nav>(() => {
    const st = isWeb ? (history.state as HState | null) : null;
    return st && st.zd === 1 ? { tab: st.tab, studying: st.studying } : { tab: 'home', studying: false };
  });
  const [toast, setToast] = useState(false);
  const navRef = useRef(nav);
  navRef.current = nav;
  // Агар навсозӣ дар миёнаи стек бошад, стек аллакай ҳаст.
  const stackReady = useRef(isWeb && (history.state as HState | null)?.zd === 1);
  const atSentinel = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ensureStack = useCallback(() => {
    if (!isWeb || stackReady.current) return;
    stackReady.current = true;
    history.replaceState({ zd: 'exit' } satisfies HState, '');
    history.pushState(HOME, '');
  }, []);

  const clearToast = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    atSentinel.current = false;
    setToast(false);
  }, []);

  useEffect(() => {
    if (!isWeb) return;
    // Аввалин ламс: стекро месозад (бояд дар доираи амали корбар бошад).
    const onFirstTouch = () => ensureStack();
    window.addEventListener('pointerup', onFirstTouch, { once: true, capture: true });
    const onPop = (e: PopStateEvent) => {
      const st = e.state as HState | null;
      if (st?.zd === 'exit') {
        // "Назад"-и аввал дар саҳифаи асосӣ: тоаст; "Назад"-и дуюм аз сентинел мебарояд.
        atSentinel.current = true;
        setToast(true);
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          timer.current = null;
          if (!atSentinel.current) return;
          atSentinel.current = false;
          setToast(false);
          history.go(1); // ба вуруди "асосӣ" бармегардем
        }, EXIT_TOAST_MS);
      } else if (st?.zd === 1) {
        clearToast();
        setNavState({ tab: st.tab, studying: st.studying });
      }
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('pointerup', onFirstTouch, true);
      window.removeEventListener('popstate', onPop);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ensureStack, clearToast]);

  // Агар корбар ҳангоми тоаст ба ҷое равад (дар сентинел меистем), вуруди "асосӣ"-ро аз нав месозем.
  const leaveSentinel = useCallback(() => {
    if (!isWeb || !atSentinel.current) return;
    clearToast();
    history.pushState(HOME, '');
  }, [clearToast]);

  const goTab = useCallback(
    (tab: TabKey) => {
      const cur = navRef.current;
      if (tab === cur.tab) return;
      if (!isWeb) return setNavState({ tab, studying: false });
      ensureStack();
      leaveSentinel();
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
    [ensureStack, leaveSentinel],
  );

  const openStudy = useCallback(() => {
    const cur = navRef.current;
    if (isWeb) {
      ensureStack();
      leaveSentinel();
      history.pushState({ zd: 1, tab: cur.tab, studying: true } satisfies HState, '');
    }
    setNavState({ tab: cur.tab, studying: true });
  }, [ensureStack, leaveSentinel]);

  const closeStudy = useCallback(() => {
    if (isWeb && stackReady.current) history.back(); // popstate ҳолатро барқарор мекунад
    else setNavState({ tab: navRef.current.tab, studying: false });
  }, []);

  return { ...nav, toast, goTab, openStudy, closeStudy };
}
