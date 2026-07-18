import {
  ArticleOutlined, AssessmentOutlined, BusinessCenterOutlined, DashboardOutlined,
  DescriptionOutlined, GroupOutlined, ImageOutlined, InboxOutlined, KeyOutlined,
  LightbulbOutlined, NotificationsOutlined, PeopleOutlined, SecurityOutlined,
  SettingsOutlined, WorkOutlined,
} from '@mui/icons-material'

export const publicNav = [
  ['Home', '/'],
  ['About Us', '/about'],
  ['Investment', '/investment'],
  ['Portfolio', '/portfolio'],
  ['Team', '/team'],
  ['Insights', '/insights'],
  ['Careers', '/careers'],
]

export const adminNav = [
  ['Dashboard', '/admin', <DashboardOutlined />],
  ['Business Plans', '/admin/business-plans', <DescriptionOutlined />],
  ['Portfolio', '/admin/portfolio', <BusinessCenterOutlined />],
  ['Job Management', '/admin/jobs', <WorkOutlined />],
  ['Applicants', '/admin/applicants', <PeopleOutlined />],
  ['CMS Overview', '/admin/cms', <ArticleOutlined />],
  ['CMS Pages', '/admin/cms/pages', <DescriptionOutlined />],
  ['Insights', '/admin/cms/insights', <LightbulbOutlined />],
  ['Team', '/admin/cms/team', <GroupOutlined />],
  ['Contact Inbox', '/admin/contact-messages', <InboxOutlined />],
  ['Media Library', '/admin/media', <ImageOutlined />],
  ['Users', '/admin/users', <GroupOutlined />],
  ['Roles', '/admin/roles', <SecurityOutlined />],
  ['Permissions', '/admin/permissions', <KeyOutlined />],
  ['Audit Logs', '/admin/audit-logs', <AssessmentOutlined />],
  ['Settings', '/admin/settings', <SettingsOutlined />],
  ['Notifications', '/admin/notifications', <NotificationsOutlined />],
]
