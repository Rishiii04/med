import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import sequelize from './config/database.js';
import models from './models/index.js';

const {
  Hospital,
  Department,
  User,
  Patient,
  DoctorProfile,
  OperatingSession,
  Encounter,
  QueueEntry,
  Consultation,
  MedicalCondition,
  Allergy,
  Medication,
  Prescription,
  LabOrder,
  LabResult,
  AuditEvent,
} = models;

const BCRYPT_ROUNDS = 12;

const seed = async () => {
  const transaction = await sequelize.transaction();

  try {
    console.log('Seeding database with demo data...');

    // 1. Create Hospital
    const hospital = await Hospital.create({
      name: 'MedFlow General Hospital',
      address: '123 Healthcare Avenue, Medical District, City 10001',
      timezone: 'America/New_York',
      is_active: true,
    }, { transaction });

    console.log('Hospital created:', hospital.name);

    // 2. Create Departments
    const departments = await Department.bulkCreate([
      { hospital_id: hospital.id, name: 'General Medicine', description: 'General outpatient consultations', is_active: true },
      { hospital_id: hospital.id, name: 'Cardiology', description: 'Heart and cardiovascular care', is_active: true },
      { hospital_id: hospital.id, name: 'Orthopedics', description: 'Bone, joint, and muscle care', is_active: true },
      { hospital_id: hospital.id, name: 'Pediatrics', description: 'Child healthcare services', is_active: true },
      { hospital_id: hospital.id, name: 'Dermatology', description: 'Skin, hair, and nail conditions', is_active: true },
    ], { transaction });

    console.log(`${departments.length} departments created`);

    const [generalMedicine, cardiology, orthopedics, pediatrics, dermatology] = departments;

    // 3. Create Users (Admin, Doctors, Patients)
    const passwordHash = await bcrypt.hash('demo123', BCRYPT_ROUNDS);

    // Admin
    const adminUser = await User.create({
      full_name: 'Admin User',
      email: 'admin@medflow.com',
      phone: '+1555000000',
      password_hash: passwordHash,
      role: 'ADMIN',
      is_active: true,
    }, { transaction });

    // Doctors
    const doctorUsers = await User.bulkCreate([
      { full_name: 'Dr. Sarah Johnson', email: 'sarah.johnson@medflow.com', phone: '+1555100001', password_hash: passwordHash, role: 'DOCTOR', is_active: true },
      { full_name: 'Dr. Michael Chen', email: 'michael.chen@medflow.com', phone: '+1555100002', password_hash: passwordHash, role: 'DOCTOR', is_active: true },
      { full_name: 'Dr. Emily Rodriguez', email: 'emily.rodriguez@medflow.com', phone: '+1555100003', password_hash: passwordHash, role: 'DOCTOR', is_active: true },
      { full_name: 'Dr. James Wilson', email: 'james.wilson@medflow.com', phone: '+1555100004', password_hash: passwordHash, role: 'DOCTOR', is_active: true },
      { full_name: 'Dr. Lisa Park', email: 'lisa.park@medflow.com', phone: '+1555100005', password_hash: passwordHash, role: 'DOCTOR', is_active: true },
    ], { transaction });

    // Patients
    const patientUsers = await User.bulkCreate([
      { full_name: 'John Smith', email: 'john.smith@email.com', phone: '+1555200001', password_hash: passwordHash, role: 'PATIENT', is_active: true },
      { full_name: 'Maria Garcia', email: 'maria.garcia@email.com', phone: '+1555200002', password_hash: passwordHash, role: 'PATIENT', is_active: true },
      { full_name: 'Robert Brown', email: 'robert.brown@email.com', phone: '+1555200003', password_hash: passwordHash, role: 'PATIENT', is_active: true },
      { full_name: 'Jennifer Davis', email: 'jennifer.davis@email.com', phone: '+1555200004', password_hash: passwordHash, role: 'PATIENT', is_active: true },
      { full_name: 'William Miller', email: 'william.miller@email.com', phone: '+1555200005', password_hash: passwordHash, role: 'PATIENT', is_active: true },
      { full_name: 'Linda Wilson', email: 'linda.wilson@email.com', phone: '+1555200006', password_hash: passwordHash, role: 'PATIENT', is_active: true },
      { full_name: 'David Anderson', email: 'david.anderson@email.com', phone: '+1555200007', password_hash: passwordHash, role: 'PATIENT', is_active: true },
      { full_name: 'Patricia Thomas', email: 'patricia.thomas@email.com', phone: '+1555200008', password_hash: passwordHash, role: 'PATIENT', is_active: true },
      { full_name: 'Christopher Jackson', email: 'christopher.jackson@email.com', phone: '+1555200009', password_hash: passwordHash, role: 'PATIENT', is_active: true },
      { full_name: 'Barbara White', email: 'barbara.white@email.com', phone: '+1555200010', password_hash: passwordHash, role: 'PATIENT', is_active: true },
    ], { transaction });

    console.log(`${1 + doctorUsers.length + patientUsers.length} users created`);

    // 4. Create Doctor Profiles
    const doctorProfiles = await DoctorProfile.bulkCreate([
      { user_id: doctorUsers[0].id, hospital_id: hospital.id, department_id: generalMedicine.id, registration_number: 'MD001', specialization: 'Internal Medicine', is_active: true },
      { user_id: doctorUsers[1].id, hospital_id: hospital.id, department_id: cardiology.id, registration_number: 'MD002', specialization: 'Cardiology', is_active: true },
      { user_id: doctorUsers[2].id, hospital_id: hospital.id, department_id: orthopedics.id, registration_number: 'MD003', specialization: 'Orthopedic Surgery', is_active: true },
      { user_id: doctorUsers[3].id, hospital_id: hospital.id, department_id: pediatrics.id, registration_number: 'MD004', specialization: 'Pediatrics', is_active: true },
      { user_id: doctorUsers[4].id, hospital_id: hospital.id, department_id: dermatology.id, registration_number: 'MD005', specialization: 'Dermatology', is_active: true },
    ], { transaction });

    console.log(`${doctorProfiles.length} doctor profiles created`);

    // 5. Create Patients
    const patients = await Patient.bulkCreate([
      { user_id: patientUsers[0].id, patient_number: 'PAT001', date_of_birth: '1980-05-15', sex: 'MALE', emergency_contact: { name: 'Jane Smith', phone: '+1555200101', relationship: 'Spouse' } },
      { user_id: patientUsers[1].id, patient_number: 'PAT002', date_of_birth: '1975-08-22', sex: 'FEMALE', emergency_contact: { name: 'Carlos Garcia', phone: '+1555200102', relationship: 'Spouse' } },
      { user_id: patientUsers[2].id, patient_number: 'PAT003', date_of_birth: '1990-11-30', sex: 'MALE', emergency_contact: { name: 'Sarah Brown', phone: '+1555200103', relationship: 'Sister' } },
      { user_id: patientUsers[3].id, patient_number: 'PAT004', date_of_birth: '1985-03-18', sex: 'FEMALE', emergency_contact: { name: 'Michael Davis', phone: '+1555200104', relationship: 'Brother' } },
      { user_id: patientUsers[4].id, patient_number: 'PAT005', date_of_birth: '1970-12-05', sex: 'MALE', emergency_contact: { name: 'Susan Miller', phone: '+1555200105', relationship: 'Spouse' } },
      { user_id: patientUsers[5].id, patient_number: 'PAT006', date_of_birth: '1995-07-25', sex: 'FEMALE', emergency_contact: { name: 'James Wilson', phone: '+1555200106', relationship: 'Father' } },
      { user_id: patientUsers[6].id, patient_number: 'PAT007', date_of_birth: '1988-09-12', sex: 'MALE', emergency_contact: { name: 'Mary Anderson', phone: '+1555200107', relationship: 'Mother' } },
      { user_id: patientUsers[7].id, patient_number: 'PAT008', date_of_birth: '1982-01-08', sex: 'FEMALE', emergency_contact: { name: 'Robert Thomas', phone: '+1555200108', relationship: 'Spouse' } },
      { user_id: patientUsers[8].id, patient_number: 'PAT009', date_of_birth: '1992-04-20', sex: 'MALE', emergency_contact: { name: 'Elizabeth Jackson', phone: '+1555200109', relationship: 'Sister' } },
      { user_id: patientUsers[9].id, patient_number: 'PAT010', date_of_birth: '1978-06-14', sex: 'FEMALE', emergency_contact: { name: 'Thomas White', phone: '+1555200110', relationship: 'Brother' } },
    ], { transaction });

    console.log(`${patients.length} patients created`);

    // 6. Create Operating Sessions for today
    const today = new Date().toISOString().split('T')[0];
    
    const operatingSessions = await OperatingSession.bulkCreate([
      { department_id: generalMedicine.id, session_date: today, start_time: '08:00:00', end_time: '16:00:00', status: 'ACTIVE' },
      { department_id: cardiology.id, session_date: today, start_time: '09:00:00', end_time: '15:00:00', status: 'ACTIVE' },
      { department_id: orthopedics.id, session_date: today, start_time: '08:30:00', end_time: '14:30:00', status: 'ACTIVE' },
      { department_id: pediatrics.id, session_date: today, start_time: '09:00:00', end_time: '13:00:00', status: 'ACTIVE' },
      { department_id: dermatology.id, session_date: today, start_time: '10:00:00', end_time: '14:00:00', status: 'ACTIVE' },
    ], { transaction });

    console.log(`${operatingSessions.length} operating sessions created`);

    // 7. Create Encounters and Queue Entries for today's sessions
    const sessionMap = {};
    operatingSessions.forEach(s => sessionMap[s.department_id] = s);

    const encounters = [];
    const queueEntries = [];

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      const deptIndex = i % departments.length;
      const department = departments[deptIndex];
      const session = sessionMap[department.id];

      const encounter = await Encounter.create({
        patient_id: patient.id,
        hospital_id: hospital.id,
        department_id: department.id,
        visit_type: 'OPD',
        reason_for_visit: `Follow-up consultation for ${department.name}`,
        status: 'WAITING',
      }, { transaction });

      encounters.push(encounter);

      const queueEntry = await QueueEntry.create({
        encounter_id: encounter.id,
        operating_session_id: session.id,
        token_number: i + 1,
        status: 'WAITING',
        priority: i < 2 ? 1 : 0,
      }, { transaction });

      queueEntries.push(queueEntry);
    }

    console.log(`${encounters.length} encounters and queue entries created`);

    // 8. Add some medical history for patients
    await MedicalCondition.bulkCreate([
      { patient_id: patients[0].id, condition_name: 'Hypertension', description: 'Essential hypertension, well-controlled on medication', diagnosed_at: '2020-01-15', recorded_by: doctorUsers[0].id },
      { patient_id: patients[0].id, condition_name: 'Type 2 Diabetes', description: 'Diagnosed 2019, HbA1c 7.2%', diagnosed_at: '2019-06-10', recorded_by: doctorUsers[0].id },
      { patient_id: patients[1].id, condition_name: 'Asthma', description: 'Mild persistent asthma, uses inhaler PRN', diagnosed_at: '2015-03-20', recorded_by: doctorUsers[3].id },
      { patient_id: patients[2].id, condition_name: 'Acne Vulgaris', description: 'Moderate acne, on topical treatment', diagnosed_at: '2023-02-10', recorded_by: doctorUsers[4].id },
      { patient_id: patients[3].id, condition_name: 'Hypothyroidism', description: 'On levothyroxine 75mcg daily', diagnosed_at: '2018-11-05', recorded_by: doctorUsers[0].id },
      { patient_id: patients[4].id, condition_name: 'Coronary Artery Disease', description: 'Post-MI 2021, on dual antiplatelet therapy', diagnosed_at: '2021-08-15', recorded_by: doctorUsers[1].id },
    ], { transaction });

    await Allergy.bulkCreate([
      { patient_id: patients[0].id, substance: 'Penicillin', reaction: 'Rash and hives', severity: 'MODERATE', recorded_by: doctorUsers[0].id },
      { patient_id: patients[1].id, substance: 'Shellfish', reaction: 'Throat swelling, difficulty breathing', severity: 'SEVERE', recorded_by: doctorUsers[3].id },
      { patient_id: patients[2].id, substance: 'Latex', reaction: 'Contact dermatitis', severity: 'MILD', recorded_by: doctorUsers[4].id },
      { patient_id: patients[4].id, substance: 'Aspirin', reaction: 'Bronchospasm', severity: 'SEVERE', recorded_by: doctorUsers[1].id },
    ], { transaction });

    await Medication.bulkCreate([
      { patient_id: patients[0].id, medication_name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily', start_date: '2020-01-15', status: 'ACTIVE', recorded_by: doctorUsers[0].id },
      { patient_id: patients[0].id, medication_name: 'Metformin', dosage: '500mg', frequency: 'Twice daily', start_date: '2019-06-10', status: 'ACTIVE', recorded_by: doctorUsers[0].id },
      { patient_id: patients[1].id, medication_name: 'Albuterol', dosage: '90mcg', frequency: 'As needed', start_date: '2015-03-20', status: 'ACTIVE', recorded_by: doctorUsers[3].id },
      { patient_id: patients[3].id, medication_name: 'Levothyroxine', dosage: '75mcg', frequency: 'Once daily', start_date: '2018-11-05', status: 'ACTIVE', recorded_by: doctorUsers[0].id },
      { patient_id: patients[4].id, medication_name: 'Aspirin', dosage: '81mg', frequency: 'Once daily', start_date: '2021-08-15', status: 'ACTIVE', recorded_by: doctorUsers[1].id },
      { patient_id: patients[4].id, medication_name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily', start_date: '2021-08-15', status: 'ACTIVE', recorded_by: doctorUsers[1].id },
      { patient_id: patients[4].id, medication_name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily', start_date: '2021-08-15', status: 'ACTIVE', recorded_by: doctorUsers[1].id },
    ], { transaction });

    console.log('Medical history data created');

    // 9. Create some audit events
    await AuditEvent.bulkCreate([
      { actor_user_id: adminUser.id, action: 'SYSTEM_INIT', resource_type: 'SYSTEM', resource_id: null, reason: 'Initial system setup and seeding', request_id: uuidv4() },
      { actor_user_id: adminUser.id, action: 'CREATE_HOSPITAL', resource_type: 'HOSPITAL', resource_id: hospital.id, reason: 'Created main hospital', request_id: uuidv4() },
    ], { transaction });

    console.log('Audit events created');

    await transaction.commit();
    console.log('✅ Database seeding completed successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:      admin@medflow.com      / demo123');
    console.log('Doctor 1:   sarah.johnson@medflow.com  / demo123  (General Medicine)');
    console.log('Doctor 2:   michael.chen@medflow.com   / demo123  (Cardiology)');
    console.log('Doctor 3:   emily.rodriguez@medflow.com / demo123  (Orthopedics)');
    console.log('Doctor 4:   james.wilson@medflow.com   / demo123  (Pediatrics)');
    console.log('Doctor 5:   lisa.park@medflow.com      / demo123  (Dermatology)');
    console.log('Patient 1:  john.smith@email.com       / demo123');
    console.log('Patient 2:  maria.garcia@email.com     / demo123');
    console.log('Patient 3:  robert.brown@email.com     / demo123');
    console.log('... (10 patients total, all password: demo123)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    await transaction.rollback();
    console.error('Seeding failed:', error.message);
    throw error;
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default seed;