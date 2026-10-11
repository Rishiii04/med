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

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    
    if (socket) {
      socket.on('queue-updated', fetchDashboardData);
      socket.on('consultation-updated', fetchDashboardData);
      
      return () => {
        socket.off('queue-updated', fetchDashboardData);
        socket.off('consultation-updated', fetchDashboardData);
      };
    }
  }, [socket]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctor/dashboard');
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
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome, Dr. {user?.full_name}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome, Dr. {user?.full_name}</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-neutral-500">No active session today</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { doctor, session, queueStats, myStats, currentConsultation } = dashboardData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            {doctor?.department?.name} {session ? `• ${format(new Date(`2000-01-01T${session.start_time}`), 'h:mm a')} - ${format(new Date(`2000-01-01T${session.end_time}`), 'h:mm a')}` : '• No active session'}
          </p>
        </div>
      </div>

      {currentConsultation && (
        <Card className="border-primary-200 bg-primary-50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Active Consultation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-neutral-900">{currentConsultation.patientName}</p>
                <p className="text-sm text-neutral-500">Started {format(new Date(currentConsultation.startedAt), 'h:mm a')}</p>
              </div>
              <Button variant="primary" asChild size="lg">
                <Link to={`/doctor/consultation/${currentConsultation.id}`}>Continue Consultation</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="stat-icon bg-primary-100 text-primary-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="stat-value">{queueStats.waiting}</p>
              <p className="stat-label">Waiting</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4">
            <div className="stat-icon bg-yellow-100 text-yellow-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="stat-value">{queueStats.called}</p>
              <p className="stat-label">Called</p>
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
              <p className="stat-value">{myStats.completedToday}</p>
              <p className="stat-label">Completed Today</p>
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
              <p className="stat-value">{myStats.consultationsToday}</p>
              <p className="stat-label">Total Today</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader action={
          <Button variant="primary" asChild>
            <Link to="/doctor/queue">View Queue</Link>
          </Button>
        }>
          <CardTitle>Today's Queue Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-2xl font-bold text-neutral-900">{queueStats.total}</p>
              <p className="text-sm text-neutral-500">Total Patients</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{queueStats.inProgress}</p>
              <p className="text-sm text-neutral-500">In Progress</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{queueStats.skipped}</p>
              <p className="text-sm text-neutral-500">Skipped</p>
            </div>
            <div className="p-3 bg-neutral-50 rounded-lg">
              <p className="text-2xl font-bold text-neutral-600">{queueStats.cancelled}</p>
              <p className="text-sm text-neutral-500">Cancelled</p>
            </div>
          </div>
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

export default DoctorDashboard;