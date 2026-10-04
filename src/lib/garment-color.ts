import sharp from "sharp";

export interface GarmentColorEstimate {
  hex: string;
  confidence: number;
}

export async function estimateGarmentColor(image: Buffer): Promise<GarmentColorEstimate> {
  const { data, info } = await sharp(image)
    .rotate()
    .resize(64, 64, { fit: "cover", position: "centre" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>();
  let sampledPixels = 0;
  let foregroundPixels = 0;

  for (let y = 4; y < info.height - 4; y++) {
    for (let x = 4; x < info.width - 4; x++) {
      const offset = (y * info.width + x) * info.channels;
      const red = data[offset];
      const green = data[offset + 1];
      const blue = data[offset + 2];
      sampledPixels += 1;

      const likelyBackground =
        (red > 245 && green > 245 && blue > 245) ||
        (red < 8 && green < 8 && blue < 8);
      if (!likelyBackground) foregroundPixels += 1;
      if (likelyBackground) continue;

      const key = [red, green, blue].map((channel) => Math.floor(channel / 32)).join(":");
      const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 };
      bucket.count += 1;
      bucket.red += red;
      bucket.green += green;
      bucket.blue += blue;
      buckets.set(key, bucket);
    }
  }

  if (buckets.size === 0) {
    return { hex: averageColor(data, info.channels), confidence: 0.25 };
  }

  const dominant = [...buckets.values()].sort((left, right) => right.count - left.count)[0];
  const rgb = [dominant.red, dominant.green, dominant.blue].map((channel) =>
    Math.round(channel / dominant.count)
  );
  const hex = `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  const dominantShare = dominant.count / Math.max(1, foregroundPixels);
  const foregroundShare = foregroundPixels / Math.max(1, sampledPixels);

  return {
    hex,
    confidence:
      Math.round(Math.min(1, dominantShare * 1.6 * (0.45 + 0.55 * foregroundShare)) * 100) / 100,
  };
}

function averageColor(data: Buffer, channels: number): string {
  const sums = [0, 0, 0];
  const pixels = data.length / channels;
  for (let offset = 0; offset < data.length; offset += channels) {
    sums[0] += data[offset];
    sums[1] += data[offset + 1];
    sums[2] += data[offset + 2];
  }
  return `#${sums.map((sum) => Math.round(sum / pixels).toString(16).padStart(2, "0")).join("")}`;
}