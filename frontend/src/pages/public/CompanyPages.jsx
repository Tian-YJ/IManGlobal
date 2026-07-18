import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { ArrowForward, AutoGraphOutlined, Diversity3Outlined, PublicOutlined, WorkspacePremiumOutlined } from '@mui/icons-material'
import { Link } from 'react-router-dom'
import { Cityscape, Eyebrow, PageHero, Section } from '../../components/common'

export function AboutPage() {
  const values = [
    [<WorkspacePremiumOutlined />, 'Integrity', 'We act with transparency and accountability in every partnership.'],
    [<Diversity3Outlined />, 'Collaboration', 'We combine perspectives and build alongside founders, not around them.'],
    [<AutoGraphOutlined />, 'Partnership', 'Our support extends from formative decisions through global expansion.'],
    [<PublicOutlined />, 'Impact', 'We pursue responsible growth that strengthens companies and communities.'],
  ]
  return <><PageHero eyebrow="About Us" title="Built by investors. Inspired by entrepreneurs." text="We are a team of operators, investors and builders committed to backing exceptional leaders and creating a better future." image="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80" />
    <Section><Box className="split"><Box><Eyebrow>Our story</Eyebrow><Typography variant="h2" mt={2}>Local insight.<br />Global ambition.</Typography></Box><Stack gap={3}><Typography className="lead">Founded in Hong Kong, IMan Investment brings patient capital and practical operating experience to companies solving consequential problems.</Typography><Typography color="text.secondary">We stay selective so our team can remain deeply engaged from first conversation through each stage of growth.</Typography></Stack></Box></Section>
    <Section sx={{ bgcolor: '#f1f3f2' }}><Box className="stats-row">{[['20+', 'Portfolio companies'], ['$500M+', 'Assets under management'], ['8+', 'Countries and regions']].map(([n, l]) => <Box key={l}><Typography variant="h2">{n}</Typography><Typography color="text.secondary">{l}</Typography></Box>)}</Box></Section>
    <Section><Eyebrow>Our values</Eyebrow><Typography variant="h2" mt={2} mb={5}>How we work matters.</Typography><Box className="four-grid">{values.map(([icon, title, text]) => <Paper key={title} className="value-card">{icon}<Typography variant="h4">{title}</Typography><Typography color="text.secondary">{text}</Typography></Paper>)}</Box></Section>
  </>
}

export function InvestmentPage() {
  return <><PageHero eyebrow="Investment" title="Backing bold ideas with patient capital." text="We invest in innovative companies solving real-world problems and help exceptional teams scale globally." image="https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1600&q=80" />
    <Section><Box className="split"><Box><Eyebrow>Investment focus</Eyebrow><Typography variant="h2" mt={2}>We look for the uncommon combination.</Typography></Box><Box className="number-list">{['Bold founders with a clear mission', 'Large and expanding markets', 'Scalable, defensible business models', 'Technology or insight that changes the category'].map((x, i) => <Box key={x}><span>0{i + 1}</span><Typography variant="h4">{x}</Typography></Box>)}</Box></Box></Section>
    <Section dark><Box className="split"><Box><Eyebrow light>Investment stage</Eyebrow><Typography variant="h2" mt={2}>Pre-seed to Series B.</Typography><Typography mt={3} color="rgba(255,255,255,.65)">Initial investments from US$500K to US$5M, with capital reserved for follow-on support.</Typography></Box><Cityscape label="Connected growth markets" /></Box></Section>
    <Section><Box textAlign="center"><Typography variant="h2">Think we are a good fit?</Typography><Typography color="text.secondary" mt={2}>Share your business plan and start a conversation.</Typography><Button component={Link} to="/submit-business-plan" variant="contained" endIcon={<ArrowForward />} sx={{ mt: 4 }}>Submit Business Plan</Button></Box></Section>
  </>
}
