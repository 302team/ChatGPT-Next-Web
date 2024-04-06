import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";

interface ModelConfig {
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
}

interface MultimodalContent {
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

interface GML_4v_Parameters extends ModelConfig {
  model: string;
  messages: {
    role: "user" | "assistant" | string;
    content: string | MultimodalContent;
  };
}

export class Glm4vWrapper extends StructuredTool {
  static lc_name() {
    return "Glm4v";
  }

  apiKey: string;
  baseURL?: string;
  model: string;

  constructor(apiKey: string, baseURL: string) {
    super(...arguments);

    if (!apiKey) {
      throw new Error(
        "SearchApi requires an API key. Please set it as SEARCHAPI_API_KEY in your .env file, or pass it as a parameter to the SearchApi constructor.",
      );
    }

    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.apiKey = apiKey;

    this.model = "glm-4v";
  }

  name = "glm-4v";

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
    // messages: z
    //   .array(
    //     z.object({
    //     }),
    //   )
    //   .describe(
    //     "The messages to be processed. Each message is an object with a `role` (either `user` or `assistant`) and a `content` (either `text`, `image_url`).",
    //   ),
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
    console.log("🚀 ~ Glm4v ~ _call ~ input:", JSON.stringify(message));
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
    console.log("🚀 ~ Glm4vWrapper ~ _call ~ json:", json);

    if (json.error) {
      throw new Error(
        `Failed to load results from GLM-4v due to: ${json.error}`,
      );
    }
    // TODO: 功能待实现
    //
    //
    //
    //
    //
    //
    // TODO:

    return JSON.stringify(json);
    // return JSON.stringify({"choices":[{"finish_reason":"stop","index":0,"message":{"content":"在这张照片中，一只可爱的羊驼站在草地上微笑着。具体地，在碧绿的草地上，有一只可爱的羊驼，它吐着舌头微笑着，眼睛大而圆，呈现出黑色。羊驼的毛色是浅棕色的，身体又高又壮实。羊驼的身后是一片广阔的草地，远处还有几棵绿色的树木。上方是蔚蓝的天空，散布着白云和金色的太阳。阳光透过云层洒在大地上，给整个画面带来了温暖的感觉。","role":"assistant"}}],"created":1712396619,"id":"8537106975399363216","model":"glm-4v","request_id":"8537106975399363216","usage":{"completion_tokens":109,"prompt_tokens":1037,"total_tokens":1146}})
  }

  description = "智谱AI最新图像识别AI模型，来自清华大学";
}
