import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as adminController from '../controllers/adminController.js';
import * as adminValidators from '../validators/admin.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/dashboard', adminController.getDashboard);
router.get('/departments', adminController.getDepartments);
router.post('/departments', validate(adminValidators.createDepartmentSchema), adminController.createDepartment);
router.patch('/departments/:id', validate(adminValidators.updateDepartmentSchema), adminController.updateDepartment);
router.get('/doctors', adminController.getDoctors);
router.post('/doctors', validate(adminValidators.createDoctorSchema), adminController.createDoctor);
router.patch('/doctors/:id', validate(adminValidators.updateDoctorSchema), adminController.updateDoctor);
router.get('/queue', validate(adminValidators.adminQueueQuerySchema), adminController.getAllQueue);
router.get('/analytics', validate(adminValidators.adminAnalyticsQuerySchema), adminController.getAnalytics);
router.get('/audit-logs', validate(adminValidators.auditLogQuerySchema), adminController.getAuditLogs);
router.post('/queue/:id/correct', validate(adminValidators.queueCorrectionSchema), adminController.queueCorrection);

export default router;