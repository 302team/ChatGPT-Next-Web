"use client";
import {
  ApiPath,
  DEFAULT_API_HOST,
  DEFAULT_MODELS,
  OpenaiPath,
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
import { prettyObject } from "@/app/utils/format";
import { getClientConfig } from "@/app/config/client";
import { makeAzurePath } from "@/app/azure";
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

function extractMessageBody(text: string, model: string) {
  const _model = model.toLocaleLowerCase();
  const res = JSON.parse(text);
  if (_model.includes("sensechat")) {
    res.data.choices.forEach((item: any) => {
      item.delta = {
        content: item.delta,
      };
    });

    return res.data;
  }

  return res;
}

export class ChatGPTApi implements LLMApi {
  private disableListModels = true;

  path(path: string): string {
    const accessStore = useAccessStore.getState();

    let baseUrl = "";

    if (accessStore.useCustomConfig) {
      const isAzure = accessStore.provider === ServiceProvider.Azure;

      if (isAzure && !accessStore.isValidAzure()) {
        throw Error(
          "incomplete azure config, please check it in your settings page",
        );
      }

      if (isAzure) {
        path = makeAzurePath(path, accessStore.azureApiVersion);
      }

      baseUrl = isAzure ? accessStore.azureUrl : accessStore.openaiUrl;
    }

    if (baseUrl.length === 0) {
      const isApp = !!getClientConfig()?.isApp;
      baseUrl = isApp
        ? DEFAULT_API_HOST + "/proxy" + ApiPath.OpenAI
        : ApiPath.OpenAI;
    }

    if (baseUrl.endsWith("/")) {
      baseUrl = baseUrl.slice(0, baseUrl.length - 1);
    }
    if (!baseUrl.startsWith("http") && !baseUrl.startsWith(ApiPath.OpenAI)) {
      baseUrl = "https://" + baseUrl;
    }

    console.log("[Proxy Endpoint] ", baseUrl, path);

    return [baseUrl, path].join("/");
  }

  extractMessage(res: any) {
    return res.choices?.at(0)?.message?.content ?? "";
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
      messages: sendMessages,
      stream: options.config.stream,
      model: modelConfig.model,
      // temperature: modelConfig.temperature,
      presence_penalty: modelConfig.presence_penalty,
      frequency_penalty: modelConfig.frequency_penalty,
      top_p: modelConfig.top_p,
      // max_tokens: Math.max(modelConfig.max_tokens, 1024),
      // Please do not ask me why not send max_tokens, no reason, this param is just shit, I dont want to explain anymore.
      textract:
        config.multimodalType4Models[modelConfig.model] !==
        FILE_SUPPORT_TYPE.ALL,
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

    try {
      const chatPath = this.path(OpenaiPath.ChatPath);
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

            if (res.status === 200 && contentType === "application/json") {
              const json = await res.clone().json();
              responseText = json.message;
              isStreamDone = true;
              return finish();
            } else if (
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
              : msg.data === "[DONE]";

            if (msg.data === "[DONE]") {
              return finish();
            }
            const text = msg.data;
            try {
              const json = extractMessageBody(text, modelConfig.model);
              const choices = json.choices as Array<{
                delta: { content: string | Array<{ text: string }> };
              }>;
              const delta = choices[0]?.delta?.content;
              const textmoderation = json?.prompt_filter_results;

              if (delta) {
                if (typeof delta === "string") {
                  remainText += delta;
                } else {
                  const msgs = delta.map((m) => m.text).join("\n");
                  remainText += msgs;
                }
              }

              if (
                textmoderation &&
                textmoderation.length > 0 &&
                ServiceProvider.Azure
              ) {
                const contentFilterResults =
                  textmoderation[0]?.content_filter_results;
                console.log(
                  `[${ServiceProvider.Azure}] [Text Moderation] flagged categories result:`,
                  contentFilterResults,
                );
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
        options.onFinish(message, false);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat request", e);
      options.onError?.(e as Error);
    }
  }

  async toolAgentChat(options: AgentChatOptions) {
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
    const accessStore = useAccessStore.getState();

    const condition = session.mask.isStoreModel
      ? /* 商店模型 */ session.mask.isGptsModel
        ? false
        : config.multimodalType4Models[modelConfig.model] ===
          FILE_SUPPORT_TYPE.ONLY_IMAGE
      : config.fileSupportType === FILE_SUPPORT_TYPE.ONLY_IMAGE;

    const sendMessages = buildMessages(messages, modelConfig.model, condition);
    const isAzure = accessStore.provider === ServiceProvider.Azure;
    let baseUrl = isAzure ? accessStore.azureUrl : accessStore.openaiUrl;
    const requestPayload = {
      messages: sendMessages.map((message) => {
        let content = message.content;
        if (typeof content === "string") {
          return {
            role: message.role,
            content: content,
          };
        }

        let text = "";
        for (const msg of content) {
          if (msg.type === "text") {
            if (text !== "") text += "\n";
            text += msg.text;
          } else if (msg.type === "image_url") {
            if (text !== "") text += "\n";
            text += `${msg.image_url?.url}`;
          } else if (msg.type === "file") {
            if (text !== "") text += "\n";
            text += `${msg.file?.url}`;
          }
        }
        return {
          role: message.role,
          content: text,
        };
      }),
      isAzure,
      azureApiVersion: accessStore.azureApiVersion,
      stream: options.config.stream,
      model: modelConfig.model,
      temperature: modelConfig.temperature,
      presence_penalty: modelConfig.presence_penalty,
      frequency_penalty: modelConfig.frequency_penalty,
      top_p: modelConfig.top_p,
      baseUrl: baseUrl,
      maxIterations: options.agentConfig.maxIterations,
      returnIntermediateSteps: options.agentConfig.returnIntermediateSteps,
      useTools: options.agentConfig.useTools,
      searchEngine: options.agentConfig.searchEngine,
      textract: true,
      multimodalType4Models: config.multimodalType4Models,
    };

    if (modelConfig.model.toLocaleLowerCase().includes("baichuan")) {
      Object.defineProperty(requestPayload, "frequency_penalty", {
        enumerable: true,
        configurable: true,
        writable: true,
        value: 1,
      });
    }

    console.log("[Request] openai payload: ", requestPayload);

    const shouldStream = true;
    const controller = new AbortController();
    options.onController?.(controller);

    let isAborted = false;
    let finished = false;
    const shouldRetry =
      options.onRetry &&
      options.retryCount !== undefined &&
      options.retryCount < 1;
    console.log("🚀 ~ [Request] toolAgentChat ~ shouldRetry:", shouldRetry);

    try {
      let path = "/api/langchain/tool/agent/";
      const enableNodeJSPlugin = serverConfig.enableNodeJSPlugin; // !!process.env.NEXT_PUBLIC_ENABLE_NODEJS_PLUGIN;
      console.log(
        "🚀 ~ [Request] toolAgentChat ~ enableNodeJSPlugin:",
        enableNodeJSPlugin,
      );

      // path = enableNodeJSPlugin ? path + "nodejs" : path + "edge";
      path = path + "nodejs";
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
      // console.log("shouldStream", shouldStream);

      if (shouldStream) {
        let responseText = "";
        // let isStreamDone = false;
        let hasUncatchError = false;

        const finish = () => {
          if (!finished) {
            finished = true;

            if (responseText?.length === 0) {
              if (shouldRetry) {
                controller.abort();
                options.onRetry?.();
              } else {
                options.onFinish("empty response from server", true);
              }
            } else {
              options.onFinish(
                responseText,
                /* !isStreamDone || */ hasUncatchError || isAborted,
              );
            }
          }
        };

        controller.signal.onabort = () => {
          console.warn("🚀 ~ ChatGPTApi ~ toolAgentChat ~ onabort");
          isAborted = true;
          finish();
        };

        console.log(
          "[OpenAI agentChat] request retry count: ",
          options.retryCount,
        );
        fetchEventSource(path, {
          ...chatPayload,
          async onopen(res) {
            clearTimeout(requestTimeoutId);
            const contentType = res.headers.get("content-type");
            console.log(
              "[OpenAI agentChat] request response content type: ",
              contentType,
            );
            console.log("[OpenAI agentChat] request response: ", res);

            if (contentType?.startsWith("text/plain")) {
              if (shouldRetry) {
                controller.abort();
                options.onRetry?.();
                return;
              }

              responseText = await res.clone().text();
              return finish();
            }

            if (res.status === 200 && contentType === "application/json") {
              const json = await res.clone().json();
              responseText = json.message;
              // isStreamDone = true;
              return finish();
            } else if (
              !res.ok ||
              !res.headers
                .get("content-type")
                ?.startsWith(EventStreamContentType) ||
              res.status !== 200
            ) {
              const responseTexts = [responseText];
              let extraInfo = await res.clone().text();
              console.warn(
                "🚀 ~ [tool agent chat] ~ onopen ~ extraInfo:",
                extraInfo,
              );
              let errorMsg = ERROR_MESSAGE;

              // try {
              //   const resJson = await res.clone().json();
              //   console.warn(
              //     "🚀 ~ [tool agent chat] ~ onopen ~ resJson:",
              //     resJson,
              //   );
              //   errorMsg = ERROR_MESSAGE;
              //   hasUncatchError = true;
              //   // extraInfo = prettyObject(resJson);
              // } catch {}

              try {
                const resJson = await res.clone().json();
                if (resJson.error) {
                  if (resJson.error?.type === "api_error") {
                    const CODE =
                      ERROR_CODE[resJson.error.err_code as ERROR_CODE_TYPE];

                    const _err = Locale.Auth[CODE as AuthType];
                    errorMsg =
                      typeof _err === "function"
                        ? _err
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

              if (shouldRetry) {
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

              responseText = responseTexts.join("\n\n");

              return finish();
            }
          },
          onmessage(msg) {
            // console.log("🚀 ~ [OpenAI agentChat] ~ onmessage ~ msg:", msg);
            // isStreamDone = msg.data === "[DONE]";
            let response = JSON.parse(msg.data);

            // 匹配错误信息
            if (response.message.match(/"error":/)) {
              console.warn(
                "🚀 ~ [OpenAI Request] ~ onmessage ~ response[errorMessage]:",
                msg,
              );
              hasUncatchError = true;
            }

            if (!response.isSuccess) {
              console.error("[OpenAI Request] onmessage error: ", response);
              responseText = ERROR_MESSAGE;

              const resJson = response;
              if (resJson.error) {
                if (resJson.error?.type === "api_error") {
                  const err = resJson.error.error;

                  const CODE = ERROR_CODE[err.err_code as ERROR_CODE_TYPE];

                  const _err = Locale.Auth[CODE as AuthType];
                  responseText =
                    typeof _err === "function"
                      ? _err
                      : _err || resJson.error.message;

                  hasUncatchError = false;
                } else {
                  // 除了自定义的错误信息, 其他错误都显示 Network error, please retry.
                  responseText = ERROR_MESSAGE;
                  hasUncatchError = true;
                }
              } else {
                hasUncatchError = true;
              }

              if (hasUncatchError && shouldRetry) {
                controller.abort();
                options.onRetry?.();
                return;
              } else {
                return finish();
              }
            }
            if (msg.data === "[DONE]" || finished) {
              return finish();
            }
            try {
              if (response && !response.isToolMessage) {
                responseText += response.message;
                options.onUpdate?.(responseText, response.message);
              } else {
                let inputMessage = response.message;
                try {
                  const inputJson = JSON.parse(response.message);
                  inputMessage =
                    inputJson.input ?? inputJson.prompt ?? response.message;
                } catch (err) {}

                let toolName = response.toolName;
                if (toolName === "wikipedia-api") {
                  toolName = "Wikipedia";
                }
                if (toolName === "image-recognition") {
                  toolName =
                    config.multimodalType4Models[modelConfig.model] ===
                    FILE_SUPPORT_TYPE.ONLY_IMAGE
                      ? modelConfig.model
                      : "claude-3.5";
                  inputMessage = "Image recognition";
                }
                options.onToolUpdate?.(toolName, inputMessage);
              }
            } catch (e) {
              console.error("[Request] parse error", response, msg);
            }
          },
          onclose() {
            console.warn("🚀 ~ [OpenAI agentChat] ~ onmessage ~ onclose");
            finish();
          },
          onerror(e) {
            console.log("options.retryCount========", options.retryCount);

            if (shouldRetry) {
              controller.abort();
              options.onRetry?.();
              throw e;
            } else {
              options.onError?.(e);
              throw e;
            }
          },
          openWhenHidden: true,
        });
      } else {
        const res = await fetch(path, chatPayload);
        clearTimeout(requestTimeoutId);

        const resJson = await res.json();
        const message = this.extractMessage(resJson);
        options.onFinish(message);
      }
    } catch (e) {
      console.log("[Request] failed to make a chat reqeust", e);
      options.onError?.(e as Error);
    }
  }

  async usage() {
    const formatDate = (d: Date) =>
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    const ONE_DAY = 1 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startDate = formatDate(startOfMonth);
    const endDate = formatDate(new Date(Date.now() + ONE_DAY));

    const [used, subs] = await Promise.all([
      fetch(
        this.path(
          `${OpenaiPath.UsagePath}?start_date=${startDate}&end_date=${endDate}`,
        ),
        {
          method: "GET",
          headers: getHeaders(),
        },
      ),
      fetch(this.path(OpenaiPath.SubsPath), {
        method: "GET",
        headers: getHeaders(),
      }),
    ]);

    if (used.status === 401) {
      throw new Error(
        Locale.Error.Unauthorized(useAppConfig.getState().region),
      );
    }

    if (!used.ok || !subs.ok) {
      throw new Error("Failed to query usage from openai");
    }

    const response = (await used.json()) as {
      total_usage?: number;
      error?: {
        type: string;
        message: string;
      };
    };

    const total = (await subs.json()) as {
      hard_limit_usd?: number;
    };

    if (response.error && response.error.type) {
      throw Error(response.error.message);
    }

    if (response.total_usage) {
      response.total_usage = Math.round(response.total_usage) / 100;
    }

    if (total.hard_limit_usd) {
      total.hard_limit_usd = Math.round(total.hard_limit_usd * 100) / 100;
    }

    return {
      used: response.total_usage,
      total: total.hard_limit_usd,
    } as LLMUsage;
  }

  async models(): Promise<LLMModel[]> {
    if (this.disableListModels) {
      return DEFAULT_MODELS.slice();
    }

    const res = await fetch(this.path(OpenaiPath.ListModelPath), {
      method: "GET",
      headers: {
        ...getHeaders(),
      },
    });

    const resJson = (await res.json()) as OpenAIListModelResponse;
    const chatModels = resJson.data?.filter((m) => m.id.startsWith("gpt-"));
    console.log("[Models]", chatModels);

    if (!chatModels) {
      return [];
    }

    return chatModels.map((m) => ({
      name: m.id,
      available: true,
      provider: {
        id: "openai",
        providerName: "OpenAI",
        providerType: "openai",
      },
    }));
  }

  async errorHandle(res: Response) {
    if (!res.ok) {
      console.warn("🚀 ~ ChatGPTApi ~ errorHandle ~ res:", res);
      let errorMsg = "";

      if (res.status >= 500) {
        errorMsg = Locale.Auth.SERVER_ERROR;
      } else {
        try {
          const resJson = await res.clone().json();
          if (resJson.error && resJson.error?.type === "api_error") {
            const CODE = ERROR_CODE[resJson.error.err_code as ERROR_CODE_TYPE];

            const _err = Locale.Auth[CODE as AuthType];
            errorMsg =
              typeof _err === "function" ? _err : _err || resJson.error.message;

            //
          } else if (resJson.error && resJson.error?.param.startsWith("5")) {
            errorMsg = Locale.Auth.SERVER_ERROR;
          }
        } catch {}
      }

      throw errorMsg;
    }
  }

  async audioTranscriptions(formData: FormData, baseUrl?: string) {
    let path = this.path(OpenaiPath.AudioTranscriptionsPath);
    if (baseUrl) {
      path = `${baseUrl}/${OpenaiPath.AudioTranscriptionsPath}`;
    }

    const res = await fetch(path, {
      method: "POST",
      headers: getHeadersNoCT(),
      body: formData,
    });

    await this.errorHandle(res);

    return res;
  }

  async audioSpeech(options: SpeechOptions) {
    const res = await fetch(this.path(OpenaiPath.AudioSpeechPath), {
      method: "POST",
      body: JSON.stringify(options),
      headers: {
        ...getHeaders(),
      },
    });

    await this.errorHandle(res);

    return res;
  }
}
export { OpenaiPath };
