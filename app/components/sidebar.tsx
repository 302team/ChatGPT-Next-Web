import {
  useEffect,
  useRef,
  useMemo,
  useState,
  TouchEventHandler,
  MouseEventHandler,
} from "react";

import styles from "./home.module.scss";
import uiStyles from "./ui-lib.module.scss";

import { IconButton } from "./button";
import SettingsIcon from "../icons/settings.svg";
import QuestionIcon from "../icons/question.svg";
import ChatGptIcon from "../icons/logo.png";
import AddIcon from "../icons/add.svg";
import MaskIcon from "../icons/mask.svg";
import PluginIcon from "../icons/plugin.svg";
import DragIcon from "../icons/drag.svg";
import NextImage from "next/image";
import BotIconDark from "../icons/logo-horizontal-dark.png";
import ExportIcon from "../icons/share.svg";

import Locale, { getLang } from "../locales";

import { useAccessStore, useAppConfig, useChatStore } from "../store";

import {
  DASH_URL,
  DEFAULT_SIDEBAR_WIDTH,
  DEMO_HOST,
  DEMO_HOST_CN,
  GPT302_WEBSITE_CN_URL,
  GPT302_WEBSITE_URL,
  GPTS302_WEBSITE_CN_URL,
  GPTS302_WEBSITE_URL,
  LAST_INPUT_TIME,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  NARROW_SIDEBAR_WIDTH,
  Path,
  REPO_URL,
  Region,
} from "../constant";

import { Link, useNavigate, useLocation } from "react-router-dom";
import { copyToClipboard, isIOS, openWindow, useMobileScreen } from "../utils";
import dynamic from "next/dynamic";
import { Modal, showConfirm, showToast } from "./ui-lib";
import { DEFAULT_MASK_AVATAR, Mask, createEmptyMask } from "../store/mask";

import { Spin, Result, Button, Space } from "antd";
import { SyncOutlined } from "@ant-design/icons";
import { Loading } from "./home";
import { SearchBar, SearchInputRef } from "./search-bar";
import { useSyncStore } from "../store/sync";

const ChatList = dynamic(async () => (await import("./chat-list")).ChatList, {
  loading: () => null,
});

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
  }, []);
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

function AppDescription(props: {
  isMobileScreen?: boolean;
  onClose: () => void;
}) {
  // demo.xx.com
  const isDemo =
    window.location.host.startsWith(DEMO_HOST) ||
    window.location.host.startsWith(DEMO_HOST_CN);
  const isCnDemo = window.location.host.startsWith(DEMO_HOST_CN);

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
          !isDemo && config.showShareEntry ? <ShareAction key="share" /> : null,
        ]}
        onClose={() => props.onClose()}
        footer={
          isDemo && (
            <Space>
              <IconButton
                key="register"
                onClick={() => {
                  openWindow(
                    config.region === Region.China
                      ? DASH_URL.REGISTER_CN
                      : DASH_URL.REGISTER,
                  );
                }}
                bordered
                text={Locale.Auth.Register}
              />

              <IconButton
                key="login"
                type="primary"
                onClick={() => {
                  openWindow(
                    config.region === Region.China
                      ? DASH_URL.LOGIN_CN
                      : DASH_URL.LOGIN,
                  );
                }}
                bordered
                text={Locale.Auth.Login}
              />
            </Space>
          )
        }
      >
        <div
          dangerouslySetInnerHTML={{
            __html: isDemo
              ? Locale.Auth.Unauthorized(isCnDemo ? 0 : 1)
              : config.chatbotInfo,
          }}
        ></div>
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
          if (data.detail) {
            try {
              if (typeof data.detail === "string") {
                promptStarters = JSON.parse(data.detail);
              } else {
                promptStarters = data.detail;
              }
            } catch (error) {}
          }

          const isGptsModel = data.uuid.startsWith("g-");
          const model = isGptsModel ? `gpt-4-gizmo-${data.uuid}` : data.uuid;
          const isStoreModelSupportPlugin = config.supportPluginModelList.some(
            // (m) => new RegExp(m).test(model),
            (m) => m.toLocaleLowerCase() === model.toLocaleLowerCase(),
          );

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
                model: model,
                enableInjectSystemPrompts:
                  model.startsWith("gpt") || model.startsWith("claude"),
              },
              modelName: data.display_name,
              promptStarters,
              isStoreModel: true,
              isGptsModel: isGptsModel,
              usePlugins: isStoreModelSupportPlugin,
            } as Mask,
            true,
          );

          props?.callback?.(data);
        }
      }
    };

    window.addEventListener("message", messageListener);
    return () => window.removeEventListener("message", messageListener);
  }, []);

  return {
    gptsModel,
    setGptsModel,
  };
}

