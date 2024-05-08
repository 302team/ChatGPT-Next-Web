import { useState, useEffect, useMemo, CSSProperties } from "react";

import styles from "./settings.module.scss";

import ResetIcon from "../icons/reload.svg";
import AddIcon from "../icons/add.svg";
import CloseIcon from "../icons/close.svg";
import CopyIcon from "../icons/copy.svg";
import ClearIcon from "../icons/clear.svg";
import LoadingIcon from "../icons/three-dots.svg";
import EditIcon from "../icons/edit.svg";
import EyeIcon from "../icons/eye.svg";
import DownloadIcon from "../icons/download.svg";
import UploadIcon from "../icons/upload.svg";
import ConfigIcon from "../icons/config.svg";
import ConfirmIcon from "../icons/confirm.svg";

import ConnectionIcon from "../icons/connection.svg";
import CloudSuccessIcon from "../icons/cloud-success.svg";
import CloudFailIcon from "../icons/cloud-fail.svg";

import {
  List,
  ListItem,
  Modal,
  PasswordInput,
  Input as TextareaInput,
  Popover,
  Select,
  showConfirm,
  showToast,
} from "./ui-lib";

import { IconButton } from "./button";
import {
  SubmitKey,
  useChatStore,
  Theme,
  useAccessStore,
  useAppConfig,
} from "../store";

import Locale, {
  AllLangs,
  ALL_LANG_OPTIONS,
  changeLang,
  getLang,
} from "../locales";
import {
  computedUsedStorage,
  copyToClipboard,
  formatDate,
  useMobileScreen,
} from "../utils";
import { FontSize, Path, STORAGE_KEY } from "../constant";
import { usePromptStore } from "../store/prompt";
import { SystemPrompt, useSysPromptStore } from "../store/sys-prompt";
import { ErrorBoundary } from "./error";
import { useNavigate, useLocation } from "react-router-dom";
import { Avatar, AvatarPicker } from "./emoji";
import { getClientConfig } from "../config/client";
import { SyncRecordItem, useSyncStore } from "../store/sync";
import { useMaskStore } from "../store/mask";
import { ProviderType } from "../utils/cloud";
import { Button, Space, Input, List as AList, Divider } from "antd";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusCircleOutlined,
} from "@ant-design/icons";
import { nanoid } from "nanoid";

function DangerItems() {
  const chatStore = useChatStore();
  const appConfig = useAppConfig();

  return (
    <List>
      <ListItem
        title={Locale.Settings.Danger.Reset.Title}
        subTitle={Locale.Settings.Danger.Reset.SubTitle}
      >
        <IconButton
          text={Locale.Settings.Danger.Reset.Action}
          onClick={async () => {
            if (await showConfirm(Locale.Settings.Danger.Reset.Confirm)) {
              appConfig.reset();
            }
          }}
          type="danger"
        />
      </ListItem>
      <ListItem
        title={Locale.Settings.Danger.Clear.Title}
        subTitle={Locale.Settings.Danger.Clear.SubTitle}
      >
        <IconButton
          text={Locale.Settings.Danger.Clear.Action}
          onClick={async () => {
            if (await showConfirm(Locale.Settings.Danger.Clear.Confirm)) {
              chatStore.clearAllData();
            }
          }}
          type="danger"
        />
      </ListItem>
    </List>
  );
}

function CheckButton() {
  const syncStore = useSyncStore();

  const couldCheck = useMemo(() => {
    return syncStore.cloudSync();
  }, [syncStore]);

  const [checkState, setCheckState] = useState<
    "none" | "checking" | "success" | "failed"
  >("none");

  async function check() {
    setCheckState("checking");
    const valid = await syncStore.check();
    setCheckState(valid ? "success" : "failed");
  }

  if (!couldCheck) return null;

  return (
    <IconButton
      text={Locale.Settings.Sync.Config.Modal.Check}
      bordered
      onClick={check}
      icon={
        checkState === "none" ? (
          <ConnectionIcon />
        ) : checkState === "checking" ? (
          <LoadingIcon />
        ) : checkState === "success" ? (
          <CloudSuccessIcon />
        ) : checkState === "failed" ? (
          <CloudFailIcon />
        ) : (
          <ConnectionIcon />
        )
      }
    ></IconButton>
  );
}

