import { z } from 'zod';

export const createEncounterSchema = z.object({
  body: z.object({
    hospital_id: z.string().uuid('Invalid hospital ID'),
    department_id: z.string().uuid('Invalid department ID'),
    visit_type: z.enum(['OPD', 'EMERGENCY', 'FOLLOW_UP', 'REFERRAL', 'TELEMEDICINE']).default('OPD'),
    reason_for_visit: z.string().max(2000).optional(),
  }),
});

export const updateMedicalConditionSchema = z.object({
  body: z.object({
    condition_name: z.string().min(1, 'Condition name is required').max(255),
    description: z.string().max(5000).optional(),
    diagnosed_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  }),
});

export const createAllergySchema = z.object({
  body: z.object({
    substance: z.string().min(1, 'Substance is required').max(255),
    reaction: z.string().max(2000).optional(),
    severity: z.enum(['MILD', 'MODERATE', 'SEVERE', 'LIFE_THREATENING']).default('MILD'),
  }),
});

export const createMedicationSchema = z.object({
  body: z.object({
    medication_name: z.string().min(1, 'Medication name is required').max(255),
    dosage: z.string().max(100).optional(),
    frequency: z.string().max(100).optional(),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    status: z.enum(['ACTIVE', 'DISCONTINUED', 'COMPLETED', 'ON_HOLD']).default('ACTIVE'),
  }),
});

export const patientQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['REGISTERED', 'WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW']).optional(),
    date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
});