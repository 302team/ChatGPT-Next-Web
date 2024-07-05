"use client";
import {
  ApiPath,
  DEFAULT_API_HOST,
  DEFAULT_MODELS,
  OpenaiPath,
  KnowledgeBasePath,
  REQUEST_TIMEOUT_MS,
  ServiceProvider,
  ERROR_CODE,
  ERROR_CODE_TYPE,
  FILE_SUPPORT_TYPE,
} from "@/app/constant";
import { useAccessStore, useAppConfig, useChatStore } from "@/app/store";

import {
  buildMessages,
  AgentChatOptions,
  ChatOptions,
  getHeaders,
  getHeadersNoCT,
  LLMApi,
  LLMModel,
  LLMUsage,
  MultimodalContent,
  SpeechOptions,
} from "../api";
import Locale from "../../locales";
import {
  EventStreamContentType,
  fetchEventSource,
} from "@fortaine/fetch-event-source";

import { AuthType } from "@/app/locales/cn";
import { getServerSideConfig } from "@/app/config/server";

const serverConfig = getServerSideConfig();

export interface OpenAIListModelResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    root: string;
  }>;
}

interface RequestPayload {
  messages: {
    role: "system" | "user" | "assistant";
    content: string | MultimodalContent[];
  }[];
  stream?: boolean;
  model: string;
  temperature: number;
  presence_penalty: number;
  frequency_penalty: number;
  top_p: number;
  max_tokens?: number;
}

const ERROR_MESSAGE = "Network error, please retry.";

export class KnowledgeBaseApi implements LLMApi {
  extractMessage(res: any) {
    if (res.code !== 0) {
      return res.msg;
    }

    return {
      remainText: res.data.answer || "",
      docsText: res.data.docs?.join("\n") || "",
    };
    // return res.data?.at(0)?.message?.content ?? "";
  }

  async chat(options: ChatOptions) {
    const messages = options.messages.map((v) => ({
      role: v.role,
      content: v.content,
    }));

    const session = useChatStore.getState().currentSession();

    const modelConfig = {
      ...useAppConfig.getState().modelConfig,
      ...session.mask.modelConfig,
      ...{
        model: options.config.model,
      },
    };

    const config = useAppConfig.getState();
    const localeLowerCaseModel = modelConfig.model.toLocaleLowerCase();
    const condition = session.mask.isStoreModel
      ? /* 商店模型 */ session.mask.isGptsModel
        ? false
        : config.multimodalType4Models[modelConfig.model] ===
          FILE_SUPPORT_TYPE.ONLY_IMAGE
      : config.fileSupportType === FILE_SUPPORT_TYPE.ONLY_IMAGE;

    const sendMessages = buildMessages(messages, modelConfig.model, condition);

    const requestPayload = {
      query: sendMessages[sendMessages.length - 1].content,
      top_k: config.kbConfig.top_k,
      score_threshold: config.kbConfig.score_threshold,
      history: sendMessages.slice(0, sendMessages.length - 1),
      stream: options.config.stream,
      model_name: modelConfig.model,
      temperature: modelConfig.temperature,
      prompt_name: "default",
    };

    // qwen-vl 模型不支持带 temperature
    if (!modelConfig.model.includes("qwen-vl")) {
      Object.defineProperty(requestPayload, "temperature", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: modelConfig.temperature,
      });
    }

