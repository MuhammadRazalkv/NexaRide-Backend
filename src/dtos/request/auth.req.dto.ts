import { z, ZodTypeAny } from 'zod';
import { messages } from '../../constants/httpMessages';

export const loginDTO = z.object({
  email: z.string().email(messages.INVALID_EMAIL),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginDTO = z.infer<typeof loginDTO>;

export const emailDTO = z.string().email(messages.INVALID_EMAIL);

export type EmailDTO = z.infer<typeof emailDTO>;

export const emailOTPValidation = z.object({
  email: z.string().email('Invalid email address'),
  OTP: z
    .string()
    .length(4, 'OTP must be exactly 4 digits')
    .regex(/^\d{4}$/, 'OTP must contain only digits'),
});

export type EmailOTPDto = z.infer<typeof emailOTPValidation>;

const toDate = (arg: unknown) => {
  if (typeof arg === 'string' || typeof arg === 'number') {
    const d = new Date(arg);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export const driverSchemaDTO = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  profilePic: z.string().optional(),
  googleId: z.string().optional(),
  state: z.string(),

  license_number: z
    .string()
    .min(6, 'License number must be at least 6 characters')
    .regex(
      /^[A-Z]{2}\d{2}\s?\d{4}\s?\d{7}$/,
      'License number must follow the Indian format (e.g. KA01 2011 0001234)',
    ),

  license_exp: z.preprocess(
    toDate,
    z
      .date({
        required_error: 'License expiration date is required',
        invalid_type_error: 'Invalid date format',
      })
      .min(new Date(), 'License expiration date must be in the future'),
  ),

  street: z.string().min(3, 'Street must be at least 3 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),

  pin_code: z
    .string()
    .length(6, 'Postal code must be exactly 6 digits')
    .regex(/^\d{6}$/, 'Postal code must be only digits'),

  dob: z.preprocess(
    toDate,
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

export type DriverSchemaDTO = z.infer<typeof driverSchemaDTO>;

export function validateLicensePlate(value: string): boolean {
  const licensePlateRegex = /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,2}[ -]?[0-9]{1,4}$/;
  return licensePlateRegex.test(value);
}
export const vehicleSchemaDTO = z.object({
  nameOfOwner: z.string().min(1, 'Name of owner is required').trim(),

  addressOfOwner: z.string().min(1, 'Street address is required').trim(),

  brand: z.string().min(1, 'Vehicle brand is required').trim(),

  vehicleModel: z.string().min(1, 'Vehicle model is required').trim(),

  color: z.string().min(1, 'Vehicle color is required').trim(),

  numberPlate: z
    .string()
    .min(1, 'Number plate is required')
    .refine(validateLicensePlate, 'Invalid Number Plate Format'),
  regDate: z.preprocess(
    (arg) => {
      if (typeof arg === 'string') {
        // Convert string to Date
        const parsedDate = new Date(arg);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate; // Ensure valid date
      }
      return arg; // Assume it's already a Date or invalid
    },
    z.date().refine((date) => date <= new Date(), 'Registration date cannot be in the future'),
  ),

  expDate: z.preprocess(
    (arg) => {
      if (typeof arg === 'string') {
        // Convert string to Date
        const parsedDate = new Date(arg);
        return isNaN(parsedDate.getTime()) ? undefined : parsedDate; // Ensure valid date
      }
      return arg;
    },
    z.date().refine((date) => date >= new Date(), 'Expiration date must not be in the past'),
  ),

  insuranceProvider: z.string().min(1, 'Insurance provider is required').trim(),

  policyNumber: z.string().regex(/^\d{10}$/, 'Policy number must be exactly 10 digits'),

  vehicleImages: z.object({
    frontView: z.string(),
    rearView: z.string(),
    interiorView: z.string(),
  }),
});

export type VehicleSchemaDTO = z.infer<typeof vehicleSchemaDTO>;

const fieldSchemas = driverSchemaDTO.shape;

const updateSchemas = Object.entries(fieldSchemas).map(([key, schema]) =>
  z.object({
    field: z.literal(key),
    value: schema as ZodTypeAny,
  }),
);

export const updateDriverInfoDTO = z.discriminatedUnion(
  'field',
  updateSchemas as [(typeof updateSchemas)[number], ...(typeof updateSchemas)[number][]],
);

export type UpdateDriverInfoDTO = z.infer<typeof updateDriverInfoDTO>;
