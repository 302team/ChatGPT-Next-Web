/* eslint-disable @next/next/no-img-element */
import { useDebouncedCallback } from "use-debounce";
import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  Fragment,
  RefObject,
} from "react";

import mime from "mime";
import { nanoid } from "nanoid";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { useDropzone } from "react-dropzone";

import SendWhiteIcon from "../icons/send-white.svg";
import BrainIcon from "../icons/brain.svg";
import RenameIcon from "../icons/rename.svg";
import ExportIcon from "../icons/share.svg";
import ReturnIcon from "../icons/return.svg";
import CopyIcon from "../icons/copy.svg";
import LoadingIcon from "../icons/three-dots.svg";
import LoadingButtonIcon from "../icons/loading.svg";
import PromptIcon from "../icons/prompt.svg";
import MaskIcon from "../icons/mask.svg";
import MaxIcon from "../icons/max.svg";
import MinIcon from "../icons/min.svg";
import ResetIcon from "../icons/reload.svg";
import ResetIcon2 from "../icons/reload2.svg";
import BreakIcon from "../icons/break.svg";
import SettingsIcon from "../icons/chat-settings.svg";
import DeleteIcon from "../icons/ashcan.svg";
import CleanIcon from "../icons/clean.png";
import PinIcon from "../icons/pin.svg";
import EditIcon from "../icons/rename.svg";
import ConfirmIcon from "../icons/confirm.svg";
import CancelIcon from "../icons/cancel.svg";
import ImageIcon from "../icons/image.svg";
import AttachIcon from "../icons/attach.svg";

import LightIcon from "../icons/light.svg";
import DarkIcon from "../icons/dark.svg";
import AutoIcon from "../icons/auto.svg";
import BottomIcon from "../icons/bottom.svg";
import PauseIcon from "../icons/pause.svg";
import StopIcon from "../icons/stop2.svg";
import SendIcon from "../icons/send.svg";
import FileIcon from "../icons/file.svg";
import RobotIcon from "../icons/robot.svg";
import SpeakIcon from "../icons/speak.svg";
import VoiceIcon from "../icons/voice.svg";
import KeyboardIcon from "../icons/keyboard.svg";
import CheckmarkIcon from "../icons/checkmark.svg";

import {
  ChatMessage,
  SubmitKey,
  useChatStore,
  BOT_HELLO,
  createMessage,
  useAccessStore,
  Theme,
  useAppConfig,
  DEFAULT_TOPIC,
  ModelType,
  UploadFile,
  ExtAttr,
} from "../store";

import {
  copyToClipboard,
  selectOrCopy,
  autoGrowTextArea,
  useMobileScreen,
  getMessageTextContent,
  getMessageImages,
  isVisionModel,
  isSupportMultimodal,
  compressImage,
  isImage,
  getMessageFiles,
  dataURLtoFile,
  copyAudioBlob,
  convertAudioBufferToWave,
  isSpecImageModal,
  isSupportFunctionCall,
} from "../utils";

import dynamic from "next/dynamic";

import { ChatControllerPool } from "../client/controller";
import { Prompt, usePromptStore } from "../store/prompt";
import Locale, { getLang } from "../locales";

import { IconButton } from "./button";
import styles from "./chat.module.scss";

import {
  List,
  ListItem,
  ShowLoading,
  Modal,
  Selector,
  showConfirm,
  showPrompt,
  showToast,
} from "./ui-lib";
import { useNavigate, useLocation } from "react-router-dom";
import {
  CHAT_PAGE_SIZE,
  FILE_BASE64_ICON,
  LAST_INPUT_KEY,
  ModelProvider,
  Path,
  REQUEST_TIMEOUT_MS,
  UNFINISHED_INPUT,
} from "../constant";
import { Avatar } from "./emoji";
import { ContextPrompts, MaskAvatar, MaskConfig } from "./mask";
import { useMaskStore } from "../store/mask";
import { ChatCommandPrefix, useChatCommand, useCommand } from "../command";
import { prettyObject } from "../utils/format";
import { ExportMessageModal } from "./exporter";
import { getClientConfig } from "../config/client";
import { useAllModels } from "../utils/hooks";
import { ClientApi, MultimodalContent } from "../client/api";
import NextImage from "next/image";

import { LoadingOutlined, CloseOutlined } from "@ant-design/icons";
import { Typography, Image } from "antd";
import { usePluginStore } from "../store/plugin";

const Markdown = dynamic(async () => (await import("./markdown")).Markdown, {
  loading: () => <LoadingIcon />,
});

export function SessionConfigModel(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const maskStore = useMaskStore();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Context.Edit}
        onClose={() => props.onClose()}
        actions={[
          <IconButton
            key="reset"
            icon={<ResetIcon />}
            bordered
            text={Locale.Chat.Config.Reset}
            onClick={async () => {
              if (await showConfirm(Locale.Memory.ResetConfirm)) {
                chatStore.updateCurrentSession(
                  (session) => (session.memoryPrompt = ""),
                );
              }
            }}
          />,
          <IconButton
            key="copy"
            icon={<CopyIcon />}
            bordered
            text={Locale.Chat.Config.SaveAs}
            onClick={() => {
              navigate(Path.Masks + location.search);
              setTimeout(() => {
                maskStore.create(session.mask);
              }, 500);
            }}
          />,
        ]}
      >
        <MaskConfig
          mask={session.mask}
          updateMask={(updater) => {
            const mask = { ...session.mask };
            updater(mask);
            chatStore.updateCurrentSession((session) => (session.mask = mask));
          }}
          shouldSyncFromGlobal
          extraListItems={
            session.mask.modelConfig.sendMemory ? (
              <ListItem
                className="copyable"
                title={`${Locale.Memory.Title} (${session.lastSummarizeIndex} of ${session.messages.length})`}
                subTitle={session.memoryPrompt || Locale.Memory.EmptyContent}
              ></ListItem>
            ) : (
              <></>
            )
          }
        ></MaskConfig>
      </Modal>
    </div>
  );
}

function PromptToast(props: {
  showToast?: boolean;
  showModal?: boolean;
  setShowModal: (_: boolean) => void;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const context = session.mask.context;

  return (
    <div className={styles["prompt-toast"]} key="prompt-toast">
      {props.showToast && (
        <div
          className={styles["prompt-toast-inner"] + " clickable"}
          role="button"
          onClick={() => props.setShowModal(true)}
        >
          <BrainIcon />
          <span className={styles["prompt-toast-content"]}>
            {Locale.Context.Toast(context.length)}
          </span>
        </div>
      )}
      {props.showModal && (
        <SessionConfigModel onClose={() => props.setShowModal(false)} />
      )}
    </div>
  );
}

function useSubmitHandler() {
  const config = useAppConfig();
  const submitKey = config.submitKey;
  const isComposing = useRef(false);

  useEffect(() => {
    const onCompositionStart = () => {
      isComposing.current = true;
    };
    const onCompositionEnd = () => {
      isComposing.current = false;
    };

    window.addEventListener("compositionstart", onCompositionStart);
    window.addEventListener("compositionend", onCompositionEnd);

    return () => {
      window.removeEventListener("compositionstart", onCompositionStart);
      window.removeEventListener("compositionend", onCompositionEnd);
    };
  }, []);

  const shouldSubmit = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Fix Chinese input method "Enter" on Safari
    if (e.keyCode == 229) return false;
    if (e.key !== "Enter") return false;
    if (e.key === "Enter" && (e.nativeEvent.isComposing || isComposing.current))
      return false;
    return (
      (config.submitKey === SubmitKey.AltEnter && e.altKey) ||
      (config.submitKey === SubmitKey.CtrlEnter && e.ctrlKey) ||
      (config.submitKey === SubmitKey.ShiftEnter && e.shiftKey) ||
      (config.submitKey === SubmitKey.MetaEnter && e.metaKey) ||
      (config.submitKey === SubmitKey.Enter &&
        !e.altKey &&
        !e.ctrlKey &&
        !e.shiftKey &&
        !e.metaKey)
    );
  };

  return {
    submitKey,
    shouldSubmit,
  };
}

