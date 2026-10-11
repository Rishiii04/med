import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Table, Pagination } from '../../components/Table';
import { Input, Select } from '../../components/Input';
import { LoadingSpinner } from '../../components/LoadingState';
import { format } from 'date-fns';

export const AdminAuditLogs = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ 
    actor_user_id: '', 
    patient_id: '', 
    action: '', 
    resource_type: '', 
    date_from: '', 
    date_to: '' 
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, filters.actor_user_id, filters.patient_id, filters.action, filters.resource_type, filters.date_from, filters.date_to]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      const response = await api.get(`/admin/audit-logs?${params}`);
      setAuditLogs(response.data.data.auditLogs || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination?.total || 0,
        totalPages: response.data.data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      console.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const actionColors = {
    CREATE: 'primary',
    UPDATE: 'yellow',
    DELETE: 'danger',
    VIEW: 'info',
    LOGIN: 'green',
    LOGOUT: 'neutral',
    REGISTER: 'primary',
    QUEUE: 'blue',
    CONSULTATION: 'purple',
    MEDICAL: 'pink',
    ADMIN: 'indigo',
  };

  const getActionBadge = (action) => {
    const prefix = action.split('_')[0];
    return actionColors[prefix] || 'neutral';
  };

  const columns = [
    { key: 'timestamp', header: 'Time', render: (_, row) => format(new Date(row.timestamp), 'MMM d, yyyy h:mm:ss a') },
    { key: 'actor', header: 'Actor', render: (_, row) => row.actor?.full_name || 'System' },
    { key: 'action', header: 'Action', render: (_, row) => <Badge variant={getActionBadge(row.action)}>{row.action}</Badge> },
    { key: 'resource_type', header: 'Resource', render: (_, row) => row.resource_type },
    { key: 'resource_id', header: 'Resource ID', render: (_, row) => row.resource_id ? row.resource_id.slice(0, 8) + '...' : '-' },
    { key: 'patient', header: 'Patient', render: (_, row) => row.patient?.user?.full_name || '-' },
    { key: 'reason', header: 'Reason', render: (_, row) => row.reason || '-' },
  ];

  if (loading && auditLogs.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Audit Logs</h1>
            <p className="page-subtitle">System activity and access logs</p>
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
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">System activity and access logs</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <Input
              label="Actor ID"
              value={filters.actor_user_id}
              onChange={(e) => handleFilterChange('actor_user_id', e.target.value)}
              placeholder="Actor User ID"
            />
            <Input
              label="Patient ID"
              value={filters.patient_id}
              onChange={(e) => handleFilterChange('patient_id', e.target.value)}
              placeholder="Patient ID"
            />
            <Input
              label="Action"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              placeholder="Action"
            />
            <Input
              label="Resource Type"
              value={filters.resource_type}
              onChange={(e) => handleFilterChange('resource_type', e.target.value)}
              placeholder="Resource Type"
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={auditLogs}
          keyField="id"
          loading={loading}
          emptyMessage="No audit logs found"
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
    </div>
  );
};

export default AdminAuditLogs;