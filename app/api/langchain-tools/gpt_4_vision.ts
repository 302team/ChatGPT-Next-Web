import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { getBase64FromUrl } from "./utils";

export class GPT4vWrapper extends StructuredTool {
  static lc_name() {
    return "GPT_4o";
  }

  apiKey: string;
  baseURL?: string;
  model: string;

  constructor(apiKey: string, baseURL: string) {
    super(...arguments);

    if (!apiKey) {
      throw new Error(
        "GPT-4o requires an API key. Please set it as OPENAI_API_KEY in your .env file.",
      );
    }

    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.apiKey = apiKey;

    this.model = "gpt-4o";
  }

  name = "gpt-4o";

  schema = z.object({
    content: z.array(
      z.object({
        type: z.enum(["text", "image_url", "file"]),
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
    input.content.unshift({
      type: "text",
      text: "Please analyze the information in the picture in as much detail as possible",
    });

    const message = {
      role: "user",
      content: input.content,
    };
    console.log("🚀 ~ GPT-4o ~ _call ~ input:", JSON.stringify(message));
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
    console.log("🚀 ~ GPT4oWrapper ~ _call ~ json:", json);

    if (json.error) {
      throw new Error(
        `Failed to load results from GLM-4v due to: ${json.error}`,
      );
    }

    return JSON.stringify(json);
  }

  description = "The fastest and most affordable flagship model";
}
