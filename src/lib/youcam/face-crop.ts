import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";
import sharp from "sharp";

let modelPromise: ReturnType<typeof blazeface.load> | null = null;

export class FaceCropError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FaceCropError";
  }
}

async function loadFaceModel() {
  modelPromise ??= blazeface.load({ maxFaces: 5, scoreThreshold: 0.75 });
  try {
    return await modelPromise;
  } catch (error) {
    modelPromise = null;
    throw error;
  }
}

/**
 * Produce a face-focused derivative for skin analysis. The normalized source
 * photo is kept separately for try-on, so the user image is never replaced by
 * this crop.
 */
export async function cropFaceForSkinAnalysis(source: Buffer): Promise<Buffer> {
  await tf.ready();
  const model = await loadFaceModel();

  const normalized = await sharp(source).rotate().jpeg({ quality: 92 }).toBuffer();
  const metadata = await sharp(normalized).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read the uploaded photo dimensions.");
  }

  const { data, info } = await sharp(normalized)
    .toColourspace("srgb")
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixels = tf.tensor3d(new Uint8Array(data), [info.height, info.width, info.channels]);
  try {
    const predictions = await model.estimateFaces(pixels, false);
    if (!predictions.length) {
      throw new FaceCropError("We couldn’t find a clear face in this photo. Try a front-facing photo with your face visible.");
    }

    const face = predictions
      .map((prediction) => {
        const [left, top] = prediction.topLeft as [number, number];
        const [right, bottom] = prediction.bottomRight as [number, number];
        return {
          left,
          top,
          right,
          bottom,
          width: right - left,
          height: bottom - top,
          centerX: (left + right) / 2,
          centerY: (top + bottom) / 2,
        };
      })
      .filter((box) => box.width > 0 && box.height > 0)
      .sort((a, b) => b.width * b.height - a.width * a.height)[0];

    if (!face) {
      throw new FaceCropError("We couldn’t find a clear face in this photo. Try a front-facing photo with your face visible.");
    }

    // Keep the face around 70% of the crop width, within YouCam's documented
    // 60–80% range. Include forehead and chin with modest vertical padding.
    const cropWidth = Math.min(metadata.width, Math.ceil(face.width / 0.7));
    const desiredHeight = Math.max(cropWidth * 1.15, face.height * 1.45);
    const cropHeight = Math.min(metadata.height, Math.ceil(desiredHeight));
    const left = Math.max(0, Math.min(metadata.width - cropWidth, Math.round(face.centerX - cropWidth / 2)));
    const top = Math.max(0, Math.min(metadata.height - cropHeight, Math.round(face.centerY - cropHeight * 0.46)));

    return sharp(normalized)
      .extract({ left, top, width: cropWidth, height: cropHeight })
      .resize({ width: 2560, height: 2560, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
  } finally {
    pixels.dispose();
  }
}
