import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

export type SelectOption = { value: string; label: string; left?: ReactNode };

type Props = {
  label?: string;
  muted?: boolean;
  placeholder: string;
  value: string | null;
  options: SelectOption[];
  onChange: (value: string) => void;
};

export function SelectField({ label, muted, placeholder, value, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value) ?? null;

  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.label, muted && styles.labelMuted]}>{label}</Text> : null}
      <Pressable style={styles.control} onPress={() => setOpen(true)}>
        {selected?.left ? <View style={styles.controlLeft}>{selected.left}</View> : null}
        <Text style={[styles.value, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color={Colors.muted} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            {options.map((option) => {
              const isSelected = option.value === value;
              return (
                <Pressable
                  key={option.value}
                  style={styles.row}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.left ? <View style={styles.rowLeft}>{option.left}</View> : null}
                  <Text style={styles.rowLabel}>{option.label}</Text>
                  {isSelected ? <Ionicons name="checkmark" size={20} color={Colors.brandGreen} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%', marginTop: 22 },
  label: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text, marginBottom: 8 },
  labelMuted: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: '#767676' },
  control: {
    minHeight: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  controlLeft: { marginRight: 12 },
  value: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.text },
  placeholder: { color: Colors.placeholder, fontFamily: Fonts.body, fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(10,20,16,0.4)', justifyContent: 'center', paddingHorizontal: 32 },
  sheet: { backgroundColor: Colors.white, borderRadius: 14, paddingVertical: 6, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 14, gap: 14 },
  rowLeft: {},
  rowLabel: { flex: 1, fontFamily: Fonts.bodyMedium, fontSize: 16, color: Colors.text },
});
