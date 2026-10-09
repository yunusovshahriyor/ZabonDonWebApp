import { useSyncExternalStore } from 'react';
import { t } from './strings';

// Воридшавӣ тавассути Firebase Authentication (REST, бе SDK): почта + парол.
// Калиди API-и веб (Web API key) махфӣ нест; он аз `EXPO_PUBLIC_FIREBASE_API_KEY` гирифта мешавад (ҳангоми сохтан).
// Бояд дар Firebase Console → Authentication → Sign-in method «Email/Password» фаъол шуда бошад.
export const API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '';
export const authConfigured = API_KEY.length > 0;

export type AuthUser = { uid: string; email: string; name: string };
type Stored = { user: AuthUser; idToken: string; refreshToken: string };

const KEY = 'zabondon_auth_v1';
let current: Stored | null = load();
let version = 0;
const listeners = new Set<() => void>();

function load(): Stored | null {
  try {
    const raw = localStorage.getItem(KEY);
    const s = raw ? (JSON.parse(raw) as Stored) : null;
    return s?.user?.uid ? s : null;
  } catch {
    return null;
  }
}

function persist(next: Stored | null) {
  current = next;
  version += 1;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    /* localStorage дастнорас аст */
  }
  listeners.forEach((l) => l());
}

/** Корбари ҷорӣ (null — ворид нашудааст); компонентро ҳангоми тағйир аз нав мекашад. */
export function useAuth(): AuthUser | null {
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => version,
  );
  return current?.user ?? null;
}

/** Токени ҷорӣ (барои дархостҳои минбаъдаи муҳофизатшуда ба Firestore). */
export const getIdToken = () => current?.idToken ?? null;

export class AuthError extends Error {
  constructor(public code: string) {
    super(code);
  }
}

async function call<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  if (!authConfigured) throw new AuthError('NOT_CONFIGURED');
  let res: Response;
  try {
    res = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('NETWORK');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Шакли паём: "WEAK_PASSWORD : Password should be at least 6 characters" — танҳо рамзро мегирем.
    const code = String(json?.error?.message ?? 'UNKNOWN').split(' ')[0];
    throw new AuthError(code);
  }
  return json as T;
}

type SignResp = { localId: string; email: string; displayName?: string; idToken: string; refreshToken: string };

export async function signIn(email: string, password: string) {
  const r = await call<SignResp>('accounts:signInWithPassword', { email, password, returnSecureToken: true });
  persist({ user: { uid: r.localId, email: r.email, name: r.displayName ?? '' }, idToken: r.idToken, refreshToken: r.refreshToken });
}

export async function signUp(name: string, email: string, password: string) {
  const r = await call<SignResp>('accounts:signUp', { email, password, returnSecureToken: true });
  let displayName = '';
  try {
    await call('accounts:update', { idToken: r.idToken, displayName: name, returnSecureToken: false });
    displayName = name;
  } catch {
    /* ном захира нашуд — ҳисоб сохта шуд, ном баъдтар иваз мешавад */
  }
  persist({ user: { uid: r.localId, email: r.email, name: displayName }, idToken: r.idToken, refreshToken: r.refreshToken });
}

export async function resetPassword(email: string) {
  await call('accounts:sendOobCode', { requestType: 'PASSWORD_RESET', email });
}

export function signOut() {
  persist(null);
}

/** Паёми хато ба тоҷикӣ. */
export function authErrorMessage(e: unknown): string {
  const code = e instanceof AuthError ? e.code : 'UNKNOWN';
  switch (code) {
    case 'NOT_CONFIGURED':
      return t.authErrNotConfigured;
    case 'NETWORK':
      return t.authErrNetwork;
    case 'EMAIL_EXISTS':
      return t.authErrEmailExists;
    case 'INVALID_EMAIL':
      return t.authErrInvalidEmail;
    case 'WEAK_PASSWORD':
      return t.authErrWeakPassword;
    case 'EMAIL_NOT_FOUND':
    case 'INVALID_PASSWORD':
    case 'INVALID_LOGIN_CREDENTIALS':
      return t.authErrCredentials;
    case 'USER_DISABLED':
      return t.authErrDisabled;
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return t.authErrTooMany;
    case 'OPERATION_NOT_ALLOWED':
      return t.authErrNotAllowed;
    default:
      return t.authErrUnknown;
  }
}
