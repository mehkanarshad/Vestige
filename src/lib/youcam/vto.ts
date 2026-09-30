/**
 * YouCam Virtual Try-On (VTO) API client.
 *
 * Docs: https://developer.youcam.com/vto
 */

import { VtoRequest, VtoResponse } from "@/types";

export class VtoError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "VtoError";
  }
}

export async function virtualTryOn(input: VtoRequest): Promise<VtoResponse> {
  const apiKey = process.env.YOUCAM_VTO_API_KEY;
  const apiUrl = process.env.YOUCAM_VTO_API_URL;

  if (!apiKey || !apiUrl) {
    return mockVto(input);
  }

  const response = await fetch(`${apiUrl}/try-on`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "X-Client": "vestige/1.0",
    },
    body: JSON.stringify({
      user_photo_url: input.userPhotoUrl,
      garment_image_url: input.garmentImageUrl,
      garment_category: input.garmentCategory,
      output_format: "jpeg",
      output_quality: 90,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new VtoError(
      `YouCam VTO API error ${response.status}: ${text}`,
      response.status
    );
  }

  const data = await response.json();
  return {
    tryOnImageUrl: data.result_url ?? data.try_on_image_url,
    status: "success",
  };
}

/**
 * Mock VTO: returns a placeholder image for demo / dev mode.
 * In a real demo you'd swap in a pre-rendered composite.
 */
function mockVto(input: VtoRequest): VtoResponse {
  // Use a fashion-styled placeholder that looks plausible
  const seed = encodeURIComponent(input.garmentCategory ?? "outfit");
  return {
    tryOnImageUrl: `https://placehold.co/480x640/E8DDD0/3D2B1F?text=VTO+Preview&font=playfair-display`,
    status: "mock",
  };
}
