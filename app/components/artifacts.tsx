import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router";
import {
  arrayToObject,
  openWindow,
  useMobileScreen,
  useWindowSize,
} from "@/app/utils";
import { IconButton } from "./button";
import { nanoid } from "nanoid";
import ExportIcon from "../icons/share.svg";
import CopyIcon from "../icons/copy.svg";
import DownloadIcon from "../icons/download.svg";
import Logo from "../icons/logo-horizontal-dark.png";
import LoadingButtonIcon from "../icons/loading.svg";
import ReloadIcon from "../icons/reload.svg";
import Locale from "../locales";
import { Modal, showModal, showToast } from "./ui-lib";
import { copyToClipboard, downloadAs } from "../utils";
import {
  Path,
  ApiPath,
  REPO_URL,
  Region,
  GPT302_WEBSITE_CN_URL,
  GPT302_WEBSITE_URL,
} from "@/app/constant";
import { Loading } from "./home";
import styles from "./artifacts.module.scss";
import NextImage from "next/image";
import ReactMarkdown from "react-markdown";
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackFiles,
  useActiveCode,
  FileTabs,
  SandpackStack,
  useSandpack,
} from "@codesandbox/sandpack-react";
import { atomDark } from "@codesandbox/sandpack-themes";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

import BotIconDark from "../icons/logo-horizontal-dark.png";
import { useAccessStore, useAppConfig } from "../store";
import { useDebouncedCallback } from "use-debounce";

