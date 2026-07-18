import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import {
  Alert, Avatar, Box, Breadcrumbs, Button, Checkbox, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, Divider, FormControl, FormControlLabel, InputAdornment,
  InputLabel, MenuItem, Paper, Select, Skeleton, Stack, Switch, Tab, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography,
} from '@mui/material'
import {
  Add, ArrowBack, AttachFileOutlined, Check, Close, DownloadOutlined,
  EditOutlined, MarkEmailReadOutlined, OpenInNew, Search, UploadFileOutlined,
} from '@mui/icons-material'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import api, { downloadFile, getList, getOne, getPage } from '../../services/api'
import DashboardChart from '../../DashboardChart'
import { Brand } from '../../layouts/PublicLayout'
import './admin-details.css'

const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED']
const JOB_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED']
const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY']
const PLAN_TRANSITIONS = {
  DRAFT: ['SUBMITTED', 'ARCHIVED'],
  SUBMITTED: ['REVIEWING', 'REJECTED', 'ARCHIVED'],
  REVIEWING: ['APPROVED', 'REJECTED', 'ARCHIVED'],
  APPROVED: ['ARCHIVED', 'REVIEWING'],
  REJECTED: ['ARCHIVED', 'REVIEWING'],
  ARCHIVED: [],
}
const APPLICANT_TRANSITIONS = {
  NEW: ['REVIEWING', 'REJECTED'],
  REVIEWING: ['INTERVIEW', 'REJECTED'],
  INTERVIEW: ['OFFER', 'REJECTED'],
  OFFER: ['HIRED', 'REJECTED'],
  HIRED: [],
  REJECTED: [],
}
const STATUS_COLORS = {
  APPROVED: 'success', HIRED: 'success', PUBLISHED: 'success', ACTIVE: 'success',
  REJECTED: 'error', CLOSED: 'error', ARCHIVED: 'default',
  REVIEWING: 'warning', INTERVIEW: 'warning', OFFER: 'info', SUBMITTED: 'info', NEW: 'info',
}