export function GptsConfigModal(props: {
  isChina: number;
  style?: React.CSSProperties;
  isMobileScreen?: boolean;
  onClose: () => void;
}) {
  const windowSize = useWindowSize();
  const [spinning, setSpinning] = useState(true);
  const [error, setError] = useState(false);
  const [iframeSrc, _setIframeSrc] = useState("");

  function setIframeSrc(url?: string) {
    if (!url) {
      url = props.isChina === 0 ? GPTS302_WEBSITE_CN_URL : GPTS302_WEBSITE_URL;

      let lang = "";
      if (getLang() === "cn") {
        lang = "zh";
      } else {
        lang = "en";
      }

      if (props.isChina === 1) {
        url = url.replace("/?", `/${lang}?`);
      }
    }

    _setIframeSrc(url);
  }

  useEffect(() => {
    setIframeSrc();
  }, [props.isChina]);

  return (
    <div className="modal-mask" style={props.style}>
      <Modal
        showMaxButton={!props.isMobileScreen}
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
                    setIframeSrc();
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

export function SideBar(props: { className?: string }) {
  const chatStore = useChatStore();
  const [showAppDescModal, setShowAppDescModal] = useState(false);
  const [showGptsConfigModal, setShowGptsConfigModal] = useState(false);
  const [showMaskModal, setShowMaskModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

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

  // search
  const searchBarWrapRef = useRef<HTMLDivElement>(null);
  const searchBarRef = useRef<SearchInputRef>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (shouldNarrow) stopSearch();
  }, [shouldNarrow]);

  const toggleSearchBar = (show: boolean) => {
    if (searchBarWrapRef.current) {
      if (!show) {
        searchBarWrapRef.current.style.height = "0px";
        searchBarWrapRef.current.style.marginBottom = "0px";
      } else {
        searchBarWrapRef.current.style.height = "38px";
        searchBarWrapRef.current.style.marginBottom = "15px";
      }
    }
  };

  const stopSearch = () => {
    setIsSearching(false);
    searchBarRef.current?.clearInput();
    // toggleSearchBar();
  };

  // sync
  const syncStore = useSyncStore();
  const [syncLoading, setSyncLoading] = useState(false);
  const handleSync = async () => {
    if (syncLoading) return;
    setSyncLoading(true);

    try {
      // 首先同步一下记录
      await syncStore.getLogs(syncStore.syncPassword);

      // 对比时间戳
      if (syncStore.syncRecordList.length) {
        const lastUpdateTime = localStorage.getItem(LAST_INPUT_TIME);
        const record = syncStore.syncRecordList[0];

        const diff = Number(lastUpdateTime) - Number(record.timestamp);

        if (diff > 0) {
          // 本地更新时间比较新, 上传
          await syncStore.upload();
        } else if (diff < 0) {
          // 远程更新时间比较新, 下载
          await syncStore.downloadFromIndex();
        }
      }
      showToast(Locale.Settings.Sync.Success);
    } catch (error) {
      console.error("[Sync] error:", error);
      showToast(Locale.Settings.Sync.Fail);
    } finally {
      setSyncLoading(false);
    }
  };

  useGptsConfigMessage({
    callback(data: any) {
      setShowGptsConfigModal(false);
      if (isMobileScreen) {
        navigate(Path.Chat + location.search);
      }
    },
  });

  useHotKey();

  const [startY, setStartY] = useState(0);

  const handleTouchStart: TouchEventHandler = (e) => {
    setStartY(e.targetTouches[0].pageY);
  };

  const handleTouchEnd: TouchEventHandler = (e) => {
    const distance = e.changedTouches[0].pageY - startY;
    console.log("🚀 ~ distance:", distance);

    if (distance > 0) {
      // 下滑时, 超过阈值才显示 搜索栏
      if (Math.abs(distance) > 50) toggleSearchBar(true);
    } else {
      // 上滑时 超过阈值隐藏 搜索栏
      if (Math.abs(distance) > 50) toggleSearchBar(false);
    }
  };

  const handleMouseDown: MouseEventHandler = (e) => {
    setStartY(e.pageY);
  };

  const handleMouseUp: MouseEventHandler = (e) => {
    const distance = e.pageY - startY;

    if (distance > 0) {
      // 下滑时, 超过阈值才显示 搜索栏
      if (Math.abs(distance) > 30) toggleSearchBar(true);
    } else {
      // 上滑时 超过阈值隐藏 搜索栏
      if (Math.abs(distance) > 30) toggleSearchBar(false);
    }
  };

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
          {!config.chatbotName || config.chatbotName === "GPT302"
            ? config.region === Region.China
              ? "302.AI"
              : "302.AI"
            : config.chatbotName}
        </div>
        <div className={styles["sidebar-sub-title"]}>
          {config.chatbotDesc ||
            Locale.Config.description(
              config.isGpts ? Locale.Config.GPTs : "AI",
            )}
        </div>
        <div className={styles["sidebar-logo"] + " no-dark"}>
          {config.chatbotLogo && (
            <img
              src={config.chatbotLogo}
              alt="LOGO"
              onClick={() =>
                openWindow(
                  config.chatbotLink ||
                    (config.region === Region.China
                      ? GPT302_WEBSITE_CN_URL
                      : GPT302_WEBSITE_URL),
                )
              }
            />
          )}
          {!config.chatbotLogo && (
            <img
              src={ChatGptIcon.src}
              alt="logo"
              onClick={() =>
                openWindow(
                  config.chatbotLink ||
                    (config.region === Region.China
                      ? GPT302_WEBSITE_CN_URL
                      : GPT302_WEBSITE_URL),
                )
              }
            />
          )}
        </div>
      </div>

      {!config.isGpts && (
        <div className={styles["sidebar-header-bar"]}>
          {/* 非GPTs模型的GPTs机器人，也不要出现助手按钮 */}
          {!config.hideBuiltinMasks && (
            <IconButton
              icon={<MaskIcon />}
              text={shouldNarrow ? undefined : Locale.Mask.Name}
              className={styles["sidebar-bar-button"]}
              onClick={() => {
                setShowMaskModal(true);
              }}
              shadow
            />
          )}

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
        ref={searchBarWrapRef}
        className={`${styles["sidebar-search-bar"]} ${isSearching ? styles["sidebar-search-bar-isSearching"] : ""}`}
      >
        {!shouldNarrow && (
          <SearchBar ref={searchBarRef} setIsSearching={setIsSearching} />
        )}
      </div>

      {!isSearching && (
        <div
          className={styles["sidebar-body"]}
          onTouchStartCapture={handleTouchStart}
          onTouchEndCapture={handleTouchEnd}
          onMouseDownCapture={handleMouseDown}
          onMouseUpCapture={handleMouseUp}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              // navigate(Path.Home + location.search);
            }
          }}
        >
          <ChatList narrow={shouldNarrow} />
        </div>
      )}

      <div className={styles["sidebar-tail"]}>
        <div className={styles["sidebar-actions"]}>
          {!config.hideSettingButton && (
            <div className={styles["sidebar-action"]}>
              <IconButton
                className={styles["sidebar-tail-button"]}
                icon={<SettingsIcon />}
                onClick={() => setShowSettingsModal(true)}
                shadow
              />
              <Link to={Path.Settings + location.search}></Link>
            </div>
          )}
          <div className={styles["sidebar-action"]}>
            <IconButton
              className={styles["sidebar-tail-button"]}
              icon={<QuestionIcon />}
              onClick={() => setShowAppDescModal(true)}
              shadow
            />
          </div>
          {syncStore.enable && syncStore.syncPassword && (
            <div className={styles["sidebar-action"]}>
              <IconButton
                className={styles["sidebar-tail-button"]}
                icon={
                  <SyncOutlined
                    style={{ fontSize: "16px", color: "#3D3D3D" }}
                    spin={syncLoading}
                  />
                }
                onClick={handleSync}
                shadow
              />
            </div>
          )}
        </div>
        <div>
          <IconButton
            className={styles["sidebar-tail-button"]}
            icon={<AddIcon />}
            text={shouldNarrow ? undefined : Locale.Home.NewChat}
            onClick={() => {
              chatStore.newSession();
              navigate(Path.Chat + location.search);
              stopSearch();
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

      <div
        className={styles["sidebar-drag"]}
        onPointerDown={(e) => onDragStart(e as any)}
      >
        <DragIcon />
      </div>

      {showAppDescModal && (
        <AppDescription
          isMobileScreen={isMobileScreen}
          onClose={() => setShowAppDescModal(false)}
        />
      )}

      <GptsConfigModal
        isChina={config.region}
        isMobileScreen={isMobileScreen}
        style={{ display: showGptsConfigModal ? "flex" : "none" }}
        onClose={() => setShowGptsConfigModal(false)}
      />

      {showMaskModal && (
        <MasksModal
          isMobileScreen={isMobileScreen}
          onClose={() => setShowMaskModal(false)}
        />
      )}
      {showSettingsModal && (
        <SettingsModal
          isMobileScreen={isMobileScreen}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </div>
  );
}
