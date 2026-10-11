import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/Card';
import { Badge, StatusBadge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingState';
import { format } from 'date-fns';

export const PatientEncounterDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [encounter, setEncounter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEncounter();
  }, [id]);

  const fetchEncounter = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/patients/encounters/${id}`);
      setEncounter(response.data.data.encounter);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load encounter details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      REGISTERED: 'Registered',
      WAITING: 'Waiting',
      CALLED: 'Called',
      IN_PROGRESS: 'Consultation in Progress',
      COMPLETED: 'Completed',
      SKIPPED: 'Skipped',
      CANCELLED: 'Cancelled',
      NO_SHOW: 'No Show',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Encounter Details</h1>
            <p className="page-subtitle">Loading...</p>
          </div>
        </div>
        <Card className="animate-pulse">
          <CardHeader><div className="h-6 bg-neutral-200 rounded w-1/2" /></CardHeader>
          <CardContent><div className="space-y-4"><div className="h-4 bg-neutral-200 rounded" /><div className="h-4 bg-neutral-200 rounded" /></div></CardContent>
        </Card>
      </div>
    );
  }

  if (error || !encounter) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Encounter Details</h1>
          </div>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-neutral-900">Encounter Not Found</h3>
            <p className="mt-2 text-neutral-500">{error || 'The encounter you are looking for does not exist.'}</p>
            <Button variant="primary" asChild className="mt-6">
              <Link to="/patient/history">Back to History</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const queueEntry = encounter.queueEntry;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Encounter Details</h1>
          <p className="page-subtitle">Visit on {format(new Date(encounter.created_at), 'MMMM d, yyyy')}</p>
        </div>
        <Button variant="secondary" asChild>
          <Link to="/patient/history">Back to History</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className={`border-${encounter.status === 'COMPLETED' ? 'green' : encounter.status === 'SKIPPED' ? 'red' : 'primary'}-200`}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Encounter #{encounter.id.slice(0, 8)}
                  </CardTitle>
                  <p className="text-neutral-500 mt-1">{encounter.department?.name} • {encounter.visit_type}</p>
                </div>
                <StatusBadge status={encounter.status} size="lg" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-sm text-neutral-500">Reason for Visit</p>
                  <p className="font-medium text-neutral-900">{encounter.reason_for_visit || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Hospital</p>
                  <p className="font-medium text-neutral-900">{encounter.hospital?.name}</p>
                </div>
                {queueEntry && (
                  <div>
                    <p className="text-sm text-neutral-500">Token Number</p>
                    <p className="text-2xl font-bold text-primary-600">#{queueEntry.token_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-neutral-500">Registered</p>
                  <p className="font-medium text-neutral-900">{format(new Date(encounter.created_at), 'MMM d, yyyy h:mm a')}</p>
                </div>
                {queueEntry?.called_at && (
                  <div>
                    <p className="text-sm text-neutral-500">Called</p>
                    <p className="font-medium text-neutral-900">{format(new Date(queueEntry.called_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                )}
                {queueEntry?.consultation_started_at && (
                  <div>
                    <p className="text-sm text-neutral-500">Consultation Started</p>
                    <p className="font-medium text-neutral-900">{format(new Date(queueEntry.consultation_started_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                )}
                {queueEntry?.completed_at && (
                  <div>
                    <p className="text-sm text-neutral-500">Completed</p>
                    <p className="font-medium text-neutral-900">{format(new Date(queueEntry.completed_at), 'MMM d, yyyy h:mm a')}</p>
                  </div>
                )}
                {queueEntry?.skipped_at && (
                  <div className="sm:col-span-2">
                    <p className="text-sm text-neutral-500">Skipped</p>
                    <p className="font-medium text-neutral-900">{format(new Date(queueEntry.skipped_at), 'MMM d, yyyy h:mm a')}</p>
                    {queueEntry.skip_reason && <p className="text-sm text-neutral-600 mt-1">Reason: {queueEntry.skip_reason}</p>}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <h4 className="font-medium text-neutral-900 mb-3">Status Timeline</h4>
                <div className="space-y-3">
                  <TimelineItem
                    label="Registered"
                    time={encounter.created_at}
                    completed={true}
                    current={encounter.status === 'REGISTERED'}
                  />
                  <TimelineItem
                    label="Waiting"
                    time={queueEntry?.created_at}
                    completed={['WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].includes(encounter.status)}
                    current={encounter.status === 'WAITING'}
                  />
                  <TimelineItem
                    label="Called"
                    time={queueEntry?.called_at}
                    completed={['CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'].includes(encounter.status)}
                    current={encounter.status === 'CALLED'}
                  />
                  <TimelineItem
                    label="Consultation in Progress"
                    time={queueEntry?.consultation_started_at}
                    completed={['IN_PROGRESS', 'COMPLETED'].includes(encounter.status)}
                    current={encounter.status === 'IN_PROGRESS'}
                  />
                  <TimelineItem
                    label="Completed"
                    time={queueEntry?.completed_at}
                    completed={encounter.status === 'COMPLETED'}
                    current={encounter.status === 'COMPLETED'}
                    variant="success"
                  />
                  {encounter.status === 'SKIPPED' && (
                    <TimelineItem
                      label="Skipped"
                      time={queueEntry?.skipped_at}
                      completed={true}
                      current={true}
                      variant="danger"
                    />
                  )}
                  {encounter.status === 'CANCELLED' && (
                    <TimelineItem
                      label="Cancelled"
                      time={encounter.updated_at}
                      completed={true}
                      current={true}
                      variant="neutral"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {encounter.consultations && encounter.consultations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Consultations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {encounter.consultations.map((consultation) => (
                    <div key={consultation.id} className="border border-neutral-200 rounded-lg p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                        <div>
                          <p className="font-medium text-neutral-900">Dr. {consultation.doctor?.full_name}</p>
                          <p className="text-sm text-neutral-500">
                            {format(new Date(consultation.started_at), 'MMM d, yyyy h:mm a')}
                            {consultation.completed_at && ` - ${format(new Date(consultation.completed_at), 'h:mm a')}`}
                          </p>
                        </div>
                        <StatusBadge status={consultation.completed_at ? 'COMPLETED' : 'IN_PROGRESS'} />
                      </div>
                      {consultation.diagnosis_summary && (
                        <div className="mb-3">
                          <p className="text-sm text-neutral-500">Diagnosis</p>
                          <p className="text-neutral-900">{consultation.diagnosis_summary}</p>
                        </div>
                      )}
                      {consultation.treatment_plan && (
                        <div className="mb-3">
                          <p className="text-sm text-neutral-500">Treatment Plan</p>
                          <p className="text-neutral-900">{consultation.treatment_plan}</p>
                        </div>
                      )}
                      {consultation.clinical_notes && (
                        <div className="mb-3">
                          <p className="text-sm text-neutral-500">Clinical Notes</p>
                          <p className="text-neutral-900">{consultation.clinical_notes}</p>
                        </div>
                      )}
                      {consultation.prescriptions && consultation.prescriptions.length > 0 && (
                        <div>
                          <p className="text-sm text-neutral-500 mb-2">Prescriptions</p>
                          <ul className="space-y-1">
                            {consultation.prescriptions.map((rx) => (
                              <li key={rx.id} className="text-sm text-neutral-900">
                                {rx.medication_name} - {rx.dosage} {rx.frequency} {rx.duration ? `for ${rx.duration}` : ''}
                                {rx.instructions && ` - ${rx.instructions}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {encounter.labOrders && encounter.labOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Laboratory Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {encounter.labOrders.map((order) => (
                    <div key={order.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border border-neutral-200 rounded-lg">
                      <div>
                        <p className="font-medium text-neutral-900">{order.test_name}</p>
                        <p className="text-sm text-neutral-500">Ordered: {format(new Date(order.ordered_at), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={order.status === 'COMPLETED' ? 'success' : order.status === 'PROCESSING' ? 'info' : 'warning'}>{order.status}</Badge>
                        {order.result && (
                          <Button variant="ghost" size="sm">View Result</Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visit Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm text-neutral-500">Visit Type</dt>
                  <dd className="font-medium text-neutral-900">{encounter.visit_type}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Department</dt>
                  <dd className="font-medium text-neutral-900">{encounter.department?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm text-neutral-500">Hospital</dt>
                  <dd className="font-medium text-neutral-900">{encounter.hospital?.name}</dd>
                </div>
                {queueEntry && (
                  <div>
                    <dt className="text-sm text-neutral-500">Token</dt>
                    <dd className="font-medium text-neutral-900">#{queueEntry.token_number}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-sm text-neutral-500">Status</dt>
                  <dd className="font-medium text-neutral-900">
                    <StatusBadge status={encounter.status} />
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {queueEntry && queueEntry.status === 'WAITING' && (
            <Card className="bg-primary-50 border-primary-200">
              <CardContent className="text-center">
                <svg className="mx-auto h-10 w-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-3 font-medium text-neutral-900">Currently Waiting</h3>
                <p className="mt-1 text-sm text-neutral-600">Your token is active. This page updates in real-time.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

const TimelineItem = ({ label, time, completed, current, variant = 'primary' }) => {
  const variantColors = {
    primary: { dot: 'bg-primary-600', line: 'bg-primary-200', text: 'text-primary-600' },
    success: { dot: 'bg-green-600', line: 'bg-green-200', text: 'text-green-600' },
    danger: { dot: 'bg-red-600', line: 'bg-red-200', text: 'text-red-600' },
    neutral: { dot: 'bg-neutral-400', line: 'bg-neutral-200', text: 'text-neutral-600' },
  };
  
  const colors = variantColors[variant];
  
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-3 h-3 rounded-full ${completed ? colors.dot : 'bg-neutral-200'} border-2 border-white shadow-sm ${current ? 'ring-2 ring-white' : ''}`} />
        {!time && completed && <div className="h-8 w-0.5 mt-1 bg-neutral-200" />}
        {time && <div className={`h-8 w-0.5 mt-1 ${colors.line}`} />}
      </div>
      <div className="flex-1 min-w-0 pt-1">
        <p className={`font-medium ${completed ? 'text-neutral-900' : 'text-neutral-500'} ${current ? colors.text : ''}`}>{label}</p>
        {time && <p className="text-sm text-neutral-500">{format(new Date(time), 'MMM d, yyyy h:mm a')}</p>}
      </div>
    </div>
  );
};

export default PatientEncounterDetail;