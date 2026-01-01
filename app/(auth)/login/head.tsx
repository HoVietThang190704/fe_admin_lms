import { DEFAULT_LOCALE, getMessages } from '@/lib/i18n';

export default function Head() {
  const dictionary = getMessages(DEFAULT_LOCALE);
  const meta = dictionary?.login?.meta ?? {};

  const title = meta.title ?? 'Admin Login | LMS';
  const description = meta.description ?? 'Control the LMS ecosystem from a single admin console.';

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
    </>
  );
}
