import { useEffect, useState } from "react";
import { showToast } from "./components/ui-lib";
import Locale from "./locales";
import { MultimodalContent, RequestMessage } from "./client/api";
import { DEFAULT_MODELS } from "./constant";
import { AttachImages } from "./components/chat";

export function trimTopic(topic: string) {
  // Fix an issue where double quotes still show in the Indonesian language
  // This will remove the specified punctuation from the end of the string
  // and also trim quotes from both the start and end if they exist.
  return (
    topic
      // fix for gemini
      .replace(/^["“”*]+|["“”*]+$/g, "")
      .replace(/[，。！？”“"、,.!?*]*$/, "")
  );
}

export async function copyToClipboard(text: string) {
  try {
    if (window.__TAURI__) {
      window.__TAURI__.writeText(text);
    } else {
      await navigator.clipboard.writeText(text);
    }

    showToast(Locale.Copy.Success);
  } catch (error) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
      showToast(Locale.Copy.Success);
    } catch (error) {
      showToast(Locale.Copy.Failed);
    }
    document.body.removeChild(textArea);
  }
}

export async function downloadAs(text: string, filename: string) {
  if (window.__TAURI__) {
    const result = await window.__TAURI__.dialog.save({
      defaultPath: `${filename}`,
      filters: [
        {
          name: `${filename.split(".").pop()} files`,
          extensions: [`${filename.split(".").pop()}`],
        },
        {
          name: "All Files",
          extensions: ["*"],
        },
      ],
    });

    if (result !== null) {
      try {
        await window.__TAURI__.fs.writeTextFile(result, text);
        showToast(Locale.Download.Success);
      } catch (error) {
        showToast(Locale.Download.Failed);
      }
    } else {
      showToast(Locale.Download.Failed);
    }
  } else {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(text),
    );
    element.setAttribute("download", filename);
    element.setAttribute("download", filename);

    element.style.display = "none";
    document.body.appendChild(element);
    element.style.display = "none";
    document.body.appendChild(element);

    element.click();
    element.click();

    document.body.removeChild(element);
  }
}

export function compressImage(file: File, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent: any) => {
      const image = new Image();
      image.onload = () => {
        let canvas = document.createElement("canvas");
        let ctx = canvas.getContext("2d");
        let width = image.width;
        let height = image.height;
        let quality = 0.9;
        let dataUrl;

        do {
          canvas.width = width;
          canvas.height = height;
          ctx?.clearRect(0, 0, canvas.width, canvas.height);
          ctx?.drawImage(image, 0, 0, width, height);
          dataUrl = canvas.toDataURL("image/jpeg", quality);

          if (dataUrl.length < maxSize) break;

          if (quality > 0.5) {
            // Prioritize quality reduction
            quality -= 0.1;
          } else {
            // Then reduce the size
            width *= 0.9;
            height *= 0.9;
          }
        } while (dataUrl.length > maxSize);

        resolve(dataUrl);
      };
      image.onerror = reject;
      image.src = readerEvent.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataURLtoFile(dataurl: string, filename: string) {
  var arr = dataurl.split(","),
    mime = arr[0].match(/:(.*?);/)![1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export function readFromFile() {
  return new Promise<string>((res, rej) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/json";

    fileInput.onchange = (event: any) => {
      const file = event.target.files[0];
      const fileReader = new FileReader();
      fileReader.onload = (e: any) => {
        res(e.target.result);
      };
      fileReader.onerror = (e) => rej(e);
      fileReader.readAsText(file);
    };

    fileInput.click();
  });
}

export function isIOS() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const onResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return size;
}

export const MOBILE_MAX_WIDTH = 600;
export function useMobileScreen() {
  const { width } = useWindowSize();

  return width <= MOBILE_MAX_WIDTH;
}

export function isFirefox() {
  return (
    typeof navigator !== "undefined" && /firefox/i.test(navigator.userAgent)
  );
}

export function selectOrCopy(el: HTMLElement, content: string) {
  const currentSelection = window.getSelection();

  if (currentSelection?.type === "Range") {
    return false;
  }

  copyToClipboard(content);

  return true;
}

function getDomContentWidth(dom: HTMLElement) {
  const style = window.getComputedStyle(dom);
  const paddingWidth =
    parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const width = dom.clientWidth - paddingWidth;
  return width;
}

function getOrCreateMeasureDom(id: string, init?: (dom: HTMLElement) => void) {
  let dom = document.getElementById(id);

  if (!dom) {
    dom = document.createElement("span");
    dom.style.position = "absolute";
    dom.style.wordBreak = "break-word";
    dom.style.fontSize = "14px";
    dom.style.transform = "translateY(-200vh)";
    dom.style.pointerEvents = "none";
    dom.style.opacity = "0";
    dom.id = id;
    document.body.appendChild(dom);
    init?.(dom);
  }

  return dom!;
}

export function autoGrowTextArea(dom: HTMLTextAreaElement) {
  const measureDom = getOrCreateMeasureDom("__measure");
  const singleLineDom = getOrCreateMeasureDom("__single_measure", (dom) => {
    dom.innerText = "TEXT_FOR_MEASURE";
  });

  const width = getDomContentWidth(dom);
  measureDom.style.width = width + "px";
  measureDom.innerText = dom.value !== "" ? dom.value : "1";
  measureDom.style.fontSize = dom.style.fontSize;
  const endWithEmptyLine = dom.value.endsWith("\n");
  const height = parseFloat(window.getComputedStyle(measureDom).height);
  const singleLineHeight = parseFloat(
    window.getComputedStyle(singleLineDom).height,
  );

  const rows =
    Math.round(height / singleLineHeight) + (endWithEmptyLine ? 1 : 0);

  return rows;
}

export function getCSSVar(varName: string) {
  return getComputedStyle(document.body).getPropertyValue(varName).trim();
}

/**
 * Detects Macintosh
 */
export function isMacOS(): boolean {
  if (typeof window !== "undefined") {
    let userAgent = window.navigator.userAgent.toLocaleLowerCase();
    const macintosh = /iphone|ipad|ipod|macintosh/.test(userAgent);
    return !!macintosh;
  }
  return false;
}

export function getMessageTextContent(message: RequestMessage, type = 1) {
  if (typeof message.content === "string") {
    return message.content;
  }
  let s = [];
  for (let i = 0; i < message.content.length; i++) {
    const c = message.content[i];
    if (type === 2) {
      if (c.type === "text") {
        return c.text ?? "";
      }
    } else {
      if (c.type === "file") {
        if (type === 0) {
          const t = `[${c.file?.name}](${c.file?.url})`;
          if (isImage(c.file!.type)) {
            s.push(`!${t}`);
          } else {
            s.push(t);
          }
          s.push();
        } else {
          s.push(`${c.file?.url}`);
        }
      } else if (c.type === "text") {
        s.push(c.text ?? "");
      }
    }
  }
  return s.length ? s.join("\n") : "";
}

export function getMessageImages(message: RequestMessage): string[] {
  if (typeof message.content === "string") {
    return [];
  }
  const urls: string[] = [];
  for (const c of message.content) {
    if (c.type === "image_url") {
      urls.push(c.image_url?.url ?? "");
    }
  }
  return urls;
}

export function getMessageFiles(
  message: RequestMessage,
): Array<MultimodalContent["file"]> {
  if (typeof message.content === "string") {
    return [];
  }
  const urls: Array<MultimodalContent["file"]> = [];
  for (const c of message.content) {
    if (c.type === "file") {
      urls.push({
        name: c.file?.name ?? "",
        type: c.file?.type ?? "",
        url: c.file?.url ?? "",
      });
    }
  }
  return urls;
}

export function isVisionModel(model: string) {
  return (
    // model.startsWith("gpt-4-vision") ||
    // model.startsWith("gemini-pro-vision") ||
    model.includes("vision")
  );
}

export function isGizmoModel(model: string) {
  return (
    model.includes("gpt-4-all") ||
    model.includes("gpt-4-gizmo-") ||
    model.includes("claude-3-")
  );
}

type TargetContext = "_self" | "_parent" | "_blank" | "_top";
export const openWindow = (
  url: string,
  opts?: { target?: TargetContext; [key: string]: any },
) => {
  const { target = "_blank", ...others } = opts || {};
  window.open(
    url,
    target,
    Object.entries(others)
      .reduce((preValue: string[], curValue) => {
        const [key, value] = curValue;
        return [...preValue, `${key}=${value}`];
      }, [])
      .join(","),
  );
};

export function buildMessage(
  userContent: string,
  model: string,
  attachImages?: AttachImages[],
) {
  const content: {
    mContent: string | MultimodalContent[];
    sContent: string | MultimodalContent[];
  } = {
    mContent: userContent,
    sContent: userContent,
  };

  if (isGizmoModel(model)) {
    const c: MultimodalContent[] = [
      {
        type: "text",
        text: userContent,
      },
    ];
    content.mContent =
      attachImages!.map((i) => i.fileUrl).join("\n") + "\n" + userContent;
    content.sContent = c.concat(
      attachImages!.map((item) => {
        return {
          type: "file",
          file: {
            name: item.name ?? "",
            type: item.type ?? "",
            url: item.fileUrl!,
          },
        };
      }),
    );
  } else if (isVisionModel(model)) {
    const c: MultimodalContent[] = [
      {
        type: "text",
        text: userContent,
      },
    ];
    content.mContent = c.concat(
      attachImages!.map((url) => {
        return {
          type: "image_url",
          image_url: {
            url: url.dataUrl!,
          },
        };
      }),
    );
    content.sContent = c.concat(
      attachImages!.map((url) => {
        return {
          type: "image_url",
          image_url: {
            url: url.fileUrl!,
          },
        };
      }),
    );
  } else {
    // other model
  }

  return content;
}

export function isImage(type: string) {
  return /image\/(gif|png|jpg|jpeg|webp|svg|psd|bmp|tif)/gi.test(type);
}

export function isEmptyObject(object: any) {
  return JSON.stringify(object) === "{}";
}

export function computedUsedStorage() {
  let cache = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      cache += localStorage.getItem(key)!.length;
    }
  }
  return (cache / 1024).toFixed(2);
}

//将远程图片转化为base64
export function getBase64(src: string) {
  function getBase64Image(img: HTMLImageElement) {
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;

    var ctx = canvas.getContext("2d");
    ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
    var dataURL = canvas.toDataURL();
    return dataURL;
  }

  var image = new Image();
  image.crossOrigin = "";
  image.src = src;

  return new Promise((resolve, reject) => {
    image.onload = function () {
      resolve(getBase64Image(image)); //将base64传给done上传处理
    };
    image.onerror = (err) => {
      reject(err);
    };
  });
}
