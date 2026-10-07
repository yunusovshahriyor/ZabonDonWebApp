// Системаи дизайн: фони мулоими мятӣ, кортҳои сафеди калон, акценти сабз.
export const colors = {
  text: '#13251C', // графити сабзтоб
  textSecondary: '#6E7C74',
  textTertiary: '#9AA69F',
  green: '#1E7F55', // акценти асосӣ
  greenDark: '#0F5A3A',
  greenSoft: '#DCEBE2', // доираи иконаҳо / чипи фаъол
  greenLine: '#9CCBB0',
  card: 'rgba(255, 255, 255, 0.78)',
  cardSolid: '#FFFFFF',
  hairline: 'rgba(19, 37, 28, 0.08)',
  track: 'rgba(19, 37, 28, 0.08)',
  coinOuter: '#F59E0B',
  coinInner: '#FCD34D',
  coinDetail: '#B45309',
  navBg: 'rgba(255, 255, 255, 0.9)',
  navInactive: '#6E7C74',
  pageBgCss:
    'radial-gradient(60% 40% at 15% 8%, #CDE6D7 0%, rgba(205,230,215,0) 100%),' +
    'radial-gradient(55% 35% at 90% 30%, #D5E9CF 0%, rgba(213,233,207,0) 100%),' +
    'radial-gradient(70% 40% at 0% 80%, #DCE8F0 0%, rgba(220,232,240,0) 100%),' +
    '#F2F5F0',
};

export const radius = { card: 22, tile: 18, pill: 999 };

export const softShadow = { boxShadow: '0px 10px 30px rgba(18, 52, 36, 0.06)' };

// Эффекти "шиша" барои кортҳо (веб)
export const glass = {
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
} as object;
