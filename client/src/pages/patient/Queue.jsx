import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner, TableSkeleton } from '../../components/LoadingState';
import { format } from 'date-fns';

export const PatientQueue = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchQueueStatus();
    
    if (socket) {
      socket.on('queue-updated', () => fetchQueueStatus());
      socket.on('patient-notification', () => fetchQueueStatus());
      socket.on('consultation-updated', () => fetchQueueStatus());
      
      return () => {
        socket.off('queue-updated', () => fetchQueueStatus());
        socket.off('patient-notification', () => fetchQueueStatus());
        socket.off('consultation-updated', () => fetchQueueStatus());
      };
    }
  }, [socket]);

  const fetchQueueStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/queue');
      setQueueStatus(response.data.data.activeToken);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load queue status');
    } finally {
      setLoading(false);
    }
  };

  const getPositionText = (position) => {
    if (!position) return 'N/A';
    if (position === 1) return 'Next';
    return `#${position}`;
  };

  const getEstimatedTimeText = (minutes) => {
    if (!minutes) return 'Calculating...';
    if (minutes < 1) return 'Less than a minute';
    return `~${minutes} min`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">My Queue</h1>
          <p className="page-subtitle">Track your position in real-time</p>
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-neutral-200 rounded w-48" />
          </CardHeader>
          <CardContent>
            <TableSkeleton rows={3} columns={4} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!queueStatus?.activeToken) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">My Queue</h1>
          <p className="page-subtitle">Track your position in real-time</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto h-16 w-16 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-neutral-900">No Active Token</h3>
            <p className="mt-2 text-neutral-500">You don't have an active OPD registration at the moment.</p>
            <Button variant="primary" asChild className="mt-6">
              <a href="/patient/encounters/new">Register for OPD</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const token = queueStatus.activeToken;
  const isActive = ['REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS'].includes(token.status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">My Queue</h1>
        <p className="page-subtitle">Track your position in real-time</p>
      </div>

      <Card className={`border-${token.status === 'COMPLETED' ? 'green' : token.status === 'SKIPPED' ? 'red' : 'primary'}-200 bg-${token.status === 'COMPLETED' ? 'green' : token.status === 'SKIPPED' ? 'red' : 'primary'}-50`}>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                OPD Token #{token.token_number}
              </CardTitle>
              <p className="text-neutral-500 mt-1">{token.department?.name} • {format(new Date(token.registered_at), 'MMM d, yyyy')}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={token.status} size="lg" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center p-4 bg-white rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-500">Queue Position</p>
              <p className="text-4xl font-bold text-primary-600">{getPositionText(token.queue_position)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-500">Estimated Wait</p>
              <p className="text-4xl font-bold text-neutral-900">{getEstimatedTimeText(token.estimated_wait_minutes)}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-500">Registered At</p>
              <p className="text-lg font-medium text-neutral-900">{format(new Date(token.registered_at), 'h:mm a')}</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-neutral-200">
              <p className="text-sm text-neutral-500">Department</p>
              <p className="text-lg font-medium text-neutral-900">{token.department?.name}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Registered</p>
                <p className="font-medium text-neutral-900">{format(new Date(token.registered_at), 'MMM d, yyyy h:mm a')}</p>
              </div>
            </div>

            {token.called_at && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Called</p>
                  <p className="font-medium text-neutral-900">{format(new Date(token.called_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            )}

            {token.consultation_started_at && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Consultation Started</p>
                  <p className="font-medium text-neutral-900">{format(new Date(token.consultation_started_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            )}

            {token.completed_at && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Completed</p>
                  <p className="font-medium text-neutral-900">{format(new Date(token.completed_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
              </div>
            )}

            {token.skipped_at && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Skipped</p>
                  <p className="font-medium text-neutral-900">{format(new Date(token.skipped_at), 'MMM d, yyyy h:mm a')}</p>
                  {token.skip_reason && <p className="text-sm text-neutral-500">Reason: {token.skip_reason}</p>}
                </div>
              </div>
            )}
          </div>

          {isActive && (
            <div className="mt-6 p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium text-neutral-900">Real-time Updates</p>
                  <p className="text-sm text-neutral-600">This page updates automatically when your queue status changes.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What Happens Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">1</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Wait for your turn</p>
                <p className="text-sm text-neutral-600">Your position updates in real-time as patients ahead of you are called.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">2</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Listen for your name</p>
                <p className="text-sm text-neutral-600">You'll be notified when your token number is called. Please proceed to the consultation room.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">3</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Consultation</p>
                <p className="text-sm text-neutral-600">The doctor will start your consultation. You'll see the status change to 'Consultation in Progress'.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">4</span>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Visit Complete</p>
                <p className="text-sm text-neutral-600">After consultation, you'll receive any prescriptions or follow-up instructions.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientQueue;