"use client";

require("../polyfill");

import { useState, useEffect, useCallback } from "react";

import styles from "./home.module.scss";
import BotIcon from "../icons/bot.svg";
import Logo from "../icons/logo.png";
import LoadingIcon from "../icons/three-dots.svg";
import { getCSSVar, isEmptyObject, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";

import { ModelProvider, Path, Region, SlotID } from "../constant";
import { ErrorBoundary } from "./error";

import { getISOLang, getLang } from "../locales";

import {
  HashRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { SideBar } from "./sidebar";
import { useAppConfig } from "../store/config";
import { AuthPage } from "./auth";
import { getClientConfig } from "../config/client";
import { ClientApi } from "../client/api";
import {
  ModelConfig,
  ChatbotSetting,
  useAccessStore,
  useChatStore,
  ModelType,
  BOT_HELLO,
  Model,
} from "../store";
import Image from "next/image";
import { Prompt, usePromptStore } from "../store/prompt";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import { Plugin, usePluginStore } from "../store/plugin";
import { Salesmartly } from "./script";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <Image src={Logo.src} width={35} height={35} alt="" />}
      <LoadingIcon />
    </div>
  );
}

const Artifacts = dynamic(async () => (await import("./artifacts")).Artifacts, {
  loading: () => <Loading noLogo />,
});

// const Settings = dynamic(async () => (await import("./settings")).Settings, {
//   loading: () => <Loading noLogo />,
// });

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

// const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
//   loading: () => <Loading noLogo />,
// });

const ValidPwdPage = dynamic(
  async () => (await import("./valid-pwd")).ValidPwd,
  {
    loading: () => <Loading noLogo />,
  },
);

export function useSwitchTheme() {
  const config = useAppConfig();

  useEffect(() => {
    document.body.classList.remove("light");
    document.body.classList.remove("dark");

    if (config.theme === "dark") {
      document.body.classList.add("dark");
    } else if (config.theme === "light") {
      document.body.classList.add("light");
    }

    const metaDescriptionDark = document.querySelector(
      'meta[name="theme-color"][media*="dark"]',
    );
    const metaDescriptionLight = document.querySelector(
      'meta[name="theme-color"][media*="light"]',
    );

    if (config.theme === "auto") {
      metaDescriptionDark?.setAttribute("content", "#151515");
      metaDescriptionLight?.setAttribute("content", "#fafafa");
    } else {
      const themeColor = getCSSVar("--theme-color");
      metaDescriptionDark?.setAttribute("content", themeColor);
      metaDescriptionLight?.setAttribute("content", themeColor);
    }
  }, [config.theme]);
}

function useHtmlLang() {
  useEffect(() => {
    const lang = getISOLang();
    const htmlLang = document.documentElement.lang;

    if (lang !== htmlLang) {
      document.documentElement.lang = lang;
    }
  }, []);
}

const useHasHydrated = () => {
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
};

const loadAsyncGoogleFont = () => {
  const linkEl = document.createElement("link");
  const proxyFontUrl = "/google-fonts";
  const remoteFontUrl = "https://fonts.googleapis.com";
  const googleFontUrl =
    getClientConfig()?.buildMode === "export" ? remoteFontUrl : proxyFontUrl;
  linkEl.rel = "stylesheet";
  linkEl.href =
    googleFontUrl +
    "/css2?family=" +
    encodeURIComponent("Noto Sans:wght@300;400;700;900") +
    "&display=swap";
  document.head.appendChild(linkEl);
};

function ChatWindow() {
  const location = useLocation();
  const accessStore = useAccessStore();
  const chatStore = useChatStore();
  const appConfig = useAppConfig();
  const isHome = location.pathname === Path.Home;
  const [loading, setLoading] = useState(true);
  const [validPwdVisible, setValidPwdVisible] = useState(true);

  useEffect(() => {
    if (accessStore.apiDomain) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessStore.apiDomain]);

  if (loading) return <Loading />;

  if (validPwdVisible)
    return (
      <ValidPwdPage
        onAuth={(opt: any) => {
          accessStore.update((access) => (access.isAuth = true));
          appConfig.update((config) => {
            config.chatbotInfo = opt.info ?? "";

            config.fileSupportType = opt.file_support_type;
            config.multimodalType4Models = opt.models_file_support_type || {};
            config.supportPluginModelList = opt.support_plugin_model_list || [];

            config.region =
              opt.region == undefined ? Region.Overseas : opt.region;
          });

          // chatStore.resetSession();

          // 模型竞技场的模型
          if (opt.zero_shot) {
            const models = opt.zero_shot as Model[];
            appConfig.update((config) => {
              config.modelList = models.map((m) => {
                m.enable = false;
                m.disabled = false;
                if (!m.model_type && !m.en_model_type) {
                  m.model_type = "其他";
                  m.en_model_type = "Other";
                }
                return m;
              });
            });
          }

          setValidPwdVisible(false);
        }}
      />
    );

  return (
    <>
      <SideBar className={isHome ? styles["sidebar-show"] : ""} />

      <div className={styles["window-content"]} id={SlotID.AppBody}>
        <Routes>
          <Route path={Path.Home} element={<Chat />} />
          <Route path={Path.NewChat} element={<NewChat />} />
          <Route path={Path.Chat} element={<Chat />} />
        </Routes>
      </div>
    </>
  );
}

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  const isArtifact = location.pathname.includes(Path.Artifacts);
  const isAuth = location.pathname === Path.Auth;
  const isMobileScreen = useMobileScreen();
  const shouldTightBorder =
    getClientConfig()?.isApp || (config.tightBorder && !isMobileScreen);

  const [windowHeight, setWindowHeight] = useState<number>();

  useEffect(() => {
    loadAsyncGoogleFont();
  }, []);

  useEffect(() => {
    const h = document.body.clientHeight;
    setWindowHeight(h);
  }, []);

  if (isArtifact) {
    return (
      <Routes>
        <Route path="/artifacts/:id" element={<Artifacts />} />
      </Routes>
    );
  }

  return (
    <>
      <div
        className={
          styles.container +
          ` ${
            shouldTightBorder ? styles["tight-container"] : styles.container
          } ${getLang() === "ar" ? styles["rtl-screen"] : ""}`
        }
        style={{
          // @ts-ignore
          "--client-window-height": `${windowHeight}px`,
        }}
      >
        {isAuth ? (
          <>
            <AuthPage />
          </>
        ) : (
          <ChatWindow />
        )}
      </div>
    </>
  );
}

export function useLoadData() {
  const config = useAppConfig();

  var api: ClientApi;
  if (config.modelConfig.model.startsWith("gemini")) {
    api = new ClientApi(ModelProvider.GeminiPro);
  } else if (config.modelConfig.model.startsWith("claude")) {
    api = new ClientApi(ModelProvider.Claude);
  } else {
    api = new ClientApi(ModelProvider.GPT);
  }
  useEffect(() => {
    (async () => {
      const models = await api.llm.models();
      config.mergeModels(models);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function Home() {
  useSwitchTheme();
  useLoadData();
  useHtmlLang();

  useEffect(() => {
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();
  }, []);

  if (!useHasHydrated()) {
    return <Loading />;
  }

  const lang = getLang();

  return (
    <>
      <ErrorBoundary>
        <ConfigProvider
          locale={lang === "cn" ? zhCN : enUS}
          theme={{
            token: {
              colorPrimary: "#8e47f0",
            },
          }}
        >
          <Router>
            <Screen />
          </Router>
        </ConfigProvider>
      </ErrorBoundary>

      <Salesmartly />
    </>
  );
}
