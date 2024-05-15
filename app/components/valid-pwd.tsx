import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useSearchParams } from "react-router-dom";
import {
  ChatMessage,
  ModelType,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "../store";
import Locale from "../locales";

import BotIconLight from "../icons/logo-horizontal-light.png";
import BotIconDark from "../icons/logo-horizontal-dark.png";
import LockIcon from "../icons/lock.svg";
import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Loading, showToast } from "./ui-lib";
import { openWindow } from "../utils";
import { GPT302_WEBSITE_URL, ERROR_CODE, ERROR_CODE_TYPE } from "../constant";
import { AuthType } from "../locales/cn";
import { isEmptyObj } from "openai/core";
import { prettyObject } from "../utils/format";

interface ValidPwdProps {
  onAuth?: (opt: { info?: string }) => void;
}

function parseQuery2Object(query: string) {
  const vars = query.split("&");
  const obj: Record<string, string> = {};

  for (let i = 0; i < vars.length; i++) {
    const [k, v] = vars[i].split("=");
    obj[k] = v;
  }

  return obj;
}

let downloadState = 0;

export function ValidPwd(props: ValidPwdProps) {
  const accessStore = useAccessStore();
  const chatStore = useChatStore();
  const config = useAppConfig();

  const [loading, setLoading] = useState(true);
  const [submiting, setSubmiting] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

  let pwd = searchParams.get("pwd") || "";
  let autoConfirm = searchParams.get("confirm") || "";
  const shareid = searchParams.get("shareid") || "";

  const userCode = window.location.hostname.split(".")[0];

  async function handleSubmit(code: string, callback?: (res: any) => void) {
    const res = await accessStore.validPwd(code);
    if (!res) return;

    if (res.code === 0) {
      const model = res?.data?.model;
      if (model) {
        chatStore.updateCurrentSession((session) => {
          // 除去应用商店的机器人。其他机器人都要覆盖
          if (!session.mask.isStoreModel) {
            session.mask.modelConfig.model = model as ModelType;
            session.mask.syncGlobalConfig = true;
          }
        });
        config.update((config) => (config.modelConfig.model = model));
      }

      searchParams.delete("pwd");
      searchParams.delete("confirm");
      setSearchParams(searchParams, { replace: true });
      callback?.(res);
      return res;
    } else {
      const CODE = ERROR_CODE[res.code as ERROR_CODE_TYPE] as AuthType;
      const errMsg = Locale.Auth[CODE];

      setErrorMsg(errMsg || res.msg);
      // 访问码已经失效了, 修改校验状态为 false
      accessStore.update((access) => (access.isAuth = false));
      // 然后把新的访问码填入输入框中
      accessStore.update((access) => (access.pwd = pwd));
      setShowError(true);
    }

    setLoading(false);
  }

  async function handleShare(queryObj: Record<string, string>) {
    pwd = queryObj.pwd || "";
    autoConfirm = queryObj.confirm || "";

    if (downloadState !== 0) return;
    downloadState = 1;

    return fetch(queryObj.url)
      .then((res) => res.json())
      .then((res) => {
        chatStore.newSession(res.mask, true);

        chatStore.updateCurrentSession((session) => {
          session.topic = res.topic;
          session.messages = res.messages as ChatMessage[];
        });

        return res;
      })
      .then((res) => {
        downloadState = 2;

        searchParams.delete("shareid");
        setSearchParams(searchParams, { replace: true });
        return res;
      })
      .catch((err) => {
        console.error("[download session error]", err);
        showToast(prettyObject(err));
      });
  }

  useEffect(() => {
    accessStore.update((access) => (access.userCode = userCode));

    if (shareid) {
      try {
        const query = decodeURIComponent(atob(shareid));
        console.log("🚀 ~ useEffect ~ query:", query);

        const queryObj = parseQuery2Object(query);
        if (queryObj && !isEmptyObj(queryObj)) {
          handleShare(queryObj);
        }
      } catch (error) {
        console.log(error);
      }

      // searchParams.delete("shareid");
      // setSearchParams(searchParams, { replace: true });
    }

    (async () => {
      try {
        // 未登录过的, 并且带了访问码, 需要填充访问码
        if (!accessStore.isAuth && !accessStore.pwd && pwd) {
          accessStore.update((access) => (access.pwd = pwd));
        }
        // 如果以前登录过, 不关联新的访问码, 直接使用缓存中的访问码校验
        if (!pwd || autoConfirm || accessStore.isAuth) {
          await handleSubmit(userCode, (res) => {
            props.onAuth?.(res.data);
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.log("🚀 [valid pwd useEffect] catch error:", error);
        setErrorMsg(Locale.Error.NetworkError);
        setShowError(true);
        setLoading(false);
        showToast(Locale.Error.NetworkError);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConfirm = async () => {
    if (submiting) return;
    setSubmiting(true);

    try {
      await handleSubmit(userCode, (res) => {
        props.onAuth?.(res.data);
      });
    } catch (error) {
      console.log("🚀 ~ [valid pwd] submit error:", error);
      showToast(Locale.Error.NetworkError);
      accessStore.setRemember(false);
    } finally {
      setSubmiting(false);
    }
  };

  if (loading) return <Loading />;

  const themeMedia = window.matchMedia("(prefers-color-scheme: light)");
  const logoSrc =
    config.theme === "auto"
      ? themeMedia.matches
        ? BotIconDark
        : BotIconLight
      : config.theme === "dark"
        ? BotIconLight
        : BotIconDark;

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <NextImage
          src={logoSrc}
          width={120}
          alt=""
          onClick={() => openWindow(GPT302_WEBSITE_URL)}
        />
      </div>

      <div className={`no-dark ${styles["auth-lock"]}`}>
        <LockIcon />
      </div>

      <div className={styles["auth-title"]}>{Locale.Auth.Title}</div>
      <div className={styles["auth-tips"]}>{Locale.Auth.Tips}</div>

      <input
        className={styles["auth-input"]}
        type="text"
        placeholder={Locale.Auth.Input}
        value={accessStore.pwd}
        onChange={(e) => {
          accessStore.update((access) => (access.pwd = e.currentTarget.value));
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleConfirm();
          }
        }}
      />

      {showError && (
        <div
          className={styles["auth-error"]}
          dangerouslySetInnerHTML={{ __html: errorMsg }}
        ></div>
      )}

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          disabled={submiting}
          onClick={handleConfirm}
        />

        <div>
          <label htmlFor="checkbox" className={styles["auth-checkbox"]}>
            <input
              id="checkbox"
              type="checkbox"
              checked={accessStore.remember}
              onChange={(e) => {
                console.log("🚀 ~ ValidPwdPage ~ e:", e);
                accessStore.setRemember(e.currentTarget.checked);
              }}
            ></input>
            <div className={styles["auth-tips"]}>{Locale.Auth.Remember}</div>
          </label>
        </div>
      </div>
    </div>
  );
}
