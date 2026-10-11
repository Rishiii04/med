import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingState';
import { format } from 'date-fns';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    if (socket) {
      socket.on('queue-updated', fetchDashboardData);
      socket.on('admin-update', fetchDashboardData);
      
      return () => {
        socket.off('queue-updated', fetchDashboardData);
        socket.off('admin-update', fetchDashboardData);
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard');
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Hospital Operations Overview</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Hospital Operations Overview</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-neutral-500">Failed to load dashboard data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { overview, departmentWorkload } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Hospital Operations Overview • {format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Registrations" value={overview.totalRegistrations} icon={<RegistrationIcon />} color="primary" />
        <StatCard title="Waiting Patients" value={overview.waitingPatients} icon={<WaitingIcon />} color="yellow" />
        <StatCard title="Active Consultations" value={overview.activeConsultations} icon={<ConsultationIcon />} color="green" />
        <StatCard title="Completed Today" value={overview.completedToday} icon={<CheckIcon />} color="blue" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Avg Wait Time" value={`${overview.avgWaitMinutes} min`} icon={<WaitTimeIcon />} color="purple" />
        <StatCard title="Avg Consultation" value={`${overview.avgConsultationMinutes} min`} icon={<ConsultationTimeIcon />} color="indigo" />
        <StatCard title="Departments Active" value={departmentWorkload.filter(d => d.active).length} icon={<DepartmentIcon />} color="pink" />
        <StatCard title="Total Departments" value={departmentWorkload.length} icon={<DepartmentIcon />} color="gray" />
      </div>

      <Card>
        <CardHeader action={
          <Button variant="primary" asChild size="sm">
            <a href="/admin/analytics">View Analytics</a>
          </Button>
        }>
          <CardTitle>Department Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                  <th className="pb-3 font-medium text-center">Waiting</th>
                  <th className="pb-3 font-medium text-center">Completed</th>
                  <th className="pb-3 font-medium text-center">Total</th>
                  <th className="pb-3 font-medium text-center">Avg Wait</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {departmentWorkload.map((dept) => (
                  <tr key={dept.department.id} className="hover:bg-neutral-50">
                    <td className="py-3 font-medium text-neutral-900">{dept.department.name}</td>
                    <td className="py-3 text-center">
                      <Badge variant={dept.active ? 'success' : 'neutral'}>{dept.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="py-3 text-center font-medium text-blue-600">{dept.waiting}</td>
                    <td className="py-3 text-center font-medium text-green-600">{dept.completed}</td>
                    <td className="py-3 text-center font-medium text-neutral-900">{dept.total}</td>
                    <td className="py-3 text-center text-neutral-600">{Math.round(dept.avgWait)} min</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild className="h-20 flex flex-col gap-2">
                <a href="/admin/departments">
                  <DepartmentIcon className="w-6 h-6 mx-auto" />
                  Departments
                </a>
              </Button>
              <Button variant="outline" asChild className="h-20 flex flex-col gap-2">
                <a href="/admin/doctors">
                  <DoctorIcon className="w-6 h-6 mx-auto" />
                  Doctors
                </a>
              </Button>
              <Button variant="outline" asChild className="h-20 flex flex-col gap-2">
                <a href="/admin/queue">
                  <QueueIcon className="w-6 h-6 mx-auto" />
                  Queue Mgmt
                </a>
              </Button>
              <Button variant="outline" asChild className="h-20 flex flex-col gap-2">
                <a href="/admin/analytics">
                  <AnalyticsIcon className="w-6 h-6 mx-auto" />
                  Analytics
                </a>
              </Button>
              <Button variant="outline" asChild className="h-20 flex flex-col gap-2">
                <a href="/admin/audit-logs">
                  <AuditIcon className="w-6 h-6 mx-auto" />
                  Audit Logs
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Database</span>
                <Badge variant="success" dot>Connected</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Real-time Updates</span>
                <Badge variant="success" dot>Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Authentication</span>
                <Badge variant="success" dot>Operational</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-700">Queue Service</span>
                <Badge variant="success" dot>Running</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    indigo: 'bg-indigo-100 text-indigo-600',
    pink: 'bg-pink-100 text-pink-600',
    gray: 'bg-neutral-100 text-neutral-600',
  };

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`stat-icon ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="stat-value">{value}</p>
          <p className="stat-label">{title}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const StatCardSkeleton = () => (
  <Card className="animate-pulse">
    <div className="flex items-center gap-4">
      <div className="stat-icon bg-neutral-200" />
      <div>
        <div className="h-8 bg-neutral-200 rounded w-24" />
        <div className="h-4 bg-neutral-200 rounded w-32 mt-1" />
      </div>
    </div>
  </Card>
);

const CardSkeleton = () => (
  <Card className="animate-pulse">
    <div className="h-6 bg-neutral-200 rounded w-1/2 mb-4" />
    <div className="space-y-4"><div className="h-4 bg-neutral-200 rounded" /><div className="h-4 bg-neutral-200 rounded" /></div>
  </Card>
);

const RegistrationIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const WaitingIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ConsultationIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WaitTimeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ConsultationTimeIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
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

const QueueIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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

export default AdminDashboard;