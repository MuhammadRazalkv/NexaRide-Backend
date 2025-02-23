import mongoose, { Schema, Document, ObjectId } from 'mongoose';

export interface IDrivers extends Document {
  Name: String;
  Email: String;
  Password: String;
  Phone: Number;
  License_number: String;
  Availability?: Boolean;
  Vehicle_id?: ObjectId;
  Street_address: String;
  City: String;
  State: String;
  Zip_code: String;
  Dob: Date;
  License_exp: Date;
  Verified: Boolean;
}

const DriversSchema: Schema = new Schema({
  Name: { type: String, required: true },
  Email: { type: String, required: true, unique: true },
  Password: { type: String, required: true },
  Phone: { type: Number, required: true, unique: true },
  License_number: { type: String, required: true, unique: true },
  Availability: { type: Boolean,  },
  Vehicle_id: { type: Schema.Types.ObjectId},
  Street_address: { type: String, required: true },
  City: { type: String, required: true },
  State: { type: String, required: true },
  Zip_code: { type: String, required: true },
  Dob: { type: Date, required: true },
  License_exp: { type: Date, required: true },
  Verified: { type: Boolean, default:false },
});

const Driver = mongoose.model<IDrivers>('Drivers', DriversSchema);

export default Driver;

