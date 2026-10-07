import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

const smooth = { transition: 'transform 140ms ease, opacity 140ms ease' } as object;

/** Pressable бо ҳолати пахши мулоим. */
export function Tap({ style, ...rest }: Omit<PressableProps, 'style'> & { style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      {...rest}
      style={({ pressed }) => [style, smooth, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}
    />
  );
}
