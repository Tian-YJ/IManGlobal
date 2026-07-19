import { useQuery } from '@tanstack/react-query'
import { ArrowBack, ArrowForward, BusinessCenterOutlined, CalendarTodayOutlined, ChevronRight, EmailOutlined, LinkedIn, LocationOnOutlined, ScheduleOutlined, ShareOutlined } from '@mui/icons-material'
import { Alert, Box, Button, Card, CardContent, Chip, Divider, IconButton, Link as MuiLink, Paper, Skeleton, Snackbar, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHero, QueryState, Section } from '../../components/common'
import { industryImage } from '../../config/portfolioIndustries'
import usePageTitle from '../../hooks/usePageTitle'
import { getOne, getPage } from '../../services/api'
import logo from '../../assets/images/logo.png'
import logoLight from '../../assets/images/logo-light.png'
import './public-workflows.css'

const selectContent = (page) => page?.content || []
const formatType = (value = 'FULL_TIME') => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase())
const REPORT_SERIES = [
  'future-of-ai-enterprise',
  'apac-vc-landscape-2026',
  'healthcare-platforms-asia-2026',
  'climate-energy-transition-2026',
]
const reportIndexFor = (slug, fallback = 0) => {
  const index = REPORT_SERIES.indexOf(slug)
  return index >= 0 ? index : fallback
}
const reportNumber = (index) => String(index + 1).padStart(2, '0')

function InsightCover({ image, index, title, compact = false }) {
  return (
    <Box
      className={`insight-cover${compact ? ' insight-cover--compact' : ''}${image ? ' insight-cover--photo' : ''}`}
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    >
      <Box className="insight-cover__shade" />
      <Box className="insight-cover__top">
        <Box component="img" src={logoLight} alt="IMan Investment" className="insight-cover__logo" />
        <Typography className="insight-cover__series">IMan Perspectives</Typography>
      </Box>
      <Box className="insight-cover__bottom">
        <Typography className="insight-cover__no">{reportNumber(index)}</Typography>
        {title && <Typography className="insight-cover__title">{title}</Typography>}
      </Box>
    </Box>
  )
}

