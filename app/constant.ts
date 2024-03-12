export const OWNER = "Yidadaa";
export const REPO = "ChatGPT-Next-Web";
export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const ISSUE_URL = `https://github.com/${OWNER}/${REPO}/issues`;
export const UPDATE_URL = `${REPO_URL}#keep-updated`;
export const RELEASE_URL = `${REPO_URL}/releases`;
export const FETCH_COMMIT_URL = `https://api.github.com/repos/${OWNER}/${REPO}/commits?per_page=1`;
export const FETCH_TAG_URL = `https://api.github.com/repos/${OWNER}/${REPO}/tags?per_page=1`;
export const RUNTIME_CONFIG_DOM = "danger-runtime-config";

export const DEFAULT_API_HOST = "https://api.nextchat.dev";
export const OPENAI_BASE_URL = "https://api.openai.com";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/";

export const GPT302_WEBSITE_URL = "https://www.gpt302.com";

export enum Path {
  Home = "/",
  Bot = "/bot/",
  Chat = "/chat",
  Settings = "/settings",
  NewChat = "/new-chat",
  Masks = "/masks",
  Auth = "/auth",
}

export enum ApiPath {
  Cors = "/api/cors",
  OpenAI = "/api/openai",
}

export enum SlotID {
  AppBody = "app-body",
  CustomModel = "custom-model",
}

export enum FileName {
  Masks = "masks.json",
  Prompts = "prompts.json",
}

export enum StoreKey {
  Chat = "chat-next-web-store",
  Access = "access-control",
  Config = "app-config",
  Mask = "mask-store",
  Prompt = "prompt-store",
  Update = "chat-update",
  Sync = "sync",
}

export const DEFAULT_SIDEBAR_WIDTH = 300;
export const MAX_SIDEBAR_WIDTH = 500;
export const MIN_SIDEBAR_WIDTH = 230;
export const NARROW_SIDEBAR_WIDTH = 100;

export const ACCESS_CODE_PREFIX = "nk-";

export const LAST_INPUT_KEY = "last-input";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const STORAGE_KEY = "chatgpt-next-web";

export const REQUEST_TIMEOUT_MS = 60000;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

export enum ServiceProvider {
  OpenAI = "OpenAI",
  Azure = "Azure",
  Google = "Google",
}

export enum ModelProvider {
  GPT = "GPT",
  GeminiPro = "GeminiPro",
}

export const OpenaiPath = {
  ChatPath: "v1/chat/completions",
  UsagePath: "dashboard/billing/usage",
  SubsPath: "dashboard/billing/subscription",
  ListModelPath: "v1/models",
};

export const Azure = {
  ExampleEndpoint: "https://{resource-url}/openai/deployments/{deploy-id}",
};

export const Google = {
  ExampleEndpoint: "https://generativelanguage.googleapis.com/",
  ChatPath: "v1beta/models/gemini-pro:generateContent",
  VisionChatPath: "v1beta/models/gemini-pro-vision:generateContent",

  // /api/openai/v1/chat/completions
};

export const DEFAULT_INPUT_TEMPLATE = `{{input}}`; // input / time / model / lang
export const DEFAULT_SYSTEM_TEMPLATE = `
You are ChatGPT, a large language model trained by {{ServiceProvider}}.
If the intention is not to translate, please reply in {{language}}
Knowledge cutoff: {{cutoff}}
Current model: {{model}}
Current time: {{time}}
Latex inline: $x^2$ 
Latex block: $$e=mc^2$$
`;

export const SUMMARIZE_MODEL = "gpt-3.5-turbo";
export const GEMINI_SUMMARIZE_MODEL = "gemini-pro";

export const KnowledgeCutOffDate: Record<string, string> = {
  default: "2021-09",
  "gpt-4-turbo-preview": "2023-12",
  "gpt-4-1106-preview": "2023-04",
  "gpt-4-0125-preview": "2023-12",
  "gpt-4-vision-preview": "2023-04",
  // After improvements,
  // it's now easier to add "KnowledgeCutOffDate" instead of stupid hardcoding it, as was done previously.
  "gemini-pro": "2023-12",
};

export const DEFAULT_MODELS = [
  {
    name: "gpt-4",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-all",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-0314",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-0613",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-32k",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-32k-0314",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-32k-0613",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-turbo-preview",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-1106-preview",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-0125-preview",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-vision-preview",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-3.5-turbo",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-3.5-turbo-0125",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-3.5-turbo-0301",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-3.5-turbo-0613",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-3.5-turbo-1106",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-3.5-turbo-16k",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-3.5-turbo-16k-0613",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gemini-pro",
    available: true,
    provider: {
      id: "google",
      providerName: "Google",
      providerType: "google",
    },
  },
  {
    name: "gemini-pro-vision",
    available: true,
    provider: {
      id: "google",
      providerName: "Google",
      providerType: "google",
    },
  },
] as const;

export const CHAT_PAGE_SIZE = 15;
export const MAX_RENDER_MSG_COUNT = 45;

export const FILE_BASE64_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAXxJREFUeF7tm+ENgjAQhY8h3EeH0HXUJRzCJXQJXUc5IwkSgZS+a+7KI/EXpMLnu9fXqzQyfRzb06eZa9CnHyJyaD9P9MD/xmscAtBbKgbBK4BiEFIB3A1luf0ztrkSUgHsRMQKwmsErimECABMy8ErAFXZsCRMlOAZwEVEroOygEPwDED9Zm8NwTsAFYAphAgATCFEAWAGIRIAEwjRAMAhRAQAhRAVAAxCZAAQCNEBZEPwDOCcsPTeLE2MXgEkPPvkpbNrh9oBKB1V0mhfkwASm6KWHSFk91m72d0RRgGoutdGyo0AqACWAD3gS4AmGCUHcBYAEeA0iMwBms76qcoyCYIE8NlR6gchfYbRleXcWqAGAFmzQA0AqICcaZAKqMAE6QGcBTJaYvQAekD8JLh6EySAtQchKoAKWHkOYAmwBFgCy7fHa1gL0APoAfQAesDi/wjRBNkQYUPkZ2/Q6p1B1L5gN07/jTNoDkDfaInxCAAZhEr8YujvmFTAG2bcH1CZJ0dCAAAAAElFTkSuQmCC";

export const LOGO_BASE64_ICON =
  "data:image/png;base64,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";

export const ERROR_CODE = {
  "-99": "CAPTCHA_ERROR", // 验证码错误
  "-100": "CHATBOT_DISABLED_ERROR", // 机器人禁用
  "-101": "CHATBOT_DELETE_ERROR", // 机器人删除
  "-10002": "CHATBOT_DISABLED_ERROR2", // 机器人删除
  "-10003": "SERVER_ERROR", // 内部错误
  "-10004": "BALANCE_LIMIT_ERROR", // 账户余额不足
  "-10005": "TOKEN_EXPIRED_ERROR", // token过期
  "-10006": "TOTAL_QUOTA_ERROR", // 聊天机器人总额度不足
  "-10007": "DAILY_QUOTA_ERROR", // 聊天机器人当天额度不足
};
export type ERROR_CODE_TYPE = keyof typeof ERROR_CODE;
