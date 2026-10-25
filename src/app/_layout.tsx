import { Slot } from 'expo-router';

export default function RootLayout() {
  return (
    <>
      {/* React 19 hoists these into the document's <head>. */}
      <title>useId repro</title>
      <meta name="description" content="Expo Router useId hydration repro" />
      <Slot />
    </>
  );
}
