import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Fonts } from '@/constants/theme';

type Props = { network: string; size?: number };

export function NetworkBadge({ network, size = 32 }: Props) {
  const radius = size / 2;

  if (network === 'BANK') {
    return (
      <View style={[styles.badge, { width: size, height: size, borderRadius: radius, backgroundColor: '#EEF1F4' }]}>
        <MaterialCommunityIcons name="bank-outline" size={size * 0.55} color="#3F4D47" />
      </View>
    );
  }

  const config: Record<string, { bg: string; color: string; text: string }> = {
    MTN: { bg: '#FFC800', color: '#000000', text: 'MTN' },
    AT: { bg: '#223D76', color: '#FFFFFF', text: 'at' },
    TELECEL: { bg: '#E2231A', color: '#FFFFFF', text: 't' },
  };
  const item = config[network] ?? { bg: '#ECEFF2', color: '#3F4D47', text: network.slice(0, 2) };

  return (
    <View style={[styles.badge, { width: size, height: size, borderRadius: radius, backgroundColor: item.bg }]}>
      <Text style={[styles.text, { color: item.color, fontSize: size * 0.3 }]}>{item.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
  text: { fontFamily: Fonts.bodySemiBold },
});
