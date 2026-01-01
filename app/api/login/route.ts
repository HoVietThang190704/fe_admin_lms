import { NextRequest } from 'next/server';

import { apiHandlerWithReq } from '@/lib/utils/api-utils';
import { login } from '@/lib/infra/api/modules/auth.api';
import type { LoginPayload } from '@/lib/infra/api/modules/auth.api';

export const POST = apiHandlerWithReq(async (req: NextRequest) => {
	const body = (await req.json()) as LoginPayload;
	return login(body);
});
