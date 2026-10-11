import { z } from 'zod';

export const queueActionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid queue entry ID'),
  }),
});

export const callPatientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid queue entry ID'),
  }),
  body: z.object({
    notes: z.string().max(1000).optional(),
  }),
});

export const startConsultationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid queue entry ID'),
  }),
  body: z.object({
    notes: z.string().max(2000).optional(),
  }),
});

export const completeConsultationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid queue entry ID'),
  }),
  body: z.object({
    clinical_notes: z.string().max(10000).optional(),
    diagnosis_summary: z.string().max(5000).optional(),
    treatment_plan: z.string().max(5000).optional(),
    follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
    prescriptions: z.array(z.object({
      medication_name: z.string().min(1).max(255),
      dosage: z.string().min(1).max(100),
      frequency: z.string().min(1).max(100),
      duration: z.string().max(100).optional(),
      instructions: z.string().max(2000).optional(),
    })).optional(),
  }),
});

export const skipPatientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid queue entry ID'),
  }),
  body: z.object({
    reason: z.string().min(1, 'Skip reason is required').max(1000),
  }),
});

export const recallPatientSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid queue entry ID'),
  }),
});

export const doctorQuerySchema = z.object({
  query: z.object({
    status: z.enum(['WAITING', 'CALLED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'CANCELLED', 'NO_SHOW']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export const createConsultationSchema = z.object({
  body: z.object({
    encounter_id: z.string().uuid('Invalid encounter ID'),
    clinical_notes: z.string().max(10000).optional(),
    diagnosis_summary: z.string().max(5000).optional(),
    treatment_plan: z.string().max(5000).optional(),
    follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  }),
});

export const updateConsultationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid consultation ID'),
  }),
  body: z.object({
    clinical_notes: z.string().max(10000).optional(),
    diagnosis_summary: z.string().max(5000).optional(),
    treatment_plan: z.string().max(5000).optional(),
    follow_up_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  }),
});