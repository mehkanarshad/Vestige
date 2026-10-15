import { z } from "zod";
import { GarmentFacet, normalizeGarmentFacet } from "@/lib/collaborative-filter";
import { hexToLab } from "@/lib/color-science";
import { prisma } from "@/lib/db/client";
import { StyleIntention } from "@/types";

const ProductUrlSchema = z.string().url().refine((value) => {
  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}, "Expected an HTTP(S) URL");

const CategoryPathNodeSchema = z.union([
  z.string(),
  z.object({ slug: z.string().optional(), title: z.string().optional() }),
]);

const Channel3ProductSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  brands: z.array(z.object({ name: z.string().optional() })).nullable().optional().default([])
    .transform((value) => value ?? []),
  images: z.array(z.object({
    url: ProductUrlSchema.optional(),
    image_url: ProductUrlSchema.optional(),
    cleaned_url: ProductUrlSchema.nullable().optional(),
    is_main_image: z.boolean().optional(),
  }).passthrough()).nullable().optional().default([]).transform((value) => value ?? []),
  category: z.object({
    slug: z.string().optional(),
    title: z.string().optional(),
    path: z.array(CategoryPathNodeSchema).optional(),
    has_children: z.boolean().optional(),
  }).nullable().optional(),
  // `colors` is not part of the documented Product model, but accept it when
  // returned by older/extended Channel3 deployments.
  colors: z.unknown().optional(),
  offers: z.array(z.object({
    url: ProductUrlSchema,
    availability: z.string().optional(),
    price: z.object({
      price: z.number().nonnegative(),
      currency: z.string().min(1),
      compare_at_price: z.number().nullable().optional(),
    }).passthrough(),
  }).passthrough()).nullable().optional().default([]).transform((value) => value ?? []),
  materials: z.array(z.string()).nullable().optional(),
  key_features: z.array(z.string()).nullable().optional(),
  structured_attributes: z.record(z.unknown()).nullable().optional().default({})
    .transform((value) => value ?? {}),
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

type Channel3Product = z.infer<typeof Channel3ProductSchema>;

function pathLabels(path: Array<string | { slug?: string; title?: string }> | undefined): string[] {
  if (!Array.isArray(path)) return [];
  return path.flatMap((node): string[] => {
    if (typeof node === "string") return [node];
    if (!node || typeof node !== "object") return [];
    return [node.title, node.slug].filter((item): item is string => typeof item === "string");
  });
}

function categoryFor(product: Channel3Product): CatalogCategory | null {
  const categoryText = [
    product.category?.slug,
    product.category?.title,
    ...pathLabels(product.category?.path),
    product.title,
  ].join(" ").toLowerCase().replace(/[^a-z]+/g, " ");

  if (/\b(dress|gown|jumpsuit|romper)\b/.test(categoryText)) return "dress";
  if (/\b(outerwear|coat|jacket|blazer|cardigan)\b/.test(categoryText)) return "outerwear";
  if (/\b(bottom|trouser|pants|jeans|skirt|shorts|leggings)\b/.test(categoryText)) return "bottom";
  if (/\b(top|shirt|blouse|sweater|hoodie|tee|t shirt)\b/.test(categoryText)) return "top";
  return null;
}

function productFacet(
  attributes: Record<string, unknown>,
  names: string[],
  facet: GarmentFacet
): string | null {
  const entries = Object.entries(attributes);
  const values = names.flatMap((name) =>
    entries
      .filter(([key]) =>
        key.toLowerCase().replace(/[^a-z]+/g, "") === name.toLowerCase().replace(/[^a-z]+/g, "")
      )
      .flatMap(([, facetValues]) => {
        if (typeof facetValues === "string") return [facetValues];
        if (!Array.isArray(facetValues)) return [];
        return facetValues.filter((value): value is string => typeof value === "string");
      })
  );
  for (const value of values) {
    const normalized = normalizeGarmentFacet(facet, value);
    if (normalized) return normalized;
  }
  return null;
}

function colorEntries(product: Channel3Product): Array<{ hex: string; percentage: number }> {
  const fromColors = Array.isArray(product.colors)
    ? product.colors.flatMap((entry) => {
        if (!entry || typeof entry !== "object") return [];
        const candidate = entry as { hex?: unknown; percentage?: unknown };
        if (typeof candidate.hex !== "string" || !/^#[\da-f]{6}$/i.test(candidate.hex)) return [];
        return [{
          hex: candidate.hex,
          percentage: typeof candidate.percentage === "number" ? candidate.percentage : 1,
        }];
      })
    : [];
  if (fromColors.length) return fromColors;

  // The documented Product model carries color under structured_attributes,
  // rather than a top-level `colors` array. Convert common labels to sRGB so
  // those documented products can enter Vestige's color-ranking pipeline.
  const colorAttribute = Object.entries(product.structured_attributes).find(([key]) =>
    ["color", "colour", "primary_color", "color_name"].includes(
      key.toLowerCase().replace(/[^a-z]+/g, "_").replace(/^_|_$/g, "")
    )
  )?.[1];
  const labels = typeof colorAttribute === "string"
    ? [colorAttribute]
    : Array.isArray(colorAttribute)
      ? colorAttribute.filter((value): value is string => typeof value === "string")
      : [];
  const namedColors: Record<string, string> = {
    black: "#242424", white: "#f4f1e9", ivory: "#f0ead6", cream: "#e8ddc5",
    beige: "#c8b89d", brown: "#795548", tan: "#b99470", camel: "#b88a5a",
    gray: "#888888", grey: "#888888", charcoal: "#454545", silver: "#aaa9ad",
    red: "#bd3c3c", burgundy: "#722f37", maroon: "#702632", pink: "#d78da0",
    orange: "#d87938", rust: "#a64f32", yellow: "#d9b735", gold: "#b39245",
    green: "#55734d", olive: "#777344", sage: "#9aaa88", teal: "#397c78",
    blue: "#426a9a", navy: "#263b5c", purple: "#76558b", lavender: "#a99ac5",
  };
  for (const label of labels) {
    const normalized = label.trim().toLowerCase();
    if (/^#[\da-f]{6}$/i.test(normalized)) {
      return [{ hex: normalized, percentage: 1 }];
    }
    const match = Object.entries(namedColors).find(([name]) =>
      new RegExp(`\\b${name}\\b`, "i").test(normalized)
    );
    if (match) return [{ hex: match[1], percentage: 1 }];
  }
  return [];
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
    const details = result.error.issues
      .slice(0, 4)
      .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
      .join("; ");
    throw new Channel3CatalogError(
      `Channel3 response validation failed${details ? ` (${details})` : ""}.`,
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
    const imageUrl = image?.cleaned_url ?? image?.url ?? image?.image_url;
    const color = colorEntries(product).sort((first, second) => second.percentage - first.percentage)[0];
    const offer = product.offers.find((candidate) => !candidate.availability || candidate.availability === "InStock");
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
