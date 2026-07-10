import { env } from './env';

export const isCloudinaryConfigured = (): boolean =>
  Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

export const getCloudinaryConfig = () => ({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const ensureCloudinaryConfigured = async (): Promise<
  typeof import('cloudinary').v2
> => {
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not configured');
  }

  const { v2: cloudinary } = await import('cloudinary');
  cloudinary.config(getCloudinaryConfig());
  return cloudinary;
};
