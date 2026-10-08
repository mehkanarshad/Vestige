import { z } from "zod";
import { GarmentFacet, normalizeGarmentFacet } from "@/lib/collaborative-filter";
import { hexToLab } from "@/lib/color-science";
import { prisma } from "@/lib/db/client";
import { StyleIntention } from "@/types";

const HttpsUrlSchema = z.string().url().refine(
  (value) => new URL(value).protocol === "https:",
  "Expected an HTTPS URL"
);

const Channel3ProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  brands: z.array(z.object({ name: z.string() })).optional().default([]),
  images: z.array(z.object({
    url: HttpsUrlSchema,
    cleaned_url: HttpsUrlSchema.nullable().optional(),
    is_main_image: z.boolean().optional(),
  })).optional().default([]),
  category: z.object({
    slug: z.string(),
    title: z.string(),
    path: z.array(z.string()).optional(),
  }).nullable().optional(),
  colors: z.array(z.object({
    hex: z.string().regex(/^#[\da-f]{6}$/i),
    percentage: z.number(),
  })).optional().default([]),
  offers: z.array(z.object({
    url: HttpsUrlSchema,
    availability: z.string(),
    price: z.object({
      price: z.number().nonnegative(),
      currency: z.string().min(1),
    }),
  })).optional().default([]),
  materials: z.array(z.string()).nullable().optional(),
  key_features: z.array(z.string()).nullable().optional(),
  structured_attributes: z.record(z.array(z.string())).optional().default({}),
});

const Channel3SearchSchema = z.object({
  products: z.array(Channel3ProductSchema),
  next_page_token: z.string().nullable().optional(),
});

const CATEGORIES = ["top", "bottom", "dress", "outerwear"] as const;
type CatalogCategory = typeof CATEGORIES[number];

export class Channel3CatalogError extends Error {
  constructor(message: string, readonly statusCode: number) {
    super(message);
    this.name = "Channel3CatalogError";
  }
}

function categoryFor(product: z.infer<typeof Channel3ProductSchema>): CatalogCategory | null {
  const categoryText = [
    product.category?.slug,
    product.category?.title,
    ...(product.category?.path ?? []),
    product.title,
  ].join(" ").toLowerCase().replace(/[^a-z]+/g, " ");

  if (/\b(dress|gown|jumpsuit|romper)\b/.test(categoryText)) return "dress";
  if (/\b(outerwear|coat|jacket|blazer|cardigan)\b/.test(categoryText)) return "outerwear";
  if (/\b(bottom|trouser|pants|jeans|skirt|shorts|leggings)\b/.test(categoryText)) return "bottom";
  if (/\b(top|shirt|blouse|sweater|hoodie|tee|t shirt)\b/.test(categoryText)) return "top";
  return null;
}

function productFacet(
  attributes: Record<string, string[]>,
  names: string[],
  facet: GarmentFacet
): string | null {
  const entries = Object.entries(attributes);
  const values = names.flatMap((name) =>
    entries
      .filter(([key]) =>
        key.toLowerCase().replace(/[^a-z]+/g, "") === name.toLowerCase().replace(/[^a-z]+/g, "")
      )
      .flatMap(([, facetValues]) => facetValues)
  );
  for (const value of values) {
    const normalized = normalizeGarmentFacet(facet, value);
    if (normalized) return normalized;
  }
  return null;
}

function colorTone(lightness: number): string {
  if (lightness >= 67) return "light";
  if (lightness >= 38) return "medium";
  return "deep";
}

function searchQuery(intention: StyleIntention, category: CatalogCategory): string {
  return `women's ${intention} ${category} clothing`;
}

async function searchChannel3(query: string): Promise<z.infer<typeof Channel3ProductSchema>[]> {
  const apiKey = process.env.CHANNEL3_API_KEY;
  if (!apiKey) {
    throw new Channel3CatalogError(
      "Channel3 catalog is not configured. Set CHANNEL3_API_KEY on the server.",
      503
    );
  }

  let response: Response;
  try {
    response = await fetch("https://api.trychannel3.com/v1/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        query,
        filters: { gender: "female", availability: ["InStock"] },
        limit: 12,
      }),
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Channel3CatalogError("Channel3 product search timed out.", 504);
    }
    throw new Channel3CatalogError("Could not connect to Channel3 product search.", 502);
  }

  if (!response.ok) {
    throw new Channel3CatalogError(
      `Channel3 product search failed with status ${response.status}.`,
      502
    );
  }

  let responseBody: unknown;
  try {
    responseBody = await response.json();
  } catch {
    throw new Channel3CatalogError("Channel3 returned invalid JSON.", 502);
  }

  const result = Channel3SearchSchema.safeParse(responseBody);
  if (!result.success) {
    throw new Channel3CatalogError(
      "Channel3 returned a response that did not match its documented product shape.",
      502
    );
  }
  return result.data.products;
}

export async function ingestChannel3Catalog(intention: StyleIntention): Promise<string[]> {
  const results = await Promise.all(
    CATEGORIES.map((category) => searchChannel3(searchQuery(intention, category)))
  );
  const products = new Map(results.flat().map((product) => [product.id, product]));
  const garmentIds: string[] = [];

  for (const product of products.values()) {
    const category = categoryFor(product);
    const image = product.images.find((candidate) => candidate.is_main_image)
      ?? product.images[0];
    const imageUrl = image?.cleaned_url ?? image?.url;
    const color = [...product.colors].sort((first, second) => second.percentage - first.percentage)[0];
    const offer = product.offers.find((candidate) => candidate.availability === "InStock");
    if (!category || !imageUrl || !color || !offer) continue;

    const colorLab = hexToLab(color.hex);
    const attributes = {
      tone: productFacet(product.structured_attributes, ["tone", "color_tone"], "tone")
        ?? colorTone(colorLab.l),
      silhouette: productFacet(product.structured_attributes, ["silhouette", "fit"], "silhouette"),
      formality: productFacet(product.structured_attributes, ["formality", "occasion"], "formality"),
      style: productFacet(product.structured_attributes, ["style", "aesthetic"], "style"),
      texture: productFacet(product.structured_attributes, ["texture"], "texture"),
      materials: product.materials ?? [],
      keyFeatures: product.key_features ?? [],
      sourceAttributes: product.structured_attributes,
      dominantColorShare: color.percentage,
    };

    const garment = await prisma.garment.upsert({
      where: {
        source_externalId: {
          source: "catalog",
          externalId: `channel3:${product.id}`,
        },
      },
      create: {
        source: "catalog",
        externalId: `channel3:${product.id}`,
        ownerUserId: null,
        name: product.title,
        category,
        imageUrl,
        colorHex: color.hex,
        colorLab: JSON.stringify(colorLab),
        brand: product.brands[0]?.name ?? null,
        description: product.description ?? null,
        productUrl: offer.url,
        price: offer.price.price,
        currency: offer.price.currency,
        availability: offer.availability,
        catalogAttributes: JSON.stringify(attributes),
      },
      update: {
        name: product.title,
        category,
        imageUrl,
        colorHex: color.hex,
        colorLab: JSON.stringify(colorLab),
        brand: product.brands[0]?.name ?? null,
        description: product.description ?? null,
        productUrl: offer.url,
        price: offer.price.price,
        currency: offer.price.currency,
        availability: offer.availability,
        catalogAttributes: JSON.stringify(attributes),
      },
    });
    garmentIds.push(garment.id);
  }

  return garmentIds;
}
