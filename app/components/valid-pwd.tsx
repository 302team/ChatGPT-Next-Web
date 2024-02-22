import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useSearchParams } from "react-router-dom";
import {
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
import { GPT302_WEBSITE_URL } from "../constant";

interface ValidPwdProps {
  onAuth?: () => void;
}
export function ValidPwd(props: ValidPwdProps) {
  const accessStore = useAccessStore();
  const chatStore = useChatStore();
  const config = useAppConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const pwd = searchParams.get("pwd") || "";
  const autoConfirm = searchParams.get("confirm");
  console.log("🚀 ~ ValidPwd ~ autoConfirm:", autoConfirm === "true");

  const [loading, setLoading] = useState(true);
  const [submiting, setSubmiting] = useState(false);
  const [showError, setShowError] = useState(false);

  const userCode = window.location.hostname.split(".")[0];
  console.log("🚀 ~ [valid pwd] ~ user code:", userCode);

  async function handleSubmit(code: string) {
    const res = await accessStore.validPwd(code);
    const model = res?.data?.model;
    console.log("🚀 ~ [valid pwd] ~ model:", model);
    if (model) {
      chatStore.updateCurrentSession((session) => {
        session.mask.modelConfig.model = model as ModelType;
        session.mask.syncGlobalConfig = false;
      });
      config.update((config) => (config.modelConfig.model = model));
    }
    return res;
  }

  useEffect(() => {
    accessStore.update((access) => (access.userCode = userCode));

    (async () => {
      try {
        // 未登录过的, 并且带了访问码, 需要填充访问码
        if (!accessStore.isAuth && !accessStore.pwd && pwd) {
          accessStore.update((access) => (access.pwd = pwd));
        }
        // 如果以前登录过, 不关联新的访问码, 直接使用缓存中的访问码校验
        if (!pwd || autoConfirm || accessStore.isAuth) {
          const res = await handleSubmit(userCode);

          if (res.code === 0) {
            props.onAuth?.();
            searchParams.delete("pwd");
            searchParams.delete("confirm");
            setSearchParams(searchParams, { replace: true });
          } else {
            // 访问码已经失效了, 修改校验状态为 false
            accessStore.update((access) => (access.isAuth = false));
            // 然后把新的访问码填入输入框中
            accessStore.update((access) => (access.pwd = pwd));
            setShowError(true);
          }
        }
      } catch (error) {
        console.log("🚀 [valid pwd useEffect] catch error:", error);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Loading />;

  const logoSrc = config.theme === "dark" ? BotIconLight : BotIconDark;

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <NextImage
          src={logoSrc}
          height={34}
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
      />

      {showError && (
        <div className={styles["auth-error"]}>{Locale.Auth.ValidError}</div>
      )}

      <div className={styles["auth-actions"]}>
        <IconButton
          text={Locale.Auth.Confirm}
          type="primary"
          disabled={submiting}
          onClick={async () => {
            if (submiting) return;
            setSubmiting(true);

            try {
              const res = await handleSubmit(userCode);
              if (res.code === 0) {
                props.onAuth?.();
                searchParams.delete("pwd");
                searchParams.delete("confirm");
                setSearchParams(searchParams, { replace: true });
              } else {
                setShowError(true);
              }
            } catch (error) {
              console.log("🚀 ~ [valid pwd] submit error:", error);
              showToast((error as any).toString());
              accessStore.setRemember(false);
            } finally {
              setSubmiting(false);
            }
          }}
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
