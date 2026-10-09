import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle, useWindowDimensions } from 'react-native';
import { PullToRefresh } from '../components/PullToRefresh';
import { Tap } from '../components/Tap';
import { demo, scenarios, setDailyGoal, useProgress } from '../data';
import { Coin } from '../components/Coin';
import { GoalDialog } from '../components/GoalDialog';
import { WordThumb } from '../components/WordThumb';
import { getCategory, getWordsByCategory, useContent } from '../content';
import { searchContent } from '../search';
import { Icon, IconName } from '../components/Icon';
import { t } from '../strings';
import { colors, glass, radius, softShadow } from '../theme';

const PAD = 16; // як padding-и ягона дар тамоми саҳифа
const GAP = 12;

/** Корти калони шишагӣ бо радиуси 28. */
function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function IconCircle({ name, size = 52, color = colors.green }: { name: IconName; size?: number; color?: string }) {
  return (
    <View style={[styles.iconCircle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Icon name={name} size={size * 0.46} color={color} />
    </View>
  );
}

function SectionTitle({ title, action }: { title: string; action?: string }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        <Tap>
          <Text style={styles.sectionAction}>{action}</Text>
        </Tap>
      ) : null}
    </View>
  );
}

function RuFlag() {
  return (
    <View style={styles.flag}>
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />
      <View style={{ flex: 1, backgroundColor: '#0039A6' }} />
      <View style={{ flex: 1, backgroundColor: '#D52B1E' }} />
    </View>
  );
}

function Header({ onSearch }: { onSearch: () => void }) {
  return (
    <View style={{ paddingHorizontal: PAD, paddingTop: 16 }}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.logo}>
            {t.appName}
            <Text style={{ color: colors.green }}>.</Text>
          </Text>
          <Text style={styles.tagline}>{t.tagline}</Text>
        </View>
        <Tap style={styles.roundBtn} onPress={onSearch}>
          <Icon name="search" size={20} color={colors.text} />
        </Tap>
      </View>

      <View style={styles.statusPill}>
        <Tap style={[styles.seg, styles.segActive]}>
          <RuFlag />
        </Tap>
        <Tap style={styles.seg}>
          <Icon name="flame" size={18} color="#E2572B" />
          <Text style={styles.segText}>{demo.streak}</Text>
        </Tap>
        <Tap style={[styles.seg, { flex: 1.5 }]}>
          <Coin size={20} />
          <Text style={styles.segText}>{demo.coins}</Text>
        </Tap>
      </View>
    </View>
  );
}

/** Навори ҷустуҷӯ: «×» ҳамеша намоён аст; агар матн бошад — онро пок мекунад, агар холӣ бошад — ҷустуҷӯро мепӯшад. */
function SearchBar({ value, onChange, onClose }: { value: string; onChange: (v: string) => void; onClose: () => void }) {
  const ref = useRef<TextInput>(null);
  return (
    <Card style={{ marginHorizontal: PAD, marginTop: 12, borderRadius: 999 }}>
      <View style={styles.searchRow}>
        <Icon name="search" size={20} color={colors.textSecondary} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChange}
          placeholder={t.searchPlaceholder}
          placeholderTextColor={colors.textTertiary}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
          autoFocus={!value}
        />
        <Tap
          onPress={() => {
            if (value) {
              onChange('');
              ref.current?.focus();
            } else onClose();
          }}
          style={styles.searchClear}
          accessibilityRole="button"
          accessibilityLabel={value ? t.searchClear : t.searchClose}
        >
          <Icon name="close" size={20} color={colors.textSecondary} />
        </Tap>
      </View>
    </Card>
  );
}

function Ring({ progress, size = 112, stroke = 10 }: { progress: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const m = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={m} cy={m} r={r} stroke={colors.track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={m}
          cy={m}
          r={r}
          stroke={colors.green}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * progress} ${c}`}
          transform={`rotate(-90 ${m} ${m})`}
        />
      </Svg>
      <Text style={styles.ringNum}>{demo.daily}</Text>
      <Text style={styles.ringOf}>
        / {demo.goal} {t.word.toLowerCase()}
      </Text>
    </View>
  );
}

function StatRow({ icon, tint, bg, value, label, last }: { icon: IconName; tint: string; bg: string; value: number; label: string; last?: boolean }) {
  return (
    <View style={[styles.statRow, !last && styles.statRowLine]}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Icon name={icon} size={16} color={tint} />
      </View>
      <Text style={styles.statRowLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.statRowValue}>{value}</Text>
    </View>
  );
}

/** Ҳадафи рӯз: ҳалқа + рӯйхати омор дар як корт. */
function GoalCard({ onEdit }: { onEdit?: () => void }) {
  const pct = Math.min(100, Math.round((demo.daily / demo.goal) * 100));
  return (
    <Card style={{ marginHorizontal: PAD, marginTop: 16, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={styles.goalLabel}>{t.studiedToday}</Text>
        </View>
        <View style={styles.pctChip}>
          <Icon name="target" size={13} color={colors.green} />
          <Text style={styles.pctText}>{pct}%</Text>
        </View>
        <Tap style={[styles.roundBtn, { width: 32, height: 32, borderRadius: 16, marginLeft: 8 }]} onPress={onEdit} accessibilityLabel={t.goalTitle}>
          <Icon name="edit" size={15} color={colors.text} />
        </Tap>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 }}>
        <Ring progress={Math.min(1, demo.daily / demo.goal)} />
        <View style={{ flex: 1 }}>
          <StatRow icon="book" tint="#1E7F55" bg="#DCEBE2" value={demo.total} label={t.needLearn} />
          <StatRow icon="repeat" tint="#B96A00" bg="#FBEBCB" value={demo.repeat} label={t.needRepeat} />
          <StatRow icon="award" tint="#2F6FD6" bg="#DCE8FA" value={demo.learned} label={t.learned} last />
        </View>
      </View>
    </Card>
  );
}

function PrimaryButton({ label, icon, onPress }: { label: string; icon: IconName; onPress?: () => void }) {
  return (
    <Tap style={styles.cta} onPress={onPress}>
      <Text style={styles.ctaText}>{label}</Text>
      <Icon name={icon} size={20} color="#fff" />
    </Tap>
  );
}

/** Тугмаи каталог: градиенти мулоим, иконаи китоб, матн бо тақсимоти мутавозин ва тугмаи сабзи «→». Ба ҳамаи андозаҳои экран мутобиқ. */
function CatalogHint({ onPress }: { onPress?: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 350; // телефонҳои хурд (≈320px): андозаҳои каме хурдтар
  return (
    <Tap onPress={onPress}>
      <LinearGradient
        colors={['#E1F0E6', 'rgba(255,255,255,0.92)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hint, compact && styles.hintCompact]}
      >
        <View style={[styles.hintIcon, compact && { width: 40, height: 40, borderRadius: 20 }]}>
          <Icon name="book" size={compact ? 20 : 22} color={colors.green} />
        </View>
        <Text style={[styles.hintText, compact && { fontSize: 14, lineHeight: 19 }]} numberOfLines={2}>
          {t.catalogHint}
        </Text>
        <View style={styles.hintGo}>
          <Icon name="arrow" size={16} color="#fff" strokeWidth={2.4} />
        </View>
      </LinearGradient>
    </Tap>
  );
}

function AiLearnCard() {
  return (
    <Card style={{ padding: 16 }}>
      <View style={styles.badge}>
        <Icon name="sparkle" size={14} color={colors.green} />
        <Text style={styles.badgeText}>{t.aiBadge}</Text>
      </View>
      <View style={[styles.sectionRow, { marginTop: 12, marginBottom: 2, paddingHorizontal: 0 }]}>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>{t.scenariosTitle}</Text>
        <Tap>
          <Text style={styles.sectionAction}>{t.seeAll}</Text>
        </Tap>
      </View>
      {scenarios.map((s, i) => (
        <View key={s.label}>
          {i > 0 ? <View style={styles.rowDivider} /> : null}
          <Tap style={styles.listRow}>
            <IconCircle name={s.icon} size={40} />
            <Text style={styles.listTitle}>{s.label}</Text>
            <Icon name="chevron" size={20} color={colors.textTertiary} />
          </Tap>
        </View>
      ))}
    </Card>
  );
}

function Tile({ icon, title, sub }: { icon: IconName; title: string; sub?: string }) {
  return (
    <Tap style={[styles.card, styles.tile]}>
      <IconCircle name={icon} size={40} />
      <Text style={styles.tileTitle}>{title}</Text>
      {sub ? <Text style={styles.tileSub}>{sub}</Text> : null}
    </Tap>
  );
}

function PhraseCard() {
  return (
    <Card style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[styles.sectionTitle, { flex: 1 }]}>{t.phraseTitle}</Text>
        <View style={styles.accBadge}>
          <Text style={styles.accText}>{t.accuracyEmpty}</Text>
        </View>
      </View>
      <Text style={styles.phraseSub}>{t.phraseSub}</Text>
      <View style={styles.phraseBox}>
        <View style={styles.phraseBar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.phraseRu}>{t.phraseRu}</Text>
          <Text style={styles.phraseTj}>{t.phraseTj}</Text>
        </View>
      </View>
      <View style={{ marginTop: 14 }}>
        <PrimaryButton label={t.study} icon="cap" />
      </View>
    </Card>
  );
}

function AchievementCard() {
  const a = demo.achievement;
  return (
    <Tap>
      <Card style={styles.achRow}>
        <IconCircle name="award" size={44} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.achTitle}>{t.nextAchievement}</Text>
          <View style={[styles.track, { marginTop: 8 }]}>
            <View style={[styles.trackFill, { width: `${(a.current / a.target) * 100}%` }]} />
          </View>
          <Text style={styles.achStatus}>{t.achievementStatus(a.current, a.target)}</Text>
        </View>
      </Card>
    </Tap>
  );
}

function PremiumBanner() {
  return (
    <LinearGradient
      colors={[colors.green, colors.greenDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.premium}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.premiumIcon}>
          <Icon name="star" size={26} color="#fff" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.premiumTitle}>{t.premiumTitle}</Text>
          <Text style={styles.premiumDesc}>{t.premiumDesc}</Text>
        </View>
      </View>
      <Tap style={styles.premiumBtn}>
        <Text style={styles.premiumBtnText}>{t.premiumBuy}</Text>
      </Tap>
    </LinearGradient>
  );
}

/** Натиҷаҳои ҷустуҷӯ дар саҳифаи асосӣ: категорияҳо ва калимаҳо (русӣ/тоҷикӣ); пахш категорияро мекушояд. */
function SearchResults({ query, onOpen }: { query: string; onOpen?: (categoryId: string) => void }) {
  const { status, categories: all } = useContent();
  const q = query.trim();
  if (!q) return <Text style={styles.searchInfo}>{t.searchHint}</Text>;
  if (all.length === 0) return <Text style={styles.searchInfo}>{status === 'error' ? t.loadError : t.loading}</Text>;
  const { categories, words } = searchContent(q);
  if (categories.length === 0 && words.length === 0) return <Text style={styles.searchInfo}>{t.notFound}</Text>;
  return (
    <View style={{ paddingHorizontal: PAD, marginTop: 14, gap: 8 }}>
      {categories.length > 0 ? <Text style={styles.resSection}>{t.searchSectionCategories}</Text> : null}
      {categories.map((c) => (
        <Tap key={c.id} onPress={() => onOpen?.(c.id)}>
          <Card style={styles.resRow}>
            <WordThumb image={c.imageUrl} letter={c.titleTg || c.titleRu} size={46} radius={13} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.resTitle} numberOfLines={1}>
                {c.titleTg || c.titleRu}
              </Text>
              <Text style={styles.resSub} numberOfLines={1}>
                {c.titleRu && c.titleTg ? `${c.titleRu} · ` : ''}
                {t.wordsCount(getWordsByCategory(c.id).length)}
              </Text>
            </View>
            <Icon name="chevron" size={18} color={colors.textTertiary} />
          </Card>
        </Tap>
      ))}
      {words.length > 0 ? <Text style={[styles.resSection, categories.length > 0 && { marginTop: 8 }]}>{t.searchSectionWords}</Text> : null}
      {words.map((w) => (
        <Tap key={w.id} onPress={() => onOpen?.(w.categoryId)}>
          <Card style={styles.resRow}>
            <WordThumb image={w.image} letter={w.ru} size={46} radius={13} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.resTitle} numberOfLines={1}>
                {w.ru}
              </Text>
              <Text style={styles.resSub} numberOfLines={1}>
                {w.tj}
                {getCategory(w.categoryId) ? ` · ${getCategory(w.categoryId)?.titleTg || getCategory(w.categoryId)?.titleRu}` : ''}
              </Text>
            </View>
            <Icon name="chevron" size={18} color={colors.textTertiary} />
          </Card>
        </Tap>
      ))}
    </View>
  );
}

let savedQuery = '';

type HomeProps = {
  onStudy?: () => void;
  onCatalog?: () => void;
  onOpenCategory?: (categoryId: string) => void;
  /** Ҷустуҷӯ кушода аст (дар таърихи навигатсия нигоҳ дошта мешавад: «Назад» онро мепӯшад). */
  search?: boolean;
  onOpenSearch?: () => void;
  onCloseSearch?: () => void;
};

export function HomeScreen({ onStudy, onCatalog, onOpenCategory, search = false, onOpenSearch, onCloseSearch }: HomeProps) {
  useProgress(); // аз нав кашидан ҳангоми тағйири пешравӣ
  // Матни ҷустуҷӯ пас аз бозгашт аз категория (асосӣ аз нав сохта мешавад) нигоҳ дошта мешавад;
  // кушода/пӯшида будани ҷустуҷӯ аз навигатсия меояд (`search`), то тугмаи «Назад» онро бибандад.
  const searchOpen = search;
  const [query, setQueryRaw] = useState(savedQuery);
  const setQuery = (v: string) => {
    savedQuery = v;
    setQueryRaw(v);
  };
  // Пӯшидани ҷустуҷӯ (бо ҳар роҳ, аз ҷумла «Назад») матнро пок мекунад.
  useEffect(() => {
    if (!search) setQuery('');
  }, [search]);
  const [goalOpen, setGoalOpen] = useState(false);
  return (
    <View style={styles.root}>
      <PullToRefresh style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <Header
          onSearch={() => (searchOpen ? onCloseSearch?.() : onOpenSearch?.())}
        />
        {searchOpen ? <SearchBar value={query} onChange={setQuery} onClose={() => onCloseSearch?.()} /> : null}
        {searchOpen ? (
          <SearchResults query={query} onOpen={onOpenCategory} />
        ) : (
          <>
          <GoalCard onEdit={() => setGoalOpen(true)} />
          <View style={{ paddingHorizontal: PAD, marginTop: GAP, gap: GAP }}>
            <PrimaryButton label={t.learnCta} icon="arrow" onPress={onStudy} />
            <CatalogHint onPress={onCatalog} />
            <AiLearnCard />
            <Text style={[styles.sectionTitle, { marginTop: 8, paddingHorizontal: 4 }]}>{t.trainings}</Text>
            <View style={{ flexDirection: 'row', gap: GAP }}>
              <Tile icon="laptop" title={t.trainVocab} />
              <Tile icon="repeat" title={t.quickTitle} sub={t.quickSub} />
            </View>
            <PhraseCard />
            <AchievementCard />
            <PremiumBanner />
          </View>
          </>
        )}
      </PullToRefresh>
      {/* Диалог берун аз PullToRefresh (transform ва backdrop-filter 'fixed'-ро вайрон мекунанд) */}
      <GoalDialog visible={goalOpen} current={demo.goal} onClose={() => setGoalOpen(false)} onSave={setDailyGoal} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 5, borderRadius: 3, backgroundColor: colors.track, marginTop: 6, overflow: 'hidden' },
  trackFill: { height: 5, borderRadius: 3, backgroundColor: colors.green },
  goalLabel: { fontSize: 14, color: colors.textSecondary },
  pctChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: colors.greenSoft },
  pctText: { fontSize: 13, fontWeight: '700', color: colors.green },
  ringNum: { fontSize: 38, fontWeight: '800', color: colors.text, letterSpacing: -1, lineHeight: 42 },
  ringOf: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  statRowLine: { borderBottomWidth: 1, borderBottomColor: colors.hairline },
  statIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  statRowLabel: { flex: 1, fontSize: 13, color: colors.textSecondary },
  statRowValue: { fontSize: 18, fontWeight: '700', color: colors.text },
  root: { flex: 1 },
  card: { backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...softShadow, ...glass },
  iconCircle: { backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  logo: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.6 },
  tagline: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 14,
    padding: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    ...glass,
  },
  seg: { flex: 1, height: 38, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  segActive: { backgroundColor: colors.greenSoft, borderWidth: 1.5, borderColor: colors.greenLine },
  segText: { fontSize: 15, fontWeight: '600', color: colors.text },
  flag: { width: 24, height: 16, borderRadius: 3, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairline },
  searchInfo: { textAlign: 'center', color: colors.textSecondary, fontSize: 14, marginTop: 28, paddingHorizontal: 32, lineHeight: 20 },
  resSection: { fontSize: 13, fontWeight: '800', color: colors.textSecondary, letterSpacing: 0.4, textTransform: 'uppercase', paddingHorizontal: 4 },
  resRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  resTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  resSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  searchClear: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  searchRow: { height: 46, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  searchInput: { flex: 1, height: '100%', marginLeft: 10, fontSize: 14, color: colors.text, outlineStyle: 'none' } as object,
  cta: {
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0px 6px 16px rgba(30, 127, 85, 0.25)',
  },
  ctaText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: 'rgba(30, 127, 85, 0.18)',
    ...softShadow,
  },
  hintCompact: { gap: 10, paddingHorizontal: 12, paddingVertical: 12, minHeight: 66 },
  hintIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 3px 10px rgba(30, 127, 85, 0.16)',
  },
  hintText: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    color: colors.text,
    letterSpacing: -0.1,
    ...({ textWrap: 'balance' } as object), // сатрҳо баробар тақсим мешаванд (на як калимаи танҳо дар сатри дуюм)
  },
  hintGo: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: colors.greenSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '700', color: colors.green, letterSpacing: 0.4 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, letterSpacing: -0.2 },
  sectionAction: { fontSize: 14, fontWeight: '600', color: colors.green },
  listRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 },
  listTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: colors.text },
  rowDivider: { height: 1, backgroundColor: colors.hairline, marginLeft: 52 },
  tile: { flex: 1, padding: 14, minHeight: 120 },
  tileTitle: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 12 },
  tileSub: { fontSize: 11, color: colors.textSecondary, marginTop: 4, lineHeight: 15 },
  accBadge: { borderRadius: 999, backgroundColor: colors.greenSoft, paddingHorizontal: 10, paddingVertical: 4 },
  accText: { fontSize: 12, fontWeight: '700', color: colors.green },
  phraseSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  phraseBox: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(220,235,226,0.55)',
  },
  phraseBar: { width: 3, borderRadius: 2, backgroundColor: colors.green },
  phraseRu: { fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 24 },
  phraseTj: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  achRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  achTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  achStatus: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  premium: { borderRadius: radius.card, padding: 16, boxShadow: '0px 10px 24px rgba(15, 90, 58, 0.22)' },
  premiumIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  premiumDesc: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 3, lineHeight: 16 },
  premiumBtn: {
    marginTop: 12,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBtnText: { fontSize: 14, fontWeight: '700', color: colors.greenDark },
});
