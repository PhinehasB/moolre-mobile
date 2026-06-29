import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

type Props = {
  label?: string;
  muted?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureToggle?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: TextInputProps['returnKeyType'];
  textContentType?: TextInputProps['textContentType'];
  onSubmitEditing?: () => void;
};

export function TextField({
  label,
  muted = false,
  value,
  onChangeText,
  placeholder,
  secureToggle = false,
  autoCapitalize = 'none',
  keyboardType,
  returnKeyType,
  textContentType,
  onSubmitEditing,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secureToggle);

  return (
    <View style={styles.field}>
      {label ? <Text style={[styles.label, muted && styles.labelMuted]}>{label}</Text> : null}
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.placeholder}
          secureTextEntry={hidden}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          returnKeyType={returnKeyType}
          textContentType={textContentType}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, secureToggle && styles.inputWithIcon]}
        />
        {secureToggle ? (
          <Pressable onPress={() => setHidden((v) => !v)} hitSlop={10} style={styles.eye}>
            <Ionicons
              name={hidden ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.muted}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  field: { width: '100%', marginTop: 22 },
  label: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text, marginBottom: 8 },
  labelMuted: { fontFamily: Fonts.bodySemiBold, fontSize: 12, color: '#767676' },
  inputWrap: {
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    justifyContent: 'center',
  },
  inputWrapFocused: { borderColor: Colors.brandGreen },
  input: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text, paddingHorizontal: 16 },
  inputWithIcon: { paddingRight: 48 },
  eye: { position: 'absolute', right: 14, height: '100%', justifyContent: 'center' },
});
