import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Button } from '../../components/Button';
import { Input, Textarea, Select } from '../../components/Input';
import { Table } from '../../components/Table';
import { LoadingSpinner } from '../../components/LoadingState';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const CONDITION_SEVERITY = ['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING'];
const MEDICATION_STATUS = ['ACTIVE', 'DISCONTINUED', 'COMPLETED', 'ON_HOLD'];

export const PatientMedicalProfile = () => {
  const { user } = useAuth();
  const [conditions, setConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conditions');
  
  const [showConditionModal, setShowConditionModal] = useState(false);
  const [showAllergyModal, setShowAllergyModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [conditionForm, setConditionForm] = useState({ condition_name: '', description: '', diagnosed_at: '' });
  const [allergyForm, setAllergyForm] = useState({ substance: '', reaction: '', severity: 'MILD' });
  const [medicationForm, setMedicationForm] = useState({ medication_name: '', dosage: '', frequency: '', start_date: '', end_date: '', status: 'ACTIVE' });

  useEffect(() => {
    fetchMedicalHistory();
  }, []);

  const fetchMedicalHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/patients/medical-history');
      setConditions(response.data.data.medicalConditions || []);
      setAllergies(response.data.data.allergies || []);
      setMedications(response.data.data.medications || []);
    } catch (err) {
      toast.error('Failed to load medical history');
    } finally {
      setLoading(false);
    }
  };

  const handleConditionSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/patients/medical-conditions/${editingItem.id}`, conditionForm);
        toast.success('Condition updated');
      } else {
        await api.post('/patients/medical-conditions', conditionForm);
        toast.success('Condition added');
      }
      setShowConditionModal(false);
      resetConditionForm();
      fetchMedicalHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save condition');
    }
  };

  const handleAllergySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/patients/allergies/${editingItem.id}`, allergyForm);
        toast.success('Allergy updated');
      } else {
        await api.post('/patients/allergies', allergyForm);
        toast.success('Allergy added');
      }
      setShowAllergyModal(false);
      resetAllergyForm();
      fetchMedicalHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save allergy');
    }
  };

  const handleMedicationSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/patients/medications/${editingItem.id}`, medicationForm);
        toast.success('Medication updated');
      } else {
        await api.post('/patients/medications', medicationForm);
        toast.success('Medication added');
      }
      setShowMedicationModal(false);
      resetMedicationForm();
      fetchMedicalHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save medication');
    }
  };

  const handleDelete = async (type, id) => {
    try {
      let endpoint;
      switch (type) {
        case 'condition': endpoint = `/patients/medical-conditions/${id}`; break;
        case 'allergy': endpoint = `/patients/allergies/${id}`; break;
        case 'medication': endpoint = `/patients/medications/${id}`; break;
      }
      await api.delete(endpoint);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted`);
      fetchMedicalHistory();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  const editItem = (type, item) => {
    setEditingItem(item);
    switch (type) {
      case 'condition':
        setConditionForm({ condition_name: item.condition_name, description: item.description || '', diagnosed_at: item.diagnosed_at || '' });
        setShowConditionModal(true);
        break;
      case 'allergy':
        setAllergyForm({ substance: item.substance, reaction: item.reaction || '', severity: item.severity });
        setShowAllergyModal(true);
        break;
      case 'medication':
        setMedicationForm({ medication_name: item.medication_name, dosage: item.dosage || '', frequency: item.frequency || '', start_date: item.start_date || '', end_date: item.end_date || '', status: item.status });
        setShowMedicationModal(true);
        break;
    }
  };

  const resetConditionForm = () => { setConditionForm({ condition_name: '', description: '', diagnosed_at: '' }); setEditingItem(null); };
  const resetAllergyForm = () => { setAllergyForm({ substance: '', reaction: '', severity: 'MILD' }); setEditingItem(null); };
  const resetMedicationForm = () => { setMedicationForm({ medication_name: '', dosage: '', frequency: '', start_date: '', end_date: '', status: 'ACTIVE' }); setEditingItem(null); };

  const conditionColumns = [
    { key: 'name', header: 'Condition', render: (_, row) => row.condition_name },
    { key: 'description', header: 'Description', render: (_, row) => row.description || '-' },
    { key: 'diagnosed', header: 'Diagnosed', render: (_, row) => row.diagnosed_at ? format(new Date(row.diagnosed_at), 'MMM d, yyyy') : '-' },
    { key: 'actions', header: '', render: (_, row) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => editItem('condition', row)}>Edit</Button>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete('condition', row.id)}>Delete</Button>
      </div>
    )},
  ];

  const allergyColumns = [
    { key: 'substance', header: 'Substance', render: (_, row) => row.substance },
    { key: 'reaction', header: 'Reaction', render: (_, row) => row.reaction || '-' },
    { key: 'severity', header: 'Severity', render: (_, row) => <Badge variant={row.severity === 'LIFE_THREATENING' ? 'danger' : row.severity === 'SEVERE' ? 'danger' : row.severity === 'MODERATE' ? 'warning' : 'info'}>{row.severity}</Badge> },
    { key: 'actions', header: '', render: (_, row) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => editItem('allergy', row)}>Edit</Button>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete('allergy', row.id)}>Delete</Button>
      </div>
    )},
  ];

  const medicationColumns = [
    { key: 'name', header: 'Medication', render: (_, row) => row.medication_name },
    { key: 'dosage', header: 'Dosage', render: (_, row) => row.dosage || '-' },
    { key: 'frequency', header: 'Frequency', render: (_, row) => row.frequency || '-' },
    { key: 'status', header: 'Status', render: (_, row) => <Badge variant={row.status === 'ACTIVE' ? 'success' : row.status === 'DISCONTINUED' ? 'danger' : 'neutral'}>{row.status}</Badge> },
    { key: 'actions', header: '', render: (_, row) => (
      <div className="flex gap-1">
        <Button variant="ghost" size="sm" onClick={() => editItem('medication', row)}>Edit</Button>
        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDelete('medication', row.id)}>Delete</Button>
      </div>
    )},
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Medical Profile</h1>
          <p className="page-subtitle">Manage your medical information</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="animate-pulse"><div className="h-6 bg-neutral-200 rounded w-1/2 mb-4" /><TableSkeleton rows={3} columns={4} /></Card>
          <Card className="animate-pulse"><div className="h-6 bg-neutral-200 rounded w-1/2 mb-4" /><TableSkeleton rows={3} columns={4} /></Card>
          <Card className="animate-pulse"><div className="h-6 bg-neutral-200 rounded w-1/2 mb-4" /><TableSkeleton rows={3} columns={4} /></Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Medical Profile</h1>
        <p className="page-subtitle">Manage your medical information for clinical review</p>
      </div>

      <div className="flex gap-2 border-b border-neutral-200" role="tablist">
        {[
          { id: 'conditions', label: 'Conditions', count: conditions.length },
          { id: 'allergies', label: 'Allergies', count: allergies.length },
          { id: 'medications', label: 'Medications', count: medications.length },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            {tab.label} <span className="ml-2 px-2 py-0.5 text-xs bg-neutral-100 rounded-full">{tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === 'conditions' && (
        <Card>
          <CardHeader action={
            <Button onClick={() => { resetConditionForm(); setShowConditionModal(true); }}>
              Add Condition
            </Button>
          }>
            <CardTitle>Medical Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table columns={conditionColumns} data={conditions} keyField="id" emptyMessage="No conditions recorded" />
          </CardContent>
        </Card>
      )}

      {activeTab === 'allergies' && (
        <Card>
          <CardHeader action={
            <Button onClick={() => { resetAllergyForm(); setShowAllergyModal(true); }}>
              Add Allergy
            </Button>
          }>
            <CardTitle>Allergies</CardTitle>
          </CardHeader>
          <CardContent>
            <Table columns={allergyColumns} data={allergies} keyField="id" emptyMessage="No allergies recorded" />
          </CardContent>
        </Card>
      )}

      {activeTab === 'medications' && (
        <Card>
          <CardHeader action={
            <Button onClick={() => { resetMedicationForm(); setShowMedicationModal(true); }}>
              Add Medication
            </Button>
          }>
            <CardTitle>Current Medications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table columns={medicationColumns} data={medications} keyField="id" emptyMessage="No medications recorded" />
          </CardContent>
        </Card>
      )}

      <Modal isOpen={showConditionModal} onClose={() => { setShowConditionModal(false); resetConditionForm(); }} title={editingItem ? 'Edit Condition' : 'Add Medical Condition'}>
        <form onSubmit={handleConditionSubmit} className="space-y-4">
          <Input label="Condition Name" name="condition_name" value={conditionForm.condition_name} onChange={(e) => setConditionForm(prev => ({ ...prev, condition_name: e.target.value }))} required placeholder="e.g., Hypertension" />
          <Textarea label="Description" name="description" value={conditionForm.description} onChange={(e) => setConditionForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Additional details..." rows={3} />
          <Input label="Diagnosed Date" name="diagnosed_at" type="date" value={conditionForm.diagnosed_at} onChange={(e) => setConditionForm(prev => ({ ...prev, diagnosed_at: e.target.value }))} />
          <Modal.Footer>
            <Button variant="ghost" onClick={() => { setShowConditionModal(false); resetConditionForm(); }}>Cancel</Button>
            <Button type="submit">{editingItem ? 'Update' : 'Add'}</Button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal isOpen={showAllergyModal} onClose={() => { setShowAllergyModal(false); resetAllergyForm(); }} title={editingItem ? 'Edit Allergy' : 'Add Allergy'}>
        <form onSubmit={handleAllergySubmit} className="space-y-4">
          <Input label="Substance" name="substance" value={allergyForm.substance} onChange={(e) => setAllergyForm(prev => ({ ...prev, substance: e.target.value }))} required placeholder="e.g., Penicillin" />
          <Textarea label="Reaction" name="reaction" value={allergyForm.reaction} onChange={(e) => setAllergyForm(prev => ({ ...prev, reaction: e.target.value }))} placeholder="e.g., Rash, swelling..." rows={2} />
          <Select label="Severity" options={CONDITION_SEVERITY.map(s => ({ value: s, label: s }))} value={allergyForm.severity} onChange={(e) => setAllergyForm(prev => ({ ...prev, severity: e.target.value }))} />
          <Modal.Footer>
            <Button variant="ghost" onClick={() => { setShowAllergyModal(false); resetAllergyForm(); }}>Cancel</Button>
            <Button type="submit">{editingItem ? 'Update' : 'Add'}</Button>
          </Modal.Footer>
        </form>
      </Modal>

      <Modal isOpen={showMedicationModal} onClose={() => { setShowMedicationModal(false); resetMedicationForm(); }} title={editingItem ? 'Edit Medication' : 'Add Medication'}>
        <form onSubmit={handleMedicationSubmit} className="space-y-4">
          <Input label="Medication Name" name="medication_name" value={medicationForm.medication_name} onChange={(e) => setMedicationForm(prev => ({ ...prev, medication_name: e.target.value }))} required placeholder="e.g., Lisinopril" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Dosage" name="dosage" value={medicationForm.dosage} onChange={(e) => setMedicationForm(prev => ({ ...prev, dosage: e.target.value }))} placeholder="e.g., 10mg" />
            <Input label="Frequency" name="frequency" value={medicationForm.frequency} onChange={(e) => setMedicationForm(prev => ({ ...prev, frequency: e.target.value }))} placeholder="e.g., Once daily" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" name="start_date" type="date" value={medicationForm.start_date} onChange={(e) => setMedicationForm(prev => ({ ...prev, start_date: e.target.value }))} />
            <Input label="End Date" name="end_date" type="date" value={medicationForm.end_date} onChange={(e) => setMedicationForm(prev => ({ ...prev, end_date: e.target.value }))} />
          </div>
          <Select label="Status" options={MEDICATION_STATUS.map(s => ({ value: s, label: s }))} value={medicationForm.status} onChange={(e) => setMedicationForm(prev => ({ ...prev, status: e.target.value }))} />
          <Modal.Footer>
            <Button variant="ghost" onClick={() => { setShowMedicationModal(false); resetMedicationForm(); }}>Cancel</Button>
            <Button type="submit">{editingItem ? 'Update' : 'Add'}</Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  );
};

export default PatientMedicalProfile;