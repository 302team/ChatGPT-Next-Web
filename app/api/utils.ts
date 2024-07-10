import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../config/server";
// import { fromBufferWithMime } from "textract";

export interface MultimodalContent {
  type: "text" | "image_url" | "file";
  text?: string;
  image_url?: {
    url: string;
  };
  file?: {
    url: string;
    type: string;
    name: string;
  };
}

export interface RequestPayload {
  messages: {
    role: "system" | "user" | "assistant";
    content: string | MultimodalContent[];
  }[];
  stream?: boolean;
  model: string;
  temperature: number;
  presence_penalty: number;
  frequency_penalty: number;
  top_p: number;
  max_tokens?: number;
}

const serverConfig = getServerSideConfig();

const File_Extension = [
  "pdf",
  "docx",
  "csv",
  "txt",
  "html",
  "odt",
  "rtf",
  "epub",
  "md",
  "xml",
  "xsl",
  "pptx",
  "potx",
];

const Link_Exp = /^https:\/\/.+\..+$/;

// https://file.302.ai/gpt/imgs/20240710/2b58bb42373a4c449c7d03d679c8c38a.html
// https://file.302.ai/gpt/imgs/20240710/b9f97ab0f60d4a469529ac5862317e71.pdf
async function parseText(url: string) {
  console.log("[textract] url:", url);
  const res = await fetch(`${serverConfig.apiDomain}/gpt/api/textract`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
    },
    body: JSON.stringify({ url }),
  })
    .then((res) => res.json())
    .catch((err) => {
      console.log("[textract] err:", err);
    });
  console.log("[textract] res:", JSON.stringify(res));

  if (res.code === 0) {
    return res.data.msg;
  }
  return "";
}

export async function parsePrompt(req: NextRequest, fetchOptions: RequestInit) {
  // 将file 转为 prompt
  console.log("\n\n[parsePrompt] start =============");

  if (req.body) {
    try {
      console.log("[parsePrompt] get body");
      const clonedBody = await req.text();
      fetchOptions.body = clonedBody;
      console.log("[parsePrompt] get body end");

      console.log("[parsePrompt] parse body");
      const jsonBody = JSON.parse(clonedBody) as RequestPayload;
      console.log("[parsePrompt] parse body end");

      for (let i = jsonBody.messages.length - 1; i >= 0; i--) {
        const m = jsonBody.messages[i];
        if (m.role === "user") {
          if (typeof m.content === "string") {
            // https://file.302.ai/gpt/imgs/20240710/611984ac482b4a3f9212b3da7a473e89.txt\nhi
            const strArr = m.content.split("\n");
            // 找到所有文件链接
            const files = strArr.filter((s) => Link_Exp.test(s));
            // const contexts = strArr.filter((s) => !Link_Exp.test(s));
            // 提取文件内容
            if (files.length) {
              for (let idx = 0; idx < files.length; idx++) {
                const url = files[idx];
                const ext = url.substring(url.lastIndexOf(".") + 1);
                console.log(
                  "[parsePrompt] get url",
                  JSON.stringify({ url, ext }),
                );

                if (File_Extension.includes(ext.toLocaleLowerCase())) {
                  console.log("[parsePrompt] get text", url);
                  const fileContent = await parseText(url);
                  console.log(
                    "[parsePrompt] get text end",
                    JSON.stringify({
                      url,
                      fileContent,
                    }),
                  );

                  m.content =
                    m.content.replaceAll(url, "") +
                    "\n" +
                    `file-content: ${fileContent}`;
                }
              }
            }
          } else {
            // const filesContent = m.content.filter(i => i.type === "file");
            // if (filesContent.length) {
            //   for (let idx = 0;  idx < filesContent.length;idx++) {
            //     const file = filesContent[idx].file;
            //     if (file && File_Extension.includes(file.type.toLocaleLowerCase())) {
            //     }
            //   }
            // }
          }

          break;
        }
      }

      fetchOptions.body = JSON.stringify(jsonBody);
    } catch (error) {
      console.log("🚀 ~ parsePrompt ~ error:", error);
      //
    }
  }

  console.log("[parsePrompt] end =============\n\n");

  return fetchOptions;
}