function SyncConfigModal(props: { onClose?: () => void }) {
  const syncStore = useSyncStore();

  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Sync.Config.Modal.Title}
        onClose={() => props.onClose?.()}
        actions={[
          <CheckButton key="check" />,
          <IconButton
            key="confirm"
            onClick={props.onClose}
            icon={<ConfirmIcon />}
            bordered
            text={Locale.UI.Confirm}
          />,
        ]}
      >
        <List>
          <ListItem
            title={Locale.Settings.Sync.Config.SyncType.Title}
            subTitle={Locale.Settings.Sync.Config.SyncType.SubTitle}
          >
            <select
              value={syncStore.provider}
              onChange={(e) => {
                syncStore.update(
                  (config) =>
                    (config.provider = e.target.value as ProviderType),
                );
              }}
            >
              {Object.entries(ProviderType).map(([k, v]) => (
                <option value={v} key={k}>
                  {k}
                </option>
              ))}
            </select>
          </ListItem>

          <ListItem
            title={Locale.Settings.Sync.Config.Proxy.Title}
            subTitle={Locale.Settings.Sync.Config.Proxy.SubTitle}
          >
            <input
              type="checkbox"
              checked={syncStore.useProxy}
              onChange={(e) => {
                syncStore.update(
                  (config) => (config.useProxy = e.currentTarget.checked),
                );
              }}
            ></input>
          </ListItem>
          {syncStore.useProxy ? (
            <ListItem
              title={Locale.Settings.Sync.Config.ProxyUrl.Title}
              subTitle={Locale.Settings.Sync.Config.ProxyUrl.SubTitle}
            >
              <input
                type="text"
                value={syncStore.proxyUrl}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.proxyUrl = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
          ) : null}
        </List>

        {syncStore.provider === ProviderType.WebDAV && (
          <>
            <List>
              <ListItem title={Locale.Settings.Sync.Config.WebDav.Endpoint}>
                <input
                  type="text"
                  value={syncStore.webdav.endpoint}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.endpoint = e.currentTarget.value),
                    );
                  }}
                ></input>
              </ListItem>

              <ListItem title={Locale.Settings.Sync.Config.WebDav.UserName}>
                <input
                  type="text"
                  value={syncStore.webdav.username}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.username = e.currentTarget.value),
                    );
                  }}
                ></input>
              </ListItem>
              <ListItem title={Locale.Settings.Sync.Config.WebDav.Password}>
                <PasswordInput
                  value={syncStore.webdav.password}
                  onChange={(e) => {
                    syncStore.update(
                      (config) =>
                        (config.webdav.password = e.currentTarget.value),
                    );
                  }}
                ></PasswordInput>
              </ListItem>
            </List>
          </>
        )}

        {syncStore.provider === ProviderType.UpStash && (
          <List>
            <ListItem title={Locale.Settings.Sync.Config.UpStash.Endpoint}>
              <input
                type="text"
                value={syncStore.upstash.endpoint}
                onChange={(e) => {
                  syncStore.update(
                    (config) =>
                      (config.upstash.endpoint = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>

            <ListItem title={Locale.Settings.Sync.Config.UpStash.UserName}>
              <input
                type="text"
                value={syncStore.upstash.username}
                placeholder={STORAGE_KEY}
                onChange={(e) => {
                  syncStore.update(
                    (config) =>
                      (config.upstash.username = e.currentTarget.value),
                  );
                }}
              ></input>
            </ListItem>
            <ListItem title={Locale.Settings.Sync.Config.UpStash.Password}>
              <PasswordInput
                value={syncStore.upstash.apiKey}
                onChange={(e) => {
                  syncStore.update(
                    (config) => (config.upstash.apiKey = e.currentTarget.value),
                  );
                }}
              ></PasswordInput>
            </ListItem>
          </List>
        )}
      </Modal>
    </div>
  );
}

function LogsModal(props: {
  onClose?: () => void;
  logs: SyncRecordItem[];
  loading: boolean;
  download: (index: number) => void;
}) {
  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Sync.Logs}
        onClose={() => props.onClose?.()}
      >
        <AList
          size="large"
          dataSource={props.logs}
          itemLayout="horizontal"
          renderItem={(item, index) => (
            <AList.Item>
              <AList.Item.Meta
                title={formatDate(
                  new Date(item.timestamp),
                  "YYYY-MM-DD hh:mm:ss",
                )}
                description={item.device}
              />
              <div>
                <Button
                  onClick={() => {
                    props.download(index);
                    props.onClose?.();
                  }}
                >
                  {Locale.Settings.Sync.Actions.Download}
                </Button>
              </div>
            </AList.Item>
          )}
        />
      </Modal>
    </div>
  );
}