export function PortfolioPage() {
  usePageTitle('Portfolio')
  const query = useQuery({ queryKey: ['portfolio'], queryFn: () => getPage('/public/portfolio'), select: (items) => items || [] })
  return <>
    <PageHero eyebrow="Portfolio" title="Backing the builders of tomorrow." text="We partner with ambitious companies creating category-defining products and enduring value." />
    <Section>
      <QueryState query={query} empty="Portfolio profiles are being prepared.">
        {(items) => (
          <Box className="portfolio-grid">
            {items.map((item, i) => {
              const image = item.imageUrl || industryImage(item.industry)
              return (
                <Card key={item.id}>
                  <Box
                    className={`content-image${image ? ' content-image--photo' : ''}`}
                    style={image ? { backgroundImage: `url(${image})` } : undefined}
                  >
                    <span>{String(i + 1).padStart(2, '0')}</span>
                  </Box>
                  <CardContent>
                    <Chip label={item.industry} size="small" />
                    <Typography variant="h4" sx={{ mt: 2 }}>{item.name}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>{item.description}</Typography>
                    {item.website && <MuiLink href={item.website} target="_blank" rel="noreferrer">Visit company <ArrowForward fontSize="inherit" /></MuiLink>}
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        )}
      </QueryState>
    </Section>
  </>
}

export function InsightsPage() {
  usePageTitle('Insights')
  const query = useQuery({ queryKey: ['insights'], queryFn: () => getPage('/public/insights', { size: 24, sort: 'publishedDate', direction: 'desc' }), select: selectContent })
  return <>
    <PageHero eyebrow="Insights" title="Perspective for what comes next." text="Research notes and investment perspectives from the IMan network." />
    <Section>
      <QueryState query={query} empty="New perspectives are coming soon.">
        {(items) => (
          <Box className="three-grid insights-grid">
            {items.map((item, index) => {
              const reportIndex = reportIndexFor(item.slug, index)
              return (
                <Card key={item.id} className="insight-card">
                  <InsightCover image={item.imageUrl} index={reportIndex} compact />
                  <CardContent>
                    <Typography className="eyebrow">IMan Perspectives · Report {reportNumber(reportIndex)}</Typography>
                    <Typography variant="h4" sx={{ mt: 2 }}>{item.title}</Typography>
                    <Typography color="text.secondary" sx={{ my: 2 }}>{item.excerpt}</Typography>
                    <Button component={Link} to={`/insights/${item.slug}`} endIcon={<ArrowForward />}>Read report</Button>
                  </CardContent>
                </Card>
              )
            })}
          </Box>
        )}
      </QueryState>
    </Section>
  </>
}

export function InsightDetailPage() {
  const { id } = useParams()
  const query = useQuery({ queryKey: ['insight', id], queryFn: () => getOne(`/public/insights/${id}`) })
  usePageTitle(query.data?.title || 'Insight')
  if (query.isLoading) return <Section><Skeleton height={500} /></Section>
  if (query.isError) return <Section><Alert severity="error">This insight is unavailable.</Alert></Section>
  const item = query.data
  const reportIndex = reportIndexFor(item.slug)
  return (
    <>
      <Box className="insight-hero">
        <InsightCover image={item.imageUrl} index={reportIndex} title={item.title} />
      </Box>
      <Section>
        <Box className="article insight-article">
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1 }}>
            <Box component="img" src={logo} alt="" className="insight-article__mark" />
            <Typography className="eyebrow">IMan Perspectives · Report {reportNumber(reportIndex)}</Typography>
          </Stack>
          <Typography variant="h2" sx={{ mt: 1 }}>{item.title}</Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>{item.excerpt}</Typography>
          <Typography color="text.secondary" sx={{ mt: 2 }}>{item.author}{item.publishedDate ? ` · ${new Date(item.publishedDate).toLocaleDateString()}` : ''}</Typography>
          <Divider sx={{ my: 4 }} />
          <Typography component="div" className="rich-text">{item.content}</Typography>
          <Divider sx={{ my: 5 }} />
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box component="img" src={logo} alt="IMan Investment" className="insight-article__logo" />
            <Button component={Link} to="/insights" startIcon={<ArrowBack />}>All reports</Button>
          </Stack>
        </Box>
      </Section>
    </>
  )
}

export function TeamPage() {
  usePageTitle('Team')
  const query = useQuery({ queryKey: ['team'], queryFn: () => getPage('/public/team'), select: (items) => items || [] })
  return <><PageHero eyebrow="Team" title="Experience shaped by building." text="Investors and operators united by curiosity, conviction and care." /><Section><QueryState query={query} empty="Team profiles are being prepared.">{(items) => <Box className="four-grid">{items.map((item) => <Box className="team-card" key={item.id}><Box className="team-photo" sx={{ backgroundImage: item.imageUrl ? `url(${item.imageUrl})` : undefined }} /><Stack direction="row" sx={{ justifyContent: 'space-between' }}><Box><Typography variant="h4">{item.fullName}</Typography><Typography color="text.secondary">{item.role}</Typography></Box>{item.linkedinUrl && <MuiLink aria-label={`${item.fullName} on LinkedIn`} href={item.linkedinUrl}><LinkedIn /></MuiLink>}</Stack></Box>)}</Box>}</QueryState></Section></>
}

const isNewJob = (datePosted) => {
  if (!datePosted) return false
  const posted = new Date(datePosted)
  if (Number.isNaN(posted.getTime())) return false
  return (Date.now() - posted.getTime()) / 86400000 <= 3
}

export function CareersPage() {
  usePageTitle('Careers')
  const query = useQuery({ queryKey: ['jobs'], queryFn: () => getPage('/public/jobs', { size: 50, sort: 'datePosted', direction: 'desc' }), select: selectContent })
  return <>
    <PageHero eyebrow="Careers" title="Build the future with us." text="Join a focused, collaborative team helping remarkable companies realize their potential." image="https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1600&q=80" />
    <Section>
      <Box className="three-grid career-benefits">
        {[['Impactful work', 'Shape decisions that help ambitious companies scale.'], ['Learning culture', 'Work across sectors with experienced investors and operators.'], ['Global exposure', 'Collaborate with founders and partners across growth markets.']].map(([t, d]) => (
          <Box key={t}><Typography variant="h4">{t}</Typography><Typography color="text.secondary">{d}</Typography></Box>
        ))}
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} sx={{ mt: 10, mb: 4, justifyContent: 'space-between', alignItems: { sm: 'flex-end' }, gap: 2 }}>
        <Box>
          <Typography variant="h2">Open positions</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Roles are released on a rolling schedule — check back often for new openings.</Typography>
        </Box>
      </Stack>
      <QueryState query={query} empty="There are no open roles right now. Please check back soon.">
        {(items) => (
          <Stack className="job-list">
            {items.map((job) => (
              <Paper key={job.id}>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h4">{job.title}</Typography>
                    {isNewJob(job.datePosted) && <Chip label="New" size="small" color="secondary" />}
                  </Stack>
                  <Typography color="text.secondary">{job.department} · {job.location} · {formatType(job.type)}</Typography>
                </Box>
                <Button component={Link} to={`/careers/${job.slug}`} endIcon={<ChevronRight />}>View role</Button>
              </Paper>
            ))}
          </Stack>
        )}
      </QueryState>
    </Section>
    <Section className="career-cta" sx={{ bgcolor: '#f0f2f2', textAlign: 'center' }}>
      <Typography variant="h2">Let’s build the future together.</Typography>
      <Typography color="text.secondary" sx={{ mt: 2 }}>Whether you see a role that fits or want to introduce yourself, we would love to hear from you.</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ justifyContent: 'center', mt: 4 }}>
        <Button component={Link} to="/submit-business-plan" variant="contained">Submit Business Plan</Button>
        <Button component={Link} to="/contact" variant="outlined">Contact our team</Button>
      </Stack>
    </Section>
  </>
}