const errorText = (error) => error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'The request could not be completed.'
const rowsOf = (data) => Array.isArray(data) ? data : data?.content || []
const fmtDate = (value) => value ? new Date(value).toLocaleString() : '—'
const fmtMoney = (value) => value == null ? '—' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
const fmtSize = (value) => value == null ? '—' : value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`
const titleCase = (value = '') => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase())
const displayText = (value) => value == null || value === '' ? '—' : value

async function getResourceById(endpoint, id) {
  return getOne(`${endpoint}/${id}`)
}

function DetailBreadcrumbs({ section, to, current }) {
  return <Breadcrumbs className="detail-breadcrumbs" aria-label="Breadcrumb">
    <Link to="/admin">Admin</Link><Link to={to}>{section}</Link><Typography>{current}</Typography>
  </Breadcrumbs>
}

export function AdminTitle({ title, text, action, back }) {
  return <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-start' }} gap={2} className="admin-page-title">
    <Stack direction="row" gap={1.5} alignItems="flex-start">
      {back && <Tooltip title="Back"><Button component={Link} to={back} className="back-button"><ArrowBack /></Button></Tooltip>}
      <Box><Typography variant="h3">{title}</Typography>{text && <Typography color="text.secondary">{text}</Typography>}</Box>
    </Stack>
    {action && <Box className="admin-page-action">{action}</Box>}
  </Stack>
}

export function LoginPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors } } = useForm()
  const mutation = useMutation({ mutationFn: (values) => api.post('/auth/login', values).then((r) => r.data), onSuccess: (data) => { localStorage.setItem('iman_access_token', data.token); navigate('/admin') } })
  return <Box className="login-page"><Box className="login-visual"><Brand light /><Typography variant="h2">Stewarding<br />enduring value.</Typography><Typography>Administration Portal · Hong Kong</Typography></Box><Box className="login-form"><Paper component="form" onSubmit={handleSubmit((v) => mutation.mutate(v))}><Typography variant="h3">Welcome back</Typography><Typography color="text.secondary">Sign in with your IMan account.</Typography><TextField label="Email" type="email" error={!!errors.email} helperText={errors.email && 'Email is required'} {...register('email', { required: true })} /><TextField label="Password" type="password" error={!!errors.password} helperText={errors.password && 'Password is required'} {...register('password', { required: true })} />{mutation.isError && <Alert severity="error">{errorText(mutation.error)}</Alert>}<Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Signing in…' : 'Sign in'}</Button><Button component={Link} to="/">Return to website</Button></Paper></Box></Box>
}

function StatusChip({ value }) {
  return value ? <Chip size="small" color={STATUS_COLORS[value] || 'default'} variant={['ARCHIVED', 'DRAFT'].includes(value) ? 'outlined' : 'filled'} label={titleCase(value)} /> : <Typography color="text.secondary">—</Typography>
}

function QueryState({ query, empty = 'No records found.', colSpan = 1 }) {
  if (query.isLoading) return <TableRow><TableCell colSpan={colSpan}><Skeleton height={36} /></TableCell></TableRow>
  if (query.isError) return <TableRow><TableCell colSpan={colSpan}><Alert severity="error">{errorText(query.error)}</Alert></TableCell></TableRow>
  if (!rowsOf(query.data).length) return <TableRow><TableCell colSpan={colSpan} align="center"><Box py={5}><Typography fontWeight={700}>{empty}</Typography><Typography variant="body2" color="text.secondary">Try changing the current filters.</Typography></Box></TableCell></TableRow>
  return null
}

function Feedback({ mutation, success = 'Changes saved successfully.' }) {
  if (mutation.isError) return <Alert severity="error" onClose={() => mutation.reset()}>{errorText(mutation.error)}</Alert>
  if (mutation.isSuccess) return <Alert severity="success" onClose={() => mutation.reset()}>{success}</Alert>
  return null
}

function ConfirmDialog({ open, title = 'Delete record?', text = 'This action cannot be undone.', pending, onClose, onConfirm }) {
  return <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth><DialogTitle>{title}</DialogTitle><DialogContent><Typography color="text.secondary">{text}</Typography></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button color="error" variant="contained" disabled={pending} onClick={onConfirm}>{pending ? 'Deleting…' : 'Delete'}</Button></DialogActions></Dialog>
}

function Pager({ data, page, setPage }) {
  if (!data || Array.isArray(data) || data.totalPages <= 1) return null
  return <Stack direction="row" justifyContent="space-between" alignItems="center" className="table-pager">
    <Typography variant="body2" color="text.secondary">{data.totalElements} records · Page {page + 1} of {data.totalPages}</Typography>
    <Stack direction="row" gap={1}><Button size="small" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button><Button size="small" disabled={page + 1 >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button></Stack>
  </Stack>
}

function Filters({ search, setSearch, status, setStatus, statuses, children }) {
  return <Paper className="table-filters"><TextField value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search records" InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }} />
    {statuses && <TextField select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="">All statuses</MenuItem>{statuses.map((x) => <MenuItem key={x} value={x}>{titleCase(x)}</MenuItem>)}</TextField>}
    {children}
  </Paper>
}

function activityLabel(item) {
  const action = titleCase(item.action || 'Updated')
  const module = item.module ? titleCase(item.module.replaceAll('_', ' ')) : 'Platform'
  if (item.module === 'business_plans' && item.action === 'CREATE') return 'New BP submitted'
  if (item.module === 'jobs' && item.action === 'CREATE') return 'New application received'
  if (item.module === 'applicants' && item.action === 'CREATE') return 'New application received'
  if (item.module === 'cms' && item.action === 'CREATE') return 'New content published'
  return `${action} ${module}`
}

export function DashboardPage() {
  const query = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: () => getOne('/admin/dashboard') })
  const activity = useQuery({ queryKey: ['admin', 'dashboard-activity'], queryFn: () => getPage('/admin/audit-logs', { page: 0, size: 5, sort: 'createdAt', direction: 'desc' }) })
  const stats = query.data || {}
  const cards = [
    ['Business Plans', stats.totalBusinessPlans, `${stats.reviewingBusinessPlans || 0} in review`],
    ['Open Roles', stats.openJobs, 'Published opportunities'],
    ['Applicants', stats.totalApplicants, `${stats.newApplicants || 0} new`],
    ['Portfolio', stats.activePortfolio, 'Published companies'],
    ['Interviewing', stats.interviewingApplicants, 'Active interviews'],
    ['Hired', stats.hiredApplicants, 'Successful placements'],
  ]
  const applicantOption = {
    tooltip: { trigger: 'axis' },
    grid: { left: 36, right: 18, top: 28, bottom: 28 },
    xAxis: { type: 'category', data: Object.keys(stats.applicantStatusCounts || {}).map(titleCase) },
    yAxis: { type: 'value', minInterval: 1 },
    series: [{ type: 'bar', data: Object.values(stats.applicantStatusCounts || {}), itemStyle: { color: '#1a4b7a', borderRadius: [4, 4, 0, 0] }, barMaxWidth: 42 }],
  }
  const planOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, icon: 'circle', textStyle: { fontSize: 11 } },
    color: ['#1a4b7a', '#38bdf8', '#f59e0b', '#ef4444', '#94a3b8', '#cbd5e1'],
    series: [{ type: 'pie', radius: ['46%', '72%'], data: Object.entries(stats.businessPlanStatusCounts || {}).map(([name, value]) => ({ name: titleCase(name), value })), itemStyle: { borderColor: '#fff', borderWidth: 2 } }],
  }

  return <>
    <AdminTitle title="Dashboard" text="A live view of investments, talent and operating activity." />
    {query.isError && <Alert severity="error">{errorText(query.error)}</Alert>}
    <Box className="three-grid admin-dashboard-cards">
      {cards.map(([label, value, hint]) => <Paper key={label} className="admin-dashboard-card">
        <Typography className="metric-label">{label}</Typography>
        {query.isLoading ? <Skeleton height={34} /> : <Typography variant="h3">{value ?? '—'}</Typography>}
        <Typography variant="body2" color="text.secondary">{hint}</Typography>
      </Paper>)}
    </Box>
    <Box className="admin-dashboard-grid">
      <Paper><Typography variant="h5">Applicant pipeline</Typography><Typography variant="body2" color="text.secondary" mb={1}>Candidates by current stage</Typography>{query.isLoading ? <Skeleton height={280} /> : <DashboardChart option={applicantOption} height={280} />}</Paper>
      <Paper><Typography variant="h5">Investment pipeline</Typography><Typography variant="body2" color="text.secondary" mb={1}>Current business-plan stages</Typography>{query.isLoading ? <Skeleton height={280} /> : <DashboardChart option={planOption} height={280} />}</Paper>
    </Box>
    <Paper sx={{ mt: 2.25, p: 2.5 }}>
      <Typography variant="h5">Recent activity</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Latest administrative events across the platform.</Typography>
      {activity.isLoading ? <Skeleton height={220} /> : activity.isError ? <Alert severity="error">{errorText(activity.error)}</Alert> : !rowsOf(activity.data).length ? <Typography color="text.secondary">No recent activity recorded.</Typography> : <Stack gap={1.25}>{rowsOf(activity.data).map((item) => <Paper key={item.id} variant="outlined" sx={{ p: 1.5 }}><Typography fontWeight={700}>{activityLabel(item)}</Typography><Typography variant="body2" color="text.secondary">{item.details || item.entityType} · {fmtDate(item.createdAt)}</Typography></Paper>)}</Stack>}
    </Paper>
  </>
}

function DataTable({ columns, rows, onEdit, onDelete, onReview, query, empty }) {
  return <TableContainer component={Paper}><Table size="small"><TableHead><TableRow>{columns.map((x) => <TableCell key={x.key}>{x.label}</TableCell>)}<TableCell align="right">Actions</TableCell></TableRow></TableHead><TableBody><QueryState query={query} empty={empty} colSpan={columns.length + 1} />{rows.map((row) => <TableRow key={row.id} hover>{columns.map((col) => <TableCell key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}</TableCell>)}<TableCell align="right"><Stack direction="row" justifyContent="flex-end"><Tooltip title={onReview ? 'Review' : 'Edit'}><Button size="small" onClick={() => (onReview || onEdit)(row)}>{onReview ? 'Review' : <EditOutlined fontSize="small" />}</Button></Tooltip>{onDelete && <Tooltip title="Delete"><Button size="small" color="error" onClick={() => onDelete(row)}><Close fontSize="small" /></Button></Tooltip>}</Stack></TableCell></TableRow>)}</TableBody></Table></TableContainer>
}

const CRUD = {
  portfolio: {
    title: 'Portfolio', endpoint: '/admin/portfolio', statuses: CONTENT_STATUSES,
    columns: [{ key: 'name', label: 'Company', render: (v, r) => <Box><Typography fontWeight={700}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.website || 'No website'}</Typography></Box> }, { key: 'industry', label: 'Industry' }, { key: 'featured', label: 'Featured', render: (v) => v ? 'Yes' : 'No' }, { key: 'displayOrder', label: 'Order' }, { key: 'status', label: 'Status', render: (v) => <StatusChip value={v} /> }],
    fields: [['name', 'Company name', 'text', true], ['industry', 'Industry'], ['description', 'Description', 'multiline'], ['website', 'Website URL', 'url'], ['imageUrl', 'Image URL', 'url'], ['displayOrder', 'Display order', 'number'], ['featured', 'Featured', 'boolean'], ['status', 'Status', 'select', false, CONTENT_STATUSES]],
  },
  jobs: {
    title: 'Job Management', endpoint: '/admin/jobs', statuses: JOB_STATUSES,
    columns: [{ key: 'title', label: 'Role', render: (v, r) => <Box><Typography fontWeight={700}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.type && titleCase(r.type)}</Typography></Box> }, { key: 'department', label: 'Department' }, { key: 'location', label: 'Location' }, { key: 'datePosted', label: 'Posted' }, { key: 'status', label: 'Status', render: (v) => <StatusChip value={v} /> }],
    fields: [['title', 'Title', 'text', true], ['slug', 'Slug'], ['department', 'Department'], ['location', 'Location'], ['type', 'Employment type', 'select', true, JOB_TYPES], ['status', 'Status', 'select', false, JOB_STATUSES], ['description', 'Description', 'multiline'], ['responsibilities', 'Responsibilities', 'multiline'], ['requirements', 'Requirements', 'multiline'], ['benefits', 'Benefits', 'multiline'], ['experience', 'Experience'], ['education', 'Education'], ['salaryMin', 'Minimum salary', 'number'], ['salaryMax', 'Maximum salary', 'number'], ['metaTitle', 'Meta title'], ['metaDescription', 'Meta description', 'multiline']],
  },
  cms: {
    title: 'CMS Pages', endpoint: '/admin/cms/pages', statuses: CONTENT_STATUSES,
    columns: [{ key: 'title', label: 'Page', render: (v, r) => <Box><Typography fontWeight={700}>{v}</Typography><Typography variant="caption" color="text.secondary">/{r.slug}</Typography></Box> }, { key: 'publishedAt', label: 'Published' }, { key: 'updatedAt', label: 'Updated', render: fmtDate }, { key: 'status', label: 'Status', render: (v) => <StatusChip value={v} /> }],
    fields: [['title', 'Title', 'text', true], ['slug', 'Slug', 'text', true], ['content', 'Page content', 'multiline'], ['metaTitle', 'Meta title'], ['metaDescription', 'Meta description', 'multiline'], ['status', 'Status', 'select', false, CONTENT_STATUSES], ['publishedAt', 'Publish date', 'date']],
  },
  insights: {
    title: 'Insights', endpoint: '/admin/cms/insights', statuses: CONTENT_STATUSES,
    columns: [{ key: 'title', label: 'Insight', render: (v, r) => <Box><Typography fontWeight={700}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.author || 'No author'}</Typography></Box> }, { key: 'publishedDate', label: 'Published' }, { key: 'status', label: 'Status', render: (v) => <StatusChip value={v} /> }],
    fields: [['title', 'Title', 'text', true], ['slug', 'Slug'], ['author', 'Author'], ['excerpt', 'Excerpt', 'multiline'], ['content', 'Article content', 'multiline'], ['imageUrl', 'Image URL', 'url'], ['publishedDate', 'Publish date', 'date'], ['status', 'Status', 'select', false, CONTENT_STATUSES]],
  },
  team: {
    title: 'Team Management', endpoint: '/admin/cms/team', statuses: CONTENT_STATUSES,
    columns: [{ key: 'fullName', label: 'Team member', render: (v, r) => <Stack direction="row" gap={1.2} alignItems="center"><Avatar src={r.imageUrl}>{v?.[0]}</Avatar><Box><Typography fontWeight={700}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.role}</Typography></Box></Stack> }, { key: 'displayOrder', label: 'Order' }, { key: 'status', label: 'Status', render: (v) => <StatusChip value={v} /> }],
    fields: [['fullName', 'Full name', 'text', true], ['role', 'Role / title', 'text', true], ['bio', 'Biography', 'multiline'], ['imageUrl', 'Image URL', 'url'], ['linkedinUrl', 'LinkedIn URL', 'url'], ['displayOrder', 'Display order', 'number'], ['status', 'Status', 'select', false, CONTENT_STATUSES]],
  },
  permissions: {
    title: 'Permissions', endpoint: '/admin/permissions', array: true,
    columns: [{ key: 'code', label: 'Code', render: (v) => <Chip size="small" label={v} variant="outlined" /> }, { key: 'name', label: 'Name' }, { key: 'module', label: 'Module' }, { key: 'description', label: 'Description' }],
    fields: [['code', 'Permission code', 'text', true], ['name', 'Name', 'text', true], ['module', 'Module'], ['description', 'Description', 'multiline']],
  },
}

function normalizePayload(fields, values) {
  const result = { ...values }
  fields.forEach(([key, , type]) => {
    if (type === 'number') result[key] = result[key] === '' || result[key] == null ? null : Number(result[key])
    if (type === 'boolean') result[key] = !!result[key]
  })
  return result
}

function ResourceEditor({ open, config, item, onClose, onSave, pending, options = {} }) {
  const { register, control, handleSubmit, reset, formState: { errors } } = useForm()
  useEffect(() => reset(item || {}), [item, open, reset])
  return <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth><DialogTitle>{item ? 'Edit' : 'Create'} {config.title.replace('Management', '').trim()}</DialogTitle><Box component="form" onSubmit={handleSubmit((values) => onSave(normalizePayload(config.fields, values)))}><DialogContent dividers><Box className="editor-grid">{config.fields.map(([key, label, type = 'text', required, values]) => {
    if (type === 'boolean') return <FormControlLabel key={key} control={<Controller name={key} control={control} defaultValue={false} render={({ field }) => <Switch checked={!!field.value} onChange={(_, checked) => field.onChange(checked)} />} />} label={label} />
    if (type === 'multi') return <FormControl key={key} size="small" error={!!errors[key]}><InputLabel>{label}</InputLabel><Controller name={key} control={control} defaultValue={[]} render={({ field }) => <Select {...field} multiple label={label} renderValue={(selected) => selected.map((id) => options[key]?.find((x) => x.id === id)?.name || id).join(', ')}>{(options[key] || []).map((x) => <MenuItem key={x.id} value={x.id}><Checkbox checked={(field.value || []).includes(x.id)} />{x.name}</MenuItem>)}</Select>} /></FormControl>
    return <TextField key={key} label={label} type={type === 'date' ? 'date' : type} select={type === 'select'} multiline={type === 'multiline'} rows={type === 'multiline' ? (key === 'content' ? 9 : 4) : undefined} InputLabelProps={type === 'date' ? { shrink: true } : undefined} error={!!errors[key]} helperText={errors[key] && `${label} is required`} {...register(key, { required })}>{type === 'select' && values.map((x) => <MenuItem key={x} value={x}>{titleCase(x)}</MenuItem>)}</TextField>
  })}</Box></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="contained" disabled={pending}>{pending ? 'Saving…' : 'Save changes'}</Button></DialogActions></Box></Dialog>
}

export function CrudPage({ resource }) {
  const config = CRUD[resource]
  const qc = useQueryClient()
  const navigate = useNavigate()
  const dedicated = resource === 'portfolio' || resource === 'jobs'
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const params = { page, size: 20, sort: 'createdAt', direction: 'desc', ...(search && { search }), ...(status && { status }) }
  const query = useQuery({ queryKey: ['admin', resource, params], queryFn: () => config.array ? getList(config.endpoint) : getPage(config.endpoint, params) })
  const mutation = useMutation({ mutationFn: ({ id, values }) => id ? api.put(`${config.endpoint}/${id}`, values) : api.post(config.endpoint, values), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', resource] }); setEditing(null) } })
  const remove = useMutation({ mutationFn: (id) => api.delete(`${config.endpoint}/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', resource] }); setDeleting(null) } })
  let rows = rowsOf(query.data)
  if (config.array && search) rows = rows.filter((row) => Object.values(row).some((value) => String(value || '').toLowerCase().includes(search.toLowerCase())))
  return <><AdminTitle title={config.title} text={`Create, publish and maintain ${config.title.toLowerCase()}.`} action={<Button size="small" variant="contained" startIcon={<Add />} onClick={() => dedicated ? navigate(`/admin/${resource}/new`) : setEditing({})}>Add new</Button>} />
    <Feedback mutation={mutation} /><Feedback mutation={remove} success="Record deleted." />
    <Filters search={search} setSearch={(v) => { setSearch(v); setPage(0) }} status={status} setStatus={(v) => { setStatus(v); setPage(0) }} statuses={config.statuses} />
    <DataTable columns={config.columns} rows={rows} query={{ ...query, data: rows }} onEdit={(row) => dedicated ? navigate(`/admin/${resource}/${row.id}`, { state: { item: row } }) : setEditing(row)} onDelete={setDeleting} />
    <Pager data={query.data} page={page} setPage={setPage} />
    {!dedicated && <ResourceEditor open={editing !== null} config={config} item={editing?.id ? editing : null} pending={mutation.isPending} onClose={() => setEditing(null)} onSave={(values) => mutation.mutate({ id: editing?.id, values })} />}
    <ConfirmDialog open={!!deleting} pending={remove.isPending} title={`Delete ${deleting?.name || deleting?.title || 'record'}?`} onClose={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.id)} />
  </>
}

