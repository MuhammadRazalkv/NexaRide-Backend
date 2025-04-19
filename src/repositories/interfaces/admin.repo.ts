import { IPricing } from "../../models/pricing.model";
interface IUpdateFare {
    vehicleClass: "Basic" | "Premium" | "Luxury";
    farePerKm: number;
  }
  
export interface IAdminRepo {
    updateFare(updates: IUpdateFare[]): Promise<(IPricing[])>
    getFares(): Promise<IPricing[]>
}