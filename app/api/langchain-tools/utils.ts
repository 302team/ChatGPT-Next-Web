export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export async function getFileFromUrl(
  fileUrl: string,
  fileName: string,
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
  while (++n <= 10) {
    fileObj = await getImg();
    if (fileObj) {
      break;
    } else {
      await sleep(1000);
    }
  }

  return fileObj!;
}

export function dataURLtoFile(base64: string, filename: string) {
  var arr = base64.split(","),
    mime = arr[0].match(/:(.*?);/)![1],
    bstr = atob(arr[1]),
    n = bstr.length,
    u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export async function uploadFile(
  uploadUrl: string,
  formData: FormData,
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

  while (++n <= 10) {
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