const RESOURCE_GROUPS = {
  portfolio: [
    ['Company information', 'Core identity and public-facing portfolio information.', ['name', 'industry', 'description']],
    ['Media & links', 'Approved imagery and the company’s external destination.', ['imageUrl', 'website']],
    ['Publishing', 'Control placement and visibility on the public portfolio.', ['featured', 'displayOrder', 'status']],
  ],
  jobs: [
    ['Role overview', 'Core information candidates see at the top of the role.', ['title', 'slug', 'department', 'location', 'type', 'status']],
    ['Job description', 'Describe the mandate and day-to-day scope of the position.', ['description']],
    ['Responsibilities', 'List the principal outcomes and accountabilities.', ['responsibilities']],
    ['Requirements', 'Document required experience, education and capabilities.', ['requirements', 'experience', 'education']],
    ['Compensation & benefits', 'Add the supported salary range and benefits summary.', ['salaryMin', 'salaryMax', 'benefits']],
    ['Search presentation', 'Control the title and description used by search engines.', ['metaTitle', 'metaDescription']],
  ],
}

function FullPageField({ field, register, control, errors }) {
  const [key, label, type = 'text', required, values] = field
  if (type === 'boolean') return <FormControlLabel className="detail-switch" control={<Controller name={key} control={control} defaultValue={false} render={({ field: input }) => <Switch checked={!!input.value} onChange={(_, checked) => input.onChange(checked)} />} />} label={<Box><Typography fontWeight={700}>{label}</Typography><Typography variant="caption" color="text.secondary">Show this company in featured portfolio placements.</Typography></Box>} />
  return <TextField className={type === 'multiline' ? 'field-wide' : ''} label={label} type={type} select={type === 'select'} multiline={type === 'multiline'} minRows={type === 'multiline' ? (['description', 'responsibilities', 'requirements'].includes(key) ? 6 : 4) : undefined} error={!!errors[key]} helperText={errors[key] ? `${label} is required` : undefined} {...register(key, { required })}>
    {type === 'select' && values.map((value) => <MenuItem key={value} value={value}>{titleCase(value)}</MenuItem>)}
  </TextField>
}

