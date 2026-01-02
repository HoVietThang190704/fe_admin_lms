import { NextResponse } from 'next/server';

import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { backendFetch } from '@/lib/infra/httpClient';
import { INTERNAL_API_ENDPOINTS } from '@/lib/shared/constants/endpoints';
import { buildApiUrl } from '@/lib/utils/env';

const isProduction = process.env.NODE_ENV === 'production';

const clearAuthCookies = (response: NextResponse) => {
  response.cookies.set('lmsAccessToken', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 0
  });
  response.cookies.set('lmsRefreshToken', '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 0
  });
};

export const POST = apiHandlerWithReq(async (req) => {
  const accessToken = req.cookies.get('lmsAccessToken')?.value;
  const headers = new Headers();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  try {
    await backendFetch(buildApiUrl(INTERNAL_API_ENDPOINTS.AUTH.LOGOUT), {
      method: 'POST',
      headers,
      parseJson: true
    });
  } catch {
    // Ignore backend errors to ensure client-side logout always succeeds
  }

  const response = NextResponse.json({ success: true, message: 'Logged out' }, { status: 200 });
  clearAuthCookies(response);
  return response;
});
