import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    hospital_id: z.string().uuid('Invalid hospital ID'),
    name: z.string().min(1, 'Department name is required').max(100),
    description: z.string().max(1000).optional(),
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
  body: z.object({
    name: z.string().min(1, 'Department name is required').max(100).optional(),
    description: z.string().max(1000).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const createDoctorSchema = z.object({
  body: z.object({
    full_name: z.string().min(1, 'Full name is required').max(255),
    email: z.string().email('Invalid email address'),
    phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/, 'Invalid phone number').optional(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    hospital_id: z.string().uuid('Invalid hospital ID'),
    department_id: z.string().uuid('Invalid department ID'),
    registration_number: z.string().min(1, 'Registration number is required').max(50),
    specialization: z.string().max(100).optional(),
  }),
});

export const updateDoctorSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid doctor ID'),
  }),
  body: z.object({
    full_name: z.string().min(1).max(255).optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/).optional(),
    hospital_id: z.string().uuid().optional(),
    department_id: z.string().uuid().optional(),
    registration_number: z.string().min(1).max(50).optional(),
    specialization: z.string().max(100).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const createOperatingSessionSchema = z.object({
  body: z.object({
    department_id: z.string().uuid('Invalid department ID'),
    session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    start_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:MM:SS)'),
    end_time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Invalid time format (HH:MM:SS)'),
  }),
});

export const adminQueueQuerySchema = z.object({
  query: z.object({
    department_id: z.string().uuid().optional(),
    status: z.enum(['REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW']).optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    search: z.string().max(100).optional(),
  }),
});

export const adminAnalyticsQuerySchema = z.object({
  query: z.object({
    department_id: z.string().uuid().optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});

export const auditLogQuerySchema = z.object({
  query: z.object({
    actor_user_id: z.string().uuid().optional(),
    patient_id: z.string().uuid().optional(),
    action: z.string().max(100).optional(),
    resource_type: z.string().max(50).optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const queueCorrectionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid queue entry ID'),
  }),
  body: z.object({
    action: z.enum(['CANCEL', 'REINSTATE', 'CHANGE_STATUS']),
    new_status: z.enum(['REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW']).optional(),
    reason: z.string().min(1, 'Reason is required').max(1000),
  }),
});