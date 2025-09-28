export const loginFields = ['accessToken', 'refreshToken'] as const;
export type LoginResponseAdminDTO = {
  accessToken: string;
  refreshToken: string;
};
export interface LoginResDTO {
  user: {
    _id: unknown;
    name: string;
    email: string;
    profilePic?: string;
  };
  accessToken: string;
  refreshToken: string;
}
