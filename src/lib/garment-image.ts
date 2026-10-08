export type GarmentImageSource =
  | { imageData: string; imageUrl?: never }
  | { imageData?: never; imageUrl: string };

export function resolveGarmentImageSource(
  imageData: string | null | undefined,
  imageUrl: string | null | undefined
): GarmentImageSource | null {
  if (imageData && /^data:image\/jpeg;base64,[\s\S]+$/.test(imageData)) {
    return { imageData };
  }

  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return { imageUrl };
      }
    } catch {
      return null;
    }
  }

  return null;
}
