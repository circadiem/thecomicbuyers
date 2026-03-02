// Zod validation schema for the seller questionnaire
// Source: Implementation Spec §X (seller questionnaire + grade adjustment)
// Used both client-side (form validation) and server-side (Task 9 submission)

import { z } from 'zod';
import { SERVICE_STATES } from '@/lib/config/constants';

export const SellerQuestionnaireSchema = z.object({
  // ── Contact ────────────────────────────────────────────────────────────────
  name: z.string().min(2, 'Full name is required'),
  email: z.string().email('A valid email address is required'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^[\d\s\-().+]+$/, 'Invalid phone number format'),
  state: z.enum(SERVICE_STATES, {
    errorMap: () => ({ message: 'Select a state we serve' }),
  }),
  city: z.string().min(1, 'City is required'),
  zip: z.string().regex(/^\d{5}$/, 'ZIP code must be 5 digits'),

  // ── Collection context ─────────────────────────────────────────────────────
  estimated_count: z
    .number({ invalid_type_error: 'Enter an estimated book count' })
    .int()
    .min(100, 'Minimum collection size is 100 books'),
  storage_type: z.enum(['bagged_boarded', 'bagged_only', 'loose', 'mixed'], {
    errorMap: () => ({ message: 'Select a storage type' }),
  }),
  storage_location: z.enum(
    ['climate_controlled', 'normal_interior', 'garage_basement', 'unknown'],
    { errorMap: () => ({ message: 'Select storage conditions' }) },
  ),
  known_restorations: z.boolean(),

  // ── Transaction context ────────────────────────────────────────────────────
  timeline: z.enum(['flexible', 'within_month', 'urgent'], {
    errorMap: () => ({ message: 'Select a selling timeline' }),
  }),
  pickup_available: z.boolean(),
  notes: z.string().max(500, 'Notes must be 500 characters or fewer').optional(),
});

export type SellerQuestionnaire = z.infer<typeof SellerQuestionnaireSchema>;

// Human-readable labels for enum values
export const STORAGE_TYPE_LABELS: Record<
  SellerQuestionnaire['storage_type'],
  string
> = {
  bagged_boarded: 'Bagged and boarded',
  bagged_only: 'Bagged only (no boards)',
  loose: 'Loose (no bags)',
  mixed: 'Mixed — some bagged, some not',
};

export const STORAGE_LOCATION_LABELS: Record<
  SellerQuestionnaire['storage_location'],
  string
> = {
  climate_controlled: 'Climate-controlled room or storage',
  normal_interior: 'Normal interior room',
  garage_basement: 'Garage, attic, or basement',
  unknown: "I'm not sure",
};

export const TIMELINE_LABELS: Record<SellerQuestionnaire['timeline'], string> = {
  flexible: 'No rush — whenever works',
  within_month: 'Would like to sell within a month',
  urgent: 'As soon as possible',
};
