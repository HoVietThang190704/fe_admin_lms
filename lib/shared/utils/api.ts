export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

export const getErrorMessage = (error: unknown, fallback = 'Đã xảy ra lỗi bất ngờ') => {
  if (typeof error === 'string') {
    return error;
  }

  if (isApiError(error)) {
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
};

export type ApiErrorPayload = {
  message?: string;
  [key: string]: unknown;
} | null;

export const parseApiErrorPayload = async (response: Response): Promise<ApiErrorPayload> => {
  try {
    const data = (await response.clone().json()) as Record<string, unknown> | null;
    if (data && typeof data === 'object') {
      return data as ApiErrorPayload;
    }
  } catch {
    // Ignore error and fall through to null return
  }

  return null;
};
