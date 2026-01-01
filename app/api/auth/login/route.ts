import { NextRequest, NextResponse } from 'next/server';

import { login } from '@/lib/infra/api/modules/auth.api';
import type { LoginPayload } from '@/lib/infra/api/modules/auth.api';
import { apiHandlerWithReq } from '@/lib/utils/api-utils';

const ACCESS_TOKEN_COOKIE = 'lmsAccessToken';
const REFRESH_TOKEN_COOKIE = 'lmsRefreshToken';
const TWO_HOURS = 60 * 60 * 2;
const THIRTY_DAYS = 60 * 60 * 24 * 30;
const isProduction = process.env.NODE_ENV === 'production';

type LoginRequestBody = LoginPayload & { rememberMe?: boolean };

export const POST = apiHandlerWithReq(async (req: NextRequest) => {
  const body = (await req.json()) as Partial<LoginRequestBody>;
  const email = body?.email?.trim();
  const password = body?.password;

  if (!email || !password) {
    return NextResponse.json(
      {
        success: false,
        message: 'Email và mật khẩu là bắt buộc'
      },
      { status: 400 }
    );
  }

  const result = await login({ email, password });

  const response = NextResponse.json(result, { status: 200 });

  const accessTokenTtl = body?.rememberMe ? THIRTY_DAYS : TWO_HOURS;
  const refreshTokenTtl = THIRTY_DAYS;

  response.cookies.set(ACCESS_TOKEN_COOKIE, result.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: accessTokenTtl
  });

  response.cookies.set(REFRESH_TOKEN_COOKIE, result.refreshToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: refreshTokenTtl
  });

  return response;
});
