import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  message: string;
};

export function ComingSoon({ title, icon, message }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.center}>
        <View style={styles.badge}>
          <Ionicons name={icon} size={30} color={Colors.brandGreen} />
        </View>
        <Text style={styles.heading}>Coming soon</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mist },
  header: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  title: { fontFamily: Fonts.bodySemiBold, fontSize: 18, color: Colors.text },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  badge: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#E4F2EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text, marginTop: 18 },
  message: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: Colors.muted,
    textAlign: 'center',
    marginTop: 8,
  },
});
