import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

type CategoryIcon = {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  tint: string;
  color: string;
};

const icons: Record<string, CategoryIcon> = {
  RENT: { name: 'home-variant-outline', tint: '#E4F2EC', color: Colors.brandGreen },
  TITHE: { name: 'church-outline', tint: '#FDECEC', color: '#D9685F' },
  SAVINGS: { name: 'piggy-bank-outline', tint: '#FFF1D6', color: '#E1932E' },
  UTILITY: { name: 'flash-outline', tint: '#FFEABA', color: '#BA7517' },
  SUBSCRIPTION: { name: 'credit-card-outline', tint: '#E7EEF9', color: '#2F6FED' },
  LOAN: { name: 'cash-multiple', tint: '#E4F2EC', color: Colors.brandGreen },
  OTHER: { name: 'shape-outline', tint: '#ECEFF2', color: '#6F7173' },
};

export function categoryIcon(category: string): CategoryIcon {
  return icons[category] ?? icons.OTHER;
}
