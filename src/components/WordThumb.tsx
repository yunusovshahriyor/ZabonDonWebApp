import { useState } from 'react';
import { Image, Text, View } from 'react-native';
import { colors } from '../theme';

type Props = { image?: string; letter: string; size: number; radius?: number };

/** Акси калима/категория; агар набошад ё бор нашавад — ҳарфи аввал дар заминаи мулоим. */
export function WordThumb({ image, letter, size, radius = 14 }: Props) {
  const [failed, setFailed] = useState(false);
  const show = !!image && !failed;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: colors.greenSoft,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {show ? (
        <Image source={{ uri: image }} style={{ width: size, height: size }} resizeMode="cover" onError={() => setFailed(true)} />
      ) : (
        <Text style={{ fontSize: size * 0.45, fontWeight: '800', color: colors.green }}>{letter.charAt(0).toUpperCase()}</Text>
      )}
    </View>
  );
}
