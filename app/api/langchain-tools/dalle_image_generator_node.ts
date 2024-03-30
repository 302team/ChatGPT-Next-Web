// import { getServerSideConfig } from "@/app/config/server";
import { sleep } from "openai/core";
import { DallEAPIWrapper } from "./dalle_image_generator";
// import S3FileStorage from "@/app/utils/s3_file_storage";
// import LocalFileStorage from "@/app/utils/local_file_storage";
import fetch, { FormData, File } from "node-fetch";

export async function getFileFromUrl(
  fileUrl: string,
  fileName: string,
): Promise<File> {
  let fileObj = undefined;
  await fetch(fileUrl, {
    method: "get",
    body: null,
  })
    .then((response) => response.blob())
    .then((blob) => {
      fileObj = new File([blob], fileName);
    });
  return fileObj!;
}

export class DallEAPINodeWrapper extends DallEAPIWrapper {
  async saveImageFromUrl(url: string) {
    var fileName = `${Date.now()}.png`;
    const file = await getFileFromUrl(url, fileName);
    const formData = new FormData();
    formData.append("file", file);

    let fileUrl = "";
    let n = 0;
    const upload = async () => {
      return await fetch(this.uploadFileUrl, {
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
          console.error("[DALL-E] upload image error:", err);
          return "";
        });
    };

    while (!fileUrl && ++n <= 10) {
      fileUrl = await upload();
      if (!fileUrl) {
        await sleep(1000);
      }
    }

    return fileUrl ?? url;
  }
}
