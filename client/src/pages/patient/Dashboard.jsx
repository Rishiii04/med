import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner, TableSkeleton } from '../../components/LoadingState';
import { format } from 'date-fns';

export const PatientDashboard = () => {
  const { user, fetchUser } = useAuth();
  const { socket } = useSocket();
  const [queueStatus, setQueueStatus] = useState(null);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    if (socket) {
      socket.on('queue-updated', handleQueueUpdate);
      socket.on('patient-notification', handlePatientNotification);
      socket.on('consultation-updated', handleConsultationUpdate);
      
      return () => {
        socket.off('queue-updated', handleQueueUpdate);
        socket.off('patient-notification', handlePatientNotification);
        socket.off('consultation-updated', handleConsultationUpdate);
      };
    }
  }, [socket, fetchUser]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [queueRes, encountersRes] = await Promise.all([
        api.get('/patients/queue'),
        api.get('/patients/encounters?limit=5&status=REGISTERED,WAITING,CALLED,IN_PROGRESS'),
      ]);
      
      setQueueStatus(queueRes.data.data.activeToken);
      setUpcomingAppointments(encountersRes.data.data.encounters || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleQueueUpdate = (data) => {
    fetchDashboardData();
  };

  const handlePatientNotification = (notification) => {
    // Could show toast notification here
    fetchDashboardData();
  };

  const handleConsultationUpdate = (data) => {
    fetchDashboardData();
  };

  const getStatusColor = (status) => {
    const colors = {
      REGISTERED: 'neutral',
      WAITING: 'info',
      CALLED: 'warning',
      IN_PROGRESS: 'primary',
      COMPLETED: 'success',
      SKIPPED: 'danger',
      CANCELLED: 'neutral',
      NO_SHOW: 'danger',
    };
    return colors[status] || 'neutral';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.full_name}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back, {user?.full_name}</p>
        </div>
        <Button variant="primary" asChild>
          <Link to="/patient/encounters/new">Register for OPD</Link>
        </Button>
      </div>

      {queueStatus?.activeToken && (
        <Card className="border-primary-200 bg-primary-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Active OPD Token
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-neutral-500">Token Number</p>
                <p className="text-3xl font-bold text-primary-600">{queueStatus.activeToken.token_number}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Status</p>
                <StatusBadge status={queueStatus.activeToken.status} size="lg" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Department</p>
                <p className="font-medium text-neutral-900">{queueStatus.activeToken.department?.name}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Queue Position</p>
                <p className="font-medium text-neutral-900">
                  {queueStatus.activeToken.queue_position ? `#${queueStatus.activeToken.queue_position}` : 'N/A'}
                </p>
              </div>
              {queueStatus.activeToken.estimated_wait_minutes && (
                <div className="md:col-span-2">
                  <p className="text-sm text-neutral-500">Estimated Wait Time</p>
                  <p className="font-medium text-neutral-900">~{queueStatus.activeToken.estimated_wait_minutes} minutes</p>
                </div>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-primary-100">
              <Button variant="primary" asChild>
                <Link to="/patient/queue">View Queue Details</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="stat-icon bg-primary-100 text-primary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="stat-value">{upcomingAppointments.length}</p>
              <p className="stat-label">Upcoming Appointments</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="stat-icon bg-green-100 text-green-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="stat-value">{upcomingAppointments.filter(e => e.status === 'COMPLETED').length}</p>
              <p className="stat-label">Completed Visits</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="stat-icon bg-blue-100 text-blue-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="stat-value">{upcomingAppointments.filter(e => e.queueEntry?.status === 'WAITING').length}</p>
              <p className="stat-label">Currently Waiting</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader action={
          <Button variant="ghost" asChild size="sm">
            <Link to="/patient/history">View All</Link>
          </Button>
        }>
          <CardTitle>Recent Visits</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="mt-2 text-neutral-500">No recent visits</p>
              <Button variant="primary" asChild className="mt-4">
                <Link to="/patient/encounters/new">Register for OPD</Link>
              </Button>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>Token</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingAppointments.slice(0, 5).map((encounter) => (
                    <tr key={encounter.id}>
                      <td>{format(new Date(encounter.created_at), 'MMM d, yyyy')}</td>
                      <td>{encounter.department?.name}</td>
                      <td><Badge variant="neutral">{encounter.visit_type}</Badge></td>
                      <td>{encounter.queueEntry?.token_number || '-'}</td>
                      <td><StatusBadge status={encounter.status} /></td>
                      <td>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/patient/encounters/${encounter.id}`}>View</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const CardSkeleton = () => (
  <Card className="animate-pulse">
    <div className="h-6 bg-neutral-200 rounded w-3/4 mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-neutral-200 rounded w-full" />
      <div className="h-4 bg-neutral-200 rounded w-2/3" />
      <div className="h-4 bg-neutral-200 rounded w-1/2" />
    </div>
  </Card>
);

export default PatientDashboard;