"use client";

require("../polyfill");

import { useState, useEffect } from "react";

import styles from "./home.module.scss";
import BotIcon from "../icons/bot.svg";
import Logo from "../icons/logo.png";
import LoadingIcon from "../icons/three-dots.svg";
import { getCSSVar, isEmptyObject, useMobileScreen } from "../utils";

import dynamic from "next/dynamic";

import { ModelProvider, Path, SlotID } from "../constant";
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
} from "../store";
import Image from "next/image";
import { Prompt, usePromptStore } from "../store/prompt";
import { shouldOverwriteModel } from "./valid-pwd";

export function Loading(props: { noLogo?: boolean }) {
  return (
    <div className={styles["loading-content"] + " no-dark"}>
      {!props.noLogo && <Image src={Logo.src} width={35} height={35} alt="" />}
      <LoadingIcon />
    </div>
  );
}

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
});

const Chat = dynamic(async () => (await import("./chat")).Chat, {
  loading: () => <Loading noLogo />,
});

const NewChat = dynamic(async () => (await import("./new-chat")).NewChat, {
  loading: () => <Loading noLogo />,
});

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

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
  const config = useAppConfig();
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
  function setModelConfig(modelConfig: any) {
    console.log("🚀 ~ setModelConfig ~ modelConfig:", modelConfig);
    // 空对象
    if (isEmptyObject(modelConfig)) return;
    let modelConf: any = {};
    for (let key in modelConfig) {
      modelConf[key] = modelConfig[key];
    }
    config.update((config) => (config.modelConfig = modelConf));
    chatStore.updateCurrentSession((session) => {
      if (shouldOverwriteModel(session.mask.modelConfig.model)) {
        session.mask.modelConfig = modelConf;
        session.mask.syncGlobalConfig = true;
      }
    });
  }

  const [promptStarters, setPromptStarters] = useState<string[]>([]);

  if (loading) return <Loading />;

  if (validPwdVisible)
    return (
      <ValidPwdPage
        onAuth={(opt: any) => {
          accessStore.update((access) => (access.isAuth = true));
          config.update((conf) => {
            conf.chatbotInfo = opt.info ?? "";
            conf.isGpts = opt.is_gpts;

            const settings = opt.settings;
            console.warn(
              "🚀 ~ config.update ~ isEmptyObject(settings):",
              isEmptyObject(settings),
              settings,
            );

            if (settings && !isEmptyObject(settings)) {
              if (settings.modelConfig) {
                settings.modelConfig.model = opt.model;
                setModelConfig(settings.modelConfig);
                // delete settings.modelConfig;
              }

              if (settings.prompts) {
                setPromptConfig(settings.prompts);
                // delete settings.prompts;
              }

              for (let key in settings) {
                conf[key as keyof ChatbotSetting] =
                  settings[key as keyof ChatbotSetting];
              }
              if (settings.chatbotName) {
                document.title = settings.chatbotName;
              }
            }
          });

          // 设置模型的 promptStarters
          if (opt.is_gpts && opt.gpts_msg && opt.gpts_msg.prompt_starters) {
            setPromptStarters(opt.gpts_msg.prompt_starters);
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
          <Route path={Path.Masks} element={<MaskPage />} />
          <Route
            path={Path.Chat}
            element={<Chat promptStarters={promptStarters} />}
          />
          <Route path={Path.Settings} element={<Settings />} />
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

  useEffect(() => {
    loadAsyncGoogleFont();
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

  return (
    <ErrorBoundary>
      <Router>
        <Screen />
      </Router>
    </ErrorBoundary>
  );
}
