import { alpha, createTheme } from '@mui/material/styles'

const navy = '#07172d'
const blue = '#1a4b7a'
const gold = '#b99155'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: navy, contrastText: '#fff' },
    secondary: { main: gold },
    background: { default: '#f8f8f5', paper: '#ffffff' },
    text: { primary: navy, secondary: '#596575' },
    divider: '#dde1e5',
  },
  typography: {
    fontFamily: '"DM Sans", Arial, sans-serif',
    fontSize: 14,
    h1: { fontFamily: '"Libre Caslon Display", Georgia, serif', fontSize: 'clamp(2.9rem, 5.2vw, 5.2rem)', letterSpacing: '-.035em', lineHeight: 1, fontWeight: 400 },
    h2: { fontFamily: '"Libre Caslon Display", Georgia, serif', fontSize: 'clamp(2rem, 3.2vw, 3.45rem)', letterSpacing: '-.025em', lineHeight: 1.08, fontWeight: 400 },
    h3: { fontFamily: '"Libre Caslon Display", Georgia, serif', fontSize: 'clamp(1.45rem, 2vw, 2.15rem)', lineHeight: 1.15, fontWeight: 400 },
    h4: { fontFamily: '"Libre Caslon Display", Georgia, serif', fontWeight: 400 },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: '.01em' },
    overline: { fontWeight: 600, letterSpacing: '.18em' },
  },
  shape: { borderRadius: 1 },
  components: {
    MuiContainer: { styleOverrides: { maxWidthXl: { maxWidth: '1280px !important' } } },
    MuiButton: { styleOverrides: { root: { minHeight: 40, padding: '9px 20px', boxShadow: 'none', borderRadius: 1, '&:focus-visible': { outline: '3px solid rgba(26,75,122,.28)', outlineOffset: 2 } } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid #dfe3e6' } } },
    MuiCard: { styleOverrides: { root: { transition: 'transform .25s ease, box-shadow .25s ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: `0 18px 50px ${alpha(navy, .1)}` } } } },
    MuiTextField: {
      defaultProps: { size: 'small' },
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': { fontSize: 13 },
          '& .MuiFormLabel-asterisk': { color: '#c62828' },
          '& .MuiOutlinedInput-root': { borderRadius: 1 },
        },
      },
    },
    MuiTableCell: { styleOverrides: { root: { borderColor: '#e8ebed', padding: '12px 16px', fontSize: 13 }, head: { background: '#f7f8f8', color: '#51606f', fontWeight: 700, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' } } },
  },
})

export { navy, blue, gold }
export default theme
