import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

// Қайдкунии пахш бояд фавран бошад: гузариши кӯтоҳ (70мс) ва бе таъхир (delayPressIn = 0).
const smooth = { transition: 'transform 70ms ease-out, opacity 70ms ease-out, background-color 90ms ease-out' } as object;

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Услуби иловагӣ ҳангоми пахш (масалан, ранги пасзамина). */
  pressedStyle?: StyleProp<ViewStyle>;
  /** Таъхири нишон додани ҳолати пахш (мс); пешфарз 0. React Native Web онро дастгирӣ мекунад, аммо дар типҳо нест. */
  delayPressIn?: number;
};

/**
 * Pressable бо ҳолати пахши фаврӣ.
 * React Native Web пеш аз нишон додани ҳолати "пахш" 50мс интизор мешавад (delayPressIn) — барои бозгашти ҳисси
 * "клик шуд" ин таъхир хомӯш карда мешавад, то ҳолат дар лаҳзаи ламс пайдо шавад.
 */
export function Tap({ style, pressedStyle, delayPressIn = 0, ...rest }: Props) {
  return (
    <Pressable
      {...rest}
      {...({ delayPressIn } as object)}
      style={({ pressed }) => [style, smooth, pressed && { opacity: 0.8, transform: [{ scale: 0.96 }] }, pressed && pressedStyle]}
    />
  );
}
