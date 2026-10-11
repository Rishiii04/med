import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingState';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export const DoctorPatientHistory = () => {
  const { patientId } = useParams();
  const { user } = useAuth();
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPatientHistory();
  }, [patientId]);

  const fetchPatientHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/doctor/patients/${patientId}/medical-history`);
      setPatientData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load patient history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Patient History</h1>
            <p className="page-subtitle">Loading...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="animate-pulse"><div className="h-6 bg-neutral-200 rounded w-1/2 mb-4" /><div className="space-y-4"><div className="h-4 bg-neutral-200 rounded" /><div className="h-4 bg-neutral-200 rounded" /></div></Card>
          <Card className="animate-pulse"><div className="h-6 bg-neutral-200 rounded w-1/2 mb-4" /><div className="space-y-4"><div className="h-4 bg-neutral-200 rounded" /><div className="h-4 bg-neutral-200 rounded" /></div></Card>
          <Card className="animate-pulse"><div className="h-6 bg-neutral-200 rounded w-1/2 mb-4" /><div className="space-y-4"><div className="h-4 bg-neutral-200 rounded" /><div className="h-4 bg-neutral-200 rounded" /></div></Card>
        </div>
      </div>
    );
  }

  if (error || !patientData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Patient History</h1>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-neutral-900">Access Denied</h3>
            <p className="mt-2 text-neutral-500">{error || 'You do not have authorization to view this patient\'s medical history.'}</p>
            <Button variant="primary" asChild className="mt-6">
              <Link to="/doctor/queue">Back to Queue</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { patient, medicalConditions, allergies, medications, pastConsultations, labOrders } = patientData;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Patient History</h1>
          <p className="page-subtitle">{patient.full_name} • {patient.patient_number}</p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/doctor/queue">Back to Queue</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Patient Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-neutral-500">Full Name</dt>
                  <dd className="font-medium text-neutral-900">{patient.full_name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Patient ID</dt>
                  <dd className="font-medium text-neutral-900">{patient.patient_number}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Date of Birth</dt>
                  <dd className="font-medium text-neutral-900">{patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMM d, yyyy') : 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Sex</dt>
                  <dd className="font-medium text-neutral-900">{patient.sex || 'N/A'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medical Conditions</CardTitle>
            </CardHeader>
            <CardContent>
              {medicalConditions?.length > 0 ? (
                <div className="space-y-3">
                  {medicalConditions.map((c) => (
                    <div key={c.id} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-neutral-900">{c.condition_name}</p>
                          {c.description && <p className="text-sm text-neutral-600 mt-1">{c.description}</p>}
                          <p className="text-xs text-neutral-500 mt-1">
                            Diagnosed: {c.diagnosed_at ? format(new Date(c.diagnosed_at), 'MMM d, yyyy') : 'Unknown'}
                            {c.recorded_by && ` • Recorded by Dr. ID: ${c.recorded_by}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">No medical conditions recorded</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Allergies</CardTitle>
            </CardHeader>
            <CardContent>
              {allergies?.length > 0 ? (
                <div className="space-y-3">
                  {allergies.map((a) => (
                    <div key={a.id} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-neutral-900">{a.substance}</p>
                          {a.reaction && <p className="text-sm text-neutral-600 mt-1">Reaction: {a.reaction}</p>}
                          <p className="text-xs text-neutral-500 mt-1">Severity: <Badge variant={a.severity === 'LIFE_THREATENING' || a.severity === 'SEVERE' ? 'danger' : a.severity === 'MODERATE' ? 'warning' : 'info'}>{a.severity}</Badge></p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">No allergies recorded</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Medications</CardTitle>
            </CardHeader>
            <CardContent>
              {medications?.length > 0 ? (
                <div className="space-y-3">
                  {medications.map((m) => (
                    <div key={m.id} className="p-4 border border-neutral-200 rounded-lg">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-neutral-900">{m.medication_name}</p>
                          <p className="text-sm text-neutral-600 mt-1">
                            {m.dosage} • {m.frequency}
                            {m.start_date && ` • Since ${format(new Date(m.start_date), 'MMM d, yyyy')}`}
                          </p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Status: <Badge variant={m.status === 'ACTIVE' ? 'success' : m.status === 'DISCONTINUED' ? 'danger' : 'neutral'}>{m.status}</Badge>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">No medications recorded</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Past Consultations</CardTitle>
            </CardHeader>
            <CardContent>
              {pastConsultations?.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pastConsultations.map((c) => (
                    <div key={c.id} className="p-3 border border-neutral-200 rounded-lg hover:bg-neutral-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-neutral-900 truncate">{format(new Date(c.started_at), 'MMM d, yyyy h:mm a')}</p>
                          <p className="text-xs text-neutral-500">Dr. {c.doctor?.full_name}</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/doctor/consultation/${c.id}`}>View</Link>
                        </Button>
                      </div>
                      {c.diagnosis_summary && <p className="text-sm text-neutral-600 mt-1">{c.diagnosis_summary}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">No past consultations</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Lab Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {labOrders?.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {labOrders.map((l) => (
                    <div key={l.id} className="p-3 border border-neutral-200 rounded-lg">
                      <p className="font-medium text-neutral-900">{l.test_name}</p>
                      <p className="text-xs text-neutral-500">{l.status} • {format(new Date(l.ordered_at), 'MMM d, yyyy')}</p>
                      {l.result && (
                        <p className="text-xs text-green-600 mt-1">Result available</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500 text-center py-4">No lab orders</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DoctorPatientHistory;