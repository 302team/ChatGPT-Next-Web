import {
  trimTopic,
  getMessageTextContent,
  isSupportMultimodal,
  isVisionModel,
  isSpecImageModal,
  uploadRemoteFile,
  isSupportFunctionCall,
  sleep,
  getBase64FromUrl,
  compressBase64Image,
  getFileBase64,
} from "../utils";

import Locale, { getLang } from "../locales";
import { showToast } from "../components/ui-lib";
import {
  Model,
  ModelConfig,
  ModelFileSupportType,
  ModelType,
  useAppConfig,
} from "./config";
import { createEmptyMask, Mask } from "./mask";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_GPT_SYSTEM_TEMPLATE,
  KnowledgeCutOffDate,
  ModelProvider,
  StoreKey,
  SUMMARIZE_MODEL,
  GEMINI_SUMMARIZE_MODEL,
  FILE_SUPPORT_TYPE,
  DEFAULT_SYSTEM_TEMPLATE,
  LAST_INPUT_ID_KEY,
  DISABLED_SYSTEM_PROMPT_MODELS,
} from "../constant";
import {
  ClientApi,
  RequestMessage,
  MultimodalContent,
  SpeechOptions,
} from "../client/api";
import { ChatControllerPool } from "../client/controller";
import { prettyObject } from "../utils/format";
import { estimateTokenLength } from "../utils/token";
import { nanoid } from "nanoid";
import { createPersistStore } from "../utils/store";
import { usePluginStore } from "./plugin";
import { useAccessStore } from "./access";

export interface ChatToolMessage {
  toolName: string;
  toolInput?: string;
}

export type ChatMessage = RequestMessage & {
  date: string;
  toolMessages?: ChatToolMessage[];
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
  retryCount?: number;
  isIgnore4History?: boolean;
  isTimeoutAborted?: boolean;
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
    toolMessages: new Array<ChatToolMessage>(),
    role: "user",
    content: "",
    ...override,
  };
}

export interface ChatStat {
  tokenCount: number;
  wordCount: number;
  charCount: number;
}

export interface ChatSession {
  id: string;
  topic: string;

  memoryPrompt: string;
  messages: ChatMessage[];
  stat: ChatStat;
  lastUpdate: number;
  lastSummarizeIndex: number;
  clearContextIndex?: number;

  mask: Mask;
}

export interface UploadFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  originFileObj: File;
  lastModified: number;
  lastModifiedDate: Date;
  status: string;
  response: {
    fileUrl?: string;
    base64?: string;
    data?: {
      url?: string;
    };
  };
}

export interface FileRes {
  name: string;
  type: string;
  url: string;
  base64: string;
  fileObj: File;
}

export interface ExtAttr {
  retryCount?: number;
  uploadFiles: UploadFile[];

  isResend?: boolean;
  models?: Model[];

  onResend?: (
    messages: ChatMessage | ChatMessage[],
    botTarget?: string,
    retryCount?: number,
  ) => void;
  setAutoScroll: ((autoScroll: boolean) => void) | undefined;
  setUploadFiles: React.Dispatch<React.SetStateAction<UploadFile[]>>;
}

export const DEFAULT_TOPIC = Locale.Store.DefaultTopic;
export const BOT_HELLO: ChatMessage = createMessage({
  role: "assistant",
  content: Locale.Store.BotHello,
});

function createEmptySession(): ChatSession {
  return {
    id: nanoid(),
    topic: DEFAULT_TOPIC,
    memoryPrompt: "",
    messages: [],
    stat: {
      tokenCount: 0,
      wordCount: 0,
      charCount: 0,
    },
    lastUpdate: Date.now(),
    lastSummarizeIndex: 0,

    mask: createEmptyMask(),
  };
}

function getSummarizeModel(currentModel: string) {
  // if it is using gpt-* models, force to use 3.5 to summarize
  if (currentModel.startsWith("gpt") || currentModel.startsWith("claude")) {
    return SUMMARIZE_MODEL;
  }
  if (currentModel.startsWith("gemini-pro")) {
    return GEMINI_SUMMARIZE_MODEL;
  }
  return currentModel;
}

function countMessages(msgs: ChatMessage[]) {
  return msgs.reduce(
    (pre, cur) => pre + estimateTokenLength(getMessageTextContent(cur)),
    0,
  );
}

