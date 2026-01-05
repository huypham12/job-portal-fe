import React, { Suspense } from "react"
import { createRoot } from "react-dom/client"
import { createBrowserRouter, RouterProvider } from "react-router-dom"
import App from "./App.jsx"
import RequireRecruiter from "./auth/RequireRecruiter.jsx"
import RequireSeeker from "./auth/RequireSeeker.jsx"
import RequireAdmin from "./auth/RequireAdmin.jsx"

// Lazy load all page components
const Home = React.lazy(() => import("./pages/Home.jsx"))
const JobDetail = React.lazy(() => import("./pages/JobDetail.jsx"))
const PostJob = React.lazy(() => import("./pages/PostJob.jsx"))
const Login = React.lazy(() => import("./pages/Login.jsx"))
const ApplyJob = React.lazy(() => import("./pages/ApplyJob.jsx"))
const CompaniesPage = React.lazy(() => import("./pages/CompaniesPage.jsx"))
const Register = React.lazy(() => import("./pages/Register.jsx"))
const VerifyEmail = React.lazy(() => import("./pages/VerifyEmail.jsx"))
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword.jsx"))
const VerifyForgotPassword = React.lazy(() => import("./pages/VerifyForgotPassword.jsx"))
const ResetPassword = React.lazy(() => import("./pages/ResetPassword.jsx"))
const ChangePassword = React.lazy(() => import("./pages/ChangePassword.jsx"))
const Profile = React.lazy(() => import("./pages/Profile.jsx"))
const RecruiterDashboard = React.lazy(() => import("./pages/RecruiterDashboard.jsx"))
const RecruiterChangePassword = React.lazy(() => import("./pages/RecruiterChangePassword.jsx"))
const CompanyOnboardingPage = React.lazy(() => import("./pages/CompanyOnboardingPage.jsx"))
const RecruiterCompanyPage = React.lazy(() => import("./pages/RecruiterCompanyPage.jsx"))
const RecruiterCompanyGuard = React.lazy(() => import("./pages/RecruiterCompanyGuard.jsx"))
const CompanyDetailsPage = React.lazy(() => import("./pages/CompanyDetailsPage.jsx"))
const ResumesList = React.lazy(() => import("./pages/ResumesList.jsx"))
const ResumeCreate = React.lazy(() => import("./pages/ResumeCreate.jsx"))
const ResumeDetail = React.lazy(() => import("./pages/ResumeDetail.jsx"))
const SavedJobs = React.lazy(() => import("./pages/SavedJobs.jsx"))
const MyApplications = React.lazy(() => import("./pages/MyApplications.jsx"))
const MyApplicationDetail = React.lazy(() => import("./pages/MyApplicationDetail.jsx"))
const MyJobs = React.lazy(() => import("./pages/MyJobs.jsx"))
const JobManage = React.lazy(() => import("./pages/JobManage.jsx"))
const ApplicationsList = React.lazy(() => import("./pages/ApplicationsList.jsx"))
const ApplicationDetail = React.lazy(() => import("./pages/ApplicationDetail.jsx"))
const ShortlistedList = React.lazy(() => import("./pages/ShortlistedList.jsx"))
const AdminLayout = React.lazy(() => import("./pages/admin/AdminLayout.jsx"))
const AdminDashboard = React.lazy(() => import("./pages/admin/AdminDashboard.jsx"))
const AdminUsersList = React.lazy(() => import("./pages/admin/AdminUsersList.jsx"))
const AdminUserDetail = React.lazy(() => import("./pages/admin/AdminUserDetail.jsx"))
const AdminJobsList = React.lazy(() => import("./pages/admin/AdminJobsList.jsx"))
const AdminPendingJobs = React.lazy(() => import("./pages/admin/AdminPendingJobs.jsx"))
const AdminJobDetail = React.lazy(() => import("./pages/admin/AdminJobDetail.jsx"))
const AdminLogin = React.lazy(() => import("./pages/admin/AdminLogin.jsx"))

// New search and matching components
const SearchPage = React.lazy(() => import("./pages/SearchPage.jsx"))
const CandidateRecommendations = React.lazy(() => import("./pages/Recruiter/CandidateRecommendations.jsx"))
const JobCandidates = React.lazy(() => import("./pages/Recruiter/JobCandidates.jsx"))

