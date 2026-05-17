import { createTheme, virtualColor } from '@mantine/core';

export const catppuccin = {
  rosewater: '#f5e0dc',
  flamingo: '#f2cdcd',
  pink: '#f5c2e7',
  mauve: '#cba6f7',
  red: '#f38ba8',
  maroon: '#eba0ac',
  peach: '#fab387',
  yellow: '#f9e2af',
  green: '#a6e3a1',
  teal: '#94e2d5',
  sky: '#89dceb',
  sapphire: '#74c7ec',
  blue: '#89b4fa',
  lavender: '#b4befe',
  text: '#cdd6f4',
  subtext1: '#bac2de',
  subtext0: '#a6adc8',
  overlay2: '#9399b2',
  overlay1: '#7f849c',
  overlay0: '#6c7086',
  surface2: '#585b70',
  surface1: '#45475a',
  surface0: '#313244',
  base: '#1e1e2e',
  mantle: '#181825',
  crust: '#11111b',
};

export const theme = createTheme({
  primaryColor: 'lavender',
  defaultRadius: 'md',
  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  fontFamilyMonospace:
    '"JetBrains Mono", ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace',
  colors: {
    lavender: [
      '#f2f4ff',
      '#e4e8ff',
      '#cbd3ff',
      '#b4befe',
      '#9ca8f2',
      '#8591e1',
      '#707ac6',
      '#5c64a5',
      '#484e83',
      '#343961',
    ],
    dark: [
      catppuccin.text,
      catppuccin.subtext1,
      catppuccin.subtext0,
      catppuccin.overlay1,
      catppuccin.surface2,
      catppuccin.surface1,
      catppuccin.surface0,
      catppuccin.base,
      catppuccin.mantle,
      catppuccin.crust,
    ],
    accent: virtualColor({ name: 'accent', dark: 'lavender', light: 'lavender' }),
  },
  components: {
    AppShell: {
      styles: {
        main: {
          background:
            'radial-gradient(circle at top left, rgba(180, 190, 254, 0.16), transparent 34rem), #1e1e2e',
        },
        navbar: {
          background: catppuccin.mantle,
          borderColor: catppuccin.surface0,
        },
        header: {
          background: 'rgba(24, 24, 37, 0.86)',
          borderColor: catppuccin.surface0,
          backdropFilter: 'blur(14px)',
        },
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
      },
      styles: {
        root: {
          background: 'rgba(49, 50, 68, 0.78)',
          borderColor: catppuccin.surface1,
        },
      },
    },
  },
});