export type RenderPompt = Pick<Prompt, "title" | "content">;

export function PromptHints(props: {
  prompts: RenderPompt[];
  onPromptSelect: (prompt: RenderPompt) => void;
}) {
  const noPrompts = props.prompts.length === 0;
  const [selectIndex, setSelectIndex] = useState(0);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectIndex(0);
  }, [props.prompts.length]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (noPrompts || e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }
      // arrow up / down to select prompt
      const changeIndex = (delta: number) => {
        e.stopPropagation();
        e.preventDefault();
        const nextIndex = Math.max(
          0,
          Math.min(props.prompts.length - 1, selectIndex + delta),
        );
        setSelectIndex(nextIndex);
        selectedRef.current?.scrollIntoView({
          block: "center",
        });
      };

      if (e.key === "ArrowUp") {
        changeIndex(1);
      } else if (e.key === "ArrowDown") {
        changeIndex(-1);
      } else if (e.key === "Enter") {
        const selectedPrompt = props.prompts.at(selectIndex);
        if (selectedPrompt) {
          props.onPromptSelect(selectedPrompt);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.prompts.length, selectIndex]);

  if (noPrompts) return null;
  return (
    <div className={styles["prompt-hints"]}>
      {props.prompts.map((prompt, i) => (
        <div
          ref={i === selectIndex ? selectedRef : null}
          className={
            styles["prompt-hint"] +
            ` ${i === selectIndex ? styles["prompt-hint-selected"] : ""}`
          }
          key={prompt.title + i.toString()}
          onClick={() => props.onPromptSelect(prompt)}
          onMouseEnter={() => setSelectIndex(i)}
        >
          <div className={styles["hint-title"]}>{prompt.title}</div>
          <div className={styles["hint-content"]}>{prompt.content}</div>
        </div>
      ))}
    </div>
  );
}

function ClearContextDivider() {
  const chatStore = useChatStore();

  return (
    <div
      className={styles["clear-context"]}
      onClick={() =>
        chatStore.updateCurrentSession(
          (session) => (session.clearContextIndex = undefined),
        )
      }
    >
      <div className={styles["clear-context-tips"]}>{Locale.Context.Clear}</div>
      <div className={styles["clear-context-revert-btn"]}>
        {Locale.Context.Revert}
      </div>
    </div>
  );
}

function ChatAction(props: {
  text: string;
  icon: JSX.Element;
  className?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState({
    full: 16,
    icon: 16,
  });

  function updateWidth() {
    if (props.disabled) return;

    if (!iconRef.current || !textRef.current) return;
    const getWidth = (dom: HTMLDivElement) => dom.getBoundingClientRect().width;
    const textWidth = getWidth(textRef.current);
    const iconWidth = getWidth(iconRef.current);
    setWidth({
      full: textWidth + iconWidth,
      icon: iconWidth,
    });
  }

  return (
    <div
      className={`${styles["chat-input-action"]} ${
        props.disabled ? "unclickable" : "clickable"
      } ${props.className}`}
      onClick={() => {
        props.onClick();
        setTimeout(updateWidth, 1);
      }}
      onMouseEnter={updateWidth}
      onTouchStart={updateWidth}
      style={
        {
          "--icon-width": `${width.icon}px`,
          "--full-width": `${width.full}px`,
        } as React.CSSProperties
      }
    >
      <div ref={iconRef} className={styles["icon"]}>
        {props.icon}
      </div>
      <div className={styles["text"]} ref={textRef}>
        {props.text}
      </div>
    </div>
  );
}

function useScrollToBottom(
  scrollRef: RefObject<HTMLDivElement>,
  detach: boolean = false,
) {
  // for auto-scroll

  const [autoScroll, setAutoScroll] = useState(true);
  function scrollDomToBottom() {
    const dom = scrollRef.current;
    if (dom) {
      requestAnimationFrame(() => {
        setAutoScroll(true);
        dom.scrollTo(0, dom.scrollHeight);
      });
    }
  }

  // auto scroll
  useEffect(() => {
    if (autoScroll && !detach) {
      scrollDomToBottom();
    }
  });

  return {
    scrollRef,
    autoScroll,
    setAutoScroll,
    scrollDomToBottom,
  };
}

export function ChatActions(props: {
  uploadImage: () => void;
  setUploadFiles: (images: string[]) => void;
  setUploading: (uploading: boolean) => void;
  showPromptModal: () => void;
  scrollToBottom: () => void;
  showPromptHints: () => void;
  hitBottom: boolean;
  uploading: boolean;
}) {
  const config = useAppConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const chatStore = useChatStore();

  // switch themes
  const theme = config.theme;
  function nextTheme() {
    const themes = [Theme.Auto, Theme.Light, Theme.Dark];
    const themeIndex = themes.indexOf(theme);
    const nextIndex = (themeIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    config.update((config) => (config.theme = nextTheme));
  }

  // stop all responses
  const couldStop = ChatControllerPool.hasPending();
  const stopAll = () => ChatControllerPool.stopAll();

  // switch model
  const currentModel = chatStore.currentSession().mask.modelConfig.model;
  const allModels = useAllModels();
  const models = useMemo(
    () => allModels.filter((m) => m.available),
    [allModels],
  );
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showUploadImage, setShowUploadImage] = useState(false);

  useEffect(() => {
    const show = isVisionModel(currentModel) || isSpecImageModal(currentModel);
    setShowUploadImage(show);
    if (!show) {
      props.setUploadFiles([]);
      props.setUploading(false);
    }

    // if current model is not available
    // switch to first available model
    const isUnavaliableModel = !models.some((m) => m.name === currentModel);
    if (isUnavaliableModel && models.length > 0) {
      const nextModel = models[0].name as ModelType;
      chatStore.updateCurrentSession(
        (session) => (session.mask.modelConfig.model = nextModel),
      );
      showToast(nextModel);
    }
  }, [chatStore, currentModel, models]);

  return (
    <div className={styles["chat-input-actions"]}>
      {couldStop && (
        <ChatAction
          onClick={stopAll}
          text={Locale.Chat.InputActions.Stop}
          icon={<PauseIcon />}
        />
      )}
      {!props.hitBottom && (
        <ChatAction
          onClick={props.scrollToBottom}
          text={Locale.Chat.InputActions.ToBottom}
          icon={<BottomIcon />}
        />
      )}
      {props.hitBottom && (
        <ChatAction
          onClick={props.showPromptModal}
          text={Locale.Chat.InputActions.Settings}
          icon={<SettingsIcon />}
        />
      )}

      {showUploadImage && (
        <ChatAction
          onClick={props.uploadImage}
          text={Locale.Chat.InputActions.UploadImage}
          icon={props.uploading ? <LoadingButtonIcon /> : <ImageIcon />}
        />
      )}
      <ChatAction
        onClick={nextTheme}
        text={Locale.Chat.InputActions.Theme[theme]}
        icon={
          <>
            {theme === Theme.Auto ? (
              <AutoIcon />
            ) : theme === Theme.Light ? (
              <LightIcon />
            ) : theme === Theme.Dark ? (
              <DarkIcon />
            ) : null}
          </>
        }
      />

      <ChatAction
        onClick={props.showPromptHints}
        text={Locale.Chat.InputActions.Prompt}
        icon={<PromptIcon />}
      />

      <ChatAction
        onClick={() => {
          navigate(Path.Masks + location.search);
        }}
        text={Locale.Chat.InputActions.Masks}
        icon={<MaskIcon />}
      />

      <ChatAction
        text={Locale.Chat.InputActions.Clear}
        icon={<BreakIcon />}
        onClick={() => {
          chatStore.updateCurrentSession((session) => {
            if (session.clearContextIndex === session.messages.length) {
              session.clearContextIndex = undefined;
            } else {
              session.clearContextIndex = session.messages.length;
              session.memoryPrompt = ""; // will clear memory
            }
          });
        }}
      />

      {/* <ChatAction
        onClick={() => setShowModelSelector(true)}
        text={currentModel}
        icon={<RobotIcon />}
      /> */}

      {showModelSelector && (
        <Selector
          defaultSelectedValue={currentModel}
          items={models.map((m) => ({
            title: m.displayName,
            value: m.name,
          }))}
          onClose={() => setShowModelSelector(false)}
          onSelection={(s) => {
            if (s.length === 0) return;
            chatStore.updateCurrentSession((session) => {
              session.mask.modelConfig.model = s[0] as ModelType;
              session.mask.syncGlobalConfig = false;
            });
            showToast(s[0]);
          }}
        />
      )}
    </div>
  );
}

export function EditMessageModal(props: { onClose: () => void }) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const [messages, setMessages] = useState(session.messages.slice());

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Chat.EditMessage.Title}
        onClose={props.onClose}
        actions={[
          <IconButton
            text={Locale.UI.Cancel}
            icon={<CancelIcon />}
            key="cancel"
            onClick={() => {
              props.onClose();
            }}
          />,
          <IconButton
            type="primary"
            text={Locale.UI.Confirm}
            icon={<ConfirmIcon />}
            key="ok"
            onClick={() => {
              chatStore.updateCurrentSession(
                (session) => (session.messages = messages),
              );
              props.onClose();
            }}
          />,
        ]}
      >
        <List>
          <ListItem
            title={Locale.Chat.EditMessage.Topic.Title}
            subTitle={Locale.Chat.EditMessage.Topic.SubTitle}
          >
            <input
              type="text"
              value={session.topic}
              onInput={(e) =>
                chatStore.updateCurrentSession(
                  (session) => (session.topic = e.currentTarget.value),
                )
              }
            ></input>
          </ListItem>
        </List>
        <ContextPrompts
          context={messages}
          updateContext={(updater) => {
            const newMessages = messages.slice();
            updater(newMessages);
            setMessages(newMessages);
          }}
        />
      </Modal>
    </div>
  );
}

