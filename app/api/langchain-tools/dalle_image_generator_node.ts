// import { getServerSideConfig } from "@/app/config/server";
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

    const fileUrl = await fetch(this.uploadFileUrl, {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then(async (res: any) => {
        if (res.code === 0) {
          return res.data.url;
        }
      });

    return fileUrl;
  }
}
