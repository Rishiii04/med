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

export const AdminDepartments = () => {
  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [formData, setFormData] = useState({ hospital_id: '', name: '', description: '' });
  const [hospitals, setHospitals] = useState([]);

  useEffect(() => {
    fetchDepartments();
    fetchHospitals();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/departments');
      setDepartments(response.data.data.departments || []);
    } catch (err) {
      toast.error('Failed to load departments');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDepartment) {
        await api.patch(`/admin/departments/${editingDepartment.id}`, formData);
        toast.success('Department updated');
      } else {
        await api.post('/admin/departments', formData);
        toast.success('Department created');
      }
      setShowModal(false);
      resetForm();
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save department');
    }
  };

  const editDepartment = (dept) => {
    setEditingDepartment(dept);
    setFormData({ hospital_id: dept.hospital_id, name: dept.name, description: dept.description || '' });
    setShowModal(true);
  };

  const deleteDepartment = async (id) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`/admin/departments/${id}`);
      toast.success('Department deleted');
      fetchDepartments();
    } catch (err) {
      toast.error('Failed to delete department');
    }
  };

  const resetForm = () => {
    setFormData({ hospital_id: '', name: '', description: '' });
    setEditingDepartment(null);
  };

  const columns = [
    { key: 'name', header: 'Name', render: (_, row) => row.name },
    { key: 'hospital', header: 'Hospital', render: (_, row) => row.hospital?.name },
    { key: 'description', header: 'Description', render: (_, row) => row.description || '-' },
    { key: 'status', header: 'Status', render: (_, row) => <Badge variant={row.is_active ? 'success' : 'neutral'}>{row.is_active ? 'Active' : 'Inactive'}</Badge> },
    { key: 'actions', header: 'Actions', render: (_, row) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => editDepartment(row)}>Edit</Button>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => deleteDepartment(row.id)}>Delete</Button>
      </div>
    )},
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title">Departments</h1>
            <p className="page-subtitle">Manage hospital departments</p>
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
          <h1 className="page-title">Departments</h1>
          <p className="page-subtitle">Manage hospital departments</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }}>
          Add Department
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={departments}
          keyField="id"
          loading={loading}
          emptyMessage="No departments found"
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingDepartment ? 'Edit Department' : 'Add Department'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Hospital"
            name="hospital_id"
            options={hospitals.map(h => ({ value: h.id, label: h.name }))}
            value={formData.hospital_id}
            onChange={(e) => setFormData(prev => ({ ...prev, hospital_id: e.target.value }))}
            required
          />
          <Input
            label="Department Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            placeholder="e.g., Cardiology"
          />
          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Optional description"
            rows={3}
          />
          <Modal.Footer>
            <Button variant="ghost" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button type="submit">{editingDepartment ? 'Update' : 'Create'}</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDepartments;