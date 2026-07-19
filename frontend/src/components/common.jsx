import { Alert, Box, Container, Paper, Skeleton, Typography } from '@mui/material'
import { motion } from 'framer-motion'

const MotionBox = motion.create(Box)
const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: .5 } }

export function Eyebrow({ children, light = false }) {
  return <Typography className="eyebrow" color={light ? undefined : 'secondary.main'} sx={light ? { color: 'rgba(255,255,255,.72)' } : undefined}>{children}</Typography>
}

export function Section({ children, dark = false, className = '', sx = {} }) {
  return <Box component="section" className={className} sx={{ py: { xs: 8, md: 11 }, bgcolor: dark ? 'primary.main' : 'background.default', color: dark ? 'white' : 'inherit', ...sx }}>
    <Container maxWidth="xl">{children}</Container>
  </Box>
}

export function PageHero({ eyebrow, title, text, image, compact = false }) {
  return <Box className={`page-hero ${image ? 'page-hero--image' : ''}`} sx={image ? { '--hero-image': `url(${image})` } : undefined}>
    <Container maxWidth="xl" className="page-hero__inner">
      <MotionBox {...fade} className="page-hero__copy">
        <Eyebrow>{eyebrow}</Eyebrow>
        <Typography variant={compact ? 'h2' : 'h1'} sx={{ mt: 2 }}>{title}</Typography>
        {text && <Typography className="lead" sx={{ mt: 3 }}>{text}</Typography>}
      </MotionBox>
    </Container>
  </Box>
}

export function QueryState({ query, children, empty = 'No content is available yet.' }) {
  if (query.isLoading) return <Box className="three-grid">{[1, 2, 3].map((item) => <Skeleton key={item} variant="rounded" height={250} />)}</Box>
  if (query.isError) return <Alert severity="info">This content is temporarily unavailable. Please try again later.</Alert>
  if (!query.data?.length) return <Paper sx={{ p: 6, textAlign: 'center' }}><Typography color="text.secondary">{empty}</Typography></Paper>
  return children(query.data)
}

export function Cityscape({ label = 'Hong Kong', image }) {
  return <Box
    className="cityscape"
    role="img"
    aria-label={`${label} skyline`}
    style={image ? { '--hero-image': `url(${image})` } : undefined}
  >
    <Typography className="cityscape__label">{label} · Asia</Typography>
  </Box>
}