function SyncItems() {
  // const appConfig = useAppConfig();
  const syncStore = useSyncStore();
  const isMobileScreen = useMobileScreen();

  const [syncFromCloudPwd, setSyncFromCloudPwd] = useState(
    syncStore.syncPassword,
  );
  const [readonlySyncFromCloudPwd, setReadonlySyncFromCloudPwd] =
    useState(false);

  useEffect(() => {
    setSyncFromCloudPwd(syncStore.syncPassword);
    // 如果已经同步过记录, 从云端下载 的密码输入框为只读
    setReadonlySyncFromCloudPwd(!!syncStore.syncPassword);
  }, [syncStore.syncPassword]);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleUpload = async () => {
    setUploading(true);

    syncStore.upload().finally(() => {
      setUploading(false);
    });
  };

  const handleDownload = () => {
    if (!syncFromCloudPwd) {
      return showToast(Locale.Settings.Sync.EmptyPwd);
    }
    if (downloading) return;

    setDownloading(true);
    syncStore.download(syncFromCloudPwd).finally(() => {
      setDownloading(false);
    });
  };

  const [showLogsModal, setShowLogsModal] = useState(false);

  return (
    <>
      <List>
        {/* 上传到云端 */}
        <ListItem
          title={Locale.Settings.Sync.SyncToCloud.Title}
          subTitle={Locale.Settings.Sync.SyncToCloud.SubTitle}
          className={`${isMobileScreen ? styles["list-item-column"] : ""}`}
        >
          <div className={styles["list-item-right"]}>
            <div style={{ position: "relative" }}>
              <Input
                type="tel"
                readOnly
                disabled
                value={syncStore.syncPassword}
                className={styles["input"]}
                style={{ width: "100px" }}
              />
              <div
                className={styles["sync-pwd-mask"]}
                onClick={() =>
                  syncStore.syncPassword &&
                  copyToClipboard(syncStore.syncPassword)
                }
              ></div>
            </div>
            <Button loading={uploading} onClick={handleUpload}>
              {Locale.Settings.Sync.Actions.Upload}
            </Button>
          </div>
        </ListItem>

        {/* 从云端下载 */}
        <ListItem
          title={Locale.Settings.Sync.SyncFromCloud.Title}
          subTitle={Locale.Settings.Sync.SyncFromCloud.SubTitle}
          className={`${isMobileScreen ? styles["list-item-column"] : ""}`}
        >
          <Space className={styles["list-item-right"]}>
            {syncStore.syncRecordList.length > 0 && (
              <Button
                type="text"
                icon={<ClockCircleOutlined />}
                onClick={() => {
                  setShowLogsModal(true);

                  setDownloading(true);
                  syncStore.getLogs(syncStore.syncPassword).finally(() => {
                    setDownloading(false);
                  });
                }}
              ></Button>
            )}

            <Input
              type="tel"
              value={syncFromCloudPwd}
              className={styles["input"]}
              style={{ width: "100px" }}
              readOnly={readonlySyncFromCloudPwd}
              onInput={(e) => {
                setSyncFromCloudPwd(e.currentTarget.value);
              }}
            />
            <Button loading={downloading} onClick={handleDownload}>
              {Locale.Settings.Sync.Actions.Download}
            </Button>
          </Space>
        </ListItem>
      </List>

      {showLogsModal && (
        <LogsModal
          logs={syncStore.syncRecordList}
          loading={downloading}
          download={(index: number) => {
            syncStore.downloadFromIndex(index);
          }}
          onClose={() => {
            setShowLogsModal(false);
          }}
        />
      )}
    </>
  );
}

function SystemPromptsModal(props: {
  list: Array<SystemPrompt>;
  onClose?: () => void;
  onAdd: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="modal-mask">
      <Modal
        title={Locale.Settings.Sync.PromptActions.Title}
        onClose={() => props.onClose?.()}
      >
        <Divider style={{ marginTop: 0 }}>
          <Button
            type="text"
            icon={<PlusCircleOutlined />}
            onClick={() => props.onAdd()}
          >
            {Locale.Settings.Sync.PromptActions.Add}
          </Button>
        </Divider>
        <AList
          size="small"
          bordered
          dataSource={props.list}
          itemLayout="horizontal"
          renderItem={(item, index) => (
            <AList.Item>
              <AList.Item.Meta
                title={formatDate(
                  new Date(item.createdAt),
                  "YYYY-MM-DD hh:mm:ss",
                )}
                description={item.content}
              />
              <div>
                <Space>
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => {
                      props.onEdit(item.id);
                    }}
                  ></Button>
                  <Button
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      props.onDelete(item.id);
                    }}
                  ></Button>
                </Space>
              </div>
            </AList.Item>
          )}
        />
      </Modal>
    </div>
  );
}

