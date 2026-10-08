import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../components/Icon';
import { Tap } from '../components/Tap';
import { WordThumb } from '../components/WordThumb';
import { getCategory, getWordsByCategory, useContent } from '../content';
import { getSessionWords, statusOf, useProgress } from '../data';
import { t } from '../strings';
import { colors, glass, softShadow } from '../theme';
import { speak } from './study/common';

type Props = { categoryId: string; onBack: () => void; onStudy: (categoryId: string) => void };

/** Категория: калимаҳо аз база (расм, русӣ, тоҷикӣ, ҳолат) ва тугмаи "Омӯзиш" барои ҳамин категория. */
export function CategoryScreen({ categoryId, onBack, onStudy }: Props) {
  useProgress();
  useContent();
  const category = getCategory(categoryId);
  const words = getWordsByCategory(categoryId);
  const known = words.filter((w) => statusOf(w.id) === 'known').length;
  const remaining = getSessionWords(categoryId).length;
  const locked = !!category?.isPremium;

  return (
    <View style={{ flex: 1 }}>
      <View style={s.top}>
        <Tap style={s.back} onPress={onBack}>
          <Icon name="back" size={22} color={colors.text} strokeWidth={2.2} />
        </Tap>
        <View style={{ flex: 1 }}>
          <Text style={s.title} numberOfLines={1}>
            {category?.titleTg || category?.titleRu || categoryId}
          </Text>
          {category?.titleRu && category.titleTg ? (
            <Text style={s.sub} numberOfLines={1}>
              {category.titleRu} · {t.wordsCount(words.length)}
            </Text>
          ) : (
            <Text style={s.sub}>{t.wordsCount(words.length)}</Text>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {locked ? (
          <View style={[s.lockedBox, softShadow, glass]}>
            <View style={s.lockIcon}>
              <Icon name="lock" size={28} color={colors.green} strokeWidth={2} />
            </View>
            <Text style={s.lockedTitle}>{t.premiumLocked}</Text>
            <Text style={s.lockedSub}>{t.premiumLockedSub}</Text>
          </View>
        ) : (
          <>
            {/* Пешрафт ва тугмаи омӯзиш */}
            <View style={[s.progressCard, softShadow, glass]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={s.progressText}>
                  {t.statusKnown}: {known}/{words.length}
                </Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${words.length ? (known / words.length) * 100 : 0}%` }]} />
              </View>
              <Tap style={[s.studyBtn, remaining === 0 && { opacity: 0.45 }]} onPress={remaining > 0 ? () => onStudy(categoryId) : undefined}>
                <Icon name="cap" size={20} color="#fff" strokeWidth={2} />
                <Text style={s.studyText}>{t.study}</Text>
                <Text style={s.studyCount}>{remaining}</Text>
              </Tap>
            </View>

            {words.length === 0 ? <Text style={s.empty}>{t.noWords}</Text> : null}

            {words.map((w) => {
              const st = statusOf(w.id);
              return (
                <View key={w.id} style={[s.row, glass]}>
                  <WordThumb image={w.image} letter={w.ru} size={52} radius={14} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.ru}>{w.ru}</Text>
                    <Text style={s.tj}>{w.tj}</Text>
                  </View>
                  {st !== 'new' ? (
                    <View style={[s.status, st === 'known' ? s.statusKnown : s.statusRepeat]}>
                      {st === 'known' ? <Icon name="check" size={12} color={colors.green} strokeWidth={3} /> : null}
                      <Text style={[s.statusText, { color: st === 'known' ? colors.green : '#B96A00' }]}>
                        {st === 'known' ? t.statusKnown : t.statusRepeat}
                      </Text>
                    </View>
                  ) : null}
                  <Tap style={s.speak} onPress={() => speak(w.ru)}>
                    <Icon name="volume" size={16} color={colors.green} />
                  </Tap>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 16 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  progressCard: { padding: 14, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  progressText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.track, marginTop: 8, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3, backgroundColor: colors.green },
  studyBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0px 8px 20px rgba(30, 127, 85, 0.28)',
  },
  studyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  studyCount: { color: '#fff', fontSize: 12, fontWeight: '800', backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  empty: { textAlign: 'center', fontSize: 14, color: colors.textSecondary, marginTop: 30 },
  row: {
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
  ru: { fontSize: 17, fontWeight: '800', color: colors.text },
  tj: { fontSize: 14, fontWeight: '600', color: colors.green, marginTop: 1 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusKnown: { backgroundColor: colors.greenSoft },
  statusRepeat: { backgroundColor: '#FBEBCB' },
  statusText: { fontSize: 11, fontWeight: '700' },
  speak: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  lockedBox: { alignItems: 'center', padding: 28, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', marginTop: 20 },
  lockIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.greenSoft, alignItems: 'center', justifyContent: 'center' },
  lockedTitle: { marginTop: 14, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  lockedSub: { marginTop: 6, fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
});
