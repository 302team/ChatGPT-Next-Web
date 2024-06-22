import { useEffect, useState } from "react";
import { showToast } from "./components/ui-lib";
import Locale from "./locales";
import { MultimodalContent, RequestMessage } from "./client/api";
import { UAParser } from "ua-parser-js";

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

    element.style.display = "none";
    document.body.appendChild(element);

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
          dataUrl = canvas.toDataURL(file.type, quality);

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

export async function compressBase64Image(imgBase64: string) {
  let result = "";
  const MAX_SIZE = 100 * 1024; // 100kb
  const promise = new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.src = imgBase64;
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
        if (dataUrl.length < MAX_SIZE) break;
        if (quality > 0.5) {
          // Prioritize quality reduction
          quality -= 0.1;
        } else {
          // Then reduce the size
          width *= 0.9;
          height *= 0.9;
        }
      } while (dataUrl.length > MAX_SIZE);
      resolve(dataUrl);
    };
    image.onerror = () => reject("");
  });
  await promise.then((res) => {
    result = res;
  });
  return result;
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
    } else if (c.type === "file" && isImage(c.file!.type)) {
      urls.push(c.file?.url ?? "");
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

// 具备视觉功能的模型({ type: "image_url", image_url: BASE64 })
export function isVisionModel(model: string) {
  const m = model.toLocaleLowerCase();
  const visionKeywords = ["vision"];

  return visionKeywords.some((keyword) => m.includes(keyword));
}

// 具备视觉功能的模型({ type: "image_url", image_url: URL })
export function isSpecImageModal(model: string) {
  const m = model.toLocaleLowerCase();
  const visionKeywords = ["glm-4v", "yi-vl-plus", "gemini-1.5-pro"];
  const isGpt4Turbo =
    model.includes("gpt-4-turbo") && !model.includes("preview");

  return visionKeywords.some((keyword) => m.includes(keyword)) || isGpt4Turbo;
}

export function isSupportFunctionCall(model: string) {
  const m = model.toLocaleLowerCase();
  const functionCallKeywords = ["gpt-"];
  const isGpt4VisionPreview = m.includes("gpt-4-vision-preview");
  const isGpts /* GPTs */ = m.startsWith("gpt-4-gizmo");

  return (
    functionCallKeywords.some((keyword) => m.includes(keyword)) &&
    !isGpt4VisionPreview &&
    !isGpts
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

export const regexUrl = new RegExp(
  "^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$",
  "i",
);

export function copyAudioBlob(
  arrBuffer: ArrayBuffer,
): Promise<[AudioBuffer, number]> {
  return new Promise((resolve) => {
    var audioCtx = new AudioContext();
    audioCtx.decodeAudioData(arrBuffer, function (audioBuffer) {
      // audioBuffer就是AudioBuffer
      // 声道数量和采样率
      var channels = audioBuffer.numberOfChannels;
      var rate = audioBuffer.sampleRate;

      // 截取前3秒
      var startOffset = 0;
      var endOffset = rate * audioBuffer.duration;
      // 3秒对应的帧数
      var frameCount = endOffset - startOffset;

      // 创建同样采用率、同样声道数量，长度是前3秒的空的AudioBuffer
      var newAudioBuffer = new AudioContext().createBuffer(
        channels,
        endOffset - startOffset,
        rate,
      );
      // 创建临时的Array存放复制的buffer数据
      var anotherArray = new Float32Array(frameCount);
      // 声道的数据的复制和写入
      var offset = 0;
      for (var channel = 0; channel < channels; channel++) {
        audioBuffer.copyFromChannel(anotherArray, channel, startOffset);
        newAudioBuffer.copyToChannel(anotherArray, channel, offset);
      }

      // newAudioBuffer就是全新的复制的3秒长度的AudioBuffer对象
      resolve([newAudioBuffer, frameCount]);
    });
  });
}

/**
 * Convert AudioBuffer to a Blob using WAVE representation
 * var blob = bufferToWave(newAudioBuffer, frameCount);
 * @param abuffer AudioBuffer
 * @param len number
 * @returns wav Blob
 */
export function convertAudioBufferToWave(abuffer: AudioBuffer, len: number) {
  var numOfChan = abuffer.numberOfChannels,
    length = len * numOfChan * 2 + 44,
    buffer = new ArrayBuffer(length),
    view = new DataView(buffer),
    channels = [],
    i,
    sample,
    offset = 0,
    pos = 0;

  // write WAVE header
  // "RIFF"
  setUint32(0x46464952);
  // file length - 8
  setUint32(length - 8);
  // "WAVE"
  setUint32(0x45564157);
  // "fmt " chunk
  setUint32(0x20746d66);
  // length = 16
  setUint32(16);
  // PCM (uncompressed)
  setUint16(1);
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  // avg. bytes/sec
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  // block-align
  setUint16(numOfChan * 2);
  // 16-bit (hardcoded in this demo)
  setUint16(16);
  // "data" - chunk
  setUint32(0x61746164);
  // chunk length
  setUint32(length - pos - 4);

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  while (pos < length) {
    // interleave channels
    for (i = 0; i < numOfChan; i++) {
      // clamp
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      // scale to 16-bit signed int
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      // write 16-bit sample
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    // next source sample
    offset++;
  }

  // create Blob
  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getFileFromUrlWithRetry(
  fileUrl: string,
  fileName: string,
  maxRetryCount: number = 10,
): Promise<File> {
  const getImg = async (): Promise<File | undefined> => {
    return await fetch(fileUrl, {
      method: "get",
      body: null,
    })
      .then((response) => response.blob())
      .then((blob) => {
        return new File([blob], fileName);
      })
      .catch((err) => {
        console.log("[getFileFromUrl] err:", err);
        return undefined;
      });
  };

  let fileObj = undefined;
  let n = 0;
  while (++n <= maxRetryCount) {
    fileObj = await getImg();
    if (fileObj) {
      break;
    } else {
      await sleep(1000);
    }
  }

  return fileObj!;
}

export async function uploadFileWithRetry(
  uploadUrl: string,
  formData: FormData,
  maxRetryCount: number = 10,
): Promise<string> {
  let fileUrl = "";
  let n = 0;
  const upload = async () => {
    return await fetch(uploadUrl, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then(async (res: any) => {
        if (res.code === 0) {
          return res.data.url;
        }
        return "";
      })
      .catch((err) => {
        console.error("upload image error:", err);
        return "";
      });
  };

  while (++n <= maxRetryCount) {
    fileUrl = await upload();
    if (fileUrl) {
      break;
    } else {
      console.log("upload image failed, retry:", n);
      await sleep(1000);
    }
  }

  return fileUrl;
}

export async function uploadRemoteFile(
  remoteFileUrl: string,
  uploadUrl: string,
  filename: string,
): Promise<string> {
  const remoteFile = await getFileFromUrlWithRetry(remoteFileUrl, filename);
  // 下载失败的返回源文件地址
  if (!remoteFile) return remoteFileUrl;

  const formData = new FormData();
  formData.append("file", remoteFile);

  const url = await uploadFileWithRetry(uploadUrl, formData);
  return url;
}

export async function getBase64FromUrl(url: string) {
  let type = "";
  let base64 = "";
  await fetch(url, {
    method: "get",
    headers: {
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      type = blob.type;
      return blobToBase64(blob);
    })
    .then((res) => (base64 = res));
  return {
    type,
    base64,
  };
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      resolve("");
    };
  });
}

export async function getFileFromUrl(fileUrl: string, fileName: string) {
  let fileObj = undefined;
  await fetch(fileUrl, {
    method: "get",
    body: null,
  })
    .then((response) => response.blob())
    .then((blob) => {
      fileObj = new File([blob], fileName);
    });
  return fileObj;
}

export function getFileBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
}

export function getDevice(ua?: string) {
  const parser = new UAParser(ua);

  let device = "";
  const result = parser.getResult();

  if (result.device.vendor) {
    device += `${result.device.vendor} ${result.device.model}`;
  } else {
    device += `${result.os.name} ${result.os.version}`;
  }

  if (result.browser.name && result.browser.version) {
    device += ` ${result.browser.name}`;
  }

  return device;
}

/**
 * 根据模板格式化日期格式
 * @param {*} date 格式化的时间
 * @param {*} fmt 格式化的模板 YYYY-MM-DD hh:mm:ss
 */
export function formatDate(date: Date, fmt: string) {
  // 因为年份是4位数, 所以先匹配替换模板中的年份格式
  if (/(Y+)/.test(fmt)) {
    fmt = fmt.replace(RegExp.$1, `${date.getFullYear()}`);
  }

  // 模板正则对象
  let o = {
    "M+": date.getMonth() + 1,
    "D+": date.getDay(),
    "h+": date.getHours(),
    "m+": date.getMinutes(),
    "s+": date.getSeconds(),
  };

  Object.entries(o).forEach(([key, value]) => {
    // 先转换为字符串
    let str = value + "";

    // 动态生成模板正则, 匹配模板格式; 如果模板的月日是一位数 不需要补0
    if (new RegExp(`(${key})`).test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.length === 1 ? str : /* 补零 */ padLeftZero(str),
      );
    }
  });

  // 返回替换之后的模板
  return fmt;
}

/**
 * 在字符串左侧添加0
 * @param {*} str 需要填充的字符串
 */
export function padLeftZero(str: string) {
  // 截取字符串的长度位数之后的字符串
  // 如果传入的是 1 => 001 => 01
  // 如果传入的是 11 => 0011 => 11
  return ("00" + str).substr(str.length);
}
