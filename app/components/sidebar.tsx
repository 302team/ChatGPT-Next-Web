import { useEffect, useRef, useMemo, useState } from "react";

import styles from "./home.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import QuestionIcon from "../icons/question.svg";
import GithubIcon from "../icons/github.svg";
import ChatGptIcon from "../icons/logo.png";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import DeleteIcon from "../icons/delete.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import DragIcon from "../icons/drag.svg";
import NextImage from "next/image";
import BotIconDark from "../icons/logo-horizontal-dark.png";

import Locale from "../locales";

import { useAppConfig, useChatStore } from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  GPT302_WEBSITE_URL,
  GPTS302_WEBSITE_URL,
  LOGO_BASE64_ICON,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
} from "../constant";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { isIOS, openWindow, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { Modal, showConfirm, showToast } from "./ui-lib";
import { DEFAULT_MASK_AVATAR, Mask, createEmptyMask } from "../store/mask";

import { Spin, Result, Button } from "antd";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

function useHotKey() {
  const chatStore = useChatStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey) {
        if (e.key === "ArrowUp") {
          chatStore.nextSession(-1);
        } else if (e.key === "ArrowDown") {
          chatStore.nextSession(1);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });
}

function useDragSideBar() {
  const limit = (x: number) => Math.min(MAX_SIDEBAR_WIDTH, x);

  const config = useAppConfig();
  const startX = useRef(0);
  const startDragWidth = useRef(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
  const lastUpdateTime = useRef(Date.now());

  const toggleSideBar = () => {
    config.update((config) => {
      if (config.sidebarWidth < MIN_SIDEBAR_WIDTH) {
        config.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
      } else {
        config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
      }
    });
  };

  const onDragStart = (e: MouseEvent) => {
    // Remembers the initial width each time the mouse is pressed
    startX.current = e.clientX;
    startDragWidth.current = config.sidebarWidth;
    const dragStartTime = Date.now();

    const handleDragMove = (e: MouseEvent) => {
      if (Date.now() < lastUpdateTime.current + 20) {
        return;
      }
      lastUpdateTime.current = Date.now();
      const d = e.clientX - startX.current;
      const nextWidth = limit(startDragWidth.current + d);
      config.update((config) => {
        if (nextWidth < MIN_SIDEBAR_WIDTH) {
          config.sidebarWidth = NARROW_SIDEBAR_WIDTH;
        } else {
          config.sidebarWidth = nextWidth;
        }
      });
    };

    const handleDragEnd = () => {
      // In useRef the data is non-responsive, so `config.sidebarWidth` can't get the dynamic sidebarWidth
      window.removeEventListener("pointermove", handleDragMove);
      window.removeEventListener("pointerup", handleDragEnd);

      // if user click the drag icon, should toggle the sidebar
      const shouldFireClick = Date.now() - dragStartTime < 300;
      if (shouldFireClick) {
        toggleSideBar();
      }
    };

    window.addEventListener("pointermove", handleDragMove);
    window.addEventListener("pointerup", handleDragEnd);
  };

  const isMobileScreen = useMobileScreen();
  const shouldNarrow =
    !isMobileScreen && config.sidebarWidth < MIN_SIDEBAR_WIDTH;

  useEffect(() => {
    const barWidth = shouldNarrow
      ? NARROW_SIDEBAR_WIDTH
      : limit(config.sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH);
    const sideBarWidth = isMobileScreen ? "100vw" : `${barWidth}px`;
    document.documentElement.style.setProperty("--sidebar-width", sideBarWidth);
  }, [config.sidebarWidth, isMobileScreen, shouldNarrow]);

  return {
    onDragStart,
    shouldNarrow,
  };
}

function AppDescription(props: { onClose: () => void }) {
  const config = useAppConfig();

  return (
    <div className="modal-mask app-desc-modal">
      <Modal
        title={Locale.Config.AppDescTitle}
        subtitle={Locale.Config.AppDescSubTitle}
        onClose={() => props.onClose()}
      >
        <div dangerouslySetInnerHTML={{ __html: config.chatbotInfo }}></div>
      </Modal>
    </div>
  );
}

export function useWindowSize() {
  // 第一步：声明能够体现视口大小变化的状态
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // 第二步：通过生命周期 Hook 声明回调的绑定和解绑逻辑
  useEffect(() => {
    const updateSize = () =>
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return windowSize;
}

function useGptsConfigMessage(props: { callback: (data?: any) => void }) {
  const [gptsModel, setGptsModel] = useState();
  const chatStore = useChatStore();
  const config = useAppConfig();

  useEffect(() => {
    const messageListener = (e: any) => {
      console.log("🚀 ~ messageListener ~ e:", e.data);
      const res = e.data;
      if (res) {
        if (res.from === "auth" && res.data) {
          const data = res.data;
          setGptsModel({
            ...data,
            code: data.id,
          });

          const emptyMask = createEmptyMask();

          let promptStarters: string[] = [];
          try {
            if (data.detail) {
              promptStarters = JSON.parse(data.detail);
            }
          } catch (error) {}

          chatStore.newSession(
            {
              ...emptyMask,
              syncGlobalConfig: false,
              avatar: data.display_url ?? DEFAULT_MASK_AVATAR,
              name: `${Locale.GPTs.PrefixName} ${data.display_name}`,
              botHelloContent: data.description || emptyMask.botHelloContent,
              hideContext: true,
              modelConfig: {
                ...config.modelConfig,
                model: `gpt-4-gizmo-${data.uuid}`,
              },
              modelName: data.display_name,
              promptStarters,
            } as Mask,
            true,
          );

          props?.callback?.(data);
        }
      }
    };

    window.addEventListener("message", messageListener);
    return () => window.removeEventListener("resize", messageListener);
  }, []);

  return {
    gptsModel,
    setGptsModel,
  };
}

export function GptsConfigModel(props: {
  style?: React.CSSProperties;
  onClose: () => void;
}) {
  const windowSize = useWindowSize();
  const [spinning, setSpinning] = useState(true);
  const [error, setError] = useState(false);
  const [iframeSrc, setIframeSrc] = useState(GPTS302_WEBSITE_URL);

  return (
    <div className="modal-mask" style={props.style}>
      <Modal
        title={Locale.GPTs.Modal.Title}
        containerClass="gpts-selector"
        onClose={() => props.onClose()}
      >
        <Spin spinning={spinning} className="gpts-selector-spin">
          {error ? (
            <Result
              status="500"
              subTitle={Locale.Error.PageOpenError}
              extra={
                <Button
                  key="retry"
                  onClick={() => {
                    setIframeSrc("about:blank");
                    setError(false);
                    setSpinning(true);
                    setIframeSrc(GPTS302_WEBSITE_URL);
                  }}
                >
                  {Locale.Error.Action.Retry}
                </Button>
              }
            />
          ) : (
            <iframe
              width="100%"
              frameBorder={0}
              height={windowSize.height * 0.7}
              src={iframeSrc}
              title={Locale.GPTs.Modal.Title}
              onLoad={() => {
                setError(false);
                setSpinning(false);
              }}
              onError={() => {
                setError(true);
                setSpinning(false);
              }}
            ></iframe>
          )}
        </Spin>
      </Modal>
    </div>
  );
}

export function SideBar(props: { className?: string }) {
  const chatStore = useChatStore();
  const [showAppDescModal, setShowAppDescModal] = useState(false);
  const [showGptsConfigModal, setShowGptsConfigModal] = useState(false);

  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const navigate = useNavigate();
  const location = useLocation();
  const config = useAppConfig();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );

  useGptsConfigMessage({
    callback(data: any) {
      setShowGptsConfigModal(false);
      if (isMobileScreen) {
        navigate(Path.Chat + location.search);
      }
    },
  });

  useHotKey();

  return (
    <div
      className={`${styles.sidebar} ${props.className} ${
        shouldNarrow && styles["narrow-sidebar"]
      }`}
      style={{
        // #3016 disable transition on ios mobile screen
        transition: isMobileScreen && isIOSMobile ? "none" : undefined,
      }}
    >
      <div className={styles["sidebar-header"]} data-tauri-drag-region>
        <div className={styles["sidebar-title"]} data-tauri-drag-region>
          {config.chatbotName || "GPT302"}
        </div>
        <div className={styles["sidebar-sub-title"]}>
          {config.chatbotDesc || Locale.Config.description}
        </div>
        <div className={styles["sidebar-logo"] + " no-dark"}>
          {config.chatbotLogo && (
            <img
              src={config.chatbotLogo}
              alt="LOGO"
              onClick={() => openWindow(GPT302_WEBSITE_URL)}
            />
          )}
          {!config.chatbotLogo && (
            <NextImage
              src={ChatGptIcon.src}
              alt="logo"
              height={50}
              width={50}
              onClick={() => openWindow(GPT302_WEBSITE_URL)}
            />
          )}
        </div>
      </div>

      {!config.isGpts && (
        <div className={styles["sidebar-header-bar"]}>
          <IconButton
            icon={<MaskIcon />}
            text={shouldNarrow ? undefined : Locale.Mask.Name}
            className={styles["sidebar-bar-button"]}
            onClick={() => {
              if (config.dontShowMaskSplashScreen !== true) {
                navigate(Path.NewChat + location.search, {
                  state: { fromHome: true },
                });
              } else {
                navigate(Path.Masks + location.search, {
                  state: { fromHome: true },
                });
              }
            }}
            shadow
          />

          {config.useGpts && (
            <IconButton
              icon={<PluginIcon />}
              text={shouldNarrow ? undefined : Locale.GPTs.Modal.Title}
              className={styles["sidebar-bar-button"]}
              onClick={() => setShowGptsConfigModal(true)}
              shadow
            />
          )}
        </div>
      )}

      <div
        className={styles["sidebar-body"]}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            // navigate(Path.Home + location.search);
          }
        }}
      >
        <ChatList narrow={shouldNarrow} />
      </div>

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          {/* <div className={styles["sidebar-action"] + " " + styles.mobile}>
            <IconButton
              icon={<DeleteIcon />}
              onClick={async () => {
                if (await showConfirm(Locale.Home.DeleteChat)) {
                  chatStore.deleteSession(chatStore.currentSessionIndex);
                }
              }}
            />
          </div> */}
          <div className={styles["sidebar-action"]}>
            <Link to={Path.Settings + location.search}>
              <IconButton
                className={styles["sidebar-tail-button"]}
                icon={<SettingsIcon />}
                shadow
              />
            </Link>
          </div>
          <div className={styles["sidebar-action"]}>
            <IconButton
              className={styles["sidebar-tail-button"]}
              icon={<QuestionIcon />}
              onClick={() => setShowAppDescModal(true)}
              shadow
            />
          </div>
        </div>
        <div>
          <IconButton
            className={styles["sidebar-tail-button"]}
            icon={<AddIcon />}
            text={shouldNarrow ? undefined : Locale.Home.NewChat}
            onClick={() => {
              chatStore.newSession();
              navigate(Path.Chat + location.search);
              // if (config.dontShowMaskSplashScreen) {
              //   chatStore.newSession();
              //   navigate(Path.Chat + location.search);
              // } else {
              //   navigate(Path.NewChat + location.search);
              // }
            }}
            shadow
          />
        </div>
      </div>

      <div className="powerd">
        Powered By
        <NextImage
          src={BotIconDark}
          height={13}
          alt=""
          onClick={() => openWindow(GPT302_WEBSITE_URL)}
        />
      </div>

      <div
        className={styles["sidebar-drag"]}
        onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon />
      </div>

      {showAppDescModal && (
        <AppDescription onClose={() => setShowAppDescModal(false)} />
      )}

      <GptsConfigModel
        style={{ display: showGptsConfigModal ? "flex" : "none" }}
        onClose={() => setShowGptsConfigModal(false)}
      />
    </div>
  );
}
