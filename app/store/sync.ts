import { getClientConfig } from "../config/client";
import { ApiPath, LAST_INPUT_TIME, STORAGE_KEY, StoreKey } from "../constant";
import { createPersistStore } from "../utils/store";
import {
  AppState,
  getLocalAppState,
  GetStoreState,
  mergeAppState,
  setLocalAppState,
  setLocalChatState,
} from "../utils/sync";
import { downloadAs, getDevice, readFromFile } from "../utils";
import { showToast } from "../components/ui-lib";
import Locale from "../locales";
import { createSyncClient, ProviderType } from "../utils/cloud";
import { corsPath } from "../utils/cors";
import { useAccessStore } from "./access";

import UaParser from "ua-parser-js";

export interface WebDavConfig {
  server: string;
  username: string;
  password: string;
}

export interface SyncRecordItem {
  device: string;
  timestamp: number;
  log_url: string;
}

const isApp = !!getClientConfig()?.isApp;
export type SyncStore = GetStoreState<typeof useSyncStore>;

const DEFAULT_SYNC_STATE = {
  provider: ProviderType.WebDAV,
  useProxy: true,
  proxyUrl: corsPath(ApiPath.Cors),

  webdav: {
    endpoint: "",
    username: "",
    password: "",
  },

  upstash: {
    endpoint: "",
    username: STORAGE_KEY,
    apiKey: "",
  },

  lastSyncTime: 0,
  lastProvider: "",

  enable: true,
  // sync cloud password
  syncPassword: "",
  syncRecordList: [] as Array<SyncRecordItem>,
};

export const useSyncStore = createPersistStore(
  DEFAULT_SYNC_STATE,
  (set, get) => ({
    cloudSync() {
      const config = get()[get().provider];
      return Object.values(config).every((c) => c.toString().length > 0);
    },

    markSyncTime() {
      set({ lastSyncTime: Date.now(), lastProvider: get().provider });
    },

    export() {
      const state = getLocalAppState();
      const datePart = isApp
        ? `${new Date().toLocaleDateString().replace(/\//g, "_")} ${new Date()
            .toLocaleTimeString()
            .replace(/:/g, "_")}`
        : new Date().toLocaleString();

      const fileName = `Backup-${datePart}.json`;
      downloadAs(JSON.stringify(state), fileName);
    },

    async import() {
      const rawContent = await readFromFile();

      try {
        const remoteState = JSON.parse(rawContent) as AppState;
        const localState = getLocalAppState();
        mergeAppState(localState, remoteState);
        setLocalAppState(localState);
        location.reload();
      } catch (e) {
        console.error("[Import]", e);
        showToast(Locale.Settings.Sync.ImportFailed);
      }
    },

    getClient() {
      const provider = get().provider;
      const client = createSyncClient(provider, get());
      return client;
    },

    async sync() {
      const localState = getLocalAppState();
      const provider = get().provider;
      const config = get()[provider];
      const client = this.getClient();

      try {
        const remoteState = JSON.parse(
          await client.get(config.username),
        ) as AppState;
        mergeAppState(localState, remoteState);
        setLocalAppState(localState);
      } catch (e) {
        console.log("[Sync] failed to get remote state", e);
        throw e;
      }

      await client.set(config.username, JSON.stringify(localState));

      this.markSyncTime();
    },

    async check() {
      const client = this.getClient();
      return await client.check();
    },

    async upload() {
      const apiDomain = useAccessStore.getState().apiDomain;

      try {
        const state = getLocalAppState()[StoreKey.Chat];
        const datePart = localStorage.getItem(LAST_INPUT_TIME) ?? Date.now();

        const blob = new Blob([JSON.stringify(state)], {
          type: "application/json",
        });
        const fileName = `Backup-${datePart}.json`;
        const file = new File([blob], fileName, { type: blob.type });

        const userCode = window.location.hostname.split(".")[0];
        // 上传
        // 如果有密码，就带密码上传
        // 没密码，后端就需要创建密码，然后再上传
        // 创建完密码，需要回显，并且显示到 “下载” 的输入框
        const fd = new FormData();
        fd.append("file", file);
        fd.append("share_code", userCode);
        fd.append("sync_pwd", get().syncPassword);
        fd.append("timestamp", `${datePart}`);
        fd.append("device", getDevice());

        // 上传.
        const res = await fetch(
          `${apiDomain}/gpt/api/chat/record/sync/upload`,
          {
            method: "POST",
            body: fd,
          },
        ).then((res) => res.json());
        if (res.code === 0) {
          showToast(Locale.Settings.Sync.UploadSucceed);
          get().update((store) => {
            store.syncPassword = res.data.sync_pwd;
            store.syncRecordList = [res.data.file_url]
              .concat(store.syncRecordList)
              .slice(0, 3);
          });
        } else {
          showToast(`${Locale.Settings.Sync.UploadFailed}: ${res.msg}`);
        }
      } catch (e) {
        console.error("[Upload]", e);
        showToast(Locale.Settings.Sync.UploadFailed);
      }
    },

    async getLogs(syncPwd: string) {
      const apiDomain = useAccessStore.getState().apiDomain;
      try {
        const res = await fetch(`${apiDomain}/gpt/api/chat/record/sync/logs`, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          },
          body: new URLSearchParams({
            share_code: window.location.hostname.split(".")[0],
            sync_pwd: syncPwd,
          }),
        }).then((res) => res.json());

        if (res.code === 0) {
          const logs = res.data.logs;
          get().update((store) => {
            store.syncRecordList = logs;
            if (logs.length > 0) {
              store.syncPassword = syncPwd;
            }
          });
        } else {
          showToast(`${Locale.Settings.Sync.DownloadFailed}: ${res.msg}`);
        }
      } catch (e) {
        console.error("[Download]", e);
        showToast(Locale.Settings.Sync.DownloadFailed);
      }
    },

    async download(syncPwd: string) {
      await this.getLogs(syncPwd);
      this.downloadFromIndex(0);
    },

    async downloadFromIndex(index?: number) {
      try {
        const lasetLog = get().syncRecordList[index ?? 0];

        if (!lasetLog) {
          return showToast(Locale.Settings.Sync.EmptyLogs);
        }
        const rawContent = await fetch(lasetLog.log_url).then((res) => {
          return res.json();
        });

        const remoteState = rawContent as AppState[StoreKey.Chat];
        // 直接覆盖
        // setLocalAppState(remoteState);
        setLocalChatState(remoteState);
        showToast(Locale.Settings.Sync.DownloadSucceed);

        setTimeout(() => {
          location.reload();
        }, 500);
      } catch (e) {
        console.error("[Download]", e);
        showToast(Locale.Settings.Sync.DownloadFailed);
      }
    },
  }),
  {
    name: StoreKey.Sync,
    version: 1.3,

    migrate(persistedState, version) {
      const newState = persistedState as typeof DEFAULT_SYNC_STATE;

      if (version < 1.1) {
        newState.upstash.username = STORAGE_KEY;
      }

      if (version < 1.2) {
        if (
          (persistedState as typeof DEFAULT_SYNC_STATE).proxyUrl ===
          "/api/cors/"
        ) {
          newState.proxyUrl = "";
        }
      }

      if (version < 1.3) {
        newState.enable = true;
      }

      return newState as any;
    },
  },
);
