import { z } from 'zod';
import { IDrivers } from '../../models/driver.model';

export function validateDriverSchema(data: IDrivers) {
  const driverSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email format'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    profilePic: z.string().optional(),
    googleId: z.string().optional(),
    state: z.string(),
    // License number: at least 6 characters, allows alphanumeric
    license_number: z
      .string()
      .min(6, 'License number must be at least 6 characters')
      .regex(
        /^[A-Z]{2}\d{2} \d{4} \d{7}$/,
        'License number must contain only uppercase letters and digits',
      ),

    // License expiration: Convert string to Date before validating
    license_exp: z.preprocess(
      (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
      z.date().min(new Date(), 'License expiration date must be in the future'),
    ),

    street: z.string().min(3, 'Street must be at least 3 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),

    // Postal Code: Must be exactly 6 digits
    pin_code: z
      .string()
      .length(6, 'Postal code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Postal code must be only digits'),

    // Date of Birth: Convert string to Date, validate age
    dob: z.preprocess(
      (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
      z
        .date()
        .max(new Date(), 'Date of Birth cannot be in the future')
        .refine(
          (value) => {
            const today = new Date();
            const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
            return value <= minAge;
          },
          { message: 'You must be at least 18 years old' },
        )
        .refine(
          (value) => {
            const today = new Date();
            const maxAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
            return value >= maxAge;
          },
          { message: 'Age cannot exceed 100 years' },
        ),
    ),
  });

  return driverSchema.safeParse(data);
}

export function validateDriverReApplySchema(data: IDrivers) {
  const driverReApplySchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters'),
    phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    profilePic: z.string().optional(),
    state: z.string(),
    // License number: at least 6 characters, allows alphanumeric
    license_number: z
      .string()
      .min(6, 'License number must be at least 6 characters')
      .regex(
        /^[A-Z]{2}\d{2} \d{4} \d{7}$/,
        'License number must contain only uppercase letters and digits',
      ),

    // License expiration: Convert string to Date before validating
    license_exp: z.preprocess(
      (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
      z.date().min(new Date(), 'License expiration date must be in the future'),
    ),

    street: z.string().min(3, 'Street must be at least 3 characters'),
    city: z.string().min(2, 'City must be at least 2 characters'),

    // Postal Code: Must be exactly 6 digits
    pin_code: z
      .string()
      .length(6, 'Postal code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'Postal code must be only digits'),

    // Date of Birth: Convert string to Date, validate age
    dob: z.preprocess(
      (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
      z
        .date()
        .max(new Date(), 'Date of Birth cannot be in the future')
        .refine(
          (value) => {
            const today = new Date();
            const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
            return value <= minAge;
          },
          { message: 'You must be at least 18 years old' },
        )
        .refine(
          (value) => {
            const today = new Date();
            const maxAge = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
            return value >= maxAge;
          },
          { message: 'Age cannot exceed 100 years' },
        ),
    ),
  });
  return driverReApplySchema.safeParse(data);
}
