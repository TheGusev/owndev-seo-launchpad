import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

/**
 * Заглушка для удалённых страниц: ставит noindex+canonical и редиректит на /tools.
 * Используется для URL, которые могли попасть в индекс поисковиков.
 */
export default function RedirectGone({ to = '/tools' }: { to?: string }) {
  return (
    <>
      <Helmet>
        <title>Страница удалена — OWNDEV</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`https://owndev.ru${to}`} />
      </Helmet>
      <Navigate to={to} replace />
    </>
  );
}
