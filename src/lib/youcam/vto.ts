import { VtoRequest, VtoResponse } from "@/types";
import {
  createYouCamTask,
  uploadYouCamImage,
  waitForYouCamTask,
  YouCamApiError,
} from "./client";

export class VtoError extends YouCamApiError {}

export async function virtualTryOn(input: VtoRequest): Promise<VtoResponse> {
  const source = input.userPhotoBase64
    ? {
        src_file_id: await uploadYouCamImage(
          Buffer.from(input.userPhotoBase64, "base64"),
          input.userPhotoType ?? "image/jpeg"
        ),
      }
    : input.userPhotoUrl
      ? { src_file_url: input.userPhotoUrl }
      : null;
  if (!source) throw new VtoError("No user photo is available for try-on", 400);

  const taskPath = "/task/cloth-v4";
  const taskId = await createYouCamTask(taskPath, {
    ...source,
    ref_file_url: input.garmentImageUrl,
    garment_category: mapGarmentCategory(input.garmentCategory),
  });
  const task = await waitForYouCamTask(taskPath, taskId, 55_000);
  const results = task.results ?? {};
  const resultUrl = results.url;

  if (typeof resultUrl !== "string" || !resultUrl) {
    throw new VtoError("YouCam completed the try-on task without a result URL");
  }

  return {
    tryOnImageUrl: resultUrl,
    status: "success",
  };
}

function mapGarmentCategory(category: string): string {
  if (category === "dress") return "full_body";
  if (category === "bottom") return "lower_body";
  return "upper_body";
}
