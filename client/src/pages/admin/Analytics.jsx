import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Select } from '../../components/Input';
import { LoadingSpinner } from '../../components/LoadingState';
import { format } from 'date-fns';

export const AdminAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ department_id: '', date_from: '', date_to: '' });
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchAnalytics();
    fetchDepartments();
  }, [filters.department_id, filters.date_from, filters.date_to]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/admin/analytics?${params}`);
      setAnalytics(response.data.data);
    } catch (err) {
      console.error('Failed to load analytics');
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
  };

  if (loading && !analytics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Operational metrics and trends</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Operational metrics and trends</p>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-neutral-500">Failed to load analytics</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { period, dailyRegistrations, dailyCompleted, departmentWorkload } = analytics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Operational metrics and trends • {format(new Date(period.from), 'MMM d, yyyy')} - {format(new Date(period.to), 'MMM d, yyyy')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Department"
              options={departments.map(d => ({ value: d.id, label: d.name }))}
              value={filters.department_id}
              onChange={(e) => handleFilterChange('department_id', e.target.value)}
              placeholder="All Departments"
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Registrations" value={dailyRegistrations.reduce((sum, d) => sum + parseInt(d.count), 0)} icon={<RegistrationIcon />} color="primary" />
        <StatCard title="Completed Consultations" value={dailyCompleted.reduce((sum, d) => sum + parseInt(d.count), 0)} icon={<CheckIcon />} color="green" />
        <StatCard title="Active Departments" value={departmentWorkload.filter(d => d.sessions > 0).length} icon={<DepartmentIcon />} color="blue" />
        <StatCard title="Avg Wait Time" value={`${Math.round(departmentWorkload.reduce((sum, d) => sum + d.avgWait, 0) / Math.max(departmentWorkload.length, 1))} min`} icon={<WaitIcon />} color="yellow" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Daily Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <DailyChart data={dailyRegistrations} color="primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Completed Consultations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <DailyChart data={dailyCompleted} color="green" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Department Workload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 border-b border-neutral-200">
                  <th className="pb-3 font-medium">Department</th>
                  <th className="pb-3 font-medium text-center">Sessions</th>
                  <th className="pb-3 font-medium text-center">Completed</th>
                  <th className="pb-3 font-medium text-center">Avg Wait (min)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {departmentWorkload.map((dept) => (
                  <tr key={dept.department.id} className="hover:bg-neutral-50">
                    <td className="py-3 font-medium text-neutral-900">{dept.department.name}</td>
                    <td className="py-3 text-center">{dept.sessions}</td>
                    <td className="py-3 text-center font-medium text-green-600">{dept.totalCompleted}</td>
                    <td className="py-3 text-center text-neutral-600">{Math.round(dept.avgWait)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bottleneck Detection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {departmentWorkload
              .filter(d => d.avgWait > 30)
              .sort((a, b) => b.avgWait - a.avgWait)
              .map((dept) => (
                <div key={dept.department.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div>
                    <p className="font-medium text-neutral-900">{dept.department.name}</p>
                    <p className="text-sm text-neutral-600">Average wait time: {Math.round(dept.avgWait)} minutes</p>
                  </div>
                  <Badge variant="warning">High Wait</Badge>
                </div>
              ))}
            {departmentWorkload.filter(d => d.avgWait <= 30).length === departmentWorkload.length && (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-2 text-green-600 font-medium">No bottlenecks detected</p>
                <p className="text-sm text-neutral-500">All departments are operating within normal wait times</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
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

const CardSkeleton = () => (
  <Card className="animate-pulse">
    <div className="h-6 bg-neutral-200 rounded w-3/4 mb-4" />
    <div className="space-y-3"><div className="h-4 bg-neutral-200 rounded" /><div className="h-4 bg-neutral-200 rounded" /></div>
  </Card>
);

const DailyChart = ({ data, color }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => parseInt(d.count)));
  const barWidth = 100 / data.length;

  return (
    <div className="flex items-end justify-center gap-1 h-full p-2">
      {data.map((d, i) => {
        const value = parseInt(d.count);
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div key={i} className="flex flex-col items-center gap-1 flex-1" style={{ maxWidth: `${barWidth}%` }}>
            <div
              className="w-full rounded-t transition-all duration-300"
              style={{
                height: `${height}%`,
                backgroundColor: color === 'primary' ? '#0d9488' : '#059669',
                minHeight: value > 0 ? '4px' : '0',
              }}
            />
            <span className="text-xs text-neutral-500 transform -rotate-45 whitespace-nowrap origin-bottom">
              {format(new Date(d.date), 'MMM d')}
            </span>
            <span className="text-xs font-medium text-neutral-900">{value}</span>
          </div>
        );
      })}
    </div>
  );
};

const RegistrationIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const CheckIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DepartmentIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const WaitIcon = () => (
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default AdminAnalytics;