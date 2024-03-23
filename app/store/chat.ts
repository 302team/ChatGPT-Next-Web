import { trimTopic, getMessageTextContent } from "../utils";

import Locale, { getLang } from "../locales";
import { showToast } from "../components/ui-lib";
import { ModelConfig, ModelType, useAppConfig } from "./config";
import { createEmptyMask, Mask } from "./mask";
import {
  DEFAULT_INPUT_TEMPLATE,
  DEFAULT_MODELS,
  DEFAULT_SYSTEM_TEMPLATE,
  KnowledgeCutOffDate,
  ModelProvider,
  StoreKey,
  SUMMARIZE_MODEL,
  GEMINI_SUMMARIZE_MODEL,
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

export type ChatMessage = RequestMessage & {
  date: string;
  streaming?: boolean;
  isError?: boolean;
  id: string;
  model?: ModelType;
};

export function createMessage(override: Partial<ChatMessage>): ChatMessage {
  return {
    id: nanoid(),
    date: new Date().toLocaleString(),
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
  setAutoScroll: ((autoScroll: boolean) => void) | undefined;
  uploadFiles: UploadFile[];
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
    time: new Date().toLocaleString(),
    lang: getLang(),
    input: input,
    language: window.navigator.language,
  };

  let output = modelConfig.template ?? DEFAULT_INPUT_TEMPLATE;

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
        ((await getBase64(file.originFileObj)) as string);
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
  content: string | MultimodalContent[],
  modelConfig: ModelConfig,
  fileArr: FileRes[],
  type: "send" | "save",
): Promise<string | MultimodalContent[]> {
  // 如果是gpt4-vision，
  if (modelConfig.model.includes("vision") && typeof content == "string") {
    const imgContent: MultimodalContent[] = [];
    imgContent.push({
      type: "text",
      text: content,
    });
    if (fileArr.length > 0) {
      for (const file of fileArr) {
        // 如果类型为send，或内容不是base64
        if (type == "send") {
          imgContent.push({
            type: "image_url",
            image_url: {
              url: file.base64,
            },
          });
        } else if (file.url && file.url.startsWith("http")) {
          imgContent.push({
            type: "image_url",
            image_url: {
              url: file.url,
            },
          });
        } else {
          imgContent[0].text += "\n" + file.name;
        }
      }
    }
    return imgContent;
  } else if (
    modelConfig.model == "gpt-4-all" ||
    modelConfig.model.includes("gpt-4-gizmo")
  ) {
    let sendContent = content;
    if (type == "send") {
      let fileUrls = "";
      if (fileArr.length > 0) {
        fileArr.forEach((file) => {
          fileUrls += file.url + "\n";
        });
      } else if (content instanceof Array) {
        sendContent = "";
        content.forEach((msg) => {
          if (msg.type == "text") {
            sendContent += msg.text!;
          } else {
            fileUrls += msg.file!.url + "\n";
          }
        });
      }
      sendContent = fileUrls + sendContent;
    } else {
      if (typeof content == "string") {
        sendContent = [];
        sendContent.push({
          type: "text",
          text: content,
        });
        if (fileArr.length > 0) {
          fileArr.forEach((file) => {
            (sendContent as Array<any>).push({
              type: "file",
              file: {
                name: file.name,
                type: file.type,
                url: file.url,
              },
            });
          });
        }
      }
    }
    return sendContent;
  } else if (modelConfig.model.includes("whisper")) {
    let userContent = content;
    if (typeof content == "string" && fileArr.length > 0) {
      userContent = [];
      userContent.push({
        type: "text",
        text: content,
      });
      fileArr.forEach((file) => {
        (userContent as Array<any>).push({
          type: "file",
          file: {
            name: file.name,
            type: file.type,
            url: file.url,
          },
        });
      });
    }
    return userContent;
  } else if (type == "send" && content instanceof Array) {
    for (const msg of content) {
      if (msg.type == "image_url") {
        msg.image_url!.url = await getBase64FromUrl(msg.image_url!.url);
      }
    }
    return content;
  } else if (type == "save" || !(typeof content == "string")) {
    return content;
  }
  // 模板替换
  const userContent = fillTemplateWith(content, modelConfig);
  return userContent;
}

async function getBase64FromUrl(url: string) {
  let base64 = "";
  await fetch(url, {
    method: "get",
    headers: {
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Headers": "*",
    },
  })
    .then((response) => response.blob())
    .then((blob) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => (base64 = reader.result as string);
    });
  return base64;
}

