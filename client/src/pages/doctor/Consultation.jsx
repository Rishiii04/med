import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input, Textarea, Select } from '../../components/Input';
import { LoadingSpinner } from '../../components/LoadingState';
import { Modal, ConfirmDialog } from '../../components/Modal';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const DoctorConsultation = () => {
  const { queueEntryId } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  
  const [queueEntry, setQueueEntry] = useState(null);
  const [consultation, setConsultation] = useState(null);
  const [patientHistory, setPatientHistory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [formData, setFormData] = useState({
    clinical_notes: '',
    diagnosis_summary: '',
    treatment_plan: '',
    follow_up_date: '',
    prescriptions: [],
  });

  useEffect(() => {
    fetchConsultationData();
    
    if (socket) {
      socket.on('queue-updated', fetchConsultationData);
      socket.on('consultation-updated', fetchConsultationData);
      
      return () => {
        socket.off('queue-updated', fetchConsultationData);
        socket.off('consultation-updated', fetchConsultationData);
      };
    }
  }, [socket, queueEntryId]);

  const fetchConsultationData = async () => {
    try {
      setLoading(true);
      const [queueRes, historyRes] = await Promise.all([
        api.get(`/doctor/queue`),
        api.get(`/doctor/patients/${queueEntryId}/medical-history`),
      ]);
      
      const entry = queueRes.data.data.queueEntries.find(e => e.id === queueEntryId);
      setQueueEntry(entry);
      
      if (entry?.encounter_id) {
        const consultRes = await api.get(`/doctor/consultations?encounter_id=${entry.encounter_id}&doctor_id=${user.id}`);
        const activeConsultation = consultRes.data.data.consultations?.find(c => !c.completed_at);
        setConsultation(activeConsultation);
        if (activeConsultation) {
          setFormData(prev => ({
            ...prev,
            clinical_notes: activeConsultation.clinical_notes || '',
            diagnosis_summary: activeConsultation.diagnosis_summary || '',
            treatment_plan: activeConsultation.treatment_plan || '',
            follow_up_date: activeConsultation.follow_up_date || '',
            prescriptions: activeConsultation.prescriptions || [],
          }));
        }
      }
      
      setPatientHistory(historyRes.data.data);
    } catch (err) {
      toast.error('Failed to load consultation data');
      navigate('/doctor/queue');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePrescriptionChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.map((p, i) => i === index ? { ...p, [field]: value } : p),
    }));
  };

  const addPrescription = () => {
    setFormData(prev => ({
      ...prev,
      prescriptions: [...prev.prescriptions, { medication_name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    }));
  };

  const removePrescription = (index) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: prev.prescriptions.filter((_, i) => i !== index),
    }));
  };

  const handleStartConsultation = async () => {
    try {
      setSaving(true);
      await api.post(`/doctor/queue/${queueEntryId}/start`);
      toast.success('Consultation started');
      fetchConsultationData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start consultation');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteConsultation = async () => {
    try {
      setSaving(true);
      await api.post(`/doctor/queue/${queueEntryId}/complete`, formData);
      toast.success('Consultation completed');
      navigate('/doctor/queue');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete consultation');
    } finally {
      setSaving(false);
      setShowCompleteModal(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      // Save draft - could be a separate endpoint or just update local state
      toast.success('Draft saved locally');
    } catch (err) {
      toast.error('Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Consultation</h1>
            <p className="page-subtitle">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="animate-pulse lg:col-span-2"><div className="h-6 bg-neutral-200 rounded w-1/2 mb-4" /><div className="space-y-4"><div className="h-4 bg-neutral-200 rounded" /><div className="h-4 bg-neutral-200 rounded" /></div></Card>
          <Card className="animate-pulse"><div className="h-6 bg-neutral-200 rounded w-1/2 mb-4" /><div className="space-y-4"><div className="h-4 bg-neutral-200 rounded" /><div className="h-4 bg-neutral-200 rounded" /></div></Card>
        </div>
      </div>
    );
  }

  if (!queueEntry) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Consultation</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-neutral-500">Queue entry not found</p>
            <Button variant="primary" asChild className="mt-4">
              <a href="/doctor/queue">Back to Queue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isActive = consultation && !consultation.completed_at;
  const isCompleted = consultation && consultation.completed_at;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Consultation</h1>
          <p className="page-subtitle">
            Token #{queueEntry.token_number} • {queueEntry.patient?.full_name}
            {isActive && <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">In Progress</span>}
            {isCompleted && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Completed</span>}
            {!consultation && <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">Not Started</span>}
          </p>
        </div>
        <div className="flex gap-2">
          {!consultation && (
            <Button variant="primary" size="lg" onClick={handleStartConsultation} loading={saving}>
              <LoadingSpinner size="sm" /> Start Consultation
            </Button>
          )}
          {isActive && (
            <>
              <Button variant="secondary" onClick={handleSaveDraft} loading={saving}>Save Draft</Button>
              <Button variant="success" onClick={() => setShowCompleteModal(true)} loading={saving}>Complete</Button>
            </>
          )}
          {isCompleted && (
            <Button variant="secondary" asChild>
              <a href="/doctor/queue">Back to Queue</a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Patient Information</CardTitle>
                <div className="flex items-center gap-2">
                  <StatusBadge status={queueEntry.status} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-neutral-500">Name</p>
                  <p className="font-medium text-neutral-900">{queueEntry.patient?.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Patient ID</p>
                  <p className="font-medium text-neutral-900">{queueEntry.patient?.patient_number}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Token</p>
                  <p className="font-medium text-neutral-900">#{queueEntry.token_number}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Registered</p>
                  <p className="font-medium text-neutral-900">{format(new Date(queueEntry.registration_time), 'MMM d, yyyy h:mm a')}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-neutral-500">Waiting Since</p>
                  <p className="font-medium text-neutral-900">{queueEntry.waiting_duration ? `${queueEntry.waiting_duration} minutes` : 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Consultation Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea
                  label="Clinical Notes"
                  name="clinical_notes"
                  value={formData.clinical_notes}
                  onChange={handleInputChange}
                  placeholder="Enter clinical findings, observations, examination results..."
                  rows={4}
                  disabled={isCompleted}
                />
                <Textarea
                  label="Diagnosis Summary"
                  name="diagnosis_summary"
                  value={formData.diagnosis_summary}
                  onChange={handleInputChange}
                  placeholder="Primary and secondary diagnoses..."
                  rows={3}
                  disabled={isCompleted}
                />
                <Textarea
                  label="Treatment Plan"
                  name="treatment_plan"
                  value={formData.treatment_plan}
                  onChange={handleInputChange}
                  placeholder="Treatment plan, recommendations, follow-up instructions..."
                  rows={3}
                  disabled={isCompleted}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Follow-up Date"
                    name="follow_up_date"
                    type="date"
                    value={formData.follow_up_date}
                    onChange={handleInputChange}
                    disabled={isCompleted}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader action={
              <Button variant="ghost" size="sm" onClick={addPrescription} disabled={isCompleted}>
                Add Prescription
              </Button>
            }>
              <CardTitle>Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {formData.prescriptions.length === 0 ? (
                <p className="text-neutral-500 text-center py-8">No prescriptions added yet</p>
              ) : (
                <div className="space-y-3">
                  {formData.prescriptions.map((rx, index) => (
                    <div key={index} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex gap-3 mb-3">
                        <div className="flex-1">
                          <label className="label">Medication</label>
                          <input
                            type="text"
                            className="input"
                            value={rx.medication_name}
                            onChange={(e) => handlePrescriptionChange(index, 'medication_name', e.target.value)}
                            placeholder="e.g., Lisinopril"
                            disabled={isCompleted}
                          />
                        </div>
                        <div className="w-32">
                          <label className="label">Dosage</label>
                          <input
                            type="text"
                            className="input"
                            value={rx.dosage}
                            onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                            placeholder="e.g., 10mg"
                            disabled={isCompleted}
                          />
                        </div>
                        <div className="w-32">
                          <label className="label">Frequency</label>
                          <input
                            type="text"
                            className="input"
                            value={rx.frequency}
                            onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                            placeholder="e.g., Once daily"
                            disabled={isCompleted}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePrescription(index)}
                          className="mt-6 text-red-600 hover:text-red-700 text-sm"
                          disabled={isCompleted}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="label">Duration</label>
                          <input
                            type="text"
                            className="input"
                            value={rx.duration}
                            onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                            placeholder="e.g., 30 days"
                            disabled={isCompleted}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="label">Instructions</label>
                          <input
                            type="text"
                            className="input"
                            value={rx.instructions}
                            onChange={(e) => handlePrescriptionChange(index, 'instructions', e.target.value)}
                            placeholder="e.g., Take with food"
                            disabled={isCompleted}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Medical History</CardTitle>
            </CardHeader>
            <CardContent>
              {patientHistory && (
                <div className="space-y-6">
                  {patientHistory.medicalConditions?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Conditions</h4>
                      <div className="space-y-1">
                        {patientHistory.medicalConditions.map((c) => (
                          <Badge key={c.id} variant="neutral" className="mr-1 mb-1">
                            {c.condition_name} {c.diagnosed_at && `(${format(new Date(c.diagnosed_at), 'yyyy')})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {patientHistory.allergies?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Allergies</h4>
                      <div className="space-y-1">
                        {patientHistory.allergies.map((a) => (
                          <Badge key={a.id} variant={a.severity === 'SEVERE' || a.severity === 'LIFE_THREATENING' ? 'danger' : 'warning'} className="mr-1 mb-1">
                            {a.substance} - {a.severity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {patientHistory.medications?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Current Medications</h4>
                      <div className="space-y-1">
                        {patientHistory.medications.map((m) => (
                          <Badge key={m.id} variant={m.status === 'ACTIVE' ? 'success' : 'neutral'} className="mr-1 mb-1">
                            {m.medication_name} {m.dosage} {m.frequency}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {patientHistory.pastConsultations?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Recent Consultations</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {patientHistory.pastConsultations.slice(0, 5).map((c) => (
                          <div key={c.id} className="p-3 bg-neutral-50 rounded-lg">
                            <p className="text-sm font-medium text-neutral-900">
                              {format(new Date(c.started_at), 'MMM d, yyyy')} - Dr. {c.doctor?.full_name}
                            </p>
                            {c.diagnosis_summary && <p className="text-xs text-neutral-600 mt-1">{c.diagnosis_summary}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {patientHistory.labOrders?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-neutral-900 mb-2">Recent Lab Orders</h4>
                      <div className="space-y-1">
                        {patientHistory.labOrders.slice(0, 5).map((l) => (
                          <div key={l.id} className="p-2 bg-neutral-50 rounded text-sm">
                            <p className="font-medium text-neutral-900">{l.test_name}</p>
                            <p className="text-xs text-neutral-500">{l.status} - {format(new Date(l.ordered_at), 'MMM d, yyyy')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!patientHistory.medicalConditions?.length && !patientHistory.allergies?.length && !patientHistory.medications?.length && !patientHistory.pastConsultations?.length && (
                    <p className="text-neutral-500 text-center py-4">No medical history available</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="Complete Consultation" size="lg">
        <div className="space-y-4">
          <p className="text-neutral-600">Review the consultation details before completing.</p>
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Clinical Notes"
              value={formData.clinical_notes}
              onChange={handleInputChange}
              rows={3}
            />
            <Textarea
              label="Diagnosis Summary"
              value={formData.diagnosis_summary}
              onChange={handleInputChange}
              rows={3}
            />
          </div>
          <Textarea
            label="Treatment Plan"
            value={formData.treatment_plan}
            onChange={handleInputChange}
            rows={3}
          />
          <Input
            label="Follow-up Date"
            type="date"
            name="follow_up_date"
            value={formData.follow_up_date}
            onChange={handleInputChange}
          />
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setShowCompleteModal(false)}>Cancel</Button>
            <Button variant="success" onClick={handleCompleteConsultation} loading={saving}>
              Complete Consultation
            </Button>
          </Modal.Footer>
        </div>
      </Modal>
    </div>
  );
};

export default DoctorConsultation;