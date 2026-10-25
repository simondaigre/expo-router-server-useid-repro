import { Suspense, use, useEffect, useId, useState } from 'react';

// On the server, the content arrives 500 ms after the shell, as a streamed Suspense boundary.
// In the browser, the same value is there at once.
let serverValue: Promise<string> | undefined;
const browserValue = Promise.resolve('Loaded');
function getValue() {
  if (typeof window !== 'undefined') return browserValue;
  serverValue ??= new Promise((resolve) => setTimeout(() => resolve('Loaded'), 500));
  return serverValue;
}

function Slow() {
  const value = use(getValue());
  const id = useId();
  const [found, setFound] = useState<boolean>();
  useEffect(() => {
    setFound(document.getElementById(id) !== null);
  }, [id]);
  return (
    <p id={id} data-testid="slow">
      {found === undefined ? `${value}, hydrating…` : `${value}, browser id "${id}": ${found ? 'found in the page' : 'not in the page'}`}
    </p>
  );
}

export default function SlowPage() {
  serverValue = undefined;
  return (
    <main>
      <Suspense fallback={<p data-testid="slow">Loading…</p>}>
        <Slow />
      </Suspense>
    </main>
  );
}
