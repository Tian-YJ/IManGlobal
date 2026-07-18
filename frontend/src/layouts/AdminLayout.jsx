import { useEffect, useState } from 'react'
import { Avatar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography } from '@mui/material'
import { Logout, Menu, NotificationsOutlined } from '@mui/icons-material'
import { Link, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { adminNav } from '../config/navigation'
import { Brand } from './PublicLayout'
import { AuthProvider, useAuth } from '../hooks/useAuth'

const permissions = {
  '/admin': 'dashboard.view', '/admin/business-plans': 'business_plans.manage', '/admin/portfolio': 'portfolio.manage',
  '/admin/jobs': 'jobs.manage', '/admin/applicants': 'applicants.manage', '/admin/cms': 'cms.manage',
  '/admin/cms/pages': 'cms.manage', '/admin/cms/insights': 'cms.manage', '/admin/cms/team': 'cms.manage',
  '/admin/contact-messages': 'cms.manage',
  '/admin/media': 'media.manage', '/admin/users': 'users.manage', '/admin/roles': 'roles.manage',
  '/admin/permissions': 'roles.manage', '/admin/audit-logs': 'audit.view', '/admin/settings': 'settings.manage',
}

export function AdminGuard() {
  const [authorized, setAuthorized] = useState(!!localStorage.getItem('iman_access_token'))
  useEffect(() => {
    const unauthorized = () => setAuthorized(false)
    window.addEventListener('iman:unauthorized', unauthorized)
    return () => window.removeEventListener('iman:unauthorized', unauthorized)
  }, [])
  return authorized ? <AuthProvider><Outlet /></AuthProvider> : <Navigate to="/admin/login" replace />
}

function Shell({ children }) {
  const [mobile, setMobile] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, can } = useAuth()
  const visibleNav = adminNav.filter(([, to]) => !permissions[to] || can(permissions[to]))
  const drawer = <Box className="admin-drawer"><Box className="admin-brand"><Brand light /></Box><List>{visibleNav.map(([label, to, icon]) => <ListItemButton key={to} component={Link} to={to} selected={to === '/admin' ? location.pathname === to : location.pathname === to || (to !== '/admin/cms' && location.pathname.startsWith(`${to}/`))} onClick={() => setMobile(false)}><ListItemIcon>{icon}</ListItemIcon><ListItemText primary={label} /></ListItemButton>)}</List><Divider /><ListItemButton onClick={() => { localStorage.removeItem('iman_access_token'); navigate('/admin/login') }}><ListItemIcon><Logout /></ListItemIcon><ListItemText primary="Sign out" /></ListItemButton></Box>
  const pageTitle = adminNav.find(([, to]) => to === location.pathname)?.[0] || 'Administration'
  return <Box className="admin-shell"><Box className="admin-desktop-drawer">{drawer}</Box><Drawer open={mobile} onClose={() => setMobile(false)} PaperProps={{ sx: { width: 270 } }}>{drawer}</Drawer><Box className="admin-main"><Toolbar className="admin-toolbar"><IconButton onClick={() => setMobile(true)} className="mobile-menu"><Menu /></IconButton><Box><Typography fontWeight={700}>{pageTitle}</Typography><Typography variant="caption" color="text.secondary">IMan Investment</Typography></Box><Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}><Tooltip title="Notifications"><IconButton component={Link} to="/admin/notifications"><NotificationsOutlined /></IconButton></Tooltip><Avatar>{user?.firstName?.[0] || 'I'}</Avatar></Box></Toolbar><Box className="admin-content">{children || <Outlet />}</Box></Box></Box>
}

export default function AdminLayout({ children }) { return <Shell>{children}</Shell> }
