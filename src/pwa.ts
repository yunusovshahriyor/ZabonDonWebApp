import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

// Рӯйдоди насби браузер (Chrome/Edge/Android). Бояд аз оғоз гирифта шавад, барои ҳамин дар сатҳи модул гӯш мекунем.
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';

if (isWeb) {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/** manifest, иконаи Apple, service worker — яке аз оғози барнома даъват мешавад. */
export function setupPwa() {
  if (!isWeb) return;
  const head = document.head;
  const add = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    head.appendChild(el);
  };
  // Роҳҳои нисбӣ: сайт дар зерроҳ (/ZabonDonWebApp/) хизмат мешавад.
  add('link', { rel: 'manifest', href: 'manifest.webmanifest' });
  add('link', { rel: 'apple-touch-icon', href: 'apple-touch-icon.png' });
  add('meta', { name: 'theme-color', content: '#1E7F55' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'ZabonDon' });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {
      /* service worker дастнорас аст (масалан, бе HTTPS) */
    });
  }
}

const isStandalone = () =>
  isWeb && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

const isIOS = () => isWeb && /iphone|ipad|ipod/i.test(navigator.userAgent);

export type InstallState = {
  /** Барнома аллакай насб шудааст (ё аз экрани асосӣ кушода шудааст). */
  installed: boolean;
  /** Браузер насби бевоситаро дастгирӣ мекунад (тугмаи "Насб кардан"). */
  canPrompt: boolean;
  /** iPhone/iPad: насб танҳо тавассути менюи Safari. */
  ios: boolean;
  install: () => Promise<void>;
};

export function useInstall(): InstallState {
  const [, force] = useState(0);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return {
    installed: isStandalone(),
    canPrompt: deferred !== null,
    ios: isIOS(),
    install: async () => {
      if (!deferred) return;
      const ev = deferred;
      deferred = null; // рӯйдодро танҳо як бор истифода бурдан мумкин аст
      notify();
      await ev.prompt();
      await ev.userChoice;
    },
  };
}
