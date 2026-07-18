import { Route, Routes } from 'react-router-dom'
import {
  ApplicantDetailPage, ApplicantsPage, AuditLogsPage, BusinessPlanDetailPage,
  BusinessPlansPage, CmsHubPage, ContactsPage, CrudPage, DashboardPage, MediaPage,
  NotificationsPage, ResourceDetailPage, RolesPage, SettingsPage, UsersPage,
} from './AdminPages'

export default function AdminRoutes() {
  return <Routes>
    <Route index element={<DashboardPage />} />
    <Route path="business-plans" element={<BusinessPlansPage />} />
    <Route path="business-plans/:id" element={<BusinessPlanDetailPage />} />
    <Route path="portfolio" element={<CrudPage resource="portfolio" />} />
    <Route path="portfolio/:id" element={<ResourceDetailPage resource="portfolio" />} />
    <Route path="jobs" element={<CrudPage resource="jobs" />} />
    <Route path="jobs/:id" element={<ResourceDetailPage resource="jobs" />} />
    <Route path="applicants" element={<ApplicantsPage />} />
    <Route path="applicants/:id" element={<ApplicantDetailPage />} />
    <Route path="cms" element={<CmsHubPage />} />
    <Route path="cms/pages" element={<CrudPage resource="cms" />} />
    <Route path="cms/insights" element={<CrudPage resource="insights" />} />
    <Route path="cms/team" element={<CrudPage resource="team" />} />
    <Route path="contact-messages" element={<ContactsPage />} />
    <Route path="media" element={<MediaPage />} />
    <Route path="users" element={<UsersPage />} />
    <Route path="roles" element={<RolesPage />} />
    <Route path="permissions" element={<CrudPage resource="permissions" />} />
    <Route path="audit-logs" element={<AuditLogsPage />} />
    <Route path="settings" element={<SettingsPage />} />
    <Route path="notifications" element={<NotificationsPage />} />
    <Route path="*" element={<DashboardPage />} />
  </Routes>
}
