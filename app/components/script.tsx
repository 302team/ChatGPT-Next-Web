import Script from "next/script";
import { useMobileScreen } from "../utils";
import { useEffect } from "react";

export function Salesmartly() {
  const isMobileScreen = useMobileScreen();

  useEffect(() => {
    const ssChat = document.getElementById("ss-chat-p");

    if (ssChat) {
      ssChat.style.display = isMobileScreen ? "none" : "";
    }
  }, [isMobileScreen]);

  if (isMobileScreen) {
    return null;
  }

  return (
    <Script
      src="https://assets.salesmartly.com/js/project_177_61_1649762323.js"
      strategy="lazyOnload"
    ></Script>
  );
}
