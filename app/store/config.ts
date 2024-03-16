import { LLMModel } from "../client/api";
import { isMacOS } from "../utils";
import { getClientConfig } from "../config/client";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SIDEBAR_WIDTH,
  LOGO_BASE64_ICON,
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

export const DEFAULT_CONFIG = {
  lastUpdate: Date.now(), // timestamp, to merge state

  submitKey: SubmitKey.Enter,
  avatar: "1f603",
  fontSize: 14,
  theme: Theme.Auto as Theme,
  tightBorder: !!getClientConfig()?.isApp,
  sendPreviewBubble: false,
  enableAutoGenerateTitle: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,

  // disablePromptHint: false,

  // dontShowMaskSplashScreen: true, // dont show splash screen when create chat
  // hideBuiltinMasks: false, // dont add builtin masks

  customModels: "",
  models: DEFAULT_MODELS as any as LLMModel[],

  // modelConfig: {
  //   model: "gpt-3.5-turbo" as ModelType,
  //   temperature: 0.5,
  //   top_p: 1,
  //   max_tokens: 32000,
  //   presence_penalty: 0,
  //   frequency_penalty: 0,
  //   sendMemory: true,
  //   historyMessageCount: 4,
  //   compressMessageLengthThreshold: 1000,
  //   enableInjectSystemPrompts: true,
  //   template: DEFAULT_INPUT_TEMPLATE,

  //   // 用户自定义的系统提示信息
  //   enableInjectCustomSystemPrompts: false,
  //   injectCustomSystemPrompts: "",
  // },

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

  isGpts: false,
  gptsConfig: {
    author: "",
    code: "",
    description: "",
    logo_url: "",
    name: "",
  },
};

export type ChatConfig = typeof DEFAULT_CONFIG &
  typeof DEFAULT_SETTING &
  typeof CHATBOT_CONFIG;
export type ChatbotSetting = typeof DEFAULT_SETTING;

export type ModelConfig = ChatConfig["modelConfig"];

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
