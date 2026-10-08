import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { TabKey } from './components/BottomNav';

/** category — категорияи кушодашуда дар «Луғатҳо»; studyCategory — омӯзиши ҳамон категория (бе он — омӯзиши умумӣ). */
export type Nav = { tab: TabKey; studying: boolean; category: string | null; studyCategory?: string };

type HState = { zd: 1; tab: TabKey; studying: boolean; cat?: string | null; sc?: string } | { zd: 'exit' };

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
const HOME: HState = { zd: 1, tab: 'home', studying: false, cat: null };

/** Чанд сония тоаст намоён мемонад; дар ин вақт "Назад"-и дуюм барномаро мебарорад. */
export const EXIT_TOAST_MS = 3000;

const depthOf = (n: Nav) => (n.tab !== 'home' ? 1 : 0) + (n.category ? 1 : 0) + (n.studying ? 1 : 0);
const fromState = (st: Extract<HState, { zd: 1 }>): Nav => ({ tab: st.tab, studying: st.studying, category: st.cat ?? null, studyCategory: st.sc });

/**
 * Навигатсия бо History API, то тугмаи "Назад"-и телефон/браузер кор кунад:
 *  • дар саҳифаҳои дигар — як қадам ба қафо (омӯзиш → саҳифаи пештара → асосӣ);
 *  • дар саҳифаи асосӣ — тоасти «Барои баромад "Назад"-ро боз пахш кунед» (3 сония): агар дар ин муддат
 *    "Назад" боз пахш шавад — барнома мебарояд; вагарна тоаст нест мешавад ва "Назад"-и навбатӣ боз тоастро нишон медиҳад.
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
    return st && st.zd === 1 ? fromState(st) : { tab: 'home', studying: false, category: null };
  });
  const [toast, setToast] = useState(false);
  const navRef = useRef(nav);
  navRef.current = nav;
  const afterPop = useRef<(() => void) | null>(null);
  const atSentinel = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Агар навсозӣ дар миёнаи стек бошад, стек аллакай ҳаст.
  const stackReady = useRef(isWeb && (history.state as HState | null)?.zd === 1);

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

  // Агар корбар ҳангоми тоаст ба ҷое равад (дар сентинел меистем), вуруди "асосӣ"-ро аз нав месозем.
  const leaveSentinel = useCallback(() => {
    if (!isWeb || !atSentinel.current) return;
    clearToast();
    history.pushState(HOME, '');
  }, [clearToast]);

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
        const next = fromState(st);
        const after = afterPop.current;
        afterPop.current = null;
        if (after) after(); // гузариш ба таби дигар аз категория: пас аз бозгашт ҳолати нав ҷойгир мешавад
        else setNavState(next);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('pointerup', onFirstTouch, true);
      window.removeEventListener('popstate', onPop);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ensureStack, clearToast]);

  const goTab = useCallback(
    (tab: TabKey) => {
      const cur = navRef.current;
      if (tab === cur.tab) {
        // Пахши такрории «Луғатҳо» дар дохили категория — ба рӯйхати категорияҳо
        if (tab === 'dict' && cur.category) closeCategory();
        return;
      }
      const fresh: Nav = { tab, studying: false, category: null };
      if (!isWeb) return setNavState(fresh);
      ensureStack();
      leaveSentinel();
      if (tab === 'home') {
        const d = depthOf(cur);
        if (d > 0) history.go(-d); // popstate ҳолатро ба "асосӣ" бармегардонад
        else setNavState(fresh);
        return;
      }
      const s: HState = { zd: 1, tab, studying: false, cat: null };
      if (cur.tab === 'home') {
        history.pushState(s, '');
        setNavState(fresh);
      } else if (depthOf(cur) === 1) {
        history.replaceState(s, '');
        setNavState(fresh);
      } else {
        // Аз категория ба таби дигар: аввал ба қабати таб бармегардем, баъд онро иваз мекунем.
        afterPop.current = () => {
          history.replaceState(s, '');
          setNavState(fresh);
        };
        history.go(-(depthOf(cur) - 1));
      }
    },
    [ensureStack, leaveSentinel],
  );

  const openCategory = useCallback(
    (id: string) => {
      const cur = navRef.current;
      if (isWeb) {
        ensureStack();
        leaveSentinel();
        history.pushState({ zd: 1, tab: cur.tab, studying: false, cat: id } satisfies HState, '');
      }
      setNavState({ tab: cur.tab, studying: false, category: id });
    },
    [ensureStack, leaveSentinel],
  );

  const closeCategory = useCallback(() => {
    if (isWeb && stackReady.current) history.back();
    else setNavState({ tab: navRef.current.tab, studying: false, category: null });
  }, []);

  const openStudy = useCallback(
    (categoryId?: string) => {
      const cur = navRef.current;
      if (isWeb) {
        ensureStack();
        leaveSentinel();
        history.pushState({ zd: 1, tab: cur.tab, studying: true, cat: cur.category, sc: categoryId } satisfies HState, '');
      }
      setNavState({ tab: cur.tab, studying: true, category: cur.category, studyCategory: categoryId });
    },
    [ensureStack, leaveSentinel],
  );

  const closeStudy = useCallback(() => {
    if (isWeb && stackReady.current) history.back(); // popstate ҳолатро барқарор мекунад
    else setNavState({ ...navRef.current, studying: false, studyCategory: undefined });
  }, []);

  return { ...nav, toast, goTab, openStudy, closeStudy, openCategory, closeCategory };
}
