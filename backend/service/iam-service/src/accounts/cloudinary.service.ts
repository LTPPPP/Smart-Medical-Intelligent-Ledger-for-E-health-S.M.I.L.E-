import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export const AVATAR_FOLDER = 'smile/avatars';

export interface AvatarUploadSignature {
  signature: string;
  timestamp: number;
  folder: string;
  publicId: string;
  apiKey: string;
  cloudName: string;
}

// Signs Cloudinary avatar uploads.
@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  // Signs the widget's exact params.
  generateAvatarSignature(
    accountId: string,
    paramsToSign: Record<string, unknown>,
  ): AvatarUploadSignature {
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    if (!apiKey || !apiSecret || !cloudName) {
      throw new InternalServerErrorException('Avatar upload is not configured');
    }

    const timestamp = Number(paramsToSign.timestamp) || Math.round(Date.now() / 1000);
    const publicId = accountId;
    const signable: Record<string, unknown> = {
      timestamp,
      folder: AVATAR_FOLDER,
      public_id: publicId,
    };
    if (paramsToSign.source !== undefined) signable.source = paramsToSign.source;
    if (paramsToSign.custom_coordinates !== undefined) {
      signable.custom_coordinates = paramsToSign.custom_coordinates;
    }

    const signature = cloudinary.utils.api_sign_request(signable, apiSecret);

    return { signature, timestamp, folder: AVATAR_FOLDER, publicId, apiKey, cloudName };
  }
}
