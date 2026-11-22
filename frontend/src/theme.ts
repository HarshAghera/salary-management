import { createTheme, responsiveFontSizes } from '@mui/material/styles';
// Lets the theme style the date picker's parts (MuiPickerPopper, MuiPickersDay) with type checking.
import type {} from '@mui/x-date-pickers/themeAugmentation';

const FONT_FAMILY = '"Poppins", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

/**
 * Brand teal, identical in light and dark mode so both schemes read as one product.
 * It fills the top bar and the logo mark; white text on it has 5.5:1 contrast.
 */
export const BRAND_COLOR = '#0f766e';

/** Soft teal-tinted shadow that lifts white cards off the mint canvas in light mode. */
const CARD_SHADOW = '0 1px 3px rgba(16, 35, 31, 0.05), 0 8px 24px rgba(15, 118, 110, 0.08)';

/**
 * Palette "Teal & mint" (ADR-11). Light mode: white cards on a mint-tinted canvas. Dark
 * mode: canvas and cards tinted with the same teal, so the screen reads as one colour
 * family rather than a large near-black area. One primary accent (teal) and one secondary
 * accent (periwinkle). Status colours are reserved for meaning and used the same way
 * everywhere: badges, import results and charts. Success is a leaf green, kept distinct
 * from the blue-green brand. Text is tinted ink, never pure black.
 */
export const theme = responsiveFontSizes(
  createTheme({
    cssVariables: { colorSchemeSelector: 'class' },
    colorSchemes: {
      light: {
        palette: {
          primary: { main: BRAND_COLOR },
          secondary: { main: '#5d5fef' },
          success: { main: '#15803d' },
          warning: { main: '#d97706' },
          error: { main: '#dc2626' },
          info: { main: '#0284c7' },
          background: { default: '#f2f8f7', paper: '#ffffff' },
          text: { primary: '#10231f', secondary: '#5b7470' },
          divider: '#dcebe8',
        },
      },
      dark: {
        palette: {
          // Same hue as the brand, lifted so buttons and links stay legible on dark cards.
          primary: { main: '#2dd4bf', contrastText: '#062a26' },
          secondary: { main: '#818cf8', contrastText: '#0b1120' },
          success: { main: '#4ade80' },
          warning: { main: '#f59e0b' },
          error: { main: '#f87171' },
          info: { main: '#38bdf8' },
          // Cards sit one step above the page; both carry a hint of the brand teal.
          background: { default: '#11211f', paper: '#183330' },
          text: { primary: '#e8f5f2', secondary: '#97bab4' },
          divider: 'rgba(153, 214, 203, 0.14)',
        },
      },
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: FONT_FAMILY,
      h4: { fontWeight: 700, letterSpacing: '-0.02em' },
      h5: { fontWeight: 700, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: 'none' },
      overline: { fontWeight: 600, letterSpacing: '0.08em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: { body: { WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' } },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: { root: { minHeight: 44, borderRadius: 10, paddingInline: 18 } },
      },
      MuiIconButton: { styleOverrides: { root: { minWidth: 44, minHeight: 44 } } },
      MuiPaper: {
        defaultProps: { elevation: 0 },
        styleOverrides: { root: { backgroundImage: 'none' } },
      },
      // Light mode lifts cards with a soft shadow; dark mode separates them with a hairline border.
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 16,
            boxShadow: CARD_SHADOW,
            ...theme.applyStyles('dark', { boxShadow: 'none', border: `1px solid ${theme.vars.palette.divider}` }),
          }),
        },
      },
      // The brand colour fills the top bar in both modes.
      MuiAppBar: {
        defaultProps: { elevation: 0, color: 'inherit' },
        styleOverrides: { root: { backgroundColor: BRAND_COLOR, color: '#fff' } },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: ({ theme }) => theme.applyStyles('dark', { backgroundColor: '#0e1c1a' }),
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: ({ theme }) => ({
            minHeight: 44,
            borderRadius: 10,
            color: theme.vars.palette.text.secondary,
            '& .MuiListItemIcon-root': { color: 'inherit', minWidth: 40 },
            '&:hover': { color: theme.vars.palette.text.primary },
            '&.active': {
              color: theme.vars.palette.primary.main,
              backgroundColor: `rgba(${theme.vars.palette.primary.mainChannel} / 0.1)`,
              '& .MuiListItemText-primary': { fontWeight: 600 },
            },
          }),
        },
      },
      MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiTab: { styleOverrides: { root: { minHeight: 48, textTransform: 'none', fontWeight: 600 } } },
      MuiChip: { styleOverrides: { root: { fontWeight: 500, borderRadius: 8 } } },
      MuiTooltip: {
        styleOverrides: { tooltip: ({ theme }) => ({ fontSize: theme.typography.pxToRem(12), borderRadius: 8 }) },
      },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
      // The date picker's calendar floats above a dialog, so unlike flat cards it needs an edge and a lift.
      MuiPickerPopper: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 16,
            border: `1px solid ${theme.vars.palette.divider}`,
            boxShadow: '0 12px 32px rgba(16, 35, 31, 0.16)',
            ...theme.applyStyles('dark', { boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)' }),
          }),
        },
      },
      MuiPickersDay: { styleOverrides: { root: { fontWeight: 500 } } },
    },
  }),
);
