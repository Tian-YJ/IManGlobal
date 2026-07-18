import { lazy, Suspense } from 'react'
import { Box, Button, CircularProgress, Typography } from '@mui/material'
import { Link, Route, Routes } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout, { AdminGuard } from './layouts/AdminLayout'
import HomePage from './pages/public/HomePage'
import { AboutPage, InvestmentPage } from './pages/public/CompanyPages'
import { CareersPage, InsightDetailPage, InsightsPage, JobDetailPage, PortfolioPage, TeamPage } from './pages/public/ContentPages'
import { ApplyPage, BusinessPlanPage, ContactPage, LegalPage } from './pages/public/FormPages'
import { LoginPage } from './pages/admin/AdminPages'
import { Section } from './components/common'

const AdminPages = lazy(() => import('./pages/admin/AdminRoutes'))

function Loading() { return <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box> }
function NotFound() { return <Section><Box textAlign="center" py={10}><Typography variant="h1">404</Typography><Typography variant="h4">This page could not be found.</Typography><Button component={Link} to="/" variant="contained" sx={{ mt: 4 }}>Return home</Button></Box></Section> }

export default function App() {
  return <Suspense fallback={<Loading />}><Routes>
    <Route element={<PublicLayout />}>
      <Route index element={<HomePage />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="investment" element={<InvestmentPage />} />
      <Route path="portfolio" element={<PortfolioPage />} />
      <Route path="insights" element={<InsightsPage />} />
      <Route path="insights/:id" element={<InsightDetailPage />} />
      <Route path="team" element={<TeamPage />} />
      <Route path="careers" element={<CareersPage />} />
      <Route path="careers/:id" element={<JobDetailPage />} />
      <Route path="careers/:id/apply" element={<ApplyPage />} />
      <Route path="submit-business-plan" element={<BusinessPlanPage />} />
      <Route path="contact" element={<ContactPage />} />
      <Route path="privacy" element={<LegalPage slug="privacy-policy" />} />
      <Route path="terms" element={<LegalPage slug="terms-of-use" />} />
      <Route path="*" element={<NotFound />} />
    </Route>
    <Route path="/admin/login" element={<LoginPage />} />
    <Route element={<AdminGuard />}><Route path="/admin/*" element={<AdminLayout><AdminPages /></AdminLayout>} /></Route>
  </Routes></Suspense>
}