export function ResourceDetailPage({ resource }) {
  const config = CRUD[resource]
  const { id } = useParams()
  const isNew = id === 'new'
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [deleting, setDeleting] = useState(false)
  const { register, control, handleSubmit, reset, watch, formState: { errors, isDirty } } = useForm()
  const query = useQuery({
    queryKey: ['admin', resource, 'detail', id],
    queryFn: async () => {
      const item = await getResourceById(config.endpoint, id)
      if (!item) throw new Error(`${config.title.replace('Management', '').trim()} record was not found.`)
      return item
    },
    enabled: !isNew,
    initialData: !isNew ? location.state?.item : undefined,
  })
  const item = query.data
  useEffect(() => {
    if (isNew) reset(resource === 'portfolio' ? { featured: false, displayOrder: 0, status: 'DRAFT' } : { status: 'DRAFT', type: 'FULL_TIME' })
    else if (item) reset(item)
  }, [isNew, item, reset, resource])
  const save = useMutation({
    mutationFn: (values) => api[isNew ? 'post' : 'put'](isNew ? config.endpoint : `${config.endpoint}/${id}`, normalizePayload(config.fields, values)),
    onSuccess: (response) => {
      qc.invalidateQueries({ queryKey: ['admin', resource] })
      if (isNew) navigate(`/admin/${resource}/${response.data.id}`, { replace: true, state: { item: response.data } })
      else reset(response.data)
    },
  })
  const remove = useMutation({
    mutationFn: () => api.delete(`${config.endpoint}/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', resource] }); navigate(`/admin/${resource}`) },
  })
  if (!isNew && query.isLoading) return <Skeleton height={560} />
  if (!isNew && query.isError) return <><DetailBreadcrumbs section={config.title} to={`/admin/${resource}`} current="Unavailable" /><Alert severity="error">{errorText(query.error)}</Alert></>
  const values = watch()
  const name = values.name || values.title || (isNew ? `New ${resource === 'jobs' ? 'job' : 'portfolio company'}` : 'Untitled')
  const groupedFields = Object.fromEntries(config.fields.map((field) => [field[0], field]))
  return <Box className="detail-page">
    <DetailBreadcrumbs section={config.title} to={`/admin/${resource}`} current={isNew ? 'Create' : name} />
    <Box component="form" onSubmit={handleSubmit((valuesToSave) => save.mutate(valuesToSave))}>
      <Box className="detail-heading">
        <Box><Typography variant="overline">{isNew ? 'Create record' : 'Detail & editor'}</Typography><Typography variant="h3">{name}</Typography><Typography color="text.secondary">{resource === 'jobs' ? 'Manage role content, requirements and publishing state.' : 'Manage the company profile, placement and publishing state.'}</Typography></Box>
        <Stack direction="row" alignItems="center" gap={1}><StatusChip value={values.status} />{!isNew && <Typography variant="caption" color="text.secondary">Updated {fmtDate(item?.updatedAt || item?.createdAt)}</Typography>}</Stack>
      </Box>
      <Box className="editor-detail-layout">
        <Stack gap={2}>
          {RESOURCE_GROUPS[resource].map(([title, text, keys]) => <Paper className="detail-section" key={title}>
            <Box className="section-heading"><Typography variant="h5">{title}</Typography><Typography variant="body2" color="text.secondary">{text}</Typography></Box>
            <Box className="detail-form-grid">{keys.map((key) => <FullPageField key={key} field={groupedFields[key]} register={register} control={control} errors={errors} />)}</Box>
          </Paper>)}
        </Stack>
        <Stack gap={2} className="editor-side">
          <Paper className="detail-summary">
            <Typography variant="overline">Record summary</Typography>
            {resource === 'portfolio' ? <>
              <Box className="portfolio-preview" style={values.imageUrl ? { backgroundImage: `linear-gradient(180deg,transparent,rgba(7,23,45,.8)),url("${values.imageUrl}")` } : undefined}><Typography>{name}</Typography></Box>
              <InfoGrid items={[['Industry', displayText(values.industry)], ['Display order', displayText(values.displayOrder)], ['Featured', values.featured ? 'Yes' : 'No'], ['Status', titleCase(values.status || 'DRAFT')]]} />
            </> : <InfoGrid items={[['Department', displayText(values.department)], ['Location', displayText(values.location)], ['Employment', titleCase(values.type || '')], ['Salary', values.salaryMin || values.salaryMax ? `${fmtMoney(values.salaryMin)} – ${fmtMoney(values.salaryMax)}` : 'Not specified'], ['Public slug', values.slug ? `/${values.slug}` : 'Generated by backend'], ['Posted', displayText(item?.datePosted)]]} />}
          </Paper>
          {!isNew && <Paper className="detail-summary"><Typography variant="h6">Record metadata</Typography><InfoGrid items={[['Record ID', id], ['Created', fmtDate(item?.createdAt)], ['Updated', fmtDate(item?.updatedAt)], ['Endpoint', `${config.endpoint}/${id}`]]} /></Paper>}
        </Stack>
      </Box>
      <Paper className="detail-action-bar" elevation={0}>
        <Typography variant="body2" color="text.secondary">{isDirty ? 'You have unsaved changes.' : 'All changes are saved.'}</Typography>
        <Stack direction="row" gap={1}>{!isNew && <Button size="small" color="error" onClick={() => setDeleting(true)}>Delete</Button>}<Button size="small" component={Link} to={`/admin/${resource}`}>Cancel</Button><Button size="small" type="submit" variant="contained" disabled={save.isPending}>{save.isPending ? 'Saving…' : isNew ? 'Create record' : 'Save changes'}</Button></Stack>
      </Paper>
      {save.isError && <Alert severity="error" className="detail-floating-feedback">{errorText(save.error)}</Alert>}
    </Box>
    <ConfirmDialog open={deleting} pending={remove.isPending} title={`Delete ${name}?`} onClose={() => setDeleting(false)} onConfirm={() => remove.mutate()} />
  </Box>
}

export function BusinessPlansPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [deleting, setDeleting] = useState(null)
  const params = { page, size: 20, sort: 'createdAt', direction: 'desc', ...(search && { search }), ...(status && { status }) }
  const query = useQuery({ queryKey: ['admin', 'business-plans', params], queryFn: () => getPage('/admin/business-plans', params) })
  const remove = useMutation({ mutationFn: (id) => api.delete(`/admin/business-plans/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'business-plans'] }); setDeleting(null) } })
  const columns = [{ key: 'companyName', label: 'Company', render: (v, r) => <Box><Typography fontWeight={700}>{v}</Typography><Typography variant="caption" color="text.secondary">{r.industry} · {r.stage}</Typography></Box> }, { key: 'founderName', label: 'Founder', render: (v, r) => <Box>{v}<Typography variant="caption" display="block" color="text.secondary">{r.founderEmail}</Typography></Box> }, { key: 'fundingAmount', label: 'Funding sought', render: fmtMoney }, { key: 'assignedTo', label: 'Owner', render: (v) => v?.name || 'Unassigned' }, { key: 'createdAt', label: 'Submitted', render: fmtDate }, { key: 'status', label: 'Status', render: (v) => <StatusChip value={v} /> }]
  return <><AdminTitle title="Business Plans" text="Review submissions, diligence materials and investment decisions." />
    <Feedback mutation={remove} success="Business plan deleted." />
    <Filters search={search} setSearch={(v) => { setSearch(v); setPage(0) }} status={status} setStatus={(v) => { setStatus(v); setPage(0) }} statuses={Object.keys(PLAN_TRANSITIONS)} />
    <DataTable columns={columns} rows={rowsOf(query.data)} query={query} onReview={(row) => navigate(`/admin/business-plans/${row.id}`)} onDelete={setDeleting} />
    <Pager data={query.data} page={page} setPage={setPage} />
    <ConfirmDialog open={!!deleting} pending={remove.isPending} title={`Delete ${deleting?.companyName || 'business plan'}?`} text="The submission and its workflow records will be permanently removed." onClose={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.id)} />
  </>
}

function InfoGrid({ items }) {
  return <Box className="info-grid">{items.map(([label, value]) => <Box key={label}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography>{value ?? '—'}</Typography></Box>)}</Box>
}

function Timeline({ rows, empty = 'No activity recorded.' }) {
  if (!rows?.length) return <Typography color="text.secondary">{empty}</Typography>
  return <Stack className="timeline">{rows.map((row) => <Box key={row.id}><Stack direction="row" justifyContent="space-between" gap={2}><Typography fontWeight={700}>{row.fromStatus ? `${titleCase(row.fromStatus)} → ${titleCase(row.toStatus)}` : 'Note added'}</Typography><Typography variant="caption" color="text.secondary">{fmtDate(row.createdAt)}</Typography></Stack>{row.comment && <Typography variant="body2">{row.comment}</Typography>}{row.content && <Typography variant="body2">{row.content}</Typography>}<Typography variant="caption" color="text.secondary">{row.changedBy?.name || row.author?.name || row.author || ''}</Typography></Box>)}</Stack>
}

