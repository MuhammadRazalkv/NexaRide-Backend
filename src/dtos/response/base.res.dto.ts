export interface BaseAccountDTO {
  _id: string;
  name: string;
  email: string;
  isBlocked: boolean;
  softBlock: boolean;
  phone: number;
  profilePic?: string;
}
