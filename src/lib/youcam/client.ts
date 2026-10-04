const DEFAULT_API_URL = "https://yce-api-01.makeupar.com";

interface ApiResponse<T> {
  status?: number;
  error?: string;
  error_code?: string;
  data?: T;
}

interface UploadResponse {
  files?: Array<{
    file_id?: string;
    requests?: Array<{
      method: string;
      url: string;
      headers?: Record<string, string>;
    }>;
  }>;
}

export interface YouCamTaskResult {
  task_status?: "running" | "success" | "error";
  error?: string;
  error_message?: string;
  results?: Record<string, unknown>;
}

export class YouCamApiError extends Error {
  constructor(
    message: string,
    public statusCode = 500
  ) {
    super(message);
    this.name = "YouCamApiError";
  }
}

function getConfig() {
  const apiKey = process.env.YOUCAM_API_KEY;
  if (!apiKey) {
    throw new YouCamApiError("YouCam API is not configured", 503);
  }

  const baseUrl = (process.env.YOUCAM_API_BASE_URL || DEFAULT_API_URL).replace(/\/$/, "");
  return { apiKey, baseUrl };
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const { apiKey, baseUrl } = getConfig();
  const response = await fetch(`${baseUrl}/s2s/v2.0${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  const text = await response.text();
  let payload: ApiResponse<T>;
  try {
    payload = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new YouCamApiError(
      `YouCam API returned an unreadable response (${response.status})`,
      response.status
    );
  }

  if (!response.ok || (payload.status !== undefined && payload.status >= 400)) {
    throw new YouCamApiError(
      payload.error_code
        ? `${payload.error ?? "YouCam API request failed"} (${payload.error_code})`
        : payload.error ?? `YouCam API request failed (${response.status})`,
      response.status
    );
  }

  return payload;
}

export async function uploadYouCamImage(
  image: Buffer,
  contentType: "image/jpeg" | "image/png"
): Promise<string> {
  const extension = contentType === "image/png" ? "png" : "jpg";
  const response = await apiRequest<UploadResponse>("/file", {
    method: "POST",
    body: JSON.stringify({
      files: [
        {
          content_type: contentType,
          file_name: `vestige-${Date.now()}.${extension}`,
          file_size: image.byteLength,
        },
      ],
    }),
  });

  const file = response.data?.files?.[0];
  const uploadRequest = file?.requests?.find((request) => request.method === "PUT");
  if (!file?.file_id || !uploadRequest) {
    throw new YouCamApiError("YouCam did not provide an image upload destination");
  }

  const uploadResponse = await fetch(uploadRequest.url, {
    method: uploadRequest.method,
    headers: uploadRequest.headers,
    body: image,
  });
  if (!uploadResponse.ok) {
    throw new YouCamApiError(
      `YouCam image upload failed (${uploadResponse.status})`,
      uploadResponse.status
    );
  }

  return file.file_id;
}

export async function createYouCamTask(
  path: string,
  body: Record<string, unknown>
): Promise<string> {
  const response = await apiRequest<{ task_id?: string }>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const taskId = response.data?.task_id;
  if (!taskId) {
    throw new YouCamApiError("YouCam did not return a task ID");
  }
  return taskId;
}

export async function waitForYouCamTask(
  path: string,
  taskId: string,
  timeoutMs: number
): Promise<YouCamTaskResult> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await apiRequest<YouCamTaskResult>(
      `${path}/${encodeURIComponent(taskId)}`
    );
    const result = response.data;

    if (result?.task_status === "success") return result;
    if (result?.task_status === "error") {
      throw new YouCamApiError(
        result.error_message ?? result.error ?? "YouCam task failed",
        422
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  throw new YouCamApiError("YouCam task timed out", 504);
}