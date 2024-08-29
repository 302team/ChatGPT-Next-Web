"use client";

require("../polyfill");

import { useState, useEffect, useCallback } from "react";

import styles from "./home.module.scss";
import BotIcon from "../icons/bot.svg";
import Logo from "../icons/logo.png";
import LoadingIcon from "../icons/three-dots.svg";
import { getCSSVar, isEmptyObject, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";

import {
  CN_HOST,
  DEMO_HOST,
  DEMO_HOST_CN,
  ModelProvider,
  Path,
  Region,
  SlotID,
} from "../constant";
import { ErrorBoundary } from "./error";

import Locale, { getISOLang, getLang } from "../locales";

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
  Theme,
} from "../store";
import { identifyDefaultClaudeModel } from "../utils/checkers";
import Image from "next/image";
import { Prompt, usePromptStore } from "../store/prompt";
import { ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import enUS from "antd/locale/en_US";
import { Plugin, usePluginStore } from "../store/plugin";
import { useSyncStore } from "../store/sync";
import { Salesmartly } from "./script";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <Image src={Logo.src} width={35} height={35} alt="" />}
      <LoadingIcon />
    </div>
  );
}

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
  // demo.xx.com
  const isDemo =
    window.location.hostname.startsWith(DEMO_HOST) ||
    window.location.hostname.startsWith(DEMO_HOST_CN);

  const location = useLocation();
  const accessStore = useAccessStore();
  const chatStore = useChatStore();
  const config = useAppConfig();
  const syncStore = useSyncStore();
  const isHome = location.pathname === Path.Home;
  const [loading, setLoading] = useState(true);
  const [validPwdVisible, setValidPwdVisible] = useState(true);
  const promptStore = usePromptStore();

  useEffect(() => {
    if (accessStore.apiDomain) {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessStore.apiDomain]);

  function setPromptConfig(prompts: Prompt[]) {
    if (!prompts.length) return;

    promptStore.clean();
    prompts.forEach((prompt) => {
      promptStore.add(prompt);
    });
  }

  const [promptStarters, setPromptStarters] = useState<string[]>([]);

  useEffect(() => {
    if (isDemo) {
      const isCn = window.location.hostname.startsWith(DEMO_HOST_CN);
      config.update((conf) => {
        conf.region = isCn ? 0 : 1;
      });
    }
  }, []);

  if (loading) return <Loading />;

  if (!isDemo && validPwdVisible)
    return (
      <ValidPwdPage
        onAuth={(opt: any) => {
          accessStore.update((access) => (access.isAuth = true));
          const settings = opt.settings;

          config.update((conf) => {
            conf.chatbotInfo = opt.info ?? "";
            conf.isGpts = opt.is_gpts;
            localStorage.setItem("is_gpts", opt.is_gpts);
            conf.useGpts = !!opt.use_gpts;
            conf.openTTS = opt.is_gpts ? true : !!opt.open_tts;
            conf.pluginConfig.enable = !!opt.enable_plugins;

            conf.fileSupportType = opt.file_support_type;
            conf.multimodalType4Models = opt.models_file_support_type || {};
            conf.supportPluginModelList = opt.support_plugin_model_list || [];

            conf.region =
              opt.region == undefined ? Region.Overseas : opt.region;

            if (settings && !isEmptyObject(settings)) {
              if (settings.modelConfig) {
                settings.modelConfig.model = opt.model;
                const _modelConfig = JSON.parse(
                  JSON.stringify(settings.modelConfig),
                );

                if (!isEmptyObject(_modelConfig)) {
                  for (let key in conf.modelConfig) {
                    if (key in _modelConfig) {
                      // @ts-ignore
                      conf.modelConfig[key] = _modelConfig[key];
                    }
                  }

                  chatStore.updateCurrentSession((session) => {
                    if (!session.mask.isStoreModel) {
                      session.mask.modelConfig = conf.modelConfig;
                      session.mask.syncGlobalConfig = true;
                    }
                  }); // delete settings.modelConfig;
                }
              }

              if (settings.kbConfig && !isEmptyObject(settings.kbConfig)) {
                for (let key in conf.kbConfig) {
                  if (key in settings.kbConfig) {
                    // @ts-ignore
                    conf.kbConfig[key] = settings.kbConfig[key];
                  }
                }
              }

              if (settings.prompts) {
                setPromptConfig(settings.prompts);
                // delete settings.prompts;
              }

              for (let key in settings) {
                if (key === "modelConfig") continue;
                // @ts-ignore
                conf[key] = settings[key];
              }
              if (settings.chatbotName) {
                let title = settings.chatbotName;
                if (title === "302.AI") {
                  title = Locale.Config.title;
                }
                document.title = title;
              }
            } else {
              // Baichuan开头的模型 frequency_penalty自动改为1
              if (opt.model.toLocaleLowerCase().includes("baichuan")) {
                config.update((c) => (c.modelConfig.frequency_penalty = 1));
              }
            }
          });

          if (settings && settings.showSync != undefined) {
            syncStore.update((state) => {
              state.enable = settings.showSync;
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
          <Route
            path={Path.Home}
            element={<Chat promptStarters={promptStarters} />}
          />
          <Route path={Path.NewChat} element={<NewChat />} />
          {/* <Route path={Path.Masks} element={<MaskPage />} /> */}
          <Route
            path={Path.Chat}
            element={<Chat promptStarters={promptStarters} />}
          />
          {/* <Route path={Path.Settings} element={<Settings />} /> */}
        </Routes>
      </div>
    </>
  );
}

function Screen() {
  const config = useAppConfig();
  const location = useLocation();
  // const isHome = location.pathname === Path.Home;
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

export function Home() {
  const [langLoading, setLangLoading] = useState(false);
  const config = useAppConfig();

  useSwitchTheme();
  // useLoadData();
  useHtmlLang();

  useEffect(() => {
    document.title = Locale.Config.title;
    document.body.classList.add("light");
    console.log("[Config] got config from build time", getClientConfig());
    useAccessStore.getState().fetch();
  }, []);

  const [defaultTheme, setDefaultTheme] = useState("");
  useEffect(() => {
    const themeMedia = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    setDefaultTheme(themeMedia ? Theme.Dark : Theme.Light);
  }, []);

  const hasHydrated = !useHasHydrated();

  if (hasHydrated) {
    return <Loading />;
  }

  if (langLoading) {
    return <Loading />;
  }

  const lang = getLang();

  return (
    <>
      <ErrorBoundary>
        <ConfigProvider
          locale={lang === "cn" ? zhCN : enUS}
          theme={{
            algorithm:
              config.theme === Theme.Auto
                ? defaultTheme === Theme.Dark
                  ? theme.darkAlgorithm
                  : theme.defaultAlgorithm
                : config.theme === Theme.Dark
                  ? theme.darkAlgorithm
                  : theme.defaultAlgorithm,
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
