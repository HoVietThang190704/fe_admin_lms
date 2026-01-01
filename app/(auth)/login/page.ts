import type { Metadata } from 'next';

import { LoginScreen } from './login';
import { DEFAULT_LOCALE, getMessages } from '@/lib/i18n';

const dictionary = getMessages(DEFAULT_LOCALE);
const loginMeta = dictionary?.login?.meta;

export const metadata: Metadata = {
	title: loginMeta?.title ?? 'Admin Login | LMS',
	description:
		loginMeta?.description ?? 'Control the LMS ecosystem from a single admin console.'
};

export default function LoginPage() {
	return <LoginScreen />;
}
