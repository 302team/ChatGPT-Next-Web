import Script from "next/script";
import { useMobileScreen } from "../utils";
import { useEffect } from "react";
import { DEMO_HOST, DEMO_HOST_CN } from "../constant";

export function Salesmartly() {
  const isDemo =
    window.location.host.startsWith(DEMO_HOST) ||
    window.location.host.startsWith(DEMO_HOST_CN);

  const isMobileScreen = useMobileScreen();

  useEffect(() => {
    const ssChat = document.getElementById("ss-chat-p");

    if (ssChat) {
      ssChat.style.display = isMobileScreen ? "none" : "";
    }
  }, [isMobileScreen]);

  if (isDemo || isMobileScreen) {
    return null;
  }

  return (
    <Script
      src="https://assets.salesmartly.com/js/project_177_61_1649762323.js"
      strategy="lazyOnload"
    ></Script>
  );
}