function getBase64(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
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

      onNewMessage(message: ChatMessage) {
        get().updateCurrentSession((session) => {
          session.messages = session.messages.concat();
          session.lastUpdate = Date.now();
        });
        get().updateStat(message);
        get().summarizeSession();
      },

      async onUserInput(
        content: string | MultimodalContent[],
        extAttr: ExtAttr,
      ) {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;

        const fileArr = await getFileArr(extAttr.uploadFiles);
        extAttr?.setUploadFiles([]); // 删除文件
        // 获取需要发送出去的用户内容
        const userContent = await getUserContent(
          content,
          modelConfig,
          fileArr,
          "send",
        );
        console.log("[User Input] after pretreatment: ", userContent);
        // 获取需要保存的用户内容，没有url的文件则只保存文件名
        const saveUserContent = await getUserContent(
          content,
          modelConfig,
          fileArr,
          "save",
        );

        // const userContent = fillTemplateWith(content, modelConfig);
        console.log("[User Input] after template: ", userContent);

        const userMessage = createMessage({
          role: "user",
          content: userContent as string | MultimodalContent[],
          model: modelConfig.model as ModelType,
        });
        const botMessage = createMessage({
          role: "assistant",
          streaming: true,
          model: modelConfig.model as ModelType,
        });
        // get recent messages
        const recentMessages = get().getMessagesWithMemory();
        const sendMessages = recentMessages.concat(userMessage);
        const messageIndex = get().currentSession().messages.length + 1;

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

        var api: ClientApi;
        if (modelConfig.model.startsWith("gemini")) {
          api = new ClientApi(ModelProvider.GeminiPro);
        } else {
          api = new ClientApi(ModelProvider.GPT);
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
            get().onNewMessage(botMessage);
            ChatControllerPool.remove(session.id, botMessage.id);
          },
          onError(error) {
            const isAborted = error.message.includes("aborted");
            botMessage.content +=
              Locale.Error.ApiTimeout +
              "\n\n" +
              prettyObject({
                error: true,
                message: error.message,
              });
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

      getMessagesWithMemory() {
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;
        const clearContextIndex = session.clearContextIndex ?? 0;
        const messages = session.messages.slice();
        const totalMessageCount = session.messages.length;

        // in-context prompts
        const contextPrompts = session.mask.context.slice();

        // system prompts, to get close to OpenAI Web ChatGPT
        const shouldInjectSystemPrompts =
          modelConfig.enableInjectSystemPrompts &&
          session.mask.modelConfig.model.startsWith("gpt-");

        const shouldInjectCustomSystemPrompts =
          modelConfig.enableInjectCustomSystemPrompts &&
          session.mask.modelConfig.model.startsWith("gpt-");

        var systemPrompts: ChatMessage[] = [];
        systemPrompts = shouldInjectSystemPrompts
          ? [
              createMessage({
                role: "system",
                content: fillTemplateWith("", {
                  ...modelConfig,
                  template: DEFAULT_SYSTEM_TEMPLATE,
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
        const longTermMemoryPrompts = shouldSendLongTermMemory
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
        });
      },

      summarizeSession() {
        const config = useAppConfig.getState();
        const session = get().currentSession();
        const modelConfig = session.mask.modelConfig;

        var api: ClientApi;
        if (modelConfig.model.startsWith("gemini")) {
          api = new ClientApi(ModelProvider.GeminiPro);
        } else {
          api = new ClientApi(ModelProvider.GPT);
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
          api.llm.chat({
            messages: toBeSummarizedMsgs.concat(
              createMessage({
                role: "system",
                content: Locale.Store.Prompt.Summarize,
                date: "",
              }),
            ),
            config: {
              ...modelConfig,
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
