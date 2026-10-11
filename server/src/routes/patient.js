import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as patientController from '../controllers/patientController.js';
import * as patientValidators from '../validators/patient.js';

const router = Router();

router.use(authenticate);
router.use(authorize('PATIENT'));

router.get('/profile', patientController.getMyProfile);
router.get('/encounters', validate(patientValidators.patientQuerySchema), patientController.getMyEncounters);
router.get('/queue', patientController.getMyQueueStatus);
router.get('/medical-history', patientController.getMedicalHistory);
router.post('/encounters', validate(patientValidators.createEncounterSchema), patientController.createEncounter);
router.get('/encounters/:id', patientController.getEncounterDetails);
router.post('/medical-conditions', validate(patientValidators.updateMedicalConditionSchema), patientController.addMedicalCondition);
router.post('/allergies', validate(patientValidators.createAllergySchema), patientController.addAllergy);
router.post('/medications', validate(patientValidators.createMedicationSchema), patientController.addMedication);

export default router;