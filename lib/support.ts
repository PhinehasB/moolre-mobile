import { Linking } from 'react-native';

const SUPPORT_WHATSAPP = '233257220301';
const DEFAULT_MESSAGE = 'Hi Klare Support 👋, I need help with my Klare account.';

export async function openWhatsAppSupport(message: string = DEFAULT_MESSAGE) {
  const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(message)}`;
  try {
    await Linking.openURL(url);
  } catch {
    return false;
  }
  return true;
}
