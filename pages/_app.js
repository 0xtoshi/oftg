import "@/styles/globals.css";
import { NextUIProvider } from "@nextui-org/react";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
export default function App({ Component, pageProps }) {
  return (
    <>
      <NextUIProvider>
        <NextThemesProvider attribute="class" defaultTheme="dark">
          <Component {...pageProps} />
          <Analytics />
        </NextThemesProvider>
      </NextUIProvider>
    </>
  );
}
