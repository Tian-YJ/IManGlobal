import { Box, Button, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { Section } from './common'
import usePageTitle from '../hooks/usePageTitle'

export default function NotFound({ homeTo = '/', homeLabel = 'Return home' }) {
  usePageTitle('Page not found')
  return (
    <Section>
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h1">404</Typography>
        <Typography variant="h4">This page could not be found.</Typography>
        <Button component={Link} to={homeTo} variant="contained" sx={{ mt: 4 }}>{homeLabel}</Button>
      </Box>
    </Section>
  )
}
