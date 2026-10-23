import { useCallback, useEffect, useState } from 'react';
import { Builder } from './components/Builder';
import { ResultPage } from './components/ResultPage';

type Route =
  | { name: 'builder'; data?: string }
  | { name: 'result'; data?: string };

function readRoute(): Route {
  const { pathname, search } = window.location;
  const queryData = new URLSearchParams(search).get('d') ?? undefined;
  const historyState = window.history.state as { builderState?: unknown } | null;
  const builderState =
    typeof historyState?.builderState === 'string' ? historyState.builderState : undefined;

  if (pathname === '/s' || pathname.startsWith('/s/')) {
    const raw = pathname.startsWith('/s/') ? pathname.slice(3) : '';
    let data = raw;
    try {
      data = decodeURIComponent(raw);
    } catch {
      data = raw;
    }
    return { name: 'result', data: data || queryData };
  }

  return { name: 'builder', data: builderState ?? queryData };
}

export default function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onPopState = () => setRoute(readRoute());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((path: string) => {
    window.history.pushState(null, '', path);
    setRoute(readRoute());
    window.scrollTo(0, 0);
  }, []);

  if (route.name === 'result') {
    return <ResultPage payload={route.data} navigate={navigate} />;
  }

  return <Builder initialData={route.data} navigate={navigate} />;
}
