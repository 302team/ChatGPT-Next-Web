import styles from "./auth.module.scss";
import { IconButton } from "./button";

import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Path } from "../constant";
import {
  ModelType,
  useAccessStore,
  useAppConfig,
  useChatStore,
} from "../store";
import Locale from "../locales";

import BotIcon from "../icons/logo.png";
import { useEffect, useState } from "react";
import NextImage from "next/image";
import { Loading, showToast } from "./ui-lib";

interface ValidPwdProps {
  onAuth?: () => void;
}
export function ValidPwd(props: ValidPwdProps) {
  const accessStore = useAccessStore();
  const chatStore = useChatStore();
  const config = useAppConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const pwd = searchParams.get("pwd") || "";

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
        // 如果以前登录过,不关联新的 pwd, 直接使用缓存中的 pwd 校验
        if (accessStore.isAuth) {
          const res = await handleSubmit(userCode);

          if (res.code === 0) {
            props.onAuth?.();
            searchParams.delete("pwd");
            setSearchParams(searchParams, { replace: true });
          } else {
            // pwd 已经失效了, 修改校验状态为 false
            accessStore.update((access) => (access.isAuth = false));
            // 然后把新的 pwd 填入输入框中
            accessStore.update((access) => (access.pwd = pwd));
            setShowError(true);
          }
        } else if (!accessStore.pwd) {
          accessStore.update((access) => (access.pwd = pwd));
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

  return (
    <div className={styles["auth-page"]}>
      <div className={`no-dark ${styles["auth-logo"]}`}>
        <NextImage src={BotIcon} width={42} height={42} alt="" />
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
