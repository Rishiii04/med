import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Table, Pagination } from '../../components/Table';
import { LoadingSpinner, TableSkeleton } from '../../components/LoadingState';
import { format } from 'date-fns';

export const PatientHistory = () => {
  const { user } = useAuth();
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ status: '', date_from: '', date_to: '' });

  useEffect(() => {
    fetchEncounters();
  }, [pagination.page, filters]);

  const fetchEncounters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      });
      const response = await api.get(`/patients/encounters?${params}`);
      setEncounters(response.data.data.encounters || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination?.total || 0,
        totalPages: response.data.data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load visit history');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const columns = [
    { key: 'date', header: 'Date', render: (_, row) => format(new Date(row.created_at), 'MMM d, yyyy h:mm a') },
    { key: 'department', header: 'Department', render: (_, row) => row.department?.name },
    { key: 'visit_type', header: 'Type', render: (val) => <Badge variant="neutral">{val}</Badge> },
    { key: 'token', header: 'Token', render: (_, row) => row.queueEntry?.token_number || '-' },
    { key: 'status', header: 'Status', render: (_, row) => <StatusBadge status={row.status} /> },
    { key: 'actions', header: '', render: (_, row) => (
      <Button variant="ghost" size="sm" asChild>
        <Link to={`/patient/encounters/${row.id}`}>View</Link>
      </Button>
    )},
  ];

  if (loading && encounters.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Visit History</h1>
          <p className="page-subtitle">View your past appointments and consultations</p>
        </div>
        <Card>
          <TableSkeleton rows={5} columns={6} />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Visit History</h1>
          <p className="page-subtitle">View your past appointments and consultations</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="input"
            >
              <option value="">All Statuses</option>
              <option value="REGISTERED">Registered</option>
              <option value="WAITING">Waiting</option>
              <option value="CALLED">Called</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="SKIPPED">Skipped</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
              className="input"
              placeholder="From Date"
            />
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
              className="input"
              placeholder="To Date"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table
          columns={columns}
          data={encounters}
          keyField="id"
          loading={loading}
          emptyMessage="No visits found"
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

export default PatientHistory;