import "./index.css"

const router = createBrowserRouter(
  [
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'companies', element: <CompaniesPage /> },
      { path: 'companies/:id', element: <CompanyDetailsPage /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'search/:id/apply', element: (
        <RequireSeeker>
          <ApplyJob />
        </RequireSeeker>
      ) },
      { path: 'search/:id', element: <JobDetail /> },
      { path: 'register', element: <Register /> },
      { path: 'verify-email', element: <VerifyEmail /> },
      { path: 'auth/verify-email', element: <VerifyEmail /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'verify-forgot-password', element: <VerifyForgotPassword /> },
      { path: 'auth/verify-forgot-password', element: <VerifyForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
      { path: 'auth/reset-password', element: <ResetPassword /> },
      { path: 'change-password', element: <ChangePassword /> },
      { path: 'profile', element: (
        <RequireSeeker>
          <Profile />
        </RequireSeeker>
      ) },
      { path: 'resumes', element: (
        <RequireSeeker>
          <ResumesList />
        </RequireSeeker>
      ) },
      { path: 'resumes/create', element: (
        <RequireSeeker>
          <ResumeCreate />
        </RequireSeeker>
      ) },
      { path: 'resumes/:id', element: (
        <RequireSeeker>
          <ResumeDetail />
        </RequireSeeker>
      ) },
      { path: 'saved-jobs', element: (
        <RequireSeeker>
          <SavedJobs />
        </RequireSeeker>
      ) },
      { path: 'applications', element: (
        <RequireSeeker>
          <MyApplications />
        </RequireSeeker>
      ) },
      { path: 'applications/:id', element: (
        <RequireSeeker>
          <MyApplicationDetail />
        </RequireSeeker>
      ) },
      { path: 'post-job', element: (
        <RequireRecruiter>
          <PostJob />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/dashboard', element: (
        <RequireRecruiter>
          <RecruiterDashboard />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/talent-pool', element: (
        <RequireRecruiter>
          <RecruiterDashboard />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/company', element: (
        <RequireRecruiter>
          <RecruiterCompanyGuard>
            <RecruiterCompanyPage />
          </RecruiterCompanyGuard>
        </RequireRecruiter>
      ) },
      { path: 'recruiter/change-password', element: (
        <RequireRecruiter>
          <RecruiterChangePassword />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/jobs', element: (
        <RequireRecruiter>
          <RecruiterDashboard />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/jobs/:id/manage', element: (
        <RequireRecruiter>
          <JobManage />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/jobs/:jobId/applications', element: (
        <RequireRecruiter>
          <ApplicationsList />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/applications/:id', element: (
        <RequireRecruiter>
          <ApplicationDetail />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/shortlisted', element: (
        <RequireRecruiter>
          <ShortlistedList />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/candidate-recommendations', element: (
        <RequireRecruiter>
          <CandidateRecommendations />
        </RequireRecruiter>
      ) },
      { path: 'recruiter/jobs/:jobId/candidates', element: (
        <RequireRecruiter>
          <JobCandidates />
        </RequireRecruiter>
      ) },
      { path: 'onboarding/company', element: (
        <RequireRecruiter>
          <CompanyOnboardingPage />
        </RequireRecruiter>
      ) },
      { path: 'login', element: <Login /> },
    ],
  },
  {
    path: '/admin/login',
    element: <AdminLogin />,
  },
  {
    path: '/admin',
    element: (
      <RequireAdmin>
        <AdminLayout />
      </RequireAdmin>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'dashboard', element: <AdminDashboard /> },
      { path: 'users', element: <AdminUsersList /> },
      { path: 'users/:id', element: <AdminUserDetail /> },
      { path: 'jobs', element: <AdminJobsList /> },
      { path: 'jobs/pending', element: <AdminPendingJobs /> },
      { path: 'jobs/:id', element: <AdminJobDetail /> },
    ],
  },
], {
  future: {
    v7_startTransition: true,
  },
})

// Loading component for Suspense fallback
const LoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #e2e8f0',
        borderTop: '3px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 16px'
      }} />
      <p style={{ color: '#64748b', margin: 0 }}>Đang tải...</p>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

createRoot(document.getElementById('root')).render(
  <Suspense fallback={<LoadingFallback />}>
    <RouterProvider router={router} />
  </Suspense>
)