export function HTMLPreview(props: {
  code: string;
  autoHeight?: boolean;
  height?: number | string;
  onLoad?: (title?: string) => void;
}) {
  const ref = useRef<HTMLIFrameElement>(null);
  const frameId = useRef<string>(nanoid());
  const [iframeHeight, setIframeHeight] = useState(600);
  const [title, setTitle] = useState("");
  /*
   * https://stackoverflow.com/questions/19739001/what-is-the-difference-between-srcdoc-and-src-datatext-html-in-an
   * 1. using srcdoc
   * 2. using src with dataurl:
   *    easy to share
   *    length limit (Data URIs cannot be larger than 32,768 characters.)
   */

  useEffect(() => {
    const handleMessage = (e: any) => {
      const { id, height, title } = e.data;
      setTitle(title);
      if (id == frameId.current) {
        setIframeHeight(height);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  const height = useMemo(() => {
    if (!props.autoHeight) return props.height || 600;
    if (typeof props.height === "string") {
      return props.height;
    }
    const parentHeight = props.height || 600;
    return iframeHeight + 40 > parentHeight ? parentHeight : iframeHeight + 40;
  }, [props.autoHeight, props.height, iframeHeight]);

  const srcDoc = useMemo(() => {
    const script = `<script>new ResizeObserver((entries) => parent.postMessage({id: '${frameId.current}', height: entries[0].target.clientHeight}, '*')).observe(document.body)</script>`;
    if (props.code.includes("</head>")) {
      props.code.replace("</head>", "</head>" + script);
    }
    return props.code + script;
  }, [props.code]);

  const handleOnLoad = () => {
    if (props?.onLoad) {
      props.onLoad(title);
    }
  };

  return (
    <iframe
      className={styles["artifacts-iframe"]}
      id={frameId.current}
      ref={ref}
      sandbox="allow-forms allow-modals allow-scripts"
      style={{ height }}
      srcDoc={srcDoc}
      onLoad={handleOnLoad}
    />
  );
}

const CodeLang: Record<string, string> = {
  javascript: "nodejs",
  python: "python3",
};

const prettyResult = (msg: string, type = "shell") =>
  ["```" + type, msg, "```"].join("\n");

export function detectLanguage(code: string) {
  if (/^\s*def\s+\w+\s*\(.*\):/.test(code)) {
    return "python";
  } else if (/^\s*function\s+\w+\s*\(.*\)\s*\{/.test(code)) {
    return "javascript";
  } else {
    return "unknow";
  }
}

export function Stdout(props: { codeString: string; codeLang?: string }) {
  const [runing, setRuning] = useState(false);
  const [result, setResult] = useState("");
  const accessStore = useAccessStore();

  let status = 0;

  useEffect(() => {
    const runCode = async () => {
      try {
        const response = await fetch(ApiPath.CodeInterpreter, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessStore.openaiApiKey}`,
          },
          body: JSON.stringify({
            code: props.codeString,
            language:
              CodeLang[
                props.codeLang
                  ? props.codeLang
                  : detectLanguage(props.codeString)
              ],
          }),
        });

        if (response.status === 200) {
          const resJson = await response.json();
          if (resJson.error) {
            setResult(prettyResult(resJson.error));
          } else {
            setResult(prettyResult(resJson.stdout));
          }
        } else {
          const resText = await response.text();
          setResult(prettyResult(resText));
        }
      } catch (err: any) {
        setResult(err.toString());
      } finally {
        setRuning(false);
      }
    };

    if (status > 0 || runing) return;

    setRuning(true);
    runCode();
    return () => {
      status = 1;
    };
  }, []);

  if (runing) {
    return (
      <div className={styles["artifacts-runing-code"]}>
        <Loading />
      </div>
    );
  }

  return (
    <>
      <ReactMarkdown>{result}</ReactMarkdown>
    </>
  );
}

function CustomSandpackEditor(props: {
  files: SandpackFiles;
  showTab: "edit" | "preview";
  dependencies?: string[];
  devDependencies?: string[];
  onCodeChange?: (file: string, code: string) => void;
}) {
  const { code, updateCode } = useActiveCode();
  const { sandpack } = useSandpack();
  const { activeFile } = sandpack;

  const onChange = useDebouncedCallback((val) => {
    props.onCodeChange?.(activeFile, val);
    updateCode(val, true);
  }, 600);

  return (
    <>
      <CodeMirror
        value={code}
        theme="dark"
        extensions={[javascript()]}
        onChange={onChange}
      />
    </>
  );
}

function CustomSandpackRefresh({ showTab }: { showTab: "edit" | "preview" }) {
  const { dispatch } = useSandpack();

  useEffect(() => {
    if (showTab === "preview") dispatch({ type: "refresh" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTab]);

  return null;
}

const BUILTINS_DEPENDENCIES = ["recharts", "antd", "lucide-react", "shadcn-ui"];
export function CodeSandpack(props: {
  files: SandpackFiles;
  showTab: "edit" | "preview";
  dependencies?: string[];
  devDependencies?: string[];
  onCodeChange?: (file: string, code: string) => void;
}) {
  return (
    <>
      <SandpackProvider
        files={props.files}
        theme={atomDark}
        template="react"
        className="react-code-sandpack"
        options={{
          externalResources: ["https://cdn.tailwindcss.com"],
          autoReload: true,
          autorun: true,
        }}
        customSetup={{
          dependencies: arrayToObject(
            [...BUILTINS_DEPENDENCIES, ...(props.dependencies ?? [])],
            "latest",
          ),
          devDependencies: props.devDependencies
            ? arrayToObject(props.devDependencies, "latest")
            : {},
        }}
      >
        <SandpackLayout>
          <CustomSandpackRefresh showTab={props.showTab} />

          {props.showTab === "edit" && (
            <>
              <SandpackStack>
                <FileTabs />
                <CustomSandpackEditor {...props} />
              </SandpackStack>
            </>
          )}

          <>
            <SandpackPreview
              style={{
                display: props.showTab === "preview" ? "flex" : "none",
              }}
              autoFocus
              showRefreshButton={false}
              showOpenInCodeSandbox={false}
            />
          </>
        </SandpackLayout>
      </SandpackProvider>
    </>
  );
}

const buildShareUrl = (name: string) =>
  [location.origin, "#", Path.Artifacts, "/", name].join("");

export function ArtifactsShareButton({
  getCode,
  id,
  style,
  fileName,
}: {
  getCode: () => string;
  id?: string;
  style?: any;
  fileName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(id);
  const [show, setShow] = useState(false);
  const upload = (code: string) =>
    id
      ? Promise.resolve({ id })
      : fetch(ApiPath.Artifacts, {
          method: "POST",
          body: code,
        })
          .then((res) => res.json())
          .then(({ id }) => {
            if (id) {
              return { id };
            }
            throw Error();
          })
          .catch((e) => {
            showToast(Locale.Export.Artifacts.Error);
          });
  return (
    <>
      <div className="window-action-button" style={style}>
        <IconButton
          icon={loading ? <LoadingButtonIcon /> : <ExportIcon />}
          bordered
          title={Locale.Export.Artifacts.Title}
          onClick={() => {
            if (loading) return;
            setLoading(true);
            upload(getCode())
              .then((res) => {
                if (res?.id) {
                  setName(res?.id);
                  return res?.id;
                }
              })
              .then((id) => {
                if (!id) return;
                const shareUrl = buildShareUrl(id);

                showModal({
                  title: Locale.Export.Artifacts.Title,
                  onClose: () => setShow(false),
                  className: "export-artifacts-modal",
                  actions: [
                    <IconButton
                      key="download"
                      icon={<DownloadIcon />}
                      bordered
                      text={Locale.Export.Download}
                      onClick={() => {
                        downloadAs(getCode(), `${fileName || id}.html`).then(
                          () => setShow(false),
                        );
                      }}
                    />,
                    <IconButton
                      key="copy"
                      icon={<CopyIcon />}
                      bordered
                      text={Locale.Chat.Actions.Copy}
                      onClick={() => {
                        copyToClipboard(shareUrl).then(() => setShow(false));
                      }}
                    />,
                  ],
                  children: (
                    <a
                      target="_blank"
                      href={shareUrl}
                      className={styles["share-url"]}
                    >
                      {shareUrl}
                    </a>
                  ),
                });
              })
              .finally(() => setLoading(false));
          }}
        />
      </div>
    </>
  );
}

export function Artifacts() {
  const { id } = useParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState("");
  const isMobileScreen = useMobileScreen();
  const appConfig = useAppConfig();

  document.body.style.backgroundColor = "rgb(229, 229, 229)";

  useEffect(() => {
    if (id) {
      fetch(`${ApiPath.Artifacts}?id=${id}`)
        .then((res) => {
          if (res.status > 300) {
            throw Error("can not get content");
          }
          return res;
        })
        .then((res) => res.text())
        .then(setCode)
        .catch((e) => {
          showToast(Locale.Export.Artifacts.Error);
        });
    }
  }, [id]);

  return (
    <div className={styles["artifacts"]}>
      <div className={styles["artifacts-header"]}>
        <div className={styles["artifacts-title"]}>
          <NextImage
            src={Logo.src}
            width={isMobileScreen ? 156 : 184}
            height={isMobileScreen ? 44 : 52}
            alt="302AI"
            style={{
              cursor: "pointer",
            }}
            onClick={() => {
              openWindow(
                appConfig.region === Region.China
                  ? GPT302_WEBSITE_CN_URL
                  : GPT302_WEBSITE_URL,
              );
            }}
          />
        </div>
        <ArtifactsShareButton
          id={id}
          getCode={() => code}
          fileName={fileName}
        />
      </div>
      <div className={styles["artifacts-content"]}>
        {loading && <Loading />}
        {code && (
          <HTMLPreview
            code={code}
            autoHeight={false}
            height={"100%"}
            onLoad={(title) => {
              setFileName(title as string);
              setLoading(false);
            }}
          />
        )}
      </div>

      <div className={styles["artifacts-footer"]}>
        Powered By
        <NextImage
          src={BotIconDark}
          height={13}
          alt=""
          onClick={() =>
            openWindow(
              appConfig.region === Region.China
                ? GPT302_WEBSITE_CN_URL
                : GPT302_WEBSITE_URL,
            )
          }
        />
      </div>
    </div>
  );
}
