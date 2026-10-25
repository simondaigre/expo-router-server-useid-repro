import { useEffect, useId, useState } from 'react';

// A label tied to its input by `useId`, as accessible form components (and libraries such as Radix) do.
export default function Index() {
  const id = useId();
  const [found, setFound] = useState<boolean>();

  // Once hydrated, looks for the input by the id React gave it in the browser.
  useEffect(() => {
    setFound(document.getElementById(id) !== null);
  }, [id]);

  return (
    <main>
      <label htmlFor={id}>Name</label>
      <input id={id} />
      <p id="result">
        {found === undefined ? 'Hydrating…' : `Browser id "${id}": ${found ? 'found in the page' : 'not in the page'}`}
      </p>
    </main>
  );
}
