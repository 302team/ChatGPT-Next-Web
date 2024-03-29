import { getClientConfig } from "../config/client";
import {
  ACCESS_CODE_PREFIX,
  Azure,
  ModelProvider,
  ServiceProvider,
} from "../constant";
import { ChatMessage, ModelType, useAccessStore, useChatStore } from "../store";
import { ChatGPTApi } from "./platforms/openai";
import { GeminiProApi } from "./platforms/google";
import { getLang } from "../locales";
import { isSpecImageModal } from "../utils";
export const ROLES = ["system", "user", "assistant"] as const;
export type MessageRole = (typeof ROLES)[number];

export const Models = ["gpt-3.5-turbo", "gpt-4"] as const;
export type ChatModel = ModelType;

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

export interface RequestMessage {
  role: MessageRole;
  content: string | MultimodalContent[];
}

export interface LLMConfig {
  model: string;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
  presence_penalty?: number;
  frequency_penalty?: number;
}

export interface LLMAgentConfig {
  maxIterations: number;
  returnIntermediateSteps: boolean;
  useTools?: (string | undefined)[];
}

export interface ChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;
  retryCount?: number;

  onRetry?: () => void;
  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string, hasError?: boolean) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

export interface AgentChatOptions {
  messages: RequestMessage[];
  config: LLMConfig;
  agentConfig: LLMAgentConfig;
  onToolUpdate?: (toolName: string, toolInput: string) => void;
  onUpdate?: (message: string, chunk: string) => void;
  onFinish: (message: string, hasError?: boolean) => void;
  onError?: (err: Error) => void;
  onController?: (controller: AbortController) => void;
}

export type Voice = "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
export type VoiceFormat = "mp3" | "opus" | "aac" | "flac";

export interface SpeechOptions {
  model: ModelType;
  input: string;
  voice?: string | Voice;
  response_format?: string | VoiceFormat;
  speed?: Number; // 0.25 到 4.0
}

export interface LLMUsage {
  used: number;
  total: number;
}

export interface LLMModel {
  name: string;
  available: boolean;
  provider: LLMModelProvider;
}

export interface LLMModelProvider {
  id: string;
  providerName: string;
  providerType: string;
}

export abstract class LLMApi {
  abstract chat(options: ChatOptions): Promise<void>;
  abstract usage(): Promise<LLMUsage>;
  abstract models(): Promise<LLMModel[]>;
  abstract toolAgentChat(options: AgentChatOptions): Promise<void>;
  abstract audioSpeech(options: SpeechOptions): Promise<Response | void>;
  abstract audioTranscriptions(
    formData: FormData,
    baseUrl?: string,
  ): Promise<Response | void>;
}

type ProviderName = "openai" | "azure" | "claude" | "palm";

interface Model {
  name: string;
  provider: ProviderName;
  ctxlen: number;
}

interface ChatProvider {
  name: ProviderName;
  apiConfig: {
    baseUrl: string;
    apiKey: string;
    summaryModel: Model;
  };
  models: Model[];

  chat: () => void;
  usage: () => void;
}

export abstract class ToolApi {
  abstract call(input: string): Promise<string>;
  abstract name: string;
  abstract description: string;
}

export class ClientApi {
  public llm: LLMApi;

  constructor(provider: ModelProvider = ModelProvider.GPT) {
    if (provider === ModelProvider.GeminiPro) {
      this.llm = new GeminiProApi();
      return;
    }
    this.llm = new ChatGPTApi();
  }

  config() {}

  prompts() {}

  masks() {}

  async share(messages: ChatMessage[], avatarUrl: string | null = null) {
    const msgs = messages
      .map((m) => ({
        from: m.role === "user" ? "human" : "gpt",
        value: m.content,
      }))
      .concat([
        {
          from: "human",
          value:
            "Share from [NextChat]: https://github.com/Yidadaa/ChatGPT-Next-Web",
        },
      ]);
    // 敬告二开开发者们，为了开源大模型的发展，请不要修改上述消息，此消息用于后续数据清洗使用
    // Please do not modify this message

    console.log("[Share]", messages, msgs);
    const clientConfig = getClientConfig();
    const proxyUrl = "/sharegpt";
    const rawUrl = "https://sharegpt.com/api/conversations";
    const shareUrl = clientConfig?.isApp ? rawUrl : proxyUrl;
    const res = await fetch(shareUrl, {
      body: JSON.stringify({
        avatarUrl,
        items: msgs,
      }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    const resJson = await res.json();
    console.log("[Share]", resJson);
    if (resJson.id) {
      return `https://shareg.pt/${resJson.id}`;
    }
  }
}

export function getHeaders() {
  const accessStore = useAccessStore.getState();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  const modelConfig = useChatStore.getState().currentSession().mask.modelConfig;
  const isGoogle = modelConfig.model.startsWith("gemini");
  const isAzure = accessStore.provider === ServiceProvider.Azure;
  const authHeader = isAzure ? "api-key" : "Authorization";
  const apiKey = isGoogle
    ? accessStore.googleApiKey
    : isAzure
      ? accessStore.azureApiKey
      : accessStore.openaiApiKey;
  const clientConfig = getClientConfig();
  const makeBearer = (s: string) => `${isAzure ? "" : "Bearer "}${s.trim()}`;
  const validString = (x: string) => x && x.length > 0;

  headers.lang = getLang();

  // when using google api in app, not set auth header
  if (!(isGoogle && clientConfig?.isApp)) {
    // use user's api key first
    if (validString(apiKey)) {
      headers[authHeader] = makeBearer(apiKey);
    } else if (
      accessStore.enabledAccessControl() &&
      validString(accessStore.accessCode)
    ) {
      headers[authHeader] = makeBearer(
        ACCESS_CODE_PREFIX + accessStore.accessCode,
      );
    }
  }

  return headers;
}

export function getHeadersNoCT() {
  const headers = getHeaders();
  const newHeaders: Record<string, string> = {};
  for (const key in headers) {
    if (key !== "Content-Type") {
      newHeaders[key] = headers[key];
    }
  }
  return newHeaders;
}

// 当模型不是vision, 或者特殊的那几个处理图像的模型时，content只能是文本
export function buildMessages(messages: RequestMessage[], model: string) {
  if (!model.includes("vision") && !isSpecImageModal(model)) {
    const sendMessages = JSON.parse(
      JSON.stringify(messages),
    ) as RequestMessage[];
    sendMessages.forEach((msg) => {
      if (msg.content instanceof Array) {
        let text = "";
        let fileUrls = "";
        msg.content.forEach((item) => {
          if (item.type == "text") {
            text += item.text;
          } else if (item.type == "image_url") {
            fileUrls += item.image_url?.url + "\n";
          } else if (item.type == "file") {
            fileUrls += item.file?.url + "\n";
          }
        });
        msg.content = fileUrls + text;
      } else if (typeof msg.content != "string") {
        msg.content = JSON.stringify(msg.content);
      }
    });
    return sendMessages;
  }
  return messages;
}
