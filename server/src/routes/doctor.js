import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as doctorController from '../controllers/doctorController.js';
import * as doctorValidators from '../validators/doctor.js';

const router = Router();

router.use(authenticate);
router.use(authorize('DOCTOR'));

router.get('/dashboard', doctorController.getDashboard);
router.get('/queue', validate(doctorValidators.doctorQuerySchema), doctorController.getQueue);
router.post('/queue/:id/call', validate(doctorValidators.callPatientSchema), doctorController.callPatient);
router.post('/queue/:id/start', validate(doctorValidators.startConsultationSchema), doctorController.startConsultationAction);
router.post('/queue/:id/complete', validate(doctorValidators.completeConsultationSchema), doctorController.completeConsultationAction);
router.post('/queue/:id/skip', validate(doctorValidators.skipPatientSchema), doctorController.skipPatientAction);
router.post('/queue/:id/recall', validate(doctorValidators.recallPatientSchema), doctorController.recallPatientAction);
router.get('/patients/:patientId/medical-history', doctorController.getPatientMedicalHistory);

export default router;