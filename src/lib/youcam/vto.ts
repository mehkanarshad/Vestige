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

  const reference = input.garmentImage
    ? {
        ref_file_id: await uploadYouCamImage(
          Buffer.from(input.garmentImage),
          input.garmentImageType ?? "image/jpeg"
        ),
      }
    : input.garmentImageUrl
      ? { ref_file_url: input.garmentImageUrl }
      : null;
  if (!reference) throw new VtoError("Upload a garment photo to try it on", 400);

  const taskPath = "/task/cloth-v4";
  const taskId = await createYouCamTask(taskPath, {
    ...source,
    ...reference,
    garment_category: mapGarmentCategory(input.garmentCategory),
  });
  const task = await waitForYouCamTask(taskPath, taskId, 55_000);
  const results = task.results ?? {};
  const resultUrl = results.url;

  if (typeof resultUrl !== "string" || !resultUrl) {
    throw new VtoError("YouCam completed the try-on task without a result URL");
  }

  const imageResponse = await fetch(resultUrl);
  if (!imageResponse.ok) {
    throw new VtoError(`Could not download the YouCam result (${imageResponse.status})`, imageResponse.status);
  }
  const contentType = imageResponse.headers.get("content-type")?.split(";")[0];
  if (contentType !== "image/jpeg" && contentType !== "image/png") {
    throw new VtoError("YouCam returned an unsupported result image format");
  }
  const resultImage = Buffer.from(await imageResponse.arrayBuffer());
  if (resultImage.byteLength > 15 * 1024 * 1024) {
    throw new VtoError("YouCam result image is too large to store");
  }

  return {
    tryOnImageUrl: `data:${contentType};base64,${resultImage.toString("base64")}`,
    status: "success",
  };
}

function mapGarmentCategory(category: string): string {
  if (category === "dress") return "full_body";
  if (category === "bottom") return "lower_body";
  return "upper_body";
}