function ActionDialog({ open, title, statuses, pending, onClose, onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  useEffect(() => reset({ status: statuses?.[0] || '', comment: '' }), [open, statuses, reset])
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth><DialogTitle>{title}</DialogTitle><Box component="form" onSubmit={handleSubmit(onSubmit)}><DialogContent dividers><Stack gap={2}><TextField select label="New status" error={!!errors.status} {...register('status', { required: true })}>{statuses?.map((x) => <MenuItem key={x} value={x}>{titleCase(x)}</MenuItem>)}</TextField><TextField label="Decision note" multiline rows={4} placeholder="Add context for the audit trail…" {...register('comment')} /></Stack></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="contained" disabled={pending}>{pending ? 'Updating…' : 'Confirm transition'}</Button></DialogActions></Box></Dialog>
}

export function BusinessPlanDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [decisionStatus, setDecisionStatus] = useState('')
  const [decisionComment, setDecisionComment] = useState('')
  const query = useQuery({ queryKey: ['admin', 'business-plan', id], queryFn: () => getOne(`/admin/business-plans/${id}`) })
  const history = useQuery({ queryKey: ['admin', 'business-plan-history', id], queryFn: () => getList(`/admin/business-plans/${id}/history`) })
  const notes = useQuery({ queryKey: ['admin', 'business-plan-notes', id], queryFn: () => getList(`/admin/business-plans/${id}/notes`) })
  const users = useQuery({ queryKey: ['admin', 'assignment-users'], queryFn: () => getPage('/admin/users', { page: 0, size: 100, sort: 'firstName', direction: 'asc', active: true }) })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin', 'business-plan', id] }); qc.invalidateQueries({ queryKey: ['admin', 'business-plan-history', id] }); qc.invalidateQueries({ queryKey: ['admin', 'business-plan-notes', id] }) }
  const statusMutation = useMutation({ mutationFn: (values) => api.patch(`/admin/business-plans/${id}/status`, values), onSuccess: () => { refresh(); setDecisionStatus(''); setDecisionComment('') } })
  const assignMutation = useMutation({ mutationFn: (userId) => api.patch(`/admin/business-plans/${id}/assignment`, { userId }), onSuccess: refresh })
  const noteMutation = useMutation({ mutationFn: () => api.post(`/admin/business-plans/${id}/notes`, { content: note }), onSuccess: () => { refresh(); setNote('') } })
  const plan = query.data
  if (query.isLoading) return <Skeleton height={500} />
  if (query.isError) return <Alert severity="error">{errorText(query.error)}</Alert>
  const transitions = PLAN_TRANSITIONS[plan.status] || []
  return <Box className="detail-page"><DetailBreadcrumbs section="Business Plans" to="/admin/business-plans" current={plan.companyName} />
    <Box className="detail-heading"><Box><Typography variant="overline">Investment application</Typography><Typography variant="h3">{plan.companyName}</Typography><Typography color="text.secondary">{plan.industry || 'Unclassified'} · {plan.stage || 'Stage not specified'} · Submitted {fmtDate(plan.createdAt)}</Typography></Box><Stack direction="row" gap={1} alignItems="center"><StatusChip value={plan.status} /><Typography variant="caption" color="text.secondary">Step {plan.currentStep || '—'}</Typography></Stack></Box>
    <Feedback mutation={statusMutation} /><Feedback mutation={assignMutation} success="Review owner updated." /><Feedback mutation={noteMutation} success="Internal note saved." />
    <Box className="review-layout detail-review-layout"><Stack gap={2}>
      <Paper className="detail-section"><Box className="section-heading"><Typography variant="h5">Founder information</Typography><Typography variant="body2" color="text.secondary">Primary contact and leadership profile supplied with the application.</Typography></Box><InfoGrid items={[['Full name', plan.founderName], ['Position', plan.founderPosition], ['Email address', plan.founderEmail], ['Telephone', plan.founderPhone], ['Country / region', plan.country], ['LinkedIn', plan.linkedinUrl ? 'Profile supplied' : 'Not supplied']]} />{plan.linkedinUrl && <a className="detail-text-link" href={plan.linkedinUrl} target="_blank" rel="noreferrer">Open LinkedIn profile <OpenInNew fontSize="inherit" /></a>}</Paper>
      <Paper className="detail-section"><Box className="section-heading"><Typography variant="h5">Company submission</Typography><Typography variant="body2" color="text.secondary">Company profile, operating stage and supporting metrics.</Typography></Box><InfoGrid items={[['Company name', plan.companyName], ['Industry', plan.industry], ['Current stage', plan.stage], ['Founded', plan.foundedDate], ['Team size', plan.teamSize], ['Company website', plan.website ? 'Website supplied' : 'Not supplied']]} /><Divider /><Typography variant="subtitle2">Company overview</Typography><Typography className="rich-text compact-copy">{plan.companyDescription || 'No company description supplied.'}</Typography>{plan.website && <a className="detail-text-link" href={plan.website} target="_blank" rel="noreferrer">Visit company website <OpenInNew fontSize="inherit" /></a>}</Paper>
      <Paper className="detail-section"><Box className="section-heading"><Typography variant="h5">Financial overview</Typography><Typography variant="body2" color="text.secondary">Headline commercial figures provided by the founder.</Typography></Box><Box className="financial-cards"><Box><Typography variant="caption">Funding requested</Typography><Typography variant="h5">{fmtMoney(plan.fundingAmount)}</Typography></Box><Box><Typography variant="caption">Current revenue</Typography><Typography variant="h5">{fmtMoney(plan.revenue)}</Typography></Box><Box><Typography variant="caption">Monthly growth</Typography><Typography variant="h5">{plan.monthlyGrowth == null ? '—' : `${plan.monthlyGrowth}%`}</Typography></Box></Box></Paper>
      <Paper className="detail-section"><Box className="section-heading"><Typography variant="h5">Attached documents</Typography><Typography variant="body2" color="text.secondary">{plan.documents?.length || 0} files submitted for diligence.</Typography></Box>{!plan.documents?.length ? <Typography color="text.secondary">No documents attached.</Typography> : <Stack>{plan.documents.map((doc) => <Stack key={doc.id} direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} className="document-row"><Stack direction="row" gap={1.5} alignItems="center"><Box className="file-icon"><AttachFileOutlined /></Box><Box><Typography fontWeight={700}>{doc.originalName}</Typography><Typography variant="caption" color="text.secondary">{doc.fileType || doc.mimeType || 'Document'} · {fmtSize(doc.fileSize)} · Added {fmtDate(doc.createdAt)}</Typography></Box></Stack><Button size="small" className="detail-inline-action" startIcon={<DownloadOutlined />} onClick={() => downloadFile(`/admin/business-plans/${id}/documents/${doc.id}`, doc.originalName)}>Download</Button></Stack>)}</Stack>}</Paper>
      <Paper className="detail-section"><Box className="section-heading"><Typography variant="h5">Review history</Typography><Typography variant="body2" color="text.secondary">Immutable status decisions recorded by the administration API.</Typography></Box>{history.isLoading ? <Skeleton /> : history.isError ? <Alert severity="error">{errorText(history.error)}</Alert> : <Timeline rows={history.data} />}</Paper>
    </Stack>
    <Stack gap={2}><Paper className="detail-summary sticky-panel"><Typography variant="overline">Review control</Typography><Typography variant="h5">Ownership & decision</Typography><TextField select label="Assigned analyst" value={plan.assignedTo?.id || ''} onChange={(e) => assignMutation.mutate(e.target.value)} disabled={assignMutation.isPending || users.isLoading}><MenuItem value="" disabled>Choose a user</MenuItem>{rowsOf(users.data).map((user) => <MenuItem key={user.id} value={user.id}>{user.firstName} {user.lastName} · {user.email}</MenuItem>)}</TextField><Divider /><TextField select label="Next status" value={decisionStatus} onChange={(e) => setDecisionStatus(e.target.value)} disabled={!transitions.length}><MenuItem value="">Select decision</MenuItem>{transitions.map((value) => <MenuItem key={value} value={value}>{titleCase(value)}</MenuItem>)}</TextField><TextField label="Decision rationale" value={decisionComment} onChange={(e) => setDecisionComment(e.target.value)} multiline rows={4} placeholder="Add context to the review history…" /><Box className="detail-panel-actions"><Button size="small" variant="contained" className="detail-inline-action" startIcon={<Check />} disabled={!decisionStatus || statusMutation.isPending} onClick={() => statusMutation.mutate({ status: decisionStatus, comment: decisionComment })}>{statusMutation.isPending ? 'Recording…' : 'Record decision'}</Button></Box>{!transitions.length && <Alert severity="info">No further status transitions are supported from {titleCase(plan.status)}.</Alert>}</Paper>
      <Paper className="detail-summary"><Typography variant="h5">Internal review notes</Typography><Typography variant="body2" color="text.secondary">Use notes for diligence findings and analyst hand-off.</Typography><TextField value={note} onChange={(e) => setNote(e.target.value)} multiline rows={5} placeholder="Record findings or next steps…" /><Box className="detail-panel-actions"><Button size="small" variant="outlined" className="detail-inline-action" disabled={!note.trim() || noteMutation.isPending} onClick={() => noteMutation.mutate()}>{noteMutation.isPending ? 'Saving…' : 'Add internal note'}</Button></Box><Divider />{notes.isLoading ? <Skeleton /> : notes.isError ? <Alert severity="error">{errorText(notes.error)}</Alert> : <Timeline rows={notes.data} empty="No review notes yet." />}</Paper></Stack>
    </Box>
  </Box>
}

export function ApplicantsPage() {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [jobId, setJobId] = useState('')
  const jobs = useQuery({ queryKey: ['admin', 'jobs-filter'], queryFn: () => getPage('/admin/jobs', { page: 0, size: 100, sort: 'title', direction: 'asc' }) })
  const params = { page, size: 20, sort: 'createdAt', direction: 'desc', ...(search && { search }), ...(status && { status }), ...(jobId && { jobId }) }
  const query = useQuery({ queryKey: ['admin', 'applicants', params], queryFn: () => getPage('/admin/applicants', params) })
  const columns = [{ key: 'firstName', label: 'Candidate', render: (v, r) => <Box><Typography fontWeight={700}>{v} {r.lastName}</Typography><Typography variant="caption" color="text.secondary">{r.email}</Typography></Box> }, { key: 'jobTitle', label: 'Position' }, { key: 'createdAt', label: 'Applied', render: fmtDate }, { key: 'status', label: 'Stage', render: (v) => <StatusChip value={v} /> }]
  return <><AdminTitle title="Applicant Management" text="Move candidates through the hiring pipeline with a complete activity record." /><Filters search={search} setSearch={(v) => { setSearch(v); setPage(0) }} status={status} setStatus={(v) => { setStatus(v); setPage(0) }} statuses={Object.keys(APPLICANT_TRANSITIONS)}><TextField select label="Job" value={jobId} onChange={(e) => { setJobId(e.target.value); setPage(0) }} sx={{ minWidth: 220 }}><MenuItem value="">All positions</MenuItem>{rowsOf(jobs.data).map((job) => <MenuItem key={job.id} value={job.id}>{job.title}</MenuItem>)}</TextField></Filters><DataTable columns={columns} rows={rowsOf(query.data)} query={query} onReview={(row) => navigate(`/admin/applicants/${row.id}`)} /><Pager data={query.data} page={page} setPage={setPage} /></>
}

