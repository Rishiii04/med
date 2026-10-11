import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import * as authController from '../controllers/authController.js';
import * as authValidators from '../validators/auth.js';

const router = Router();

router.post('/register', validate(authValidators.registerSchema), authController.register);
router.post('/login', validate(authValidators.loginSchema), authController.login);
router.post('/refresh', validate(authValidators.refreshTokenSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.me);
router.post('/change-password', authenticate, validate(authValidators.changePasswordSchema), authController.changePassword);

export default router;