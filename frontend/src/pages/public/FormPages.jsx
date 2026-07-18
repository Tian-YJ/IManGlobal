import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, Checkbox, CircularProgress, FormControlLabel, MenuItem, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material'
import { ArrowBack, ArrowForward, BusinessOutlined, Check, CloudUploadOutlined, DescriptionOutlined, PeopleOutlined, RocketLaunchOutlined } from '@mui/icons-material'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useParams } from 'react-router-dom'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/en'
import { PageHero, Section } from '../../components/common'
import api, { getOne, submitApplication, submitBusinessPlan } from '../../services/api'
import './public-workflows.css'

const fieldSx = { '& .MuiInputBase-root': { bgcolor: 'white' } }
function Field({ register, errors, name, label, required, ...props }) {
  return <TextField fullWidth label={label} error={!!errors[name]} helperText={errors[name]?.message} {...register(name, required ? { required: `${label} is required` } : {})} {...props} sx={fieldSx} />
}
function SubmitButton({ pending, children }) {
  return <Button type="submit" variant="contained" size="large" disabled={pending} endIcon={!pending && <ArrowForward />}>{pending ? <CircularProgress size={22} color="inherit" /> : children}</Button>
}

export function BusinessPlanPage() {
  const { control, register, handleSubmit, formState: { errors }, reset, watch } = useForm({ defaultValues: { foundedOn: null } })
  const [notice, setNotice] = useState('')
  const documents = watch('documents')
  const mutation = useMutation({
    mutationFn: (v) => submitBusinessPlan({
      plan: {
        founderName: v.founderFullName.trim(),
        founderPosition: v.founderPosition || null,
        founderEmail: v.founderEmail.trim(),
        founderPhone: v.founderPhone || null,
        country: v.countryCode || null,
        linkedinUrl: v.linkedinUrl || null,
        companyName: v.companyName.trim(),
        website: v.websiteUrl || null,
        industry: v.industry || null,
        stage: v.stage || null,
        teamSize: v.teamSize ? Number(v.teamSize) : null,
        foundedDate: dayjs(v.foundedOn).format('YYYY-MM-DD'),
        companyDescription: v.companyDescription.trim(),
        fundingAmount: v.fundingAmount ? Number(v.fundingAmount) : null,
        revenue: v.revenueAmount ? Number(v.revenueAmount) : null,
        monthlyGrowth: v.monthlyGrowthPercent ? Number(v.monthlyGrowthPercent) : null,
        currentStep: 4,
      },
      documents: Array.from(v.documents || []),
    }),
    onSuccess: (data) => { reset(); setNotice(`Business plan received${data?.id ? ` · Reference ${data.id}` : ''}.`) },
  })
  const sections = [
    ['01', 'Founder', 'Your contact details', PeopleOutlined, 'founder-information'],
    ['02', 'Company', 'The business overview', BusinessOutlined, 'company-information'],
    ['03', 'Traction', 'Progress and funding', RocketLaunchOutlined, 'traction'],
    ['04', 'Documents', 'Your investor materials', DescriptionOutlined, 'documents'],
  ]
  return <Box className="workflow-page">
    <WorkflowHeader eyebrow="Partner with IMan" title="Submit your business plan" text="Tell us about the company you are building. Our investment team reviews every complete submission." />
    <Section className="workflow-section">
      <Box className="bp-progress" aria-label="Submission sections">{sections.map(([number, title, subtitle, Icon, anchor]) => <a href={`#${anchor}`} key={title}><span className="bp-progress__icon"><Icon /></span><span><b><span>{number}</span><i> · {title}</i></b><small>{subtitle}</small></span></a>)}</Box>
      <Box className="workflow-layout">
        <Paper component="form" className="workflow-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
          <FormSection id="founder-information" number="01" title="Founder information" text="Tell us who we should contact about this opportunity.">
            <Box className="workflow-field-grid"><Field register={register} errors={errors} name="founderFullName" label="Full name" autoComplete="name" required /><Field register={register} errors={errors} name="founderPosition" label="Position / title" autoComplete="organization-title" required /><Field register={register} errors={errors} name="founderEmail" label="Email address" type="email" autoComplete="email" required /><Field register={register} errors={errors} name="founderPhone" label="Phone number" type="tel" autoComplete="tel" required /><Field register={register} errors={errors} name="countryCode" label="Country code" placeholder="HK" inputProps={{ maxLength: 2 }} required /><Field register={register} errors={errors} name="linkedinUrl" label="LinkedIn profile" type="url" placeholder="https://linkedin.com/in/…" required /></Box>
          </FormSection>
          <FormSection id="company-information" number="02" title="Company information" text="Give us a concise view of your company and market.">
            <Box className="workflow-field-grid"><Field register={register} errors={errors} name="companyName" label="Company name" autoComplete="organization" required /><Field register={register} errors={errors} name="websiteUrl" label="Company website" type="url" placeholder="https://" required /><Field register={register} errors={errors} name="industry" label="Industry" required /><Field register={register} errors={errors} name="stage" label="Investment stage" select defaultValue="" required><MenuItem value="">Select stage</MenuItem>{['Pre-seed', 'Seed', 'Series A', 'Series B', 'Growth'].map((x) => <MenuItem key={x} value={x}>{x}</MenuItem>)}</Field><Field register={register} errors={errors} name="teamSize" label="Team size" type="number" inputProps={{ min: 1 }} required /><LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="en"><Controller name="foundedOn" control={control} rules={{ required: 'Founded date is required' }} render={({ field }) => <DatePicker {...field} label="Founded date" format="MM/DD/YYYY" disableFuture slotProps={{ textField: { fullWidth: true, required: true, error: !!errors.foundedOn, helperText: errors.foundedOn?.message, sx: fieldSx } }} />} /></LocalizationProvider></Box>
            <Field register={register} errors={errors} name="companyDescription" label="Company description" placeholder="What problem are you solving, for whom, and why now?" required multiline rows={5} />
          </FormSection>
          <FormSection id="traction" number="03" title="Traction & funding" text="Share the latest numbers that help us understand your momentum.">
            <Box className="workflow-field-grid workflow-field-grid--three"><Field register={register} errors={errors} name="fundingAmount" label="Funding requested (USD)" type="number" inputProps={{ min: 0 }} required /><Field register={register} errors={errors} name="revenueAmount" label="Annual revenue (USD)" type="number" inputProps={{ min: 0 }} required /><Field register={register} errors={errors} name="monthlyGrowthPercent" label="Monthly growth (%)" type="number" required /></Box>
          </FormSection>
          <FormSection id="documents" number="04" title="Investor documents" text="Add the materials our team should review with your submission.">
            <FileUpload title="Upload pitch deck and supporting documents" detail="PDF, PPT, PPTX, DOC or DOCX · up to 25 MiB per file" multiple accept=".pdf,.ppt,.pptx,.doc,.docx" files={documents} error={errors.documents?.message} inputProps={register('documents', { required: 'At least one document is required', validate: (files) => Array.from(files || []).every((file) => file.size <= 25 * 1024 * 1024) || 'Each document must be 25 MiB or smaller' })} />
          </FormSection>
          {mutation.isError && <Alert severity="error">{mutation.error?.response?.data?.detail || 'Submission failed. Please review the form and try again.'}</Alert>}
          <Box className="workflow-submit"><Box><Typography fontWeight={700}>Ready to submit?</Typography><Typography variant="body2" color="text.secondary">Required fields are marked with an asterisk.</Typography></Box><SubmitButton pending={mutation.isPending}>Submit business plan</SubmitButton></Box>
        </Paper>
        <Paper component="aside" className="workflow-summary">
          <Typography className="eyebrow" color="secondary.main">Before you submit</Typography><Typography variant="h3">What happens next</Typography>
          <Stack gap={2.5}>{['Your materials are reviewed by our investment team.', 'If there is a potential fit, we will contact you directly.', 'Your information remains private and is used for evaluation.'].map((text, i) => <Box className="summary-point" key={text}><span>{i + 1}</span><Typography>{text}</Typography></Box>)}</Stack>
          <Box className="summary-note"><DescriptionOutlined /><Typography variant="body2">A clear pitch deck with market, team and traction context helps us review your company efficiently.</Typography></Box>
        </Paper>
      </Box>
    </Section>
    <Snackbar open={!!notice} autoHideDuration={9000} onClose={() => setNotice('')}><Alert severity="success" variant="filled" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </Box>
}

function WorkflowHeader({ eyebrow, title, text, back }) {
  return <Box className="workflow-header"><Box className="workflow-header__inner">{back && <Button component={Link} to={back} startIcon={<ArrowBack />} className="workflow-back">Back to role</Button>}<Typography className="eyebrow" color="secondary.main">{eyebrow}</Typography><Typography variant="h2">{title}</Typography>{text && <Typography color="text.secondary">{text}</Typography>}</Box></Box>
}

function FormSection({ id, number, title, text, children }) {
  return <Box component="section" id={id} className="workflow-form-section"><Box className="workflow-form-section__head"><span>{number}</span><Box><Typography variant="h3">{title}</Typography><Typography color="text.secondary">{text}</Typography></Box></Box><Stack gap={2.25}>{children}</Stack></Box>
}

function FileUpload({ title, detail, files, error, inputProps, ...props }) {
  const selected = Array.from(files || [])
  return <Box><Button component="label" className={`file-drop ${error ? 'file-drop--error' : ''}`} fullWidth><CloudUploadOutlined /><span><b>{title}</b><small>{detail}</small><em>Choose {props.multiple ? 'files' : 'a file'}</em></span><input hidden type="file" {...props} {...inputProps} /></Button>{selected.length > 0 && <Stack className="file-list">{selected.map((file) => <Typography variant="body2" key={`${file.name}-${file.size}`}><Check /> {file.name} <small>({(file.size / 1024 / 1024).toFixed(1)} MiB)</small></Typography>)}</Stack>}{error && <Typography className="field-error">{error}</Typography>}</Box>
}

export function ApplyPage() {
  const { id } = useParams()
  const job = useQuery({ queryKey: ['job', id], queryFn: () => getOne(`/public/jobs/${id}`) })
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm()
  const resume = watch('resume')
  const coverLetterFile = watch('coverLetter')
  const mutation = useMutation({
    mutationFn: (v) => submitApplication({ jobId: job.data.id, application: { firstName: v.firstName.trim(), lastName: v.lastName.trim(), email: v.email.trim(), phone: v.phone, linkedinUrl: v.linkedinUrl, coverLetter: v.coverLetterText }, resume: v.resume[0], coverLetter: v.coverLetter?.[0] }),
    onSuccess: reset,
  })
  if (job.isError) return <><WorkflowHeader eyebrow="Careers" title="Position unavailable" text="This role may have closed or is temporarily unavailable." back="/careers" /><Section><Alert severity="info">Please return to careers to see our current openings.</Alert></Section></>
  return <Box className="workflow-page application-page">
    <WorkflowHeader eyebrow="Careers · Application" title={job.data?.title ? `Apply for ${job.data.title}` : 'Application'} text={job.data ? `${job.data.department || 'IMan Investment'} · ${job.data.location || 'Hong Kong'}` : 'Loading role details…'} back={job.data ? `/careers/${job.data.slug || id}` : '/careers'} />
    <Section className="workflow-section">
      <Box className="application-layout">
        <Paper component="form" className="workflow-form application-form" onSubmit={handleSubmit((v) => mutation.mutate(v))} noValidate>
          <FormSection number="01" title="Personal information" text="How should our recruiting team contact you?"><Box className="workflow-field-grid"><Field register={register} errors={errors} name="firstName" label="First name" autoComplete="given-name" required /><Field register={register} errors={errors} name="lastName" label="Last name" autoComplete="family-name" required /><Field register={register} errors={errors} name="email" label="Email address" type="email" autoComplete="email" required /><Field register={register} errors={errors} name="phone" label="Phone number" type="tel" autoComplete="tel" required /><Field register={register} errors={errors} name="linkedinUrl" label="LinkedIn profile" type="url" placeholder="https://linkedin.com/in/…" required /></Box></FormSection>
          <FormSection number="02" title="Your experience" text="Share your resume and why this opportunity interests you.">
            <FileUpload title="Upload your resume" detail="PDF, DOC or DOCX · up to 5 MiB" accept=".pdf,.doc,.docx" files={resume} error={errors.resume?.message} inputProps={register('resume', { required: 'Resume is required', validate: (files) => !files?.[0] || files[0].size <= 5 * 1024 * 1024 || 'Resume must be 5 MiB or smaller' })} />
            <Field register={register} errors={errors} name="coverLetterText" label="Cover letter" placeholder="Tell us why you are interested in this role and the experience you would bring." required multiline rows={8} />
            <FileUpload title="Add a cover letter file (optional)" detail="PDF, DOC or DOCX · up to 5 MiB" accept=".pdf,.doc,.docx" files={coverLetterFile} error={errors.coverLetter?.message} inputProps={register('coverLetter', { validate: (files) => !files?.[0] || files[0].size <= 5 * 1024 * 1024 || 'Cover letter file must be 5 MiB or smaller' })} />
          </FormSection>
          <Box className="privacy-check"><FormControlLabel control={<Checkbox {...register('privacyAccepted', { required: 'Please acknowledge the privacy notice' })} />} label={<Typography variant="body2">I acknowledge that IMan Investment may use the information provided to assess my application and contact me about this role. See the <Link to="/privacy" target="_blank">Privacy Policy</Link>.</Typography>} />{errors.privacyAccepted && <Typography className="field-error">{errors.privacyAccepted.message}</Typography>}</Box>
          {mutation.isSuccess && <Alert severity="success"><b>Application received.</b> Thank you for your interest. Our team will contact you if your experience matches the role.</Alert>}
          {mutation.isError && <Alert severity="error">{mutation.error?.response?.data?.detail || 'Application could not be sent. Please review your details and try again.'}</Alert>}
          <Box className="workflow-submit"><Typography variant="body2" color="text.secondary">All fields marked * are required.</Typography><SubmitButton pending={mutation.isPending || job.isLoading}>Submit application</SubmitButton></Box>
        </Paper>
        <Paper component="aside" className="workflow-summary application-summary"><Typography className="eyebrow" color="secondary.main">Your application</Typography><Typography variant="h3">{job.data?.title || 'Role details'}</Typography>{job.data && <><Typography color="text.secondary">{job.data.department || 'Investment team'}</Typography><Typography color="text.secondary">{job.data.location || 'Hong Kong'} · {String(job.data.type || 'FULL_TIME').replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (x) => x.toUpperCase())}</Typography></>}<Box className="summary-note"><Check /><Typography variant="body2">Your details are submitted securely to our recruiting team.</Typography></Box></Paper>
      </Box>
    </Section>
  </Box>
}

export function ContactPage() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm()
  const mutation = useMutation({ mutationFn: (values) => api.post('/public/contact', values), onSuccess: reset })
  return <><PageHero eyebrow="Contact" title="Start a conversation." text="For partnership opportunities, media enquiries or general questions, send our Hong Kong team a note." compact /><Section><Paper component="form" className="enterprise-form narrow" onSubmit={handleSubmit((v) => mutation.mutate(v))}><Box className="form-grid"><Field register={register} errors={errors} name="name" label="Name" required /><Field register={register} errors={errors} name="email" label="Email" required type="email" /><Field register={register} errors={errors} name="phone" label="Phone" required /><Field register={register} errors={errors} name="subject" label="Subject" required /></Box><Field register={register} errors={errors} name="message" label="Message" required multiline rows={7} />{mutation.isSuccess && <Alert severity="success">Message received. Our team will be in touch.</Alert>}{mutation.isError && <Alert severity="error">Your message could not be sent. Please try again.</Alert>}<SubmitButton pending={mutation.isPending}>Send message</SubmitButton></Paper></Section></>
}

export function LegalPage({ slug }) {
  const query = useQuery({ queryKey: ['page', slug], queryFn: () => getOne(`/public/legal/${slug}`) })
  return <><PageHero eyebrow="Legal" title={query.data?.title || (slug === 'privacy-policy' ? 'Privacy Policy' : 'Terms of Use')} compact /><Section><Box className="article">{query.isLoading ? <CircularProgress /> : query.isError ? <Alert severity="info">This policy is temporarily unavailable.</Alert> : <Typography className="rich-text">{query.data.content}</Typography>}</Box></Section></>
}
