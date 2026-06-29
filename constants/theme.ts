export const Colors = {
  brandGreen: '#0F6E56',
  brandGold: '#E9B84B',
  white: '#FFFFFF',
  mist: '#F5F7FA',
  ink: '#0E1213',
  text: '#111315',
  muted: '#6F7173',
  placeholder: '#9DA0A5',
  border: '#D6DCE6',
  danger: '#C5453B',
  success: '#0F6E56',
};

export const Fonts = {
  mono: 'JetBrainsMono-Medium',
  display: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
};

export const SplashGradient = {
  colors: ['#0F6E56', '#0F6E56', '#E9B84B'] as const,
  locations: [0, 0.64, 1] as const,
  start: { x: 0.5, y: 0 },
  end: { x: 0.5, y: 1 },
};