function fillTemplateWith(input: string, modelConfig: ModelConfig) {
  const cutoff =
    KnowledgeCutOffDate[modelConfig.model] ?? KnowledgeCutOffDate.default;
  // Find the model in the DEFAULT_MODELS array that matches the modelConfig.model
  const modelInfo = DEFAULT_MODELS.find((m) => m.name === modelConfig.model);

  var serviceProvider = "OpenAI";
  if (modelInfo) {
    // TODO: auto detect the providerName from the modelConfig.model

    // Directly use the providerName from the modelInfo
    serviceProvider = modelInfo.provider.providerName;
  }

  const vars = {
    ServiceProvider: serviceProvider,
    cutoff,
    model: modelConfig.model,
    time: new Date().toString(),
    lang: getLang(),
    input: input,
    language: window.navigator.language,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

  // remove duplicate
  if (input.startsWith(output)) {
    output = "";
  }

  // must contains {{input}}
  const inputVar = "{{input}}";
  if (!output.includes(inputVar)) {
    output += "\n" + inputVar;
  }

  Object.entries(vars).forEach(([name, value]) => {
    const regex = new RegExp(`{{${name}}}`, "g");
    output = output.replace(regex, value.toString()); // Ensure value is a string
  });

  return output;
}

async function getFileArr(uploadFiles: UploadFile[]): Promise<FileRes[]> {
  if (!uploadFiles || uploadFiles.length < 1) {
    return [];
  }
  const fileArr = [];
  for (const file of uploadFiles) {
    let url = "";
    let imgBase64 = "";
    if (file.response && file.response.fileUrl) {
      url = file.response.fileUrl;
    } else if (file.response && file.response.data && file.response.data.url) {
      url = file.response.data.url;
    }
    if (file.type?.includes("image")) {
      imgBase64 =
        file.response.base64 ??
        ((await getFileBase64(file.originFileObj)) as string);
    }
    const fileParam = {
      name: file.name,
      type: file.type,
      url: url,
      base64: imgBase64,
      fileObj: file.originFileObj,
    };
    fileArr.push(fileParam);
  }
  return fileArr;
}

async function getUserContent(
  userInput: string,
  fileArr: FileRes[],
  modelConfig: ModelConfig & { fileSupportType?: ModelFileSupportType },
) {
  const content = fillTemplateWith(userInput, modelConfig);
  const model = modelConfig.model;

  let sendContent: string | MultimodalContent = content;
  if (fileArr.length > 0) {
    const sendUserContent = []; // 发送出去的用户内容
    const saveUserContent = []; // 保存的用户内容
    let msg: MultimodalContent = {
      type: "text",
      text: content,
    };
    sendUserContent.push(msg);
    saveUserContent.push(msg);
    for (const file of fileArr) {
      // 如果是gpt4-vision，或者claude模型，claude模型目前是根据中转接口来定的报文格式，以后要改成官方报文格式
      if (
        file.type.includes("image") &&
        modelConfig.fileSupportType === FILE_SUPPORT_TYPE.ONLY_IMAGE
      ) {
        if (file.url && file.url.startsWith("http")) {
          msg = {
            type: "image_url",
            image_url: {
              url: file.url,
            },
          };
          // 保存的消息是保存文件链接
          saveUserContent.push(msg);
          // 发送则需要判断是否发送链接
          if (isVisionModel(model)) {
            // gpt-4-vision 需要传递 base64 数据
            sendUserContent.push({
              type: "image_url",
              image_url: {
                url: file.base64,
              },
            });
          } else {
            sendUserContent.push(msg);
          }
        } else if (file.base64) {
          // 发送出去是原图，提高识别率。
          sendUserContent.push({
            type: "image_url",
            image_url: {
              url: file.base64,
            },
          });
          // 如果是base64，则需要压缩到100k以内保存。
          saveUserContent.push({
            type: "image_url",
            image_url: {
              url: await compressBase64Image(file.base64),
            },
          });
        }
      } else {
        if (modelConfig.model.includes("qwen-vl")) {
          msg = {
            type: "image_url",
            image_url: {
              url: file.url,
            },
          };
        } else {
          msg = {
            type: "file",
            file: {
              name: file.name,
              type: file.type,
              url: file.url,
            },
          };
        }
        sendUserContent.push(msg);
        saveUserContent.push(msg);
      }
    }
    return {
      sendUserContent,
      saveUserContent,
    };
  } else {
    // 千问的格式不能是 content: ""
    // 它需要 { type: "text", text: "" }
    if (modelConfig.model.includes("qwen-vl")) {
      sendContent = {
        type: "text",
        text: content,
      };
    }
  }
  return {
    sendUserContent: sendContent,
    saveUserContent: content,
  };
}

async function getResendUserContent(
  content: string | MultimodalContent[],
  modelConfig: ModelConfig,
) {
  const model = modelConfig.model;
  if (
    (isVisionModel(model) || isSpecImageModal(model)) &&
    content instanceof Array
  ) {
    const sendUserContent = []; // 发送出去的用户内容
    const saveUserContent = []; // 保存的用户内容
    for (const msg of content) {
      if (msg.type == "text") {
        sendUserContent.push(msg);
        saveUserContent.push(msg);
      } else if (msg.type == "image_url") {
        // 保存不变
        saveUserContent.push(msg);
        // sendUserContent.push(msg);

        // 发出去的要判断是否url, 如果是url，但是需要base64数据，则需要获取base64
        if (msg.image_url?.url.startsWith("http") && !isSpecImageModal(model)) {
          const imageData = await getBase64FromUrl(msg.image_url.url);
          sendUserContent.push({
            type: "image_url",
            image_url: {
              url: imageData.base64,
            },
          });
        } else {
          sendUserContent.push(msg);
        }
      }
    }
    return {
      sendUserContent,
      saveUserContent,
    };
  }
  return {
    sendUserContent: content,
    saveUserContent: content,
  };
}

async function getFileFromUrl(fileUrl: string, fileName: string) {
  let fileObj = undefined;
  await fetch(fileUrl, {
    method: "get",
    body: null,
  })
    .then((response) => response.blob())
    .then((blob) => {
      fileObj = new File([blob], fileName);
    });
  return fileObj;
}

const DEFAULT_CHAT_STATE = {
  sessions: [createEmptySession()],
  currentSessionIndex: 0,
};

export const useChatStore = createPersistStore(
  DEFAULT_CHAT_STATE,
  (set, _get) => {
    function get() {
      return {
        ..._get(),
        ...methods,
      };
    }

    const methods = {
      clearSessions() {
        set(() => ({
          sessions: [createEmptySession()],
          currentSessionIndex: 0,
        }));
      },

      selectSession(index: number) {
        set({
          currentSessionIndex: index,
        });
      },

      moveSession(from: number, to: number) {
        set((state) => {
          const { sessions, currentSessionIndex: oldIndex } = state;

          // move the session
          const newSessions = [...sessions];
          const session = newSessions[from];
          newSessions.splice(from, 1);
          newSessions.splice(to, 0, session);

          // modify current session id
          let newIndex = oldIndex === from ? to : oldIndex;
          if (oldIndex > from && oldIndex <= to) {
            newIndex -= 1;
          } else if (oldIndex < from && oldIndex >= to) {
            newIndex += 1;
          }

          return {
            currentSessionIndex: newIndex,
            sessions: newSessions,
          };
        });
      },

      newSession(mask?: Mask, override?: boolean) {
        const session = createEmptySession();
        const config = useAppConfig.getState();

        if (config.isGpts) {
          if (config.gptsConfig.logo_url) {
            session.mask.avatar = config.gptsConfig.logo_url;
          }
          if (config.gptsConfig.description) {
            session.mask.botHelloContent = config.gptsConfig.description;
          }
        }

        if (mask) {
          const globalModelConfig = config.modelConfig;

          session.mask = {
            ...mask,
            modelConfig: {
              ...globalModelConfig,
              ...(override ? mask.modelConfig : {}),
            },
          };
          session.topic = mask.name;
        }

        set((state) => ({
          currentSessionIndex: 0,
          sessions: [session].concat(state.sessions),
        }));
      },

      nextSession(delta: number) {
        const n = get().sessions.length;
        const limit = (x: number) => (x + n) % n;
        const i = get().currentSessionIndex;
        get().selectSession(limit(i + delta));
      },

      deleteSession(index: number) {
        const deletingLastSession = get().sessions.length === 1;
        const deletedSession = get().sessions.at(index);

        if (!deletedSession) return;

        const sessions = get().sessions.slice();
        sessions.splice(index, 1);

        const currentIndex = get().currentSessionIndex;
        let nextIndex = Math.min(
          currentIndex - Number(index < currentIndex),
          sessions.length - 1,
        );

        if (deletingLastSession) {
          const config = useAppConfig.getState();
          nextIndex = 0;
          const session = createEmptySession();
          if (config.isGpts) {
            if (config.gptsConfig.logo_url) {
              session.mask.avatar = config.gptsConfig.logo_url;
            }
            if (config.gptsConfig.description) {
              session.mask.botHelloContent = config.gptsConfig.description;
            }
          }
          sessions.push(session);
        }

        // for undo delete action
        const restoreState = {
          currentSessionIndex: get().currentSessionIndex,
          sessions: get().sessions.slice(),
        };

        set(() => ({
          currentSessionIndex: nextIndex,
          sessions,
        }));

        showToast(
          Locale.Home.DeleteToast,
          {
            text: Locale.Home.Revert,
            onClick() {
              set(() => restoreState);
            },
          },
          5000,
        );
      },

      currentSession() {
        let index = get().currentSessionIndex;
        const sessions = get().sessions;

        if (index < 0 || index >= sessions.length) {
          index = Math.min(sessions.length - 1, Math.max(0, index));
          set(() => ({ currentSessionIndex: index }));
        }

        const session = sessions[index];

        return session;
      },

      onNewMessage(message: ChatMessage, summarize = true) {
        get().updateCurrentSession((session) => {
          session.messages = session.messages.concat();
          session.lastUpdate = Date.now();
        });
        get().updateStat(message);
        if (summarize) {
          get().summarizeSession();
        }
      },

      async onUserInput(
        content: string | MultimodalContent[],
        extAttr: ExtAttr,
      ) {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;

        const fileArr = await getFileArr(extAttr.uploadFiles);
        extAttr?.setUploadFiles([]); // 删除文件

        const { sendUserContent, saveUserContent } = extAttr?.isResend
          ? await getResendUserContent(content, modelConfig)
          : await getUserContent(content as string, fileArr, modelConfig);
        console.log("[User Input] after pretreatment: ", sendUserContent);
        console.log("[User Input] after pretreatment: ", saveUserContent);

        const userMessage = createMessage({
          role: "user",
          content: sendUserContent as string | MultimodalContent[],
          model: modelConfig.model as ModelType,
        });
        const botMessage = createMessage({
          role: "assistant",
          streaming: true,
          model: modelConfig.model as ModelType,
          toolMessages: [],
        });
        // get recent messages
        const recentMessages = get().getMessagesWithMemory();
        const sendMessages = recentMessages.concat(userMessage);
        console.log("🚀 ~ sendMessages:", sendMessages);
        const messageIndex = get().currentSession().messages.length + 1;

        // plugin
        const config = useAppConfig.getState();
        const pluginConfig = useAppConfig.getState().pluginConfig;
        const pluginStore = usePluginStore.getState();

        const currentLang = getLang();
        // 应用商店的模型, 使用内置插件
        const allPlugins = session.mask.isStoreModel
          ? pluginStore
              .getBuildinPlugins()
              .filter(
                (m) =>
                  (["cn"].includes(currentLang)
                    ? m.lang === currentLang
                    : m.lang === "en") && m.enable,
              )
          : pluginStore.getUserPlugins().filter((i) => i.enable);

        // 最新回复的顶到最前面
        if (get().currentSessionIndex !== 0) {
          get().moveSession(get().currentSessionIndex, 0);
        }

        // save user's and bot's message
        get().updateCurrentSession((session) => {
          const savedUserMessage = {
            ...userMessage,
            content: saveUserContent,
          } as ChatMessage;
          session.messages = session.messages.concat([
            savedUserMessage,
            botMessage,
          ]);
        });

        var api: ClientApi = new ClientApi(ModelProvider.GPT);
        if (
          // 应用商店创建的模型, 需要根据后端控制是否支持插件调用
          (session.mask.isStoreModel && session.mask.usePlugins) ||
          // 或者
          (!session.mask.isStoreModel &&
            config.pluginConfig.enable &&
            allPlugins.length > 0)
        ) {
          console.log(
            "[ToolAgent] start; plugins:",
            allPlugins.map((i) => i.name).join(", "),
          );
          const pluginToolNames = allPlugins.map((m) => m.toolName);
          const webSearchPlugin = allPlugins.find(
            (m) => m.toolName === "web-search",
          );
          const searchEngine =
            webSearchPlugin && webSearchPlugin.engine
              ? webSearchPlugin.engine
              : "searchapi";

          api.llm.toolAgentChat({
            messages: sendMessages,
            config: { ...modelConfig, stream: true },
            agentConfig: {
              ...pluginConfig,
              useTools: pluginToolNames,
              searchEngine,
            },
            retryCount: extAttr.retryCount ?? 0,
            onAborted: (message) => {
              botMessage.isTimeoutAborted = true;
              if (message) {
                botMessage.content = message;
              }
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
            },
            onRetry: () => {
              if (userMessage.retryCount == undefined) {
                userMessage.retryCount = 0;
              }
              ++userMessage.retryCount;

              const savedUserMessage = {
                ...userMessage,
                content: saveUserContent,
              } as ChatMessage;
              extAttr.onResend?.(savedUserMessage);
            },
            onUpdate(message) {
              botMessage.streaming = true;
              if (message) {
                botMessage.content = message;
              }
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
            },
            onToolUpdate(toolName, toolInput) {
              botMessage.streaming = true;
              if (toolName && toolInput) {
                botMessage.toolMessages!.push({
                  toolName,
                  toolInput,
                });
              }
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
            },
            onFinish(message, hasError) {
              console.warn("🚀 ~ onFinish ~ message:", message);
              let content: string | MultimodalContent[] = message;
              let _hasError = false;

              try {
                const resJson = JSON.parse(message);
                console.log("🚀 ~ onFinish ~ resJson:", resJson);
                if (resJson.error) {
                  _hasError = true;
                  content = "Network error, please retry";
                  // content = prettyObject({
                  //   error: true,
                  //   message: message,
                  // });
                } else {
                  _hasError = false;
                  content = [];

                  if (resJson.type === "image") {
                    content.push({
                      type: "image_url",
                      image_url: {
                        url: resJson.url,
                      },
                    });

                    // if (resJson.revised_prompt) {
                    //   content.unshift({
                    //     type: "text",
                    //     text: Locale.Dall.RevisedPrompt(resJson.revised_prompt),
                    //   });
                    // }
                  } else {
                    content.push({
                      type: "text",
                      text: message,
                    });
                  }
                }
              } catch (error) {}
              console.log("🚀 ~ onFinish ~ content:", content);

              botMessage.streaming = false;
              botMessage.content = content ?? "";
              botMessage.isError = (hasError || _hasError) as boolean;
              // 如果没有不包含中文,就弹翻译的提示
              if (!hasError) {
                // messageTranslate(message, botMessage);
              }
              get().onNewMessage(botMessage);
              ChatControllerPool.remove(session.id, botMessage.id);
            },
            onError(error) {
              const isAborted = error.message.includes("aborted");
              botMessage.content += "Network error, please retry.";
              // botMessage.content +=
              //   "\n\n" +
              //   prettyObject({
              //     error: true,
              //     message: error.message,
              //   });
              botMessage.streaming = false;
              userMessage.isError = !isAborted;
              botMessage.isError = !isAborted;
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
              ChatControllerPool.remove(
                session.id,
                botMessage.id ?? messageIndex,
              );

              console.error("[toolAgentChat] failed ", error);
            },
            onController(controller) {
              // collect controller for stop/retry
              ChatControllerPool.addController(
                session.id,
                botMessage.id ?? messageIndex,
                controller,
              );
            },
          });
        } else {
          if (modelConfig.model.startsWith("gemini")) {
            // api = new ClientApi(ModelProvider.GeminiPro);
          } else if (modelConfig.model.startsWith("claude")) {
            // api = new ClientApi(ModelProvider.Claude);
          }

          // make request
          // midjourney 请求
          if (modelConfig.model == "midjourney") {
            // return this.fetchMidjourney(content, botMessage, extAttr);
          } else if (modelConfig.model == "stable-diffusion") {
            // return this.fetchStableDiffusion(content, botMessage, extAttr);
          } else if (modelConfig.model.includes("dall-e")) {
            // return this.imagesGenerations(content, botMessage, extAttr);
          } else if (modelConfig.model.includes("whisper")) {
            // return this.audioTranscriptions(
            //   userContent as MultimodalContent[],
            //   botMessage,
            //   extAttr,
            //   fileArr,
            // );
          } else if (modelConfig.model.includes("tts")) {
            // return this.audioSpeech(content, botMessage, extAttr);
          }

          // make request
          api.llm.chat({
            messages: sendMessages,
            config: { ...modelConfig, stream: true },
            retryCount: extAttr.retryCount ?? 0,
            onAborted: (message) => {
              botMessage.isTimeoutAborted = true;
              if (message) {
                botMessage.content = message;
              }
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
            },
            onRetry: () => {
              if (userMessage.retryCount == undefined) {
                userMessage.retryCount = 0;
              }
              ++userMessage.retryCount;

              const savedUserMessage = {
                ...userMessage,
                content: saveUserContent,
              } as ChatMessage;
              extAttr.onResend?.(savedUserMessage);
            },
            onUpdate(message) {
              botMessage.streaming = true;
              if (message) {
                botMessage.content = message;
              }
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
            },
            onFinish(message, hasError) {
              console.warn(
                "🚀 ~ onFinish ~ message:",
                message,
                "hasError",
                hasError,
              );
              botMessage.streaming = false;
              botMessage.content = message ?? "";
              botMessage.isError = hasError as boolean;
              // 如果没有不包含中文,就弹翻译的提示
              if (!hasError) {
                // messageTranslate(message, botMessage);
              }
              get().onNewMessage(botMessage);
              ChatControllerPool.remove(session.id, botMessage.id);
              // if (!hasError) {
              //   console.log(
              //     "[OpenAi] chat finished, save media file to remote",
              //   );
              //   get()
              //     .saveMediaToRemote(message, botMessage)
              //     .then((newMessage) => {
              //       console.log(
              //         "[OpenAi] chat finished, save media file to remote end:",
              //         newMessage,
              //       );
              //     });
              // }
            },
            onError(error) {
              const isAborted = error.message.includes("aborted");
              botMessage.content += "Network error, please retry.";
              // botMessage.content +=
              // Locale.Error.ApiTimeout +
              // "\n\n" +
              // prettyObject({
              //   error: true,
              //   message: error.message,
              // });
              botMessage.streaming = false;
              // userMessage.isError = !isAborted;
              botMessage.isError = !isAborted;
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat();
              });
              ChatControllerPool.remove(
                session.id,
                botMessage.id ?? messageIndex,
              );

              console.error("[Chat] failed ", error);
            },
            onController(controller) {
              // collect controller for stop/retry
              ChatControllerPool.addController(
                session.id,
                botMessage.id ?? messageIndex,
                controller,
              );
            },
          });
        }
      },

      // 模型竞技场
      async onCompetition(
        content: string | MultimodalContent[],
        extAttr: ExtAttr,
      ) {
        const session = get().currentSession();
        const appConfig = useAppConfig.getState();
        const modelConfig = session.mask.modelConfig;

        // 所有的模型配置
        let modelConfigs = extAttr.models!.map((model) => {
          return {
            ...modelConfig,
            model: model.model,
            fileSupportType: model.file_support_type,
          };
        });

        const fileArr = await getFileArr(extAttr.uploadFiles);
        extAttr?.setUploadFiles([]); // 删除文件

        // 获取需要发送出去的用户内容
        // 如果模型中有支持多模态的话
        const createAllUserContents = modelConfigs.map(async (modelConfig) => {
          const { sendUserContent, saveUserContent } = extAttr.isResend
            ? await getResendUserContent(content, modelConfig)
            : await getUserContent(content as string, fileArr, modelConfig);

          return { sendUserContent, saveUserContent };
        });

        const allContents = await Promise.all(createAllUserContents);

        // 获取需要保存的用户内容，没有url的文件则只保存文件名
        let userMessage = createMessage({
          role: "user",
          content: "",
          model: "" as ModelType,
        });
        // 首次发消息, 保存记录
        if (!extAttr.isResend) {
          localStorage.setItem(LAST_INPUT_ID_KEY, userMessage.id);
          const { saveUserContent } = await getUserContent(
            content as string,
            fileArr,
            modelConfig,
          );
          get().updateCurrentSession((session) => {
            const savedUserMessage = {
              ...userMessage,
              content: saveUserContent,
            } as ChatMessage;
            session.messages = session.messages.concat([savedUserMessage]);
          });
        }

        // return;
        for (let i = 0; i < allContents.length; i++) {
          if (i > 0 && i % 3 === 0) {
            await sleep(3000);
          } else {
            await sleep(300);
          }

          const task = () => {
            const { sendUserContent, saveUserContent } = allContents[i];
            const modelConfig = modelConfigs[i];
            const model = modelConfig.model;

            return new Promise((resolve, reject) => {
              // const userMessage = createMessage({
              //   role: "user",
              //   content: sendUserContent as string | MultimodalContent[],
              //   model: modelConfig.model as ModelType,
              // });

              const botMessage = createMessage({
                role: "assistant",
                streaming: true,
                model: modelConfig.model as ModelType,
                toolMessages: [],
              });

              userMessage = {
                ...userMessage,
                content: sendUserContent as string | MultimodalContent[],
                model: modelConfig.model as ModelType,
              };

              let sendMessages = [];
              if (appConfig.enableMultiChat) {
                const lowerCaseModel = model.toLocaleLowerCase();

                // get recent messages
                // 根据模型, 获取其对应的聊天记录.
                // 过滤掉相同id的message
                const recentMessages = get().getMessagesWithMemory(modelConfig);
                let filteredMessage = recentMessages.filter(
                  (m) => m.id !== userMessage.id,
                );

                console.log("-----isResend-----", extAttr.isResend);

                // 如果是重试的, 需要过滤掉上
                if (extAttr.isResend) {
                  const lastid = localStorage.getItem(LAST_INPUT_ID_KEY);
                  const idx = filteredMessage.findIndex((m) => m.id === lastid);
                  if (idx > -1) {
                    filteredMessage.splice(idx, 1);
                  }
                }

                filteredMessage = filteredMessage.concat(userMessage);

                if (lowerCaseModel.includes("claude-3-5-sonnet")) {
                  // claude-3-5-sonnet-20240620 模型首个message, 排除system 之后只能是user,
                  const isSystemMsg = filteredMessage[0].role === "system";
                  if (isSystemMsg) {
                    const isUserMsg = filteredMessage[1].role === "user";
                    if (!isUserMsg) {
                      filteredMessage.splice(1, 1);
                    }
                  } else {
                    const isUserMsg = filteredMessage[0].role === "user";
                    if (!isUserMsg) {
                      filteredMessage.splice(0, 1);
                    }
                  }
                } else if (
                  DISABLED_SYSTEM_PROMPT_MODELS.findIndex((i) =>
                    lowerCaseModel.includes(i),
                  ) > -1
                ) {
                  // 不能有 system, 而且messages数组的长度只能是奇数
                  if (filteredMessage[0].role === "assistant") {
                    filteredMessage.splice(0, 1);
                  }
                }
                sendMessages = filteredMessage;
              } else {
                sendMessages = [userMessage];
              }
              const messageIndex = get().currentSession().messages.length + 1;
              console.log("🚀 ~ sendMessages:", sendMessages);

              // save user's and bot's message
              get().updateCurrentSession((session) => {
                session.messages = session.messages.concat([botMessage]);
              });

              var api: ClientApi = new ClientApi(ModelProvider.GPT);

              if (model.startsWith("gemini")) {
                // api = new ClientApi(ModelProvider.GeminiPro);
              } else if (model.startsWith("claude")) {
                // api = new ClientApi(ModelProvider.Claude);
              }

              // make request
              api.llm.chat({
                messages: sendMessages,
                config: { ...modelConfig, stream: true },
                retryCount: extAttr.retryCount ?? 0,
                fileSupportType: modelConfig.fileSupportType,
                onAborted(message) {
                  botMessage.isTimeoutAborted = true;
                  if (message) {
                    botMessage.content = message;
                  }
                  get().updateCurrentSession((session) => {
                    session.messages = session.messages.concat();
                  });
                  reject(message);
                },
                onRetry() {
                  if (botMessage.retryCount == undefined) {
                    botMessage.retryCount = 0;
                  }
                  ++botMessage.retryCount;
                  extAttr.onResend?.(botMessage);
                },
                onUpdate(message) {
                  botMessage.streaming = true;
                  if (message) {
                    botMessage.content = message;
                  }
                  get().updateCurrentSession((session) => {
                    session.messages = session.messages.concat();
                  });
                },
                onFinish(message, hasError) {
                  resolve(message);
                  console.warn(
                    "🚀 ~ onFinish ~ message:",
                    message,
                    "hasError",
                    hasError,
                  );
                  botMessage.streaming = false;
                  botMessage.content = message ?? "";
                  botMessage.isError = hasError as boolean;
                  get().onNewMessage(botMessage, false);
                  ChatControllerPool.remove(session.id, botMessage.id);
                },
                onError(error) {
                  const isAborted = error.message.includes("aborted");
                  botMessage.content += "Network error, please retry.";
                  botMessage.streaming = false;
                  // userMessage.isError = !isAborted;
                  botMessage.isError = !isAborted;
                  get().updateCurrentSession((session) => {
                    session.messages = session.messages.concat();
                  });
                  ChatControllerPool.remove(
                    session.id,
                    botMessage.id ?? messageIndex,
                  );

                  console.error("[Chat] failed ", error);
                  reject(error);
                },
                onController(controller) {
                  ChatControllerPool.addController(
                    session.id,
                    botMessage.id ?? messageIndex,
                    controller,
                  );
                },
              });
            });
          };

          task();
        }
      },

      async saveMediaToRemote(message: string, botMessage: ChatMessage) {
        const uploadUrl = useAccessStore.getState().fileUploadUrl;

        // 匹配 图片|视频|音频 链接
        const imgReg =
          /(?<=\!\[.*?\]\()(https?:\/\/.+(\.(png|jpe?g|webp|gif|svg|ico))?)(?=\))/gi;
        const mediaReg =
          /(?<=\[.*?\]\()(https?:\/\/.+\.(mp3|ogg|wav|acc|vorbis|silk|mp4|webm|avi|rmvb|3gp|flv))(?=\))/gi;

        const imgUrls = message.match(imgReg);
        const mediaUrls = message.match(mediaReg);

        let newMessage = message;
        let imgTasks: Promise<void>[] = [];
        let mediaTasks: Promise<void>[] = [];

        const imgHandler = async (url: string) => {
          const originUrl = url;
          const filename = Date.now() + ".png";

          // 从远程下载图片
          let newUrl = await uploadRemoteFile(url, uploadUrl, filename);

          // 替换链接, 上传成功之后才替换.
          if (newUrl !== url) {
            newMessage = newMessage
              .replaceAll(originUrl, newUrl)
              .replaceAll(
                `(${newUrl})`,
                `(${newUrl})\n[${Locale.Export.Download}](${newUrl})\n`,
              );
          }
        };

        const mediaHandler = async (url: string) => {
          const originUrl = url;
          const filename =
            url.split("/").pop()?.split("?")[0] || Date.now() + ".webm";

          // 从远程下载媒体文件
          let newUrl = await uploadRemoteFile(url, uploadUrl, filename);

          // 替换链接, 上传成功之后才替换.
          if (newUrl !== url) {
            newMessage = newMessage
              .replaceAll(originUrl, newUrl)
              .replaceAll(
                `(${newUrl})`,
                `(${newUrl})  [${Locale.Export.Download}](${newUrl})\n`,
              );
          }
        };

        if (imgUrls && imgUrls.length) {
          console.warn("🚀 ~ [OpenAi] ~ 图片:", imgUrls);
          imgTasks = Array.from(new Set(imgUrls)).map(imgHandler);
        }

        if (mediaUrls && mediaUrls.length) {
          console.warn("🚀 ~ [OpenAi] ~ 媒体文件:", mediaUrls);
          mediaTasks = Array.from(new Set(mediaUrls)).map(mediaHandler);
        }

        await Promise.all([...imgTasks, ...mediaTasks])
          .then(() => {
            botMessage.content = newMessage;
            // 修改消息
            get().updateCurrentSession((session) => {
              session.messages = session.messages.concat();
            });
          })
          .catch((err) => {
            console.error("🚀 ~ [OpenAi] ~ save media file ~ err:", err);
          });

        return newMessage;
      },

      getMemoryPrompt() {
        const session = get().currentSession();

        return {
          role: "system",
          content:
            session.memoryPrompt.length > 0
              ? Locale.Store.Prompt.History(session.memoryPrompt)
              : "",
          date: "",
        } as ChatMessage;
      },

      getMessagesWithMemory(_modelConfig?: ModelConfig) {
        const session = get().currentSession();
        const modelConfig = _modelConfig || session.mask.modelConfig;
        const clearContextIndex = session.clearContextIndex ?? 0;
        const model = modelConfig?.model;

        const messages = session.messages
          .slice()
          .map((_m) => {
            const m = { ..._m };
            // 将用户的model 修改为当前model
            if (m.role === "user") {
              m.model = modelConfig.model as ModelType;
            }
            return m;
          })
          .filter((m) => {
            return modelConfig.model ? m.model === modelConfig.model : true;
          });
        const totalMessageCount = messages.length;

        // in-context prompts
        const contextPrompts = session.mask.context.slice();

        // system prompts, to get close to OpenAI Web ChatGPT
        const shouldInjectSystemPrompts =
          modelConfig.enableInjectSystemPrompts &&
          (model.startsWith("gpt-") || model.includes("claude"));

        const shouldInjectCustomSystemPrompts =
          modelConfig.enableInjectCustomSystemPrompts &&
          (model.startsWith("gpt-") || model.includes("claude"));

        let template = DEFAULT_GPT_SYSTEM_TEMPLATE;
        if (model.includes("claude")) {
          template = DEFAULT_SYSTEM_TEMPLATE;
        }

        var systemPrompts: ChatMessage[] = [];
        systemPrompts = shouldInjectSystemPrompts
          ? [
              createMessage({
                role: "system",
                content: fillTemplateWith("", {
                  ...modelConfig,
                  template: template,
                }),
              }),
            ]
          : shouldInjectCustomSystemPrompts
            ? [
                createMessage({
                  role: "system",
                  content: fillTemplateWith("", {
                    ...modelConfig,
                    template: modelConfig.injectCustomSystemPrompts,
                  }),
                }),
              ]
            : [];

        if (shouldInjectSystemPrompts) {
          console.log(
            "[Global System Prompt] ",
            systemPrompts.at(0)?.content ?? "empty",
          );
        }

        // long term memory
        const shouldSendLongTermMemory =
          modelConfig.sendMemory &&
          session.memoryPrompt &&
          session.memoryPrompt.length > 0 &&
          session.lastSummarizeIndex > clearContextIndex;
        const longTermMemoryPrompts =
          shouldSendLongTermMemory &&
          DISABLED_SYSTEM_PROMPT_MODELS.findIndex((i) => model.includes(i)) ===
            -1
            ? [get().getMemoryPrompt()]
            : [];
        const longTermMemoryStartIndex = session.lastSummarizeIndex;

        // short term memory
        const shortTermMemoryStartIndex = Math.max(
          0,
          totalMessageCount - modelConfig.historyMessageCount,
        );

        // lets concat send messages, including 4 parts:
        // 0. system prompt: to get close to OpenAI Web ChatGPT
        // 1. long term memory: summarized memory messages
        // 2. pre-defined in-context prompts
        // 3. short term memory: latest n messages
        // 4. newest input message
        const memoryStartIndex = shouldSendLongTermMemory
          ? Math.min(longTermMemoryStartIndex, shortTermMemoryStartIndex)
          : shortTermMemoryStartIndex;
        // and if user has cleared history messages, we should exclude the memory too.
        const contextStartIndex = Math.max(clearContextIndex, memoryStartIndex);
        const maxTokenThreshold = modelConfig.max_tokens;

        // get recent messages as much as possible
        const reversedRecentMessages = [];
        for (
          let i = totalMessageCount - 1, tokenCount = 0;
          i >= contextStartIndex && tokenCount < maxTokenThreshold;
          i -= 1
        ) {
          const msg = messages[i];
          if (!msg || msg.isError) continue;
          tokenCount += estimateTokenLength(getMessageTextContent(msg));
          reversedRecentMessages.push(msg);
        }
        // concat all messages
        const recentMessages = [
          ...systemPrompts,
          ...longTermMemoryPrompts,
          ...contextPrompts,
          ...reversedRecentMessages.reverse(),
        ];

        return recentMessages;
      },

      updateMessage(
        sessionIndex: number,
        messageIndex: number,
        updater: (message?: ChatMessage) => void,
      ) {
        const sessions = get().sessions;
        const session = sessions.at(sessionIndex);
        const messages = session?.messages;
        updater(messages?.at(messageIndex));
        set(() => ({ sessions }));
      },

      resetSession() {
        get().updateCurrentSession((session) => {
          session.messages = [];
          session.memoryPrompt = "";
          session.topic = DEFAULT_TOPIC;
        });
      },

      summarizeSession() {
        const config = useAppConfig.getState();
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;

        var api: ClientApi = new ClientApi(ModelProvider.GPT);
        if (modelConfig.model.startsWith("gemini")) {
          // api = new ClientApi(ModelProvider.GeminiPro);
        }

        // remove error messages if any
        const messages = session.messages;

        // should summarize topic after chating more than 50 words
        const SUMMARIZE_MIN_LEN = 50;
        if (
          config.enableAutoGenerateTitle &&
          session.topic === DEFAULT_TOPIC &&
          countMessages(messages) >= SUMMARIZE_MIN_LEN
        ) {
          const topicMessages = messages.concat(
            createMessage({
              role: "user",
              content: Locale.Store.Prompt.Topic,
            }),
          );
          api.llm.chat({
            messages: topicMessages,
            config: {
              model: getSummarizeModel(session.mask.modelConfig.model),
              stream: false,
            },
            onFinish(message) {
              get().updateCurrentSession(
                (session) =>
                  (session.topic =
                    message.length > 0 ? trimTopic(message) : DEFAULT_TOPIC),
              );
            },
          });
        }
        const summarizeIndex = Math.max(
          session.lastSummarizeIndex,
          session.clearContextIndex ?? 0,
        );
        let toBeSummarizedMsgs = messages
          .filter((msg) => !msg.isError)
          .slice(summarizeIndex);

        const historyMsgLength = countMessages(toBeSummarizedMsgs);

        if (historyMsgLength > modelConfig?.max_tokens ?? 4000) {
          const n = toBeSummarizedMsgs.length;
          toBeSummarizedMsgs = toBeSummarizedMsgs.slice(
            Math.max(0, n - modelConfig.historyMessageCount),
          );
        }

        // add memory prompt
        toBeSummarizedMsgs.unshift(get().getMemoryPrompt());

        const lastSummarizeIndex = session.messages.length;

        console.log(
          "[Chat History] ",
          toBeSummarizedMsgs,
          historyMsgLength,
          modelConfig.compressMessageLengthThreshold,
        );

        if (
          historyMsgLength > modelConfig.compressMessageLengthThreshold &&
          modelConfig.sendMemory
        ) {
          /** Destruct max_tokens while summarizing
           * this param is just shit
           **/
          const { max_tokens, ...modelcfg } = modelConfig;
          api.llm.chat({
            messages: toBeSummarizedMsgs.concat(
              createMessage({
                role: "system",
                content: Locale.Store.Prompt.Summarize,
                date: "",
              }),
            ),
            config: {
              ...modelcfg,
              stream: true,
              model: getSummarizeModel(session.mask.modelConfig.model),
            },
            onUpdate(message) {
              session.memoryPrompt = message;
            },
            onFinish(message) {
              console.log("[Memory] ", message);
              get().updateCurrentSession((session) => {
                session.lastSummarizeIndex = lastSummarizeIndex;
                session.memoryPrompt = message; // Update the memory prompt for stored it in local storage
              });
            },
            onError(err) {
              console.error("[Summarize] ", err);
            },
          });
        }
      },

      updateStat(message: ChatMessage) {
        get().updateCurrentSession((session) => {
          session.stat.charCount += message.content.length;
          // TODO: should update chat count and word count
        });
      },

      updateCurrentSession(updater: (session: ChatSession) => void) {
        const sessions = get().sessions;
        const index = get().currentSessionIndex;
        updater(sessions[index]);
        set(() => ({ sessions }));
      },

      clearAllData() {
        localStorage.clear();
        location.reload();
      },

      async audioTranscriptions(
        userContent: MultimodalContent[],
        botMessage: ChatMessage,
        extAttr: ExtAttr,
        fileArr: FileRes[],
      ) {
        let prompt = "";
        let fileObj: File[] = [];
        if (fileArr.length > 0) {
          fileArr.forEach((file) => {
            fileObj.push(file.fileObj);
          });
        }
        for (const content of userContent) {
          if (content.type == "text") {
            prompt += content.text;
          } else if (
            content.type == "file" &&
            content.file!.url &&
            fileArr.length < 1
          ) {
            const file = await getFileFromUrl(
              content.file!.url,
              content.file!.name,
            );
            if (file != undefined) {
              fileObj.push(file);
            }
          }
        }
        let formData = new FormData();
        formData.append("model", botMessage.model!);
        formData.append("prompt", prompt);
        fileObj.forEach((file) => {
          formData.append("file", file);
        });
        let resJson: any;
        var api;
        if (botMessage.model?.includes("gemini-pro")) {
          api = new ClientApi(ModelProvider.GeminiPro);
        } else {
          api = new ClientApi(ModelProvider.GPT);
        }
        await api.llm
          .audioTranscriptions(formData)
          .then((res) => res!.json())
          .then((res) => {
            resJson = res;
          });
        botMessage.streaming = false;
        botMessage.content = resJson?.text
          ? resJson.text
          : prettyObject(resJson);
        get().onNewMessage(botMessage);

        extAttr.setAutoScroll?.(true);
      },

      async audioSpeech(
        content: string,
        model: ModelType,
        extAttr: any,
      ): Promise<string> {
        const config = useAppConfig.getState();
        const options: SpeechOptions = {
          model: model,
          input: content,
          ...config.speech,
        };
        try {
          const fileName = nanoid() + "." + config.speech.response_format;
          let fileType = "";
          const formdata = new FormData();
          let url: string = "";

          var api: ClientApi;
          if (model.includes("gemini-pro")) {
            api = new ClientApi(ModelProvider.GeminiPro);
          } else {
            api = new ClientApi(ModelProvider.GPT);
          }
          await api.llm
            .audioSpeech(options)
            .then(async (res) => await res!.blob())
            .then((blob) => {
              if (blob.size > 0) {
                url = window.URL.createObjectURL(blob);

                fileType = blob.type;
                const file = new File([blob], fileName);
                formdata.append("file", file);
              }
            });
          // 把文件上传到oss
          if (fileType && formdata.has("file")) {
          } else {
            // botMessage.content =
            //   Locale.Chat.Speech.FetchAudioError;
            extAttr?.setSpeechStatus?.(Locale.Chat.Speech.FetchAudioError);
          }
          return url;
        } catch (err) {
          // botMessage.content = prettyObject(err);
          throw err;
        }
        // botMessage.streaming = false;
        // get().onNewMessage(botMessage);
        // extAttr?.setAutoScroll(true);
      },
    };

    return methods;
  },
  {
    name: StoreKey.Chat,
    version: 3.1,
    migrate(persistedState, version) {
      const state = persistedState as any;
      const newState = JSON.parse(
        JSON.stringify(state),
      ) as typeof DEFAULT_CHAT_STATE;

      if (version < 2) {
        newState.sessions = [];

        const oldSessions = state.sessions;
        for (const oldSession of oldSessions) {
          const newSession = createEmptySession();
          newSession.topic = oldSession.topic;
          newSession.messages = [...oldSession.messages];
          newSession.mask.modelConfig.sendMemory = true;
          newSession.mask.modelConfig.historyMessageCount = 4;
          newSession.mask.modelConfig.compressMessageLengthThreshold = 1000;
          newState.sessions.push(newSession);
        }
      }

      if (version < 3) {
        // migrate id to nanoid
        newState.sessions.forEach((s) => {
          s.id = nanoid();
          s.messages.forEach((m) => (m.id = nanoid()));
        });
      }

      // Enable `enableInjectSystemPrompts` attribute for old sessions.
      // Resolve issue of old sessions not automatically enabling.
      if (version < 3.1) {
        newState.sessions.forEach((s) => {
          if (
            // Exclude those already set by user
            !s.mask.modelConfig.hasOwnProperty("enableInjectSystemPrompts")
          ) {
            // Because users may have changed this configuration,
            // the user's current configuration is used instead of the default
            const config = useAppConfig.getState();
            s.mask.modelConfig.enableInjectSystemPrompts =
              config.modelConfig.enableInjectSystemPrompts;
          }
        });
      }

      return newState as any;
    },
  },
);
