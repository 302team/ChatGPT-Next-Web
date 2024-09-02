/* eslint-disable @next/next/no-page-custom-font */
import "./styles/globals.scss";
import "./styles/markdown.scss";
import "./styles/highlight.scss";
import { getClientConfig } from "./config/client";
import { type Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getServerSideConfig } from "./config/server";
import { GoogleTagManager } from "@next/third-parties/google";
const serverConfig = getServerSideConfig();
import Locale from "./locales";
import Script from "next/script";

export const metadata: Metadata = {
  title: Locale.Config.title,
  description: Locale.Sidebar.Description,
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#151515" },
  ],
  appleWebApp: {
    title: Locale.Config.title,
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="config" content={JSON.stringify(getClientConfig())} />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <Script id="lang-js" strategy="beforeInteractive">
          {`console.log('[lang] init');const langCodeMap={"zh-CN":"cn","en-US":"en","pt-BR":"pt","zh-TW":"tw","ja-JP":"jp","ko-KR":"ko","id-ID":"id","fr-FR":"fr","es-ES":"es","it-IT":"it","tr-TR":"tr","de-DE":"de","vi-VN":"vi","ru-RU":"ru","cs-CZ":"cs","no-NO":"no","ar-SA":"ar","bn-BD":"bn","sk-SK":"sk"};try{let n=window.location.hash;if(n.includes("lang=")){const t=n.split("?").pop()?.split("&").find((n=>n.includes("lang")));if(t){const n=t.split("=")[1];localStorage.setItem("lang",langCodeMap[n]??"en")}}}catch(n){};console.log('[lang] inited');`}
        </Script>
        <link rel="manifest" href="/site.webmanifest"></link>
        <script src="/serviceWorkerRegister.js" defer></script>
      </head>
      <body>
        {children}
        {serverConfig?.isVercel && (
          <>
            <SpeedInsights />
          </>
        )}
        {serverConfig?.gtmId && (
          <>
            <GoogleTagManager gtmId={serverConfig.gtmId} />
          </>
        )}
      </body>
    </html>
  );
}
