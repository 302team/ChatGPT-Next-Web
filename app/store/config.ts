import { LLMModel } from "../client/api";
import { isMacOS } from "../utils";
import { getClientConfig } from "../config/client";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SIDEBAR_WIDTH,
  StoreKey,
} from "../constant";
import { createPersistStore } from "../utils/store";
import Locale, { getLang } from "../locales";

export type ModelType = (typeof DEFAULT_MODELS)[number]["name"];

export enum SubmitKey {
  Enter = "Enter",
  CtrlEnter = "Ctrl + Enter",
  ShiftEnter = "Shift + Enter",
  AltEnter = "Alt + Enter",
  MetaEnter = "Meta + Enter",
}

export enum Theme {
  Auto = "auto",
  Dark = "dark",
  Light = "light",
}

export interface Model {
  id: number;
  remark: string;
  en_remark: string;
  is_default: boolean;
  enable: boolean;
  model: string;
}

const models: Model[] = [
  {
    id: 10,
    remark: "",
    en_remark: "",
    is_default: false,
    enable: false,
    model: "gpt-4-0125-preview",
  },
  {
    id: 12,
    remark: "",
    en_remark: "",
    is_default: false,
    enable: false,
    model: "gpt-4-1106-preview",
  },
  {
    id: 17,
    remark: "最便宜4.0",
    en_remark: "Latest GPT4.0",
    is_default: false,
    enable: false,
    model: "gpt-4-turbo-preview",
  },
  {
    id: 18,
    remark: "速度最快",
    en_remark: "Multimodal GPT4.0",
    is_default: false,
    enable: false,
    model: "gpt-4-vision-preview",
  },
  {
    id: 32,
    remark: "最便宜",
    en_remark: "Cheapest GPT3.5",
    is_default: false,
    enable: false,
    model: "gpt-3.5-turbo-0125",
  },
  {
    id: 41,
    remark: "",
    en_remark: "",
    is_default: false,
    enable: false,
    model: "claude-3-opus",
  },
  {
    id: 43,
    remark: "最便宜Claude 3",
    en_remark: "Cheapest Claude 3",
    is_default: false,
    enable: false,
    model: "claude-3-haiku",
  },
  {
    id: 50,
    remark: "阿里通义千问",
    en_remark: "Tongyi Qianwen",
    is_default: false,
    enable: false,
    model: "qwen-max",
  },
  {
    id: 52,
    remark: "智谱GLM-4",
    en_remark: "ZHIPU GLM-4",
    is_default: false,
    enable: false,
    model: "glm-4",
  },
  {
    id: 60,
    remark: "月之暗面kimi",
    en_remark: "Moonshot kimi AI",
    is_default: false,
    enable: false,
    model: "moonshot-v1-8k",
  },
  {
    id: 65,
    remark: "百川大模型",
    en_remark: "Baichuan AI",
    is_default: false,
    enable: false,
    model: "Baichuan2-53B",
  },
  {
    id: 69,
    remark: "零一万物",
    en_remark: "01.AI",
    is_default: false,
    enable: false,
    model: "yi-34b-chat-0205",
  },
  {
    id: 72,
    remark: "",
    en_remark: "",
    is_default: false,
    enable: false,
    model: "gemini-pro",
  },
  {
    id: 73,
    remark: "",
    en_remark: "",
    is_default: false,
    enable: false,
    model: "gemini-pro-vision",
  },
  {
    id: 78,
    remark: "百度文心一言",
    en_remark: "Baidu ERNIE Bot",
    is_default: false,
    enable: false,
    model: "ERNIE-4.0-8K",
  },
  {
    id: 16,
    remark: "官方ChatGPT Plus",
    en_remark: "Official ChatGPT Plus",
    is_default: true,
    enable: false,
    model: "gpt-4-all",
  },
];

export const DEFAULT_CONFIG = {
  lastUpdate: Date.now(), // timestamp, to merge state

  submitKey: SubmitKey.Enter,
  avatar: "1f603",
  fontSize: 14,
  theme: Theme.Light as Theme,
  tightBorder: !!getClientConfig()?.isApp,
  sendPreviewBubble: false,
  enableAutoGenerateTitle: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,

  customModels: "",
  models: DEFAULT_MODELS as any as LLMModel[],

  modelList: models,

  speech: {
    voice: "onyx",
    response_format: "mp3",
    speed: 1.0,
  },
  tts: {
    lang: "zh-CN",
    voice: "Microsoft Huihui - Chinese (Simplified, PRC)",
  },
};

export const DEFAULT_SETTING = {
  chatbotInfo: "---",

  chatbotName: "",
  chatbotDesc: "",
  chatbotLogo: "",
};

