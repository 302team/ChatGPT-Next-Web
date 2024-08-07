import { getClientConfig } from "../config/client";
import { SubmitKey, useAppConfig } from "../store/config";
import { LocaleType } from "./index";

import { GPT302_WEBSITE_CN_URL, GPT302_WEBSITE_URL, Region } from "../constant";

const config = useAppConfig.getState();

function getLink(region = config.region) {
  const homeLink =
    region === Region.China ? GPT302_WEBSITE_CN_URL : GPT302_WEBSITE_URL;
  const homeText = config.region === Region.China ? "302.AI" : "302.AI";

  return {
    homeLink,
    homeText,
  };
}
// if you are adding a new translation, please use PartialLocaleType instead of LocaleType

const isApp = !!getClientConfig()?.isApp;
const en: LocaleType = {
  WIP: "Coming Soon...",
  Error: {
    Unauthorized: (region = 0) =>
      `Please visit [${getLink(region).homeText}](${getLink(region).homeLink}) to create your own robot`,
    ApiTimeout: "Request failed, please try again",
    NetworkError: "Network Error",
    PageOpenError: "Page Open Error",
    Action: {
      Retry: "Retry",
    },
    CAN_NOT_OPEN_FILE_ERROR: "Sorry, I can't open this file",
  },
  Auth: {
    Warn: "Tips",
    Login: "Login",
    Register: "Sign up",
    Unauthorized: (region = 0) =>
      `This robot is for demonstration purposes. Please visit <a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a> to create your own robot`,
    Title: "Please enter the share code",
    Tips: "The creator has enabled verification, please enter the share code below",
    SubTips: "Or enter your OpenAI or Google API Key",
    Input: "share code",
    Remember: "Remember the share code",
    ValidError: "Share code incorrect",
    Confirm: "Confirm",
    Later: "Later",
    CAPTCHA_ERROR: "Share code incorrect",
    CHATBOT_DISABLED_ERROR: (region = 0) =>
      `Robot is disabled, Please refer to <a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a> for details`,
    CHATBOT_DELETE_ERROR: (region = 0) =>
      `Robot is deleted, Please refer to  <a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a> for details`,
    SERVER_ERROR: "Internal error, please contact customer service",
    BALANCE_LIMIT_ERROR: "The account balance is insufficient, please top up",
    TOKEN_EXPIRED_ERROR: "Token expired, please log in again",
    CHATBOT_DISABLED_ERROR2: (region = 0) =>
      `Robot is disabled, Please refer to [${getLink(region).homeText}](${getLink(region).homeLink}) for details`,
    TOTAL_QUOTA_ERROR: (region = 0) =>
      `Robot's total quota reached maximum limit. Please visit [${getLink(region).homeText}](${getLink(region).homeLink}) to create your own robot`,
    DAILY_QUOTA_ERROR: (region = 0) =>
      `Robot's daily quota reached maximum limit. Please visit [${getLink(region).homeText}](${getLink(region).homeLink}) to create your own robot`,
    HOUR_QUOTA_ERROR: (region = 0) =>
      `This robot's hour quota reached maximum limit. Please visit [${getLink(region).homeText}](${getLink(region).homeLink}) to create your own robot`,
  },
  Preview: {
    Title: "Preview",
    Actions: {
      Preview: "preview",
      Code: "code",
      Implement: "Implement",
      Stdout: "stdout",
    },
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} messages`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} messages`,
    EditMessage: {
      Title: "Edit All Messages",
      Topic: {
        Title: "Topic",
        SubTitle: "Change the current topic",
      },
    },
    Actions: {
      ChatList: "Go To Chat List",
      CompressedHistory: "Compressed History Memory Prompt",
      Export: "Export All Messages as Markdown",
      Copy: "Copy",
      Stop: "Stop",
      Retry: "Retry",
      Pin: "Pin",
      PinToastContent: "Pinned 1 messages to contextual prompts",
      PinToastAction: "View",
      Delete: "Delete",
      Edit: "Edit",
      Speek: "Speek",
    },
    Commands: {
      new: "Start a new chat",
      newm: "Start a new chat with assistant",
      next: "Next Chat",
      prev: "Previous Chat",
      clear: "Clear Context",
      del: "Delete Chat",
    },
    InputActions: {
      Stop: "Stop",
      ToBottom: "To Latest",
      Theme: {
        auto: "Auto",
        light: "Light Theme",
        dark: "Dark Theme",
      },
      Prompt: "Prompts",
      Masks: "Assistant",
      Clear: "Clear Context",
      Settings: "Settings",
      UploadImage: "Upload Images",
      Waiting: "Please wait...",
      Translate: "Translate",
      InputTips: "Please input content!",
      TranslateTo: (target: string = navigator.language) =>
        `Check if the user's input is ${target}. If not, please translate it into ${target}, including punctuation. Note, you only need to output the translation result without any other prompts.`,
      TranslateError: "Translate Error",
    },
    Rename: "Rename Chat",
    Typing: "Typing…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} to send`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter to wrap";
      }
      return "Send message"; // inputHints + ", / to search prompts, : to use commands";
    },
    Send: "Send",
    Config: {
      Reset: "Reset to Default",
      SaveAs: "Save as Assistant",
    },
    IsContext: "Contextual Prompt",
    Speech: {
      Voice: "Voice",
      ResponseFormat: "ResponseFormat",
      Speed: "speed",
      FetchAudioError: "FetchAudioError, please check interface or OSS",
      Recording: "Recording:",
      ToTextEmpty: "Can't recognize",
      ToVoiceError: "Text to voice error!",
      ToTextError: "Voice to text error!",
      StartSpeaking: "Start speaking",
      StopSpeaking: "Stop speaking",
      NotSupport: "Your browser does not support the recording function",
      ConverError: "Audio format conversion failed",
    },
    Model: {
      Selector: "Model Selector",
      Local: "Local",
      KnowledgeBase: "Knowledge Base",
      SearchPlaceholder: "Please input value",
    },
    Tips: "AI can make mistakes. Consider checking important information.",
    Upload: {
      Limit: (size: string) => {
        return `File size cannot exceed ${size}`;
      },
    },
  },
  Export: {
    Title: "Export Messages",
    Copy: "Copy",
    Download: "Download",
    MessageFromYou: "Message From You",
    MessageFromChatGPT: "Message From ChatGPT",
    Share: "Share Link",
    Format: {
      Title: "Export Format",
      SubTitle: "Markdown or PNG Image",
    },
    IncludeContext: {
      Title: "Including Context",
      SubTitle: "Export context prompts in assistant or not",
    },
    Steps: {
      Select: "Select",
      Preview: "Preview",
    },
    Image: {
      Toast: "Capturing Image...",
      Modal: "Long press or right click to save image",
    },
    ShareMessage: (pwd?: string, isGpts?: boolean, modelName?: string) => {
      let url = location.href;
      let msg = "Link: ";
      if (pwd) {
        url += `?pwd=${pwd}`;
      }
      msg += url;
      if (pwd) {
        msg += `\nShare code: ${pwd}`;
      }

      if (isGpts && modelName) {
        msg += `\nApp: ${modelName}`;
      }
      msg += `\n---Shared by 302.AI user`;

      return msg;
    },
    Artifacts: {
      Title: "Share Artifacts",
      Error: "Share Error",
    },
  },
  Select: {
    Search: "Search",
    All: "Select All",
    Latest: "Select Latest",
    Clear: "Clear",
  },
  Memory: {
    Title: "Memory Prompt",
    EmptyContent: "Nothing yet.",
    Send: "Send Memory",
    Copy: "Copy Memory",
    Reset: "Reset Session",
    ResetConfirm:
      "Resetting will clear the current conversation history and historical memory. Are you sure you want to reset?",
  },
  Home: {
    NewChat: "New Chat",
    DeleteChat: "Confirm to delete the selected conversation?",
    DeleteToast: "Chat Deleted",
    Revert: "Revert",
    Search: "Search Chat",
  },
  Settings: {
    Title: "Settings",
    SubTitle: "All Settings",
    Danger: {
      Reset: {
        Title: "Reset All Settings",
        SubTitle: "Reset all setting items to default",
        Action: "Reset",
        Confirm: "Confirm to reset all settings to default?",
      },
      Clear: {
        Title: "Clear All Data",
        SubTitle: "Clear all messages and settings",
        Action: "Clear",
        Confirm: "Confirm to clear all messages and settings?",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "All Languages",
    },
    Avatar: "Avatar",
    FontSize: {
      Title: "Font Size",
      SubTitle: "Adjust font size of chat content",
      Normal: "Normal",
      Large: "Large",
      ExtraLarge: "Extra-Large",
    },
    InjectSystemPrompts: {
      Title: "Inject System Prompts",
      SubTitle: "Inject a global system prompt for every request",
    },
    InputTemplate: {
      Title: "Input Template",
      SubTitle: "Newest message will be filled to this template",
    },

    Update: {
      Version: (x: string) => `Version: ${x}`,
      IsLatest: "Latest version",
      CheckUpdate: "Check Update",
      IsChecking: "Checking update...",
      FoundUpdate: (x: string) => `Found new version: ${x}`,
      GoToUpdate: "Update",
    },
    SendKey: "Send Key",
    Theme: "Theme",
    TightBorder: "Tight Border",
    SendPreviewBubble: {
      Title: "Send Preview Bubble",
      SubTitle: "Preview markdown in bubble",
    },
    AutoGenerateTitle: {
      Title: "Auto Generate Title",
      SubTitle: "Generate a suitable title based on the conversation content",
    },
    Sync: {
      CloudState: "Last Update",
      NotSyncYet: "Not sync yet",
      Success: "Sync Success",
      Fail: "Sync Fail",

      Config: {
        Modal: {
          Title: "Config Sync",
          Check: "Check Connection",
        },
        SyncType: {
          Title: "Sync Type",
          SubTitle: "Choose your favorite sync service",
        },
        Proxy: {
          Title: "Enable CORS Proxy",
          SubTitle: "Enable a proxy to avoid cross-origin restrictions",
        },
        ProxyUrl: {
          Title: "Proxy Endpoint",
          SubTitle:
            "Only applicable to the built-in CORS proxy for this project",
        },

        WebDav: {
          Endpoint: "WebDAV Endpoint",
          UserName: "User Name",
          Password: "Password",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "Backup Name",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "Local Data",
      Overview: (overview: any) => {
        return `${overview.chat} chats，${overview.message} messages，${overview.prompt} prompts，${overview.mask} assistants`;
      },
      ImportFailed: "Failed to import from file",

      Storage: {
        Title: "Storage usage",
        SubTitle:
          "Local data storage occupancy. The browser LocalStorage is only 5M. When the storage is almost full, it is recommended to export the data for backup and then delete it.",
      },

      Actions: {
        Upload: "Upload",
        Download: "Download",
      },
      SyncToCloud: {
        Title: "Upload chat records to the cloud.",
        SubTitle:
          "If it is the first time to upload, a synchronization password will be generated automatically.",
      },
      SyncFromCloud: {
        Title: "Download chat records from the cloud.",
        SubTitle:
          "Please fill in the synchronization password. Please note that the current chat records will be overwritten.",
      },
      UploadSucceed: "Upload Succeed",
      DownloadSucceed: "Download Succeed",
      UploadFailed: "Upload Failed",
      DownloadFailed: "Download Failed",
      EmptyPwd: "Please enter password",
      EmptyLogs: "No records",
      Logs: "Sync Records",

      Prompt: {
        Title: "Long-term memory",
        SubTitle:
          "Enable the robot to retain information about you, this memory can be stored locally or uploaded along with the chat records.",
        Placeholder:
          "For example: I am xxxx, I live in xxxx, I have a dog called xxxx",
        Required: "Please enter the menories",
      },
      PromptActions: {
        Title: "Memory management",
        List: "Manage",
        Edit: "Edit Manage",
        Add: "Add memory",
        Delete: "Deleting memory",
      },
    },
    Mask: {
      Splash: {
        Title: "Assistant Splash Screen",
        SubTitle: "Show a assistant splash screen before starting new chat",
      },
      Builtin: {
        Title: "Hide Builtin Assistants",
        SubTitle: "Hide builtin assistants in assistant list",
      },
    },
    Prompt: {
      Disable: {
        Title: "Disable auto-completion",
        SubTitle: "Input / to trigger auto-completion",
      },
      List: "Prompt List",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} built-in, ${custom} user-defined`,
      Edit: "Edit",
      Modal: {
        Title: "Prompt List",
        Add: "Add One",
        Search: "Search Prompts",
      },
      EditModal: {
        Title: "Edit Prompt",
      },
    },
    HistoryCount: {
      Title: "Attached Messages Count",
      SubTitle: "Number of sent messages attached per request",
    },
    CompressThreshold: {
      Title: "History Compression Threshold",
      SubTitle:
        "Will compress if uncompressed messages length exceeds the value",
    },

    Usage: {
      Title: "Account Balance",
      SubTitle(used: any, total: any) {
        return `Used this month $${used}, subscription $${total}`;
      },
      IsChecking: "Checking...",
      Check: "Check",
      NoAccess: "Enter API Key to check balance",
    },
    Access: {
      AccessCode: {
        Title: "Access Code",
        SubTitle: "Access control Enabled",
        Placeholder: "Enter Code",
      },
      CustomEndpoint: {
        Title: "Custom Endpoint",
        SubTitle: "Use custom Azure or OpenAI service",
      },
      Provider: {
        Title: "Model Provider",
        SubTitle: "Select Azure or OpenAI",
      },
      OpenAI: {
        ApiKey: {
          Title: "OpenAI API Key",
          SubTitle: "User custom OpenAI Api Key",
          Placeholder: "sk-xxx",
        },

        Endpoint: {
          Title: "OpenAI Endpoint",
          SubTitle: "Must start with http(s):// or use /api/openai as default",
        },
      },
      Azure: {
        ApiKey: {
          Title: "Azure Api Key",
          SubTitle: "Check your api key from Azure console",
          Placeholder: "Azure Api Key",
        },

        Endpoint: {
          Title: "Azure Endpoint",
          SubTitle: "Example: ",
        },

        ApiVerion: {
          Title: "Azure Api Version",
          SubTitle: "Check your api version from azure console",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "Anthropic API Key",
          SubTitle:
            "Use a custom Anthropic Key to bypass password access restrictions",
          Placeholder: "Anthropic API Key",
        },

        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example:",
        },

        ApiVerion: {
          Title: "API Version (claude api version)",
          SubTitle: "Select and input a specific API version",
        },
      },
      CustomModel: {
        Title: "Custom Models",
        SubTitle: "Custom model options, seperated by comma",
      },
      Google: {
        ApiKey: {
          Title: "API Key",
          SubTitle: "Obtain your API Key from Google AI",
          Placeholder: "Enter your Google AI Studio API Key",
        },

        Endpoint: {
          Title: "Endpoint Address",
          SubTitle: "Example:",
        },

        ApiVersion: {
          Title: "API Version (specific to gemini-pro)",
          SubTitle: "Select a specific API version",
        },
      },
    },

    Model: "Model",
    Temperature: {
      Title: "Temperature",
      SubTitle: "A larger value makes the more random output",
    },
    TopP: {
      Title: "Top P",
      SubTitle: "Do not alter this value together with temperature",
    },
    MaxTokens: {
      Title: "Max Tokens",
      SubTitle: "Maximum length of input tokens and generated tokens",
    },
    PresencePenalty: {
      Title: "Presence Penalty",
      SubTitle:
        "A larger value increases the likelihood to talk about new topics",
    },
    FrequencyPenalty: {
      Title: "Frequency Penalty",
      SubTitle:
        "A larger value decreasing the likelihood to repeat the same line",
    },
  },
  Store: {
    DefaultTopic: "New Conversation",
    BotHello: "Hello! How can I assist you today?",
    Error: "Something went wrong, please try again later.",
    Prompt: {
      History: (content: string) =>
        "This is a summary of the chat history as a recap: " + content,
      Topic:
        "Please generate a four to five word title summarizing our conversation without any lead-in, punctuation, quotation marks, periods, symbols, bold text, or additional text. Remove enclosing quotation marks.",
      Summarize: (type: string) => {
        if (type === "medium") {
          return "Summarize the conversation in detail, and use it as a context prompt for the following. Keep it within 800 words.";
        } else if (type === "long") {
          return "Summarize the conversation in detail, and don't miss any details. Use it as a context prompt for the following. Keep it within 2000 words.";
        } else {
          return "Summarize the discussion briefly in 200 words or less to use as a prompt for future context.";
        }
      },
    },
  },
  Copy: {
    Success: "Copied to clipboard",
    Failed: "Copy failed, please grant permission to access clipboard",
  },
  Download: {
    Success: "Content downloaded to your directory.",
    Failed: "Download failed.",
  },
  Context: {
    Toast: (x: any) => `With ${x} contextual prompts`,
    Edit: "Current Chat Settings",
    Add: "Add a Prompt",
    Clear: "Context Cleared",
    Revert: "Revert",
  },
  Plugin: {
    Name: "Plugin",
  },
  FineTuned: {
    Sysmessage: "You are an assistant that",
  },
  Mask: {
    Name: "Assistant",
    Page: {
      Title: "Prompt Template",
      SubTitle: (count: number) => `${count} prompt templates`,
      Search: "Search Templates",
      Create: "Create",
    },
    Item: {
      Info: (count: number) => `${count} prompts`,
      Chat: "Chat",
      View: "View",
      Edit: "Edit",
      Delete: "Delete",
      DeleteConfirm: "Confirm to delete?",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `Edit Prompt Template ${readonly ? "(readonly)" : ""}`,
      Download: "Download",
      Clone: "Clone",
    },
    Config: {
      Avatar: "Bot Avatar",
      Name: "Bot Name",
      Sync: {
        Title: "Use Global Config",
        SubTitle: "Use global config in this chat",
        Confirm: "Confirm to override custom config with global config?",
      },
      HideContext: {
        Title: "Hide Context Prompts",
        SubTitle: "Do not show in-context prompts in chat",
      },
      Share: {
        Title: "Share This Assistant",
        SubTitle: "Generate a link to this assistant",
        Action: "Copy Link",
      },
    },
  },
  NewChat: {
    Return: "Return",
    Skip: "Just Start",
    Title: "Pick a Assistant",
    SubTitle: "Chat with the Soul behind the Assistant",
    More: "Find More",
    NotShow: "Never Show Again",
    ConfirmNoShow: "Confirm to disable？You can enable it in settings later.",
  },
  URLCommand: {
    Code: "Detected access code from url, confirm to apply? ",
    Settings: "Detected settings from url, confirm to apply?",
  },
  UI: {
    Confirm: "Confirm",
    Cancel: "Cancel",
    Close: "Close",
    Create: "Create",
    Edit: "Edit",
    Export: "Export",
    Import: "Import",
    Sync: "Sync",
    Config: "Config",
  },
  Exporter: {
    Description: {
      Title: "Only messages after clearing the context will be displayed",
    },
    Model: "Model",
    Messages: "Messages",
    Source: "Source",
    Topic: "Topic",
    Time: "Time",
    ModelName: "ERNIE-Bot-4",
  },
  GPTs: {
    PrefixName: "[App]",
    Modal: {
      Title: "App Store",
      Subtitle: "",
    },
    Error: {
      Deleted: "This App has been deleted.",
    },
  },
  Dall: {
    Num: "Num",
    Quality: "Quality",
    ResponseFormat: "ResponseFormat",
    Size: "Size",
    Style: "Style",
    RevisedPrompt: (prompt: string) => `**RevisedPrompt:**\n${prompt}`,
    FetchImageError: "Can not fetch image or no OSS setting",
  },
  Config: {
    title: "Chatbot - 302.AI",
    GPTs: "App",
    description: (type: string = "AI") =>
      `Create your own ${type} Robot with just one click`,
    AppDescTitle: "Description",
    AppDescSubTitle: "AI Chat Robot detailed preview",
    AppDescContent: "",
  },
};

export default en;
