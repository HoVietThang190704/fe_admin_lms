import { ApiError } from '@/lib/shared/utils/api';

export type BackendFetchOptions = RequestInit & {
  parseJson?: boolean;
};

export const backendFetch = async (url: string, options: BackendFetchOptions = {}) => {
  const { parseJson = false, headers, ...rest } = options;
  const mergedHeaders = new Headers(headers);

  const shouldApplyJsonHeader = typeof rest.body === 'string';
  if (!mergedHeaders.has('Content-Type') && shouldApplyJsonHeader) {
    mergedHeaders.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...rest,
    headers: mergedHeaders,
    cache: 'no-store'
  });

  if (!response.ok) {
    let message = 'Backend request failed';
    try {
      const errorPayload = await response.clone().json();
      message = errorPayload?.message || message;
    } catch {
    }

    throw new ApiError(message, response.status);
  }

  if (parseJson) {
    const json = await response.json();
    return { response, data: json } as const;
  }

  return { response } as const;
};
