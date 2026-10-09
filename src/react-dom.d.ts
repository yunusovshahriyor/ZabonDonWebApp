// Тип барои react-dom (тавассути react-native-web дастрас аст): танҳо createPortal истифода мешавад.
declare module 'react-dom' {
  import type { ReactNode, ReactPortal } from 'react';
  export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: string | null): ReactPortal;
}
