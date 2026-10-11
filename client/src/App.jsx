import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import { LoadingSpinner } from './components/LoadingState';

const Login = lazy(() => import('./pages/auth/Login').then(module => ({ default: module.Login })));
const Register = lazy(() => import('./pages/auth/Register').then(module => ({ default: module.Register })));

const PatientDashboard = lazy(() => import('./pages/patient/Dashboard').then(module => ({ default: module.PatientDashboard })));
const PatientQueue = lazy(() => import('./pages/patient/Queue').then(module => ({ default: module.PatientQueue })));
const PatientHistory = lazy(() => import('./pages/patient/History').then(module => ({ default: module.PatientHistory })));
const PatientMedicalProfile = lazy(() => import('./pages/patient/MedicalProfile').then(module => ({ default: module.PatientMedicalProfile })));
const PatientEncounterDetail = lazy(() => import('./pages/patient/EncounterDetail').then(module => ({ default: module.PatientEncounterDetail })));

const DoctorDashboard = lazy(() => import('./pages/doctor/Dashboard').then(module => ({ default: module.DoctorDashboard })));
const DoctorQueue = lazy(() => import('./pages/doctor/Queue').then(module => ({ default: module.DoctorQueue })));
const DoctorConsultation = lazy(() => import('./pages/doctor/Consultation').then(module => ({ default: module.DoctorConsultation })));
const DoctorPatientHistory = lazy(() => import('./pages/doctor/PatientHistory').then(module => ({ default: module.DoctorPatientHistory })));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard').then(module => ({ default: module.AdminDashboard })));
const AdminDepartments = lazy(() => import('./pages/admin/Departments').then(module => ({ default: module.AdminDepartments })));
const AdminDoctors = lazy(() => import('./pages/admin/Doctors').then(module => ({ default: module.AdminDoctors })));
const AdminQueue = lazy(() => import('./pages/admin/Queue').then(module => ({ default: module.AdminQueue })));
const AdminAnalytics = lazy(() => import('./pages/admin/Analytics').then(module => ({ default: module.AdminAnalytics })));
const AdminAuditLogs = lazy(() => import('./pages/admin/AuditLogs').then(module => ({ default: module.AdminAuditLogs })));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <LoadingSpinner size="lg" />
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, initialized } = useAuth();

  if (loading || !initialized) {
    return <LoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const PatientLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { path: '/patient/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/patient/queue', label: 'My Queue', icon: QueueIcon },
    { path: '/patient/history', label: 'Visit History', icon: HistoryIcon },
    { path: '/patient/medical-profile', label: 'Medical Profile', icon: ProfileIcon },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-neutral-200">
            <h1 className="text-xl font-bold text-primary-600">MedFlow</h1>
            <p className="text-xs text-neutral-500 mt-1">Patient Portal</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <React.Fragment key={item.path}>
                <React.Suspense fallback={null}>
                  <NavLink to={item.path} icon={item.icon} label={item.label} />
                </React.Suspense>
              </React.Fragment>
            ))}
          </nav>
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={logout} className="btn-secondary btn-sm w-full justify-start">
              <LogoutIcon className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              aria-label="Open menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-4">
              <NotificationCenter />
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const DoctorLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/doctor/queue', label: 'Queue', icon: QueueIcon },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-neutral-200">
            <h1 className="text-xl font-bold text-primary-600">MedFlow</h1>
            <p className="text-xs text-neutral-500 mt-1">Doctor Portal</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <React.Fragment key={item.path}>
                <React.Suspense fallback={null}>
                  <NavLink to={item.path} icon={item.icon} label={item.label} />
                </React.Suspense>
              </React.Fragment>
            ))}
          </nav>
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-neutral-500 truncate">{user?.doctorProfile?.department?.name}</p>
              </div>
            </div>
            <button onClick={logout} className="btn-secondary btn-sm w-full justify-start">
              <LogoutIcon className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              aria-label="Open menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-4">
              <NotificationCenter />
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
    { path: '/admin/departments', label: 'Departments', icon: DepartmentIcon },
    { path: '/admin/doctors', label: 'Doctors', icon: DoctorIcon },
    { path: '/admin/queue', label: 'Queue Management', icon: QueueIcon },
    { path: '/admin/analytics', label: 'Analytics', icon: AnalyticsIcon },
    { path: '/admin/audit-logs', label: 'Audit Logs', icon: AuditIcon },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-neutral-200">
            <h1 className="text-xl font-bold text-primary-600">MedFlow</h1>
            <p className="text-xs text-neutral-500 mt-1">Admin Console</p>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
              <React.Fragment key={item.path}>
                <React.Suspense fallback={null}>
                  <NavLink to={item.path} icon={item.icon} label={item.label} />
                </React.Suspense>
              </React.Fragment>
            ))}
          </nav>
          <div className="p-4 border-t border-neutral-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-700">
                  {user?.full_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-neutral-500 truncate">Administrator</p>
              </div>
            </div>
            <button onClick={logout} className="btn-secondary btn-sm w-full justify-start">
              <LogoutIcon className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 bg-white border-b border-neutral-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              aria-label="Open menu"
            >
              <MenuIcon className="w-6 h-6" />
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-4">
              <NotificationCenter />
            </div>
          </div>
        </header>
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const { user, initialized } = useAuth();

  if (!initialized) {
    return <LoadingFallback />;
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={['PATIENT']}><PatientLayout /></ProtectedRoute>}>
        <Route path="/patient/dashboard" element={<PatientDashboard />} />
        <Route path="/patient/queue" element={<PatientQueue />} />
        <Route path="/patient/history" element={<PatientHistory />} />
        <Route path="/patient/medical-profile" element={<PatientMedicalProfile />} />
        <Route path="/patient/encounters/:id" element={<PatientEncounterDetail />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['DOCTOR']}><DoctorLayout /></ProtectedRoute>}>
        <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
        <Route path="/doctor/queue" element={<DoctorQueue />} />
        <Route path="/doctor/consultation/:queueEntryId" element={<DoctorConsultation />} />
        <Route path="/doctor/patients/:patientId/history" element={<DoctorPatientHistory />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/departments" element={<AdminDepartments />} />
        <Route path="/admin/doctors" element={<AdminDoctors />} />
        <Route path="/admin/queue" element={<AdminQueue />} />
        <Route path="/admin/analytics" element={<AdminAnalytics />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <Suspense fallback={<LoadingFallback />}>
          <AppRoutes />
        </Suspense>
        <Toaster />
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;

const NavLink = ({ to, icon: Icon, label }) => {
  const location = window.location.pathname;
  const isActive = location === to || location.startsWith(to + '/');
  
  return (
    <a
      href={to}
      className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
      onClick={(e) => {
        e.preventDefault();
        window.history.pushState({}, '', to);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }}
    >
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      {label}
    </a>
  );
};

const DashboardIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const QueueIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const HistoryIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ProfileIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DepartmentIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const DoctorIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const AnalyticsIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const AuditIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const MenuIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const LogoutIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);