export function ApplicantDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [nextStatus, setNextStatus] = useState('')
  const [statusComment, setStatusComment] = useState('')
  const query = useQuery({ queryKey: ['admin', 'applicant', id], queryFn: () => getOne(`/admin/applicants/${id}`) })
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'applicant', id] })
  const statusMutation = useMutation({ mutationFn: (values) => api.patch(`/admin/applicants/${id}/status`, values), onSuccess: () => { refresh(); setNextStatus(''); setStatusComment('') } })
  const noteMutation = useMutation({ mutationFn: () => api.post(`/admin/applicants/${id}/notes`, { content: note }), onSuccess: () => { refresh(); setNote('') } })
  const person = query.data
  if (query.isLoading) return <Skeleton height={500} />
  if (query.isError) return <Alert severity="error">{errorText(query.error)}</Alert>
  const stages = ['NEW', 'REVIEWING', 'INTERVIEW', 'OFFER', 'HIRED']
  const currentStage = stages.indexOf(person.status)
  const transitions = APPLICANT_TRANSITIONS[person.status] || []
  return <Box className="detail-page"><DetailBreadcrumbs section="Applicants" to="/admin/applicants" current={`${person.firstName} ${person.lastName}`} />
    <Box className="detail-heading candidate-heading"><Stack direction="row" gap={2} alignItems="center"><Avatar className="candidate-avatar">{person.firstName?.[0]}{person.lastName?.[0]}</Avatar><Box><Typography variant="overline">Candidate application</Typography><Typography variant="h3">{person.firstName} {person.lastName}</Typography><Typography color="text.secondary">{person.jobTitle} · Applied {fmtDate(person.createdAt)}</Typography><Box className="applicant-quick-actions">{[['Reject', 'REJECTED', 'error'], ['Interview', 'INTERVIEW', 'warning'], ['Offer', 'OFFER', 'info'], ['Hire', 'HIRED', 'success']].map(([label, status, color]) => <Button key={status} size="small" color={color} variant={person.status === status ? 'contained' : 'outlined'} disabled={!transitions.includes(status) || statusMutation.isPending} onClick={() => statusMutation.mutate({ status, comment: `${label} action recorded from quick actions.` })}>{label}</Button>)}</Box></Box></Stack><StatusChip value={person.status} /></Box>
    <Feedback mutation={statusMutation} /><Feedback mutation={noteMutation} success="Candidate note saved." />
    <Paper className="pipeline-panel"><Typography variant="overline">Recruitment pipeline</Typography><Box className="pipeline-steps">{stages.map((stage, index) => <Box key={stage} className={`${index <= currentStage ? 'complete' : ''} ${stage === person.status ? 'current' : ''}`}><span>{index < currentStage ? '✓' : index + 1}</span><Typography variant="caption">{titleCase(stage)}</Typography></Box>)}{person.status === 'REJECTED' && <Box className="rejected-step current"><span>×</span><Typography variant="caption">Rejected</Typography></Box>}</Box></Paper>
    <Box className="review-layout detail-review-layout"><Stack gap={2}>
      <Paper className="detail-section"><Box className="section-heading"><Typography variant="h5">Candidate profile</Typography><Typography variant="body2" color="text.secondary">Contact details and application metadata.</Typography></Box><InfoGrid items={[['Email address', person.email], ['Telephone', person.phone], ['Position', person.jobTitle], ['Applied', fmtDate(person.createdAt)], ['Last updated', fmtDate(person.updatedAt)], ['Candidate ID', person.id]]} />{person.linkedinUrl && <a className="detail-text-link" href={person.linkedinUrl} target="_blank" rel="noreferrer">Open LinkedIn profile <OpenInNew fontSize="inherit" /></a>}</Paper>
      <Paper className="detail-section"><Box className="section-heading"><Typography variant="h5">Resume & cover letter</Typography><Typography variant="body2" color="text.secondary">Original application files retained by the recruitment API.</Typography></Box><Stack gap={1}>{person.resumeName && <Box className="material-card"><Stack direction="row" gap={1.5} alignItems="center"><Box className="file-icon"><AttachFileOutlined /></Box><Box><Typography fontWeight={700}>{person.resumeName}</Typography><Typography variant="caption" color="text.secondary">Candidate resume</Typography></Box></Stack><Button size="small" className="detail-inline-action" startIcon={<DownloadOutlined />} onClick={() => downloadFile(`/admin/applicants/${id}/resume`, person.resumeName)}>Download</Button></Box>}{person.coverLetterName && <Box className="material-card"><Stack direction="row" gap={1.5} alignItems="center"><Box className="file-icon"><AttachFileOutlined /></Box><Box><Typography fontWeight={700}>{person.coverLetterName}</Typography><Typography variant="caption" color="text.secondary">Cover letter attachment</Typography></Box></Stack><Button size="small" className="detail-inline-action" startIcon={<DownloadOutlined />} onClick={() => downloadFile(`/admin/applicants/${id}/cover-letter`, person.coverLetterName)}>Download</Button></Box>}</Stack>{person.coverLetter && <><Divider /><Typography variant="subtitle2">Cover letter response</Typography><Typography className="rich-text compact-copy">{person.coverLetter}</Typography></>}</Paper>
      <Paper className="detail-section"><Box className="section-heading"><Typography variant="h5">Application activity</Typography><Typography variant="body2" color="text.secondary">Status changes and comments recorded across the hiring workflow.</Typography></Box><Timeline rows={person.activities} /></Paper>
    </Stack>
      <Stack gap={2}><Paper className="detail-summary sticky-panel"><Typography variant="overline">Hiring workflow</Typography><Typography variant="h5">Update candidate state</Typography><TextField select label="Next stage" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} disabled={!transitions.length}><MenuItem value="">Select next stage</MenuItem>{transitions.map((value) => <MenuItem key={value} value={value}>{titleCase(value)}</MenuItem>)}</TextField><TextField label="Activity note" value={statusComment} onChange={(e) => setStatusComment(e.target.value)} multiline rows={4} placeholder="Record the review, interview, offer or hiring outcome…" /><Box className="detail-panel-actions"><Button size="small" variant="contained" className="detail-inline-action" disabled={!nextStatus || statusMutation.isPending} onClick={() => statusMutation.mutate({ status: nextStatus, comment: statusComment })}>{statusMutation.isPending ? 'Updating…' : 'Update pipeline'}</Button></Box>{!transitions.length && <Alert severity="info">{titleCase(person.status)} is a terminal backend state.</Alert>}</Paper>
        <Paper className="detail-summary"><Typography variant="h5">Interview, offer & hiring notes</Typography><Typography variant="body2" color="text.secondary">The backend has no separate interview or offer records. Store supported details here; status changes appear in activity.</Typography><TextField value={note} onChange={(e) => setNote(e.target.value)} multiline rows={6} placeholder="Add interview feedback, offer terms or onboarding notes…" /><Box className="detail-panel-actions"><Button size="small" variant="outlined" className="detail-inline-action" disabled={!note.trim() || noteMutation.isPending} onClick={() => noteMutation.mutate()}>{noteMutation.isPending ? 'Saving…' : 'Add private note'}</Button></Box><Divider /><Timeline rows={person.notes} empty="No candidate notes yet." /></Paper>
      </Stack>
    </Box>
  </Box>
}

