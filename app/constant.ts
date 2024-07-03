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
export const ANTHROPIC_BASE_URL = "https://api.anthropic.com";

export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/";

export const GPT302_WEBSITE_URL = "https://www.302.ai";
export const GPT302_WEBSITE_CN_URL = "https://302ai.cn";

export const GPTS302_WEBSITE_URL = "https://gpts.302.ai/?simple_version=1";
export const GPTS302_WEBSITE_CN_URL = "https://gpts.302ai.cn/?simple_version=1";

export const Region = {
  China: 0,
  Overseas: 1,
};

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
  Cors = "",
  OpenAI = "/api/openai",
  Anthropic = "/api/anthropic",
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
  Plugin = "plugin-store",
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
export const LAST_INPUT_ID_KEY = "last-input-id";
export const UNFINISHED_INPUT = (id: string) => "unfinished-input-" + id;

export const STORAGE_KEY = "chatgpt-next-web";

export const REQUEST_TIMEOUT_MS = 60000;

export const EXPORT_MESSAGE_CLASS_NAME = "export-markdown";

export enum ServiceProvider {
  OpenAI = "OpenAI",
  Azure = "Azure",
  Google = "Google",
  Anthropic = "Anthropic",
}

export enum ModelProvider {
  GPT = "GPT",
  GeminiPro = "GeminiPro",
  Claude = "Claude",
}

export const Anthropic = {
  ChatPath: "v1/messages",
  ChatPath1: "v1/complete",
  ExampleEndpoint: "https://api.anthropic.com",
  Vision: "2023-06-01",
};

export const OpenaiPath = {
  ChatPath: "v1/chat/completions",
  UsagePath: "dashboard/billing/usage",
  SubsPath: "dashboard/billing/subscription",
  ListModelPath: "v1/models",
  AudioTranscriptionsPath: "v1/audio/transcriptions",
  AudioSpeechPath: "v1/audio/speech",
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
export const DEFAULT_GPT_SYSTEM_TEMPLATE =
  "You are ChatGPT, a large language model trained by {{ServiceProvider}}. " +
  "If the intention is not to translate, please reply in {{language}}. " +
  "Knowledge cutoff: {{cutoff}}. " +
  "Current model: {{model}}. " +
  "Current time: {{time}}. " +
  "Latex inline: (\\x^2\\) " +
  "Latex block: $$e=mc^2$$";
export const DEFAULT_SYSTEM_TEMPLATE =
  "Current model: {{model}}. Current time: ({{time}}). Latex inline: (\\x^2\\) Latex block: $$e=mc^2$$";

export const SUMMARIZE_MODEL = "gpt-3.5-turbo-0125";
export const GEMINI_SUMMARIZE_MODEL = "gemini-pro";

export const KnowledgeCutOffDate: Record<string, string> = {
  default: "2021-09",
  "gpt-4-turbo": "2023-12",
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
    name: "gpt-4-turbo",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "gpt-4-turbo-2024-04-09",
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
  {
    name: "claude-instant-1.2",
    available: true,
    provider: {
      id: "anthropic",
      providerName: "Anthropic",
      providerType: "anthropic",
    },
  },
  {
    name: "claude-2.0",
    available: true,
    provider: {
      id: "anthropic",
      providerName: "Anthropic",
      providerType: "anthropic",
    },
  },
  {
    name: "claude-2.1",
    available: true,
    provider: {
      id: "anthropic",
      providerName: "Anthropic",
      providerType: "anthropic",
    },
  },
  {
    name: "claude-3-opus-20240229",
    available: true,
    provider: {
      id: "anthropic",
      providerName: "Anthropic",
      providerType: "anthropic",
    },
  },
  {
    name: "claude-3-sonnet-20240229",
    available: true,
    provider: {
      id: "anthropic",
      providerName: "Anthropic",
      providerType: "anthropic",
    },
  },
  {
    name: "claude-3-haiku-20240307",
    available: true,
    provider: {
      id: "anthropic",
      providerName: "Anthropic",
      providerType: "anthropic",
    },
  },
  {
    name: "tts-1",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "tts-1-1106",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "tts-1-hd",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "tts-1-hd-1106",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
  {
    name: "whisper-1",
    available: true,
    provider: {
      id: "openai",
      providerName: "OpenAI",
      providerType: "openai",
    },
  },
] as const;

export const CHAT_PAGE_SIZE = 45;
export const MAX_RENDER_MSG_COUNT = 45;

// some famous webdav endpoints
export const internalWhiteWebDavEndpoints = [
  "https://dav.jianguoyun.com/dav/",
  "https://dav.dropdav.com/",
  "https://dav.box.com/dav",
  "https://nanao.teracloud.jp/dav/",
  "https://webdav.4shared.com/",
  "https://dav.idrivesync.com",
  "https://webdav.yandex.com",
  "https://app.koofr.net/dav/Koofr",
];

export const FILE_BASE64_ICON =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAXxJREFUeF7tm+ENgjAQhY8h3EeH0HXUJRzCJXQJXUc5IwkSgZS+a+7KI/EXpMLnu9fXqzQyfRzb06eZa9CnHyJyaD9P9MD/xmscAtBbKgbBK4BiEFIB3A1luf0ztrkSUgHsRMQKwmsErimECABMy8ErAFXZsCRMlOAZwEVEroOygEPwDED9Zm8NwTsAFYAphAgATCFEAWAGIRIAEwjRAMAhRAQAhRAVAAxCZAAQCNEBZEPwDOCcsPTeLE2MXgEkPPvkpbNrh9oBKB1V0mhfkwASm6KWHSFk91m72d0RRgGoutdGyo0AqACWAD3gS4AmGCUHcBYAEeA0iMwBms76qcoyCYIE8NlR6gchfYbRleXcWqAGAFmzQA0AqICcaZAKqMAE6QGcBTJaYvQAekD8JLh6EySAtQchKoAKWHkOYAmwBFgCy7fHa1gL0APoAfQAesDi/wjRBNkQYUPkZ2/Q6p1B1L5gN07/jTNoDkDfaInxCAAZhEr8YujvmFTAG2bcH1CZJ0dCAAAAAElFTkSuQmCC";

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
  "-5": "HOUR_QUOTA_ERROR", // 聊天机器人小时额度不足
};
export type ERROR_CODE_TYPE = keyof typeof ERROR_CODE;

// 模型是否支持多模态, 支持的话支持哪些类型
export const FILE_SUPPORT_TYPE = {
  NOTHING: 0,
  ALL: 1,
  ONLY_IMAGE: 2,
};

export const DASH_URL = {
  LOGIN: "https://dash.302.ai/login",
  REGISTER: "https://dash.302.ai/register",
  LOGIN_CN: "https://dash.302ai.cn/login",
  REGISTER_CN: "https://dash.302ai.cn/register",
};

export const DISABLED_SYSTEM_PROMPT_MODELS = [
  "ernie",
  "yi-vision",
  "baichuan",
  "chatlaw",
];