function EditSystemPromptModal(props: {
  type: "create" | "edit";
  prompt: SystemPrompt | undefined;
  onConfirm: (content: string) => void;
  onClose?: () => void;
}) {
  const [content, setContent] = useState("");
  useEffect(() => {
    if (props.type === "edit" && props.prompt) {
      setContent(props.prompt.content);
    } else {
      setContent("");
    }
  }, [props.type, props.prompt]);

  return (
    <div className="modal-mask">
      <Modal
        title={
          props.type === "create"
            ? Locale.Settings.Sync.PromptActions.Add
            : Locale.Settings.Sync.PromptActions.Edit
        }
        onClose={props.onClose}
        actions={[
          <IconButton
            key="confirm"
            onClick={() => {
              props.onConfirm(content);
              setContent(() => "");
              props.onClose?.();
            }}
            icon={<ConfirmIcon />}
            bordered
            text={Locale.UI.Confirm}
          />,
        ]}
      >
        <TextareaInput
          value={content}
          placeholder={Locale.Settings.Sync.Prompt.Placeholder}
          style={{
            boxSizing: "border-box",
            width: "100%",
          }}
          onInput={(e) => {
            setContent(e.currentTarget.value);
          }}
        />
      </Modal>
    </div>
  );
}

function SystemPrompts() {
  const sysPromptStore = useSysPromptStore();

  const [showManageModal, setShowManageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalTye, setModalTye] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState("");

  return (
    <>
      <List>
        <ListItem
          title={Locale.Settings.Sync.Prompt.Title}
          subTitle={Locale.Settings.Sync.Prompt.SubTitle}
        >
          <Button
            onClick={() => {
              setShowManageModal(true);
            }}
          >
            {Locale.Settings.Sync.PromptActions.List}
          </Button>
        </ListItem>
      </List>

      {showManageModal && (
        <SystemPromptsModal
          list={Object.values(sysPromptStore.systemPrompts)}
          onClose={() => setShowManageModal(false)}
          onAdd={() => {
            setModalTye("create");
            setShowEditModal(true);
          }}
          onEdit={(id: string) => {
            setModalTye("edit");
            setEditId(id);
            setShowEditModal(true);
          }}
          onDelete={(id: string) => {
            sysPromptStore.removeSysPrompt(id);
            sysPromptStore.update((store) => {
              store.counter--;
            });
          }}
        />
      )}

      {showEditModal && (
        <EditSystemPromptModal
          type={modalTye}
          prompt={sysPromptStore.getSysPrompt(editId)}
          onConfirm={(content) => {
            if (modalTye === "create") {
              sysPromptStore.addSysPrompt({
                id: nanoid(),
                content: content,
                createdAt: Date.now(),
              });
              sysPromptStore.update((store) => {
                store.counter++;
              });
            } else {
              sysPromptStore.updateSysPrompt(editId, (prompt) => {
                prompt.content = content;
              });
            }
          }}
          onClose={() => {
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}

function LocalStorage() {
  const syncStore = useSyncStore();
  const chatStore = useChatStore();
  const promptStore = usePromptStore();
  const maskStore = useMaskStore();

  const [showSyncConfigModal, setShowSyncConfigModal] = useState(false);

  const stateOverview = useMemo(() => {
    const sessions = chatStore.sessions;
    const messageCount = sessions.reduce((p, c) => p + c.messages.length, 0);

    return {
      chat: sessions.length,
      message: messageCount,
      prompt: Object.keys(promptStore.prompts).length,
      mask: Object.keys(maskStore.masks).length,
    };
  }, [chatStore.sessions, maskStore.masks, promptStore.prompts]);

  return (
    <>
      <List>
        {/* 存储数据 */}
        <ListItem
          title={Locale.Settings.Sync.Storage.Title}
          subTitle={Locale.Settings.Sync.Storage.SubTitle}
        >
          <div className={styles["list-item-value"]}>
            {computedUsedStorage()}KB / 5120KB
          </div>
        </ListItem>

        <ListItem
          title={Locale.Settings.Sync.LocalState}
          subTitle={Locale.Settings.Sync.Overview(stateOverview)}
        >
          <div style={{ display: "flex" }}>
            <IconButton
              icon={<UploadIcon />}
              text={Locale.UI.Export}
              onClick={() => {
                syncStore.export();
              }}
            />
            <IconButton
              icon={<DownloadIcon />}
              text={Locale.UI.Import}
              onClick={() => {
                syncStore.import();
              }}
            />
          </div>
        </ListItem>
      </List>

      {showSyncConfigModal && (
        <SyncConfigModal onClose={() => setShowSyncConfigModal(false)} />
      )}
    </>
  );
}

export function Settings(props: {
  style?: CSSProperties;
  onClose?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const config = useAppConfig();
  const updateConfig = config.update;
  const syncStore = useSyncStore();
  const accessStore = useAccessStore();

  const [hidenPrompt, setHidenPrompt] = useState(false);
  useEffect(() => {
    const hide =
      config.modelConfig.model.includes("deepseek-chat") ||
      config.modelConfig.model.includes("yi-34b-chat-0205") ||
      config.modelConfig.model.includes("Baichuan2-53B");
    setHidenPrompt(hide);
  }, [config.modelConfig.model]);

  useEffect(() => {
    const keydownEvent = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        navigate(Path.Home + location.search);
      }
    };
    if (clientConfig?.isApp) {
      // Force to set custom endpoint to true if it's app
      accessStore.update((state) => {
        state.useCustomConfig = true;
      });
    }
    document.addEventListener("keydown", keydownEvent);
    return () => {
      document.removeEventListener("keydown", keydownEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clientConfig = useMemo(() => getClientConfig(), []);

  return (
    <ErrorBoundary>
      <div className={styles["settings"]} style={props.style}>
        <List>
          <ListItem title={Locale.Settings.Avatar}>
            <Popover
              onClose={() => setShowEmojiPicker(false)}
              content={
                <AvatarPicker
                  onEmojiClick={(avatar: string) => {
                    updateConfig((config) => (config.avatar = avatar));
                    setShowEmojiPicker(false);
                  }}
                />
              }
              open={showEmojiPicker}
            >
              <div
                className={styles.avatar}
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                }}
              >
                <Avatar avatar={config.avatar} />
              </div>
            </Popover>
          </ListItem>

          <ListItem title={Locale.Settings.SendKey}>
            <Select
              value={config.submitKey}
              onChange={(e) => {
                updateConfig(
                  (config) =>
                    (config.submitKey = e.target.value as any as SubmitKey),
                );
              }}
            >
              {Object.values(SubmitKey).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem title={Locale.Settings.Theme}>
            <Select
              value={config.theme}
              onChange={(e) => {
                updateConfig(
                  (config) => (config.theme = e.target.value as any as Theme),
                );
              }}
            >
              {Object.values(Theme).map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem title={Locale.Settings.Lang.Name}>
            <Select
              value={getLang()}
              onChange={(e) => {
                changeLang(e.target.value as any);
              }}
            >
              {AllLangs.map((lang) => (
                <option value={lang} key={lang}>
                  {ALL_LANG_OPTIONS[lang]}
                </option>
              ))}
            </Select>
          </ListItem>

          <ListItem
            title={Locale.Settings.FontSize.Title}
            subTitle={Locale.Settings.FontSize.SubTitle}
          >
            <Space.Compact>
              <Button
                onClick={() => {
                  updateConfig((config) => (config.fontSize = FontSize.Normal));
                }}
              >
                {Locale.Settings.FontSize.Normal}
              </Button>
              <Button
                onClick={() => {
                  updateConfig((config) => (config.fontSize = FontSize.Large));
                }}
              >
                {Locale.Settings.FontSize.Large}
              </Button>
              <Button
                onClick={() => {
                  updateConfig(
                    (config) => (config.fontSize = FontSize.ExtraLarge),
                  );
                }}
              >
                {Locale.Settings.FontSize.ExtraLarge}
              </Button>
            </Space.Compact>
          </ListItem>

          <ListItem
            title={Locale.Settings.AutoGenerateTitle.Title}
            subTitle={Locale.Settings.AutoGenerateTitle.SubTitle}
          >
            <input
              type="checkbox"
              checked={config.enableAutoGenerateTitle}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.enableAutoGenerateTitle = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>

          <ListItem
            title={Locale.Settings.SendPreviewBubble.Title}
            subTitle={Locale.Settings.SendPreviewBubble.SubTitle}
          >
            <input
              type="checkbox"
              checked={config.sendPreviewBubble}
              onChange={(e) =>
                updateConfig(
                  (config) =>
                    (config.sendPreviewBubble = e.currentTarget.checked),
                )
              }
            ></input>
          </ListItem>
        </List>

        {!hidenPrompt && <SystemPrompts />}

        {syncStore.enable && <SyncItems />}

        <LocalStorage />
        <DangerItems />
      </div>
    </ErrorBoundary>
  );
}