    if (modelConfig.model.toLocaleLowerCase().includes("baichuan")) {
      Object.defineProperty(requestPayload, "frequency_penalty", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 1,
      });
    }

    // add max_tokens to vision model
    if (
      options.config.model.includes("vision") &&
      !options.config.model.includes("yi-vision")
    ) {
      Object.defineProperty(requestPayload, "max_tokens", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 4000,
      });
    }

    console.log("[Request] openai payload: ", requestPayload);

    const shouldStream = !!options.config.stream;
    const controller = new AbortController();
    options.onController?.(controller);

    let isAborted = false;
    let finished = false;
    const shouldRetry =
      options.onRetry &&
      options.retryCount !== undefined &&
      options.retryCount < 1;

    console.log("🚀 ~ [Request] chat ~ shouldRetry:", shouldRetry);

    const path =
      config.kbConfig.mode === "knowledge_base_chat"
        ? KnowledgeBasePath.KbChatPath
        : KnowledgeBasePath.AgentChatPath;

    try {
      const chatPath = this.path(path);
      const chatPayload = {
        method: "POST",
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
        headers: getHeaders(),
      };

      // make a fetch request
      const requestTimeoutId = setTimeout(() => {
        controller.abort();
        if (shouldRetry) {
          options.onRetry?.();
        } else {
          options.onAborted?.(ERROR_MESSAGE);
        }
      }, REQUEST_TIMEOUT_MS);

      if (shouldStream) {
        let responseText = "";
        let remainText = "";
        let docsText = "";
        let isStreamDone = false;
        let hasUncatchError = false;

        // animate response to make it looks smooth
        function animateResponseText() {
          if (finished || controller.signal.aborted) {
            responseText += remainText;
            console.log("[Response Animation] finished");
            if (responseText?.length === 0) {
              if (shouldRetry) {
                controller.abort();
                options.onRetry?.();
              } else {
                options.onError?.(new Error("empty response from server"));
              }
            }
            return;
          }

          if (remainText.length > 0) {
            const fetchCount = Math.max(1, Math.round(remainText.length / 60));
            const fetchText = remainText.slice(0, fetchCount);
            responseText += fetchText;
            remainText = remainText.slice(fetchCount);
            options.onUpdate?.(responseText, fetchText);
          }

          requestAnimationFrame(animateResponseText);
        }

        // start animaion
        animateResponseText();

        const finish = () => {
          if (!finished) {
            finished = true;
            options.onFinish(
              responseText + remainText,
              docsText,
              !isStreamDone || hasUncatchError || isAborted,
            );
          }
        };

        controller.signal.onabort = () => {
          console.warn("🚀 ~ ChatGPTApi ~ chat ~ onabort");
          isAborted = true;
          finish();
        };

        console.log("[OpenAI chat] request retry count: ", options.retryCount);
        fetchEventSource(chatPath, {
          ...chatPayload,
          async onopen(res) {
            clearTimeout(requestTimeoutId);
            const contentType = res.headers.get("content-type");
            console.log(
              "[OpenAI] request response content type: ",
              contentType,
            );

            if (contentType?.startsWith("text/plain")) {
              if (shouldRetry) {
                controller.abort();
                options.onRetry?.();
                return;
              }

              responseText = ERROR_MESSAGE; // await res.clone().text();
              return finish();
            }

            if (
              !res.ok ||
              !res.headers
                .get("content-type")
                ?.startsWith(EventStreamContentType) ||
              res.status !== 200
            ) {
              const responseTexts = [responseText];
              let extraInfo = await res.clone().text();
              let errorMsg = "";
              console.warn("[Chat Response] error. extraInfo", extraInfo);

              try {
                const resJson = await res.clone().json();
                if (resJson.error) {
                  if (resJson.error?.type === "api_error") {
                    const CODE =
                      ERROR_CODE[resJson.error.err_code as ERROR_CODE_TYPE];

                    const _err = Locale.Auth[CODE as AuthType];
                    errorMsg =
                      typeof _err === "function"
                        ? _err(config.region)
                        : _err || resJson.error.message;

                    //
                  } else if (resJson.error?.param.startsWith("5")) {
                    errorMsg = Locale.Auth.SERVER_ERROR;
                  } else if (
                    resJson.error?.message.includes("No config for gizmo")
                  ) {
                    errorMsg = Locale.GPTs.Error.Deleted;
                  } else {
                    // 除了自定义的错误信息, 其他错误都显示 Network error, please retry.
                    errorMsg = ERROR_MESSAGE;
                    hasUncatchError = true;
                  }
                }

                // extraInfo = prettyObject(resJson);
              } catch {}

              // 重试一次
              if (hasUncatchError && shouldRetry) {
                controller.abort();
                options.onRetry?.();
                return;
              }

              if (errorMsg) {
                responseTexts.push(errorMsg);
              } else if (res.status === 401) {
                responseTexts.push(
                  Locale.Error.Unauthorized(useAppConfig.getState().region),
                );
              }

              // if (extraInfo) {
              //   responseTexts.push(extraInfo);
              // }

              responseText = responseTexts.join("\n\n");

              return finish();
            }
          },
          onmessage(msg) {
            isStreamDone = localeLowerCaseModel.includes("xuanyuan")
              ? true
              : msg.data === "DONE";

            if (msg.data === "DONE") {
              return finish();
            }

            const text = msg.data;
            try {
              const json = JSON.parse(text);
              if (json.code === 0) {
                const res = json.data as {
                  answer: string;
                  docs?: Array<string>;
                };
                const delta = res.answer;
                const docs = res.docs;

                if (delta) {
                  remainText += delta;
                } else {
                  remainText += "\n";
                }

                if (docs) {
                  docsText = docs.join("\n");
                }
              } else {
              }
            } catch (e) {
              console.error("[Request] parse error", text, msg);
            }
          },
          onclose() {
            // console.warn("🚀 ~ ChatGPTApi ~ fetchEventSource onclose ~");
            finish();
          },
          onerror(e) {
            console.warn("🚀 ~ ChatGPTApi ~ fetchEventSource onerror ~ e:", e);
            options.onError?.(e);
            throw e;
          },
          openWhenHidden: true,
        });
      } else {
        const res = await fetch(chatPath, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);
        if (typeof message === "string") {
          options.onFinish(message, "", false);
        } else {
          options.onFinish(message.remainText, message.docsText, false);
        }
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }

  usage(): Promise<LLMUsage> {
    throw new Error("Method not implemented.");
  }

  async models(): Promise<LLMModel[]> {
    return [];
  }

  path(path: string): string {
    return "/api/knowledge-base/" + path;
  }

  toolAgentChat(options: AgentChatOptions): Promise<void> {
    throw new Error("Method not implemented.");
  }

  async audioTranscriptions(formData: FormData) {
    throw new Error("Method not implemented.");
  }

  async audioSpeech(options: SpeechOptions) {
    throw new Error("Method not implemented.");
  }
}
export { KnowledgeBasePath };
