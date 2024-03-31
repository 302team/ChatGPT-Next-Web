// import S3FileStorage from "@/app/utils/s3_file_storage";
import { StableDiffusionWrapper } from "./stable_diffusion_image_generator";
// import { getServerSideConfig } from "@/app/config/server";
// import LocalFileStorage from "@/app/utils/local_file_storage";
import fetch, { FormData, File } from "node-fetch";

export class StableDiffusionNodeWrapper extends StableDiffusionWrapper {
  async saveImage(imageBase64: string) {
    var fileName = `${Date.now()}.png`;
    const buffer = Buffer.from(imageBase64, "base64");
    const blob = new Blob([buffer], { type: "image/png" });
    const file = new File([blob], fileName);

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
