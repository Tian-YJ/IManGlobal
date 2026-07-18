import { useEffect, useRef, useState } from 'react'
import {
  ArrowForward, BarChartOutlined, CreateOutlined, InsightsOutlined, Memory,
  MonitorHeartOutlined, Pause, PlayArrow, Public, ShoppingBagOutlined, SpaOutlined, VolumeOff, VolumeUp,
} from '@mui/icons-material'
import { Box, Button, Card, CardContent, IconButton, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { Eyebrow, Section } from '../../components/common'
import heroHongKong from '../../assets/images/home/hero-hongkong.jpg'
import insightsOffice from '../../assets/images/home/insights-office.jpg'
import portfolioAi from '../../assets/images/home/portfolio-ai.jpg'
import portfolioHealth from '../../assets/images/home/portfolio-health.jpg'
import portfolioFintech from '../../assets/images/home/portfolio-fintech.jpg'
import portfolioConsumer from '../../assets/images/home/portfolio-consumer.jpg'
import portfolioClimate from '../../assets/images/home/portfolio-climate.jpg'
import './public-home.css'

const focus = [
  [<Memory key="tech" />, 'Technology'],
  [<MonitorHeartOutlined key="health" />, 'Healthcare'],
  [<ShoppingBagOutlined key="consumer" />, 'Consumer'],
  [<InsightsOutlined key="fintech" />, 'Fintech'],
  [<Public key="enterprise" />, 'Enterprise'],
  [<SpaOutlined key="sustainability" />, 'Sustainability'],
]

const portfolio = [
  ['AI Startup', 'Enterprise AI Platform', portfolioAi],
  ['HealthTech Co.', 'Digital Healthcare', portfolioHealth],
  ['Fintech Innovate', 'Next-gen Banking', portfolioFintech],
  ['Consumer Brand', 'DTC Lifestyle Brand', portfolioConsumer, 'mono'],
  ['Climate Tech', 'Clean Energy Solution', portfolioClimate],
]

const features = [
  [<BarChartOutlined key="early" />, 'Early-Stage Focus', 'We invest in pre-seed and seed-stage companies with high growth potential.'],
  [<Public key="global" />, 'Global Perspective', 'With a global network and local insight, we help founders scale beyond borders.'],
  [<CreateOutlined key="hands" />, 'Hands-On Support', 'Beyond capital, we provide operational support and strategic advice to drive long-term success.'],
]

function PromoFilm() {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.play().catch(() => setPlaying(false))
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play()
    else video.pause()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setMuted(video.muted)
  }

  return <Box className="promo-film">
    <Box className="promo-film__stage">
      <video
        ref={videoRef}
        className="promo-film__video"
        src="/videos/iman-promo.mp4"
        poster={heroHongKong}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
      <Box className="promo-film__shade" />
      <Box className="promo-film__copy">
        <Eyebrow light>IMan Film</Eyebrow>
        <Typography variant="h2">Build something the world cannot ignore.</Typography>
        <Typography>
          A short look at the energy of founders, cities and ideas we back — made for the next generation of builders.
        </Typography>
        <Stack direction="row" gap={1.5} className="promo-film__actions">
          <Button component={Link} to="/submit-business-plan" variant="contained" endIcon={<ArrowForward />}>
            Pitch your company
          </Button>
          <IconButton aria-label={playing ? 'Pause film' : 'Play film'} onClick={togglePlay} className="promo-film__control">
            {playing ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton aria-label={muted ? 'Unmute film' : 'Mute film'} onClick={toggleMute} className="promo-film__control">
            {muted ? <VolumeOff /> : <VolumeUp />}
          </IconButton>
        </Stack>
      </Box>
    </Box>
  </Box>
}

export default function HomePage() {
  return <Box className="home-page">
    <Box className="home-hero" style={{ '--hero-image': `url(${heroHongKong})` }}>
      <Box className="home-hero__media" role="img" aria-label="Hong Kong Central skyline with IFC and Victoria Peak" />
      <Box className="home-hero__copy">
        <Typography variant="h1">We Back Visionaries.<br />We Build Tomorrow.</Typography>
        <Typography className="lead">
          IMan Investment is a Hong Kong-based venture capital firm focused on early-stage investments in innovative companies with global potential.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} gap={2}>
          <Button component={Link} to="/submit-business-plan" variant="contained" endIcon={<ArrowForward />}>Submit Business Plan</Button>
          <Button component={Link} to="/portfolio" variant="outlined" endIcon={<ArrowForward />}>Explore Portfolio</Button>
        </Stack>
      </Box>
    </Box>

    <PromoFilm />

    <Section className="what-we-do">
      <Box className="home-section-intro">
        <Typography variant="h3">What We Do</Typography>
        <Typography color="text.secondary">
          We partner with exceptional entrepreneurs from the earliest stages, providing capital, strategic guidance, and global resources.
        </Typography>
      </Box>
      <Box className="three-grid feature-row">
        {features.map(([icon, title, text]) => (
          <Box key={title} className="home-feature">
            <Box className="round-icon">{icon}</Box>
            <Typography variant="h4">{title}</Typography>
            <Typography color="text.secondary">{text}</Typography>
          </Box>
        ))}
      </Box>
    </Section>

    <Box className="focus-strip">
      <Typography variant="h3">Industries We Focus On</Typography>
      <Box>{focus.map(([icon, label]) => <span key={label}>{icon}{label}</span>)}</Box>
    </Box>

    <Section className="home-portfolio">
      <Stack direction="row" justifyContent="space-between" alignItems="end" mb={4} className="home-section-head">
        <Typography variant="h3">Featured Portfolio</Typography>
        <Button component={Link} to="/portfolio" endIcon={<ArrowForward />}>View all portfolio</Button>
      </Stack>
      <Box className="portfolio-grid">
        {portfolio.map(([name, sector, image, tone]) => (
          <Card key={name} className="home-portfolio-card">
            <Box
              className={`home-portfolio-card__image${tone === 'mono' ? ' home-portfolio-card__image--mono' : ''}`}
              style={{ backgroundImage: `url(${image})` }}
            />
            <CardContent>
              <Typography variant="h4">{name}</Typography>
              <Typography color="text.secondary">{sector}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Section>

    <Section className="insight-band">
      <Box className="split home-insights">
        <Box>
          <Eyebrow>Insights</Eyebrow>
          <Typography variant="h2" mt={2}>Ideas that move industries forward.</Typography>
          <Button component={Link} to="/insights" variant="contained" sx={{ mt: 4 }} endIcon={<ArrowForward />}>Explore insights</Button>
        </Box>
        <Box
          className="boardroom-art"
          role="img"
          aria-label="Modern office interior"
          style={{ '--boardroom-image': `url(${insightsOffice})` }}
        />
      </Box>
    </Section>

    <Section className="home-cta">
      <Typography variant="h2">Let&apos;s build the future together.</Typography>
      <Typography color="text.secondary" mt={2}>
        Partner with IMan Investment to turn bold ideas into enduring companies.
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="center" gap={2} mt={4}>
        <Button component={Link} to="/submit-business-plan" variant="contained" endIcon={<ArrowForward />}>Submit Business Plan</Button>
        <Button component={Link} to="/careers" variant="outlined" endIcon={<ArrowForward />}>Explore Careers</Button>
      </Stack>
    </Section>
  </Box>
}