export const CHATBOT_CONFIG = {
  // 助手启动页
  dontShowMaskSplashScreen: true, // dont show splash screen when create chat
  // 隐藏内置助手
  hideBuiltinMasks: false, // dont add builtin masks
  // 自定义提示词
  disablePromptHint: false,

  // prompts: [],

  modelConfig: {
    model: "gpt-4-all", // 模型 (model):
    temperature: 0.5, // 随机性 (temperature): 值越大，回复越随机
    top_p: 1, // 核采样 (top_p): 与随机性类似，但不要和随机性一起更改
    max_tokens: 32000, // 单次回复限制 (max_tokens): 单次交互所用的最大 Token 数
    presence_penalty: 0, // 话题新鲜度 (presence_penalty): 值越大，越有可能扩展到新话题
    frequency_penalty: 0, // 频率惩罚度 (frequency_penalty): 值越大，越有可能降低重复字词
    enableInjectSystemPrompts: true, // 注入系统级提示信息【注入默认系统提示信息】: 强制给每次请求的消息列表开头添加一个模拟 ChatGPT 的系统提示
    enableInjectCustomSystemPrompts: false, // 注入自定义系统提示信息: 强制给每次请求的消息列表开头添加一个模拟 ChatGPT 的系统提示
    injectCustomSystemPrompts: "", // 注入自定义系统提示信息: 强制给每次请求的消息列表开头添加一个模拟 ChatGPT 的系统提示
    template: DEFAULT_INPUT_TEMPLATE, // 用户输入预处理: 用户最新的一条消息会填充到此模板
    historyMessageCount: 4, // 附带历史消息数: 每次请求携带的历史消息数
    compressMessageLengthThreshold: 1000, // 历史消息长度压缩阈值: 当未压缩的历史消息超过该值时，将进行压缩
    sendMemory: true, // 历史摘要: 自动压缩聊天记录并作为上下文发送
  },

  showShareEntry: true,
  useGpts: false, // 是否开启 gpts 应用
  openTTS: false, // 是否开启 语音功能 (语音转文字, 文字转语音)
  isGpts: false,
  gptsConfig: {
    author: "",
    code: "",
    description: "",
    logo_url: "",
    name: "",
  },

  pluginConfig: {
    enable: false, // 是否开启插件
    maxIterations: 10, // 最大迭代数
    returnIntermediateSteps: true, // 是否返回插件调用的中间步骤
  },
};

export type ChatConfig = typeof DEFAULT_CONFIG &
  typeof DEFAULT_SETTING &
  typeof CHATBOT_CONFIG;
export type ChatbotSetting = Partial<typeof DEFAULT_SETTING> &
  Partial<typeof CHATBOT_CONFIG>;

export type ModelConfig = ChatConfig["modelConfig"];
export type PluginConfig = ChatConfig["pluginConfig"];

export function limitNumber(
  x: number,
  min: number,
  max: number,
  defaultValue: number,
) {
  if (isNaN(x)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, x));
}

export const ModalConfigValidator = {
  model(x: string) {
    return x as ModelType;
  },
  max_tokens(x: number) {
    return limitNumber(x, 0, 512000, 1024);
  },
  presence_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  frequency_penalty(x: number) {
    return limitNumber(x, -2, 2, 0);
  },
  temperature(x: number) {
    return limitNumber(x, 0, 2, 1);
  },
  top_p(x: number) {
    return limitNumber(x, 0, 1, 1);
  },
};

export const useAppConfig = createPersistStore(
  { ...DEFAULT_CONFIG, ...CHATBOT_CONFIG, ...DEFAULT_SETTING },
  (set, get) => ({
    reset() {
      set(() => ({ ...DEFAULT_CONFIG }));
    },

    mergeModels(newModels: LLMModel[]) {
      if (!newModels || newModels.length === 0) {
        return;
      }

      const oldModels = get().models;
      const modelMap: Record<string, LLMModel> = {};

      for (const model of oldModels) {
        model.available = false;
        modelMap[model.name] = model;
      }

      for (const model of newModels) {
        model.available = true;
        modelMap[model.name] = model;
      }

      set(() => ({
        models: Object.values(modelMap),
      }));
    },

    allModels() {},
  }),
  {
    name: StoreKey.Config,
    version: 3.8,
    migrate(persistedState, version) {
      const state = persistedState as ChatConfig;

      if (version < 3.4) {
        state.modelConfig.sendMemory = true;
        state.modelConfig.historyMessageCount = 4;
        state.modelConfig.compressMessageLengthThreshold = 1000;
        state.modelConfig.frequency_penalty = 0;
        state.modelConfig.top_p = 1;
        state.modelConfig.template = DEFAULT_INPUT_TEMPLATE;
        state.dontShowMaskSplashScreen = false;
        state.hideBuiltinMasks = false;
      }

      if (version < 3.5) {
        state.customModels = "claude,claude-100k";
      }

      if (version < 3.6) {
        state.modelConfig.enableInjectSystemPrompts = true;
      }

      if (version < 3.7) {
        state.enableAutoGenerateTitle = true;
      }

      if (version < 3.8) {
        state.lastUpdate = Date.now();
      }

      return state as any;
    },
  },
);
