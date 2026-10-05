
export const brand = {
  orange: '#ff6e00',
  orangeDark: '#db5200',
  blue: '#174ea6',
  green: '#3fa879',
  yellow: '#ffcd57',
  warning: '#f5a623',
  red: '#e84545',
  white: '#ffffff',
} as const;

export const lightColors = {
  ...brand,
  orangeSoft: '#fff0e5',
  orangePale: '#fff8f1',
  blueSoft: '#e9f0ff',
  greenSoft: '#e9f7f0',
  redSoft: '#fdeaea',
  ink: '#2c2c2c',
  muted: '#8a8582',
  muted2: '#b2ada8',
  line: '#e8e2dc',
  surface: '#ffffff',
  surface2: '#f5f2ee',
  background: '#faf8f5',
  heroStart: '#fff2e7',
  heroEnd: '#f3ede6',
  shadow: 'rgba(61, 47, 38, 0.10)',
  overlay: 'rgba(23, 21, 19, 0.45)',
};

export type ThemeColors = typeof lightColors;

export const darkColors: ThemeColors = {
  ...brand,
  orangeSoft: '#3a2518',
  orangePale: '#2b2019',
  blueSoft: '#1d2d48',
  greenSoft: '#183329',
  redSoft: '#3d1f1f',
  ink: '#f4f0ec',
  muted: '#aaa39d',
  muted2: '#77716d',
  line: '#37322f',
  surface: '#211f1d',
  surface2: '#2a2724',
  background: '#171513',
  heroStart: '#2b2019',
  heroEnd: '#211f1d',
  shadow: 'rgba(0, 0, 0, 0.30)',
  overlay: 'rgba(0, 0, 0, 0.6)',
};


export const avatarPalette = ['#5c7cfa', '#20a37f', '#e8590c', '#9c36b5'] as const;
