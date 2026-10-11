import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Table, Pagination } from '../../components/Table';
import { Input, Select } from '../../components/Input';
import { Modal } from '../../components/Modal';
import { LoadingSpinner } from '../../components/LoadingState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminQueue = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [queueEntries, setQueueEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ department_id: '', status: '', date_from: '', date_to: '', search: '' });
  const [departments, setDepartments] = useState([]);
  const [actionLoading, setActionLoading] = useState({});
  const [correctionModal, setCorrectionModal] = useState({ open: false, entry: null });

  useEffect(() => {
    fetchQueue();
    fetchDepartments();
    
    if (socket) {
      socket.on('queue-updated', fetchQueue);
      socket.on('admin-update', fetchQueue);
      
      return () => {
        socket.off('queue-updated', fetchQueue);
        socket.off('admin-update', fetchQueue);
      };
    }
  }, [socket, pagination.page, filters.department_id, filters.status, filters.date_from, filters.date_to]);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      const response = await api.get(`/admin/queue?${params}`);
      setQueueEntries(response.data.data.queueEntries || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination?.total || 0,
        totalPages: response.data.data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load queue');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await api.get('/admin/departments');
      setDepartments(response.data.data.departments || []);
    } catch (err) {
      console.error('Failed to load departments');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleCorrection = async (entry, action, newStatus) => {
    setActionLoading(prev => ({ ...prev, [entry.id]: true }));
    try {
      await api.post(`/admin/queue/${entry.id}/correct`, { action, new_status: newStatus, reason: `Admin correction: ${action}` });
      toast.success('Queue entry updated');
      fetchQueue();
      setCorrectionModal({ open: false, entry: null });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update queue entry');
    } finally {
      setActionLoading(prev => ({ ...prev, [entry.id]: false }));
    }
  };

  const openCorrectionModal = (entry) => {
    setCorrectionModal({ open: true, entry });
  };

  const columns = [
    { key: 'token', header: 'Token', render: (_, row) => `#${row.token_number}` },
    { key: 'patient', header: 'Patient', render: (_, row) => (
      <div>
        <p className="font-medium text-neutral-900">{row.encounter?.patient?.user?.full_name}</p>
        <p className="text-xs text-neutral-500">{row.encounter?.patient?.patient_number}</p>
      </div>
    )},
    { key: 'department', header: 'Department', render: (_, row) => row.encounter?.department?.name },
    { key: 'registered', header: 'Registered', render: (_, row) => format(new Date(row.created_at), 'MMM d, h:mm a') },
    { key: 'status', header: 'Status', render: (_, row) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: 'Actions', render: (_, row) => {
      const isLoading = actionLoading[row.id];
      const canCorrect = !['COMPLETED', 'CANCELLED'].includes(row.status);
      
      return (
        <div className="flex gap-1">
          {canCorrect && (
            <Button variant="ghost" size="sm" onClick={() => openCorrectionModal(row)} loading={isLoading} disabled={isLoading}>
              Correct
            </Button>
          )}
        </div>
      );
    }},
  ];

  if (loading && queueEntries.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Queue Management</h1>
            <p className="page-subtitle">View and manage all queue entries</p>
          </div>
        </div>
        <Card>
          <LoadingSpinner />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Queue Management</h1>
          <p className="page-subtitle">View and manage all queue entries</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <Select
              label="Department"
              options={departments.map(d => ({ value: d.id, label: d.name }))}
              value={filters.department_id}
              onChange={(e) => handleFilterChange('department_id', e.target.value)}
              placeholder="All Departments"
            />
            <Select
              label="Status"
              options={[
                { value: 'REGISTERED', label: 'Registered' },
                { value: 'WAITING', label: 'Waiting' },
                { value: 'CALLED', label: 'Called' },
                { value: 'IN_PROGRESS', label: 'In Progress' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'SKIPPED', label: 'Skipped' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'NO_SHOW', label: 'No Show' },
              ]}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              placeholder="All Statuses"
            />
            <Input
              label="From Date"
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
            <Input
              label="To Date"
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
            <Input
              label="Search"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Token, Patient..."
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={queueEntries}
          keyField="id"
          loading={loading}
          emptyMessage="No queue entries found"
        />
        {pagination.totalPages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            pageSize={pagination.limit}
            onPageSizeChange={(size) => setPagination(prev => ({ ...prev, limit: size, page: 1 }))}
            showSizeChanger
          />
        )}
      </Card>

      <Modal isOpen={correctionModal.open} onClose={() => setCorrectionModal({ open: false, entry: null })} title="Queue Correction" size="md">
        {correctionModal.entry && (
          <div className="space-y-4">
            <p className="text-neutral-600">Correcting token #{correctionModal.entry.token_number} for {correctionModal.entry.encounter?.patient?.user?.full_name}</p>
            <p className="text-sm text-neutral-500">Current status: <span className="font-medium">{correctionModal.entry.status}</span></p>
            <div>
              <label className="label">Action</label>
              <Select
                options={[
                  { value: 'CANCEL', label: 'Cancel' },
                  { value: 'REINSTATE', label: 'Reinstate to Waiting' },
                  { value: 'CHANGE_STATUS', label: 'Change Status' },
                ]}
                value=""
                onChange={(e) => setCorrectionModal(prev => ({ ...prev, action: e.target.value }))}
              />
            </div>
            {correctionModal.action === 'CHANGE_STATUS' && (
              <Select
                label="New Status"
                options={[
                  { value: 'REGISTERED', label: 'Registered' },
                  { value: 'WAITING', label: 'Waiting' },
                  { value: 'CALLED', label: 'Called' },
                  { value: 'IN_PROGRESS', label: 'In Progress' },
                  { value: 'COMPLETED', label: 'Completed' },
                  { value: 'SKIPPED', label: 'Skipped' },
                  { value: 'CANCELLED', label: 'Cancelled' },
                  { value: 'NO_SHOW', label: 'No Show' },
                ]}
                value=""
                onChange={(e) => setCorrectionModal(prev => ({ ...prev, newStatus: e.target.value }))}
              />
            )}
            <Modal.Footer>
              <Button variant="ghost" onClick={() => setCorrectionModal({ open: false, entry: null })}>Cancel</Button>
              <Button variant="danger" onClick={() => handleCorrection(correctionModal.entry, correctionModal.action, correctionModal.newStatus)} loading={actionLoading[correctionModal.entry?.id]}>
                Apply
              </Button>
            </Modal.Footer>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminQueue;