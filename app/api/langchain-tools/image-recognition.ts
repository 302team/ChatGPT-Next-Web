import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getBase64FromUrl } from "./utils";

export class GPT4vWrapper extends StructuredTool {
  static lc_name() {
    return "Image_Recognition";
  }

  apiKey: string;
  baseURL?: string;
  model: string;

  constructor(apiKey: string, baseURL: string) {
    super(...arguments);

    if (!apiKey) {
      throw new Error(
        "Image-vision requires an API key. Please set it as OPENAI_API_KEY in your .env file.",
      );
    }

    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.apiKey = apiKey;

    this.model = "claude-3-5-sonnet-20240620";
  }

  name = "image-recognition";

  schema = z.object({
    content: z.array(
      z.object({
        type: z.enum(["text", "image_url", "file"]).optional(),
        text: z.string().optional().describe("text content"),
        image_url: z
          .object({
            url: z.string().optional().describe("image url"),
          })
          .optional(),
      }),
    ),
  });

  /** @ignore */
  async _call(input: z.infer<typeof this.schema>) {
    for (const item of input.content) {
      if (item.image_url) {
        if (item.type === undefined) {
          item.type = "image_url";
        }
      }
    }

    input.content.unshift({
      type: "text",
      text: "Please analyze the information in the picture in as much detail as possible",
    });

    const message = {
      role: "user",
      content: input.content,
    };
    console.log("🚀 ~ [image-recognition] ~ message:", JSON.stringify(message));
    const apiUrl = `${this.baseURL}/chat/completions`;

    let requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [message],
      }),
    };

    const resp = await fetch(apiUrl, requestOptions);

    const json = await resp.json();
    console.log("🚀 ~ [image-recognition] ~ output:", json);

    if (json.error) {
      throw new Error(
        `Failed to load results from GLM-4v due to: ${json.error}`,
      );
    }

    return JSON.stringify(json);
  }

  description = "Image-vision has the ability to understand images";
}
