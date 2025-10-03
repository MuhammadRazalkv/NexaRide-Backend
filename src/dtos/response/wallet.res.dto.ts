export interface WalletResDTO {
  userId: string;
  balance: number;
  transactions?: [
    {
      type: string;
      date: number;
      amount: number;
    },
  ];
}

export interface DriverWalletResDTO {
  driverId: string;
  balance: number;
  transactions?: [
    {
      type: string;
      date: number;
      amount: number;
      rideId?: string;
    },
  ];
}
