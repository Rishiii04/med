import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const DoctorQueue = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [queueData, setQueueData] = useState({ queueEntries: [], session: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchQueue();
    
    if (socket) {
      socket.on('queue-updated', fetchQueue);
      
      return () => {
        socket.off('queue-updated', fetchQueue);
      };
    }
  }, [socket]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctor/queue');
      setQueueData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (queueEntryId, action, payload = {}) => {
    setActionLoading(prev => ({ ...prev, [queueEntryId]: true }));
    try {
      await api.post(`/doctor/queue/${queueEntryId}/${action}`, payload);
      toast.success(`Patient ${action === 'call' ? 'called' : action === 'start' ? 'consultation started' : action} successfully`);
      fetchQueue();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} patient`);
    } finally {
      setActionLoading(prev => ({ ...prev, [queueEntryId]: false }));
    }
  };

  const columns = [
    { key: 'token', header: 'Token', render: (_, row) => `#${row.token_number}` },
    { key: 'patient', header: 'Patient', render: (_, row) => (
      <div>
        <p className="font-medium text-neutral-900">{row.patient?.full_name}</p>
        <p className="text-xs text-neutral-500">{row.patient?.patient_number}</p>
      </div>
    )},
    { key: 'registration', header: 'Registered', render: (_, row) => format(new Date(row.registration_time), 'h:mm a') },
    { key: 'waiting', header: 'Wait Time', render: (_, row) => {
      if (!row.waiting_duration) return '-';
      const mins = row.waiting_duration;
      if (mins < 60) return `${mins}m`;
      return `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }},
    { key: 'status', header: 'Status', render: (_, row) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: 'Actions', render: (_, row) => {
      const isLoading = actionLoading[row.id];
      const canCall = ['WAITING', 'REGISTERED'].includes(row.status);
      const canStart = row.status === 'CALLED';
      const canComplete = row.status === 'IN_PROGRESS';
      const canSkip = ['WAITING', 'CALLED', 'REGISTERED'].includes(row.status);
      const canRecall = row.status === 'SKIPPED';

      return (
        <div className="flex gap-1">
          {canCall && (
            <Button variant="primary" size="sm" onClick={() => handleAction(row.id, 'call')} loading={isLoading} disabled={isLoading}>
              Call
            </Button>
          )}
          {canStart && (
            <Button variant="primary" size="sm" onClick={() => window.location.href = `/doctor/consultation/${row.id}`} loading={isLoading} disabled={isLoading}>
              Start
            </Button>
          )}
          {canComplete && (
            <Button variant="success" size="sm" onClick={() => window.location.href = `/doctor/consultation/${row.id}`} loading={isLoading} disabled={isLoading}>
              Complete
            </Button>
          )}
          {canSkip && (
            <Button variant="warning" size="sm" onClick={() => {
              const reason = prompt('Reason for skipping:');
              if (reason) handleAction(row.id, 'skip', { reason });
            }} loading={isLoading} disabled={isLoading}>
              Skip
            </Button>
          )}
          {canRecall && (
            <Button variant="ghost" size="sm" onClick={() => handleAction(row.id, 'recall')} loading={isLoading} disabled={isLoading}>
              Recall
            </Button>
          )}
        </div>
      );
    }},
  ];

  if (loading && queueData.queueEntries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Queue</h1>
            <p className="page-subtitle">Manage patient queue for today's session</p>
          </div>
        </div>
        <Card>
          <TableSkeleton rows={5} columns={6} />
        </Card>
      </div>
    );
  }

  if (!queueData.session) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Queue</h1>
            <p className="page-subtitle">No active session today</p>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-neutral-900">No Active Session</h3>
            <p className="mt-2 text-neutral-500">There is no active operating session for your department today.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Queue</h1>
          <p className="page-subtitle">
            {queueData.session.department_id} • {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient Queue</CardTitle>
        </CardHeader>
        <CardContent>
          {queueData.queueEntries.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <p className="mt-2 text-neutral-500">No patients in queue</p>
            </div>
          ) : (
            <Table
              columns={columns}
              data={queueData.queueEntries}
              keyField="id"
              loading={loading}
              emptyMessage="No patients in queue"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorQueue;