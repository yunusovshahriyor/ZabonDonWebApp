import { useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Tap } from '../components/Tap';
import { WordThumb } from '../components/WordThumb';
import { Category, getAllWords, getWordsByCategory, retryLoadContent, useContent } from '../content';
import { statusOf, useProgress } from '../data';
import { t } from '../strings';
import { colors, glass, softShadow } from '../theme';

/** Акси категория (аз база); агар набошад — ҳарфи аввал. */
function CatImage({ category }: { category: Category }) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={s.catImage}>
      {category.imageUrl && !failed ? (
        <Image source={{ uri: category.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <Text style={s.catLetter}>{category.titleTg.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}

function CategoryCard({ category, onOpen }: { category: Category; onOpen: (id: string) => void }) {
  const words = getWordsByCategory(category.id);
  const known = words.filter((w) => statusOf(w.id) === 'known').length;
  return (
    <Tap style={[s.card, softShadow, glass]} onPress={() => onOpen(category.id)}>
      <CatImage category={category} />
      {category.isPremium ? (
        <View style={s.lock}>
          <Icon name="lock" size={14} color="#fff" strokeWidth={2.2} />
        </View>
      ) : null}
      <View style={{ padding: 10 }}>
        <Text style={s.catTitle} numberOfLines={2}>
          {category.titleTg || category.titleRu}
        </Text>
        {category.titleRu && category.titleTg ? (
          <Text style={s.catSub} numberOfLines={1}>
            {category.titleRu}
          </Text>
        ) : null}
        <View style={s.catMeta}>
          <Text style={s.catCount}>{t.wordsCount(words.length)}</Text>
          {known > 0 ? <Text style={s.catKnown}>{known}/{words.length}</Text> : null}
        </View>
        {words.length > 0 ? (
          <View style={s.miniTrack}>
            <View style={[s.miniFill, { width: `${(known / words.length) * 100}%` }]} />
          </View>
        ) : null}
      </View>
    </Tap>
  );
}

/** Менюи "Луғатҳо": категорияҳо аз Firestore, гурӯҳбандӣ аз рӯи сатҳ, ҷустуҷӯ дар категорияҳо ва калимаҳо. */
export function DictionariesScreen({ onOpen, onBack }: { onOpen: (categoryId: string) => void; onBack?: () => void }) {
  useProgress();
  const { status, categories } = useContent();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  const levels = useMemo(() => {
    const map = new Map<number, Category[]>();
    for (const c of categories) {
      const arr = map.get(c.level) ?? [];
      arr.push(c);
      map.set(c.level, arr);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [categories]);

  const foundCategories = q
    ? categories.filter((c) => c.titleTg.toLowerCase().includes(q) || c.titleRu.toLowerCase().includes(q))
    : [];
  const foundWords = q
    ? getAllWords()
        .filter((w) => w.ru.toLowerCase().includes(q) || w.tj.toLowerCase().includes(q))
        .slice(0, 40)
    : [];

  return (
    <View style={{ flex: 1 }}>
      <View style={s.head}>
        {onBack ? (
          <Tap style={s.back} onPress={onBack}>
            <Icon name="back" size={22} color={colors.text} strokeWidth={2.2} />
          </Tap>
        ) : null}
        <Text style={s.title}>{t.catalog}</Text>
        <View style={s.countChip}>
          <Text style={s.countText}>{categories.length}</Text>
        </View>
      </View>

      <View style={[s.search, glass]}>
        <Icon name="search" size={18} color={colors.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t.searchWords}
          placeholderTextColor={colors.textTertiary}
          style={s.searchInput}
        />
        {query ? (
          <Tap onPress={() => setQuery('')}>
            <Icon name="close" size={18} color={colors.textTertiary} />
          </Tap>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {status === 'loading' && categories.length === 0 ? <Text style={s.info}>{t.loading}</Text> : null}
        {status === 'error' && categories.length === 0 ? (
          <View style={{ alignItems: 'center', gap: 14, marginTop: 30 }}>
            <Text style={s.info}>{t.loadError}</Text>
            <Tap style={s.retry} onPress={retryLoadContent}>
              <Text style={s.retryText}>{t.retry}</Text>
            </Tap>
          </View>
        ) : null}

        {q ? (
          <>
            {foundCategories.length === 0 && foundWords.length === 0 ? <Text style={s.info}>{t.notFound}</Text> : null}
            {foundCategories.length > 0 ? (
              <View style={s.grid}>
                {foundCategories.map((c) => (
                  <CategoryCard key={c.id} category={c} onOpen={onOpen} />
                ))}
              </View>
            ) : null}
            {foundWords.map((w) => (
              <Tap key={w.id} style={[s.wordRow, glass]} onPress={() => onOpen(w.categoryId)}>
                <WordThumb image={w.image} letter={w.ru} size={44} radius={12} />
                <View style={{ flex: 1 }}>
                  <Text style={s.wordRu}>{w.ru}</Text>
                  <Text style={s.wordTj}>{w.tj}</Text>
                </View>
                <Icon name="chevron" size={18} color={colors.textTertiary} />
              </Tap>
            ))}
          </>
        ) : (
          levels.map(([level, list]) => (
            <View key={level} style={{ marginBottom: 18 }}>
              {level > 0 ? (
                <View style={s.levelHead}>
                  <Text style={s.levelLabel}>{t.levelLabel(level)}</Text>
                  <Text style={s.levelTitle}>{t.levelTitle[level]}</Text>
                  <Text style={s.levelSub}>{t.levelSub[level]}</Text>
                </View>
              ) : null}
              <View style={s.grid}>
                {list.map((c) => (
                  <CategoryCard key={c.id} category={c} onOpen={onOpen} />
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 18 },
  back: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.85)', borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  countChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.greenSoft },
  countText: { fontSize: 13, fontWeight: '800', color: colors.green },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 44,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  searchInput: { flex: 1, height: '100%', fontSize: 14, color: colors.text, ...({ outlineStyle: 'none' } as object) },
  info: { textAlign: 'center', fontSize: 15, color: colors.textSecondary, marginTop: 30 },
  retry: { paddingHorizontal: 22, height: 42, borderRadius: 21, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  retryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  levelHead: { marginBottom: 10, paddingHorizontal: 2 },
  levelLabel: { fontSize: 11, fontWeight: '800', color: colors.green, letterSpacing: 0.8 },
  levelTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 1 },
  levelSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47.6%', borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', overflow: 'hidden' },
  catImage: { height: 92, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  catLetter: { fontSize: 36, fontWeight: '800', color: colors.green },
  lock: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(19,37,28,0.6)', alignItems: 'center', justifyContent: 'center' },
  catTitle: { fontSize: 14, fontWeight: '800', color: colors.text, lineHeight: 18 },
  catSub: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  catMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  catCount: { fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  catKnown: { fontSize: 11, fontWeight: '800', color: colors.green },
  miniTrack: { height: 4, borderRadius: 2, backgroundColor: colors.track, marginTop: 6, overflow: 'hidden' },
  miniFill: { height: 4, borderRadius: 2, backgroundColor: colors.green },
  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    marginTop: 10,
    borderRadius: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  wordRu: { fontSize: 16, fontWeight: '800', color: colors.text },
  wordTj: { fontSize: 14, fontWeight: '600', color: colors.green, marginTop: 1 },
});
