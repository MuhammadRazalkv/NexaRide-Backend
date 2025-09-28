import { IVehicle } from '../../models/vehicle.model';
import { z } from 'zod';
export function validateVehicleSchema(data: IVehicle) {
  const vehicleSchema = z.object({
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

  return vehicleSchema.safeParse(data);
}

export function validateLicensePlate(value: string): boolean {
  const licensePlateRegex = /^[A-Z]{2}[ -]?[0-9]{1,2}[ -]?[A-Z]{1,2}[ -]?[0-9]{1,4}$/;
  return licensePlateRegex.test(value);
}