export function DeleteImageButton(props: { deleteImage: () => void }) {
  return (
    <div className={styles["delete-image"]} onClick={props.deleteImage}>
      <NextImage src={CleanIcon} alt="delete" width={16} height={16} />
    </div>
  );
}

function useUploadFile(extra: {
  setAutoScroll?: (autoScroll: boolean) => void;
}) {
  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const accessStore = useAccessStore();
  const uploadUrl = accessStore.fileUploadUrl;
  const config = useAppConfig();
  const allPlugins = usePluginStore()
    .getAll()
    .filter(
      (m) =>
        (!getLang() || m.lang === (getLang() == "cn" ? getLang() : "en")) &&
        m.enable,
    );

  const [uploading, setUploading] = useState(false);

  const [showUploadAction, setShowUploadAction] = useState(false);
  const currentModel = session.mask.modelConfig.model;
  const supportMultimodal = useMemo(
    () => isSupportMultimodal(currentModel),
    [currentModel],
  );

  // ========================================
  // const [uploadImages, setUploadImages] = useState<UploadFile[]>([]);
  // const [uploadMaskImages, setUploadMaskImages] = useState([]);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const exAttr = {
    setAutoScroll: extra.setAutoScroll,
    uploadFiles,
    setUploadFiles,
    // uploadImages,
    // setUploadImages,
    // uploadMaskImages,
    // setUploadMaskImages,
  };

  const getAcceptFileType = (model: ModelType | string) => {
    if (isSupportFunctionCall(model) && config.pluginConfig.enable) return "*";

    if (isVisionModel(model) || isSpecImageModal(model)) {
      return ".png, .jpg, .jpeg, .webp, .gif";
    } else if (model.includes("whisper")) {
      return ".flac, .mp3, .mp4, .mpeg, .mpga, .m4a, .ogg, .wav, .webm";
    } else if (isSupportMultimodal(model)) {
      return "*";
    }
    return "";
  };
  // ========================================

  useEffect(() => {
    const supportMultimodal = isSupportMultimodal(currentModel);
    const show =
      // Vision 模型
      isVisionModel(currentModel) ||
      // 多模态模型
      supportMultimodal ||
      // 类似 vision 的模型
      isSpecImageModal(currentModel) ||
      // 开启了使用插件的功能
      (config.pluginConfig.enable &&
        allPlugins.length > 0 &&
        // 模型支持 function call
        isSupportFunctionCall(currentModel));

    setShowUploadAction(show);

    if (!show) {
      setUploadFiles([]);
      setUploading(false);
    }
  }, [currentModel, config.pluginConfig.enable, allPlugins.length]);

  async function handleUpload(file: File): Promise<UploadFile> {
    return new Promise(async (resolve, reject) => {
      console.warn("🚀 ~ before compress ~ size:", file.size, file.type);
      if (file.size >= 20 * 1024 * 1024) {
        showToast(Locale.Chat.Upload.Limit(20));
        return reject(Locale.Chat.Upload.Limit(20));
      }

      let dataUrl = "";
      let f = file;
      if (isImage(file.type)) {
        dataUrl = await compressImage(file, 1 * 1024 * 1024);
        if (!/gif/.test(file.type)) {
          f = dataURLtoFile(dataUrl, file.name);
        }
        console.warn("🚀 ~ after compressed ~ size:", f.size);
      } else {
        dataUrl = FILE_BASE64_ICON;
      }

      const formData = new FormData();
      formData.append("file", f);

      fetch(uploadUrl, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then(async (res: any) => {
          if (res.code === 0) {
            const url = res.data.url;

            resolve({
              uid: nanoid(),
              name: file.name,
              size: file.size,
              type: file.type,
              originFileObj: file,
              lastModified: file.lastModified,
              lastModifiedDate: new Date(file.lastModified),
              status: "done",
              response: {
                base64: dataUrl,
                fileUrl: url,
              },
            });
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  }

  async function uploadImage() {
    const files: UploadFile[] = [];

    files.push(
      ...(await new Promise<UploadFile[]>((resolve, reject) => {
        const fileInput = document.createElement("input");
        fileInput.id = "upload_file_input";
        fileInput.type = "file";
        fileInput.accept = getAcceptFileType(currentModel);
        fileInput.multiple = true;
        fileInput.addEventListener("change", (event: any) => {
          setUploading(true);
          const files = event.target.files;
          const imagesData: UploadFile[] = [];

          const tasks = Array.from(files).map(async (file) => {
            return handleUpload(file as File)
              .then((result) => {
                imagesData.push(result);
              })
              .catch((e) => {
                reject(e);
              });
          });

          Promise.all(tasks)
            .then(() => {
              setUploading(false);
              console.log(
                "🚀 ~ Promise.all ~ uploadImage all tasks end:",
                imagesData,
              );
              resolve(imagesData);
            })
            .catch(() => {
              setUploading(false);
            })
            .finally(() => {
              document.body.removeChild(fileInput);
            });
        });

        fileInput.style.display = "none";
        document.body.appendChild(fileInput);

        fileInput.click();
      })),
    );

    setUploadFiles((prev) => [...prev, ...files]);
  }

  async function dropUpload(files: File[]) {
    if (
      !config.pluginConfig.enable &&
      !isSupportMultimodal(currentModel) &&
      !isVisionModel(currentModel) &&
      !isSpecImageModal(currentModel)
    ) {
      return false;
    }

    const filterdFiles = Array.from(files).filter((f) => {
      return config.pluginConfig.enable || supportMultimodal
        ? true
        : isImage((f as File).type);
    });

    const images: UploadFile[] = [];

    if (uploading) return;
    setUploading(true);

    const tasks = Array.from(filterdFiles).map(async (file) => {
      return await handleUpload(file).then((result) => {
        images.push(result);
      });
    });

    Promise.all(tasks)
      .then(() => {
        setUploadFiles((prev) => [...prev, ...images]);
        setTimeout(() => {
          setUploading(false);
        }, 300);
        console.log("🚀 ~ Promise.all ~ dropUpload all tasks end:", images);
      })
      .catch(() => {
        setUploading(false);
      });
  }

  async function pasteUpload(file: File) {
    dropUpload([file]);
  }

  return {
    uploadFiles,
    setUploadFiles,
    uploading,
    setUploading,
    showUploadAction,
    setShowUploadAction,
    supportMultimodal,
    handleUpload,
    dropUpload,
    pasteUpload,
    uploadImage,
    exAttr,
  };
}

function useSpeakAndVoice(prosp: {
  doSubmit?: (userInput: string) => void;
  setUserInput?: React.Dispatch<React.SetStateAction<string>>;
}) {
  const chatStore = useChatStore();
  const accessStore = useAccessStore();
  const [showLoading, setShowLoading] = useState(false);

  /* 文本转语音 */
  const [speaking, setSpeaking] = useState(false);
  const [fetchSpeechLoading, setFetchSpeechLoading] = useState(false);

  /* 录音 */
  // 显示录音
  const [showRecording, setShowRecording] = useState(false);
  const [cancelRecording, setCancelRecording] = useState(false);
  const extArr = {};

  const {
    startRecording,
    stopRecording,
    // togglePauseResume,
    recordingBlob,
    isRecording,
    // isPaused,
    recordingTime,
    // mediaRecorder
  } = useAudioRecorder();

  const audioRef = useRef(new Audio());
  const speakContent = (content: string | MultimodalContent[]) => {
    if (fetchSpeechLoading) return;
    setFetchSpeechLoading(true);

    let text = content;
    if (typeof content !== "string") {
      text = "";
      content.forEach((msg) => {
        if (msg.type == "text") {
          text += msg.text + "\n";
        }
      });
    }
    if (text) {
      text = (text as string).replaceAll("\n", " ");
      chatStore
        .audioSpeech(text, "tts-1", extArr)
        .then((url) => {
          audioRef.current.src = url;
          // 加 settimeout 是为了防止前面的字听不清
          setTimeout(() => {
            audioRef.current.play();
            setSpeaking(true);
          }, 500);
        })
        .catch((err) => {
          showToast(err);
        })
        .finally(() => {
          setFetchSpeechLoading(false);
        });
    }
  };
  const cancelSpeak = () => {
    audioRef.current.pause();
    setSpeaking(false);
  };

  useEffect(() => {
    const handler = () => {
      console.log("🚀 ~ 音频播放完毕 ~ ");
      setSpeaking(false);
    };
    audioRef.current.addEventListener("ended", handler);

    return () => {
      audioRef.current.removeEventListener("ended", handler);
    };
  }, []);

  useEffect(() => {
    if (cancelRecording) return;
    if (!recordingBlob) return;
    // recordingBlob will be present at this point after 'stopRecording' has been called

    setShowLoading(true);

    recordingBlob
      .arrayBuffer()
      .then((arrayBuffer) => copyAudioBlob(arrayBuffer))
      .then(([audioBuffer, frameCount]) => {
        const blob = convertAudioBufferToWave(audioBuffer, frameCount);

        const fileName = nanoid() + "." + blob.type.split(";")[0].split("/")[1];
        const file = new File([blob], fileName);
        console.log("🚀 ~ useEffect ~ file:", file);

        return file;
      })
      .then((file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("model", "whisper-1");

        const api = new ClientApi(ModelProvider.GPT);
        api.llm
          .audioTranscriptions(formData, accessStore.baseUrl ?? "")
          .then((res) => res!.json())
          .then((res) => {
            if (res.text) {
              // prosp.setUserInput?.(res.text);
              // setShowRecording(false);
              prosp.doSubmit?.(res.text);
            } else if (res.text === "") {
              showToast(Locale.Chat.Speech.ToTextEmpty);
            } else {
              showToast(Locale.Chat.Speech.ToTextError);
            }
          })
          .catch((err) => {
            showToast(err);
          })
          .finally(() => setShowLoading(false));
      })
      .catch((err) => {
        console.error("🚀 ~ conver audio to wav error ~ err:", err);
        showToast(`${Locale.Chat.Speech.ConverError}: ${err.toString()}`);
        setShowLoading(false);
      });
  }, [recordingBlob]);

  return {
    showLoading,

    /* 转语音 */
    speaking,
    setSpeaking,
    fetchSpeechLoading,
    setFetchSpeechLoading,
    speakContent,
    cancelSpeak,

    /* 录音 */
    showRecording,
    setShowRecording,
    isRecording,
    recordingBlob,
    recordingTime,
    startRecording,
    stopRecording,

    setCancelRecording,
  };
}

function _Chat(props: { promptStarters: string[] }) {
  type RenderMessage = ChatMessage & { preview?: boolean };

  const chatStore = useChatStore();
  const session = chatStore.currentSession();
  const config = useAppConfig();
  const fontSize = config.fontSize;

  const [showExport, setShowExport] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { submitKey, shouldSubmit } = useSubmitHandler();
  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrolledToBottom = scrollRef?.current
    ? Math.abs(
        scrollRef.current.scrollHeight -
          (scrollRef.current.scrollTop + scrollRef.current.clientHeight),
      ) <= 1
    : false;
  const { setAutoScroll, scrollDomToBottom } = useScrollToBottom(
    scrollRef,
    isScrolledToBottom,
  );
  const [hitBottom, setHitBottom] = useState(true);
  const isMobileScreen = useMobileScreen();
  const navigate = useNavigate();
  const location = useLocation();
  const currentModel = session.mask.modelConfig.model;

  // upload file
  const {
    uploadFiles,
    uploading,
    showUploadAction,
    setUploadFiles,
    dropUpload,
    pasteUpload,
    uploadImage,

    exAttr,
  } = useUploadFile({
    setAutoScroll,
  });

  const disabledSend = useMemo(() => {
    return !userInput && !uploadFiles.length;
  }, [userInput, uploadFiles]);

  // prompt hints
  const promptStore = usePromptStore();
  const [promptHints, setPromptHints] = useState<RenderPompt[]>([]);
  const onSearch = useDebouncedCallback(
    (text: string) => {
      const matchedPrompts = promptStore.search(text);
      setPromptHints(matchedPrompts);
    },
    100,
    { leading: true, trailing: true },
  );

  // auto grow input
  const [inputRows, setInputRows] = useState(1);
  const measure = useDebouncedCallback(
    () => {
      const rows = inputRef.current ? autoGrowTextArea(inputRef.current) : 1;
      const inputRows = Math.min(
        20,
        Math.max(0 + Number(!isMobileScreen), rows),
      );
      setInputRows(inputRows);
    },
    100,
    {
      leading: true,
      trailing: true,
    },
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(measure, [userInput]);

  // chat commands shortcuts
  const chatCommands = useChatCommand({
    new: () => chatStore.newSession(),
    newm: () => navigate(Path.NewChat + location.search),
    prev: () => chatStore.nextSession(-1),
    next: () => chatStore.nextSession(1),
    clear: () =>
      chatStore.updateCurrentSession(
        (session) => (session.clearContextIndex = session.messages.length),
      ),
    del: () => chatStore.deleteSession(chatStore.currentSessionIndex),
  });

  // only search prompts when user input is short
  const SEARCH_TEXT_LIMIT = 30;
  const onInput = (text: string) => {
    setUserInput(text);
    const n = text.trim().length;

    // clear search results
    if (n === 0) {
      setPromptHints([]);
    } else if (text.startsWith(ChatCommandPrefix)) {
      setPromptHints(chatCommands.search(text));
    } else if (!config.disablePromptHint && n < SEARCH_TEXT_LIMIT) {
      // check if need to trigger auto completion
      if (text.startsWith("/")) {
        let searchText = text.slice(1);
        onSearch(searchText);
      }
    }
  };

  const doSubmit = (userInput: string) => {
    if (userInput.trim() === "" && exAttr.uploadFiles.length === 0) return;

    const matchCommand = chatCommands.match(userInput);
    if (matchCommand.matched) {
      setUserInput("");
      setPromptHints([]);
      matchCommand.invoke();
      return;
    }
    setIsLoading(true);

    const resend = onResend as (messages: ChatMessage | ChatMessage[]) => void;

    chatStore
      .onUserInput(userInput, {
        retryCount: 0,
        onResend: resend,
        ...exAttr,
      })
      .then(() => setIsLoading(false));

    localStorage.setItem(LAST_INPUT_KEY, userInput);
    setUserInput("");
    setPromptHints([]);
    if (!isMobileScreen) inputRef.current?.focus();
    setAutoScroll(true);
  };

  const onPromptSelect = (prompt: RenderPompt) => {
    setTimeout(() => {
      setPromptHints([]);

      const matchedChatCommand = chatCommands.match(prompt.content);
      if (matchedChatCommand.matched) {
        // if user is selecting a chat command, just trigger it
        matchedChatCommand.invoke();
        setUserInput("");
      } else {
        // or fill the prompt
        setUserInput(prompt.content);
      }
      inputRef.current?.focus();
    }, 30);
  };

  // stop response
  const onUserStop = (messageId: string) => {
    ChatControllerPool.stop(session.id, messageId);
  };
  // stop all responses
  const [status, setStatus] = useState(0);
  const couldStop = ChatControllerPool.hasPending();
  const stopAll = () => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === "assistant") {
      onUserStop(lastMessage.id);
    } else {
      ChatControllerPool.stopAll();
    }
    setStatus(Math.random() * 10);
  };

  useEffect(() => {
    chatStore.updateCurrentSession((session) => {
      const stopTiming = Date.now() - REQUEST_TIMEOUT_MS;
      session.messages.forEach((m) => {
        // check if should stop all stale messages
        if (m.isError || new Date(m.date).getTime() < stopTiming) {
          if (m.streaming) {
            m.streaming = false;
          }

          if (m.content.length === 0) {
            m.isError = true;
            m.content = prettyObject({
              error: true,
              message: "empty response",
            });
          }
        }
      });

      // auto sync mask config from global config
      if (session.mask.syncGlobalConfig) {
        console.log("[Mask] syncing from global, name = ", session.mask.name);
        session.mask.modelConfig = { ...config.modelConfig };
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // check if should send message
  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // if ArrowUp and no userInput, fill with last input
    if (
      e.key === "ArrowUp" &&
      userInput.length <= 0 &&
      !(e.metaKey || e.altKey || e.ctrlKey)
    ) {
      setUserInput(localStorage.getItem(LAST_INPUT_KEY) ?? "");
      e.preventDefault();
      return;
    }
    if (
      shouldSubmit(e) &&
      promptHints.length === 0 &&
      (userInput.trim() || uploadFiles.length)
    ) {
      doSubmit(userInput);
      e.preventDefault();
    }
  };
  const onRightClick = (e: any, message: ChatMessage) => {
    // copy to clipboard
    if (selectOrCopy(e.currentTarget, getMessageTextContent(message))) {
      if (userInput.length === 0) {
        setUserInput(getMessageTextContent(message));
      }

      e.preventDefault();
    }
  };

  const deleteMessage = (msgId?: string) => {
    chatStore.updateCurrentSession(
      (session) =>
        (session.messages = session.messages.filter((m) => m.id !== msgId)),
    );
  };

  const onDelete = (msgId: string) => {
    deleteMessage(msgId);
  };

  const onResend = (message: ChatMessage) => {
    console.warn("🚀 ~ onResend ~ message:", message);
    // when it is resending a message
    // 1. for a user's message, find the next bot response
    // 2. for a bot's message, find the last user's input
    // 3. delete original user input and bot's message
    // 4. resend the user's input

    const resendingIndex = session.messages.findIndex(
      (m) => m.id === message.id,
    );

    if (resendingIndex < 0 || resendingIndex >= session.messages.length) {
      console.error("[Chat] failed to find resending message", message);
      return;
    }

    let userMessage: ChatMessage | undefined;
    let botMessage: ChatMessage | undefined;

    if (message.role === "assistant") {
      // if it is resending a bot's message, find the user input for it
      botMessage = message;
      for (let i = resendingIndex; i >= 0; i -= 1) {
        if (session.messages[i].role === "user") {
          userMessage = session.messages[i];
          break;
        }
      }
    } else if (message.role === "user") {
      // if it is resending a user's input, find the bot's response
      userMessage = message;
      for (let i = resendingIndex; i < session.messages.length; i += 1) {
        if (session.messages[i].role === "assistant") {
          botMessage = session.messages[i];
          break;
        }
      }
    }

    if (userMessage === undefined) {
      console.error("[Chat] failed to resend", message);
      return;
    }

    // delete the original messages
    deleteMessage(userMessage.id);
    deleteMessage(botMessage?.id);

    if (userMessage && userMessage.retryCount == undefined) {
      userMessage.retryCount = 0;
    }

    const chatOption: ExtAttr = {
      retryCount: userMessage.retryCount,
      ...exAttr,
    };
    if (userMessage.retryCount! < 1) {
      chatOption.onResend = onResend as (
        messages: ChatMessage | ChatMessage[],
      ) => void;
    }

    // resend the message
    setIsLoading(true);
    chatStore
      .onUserInput(userMessage.content, chatOption)
      .then(() => setIsLoading(false));
    inputRef.current?.focus();
  };

  const onPinMessage = (message: ChatMessage) => {
    chatStore.updateCurrentSession((session) =>
      session.mask.context.push(message),
    );

    showToast(Locale.Chat.Actions.PinToastContent, {
      text: Locale.Chat.Actions.PinToastAction,
      onClick: () => {
        setShowPromptModal(true);
      },
    });
  };

  const context: RenderMessage[] = useMemo(() => {
    return session.mask.hideContext ? [] : session.mask.context.slice();
  }, [session.mask.context, session.mask.hideContext]);
  const accessStore = useAccessStore();

  if (
    context.length === 0 &&
    session.messages.at(0)?.content !== BOT_HELLO.content
  ) {
    console.warn(session.mask.botHelloContent);

    const botHello = {
      ...BOT_HELLO,
      content: session.mask.botHelloContent ?? BOT_HELLO.content,
    } as ChatMessage;
    const copiedHello = Object.assign({}, botHello);

    /* fix: 第一次打开聊天机器人提示要填key */
    // if (!accessStore.isAuthorized()) {
    //   copiedHello.content = Locale.Error.Unauthorized;
    // }
    context.push(copiedHello);
  }

  // preview messages
  const renderMessages = useMemo(() => {
    return context
      .concat(session.messages as RenderMessage[])
      .concat(
        isLoading
          ? [
              {
                ...createMessage({
                  role: "assistant",
                  content: "……",
                }),
                preview: true,
              },
            ]
          : [],
      )
      .concat(
        userInput.length > 0 && config.sendPreviewBubble
          ? [
              {
                ...createMessage({
                  role: "user",
                  content: userInput,
                }),
                preview: true,
              },
            ]
          : [],
      );
  }, [
    config.sendPreviewBubble,
    context,
    isLoading,
    session.messages,
    userInput,
  ]);

  const [msgRenderIndex, _setMsgRenderIndex] = useState(
    Math.max(0, renderMessages.length - CHAT_PAGE_SIZE),
  );
  function setMsgRenderIndex(newIndex: number) {
    newIndex = Math.min(renderMessages.length - CHAT_PAGE_SIZE, newIndex);
    newIndex = Math.max(0, newIndex);
    _setMsgRenderIndex(newIndex);
  }

  const messages = useMemo(() => {
    const endRenderIndex = Math.min(
      msgRenderIndex + 3 * CHAT_PAGE_SIZE,
      renderMessages.length,
    );
    return renderMessages.slice(msgRenderIndex, endRenderIndex);
  }, [msgRenderIndex, renderMessages]);

  const onChatBodyScroll = (e: HTMLElement) => {
    const bottomHeight = e.scrollTop + e.clientHeight;
    const edgeThreshold = e.clientHeight;

    const isTouchTopEdge = e.scrollTop <= edgeThreshold;
    const isTouchBottomEdge = bottomHeight >= e.scrollHeight - edgeThreshold;
    const isHitBottom =
      bottomHeight >= e.scrollHeight - (isMobileScreen ? 4 : 10);

    const prevPageMsgIndex = msgRenderIndex - CHAT_PAGE_SIZE;
    const nextPageMsgIndex = msgRenderIndex + CHAT_PAGE_SIZE;

    if (isTouchTopEdge && !isTouchBottomEdge) {
      setMsgRenderIndex(prevPageMsgIndex);
    } else if (isTouchBottomEdge) {
      setMsgRenderIndex(nextPageMsgIndex);
    }

    setHitBottom(isHitBottom);
    setAutoScroll(isHitBottom);
  };
  function scrollToBottom() {
    setMsgRenderIndex(renderMessages.length - CHAT_PAGE_SIZE);
    scrollDomToBottom();
  }

  // clear context index = context length + index in messages
  const clearContextIndex =
    (session.clearContextIndex ?? -1) >= 0
      ? session.clearContextIndex! + context.length - msgRenderIndex
      : -1;

  const [showPromptModal, setShowPromptModal] = useState(false);

  const clientConfig = useMemo(() => getClientConfig(), []);

  const autoFocus = !isMobileScreen; // wont auto focus on mobile screen
  const showMaxIcon = !isMobileScreen && !clientConfig?.isApp;

  const promptStarters = useMemo(() => {
    const maskPromptStarters = chatStore.currentSession().mask.promptStarters;
    if (config.isGpts) {
      return props.promptStarters;
    } else {
      return maskPromptStarters ?? [];
    }
  }, [props.promptStarters, chatStore, config.isGpts]);

  const {
    showLoading,

    speaking,
    fetchSpeechLoading,
    cancelSpeak,
    speakContent,

    showRecording,
    setShowRecording,
    isRecording,
    recordingTime,
    startRecording,
    stopRecording,
    setCancelRecording,
  } = useSpeakAndVoice({
    doSubmit: doSubmit,
    setUserInput: setUserInput,
  });

  useCommand({
    fill: setUserInput,
    submit: (text) => {
      doSubmit(text);
    },
    code: (text) => {
      if (accessStore.disableFastLink) return;
      console.log("[Command] got code from url: ", text);
      showConfirm(Locale.URLCommand.Code + `code = ${text}`).then((res) => {
        if (res) {
          accessStore.update((access) => (access.accessCode = text));
        }
      });
    },
    settings: (text) => {
      if (accessStore.disableFastLink) return;

      try {
        const payload = JSON.parse(text) as {
          key?: string;
          url?: string;
        };

        console.log("[Command] got settings from url: ", payload);

        if (payload.key || payload.url) {
          if (payload.key) {
            accessStore.update(
              (access) => (access.openaiApiKey = payload.key!),
            );
          }
          if (payload.url) {
            accessStore.update((access) => (access.openaiUrl = payload.url!));
          }

          // showConfirm(
          //   Locale.URLCommand.Settings +
          //     `\n${JSON.stringify(payload, null, 4)}`,
          // ).then((res) => {
          //   if (!res) return;
          //   if (payload.key) {
          //     accessStore.update(
          //       (access) => (access.openaiApiKey = payload.key!),
          //     );
          //   }
          //   if (payload.url) {
          //     accessStore.update((access) => (access.openaiUrl = payload.url!));
          //   }
          // });
        }
      } catch {
        console.error("[Command] failed to get settings from url: ", text);
      }
    },
  });

  // edit / insert message modal
  const [isEditingMessage, setIsEditingMessage] = useState(false);

  const { getRootProps } = useDropzone();
  // drag/drop
  useEffect(() => {
    const dp = document.body;

    function handleDrop(e: any) {
      e.stopPropagation();
      //阻止浏览器默认打开文件的操作
      e.preventDefault();
      const files = e.dataTransfer.files;

      dropUpload(files);
    }

    //多图上传
    dp?.addEventListener("drop", handleDrop);

    return () => {
      dp?.removeEventListener("drop", handleDrop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // paste event
  useEffect(() => {
    function handleParse(event: any) {
      var items = (event.clipboardData || window.clipboardData).items;
      var file = null;
      if (items && items.length) {
        // 搜索剪切板items
        for (var i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            file = items[i].getAsFile();
            break;
          }
        }
      } else {
        console.log("当前浏览器不支持");
        return;
      }
      if (!file) {
        console.log("粘贴内容非图片");
        return;
      }

      pasteUpload(file);
    }

    document.addEventListener("paste", handleParse);
    return () => {
      document.removeEventListener("paste", handleParse);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // remember unfinished input
  useEffect(() => {
    // try to load from local storage
    const key = UNFINISHED_INPUT(session.id);
    const mayBeUnfinishedInput = localStorage.getItem(key);
    if (mayBeUnfinishedInput && userInput.length === 0) {
      setUserInput(mayBeUnfinishedInput);
      localStorage.removeItem(key);
    }

    const dom = inputRef.current;
    return () => {
      localStorage.setItem(key, dom?.value ?? "");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={styles.chat} key={session.id}>
      <div
        className={`window-header ${styles["chat-window-header"]}`}
        data-tauri-drag-region
      >
        {isMobileScreen && (
          <div
            className={`window-actions ${styles["chat-window-actions"]} ${styles["chat-window-actions-left"]}`}
          >
            <div className={"window-action-button"}>
              <IconButton
                icon={<ReturnIcon />}
                bordered
                title={Locale.Chat.Actions.ChatList}
                onClick={() => navigate(Path.Home + location.search)}
              />
            </div>
          </div>
        )}

        <div className={`window-header-title ${styles["chat-body-title"]}`}>
          <div
            className={`window-header-main-title ${styles["chat-body-main-title"]}`}
            onClickCapture={() => setIsEditingMessage(true)}
          >
            {!session.topic ? DEFAULT_TOPIC : session.topic}
          </div>
          {!isMobileScreen && (
            <div className="window-header-sub-title">
              {Locale.Chat.SubTitle(session.messages.length)}
            </div>
          )}
        </div>
        <div
          className={`window-actions ${styles["chat-window-actions"]}  ${styles["chat-window-actions-right"]}`}
        >
          {!isMobileScreen && (
            <div className="window-action-button">
              <IconButton
                icon={<RenameIcon />}
                bordered
                onClick={() => setIsEditingMessage(true)}
              />
            </div>
          )}
          <div className="window-action-button">
            <IconButton
              icon={<ExportIcon />}
              bordered
              title={Locale.Chat.Actions.Export}
              onClick={() => {
                setShowExport(true);
              }}
            />
          </div>
          {showMaxIcon && (
            <div className="window-action-button">
              <IconButton
                icon={config.tightBorder ? <MinIcon /> : <MaxIcon />}
                bordered
                onClick={() => {
                  config.update(
                    (config) => (config.tightBorder = !config.tightBorder),
                  );
                }}
              />
            </div>
          )}
        </div>

        <PromptToast
          showToast={false}
          showModal={showPromptModal}
          setShowModal={setShowPromptModal}
        />
      </div>

      <div
        className={styles["chat-body"]}
        ref={scrollRef}
        onScroll={(e) => onChatBodyScroll(e.currentTarget)}
        onMouseDown={() => inputRef.current?.blur()}
        onTouchStart={() => {
          inputRef.current?.blur();
          setAutoScroll(false);
        }}
      >
        {messages.map((message, i) => {
          const isUser = message.role === "user";
          const isContext = i < context.length;
          const showActions =
            i > 0 &&
            !(message.preview || message.content.length === 0) &&
            !isContext;
          const showTyping = message.preview || message.streaming;

          const shouldShowClearContextDivider = i === clearContextIndex - 1;

          return (
            <Fragment key={message.id}>
              <div
                className={`${
                  isUser ? styles["chat-message-user"] : styles["chat-message"]
                } ${message.isError ? `${styles["chat-message-error"]}` : ""}`}
              >
                <div className={styles["chat-message-container"]}>
                  <div className={styles["chat-message-header"]}>
                    <div className={styles["chat-message-avatar"]}>
                      <div className={styles["chat-message-edit"]}>
                        <IconButton
                          icon={<EditIcon />}
                          onClick={async () => {
                            let inputContent = message.content;
                            if (message.content instanceof Array) {
                              inputContent = "";
                              message.content.forEach((item) => {
                                if (item.type == "text") {
                                  inputContent = item.text as string;
                                }
                              });
                            }

                            const newMessage = await showPrompt(
                              Locale.Chat.Actions.Edit,
                              inputContent as string,
                              10,
                            );
                            chatStore.updateCurrentSession((session) => {
                              const m = session.mask.context
                                .concat(session.messages)
                                .find((m) => m.id === message.id);
                              if (m) {
                                if (m.content instanceof Array) {
                                  const newContent: MultimodalContent[] = [];
                                  newContent.push({
                                    type: "text",
                                    text: newMessage,
                                  });
                                  m.content.forEach((item) => {
                                    if (item.type != "text") {
                                      newContent.push(item);
                                    }
                                  });
                                  m.content = newContent;
                                } else {
                                  m.content = newMessage;
                                }
                                // m.content = newContent;
                              }
                            });
                          }}
                        ></IconButton>
                      </div>
                      {isUser ? (
                        <Avatar avatar={config.avatar} />
                      ) : (
                        <>
                          {["system"].includes(message.role) ? (
                            <Avatar avatar="2699-fe0f" />
                          ) : (
                            <MaskAvatar
                              avatar={session.mask.avatar}
                              model={
                                message.model ||
                                (session.mask.modelConfig.model as ModelType)
                              }
                            />
                          )}
                        </>
                      )}
                    </div>

                    {showActions && (
                      <div className={styles["chat-message-actions"]}>
                        <div className={styles["chat-input-actions"]}>
                          {message.streaming ? (
                            <ChatAction
                              text={Locale.Chat.Actions.Stop}
                              icon={<PauseIcon />}
                              onClick={() => onUserStop(message.id ?? i)}
                            />
                          ) : (
                            <>
                              <ChatAction
                                text={Locale.Chat.Actions.Retry}
                                icon={<ResetIcon />}
                                onClick={() => onResend(message)}
                              />

                              <ChatAction
                                text={Locale.Chat.Actions.Delete}
                                icon={<DeleteIcon />}
                                onClick={() => onDelete(message.id ?? i)}
                              />

                              <ChatAction
                                text={Locale.Chat.Actions.Pin}
                                icon={<PinIcon />}
                                onClick={() => onPinMessage(message)}
                              />
                              <ChatAction
                                text={Locale.Chat.Actions.Copy}
                                icon={<CopyIcon />}
                                onClick={() =>
                                  copyToClipboard(
                                    getMessageTextContent(message),
                                  )
                                }
                              />
                              {config.openTTS && (
                                <ChatAction
                                  text={
                                    fetchSpeechLoading
                                      ? "Load"
                                      : speaking
                                        ? Locale.Chat.Actions.Stop
                                        : Locale.Chat.Actions.Speek
                                  }
                                  icon={
                                    fetchSpeechLoading ? (
                                      <LoadingOutlined />
                                    ) : speaking ? (
                                      <PauseIcon />
                                    ) : (
                                      <SpeakIcon />
                                    )
                                  }
                                  onClick={() => {
                                    speaking
                                      ? cancelSpeak()
                                      : speakContent(message.content);
                                  }}
                                />
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {!isUser &&
                    message.toolMessages &&
                    message.toolMessages.map((tool, index) => (
                      <div
                        className={styles["chat-message-tools-status"]}
                        key={index}
                      >
                        <div className={styles["chat-message-tools-name"]}>
                          <CheckmarkIcon
                            className={styles["chat-message-checkmark"]}
                          />
                          {tool.toolName}:
                          <code
                            className={styles["chat-message-tools-details"]}
                          >
                            {tool.toolInput}
                          </code>
                        </div>
                      </div>
                    ))}

                  {showTyping && (
                    <div className={styles["chat-message-status"]}>
                      {Locale.Chat.Typing}
                    </div>
                  )}
                  <div className={styles["chat-message-item-container"]}>
                    <div className={styles["chat-message-item"]}>
                      <Markdown
                        content={message.content}
                        loading={
                          (message.preview || message.streaming) &&
                          message.content.length === 0 &&
                          !isUser
                        }
                        onContextMenu={(e) => onRightClick(e, message)}
                        onDoubleClickCapture={() => {
                          if (!isMobileScreen) return;
                          setUserInput(getMessageTextContent(message));
                        }}
                        fontSize={fontSize}
                        parentRef={scrollRef}
                        defaultShow={i >= messages.length - 6}
                      />
                      {getMessageImages(message).length > 0 && (
                        <div
                          className={`${styles["chat-message-item-images"]} ${isUser && styles["chat-message-item-images-user"]}`}
                          style={
                            {
                              "--image-count": getMessageImages(message).length,
                            } as React.CSSProperties
                          }
                        >
                          {getMessageImages(message).map((image, index) => {
                            return (
                              <Image
                                className={
                                  styles["chat-message-item-image-multi"]
                                }
                                key={index}
                                src={image}
                                alt=""
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className={styles["chat-message-action-date"]}>
                      {isContext
                        ? Locale.Chat.IsContext
                        : message.date.toLocaleString()}
                    </div>

                    {!isUser &&
                      (message.isError || message.isTimeoutAborted) && (
                        <div className={styles["chat-message-retry"]}>
                          <div className={styles["chat-input-actions"]}>
                            <ChatAction
                              text=""
                              icon={<ResetIcon2 />}
                              onClick={() => {
                                message.retryCount = 0;
                                onResend(message);
                              }}
                            />
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
              {shouldShowClearContextDivider && <ClearContextDivider />}
            </Fragment>
          );
        })}

        {promptStarters.length > 0 &&
          messages.length === 1 &&
          context.length === 1 && (
            <ul className={styles["chat-prompt-list"]}>
              {promptStarters.map((item, index) => (
                <li
                  key={index}
                  className={styles["chat-prompt-list-item"]}
                  onClick={() => {
                    doSubmit(item);
                  }}
                >
                  <Typography.Text>{item}</Typography.Text>
                </li>
              ))}
            </ul>
          )}
      </div>

      <div
        id="chatInputPanel"
        {...getRootProps}
        className={styles["chat-input-panel"]}
      >
        <PromptHints prompts={promptHints} onPromptSelect={onPromptSelect} />

        {uploadFiles.length != 0 && (
          <div className={styles["attach-images"]}>
            {uploadFiles.map((item, index) => {
              let ext = mime.getExtension(item.type!);
              if (!ext) {
                ext = item.name!.substring(item.name!.lastIndexOf(".") + 1);
              }

              return (
                <div key={index}>
                  <div className={styles["attach-image-item"]}>
                    <div className={styles["attach-image-wrap"]}>
                      {isImage(item.type!) ? (
                        <div
                          className={styles["attach-image"]}
                          style={{
                            backgroundImage: `url("${item.response.base64}")`,
                            backgroundRepeat: "no-repeat",
                          }}
                        ></div>
                      ) : (
                        <FileIcon style={{ margin: "8px" }} />
                      )}
                    </div>
                    {!isImage(item.type!) && (
                      <div className={styles["attach-info"]}>
                        <h5 className={styles["attach-title"]}>{item.name}</h5>
                        <p className={styles["attach-ext"]}>
                          {ext.toLocaleUpperCase()}
                        </p>
                      </div>
                    )}
                    <div className={styles["attach-image-mask"]}>
                      <DeleteImageButton
                        deleteImage={() => {
                          setUploadFiles(
                            uploadFiles.filter((_, i) => i !== index),
                          );
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div
          className={`${styles["chat-input-panel-inner"]} ${
            uploadFiles.length != 0
              ? styles["chat-input-panel-inner-attach"]
              : ""
          }`}
        >
          {showUploadAction && (
            <ChatAction
              onClick={() => {
                if (uploading || isRecording) {
                  return;
                }
                uploadImage();
              }}
              text=""
              disabled={uploading || isRecording}
              className={styles["chat-input-attach"]}
              icon={uploading ? <LoadingButtonIcon /> : <AttachIcon />}
            />
          )}
          {showRecording ? (
            <div
              className={`${styles["chat-input"]} ${styles["chat-input-recording"]}`}
            >
              <span
                className={styles["chat-input-recording-button"]}
                onClick={() => {
                  if (isRecording) {
                    // 正在录音
                    // 提交录音
                    setCancelRecording(false);
                    stopRecording();
                  } else {
                    // 开始录音
                    setCancelRecording(false);
                    startRecording();
                  }
                }}
              >
                {isRecording
                  ? `${Locale.Chat.Speech.StopSpeaking}(${recordingTime}s)`
                  : Locale.Chat.Speech.StartSpeaking}
              </span>
            </div>
          ) : (
            <textarea
              id="chat-input"
              ref={inputRef}
              className={styles["chat-input"]}
              placeholder={Locale.Chat.Input(submitKey)}
              onInput={(e) => onInput(e.currentTarget.value)}
              value={userInput}
              onKeyDown={onInputKeyDown}
              onFocus={scrollToBottom}
              onClick={scrollToBottom}
              rows={inputRows}
              autoFocus={autoFocus}
              style={{
                fontSize: config.fontSize,
              }}
            />
          )}

          {config.openTTS && !showRecording && (
            <IconButton
              text=""
              icon={<VoiceIcon />}
              key="voice"
              onClick={() => {
                setShowRecording(true);
              }}
              className={styles["chat-input-voice"]}
            />
          )}

          {couldStop ? (
            <ChatAction
              icon={<StopIcon />}
              text=""
              className={styles["chat-input-pause"]}
              onClick={stopAll}
            />
          ) : showRecording ? ( // 显示 开始说话 ? 👇 : 发送
            isRecording ? ( // 正在说话 ? 显示 x : 键盘
              <ChatAction
                icon={<CloseOutlined />}
                text=""
                className={styles["chat-recording-stop"]}
                onClick={() => {
                  setCancelRecording(true);
                  stopRecording();
                }}
              />
            ) : (
              <ChatAction
                icon={<KeyboardIcon />}
                text=""
                key="keyboard"
                className={styles["chat-recording-keyboard"]}
                onClick={() => setShowRecording(false)}
              />
            )
          ) : (
            <ChatAction
              icon={<SendIcon />}
              text=""
              disabled={disabledSend}
              className={styles["chat-input-send"]}
              onClick={() => {
                if (disabledSend) return;
                doSubmit(userInput);
              }}
            />
          )}
        </div>

        <div className={styles["chat-tips"]}>{Locale.Chat.Tips}</div>
      </div>

      {showExport && (
        <ExportMessageModal onClose={() => setShowExport(false)} />
      )}

      {isEditingMessage && (
        <EditMessageModal
          onClose={() => {
            setIsEditingMessage(false);
          }}
        />
      )}

      {showLoading && <ShowLoading tip={Locale.Chat.InputActions.Waiting} />}
    </div>
  );
}

export function Chat(props: { promptStarters: string[] }) {
  const chatStore = useChatStore();
  const sessionIndex = chatStore.currentSessionIndex;
  return (
    <_Chat key={sessionIndex} promptStarters={props.promptStarters}></_Chat>
  );
}