export function MediaPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [type, setType] = useState('')
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const query = useQuery({ queryKey: ['admin', 'media', page, type], queryFn: () => getPage('/admin/media', { page, size: 24, sort: 'createdAt', direction: 'desc', ...(type && { type }) }) })
  const upload = useMutation({ mutationFn: ({ file, alt }) => { const data = new FormData(); data.append('file', file); return api.post('/admin/media', data, { params: { alt }, headers: { 'Content-Type': 'multipart/form-data' } }) }, onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'media'] }); setUploading(false) } })
  const remove = useMutation({ mutationFn: (id) => api.delete(`/admin/media/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'media'] }); setDeleting(null) } })
  return <><AdminTitle title="Media Library" text="Upload and manage approved images, video and documents." action={<Button size="small" variant="contained" startIcon={<UploadFileOutlined />} onClick={() => setUploading(true)}>Upload file</Button>} /><Feedback mutation={upload} success="Media uploaded." /><Feedback mutation={remove} success="Media deleted." /><Paper className="table-filters"><TextField select label="Media type" value={type} onChange={(e) => setType(e.target.value)} sx={{ minWidth: 180 }}><MenuItem value="">All media</MenuItem>{['IMAGE', 'VIDEO', 'DOCUMENT'].map((x) => <MenuItem key={x} value={x}>{titleCase(x)}</MenuItem>)}</TextField></Paper>
    {query.isLoading ? <Skeleton height={300} /> : query.isError ? <Alert severity="error">{errorText(query.error)}</Alert> : !rowsOf(query.data).length ? <Paper className="empty-panel"><Typography fontWeight={700}>No media files found.</Typography></Paper> : <Box className="media-grid">{rowsOf(query.data).map((file) => <Paper key={file.id} className="media-card"><Box className="media-preview">{file.mediaType === 'IMAGE' ? <Typography>IMG</Typography> : <Typography>{file.mediaType}</Typography>}</Box><Box className="media-meta"><Typography fontWeight={700} noWrap title={file.originalName}>{file.originalName}</Typography><Typography variant="caption" color="text.secondary">{file.mimeType} · {fmtSize(file.fileSize)}</Typography><Stack direction="row"><Button size="small" startIcon={<DownloadOutlined />} onClick={() => downloadFile(`/admin/media/${file.id}/download`, file.originalName)}>Download</Button><Button size="small" color="error" onClick={() => setDeleting(file)}><Close fontSize="small" /></Button></Stack></Box></Paper>)}</Box>}<Pager data={query.data} page={page} setPage={setPage} />
    <UploadDialog open={uploading} pending={upload.isPending} error={upload.isError ? errorText(upload.error) : ''} onClose={() => setUploading(false)} onSave={(data) => upload.mutate(data)} /><ConfirmDialog open={!!deleting} pending={remove.isPending} title={`Delete ${deleting?.originalName || 'file'}?`} onClose={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.id)} /></>
}

function UploadDialog({ open, pending, error, onClose, onSave }) {
  const [file, setFile] = useState(null)
  const [alt, setAlt] = useState('')
  useEffect(() => { if (!open) { setFile(null); setAlt('') } }, [open])
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth><DialogTitle>Upload media</DialogTitle><DialogContent dividers><Stack gap={2}>{error && <Alert severity="error">{error}</Alert>}<Button component="label" variant="outlined" startIcon={<UploadFileOutlined />}>{file?.name || 'Choose file'}<input hidden type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} /></Button><Typography variant="caption" color="text.secondary">Maximum file size: 50 MB.</Typography><TextField label="Alternative text" value={alt} onChange={(e) => setAlt(e.target.value)} helperText="Recommended for images and accessibility." /></Stack></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button variant="contained" disabled={!file || pending} onClick={() => onSave({ file, alt })}>{pending ? 'Uploading…' : 'Upload'}</Button></DialogActions></Dialog>
}

export function UsersPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState('')
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const roles = useQuery({ queryKey: ['admin', 'roles-options'], queryFn: () => getList('/admin/roles') })
  const params = { page, size: 20, sort: 'createdAt', direction: 'desc', ...(search && { search }), ...(active !== '' && { active }) }
  const query = useQuery({ queryKey: ['admin', 'users', params], queryFn: () => getPage('/admin/users', params) })
  const config = { title: 'User', fields: [['firstName', 'First name', 'text', true], ['lastName', 'Last name', 'text', true], ['email', 'Email', 'email', true], ['phone', 'Phone'], ['password', 'Password', 'password'], ['active', 'Active', 'boolean'], ['roleIds', 'Roles', 'multi']] }
  const mutation = useMutation({ mutationFn: ({ id, values }) => api[id ? 'put' : 'post'](id ? `/admin/users/${id}` : '/admin/users', values), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setEditing(null) } })
  const remove = useMutation({ mutationFn: (id) => api.delete(`/admin/users/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setDeleting(null) } })
  const editUser = (user) => setEditing({ ...user, password: '', roleIds: (roles.data || []).filter((role) => user.roles?.includes(role.name)).map((role) => role.id) })
  const columns = [{ key: 'firstName', label: 'User', render: (v, r) => <Stack direction="row" gap={1} alignItems="center"><Avatar src={r.avatarUrl}>{v?.[0]}{r.lastName?.[0]}</Avatar><Box><Typography fontWeight={700}>{v} {r.lastName}</Typography><Typography variant="caption" color="text.secondary">{r.email}</Typography></Box></Stack> }, { key: 'phone', label: 'Phone' }, { key: 'roles', label: 'Roles', render: (v) => v?.map((x) => <Chip key={x} size="small" label={titleCase(x)} sx={{ mr: .5 }} />) }, { key: 'active', label: 'Status', render: (v) => <Chip size="small" color={v ? 'success' : 'default'} label={v ? 'Active' : 'Inactive'} /> }]
  return <><AdminTitle title="Users" text="Manage administrator accounts and role membership." action={<Button size="small" variant="contained" startIcon={<Add />} onClick={() => setEditing({ active: true })}>Add user</Button>} /><Feedback mutation={mutation} /><Feedback mutation={remove} success="User deleted." /><Filters search={search} setSearch={setSearch}><TextField select label="Account status" value={active} onChange={(e) => setActive(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="">All users</MenuItem><MenuItem value="true">Active</MenuItem><MenuItem value="false">Inactive</MenuItem></TextField></Filters><DataTable columns={columns} rows={rowsOf(query.data)} query={query} onEdit={editUser} onDelete={setDeleting} /><Pager data={query.data} page={page} setPage={setPage} /><ResourceEditor open={editing !== null} config={config} item={editing?.id ? editing : null} pending={mutation.isPending} options={{ roleIds: roles.data || [] }} onClose={() => setEditing(null)} onSave={(values) => mutation.mutate({ id: editing?.id, values })} /><ConfirmDialog open={!!deleting} pending={remove.isPending} title={`Delete ${deleting?.firstName || 'user'}?`} onClose={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.id)} /></>
}

