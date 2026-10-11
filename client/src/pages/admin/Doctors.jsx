import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input, Select } from '../../components/Input';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import { LoadingSpinner } from '../../components/LoadingState';
import toast from 'react-hot-toast';

export const AdminDoctors = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    hospital_id: '',
    department_id: '',
    registration_number: '',
    specialization: '',
    is_active: true,
  });
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  useEffect(() => {
    fetchDoctors();
    fetchHospitals();
    fetchDepartments();
  }, [pagination.page]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/doctors?page=${pagination.page}&limit=${pagination.limit}`);
      setDoctors(response.data.data.doctors || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.pagination?.total || 0,
        totalPages: response.data.data.pagination?.totalPages || 0,
      }));
    } catch (err) {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async () => {
    try {
      const response = await api.get('/admin/hospitals');
      setHospitals(response.data.data.hospitals || []);
    } catch (err) {
      console.error('Failed to load hospitals');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await api.patch(`/admin/doctors/${editingDoctor.id}`, formData);
        toast.success('Doctor updated');
      } else {
        await api.post('/admin/doctors', formData);
        toast.success('Doctor created');
      }
      setShowModal(false);
      resetForm();
      fetchDoctors();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save doctor');
    }
  };

  const editDoctor = (doc) => {
    setEditingDoctor(doc);
    setFormData({
      full_name: doc.user?.full_name || '',
      email: doc.user?.email || '',
      phone: doc.user?.phone || '',
      password: '',
      hospital_id: doc.hospital_id,
      department_id: doc.department_id,
      registration_number: doc.registration_number,
      specialization: doc.specialization || '',
      is_active: doc.is_active,
    });
    setShowModal(true);
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await api.patch(`/admin/doctors/${id}`, { is_active: !currentStatus });
      toast.success(`Doctor ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchDoctors();
    } catch (err) {
      toast.error('Failed to update doctor status');
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      hospital_id: '',
      department_id: '',
      registration_number: '',
      specialization: '',
      is_active: true,
    });
    setEditingDoctor(null);
  };

  const columns = [
    { key: 'name', header: 'Name', render: (_, row) => row.user?.full_name },
    { key: 'email', header: 'Email', render: (_, row) => row.user?.email },
    { key: 'registration', header: 'Reg. Number', render: (_, row) => row.registration_number },
    { key: 'specialization', header: 'Specialization', render: (_, row) => row.specialization || '-' },
    { key: 'hospital', header: 'Hospital', render: (_, row) => row.hospital?.name },
    { key: 'department', header: 'Department', render: (_, row) => row.department?.name },
    { key: 'status', header: 'Status', render: (_, row) => (
      <div className="flex items-center gap-2">
        <Badge variant={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge>
        <Button variant="ghost" size="sm" className="p-1" onClick={() => toggleActive(row.id, row.is_active)}>
          {row.is_active ? 'Deactivate' : 'Activate'}
        </Button>
      </div>
    )},
    { key: 'actions', header: 'Actions', render: (_, row) => (
      <Button variant="ghost" size="sm" onClick={() => editDoctor(row)}>Edit</Button>
    )},
  ];

  if (loading && doctors.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Doctors</h1>
            <p className="page-subtitle">Manage doctor accounts</p>
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
          <h1 className="page-title">Doctors</h1>
          <p className="page-subtitle">Manage doctor accounts</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          Add Doctor
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={doctors}
          keyField="id"
          loading={loading}
          emptyMessage="No doctors found"
        />
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200">
            <span className="text-sm text-neutral-500">Page {pagination.page} of {pagination.totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1}>Previous</Button>
              <Button variant="secondary" size="sm" onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.totalPages}>Next</Button>
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingDoctor ? 'Edit Doctor' : 'Add Doctor'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name"
              name="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>
          <Input
            label="Phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          />
          {!editingDoctor && (
            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              helperText="At least 8 characters"
            />
          )}
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Hospital"
              name="hospital_id"
              options={hospitals.map(h => ({ value: h.id, label: h.name }))}
              value={formData.hospital_id}
              onChange={(e) => setFormData(prev => ({ ...prev, hospital_id: e.target.value }))}
              required
            />
            <Select
              label="Department"
              name="department_id"
              options={departments.map(d => ({ value: d.id, label: d.name }))}
              value={formData.department_id}
              onChange={(e) => setFormData(prev => ({ ...prev, department_id: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Registration Number"
              name="registration_number"
              value={formData.registration_number}
              onChange={(e) => setFormData(prev => ({ ...prev, registration_number: e.target.value }))}
              required
            />
            <Input
              label="Specialization"
              name="specialization"
              value={formData.specialization}
              onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-sm text-neutral-700">Active</label>
          </div>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button type="submit">{editingDoctor ? 'Update' : 'Create'}</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDoctors;