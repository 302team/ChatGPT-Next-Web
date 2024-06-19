import { useEffect, useRef, useMemo, useState } from "react";

import styles from "./home.module.scss";
import uiStyles from "./ui-lib.module.scss";

import ChatGptIcon from "../icons/logo.png";
import DragIcon from "../icons/drag.svg";
import NextImage from "next/image";
import BotIconDark from "../icons/logo-horizontal-dark.png";
import ExportIcon from "../icons/share.svg";
import QuestionIcon from "../icons/question.svg";
import ResetIcon from "../icons/reload.svg";
import ArrowRightIcon from "../icons/arrow-right.svg";

import Locale from "../locales";

import { useAccessStore, useAppConfig, useChatStore } from "../store";

import {
  DEFAULT_SIDEBAR_WIDTH,
  GPT302_WEBSITE_CN_URL,
  GPT302_WEBSITE_URL,
  GPTS302_WEBSITE_URL,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
  Region,
} from "../constant";

import { useNavigate, useLocation } from "react-router-dom";
import { copyToClipboard, isIOS, openWindow, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { Modal } from "./ui-lib";

import { Loading } from "./home";
import { SidebarModelList } from "./sidebar-model-list";
import { IconButton } from "./button";

const MaskPage = dynamic(async () => (await import("./mask")).MaskPage, {
  loading: () => <Loading noLogo />,
});

const Settings = dynamic(async () => (await import("./settings")).Settings, {
  loading: () => <Loading noLogo />,
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

export function MasksModal(props: {
  style?: React.CSSProperties;
  isMobileScreen?: boolean;
  onClose: () => void;
}) {
  const windowSize = useWindowSize();

  return (
    <div className="modal-mask" style={props.style}>
      <Modal
        showMaxButton={!props.isMobileScreen}
        title={Locale.Mask.Name}
        containerClass="gpts-selector"
        onClose={() => props.onClose()}
      >
        <MaskPage
          onClose={props.onClose}
          style={{
            height: windowSize.height * 0.7,
          }}
        />
      </Modal>
    </div>
  );
}

export function SettingsModal(props: {
  style?: React.CSSProperties;
  isMobileScreen?: boolean;
  onClose: () => void;
}) {
  const windowSize = useWindowSize();

  return (
    <div className="modal-mask" style={props.style}>
      <Modal
        showMaxButton={!props.isMobileScreen}
        title={Locale.Settings.Title}
        subtitle={Locale.Settings.SubTitle}
        containerClass="gpts-selector"
        onClose={() => props.onClose()}
      >
        <Settings
          onClose={props.onClose}
          style={{
            padding: 0,
            paddingRight: "3px",
            height: windowSize.height * 0.7,
          }}
        />
      </Modal>
    </div>
  );
}

function AppDescription(props: {
  isMobileScreen?: boolean;
  onClose: () => void;
}) {
  const config = useAppConfig();
  const access = useAccessStore();

  function ShareAction() {
    return (
      <div
        className={uiStyles["modal-header-action"]}
        onClick={() => {
          const modelName = config.isGpts
            ? config.gptsConfig.name
            : config.modelConfig.model;
          const msg = Locale.Export.ShareMessage(
            access.pwd,
            config.isGpts,
            modelName,
          );
          copyToClipboard(msg);
        }}
      >
        <ExportIcon />
      </div>
    );
  }

  return (
    <div className="modal-mask app-desc-modal">
      <Modal
        title={Locale.Config.AppDescTitle}
        subtitle={Locale.Config.AppDescSubTitle}
        headerActions={[
          config.showShareEntry ? <ShareAction key="share" /> : null,
        ]}
        onClose={() => props.onClose()}
      >
        <div dangerouslySetInnerHTML={{ __html: config.chatbotInfo }}></div>
      </Modal>
    </div>
  );
}

export function SideBar(props: { className?: string }) {
  // drag side bar
  const { onDragStart, shouldNarrow } = useDragSideBar();
  const [showAppDescModal, setShowAppDescModal] = useState(false);
  const config = useAppConfig();
  const navigate = useNavigate();
  const isMobileScreen = useMobileScreen();
  const isIOSMobile = useMemo(
    () => isIOS() && isMobileScreen,
    [isMobileScreen],
  );

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
          {Locale.Sidebar.Title}
        </div>
        <div className={styles["sidebar-sub-title"]}>
          {Locale.Sidebar.Description}
        </div>
        <div className={styles["sidebar-logo"] + " no-dark"}>
          {config.chatbotLogo && (
            <img
              src={config.chatbotLogo}
              alt="LOGO"
              onClick={() =>
                openWindow(
                  config.chatbotLink || config.region === Region.China
                    ? GPT302_WEBSITE_CN_URL
                    : GPT302_WEBSITE_URL,
                )
              }
            />
          )}
          {!config.chatbotLogo && (
            <img
              src={ChatGptIcon.src}
              alt="logo"
              height={50}
              width={50}
              onClick={() =>
                openWindow(
                  config.chatbotLink || config.region === Region.China
                    ? GPT302_WEBSITE_CN_URL
                    : GPT302_WEBSITE_URL,
                )
              }
            />
          )}
        </div>
      </div>

      <div className={styles["sidebar-body"]}>
        <SidebarModelList narrow={shouldNarrow} />
      </div>

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          <div className={styles["sidebar-action"]}>
            <IconButton
              className={styles["sidebar-tail-button"]}
              icon={<ResetIcon />}
              onClick={() => {
                config.update((config) => {
                  config.modelList = config.modelList.map((m) => ({
                    ...m,
                    enable: false,
                  }));
                });
              }}
              shadow
            />
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
        {isMobileScreen && (
          <div>
            <IconButton
              className={styles["sidebar-tail-button"]}
              icon={<ArrowRightIcon />}
              text={shouldNarrow ? undefined : Locale.Home.ZeroShot}
              onClick={() => {
                navigate(Path.Chat);
              }}
              shadow
            />
          </div>
        )}
      </div>

      <div className={styles["powerd"]}>
        Powered By
        <NextImage
          src={BotIconDark}
          height={13}
          alt=""
          onClick={() =>
            openWindow(
              config.region === Region.China
                ? GPT302_WEBSITE_CN_URL
                : GPT302_WEBSITE_URL,
            )
          }
        />
      </div>

      {/* <div
        className={styles["sidebar-drag"]}
        onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon />
      </div> */}

      {showAppDescModal && (
        <AppDescription
          isMobileScreen={isMobileScreen}
          onClose={() => setShowAppDescModal(false)}
        />
      )}
    </div>
  );
}