export function RolesPage() {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const query = useQuery({ queryKey: ['admin', 'roles'], queryFn: () => getList('/admin/roles') })
  const permissions = useQuery({ queryKey: ['admin', 'permission-options'], queryFn: () => getList('/admin/permissions') })
  const config = { title: 'Role', fields: [['name', 'Role name', 'text', true], ['description', 'Description', 'multiline'], ['permissionIds', 'Permissions', 'multi']] }
  const mutation = useMutation({ mutationFn: ({ id, values }) => api[id ? 'put' : 'post'](id ? `/admin/roles/${id}` : '/admin/roles', values), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); setEditing(null) } })
  const remove = useMutation({ mutationFn: (id) => api.delete(`/admin/roles/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'roles'] }); setDeleting(null) } })
  const editRole = (role) => setEditing({ ...role, permissionIds: (permissions.data || []).filter((permission) => role.permissions?.includes(permission.code)).map((permission) => permission.id) })
  const columns = [{ key: 'name', label: 'Role', render: (v) => <Typography fontWeight={800}>{titleCase(v)}</Typography> }, { key: 'description', label: 'Description' }, { key: 'permissions', label: 'Permissions', render: (v) => <Typography variant="body2">{v?.length || 0} assigned</Typography> }]
  return <><AdminTitle title="Roles" text="Define reusable access profiles and assign granular permissions." action={<Button size="small" variant="contained" startIcon={<Add />} onClick={() => setEditing({})}>Add role</Button>} /><Feedback mutation={mutation} /><Feedback mutation={remove} success="Role deleted." /><DataTable columns={columns} rows={rowsOf(query.data)} query={query} onEdit={editRole} onDelete={setDeleting} /><ResourceEditor open={editing !== null} config={config} item={editing?.id ? editing : null} pending={mutation.isPending} options={{ permissionIds: (permissions.data || []).map((x) => ({ ...x, name: `${x.code} — ${x.name}` })) }} onClose={() => setEditing(null)} onSave={(values) => mutation.mutate({ id: editing?.id, values })} /><ConfirmDialog open={!!deleting} pending={remove.isPending} title={`Delete ${deleting?.name || 'role'}?`} onClose={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.id)} /></>
}

export function CmsHubPage() {
  return <><AdminTitle title="Content Management" text="Manage the public website’s pages, editorial content and people." /><Box className="cms-hub">{[['Pages', 'Core website and legal pages', '/admin/cms/pages'], ['Insights', 'Articles and market perspectives', '/admin/cms/insights'], ['Team', 'Leadership biographies and ordering', '/admin/cms/team'], ['Contact Inbox', 'Messages submitted through the website', '/admin/contact-messages']].map(([title, text, to]) => <Paper key={to} component={Link} to={to}><Typography variant="h5">{title}</Typography><Typography color="text.secondary">{text}</Typography><Button>Manage</Button></Paper>)}</Box></>
}

export function AuditLogsPage() {
  const [page, setPage] = useState(0)
  const [module, setModule] = useState('')
  const [action, setAction] = useState('')
  const params = { page, size: 30, sort: 'createdAt', direction: 'desc', ...(module && { module }), ...(action && { action }) }
  const query = useQuery({ queryKey: ['admin', 'audit', params], queryFn: () => getPage('/admin/audit-logs', params) })
  const columns = [{ key: 'user', label: 'Actor', render: (v) => v ? <Box><Typography fontWeight={700}>{v.name}</Typography><Typography variant="caption">{v.email}</Typography></Box> : 'System' }, { key: 'action', label: 'Action', render: (v) => <Chip size="small" label={v} /> }, { key: 'module', label: 'Module' }, { key: 'entityType', label: 'Resource' }, { key: 'details', label: 'Details' }, { key: 'ipAddress', label: 'IP address' }, { key: 'createdAt', label: 'Occurred', render: fmtDate }]
  return <><AdminTitle title="Audit Logs" text="An immutable view of administrative activity across the platform." /><Paper className="table-filters"><TextField label="Module" value={module} onChange={(e) => { setModule(e.target.value); setPage(0) }} placeholder="e.g. users" /><TextField select label="Action" value={action} onChange={(e) => { setAction(e.target.value); setPage(0) }} sx={{ minWidth: 160 }}><MenuItem value="">All actions</MenuItem>{['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT'].map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</TextField></Paper><DataTable columns={columns} rows={rowsOf(query.data)} query={query} /><Pager data={query.data} page={page} setPage={setPage} /></>
}

export function SettingsPage() {
  const qc = useQueryClient()
  const [category, setCategory] = useState('')
  const query = useQuery({ queryKey: ['admin', 'settings', category], queryFn: () => getList('/admin/settings', category ? { category } : undefined) })
  const [values, setValues] = useState({})
  useEffect(() => { if (query.data) setValues(Object.fromEntries(query.data.map((x) => [x.key, x.value ?? '']))) }, [query.data])
  const mutation = useMutation({ mutationFn: () => Promise.all((query.data || []).filter((setting) => String(values[setting.key] ?? '') !== String(setting.value ?? '')).map((setting) => api.put(`/admin/settings/${encodeURIComponent(setting.key)}`, { key: setting.key, value: String(values[setting.key] ?? ''), description: setting.description, category: setting.category }))), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'settings'] }) })
  const categories = useMemo(() => [...new Set((query.data || []).map((x) => x.category).filter(Boolean))], [query.data])
  return <><AdminTitle title="Settings" text="Edit runtime configuration values by their canonical backend key." /><Feedback mutation={mutation} success="Settings saved." /><Paper className="settings-form"><TextField select label="Category" value={category} onChange={(e) => setCategory(e.target.value)}><MenuItem value="">All categories</MenuItem>{categories.map((x) => <MenuItem key={x} value={x}>{titleCase(x)}</MenuItem>)}</TextField>{query.isLoading ? <Skeleton height={250} /> : query.isError ? <Alert severity="error">{errorText(query.error)}</Alert> : !query.data?.length ? <Typography color="text.secondary">No settings in this category.</Typography> : <Stack gap={2}>{query.data.map((setting) => <TextField key={setting.key} label={setting.description || setting.key} value={values[setting.key] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [setting.key]: e.target.value }))} helperText={`${setting.key}${setting.category ? ` · ${setting.category}` : ''}`} />)}<Button variant="contained" disabled={mutation.isPending} onClick={() => mutation.mutate()} sx={{ alignSelf: 'flex-start' }}>{mutation.isPending ? 'Saving…' : 'Save changed settings'}</Button></Stack>}</Paper></>
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [read, setRead] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const users = useQuery({ queryKey: ['admin', 'notification-users'], queryFn: () => getPage('/admin/users', { page: 0, size: 100, sort: 'firstName', direction: 'asc', active: true }) })
  const query = useQuery({ queryKey: ['admin', 'notifications', page, read], queryFn: () => getPage('/admin/notifications', { page, size: 20, sort: 'createdAt', direction: 'desc', ...(read !== '' && { read }) }) })
  const mark = useMutation({ mutationFn: (id) => api.patch(`/admin/notifications/${id}/read`), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notifications'] }) })
  const create = useMutation({ mutationFn: (values) => api.post('/admin/notifications', values), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'notifications'] }); setCreating(false) } })
  const remove = useMutation({ mutationFn: (id) => api.delete(`/admin/notifications/${id}`), onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'notifications'] }); setDeleting(null) } })
  const config = { title: 'Notification', fields: [['userId', 'Recipient', 'select', true, rowsOf(users.data).map((x) => x.id)], ['title', 'Title', 'text', true], ['message', 'Message', 'multiline'], ['type', 'Type'], ['linkUrl', 'Link URL']] }
  const labels = Object.fromEntries(rowsOf(users.data).map((x) => [x.id, `${x.firstName} ${x.lastName} · ${x.email}`]))
  config.fields[0][4] = rowsOf(users.data).map((x) => x.id)
  return <><AdminTitle title="Notifications" text="Review your alerts and send targeted internal notifications." action={<Button size="small" variant="contained" startIcon={<Add />} onClick={() => setCreating(true)}>Create notification</Button>} /><Feedback mutation={create} success="Notification created." /><Feedback mutation={remove} success="Notification deleted." /><Paper className="table-filters"><TextField select label="Read state" value={read} onChange={(e) => setRead(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="">All notifications</MenuItem><MenuItem value="false">Unread</MenuItem><MenuItem value="true">Read</MenuItem></TextField></Paper>
    {query.isLoading ? <Skeleton /> : query.isError ? <Alert severity="error">{errorText(query.error)}</Alert> : !rowsOf(query.data).length ? <Paper className="empty-panel"><Typography>No notifications found.</Typography></Paper> : <Stack gap={1}>{rowsOf(query.data).map((item) => <Paper key={item.id} className={`notification-row ${item.read ? '' : 'unread'}`}><Box><Stack direction="row" gap={1} alignItems="center"><Typography fontWeight={800}>{item.title}</Typography>{!item.read && <Chip size="small" color="info" label="New" />}</Stack><Typography variant="body2">{item.message}</Typography><Typography variant="caption" color="text.secondary">{item.type || 'General'} · {fmtDate(item.createdAt)}</Typography></Box><Stack direction="row">{!item.read && <Tooltip title="Mark read"><Button onClick={() => mark.mutate(item.id)}><MarkEmailReadOutlined /></Button></Tooltip>}<Tooltip title="Delete"><Button color="error" onClick={() => setDeleting(item)}><Close /></Button></Tooltip></Stack></Paper>)}</Stack>}<Pager data={query.data} page={page} setPage={setPage} />
    <NotificationDialog open={creating} users={rowsOf(users.data)} pending={create.isPending} error={create.isError ? errorText(create.error) : ''} onClose={() => setCreating(false)} onSave={(v) => create.mutate(v)} /><ConfirmDialog open={!!deleting} pending={remove.isPending} title="Delete notification?" onClose={() => setDeleting(null)} onConfirm={() => remove.mutate(deleting.id)} /></>
}

function NotificationDialog({ open, users, pending, error, onClose, onSave }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  useEffect(() => reset({ userId: '', title: '', message: '', type: '', linkUrl: '' }), [open, reset])
  return <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth><DialogTitle>Create notification</DialogTitle><Box component="form" onSubmit={handleSubmit(onSave)}><DialogContent dividers><Stack gap={2}>{error && <Alert severity="error">{error}</Alert>}<TextField select label="Recipient" error={!!errors.userId} {...register('userId', { required: true })}>{users.map((x) => <MenuItem key={x.id} value={x.id}>{x.firstName} {x.lastName} · {x.email}</MenuItem>)}</TextField><TextField label="Title" error={!!errors.title} {...register('title', { required: true })} /><TextField label="Message" multiline rows={4} {...register('message')} /><TextField label="Type" placeholder="e.g. REVIEW_REQUIRED" {...register('type')} /><TextField label="Link URL" {...register('linkUrl')} /></Stack></DialogContent><DialogActions><Button onClick={onClose}>Cancel</Button><Button type="submit" variant="contained" disabled={pending}>{pending ? 'Sending…' : 'Create'}</Button></DialogActions></Box></Dialog>
}

export function ContactsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(0)
  const [read, setRead] = useState('')
  const [selected, setSelected] = useState(null)
  const query = useQuery({ queryKey: ['admin', 'contacts', page, read], queryFn: () => getPage('/admin/contact-messages', { page, size: 20, sort: 'createdAt', direction: 'desc', ...(read !== '' && { read }) }) })
  const mark = useMutation({ mutationFn: (id) => api.patch(`/admin/contact-messages/${id}/read`), onSuccess: (_, id) => { qc.invalidateQueries({ queryKey: ['admin', 'contacts'] }); setSelected((value) => value?.id === id ? { ...value, read: true } : value) } })
  const columns = [{ key: 'name', label: 'Sender', render: (v, r) => <Box><Typography fontWeight={r.read ? 500 : 800}>{v}</Typography><Typography variant="caption">{r.email}</Typography></Box> }, { key: 'subject', label: 'Subject' }, { key: 'message', label: 'Preview', render: (v) => <Typography noWrap sx={{ maxWidth: 380 }}>{v}</Typography> }, { key: 'createdAt', label: 'Received', render: fmtDate }, { key: 'read', label: 'State', render: (v) => <Chip size="small" label={v ? 'Read' : 'Unread'} color={v ? 'default' : 'info'} /> }]
  return <><AdminTitle title="Contact Inbox" text="Messages received from the public contact form." /><Paper className="table-filters"><TextField select label="Read state" value={read} onChange={(e) => setRead(e.target.value)} sx={{ minWidth: 170 }}><MenuItem value="">All messages</MenuItem><MenuItem value="false">Unread</MenuItem><MenuItem value="true">Read</MenuItem></TextField></Paper><DataTable columns={columns} rows={rowsOf(query.data)} query={query} onReview={(row) => { setSelected(row); if (!row.read) mark.mutate(row.id) }} /><Pager data={query.data} page={page} setPage={setPage} />
    <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth><DialogTitle>{selected?.subject || 'Contact message'}</DialogTitle><DialogContent dividers><Stack gap={2}><InfoGrid items={[['From', selected?.name], ['Email', selected?.email], ['Phone', selected?.phone], ['Received', fmtDate(selected?.createdAt)]]} /><Divider /><Typography className="rich-text">{selected?.message}</Typography><Alert severity="info">The backend supports read state only; reply and delete endpoints are not available.</Alert></Stack></DialogContent><DialogActions><Button href={`mailto:${selected?.email}?subject=${encodeURIComponent(`Re: ${selected?.subject || ''}`)}`}>Reply by email</Button><Button onClick={() => setSelected(null)}>Close</Button></DialogActions></Dialog></>
}
