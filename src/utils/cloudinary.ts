import { v2 } from 'cloudinary';

v2.config({
  api_key: process.env.CLOUDINARY_API_KEY,
  cloud_name: process.env.CLOUDINARY_NAME,
  api_secret: process.env.CLOUDINARY_SECRET,
});

export default v2;

export const generateSignedCloudinaryUrl = (
  publicId?: string,
  expiresIn: number = 1 * 60,
): string | undefined => {
  const expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
  if (!publicId) {
    return undefined;
  }
  return v2.url(publicId, {
    type: 'authenticated',
    secure: true,
    sign_url: true,
    expires_at: expiresAt,
  });
};
