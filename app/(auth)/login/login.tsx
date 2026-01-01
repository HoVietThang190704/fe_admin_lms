import Link from 'next/link';
import { BarChart3, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, type InputProps } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

type HighlightCard = {
	title?: string;
	description?: string;
};

type HeroCopy = {
	tagline?: string;
	title?: string;
	description?: string;
	highlights?: HighlightCard[];
	stat?: {
		label?: string;
		value?: string;
		caption?: string;
	};
};

type FormCopy = {
	title?: string;
	subtitle?: string;
	apiPath?: string;
	emailLabel?: string;
	passwordLabel?: string;
	forgotLink?: string;
	submit?: string;
	submitting?: string;
	ctaPrefix?: string;
	ctaLinkText?: string;
	supportEmail?: string;
	forgotSubject?: string;
	showPassword?: string;
	hidePassword?: string;
};

export type LoginViewProps = {
	heroCopy: HeroCopy;
	highlightCards: HighlightCard[];
	heroStat: HeroCopy['stat'];
	formCopy: FormCopy;
	errorMessage?: string | null;
	emailError?: string | null;
	passwordError?: string | null;
	forgotHref: string;
	operationsHref: string;
	isSubmitting: boolean;
	showPassword: boolean;
	onTogglePassword: () => void;
	onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	emailFieldProps: InputProps;
	passwordFieldProps: InputProps;
};

export const LoginView = ({
	heroCopy,
	highlightCards,
	heroStat,
	formCopy,
	errorMessage,
	emailError,
	passwordError,
	forgotHref,
	operationsHref,
	isSubmitting,
	showPassword,
	onTogglePassword,
	onSubmit,
	emailFieldProps,
	passwordFieldProps
}: LoginViewProps) => {
	return (
		<div className="relative min-h-screen overflow-hidden bg-slate-50">
			<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.25),_transparent_60%)]" aria-hidden />

			<div className="relative z-10 flex min-h-screen flex-col lg:flex-row">
				<section className="flex w-full flex-col justify-between bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 px-8 py-10 text-white lg:w-1/2 lg:px-12">
					<div>
						<div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] text-gray-400">
							<ShieldCheck className="h-5 w-5" />
							{heroCopy.tagline ?? 'LMS Admin Suite'}
						</div>
						<h1 className="mt-8 text-4xl font-semibold leading-snug text-white sm:text-5xl">
							{heroCopy.title ?? 'Bring every learning workflow into one command center.'}
						</h1>
						<p className="mt-6 max-w-xl text-base text-gray-300">
							{heroCopy.description ??
								'Data from classes, assignments, support tickets, and notifications converges here so you can keep every experience stable.'}
						</p>
					</div>

					<div className="mt-10 grid gap-6 sm:grid-cols-2">
						{highlightCards.map((item, index) => (
							<div
								key={item.title ? `${item.title}-${index}` : `highlight-${index}`}
								className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur"
							>
								<p className="text-sm font-semibold text-white">{item.title}</p>
								<p className="mt-3 text-sm text-gray-300">{item.description}</p>
							</div>
						))}
						<div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
							<div className="flex items-center gap-3 text-sm font-medium text-emerald-200">
								<BarChart3 className="h-5 w-5" />
								{heroStat?.label ?? 'Live health score'}
							</div>
							<p className="mt-4 text-3xl font-semibold text-white">{heroStat?.value ?? '99.3%'}</p>
							<p className="text-xs text-gray-300">{heroStat?.caption ?? 'System availability this week'}</p>
						</div>
					</div>
				</section>

				<section className="flex w-full items-center justify-center px-6 py-10 lg:w-1/2 lg:px-16">
					<Card className="w-full max-w-md border-gray-100/60 shadow-gray-900/10">
						<CardHeader>
							<CardTitle>{formCopy.title ?? 'Welcome back 👋'}</CardTitle>
							<CardDescription>
								{formCopy.subtitle ?? 'Use your issued admin credentials to connect with'}{' '}
								<span className="font-medium">{formCopy.apiPath ?? '/api/auth/login'}</span>.
							</CardDescription>
						</CardHeader>

						<CardContent>
							{errorMessage ? (
								<Alert variant="danger">
									<AlertDescription>{errorMessage}</AlertDescription>
								</Alert>
							) : null}

							<form className="space-y-6" onSubmit={onSubmit}>
								<div className="space-y-2">
									<Label htmlFor="email">{formCopy.emailLabel ?? 'Admin email'}</Label>
									<div className="relative">
										<Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
										<Input id="email" {...emailFieldProps} />
									</div>
									{emailError ? <p className="text-sm text-red-500">{emailError}</p> : null}
								</div>

								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label htmlFor="password">{formCopy.passwordLabel ?? 'Password'}</Label>
										<Link href={forgotHref} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
											{formCopy.forgotLink ?? 'Forgot password?'}
										</Link>
									</div>
									<div className="relative">
										<Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
										<Input id="password" {...passwordFieldProps} />
										<button
											type="button"
											className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-500 transition hover:text-gray-900"
											onClick={onTogglePassword}
											aria-label={showPassword ? formCopy.hidePassword ?? 'Hide password' : formCopy.showPassword ?? 'Show password'}
										>
											{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
										</button>
									</div>
									{passwordError ? <p className="text-sm text-red-500">{passwordError}</p> : null}
								</div>

								<Button type="submit" disabled={isSubmitting} className="w-full">
									{isSubmitting ? formCopy.submitting ?? 'Verifying...' : formCopy.submit ?? 'Sign in'}
								</Button>
							</form>
						</CardContent>

						<CardFooter>
							<p className="text-center text-sm text-gray-500">
								{formCopy.ctaPrefix ?? 'Need an account?'}{' '}
								<Link href={operationsHref} className="font-semibold text-gray-900">
									{formCopy.ctaLinkText ?? 'Contact operations'}
								</Link>
							</p>
						</CardFooter>
					</Card>
				</section>
			</div>
		</div>
	);
};
