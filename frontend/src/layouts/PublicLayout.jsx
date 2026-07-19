import { useEffect, useState } from 'react'
import {
  AppBar, Box, Button, Container, Divider, Drawer, IconButton, Link as MuiLink,
  List, ListItemButton, ListItemText, Stack, Toolbar, Typography,
} from '@mui/material'
import { ArrowForward, Close, Menu } from '@mui/icons-material'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { publicNav } from '../config/navigation'
import logo from '../assets/images/logo.png'
import logoLight from '../assets/images/logo-light.png'

export function Brand({ light = false }) {
  return <Box component={Link} to="/" className={`brand${light ? ' brand--light' : ''}`} aria-label="IMan Investment">
    <Box component="img" src={light ? logoLight : logo} alt="IMan Investment" className="brand__logo" />
  </Box>
}

function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  return <>
    <AppBar className="site-header" position="fixed" color="transparent">
      <Container maxWidth="xl"><Toolbar disableGutters><Brand />
        <Stack className="desktop-nav" direction="row" spacing={3}>
          {publicNav.map(([label, to]) => <MuiLink key={to} component={Link} to={to} className={(to === '/' ? pathname === '/' : pathname === to) ? 'active' : ''} underline="none">{label}</MuiLink>)}
          <Button component={Link} to="/submit-business-plan" variant="outlined">Submit BP</Button>
          <Button component={Link} to="/contact" variant="contained">Contact Us</Button>
        </Stack>
        <IconButton aria-label="Open navigation" onClick={() => setOpen(true)} className="mobile-menu"><Menu /></IconButton>
      </Toolbar></Container>
    </AppBar>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: 'min(88vw, 360px)', p: 3 } }}>
      <Stack direction="row" sx={{ justifyContent: 'space-between' }}><Brand /><IconButton aria-label="Close navigation" onClick={() => setOpen(false)}><Close /></IconButton></Stack>
      <List sx={{ my: 4 }}>{publicNav.map(([label, to]) => <ListItemButton key={to} component={Link} to={to} onClick={() => setOpen(false)}><ListItemText primary={label} primaryTypographyProps={{ variant: 'h5', fontFamily: 'serif' }} /></ListItemButton>)}</List>
      <Button component={Link} to="/submit-business-plan" onClick={() => setOpen(false)} variant="contained">Submit a business plan</Button>
    </Drawer>
  </>
}

function Footer() {
  return <Box component="footer" className="site-footer">
    <Container maxWidth="xl"><Box className="footer-grid">
      <Box><Brand light /><Typography sx={{ mt: 2 }}>We partner with visionaries building enduring companies across global growth markets.</Typography></Box>
      <Box><Typography className="footer-title">Company</Typography>{publicNav.slice(1, 4).map(([label, to]) => <MuiLink key={to} component={Link} to={to}>{label}</MuiLink>)}</Box>
      <Box><Typography className="footer-title">Resources</Typography>{publicNav.slice(4).map(([label, to]) => <MuiLink key={to} component={Link} to={to}>{label}</MuiLink>)}</Box>
      <Box><Typography className="footer-title">Legal</Typography><MuiLink component={Link} to="/privacy">Privacy Policy</MuiLink><MuiLink component={Link} to="/terms">Terms of Use</MuiLink><MuiLink component={Link} to="/admin/login">Admin</MuiLink></Box>
    </Box><Divider /><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}><Typography variant="caption">© {new Date().getFullYear()} IMan Investment</Typography><MuiLink component={Link} to="/contact" className="footer-cta">Hong Kong <ArrowForward fontSize="inherit" /></MuiLink></Stack></Container>
  </Box>
}

export default function PublicLayout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return <><Header /><Box component="main" className="public-main"><Outlet /></Box><Footer /></>
}
