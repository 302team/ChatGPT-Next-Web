import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router";
import { useMobileScreen, useWindowSize } from "@/app/utils";
import { IconButton } from "./button";
import { nanoid } from "nanoid";
import ExportIcon from "../icons/share.svg";
import CopyIcon from "../icons/copy.svg";
import DownloadIcon from "../icons/download.svg";
import Logo from "../icons/logo-horizontal-dark.png";
import LoadingButtonIcon from "../icons/loading.svg";
import Locale from "../locales";
import { Modal, showToast } from "./ui-lib";
import { copyToClipboard, downloadAs } from "../utils";
import { Path, ApiPath, REPO_URL } from "@/app/constant";
import { Loading } from "./home";
import styles from "./artifacts.module.scss";
import NextImage from "next/image";
import ReactMarkdown from "react-markdown";
import { useAccessStore } from "../store";

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
  const shareUrl = useMemo(
    () => [location.origin, "#", Path.Artifacts, "/", name].join(""),
    [name],
  );
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
                  setShow(true);
                  setName(res?.id);
                }
              })
              .finally(() => setLoading(false));
          }}
        />
      </div>
      {show && (
        <div className="modal-mask">
          <Modal
            title={Locale.Export.Artifacts.Title}
            onClose={() => setShow(false)}
            actions={[
              <IconButton
                key="download"
                icon={<DownloadIcon />}
                bordered
                text={Locale.Export.Download}
                onClick={() => {
                  downloadAs(getCode(), `${fileName || name}.html`).then(() =>
                    setShow(false),
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
            ]}
          >
            <div>
              <a target="_blank" href={shareUrl}>
                {shareUrl}
              </a>
            </div>
          </Modal>
        </div>
      )}
    </>
  );
}

export function Artifacts() {
  const { id } = useParams();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [fileName, setFileName] = useState("");
  const isMobileScreen = useMobileScreen();

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
    </div>
  );
}