export function JobDetailPage() {
  const { id } = useParams()
  const query = useQuery({ queryKey: ['job', id], queryFn: () => getOne(`/public/jobs/${id}`) })
  usePageTitle(query.data?.title || 'Careers')
  const [shareNotice, setShareNotice] = useState('')
  if (query.isLoading) return <Section><Skeleton height={500} /></Section>
  if (query.isError) return <Section><Alert severity="error">This position is unavailable or has closed.</Alert></Section>
  const job = query.data
  const summary = job.summary || job.metaDescription || ''
  const sections = [['About the role', job.description], ['Responsibilities', job.responsibilities], ['Requirements', job.requirements], ['What we offer', job.benefits]]
  const shareUrl = typeof window === 'undefined' ? '' : window.location.href
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${job.title} · IMan Investment`, text: summary || job.title, url: shareUrl })
      else {
        await navigator.clipboard.writeText(shareUrl)
        setShareNotice('Job link copied to clipboard.')
      }
    } catch (error) {
      if (error?.name !== 'AbortError') setShareNotice('Unable to share this link.')
    }
  }
  return <Box className="job-detail-page">
    <Box className="job-hero">
      <Box className="job-hero__inner">
        <Button component={Link} to="/careers" startIcon={<ArrowBack />} className="workflow-back">All careers</Button>
        <Typography className="eyebrow" color="secondary.main">{job.department || 'IMan Investment'}</Typography>
        <Typography variant="h1">{job.title}</Typography>
        {summary && <Typography className="job-hero__summary">{summary}</Typography>}
        <Stack direction="row" className="job-meta">
          <Chip icon={<LocationOnOutlined />} label={job.location || 'Hong Kong'} variant="outlined" />
          <Chip icon={<BusinessCenterOutlined />} label={job.department || 'Investment team'} variant="outlined" />
          <Chip icon={<ScheduleOutlined />} label={formatType(job.type)} variant="outlined" />
          {job.datePosted && <Chip icon={<CalendarTodayOutlined />} label={`Posted ${new Date(job.datePosted).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}`} variant="outlined" />}
        </Stack>
      </Box>
    </Box>
    <Section className="job-content-section">
      <Box className="job-layout">
        <Box component="article" className="job-article">
          {sections.filter(([, body]) => body).map(([title, body], index) => <Box className="job-copy-section" key={title}><span>{String(index + 1).padStart(2, '0')}</span><Box><Typography variant="h3">{title}</Typography><Typography component="div" className="rich-text">{body}</Typography></Box></Box>)}
          <Box className="job-share"><Typography variant="h4">Share this opportunity</Typography><Typography color="text.secondary">Know someone who would be a great fit?</Typography><Stack direction="row" spacing={1}>
            <IconButton aria-label="Share job" onClick={share}><ShareOutlined /></IconButton>
            <IconButton component="a" aria-label="Share on LinkedIn" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer"><LinkedIn /></IconButton>
            <IconButton component="a" aria-label="Share by email" href={`mailto:?subject=${encodeURIComponent(`${job.title} at IMan Investment`)}&body=${encodeURIComponent(`I thought you might be interested in this role: ${shareUrl}`)}`}><EmailOutlined /></IconButton>
          </Stack></Box>
        </Box>
        <Box component="aside">
          <Paper className="job-apply-card">
            <Typography className="eyebrow" color="secondary.main">Join our team</Typography><Typography variant="h3">Interested in this role?</Typography><Typography color="text.secondary">Share your experience and perspective with our recruiting team.</Typography>
            <Button fullWidth component={Link} to={`/careers/${job.slug || id}/apply`} state={{ jobId: job.id }} variant="contained" size="large" endIcon={<ArrowForward />}>Apply for this position</Button>
            <Divider />
            <Typography variant="body2" color="text.secondary">IMan Investment is committed to a thoughtful, fair and confidential recruitment process.</Typography>
          </Paper>
        </Box>
      </Box>
    </Section>
    <Snackbar open={!!shareNotice} autoHideDuration={4500} message={shareNotice} onClose={() => setShareNotice('')} />
  </Box>
}
