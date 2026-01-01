import { NextRequest, NextResponse } from 'next/server';

import { ApiError } from '@/lib/shared/utils/api';
import { HttpStatusCode } from '@/lib/shared/constants/http';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';

const buildSuccessResponse = <T>(result: T, status?: number) => {
  if (result instanceof NextResponse) {
    return result;
  }

  return NextResponse.json(result, {
    status: status ?? HttpStatusCode.OK
  });
};

const handleError = (error: unknown) => {
  const apiError = error as ApiError;

  if (apiError.status === HttpStatusCode.UNAUTHORIZED) {
    return NextResponse.json(
      { message: 'Unauthorized' },
      { status: HttpStatusCode.UNAUTHORIZED }
    );
  }

  return NextResponse.json(
    { message: apiError.message || 'Internal server error' },
    { status: apiError.status || HttpStatusCode.INTERNAL_SERVER_ERROR }
  );
};

export function apiHandler<T>(
  handler: () => Promise<T>,
  options?: { successStatus?: number }
): () => Promise<NextResponse> {
  return async () => {
    try {
      const result = await handler();
      return buildSuccessResponse(result, options?.successStatus);
    } catch (error: unknown) {
      return handleError(error);
    }
  };
}

export function apiHandlerWithReq<T>(
  handler: (req: NextRequest) => Promise<T>,
  options?: { successStatus?: number }
): (req: NextRequest) => Promise<NextResponse> {
  return async (req: NextRequest) => {
    try {
      const result = await handler(req);
      return buildSuccessResponse(result, options?.successStatus);
    } catch (error: unknown) {
      return handleError(error);
    }
  };
}

const REFRESH_TOKEN_EXEMPT_URLS = [
  INTERNAL_API_ENDPOINTS.AUTH.LOGIN,
  INTERNAL_API_ENDPOINTS.AUTH.REGISTER
];

export function shouldSkipTokenRefresh(url: string): boolean {
  return REFRESH_TOKEN_EXEMPT_URLS.some((exemptUrl) => url.includes(exemptUrl));
}
