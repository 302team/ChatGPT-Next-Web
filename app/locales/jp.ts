import type { PartialLocaleType } from "./index";
import { getClientConfig } from "../config/client";
import { SubmitKey, useAppConfig } from "../store/config";
import { GPT302_WEBSITE_CN_URL, GPT302_WEBSITE_URL, Region } from "../constant";

const config = useAppConfig.getState();

const homeLink =
  config.region === Region.China ? GPT302_WEBSITE_CN_URL : GPT302_WEBSITE_URL;
const homeText = config.region === Region.China ? "302.AI" : "302.AI";

function getLink(region = config.region) {
  const homeLink = location.hostname.includes("302ai.cn")
    ? GPT302_WEBSITE_CN_URL
    : region === Region.China
      ? GPT302_WEBSITE_CN_URL
      : GPT302_WEBSITE_URL;
  const homeText = config.region === Region.China ? "302.AI" : "302.AI";

  return {
    homeLink,
    homeText,
  };
}
const isApp = !!getClientConfig()?.isApp;

const jp: PartialLocaleType = {
  WIP: "この機能はまだ開発中です……",
  Error: {
    Unauthorized: (region = 0) =>
      `[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のツールを作成してください`,
    ApiTimeout: "リクエストに失敗しました。再試行してください",
    NetworkError: "ネットワークエラー",
    PageOpenError: "ページの読み込みに失敗しました",
    Action: {
      Retry: "再試行",
    },
    CAN_NOT_OPEN_FILE_ERROR:
      "申し訳ありませんが、このファイルを開くことができません",
  },
  Auth: {
    Warn: "注意",
    Login: "ログイン",
    Register: "登録",
    Unauthorized: (region = 0) =>
      `このツールはデモ表示用です。<a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a>にアクセスして、あなた自身のツールを作成してください`,
    Title: "共有コードを入力",
    Tips: "作成者が認証を有効にしました。以下に共有コードを入力してください",
    SubTips: "または、あなたのOpenAIまたはGoogle APIキーを入力してください",
    Input: "共有コードを入力してください",
    Remember: "共有コードを記憶する",
    ValidError: "共有コードが無効です。再試行してください",
    Confirm: "確認",
    Later: "後で",
    CAPTCHA_ERROR: "共有コードが無効です。再試行してください",
    CHATBOT_DISABLED_ERROR: (region = 0) =>
      `ツールが無効化されています。詳細は<a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a>をご覧ください`,
    CHATBOT_DELETE_ERROR: (region = 0) =>
      `ツールが削除されています。詳細は<a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a>をご覧ください`,
    SERVER_ERROR:
      "内部エラーが発生しました。カスタマーサポートにお問い合わせください",
    BALANCE_LIMIT_ERROR: "アカウント残高が不足しています。チャージしてください",
    TOKEN_EXPIRED_ERROR:
      "トークンの有効期限が切れています。再度ログインしてください",
    CHATBOT_DISABLED_ERROR2: (region = 0) =>
      `このツールは無効化されています。詳細は[${getLink(region).homeText}](${getLink(region).homeLink})をご覧ください`,
    TOTAL_QUOTA_ERROR: (region = 0) =>
      `このツールの総利用枠に達しました。[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のツールを作成してください`,
    DAILY_QUOTA_ERROR: (region = 0) =>
      `このツールの1日の利用枠に達しました。[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のツールを作成してください`,
    HOUR_QUOTA_ERROR: (region = 0) =>
      `この無料ツールは今時間の上限に達しました。[${getLink(region).homeText}](${getLink(region).homeLink})を訪問して自分のツールを作成してください`,
  },
  Preview: {
    Title: "リアルタイムプレビュー",
    Actions: {
      Preview: "プレビュー",
      Code: "コード",
      Implement: "実行",
      Stdout: "実行結果",
    },
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count}件の会話`,
  },
  Chat: {
    SubTitle: (count: number) => `${count}件の会話`,
    EditMessage: {
      Title: "メッセージ履歴を編集",
      Topic: {
        Title: "チャットトピック",
        SubTitle: "現在のチャットトピックを変更",
      },
    },
    Actions: {
      ChatList: "メッセージリストを表示",
      CompressedHistory: "圧縮された履歴プロンプトを表示",
      Export: "チャット履歴をエクスポート",
      Copy: "コピー",
      Stop: "停止",
      Retry: "再試行",
      Pin: "固定",
      PinToastContent: "1件の会話をプリセットプロンプトに固定しました",
      PinToastAction: "表示",
      Delete: "削除",
      Edit: "編集",
      Speek: "再生",
    },
    Commands: {
      new: "新しいチャット",
      newm: "アシスタントから新しいチャット",
      next: "次のチャット",
      prev: "前のチャット",
      clear: "コンテキストをクリア",
      del: "チャットを削除",
    },
    InputActions: {
      Stop: "応答を停止",
      ToBottom: "最新へスクロール",
      Theme: {
        auto: "自動テーマ",
        light: "ライトモード",
        dark: "ダークモード",
      },
      Prompt: "ショートカット",
      Masks: "すべてのアシスタント",
      Clear: "チャットをクリア",
      Settings: "会話設定",
      UploadImage: "画像をアップロード",
      Waiting: "お待ちください...",
    },
    Rename: "チャットの名前を変更",
    Typing: "入力中…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} で送信`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "、Shift + Enter で改行";
      }
      return "メッセージを送信"; // inputHints + "、/ で補完をトリガー、: でコマンドをトリガー";
    },
    Send: "送信",
    Config: {
      Reset: "リセット",
      SaveAs: "アシスタントとして保存",
    },
    IsContext: "コンテキストプロンプト",
    Speech: {
      Voice: "音声",
      ResponseFormat: "レスポンスフォーマット",
      Speed: "速度",
      FetchAudioError:
        "音声ファイルの取得に失敗しました。インターフェースまたはOSS設定を確認してください",
      Recording: "録音中：",
      ToVoiceError: "テキストから音声への変換エラー！",
      ToTextEmpty: "認識できません",
      ToTextError: "音声からテキストへの変換エラー！",
      StartSpeaking: "話し始める",
      StopSpeaking: "話し終わる",
      NotSupport: "お使いのブラウザは録音機能をサポートしていません",
      ConverError: "音声フォーマットの変換に失敗しました",
    },
    Model: {
      Selector: "モデルを選択",
      Local: "ローカルモデル",
      KnowledgeBase: "知識ベース",
      SearchPlaceholder: "名前を入力してください",
    },
    Tips: "AIは間違える可能性があります。重要な情報は確認することを検討してください。",
    Upload: {
      Limit: (size: number | string) => {
        return `ファイルは${size}を超えることはできません`;
      },
    },
    EnableModel: "競わせたいモデルを有効にしてください",
    MultiChats: "マルチラウンド対話",
  },
  Community: {
    Title: "何が質問に値するか",
    Search: "検索",
    Placeholder: "興味のある質問を検索",
    SharePlaceholder: "あなたの質問を共有",
    Share: "共有したい",
    ShareSuccess: "共有成功",
    ShareFailed: "共有失敗",
    Cancel: "キャンセル",
    Submit: "共有",
  },
  Export: {
    Title: "チャット履歴を共有",
    Copy: "すべてコピー",
    Download: "ダウンロード",
    Share: "ShareGPTで共有",
    MessageFromYou: "ユーザー",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "エクスポート形式",
      SubTitle: "MarkdownテキストまたはPNG画像をエクスポートできます",
    },
    IncludeContext: {
      Title: "アシスタントのコンテキストを含む",
      SubTitle: "メッセージにアシスタントのコンテキストを表示するかどうか",
    },
    Steps: {
      Select: "選択",
      Preview: "プレビュー",
    },
    Image: {
      Toast: "スクリーンショットを生成中",
      Modal: "長押しまたは右クリックで画像を保存",
    },
    ShareMessage: (pwd?: string, isGpts?: boolean, modelName?: string) => {
      let url = location.href;
      let msg = "リンク: ";
      if (pwd) {
        url += `?pwd=${pwd}`;
      }
      msg += url;
      if (pwd) {
        msg += `\n共有コード: ${pwd}`;
      }

      if (isGpts && modelName) {
        msg += `\nアプリケーション: ${modelName}`;
      }
      msg += `\n---${homeText}メンバーからの共有`;

      return msg;
    },
    Artifacts: {
      Title: "共有ページ",
      Error: "共有に失敗しました",
    },
  },
  Select: {
    Search: "メッセージを検索",
    All: "すべて選択",
    Latest: "最新の数件",
    Clear: "選択をクリア",
  },
  Memory: {
    Title: "履歴サマリー",
    EmptyContent: "会話が短すぎて要約の必要がありません",
    Send: "メモリを送信",
    Copy: "メモリをコピー",
    Reset: "[未使用]",
    ResetConfirm:
      "リセットすると、現在の会話履歴がクリアされ、履歴サマリーも削除されます。リセットしてもよろしいですか？",
  },
  Home: {
    NewChat: "新しいチャット",
    DeleteChat: "選択した会話を削除してもよろしいですか？",
    DeleteToast: "チャットが削除されました",
    Revert: "元に戻す",
    Search: "チャットを検索",
    ZeroShot: "競技へ",
  },
  Settings: {
    Sync: {
      CloudState: "クラウドデータ",
      NotSyncYet: "まだ同期していません",
      Success: "同期成功",
      Fail: "同期失敗",

      Config: {
        Modal: {
          Title: "クラウド同期の設定",
          Check: "利用可能性を確認",
        },
        SyncType: {
          Title: "同期タイプ",
          SubTitle: "お好みの同期サーバーを選択",
        },
        Proxy: {
          Title: "プロキシを有効にする",
          SubTitle:
            "ブラウザで同期する際、クロスドメイン制限を回避するためにプロキシを有効にする必要があります",
        },
        ProxyUrl: {
          Title: "プロキシアドレス",
          SubTitle:
            "このプロジェクトに付属のクロスドメインプロキシにのみ適用されます",
        },

        WebDav: {
          Endpoint: "WebDAVアドレス",
          UserName: "ユーザー名",
          Password: "パスワード",
        },

        UpStash: {
          Endpoint: "UpStash Redis REST Url",
          UserName: "バックアップ名",
          Password: "UpStash Redis REST Token",
        },
      },

      LocalState: "ローカルデータ",
      Overview: (overview: any) => {
        return `${overview.chat}回の対話、${overview.message}件のメッセージ、${overview.prompt}件のプロンプト、${overview.mask}個のアシスタント`;
      },
      ImportFailed: "インポート失敗",

      Storage: {
        Title: "ストレージ使用量",
        SubTitle:
          "ローカルデータのストレージ使用状況。ブラウザのLocalStorageは5MBしかないため、ストレージがほぼいっぱいになったら、データをエクスポートしてバックアップし、削除することをお勧めします",
      },
    },
    Mask: {
      Splash: {
        Title: "アシスタント起動ページ",
        SubTitle: "新しいチャットを開始する際、アシスタント起動ページを表示",
      },
      Builtin: {
        Title: "内蔵アシスタントを非表示",
        SubTitle:
          "すべてのアシスタントリストから内蔵アシスタントを非表示にする",
      },
    },
    Prompt: {
      Disable: {
        Title: "プロンプトの自動補完を無効にする",
        SubTitle: "入力欄の先頭に / を入力すると自動補完がトリガーされます",
      },
      List: "カスタムプロンプトリスト",
      ListCount: (builtin: number, custom: number) =>
        `内蔵 ${builtin} 件、ユーザー定義 ${custom} 件`,
      Edit: "編集",
      Modal: {
        Title: "プロンプトリスト",
        Add: "新規作成",
        Search: "プロンプトを検索",
      },
      EditModal: {
        Title: "プロンプトを編集",
      },
    },
    HistoryCount: {
      Title: "添付する履歴メッセージ数",
      SubTitle: "リクエストごとに送信する履歴メッセージの数",
    },
    CompressThreshold: {
      Title: "履歴メッセージの長さ圧縮しきい値",
      SubTitle: "圧縮されていない履歴メッセージがこの値を超えると圧縮されます",
    },

    Usage: {
      Title: "残高照会",
      SubTitle(used: any, total: any) {
        return `今月の使用額 $${used}、サブスクリプション総額 $${total}`;
      },
      IsChecking: "確認中…",
      Check: "再確認",
      NoAccess: "APIキーまたはアクセスパスワードを入力して残高を表示",
    },

    Access: {
      AccessCode: {
        Title: "アクセスパスワード",
        SubTitle: "管理者が暗号化アクセスを有効にしています",
        Placeholder: "アクセスパスワードを入力してください",
      },
      CustomEndpoint: {
        Title: "カスタムエンドポイント",
        SubTitle: "カスタムAzureまたはOpenAIサービスを使用するかどうか",
      },
      Provider: {
        Title: "モデルプロバイダー",
        SubTitle: "異なるプロバイダーを切り替える",
      },
      OpenAI: {
        ApiKey: {
          Title: "APIキー",
          SubTitle: "カスタムOpenAI Keyを使用してパスワードアクセス制限を回避",
          Placeholder: "OpenAI APIキー",
        },

        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle:
            "デフォルトアドレス以外は、http(s)://を含める必要があります",
        },
      },
      Azure: {
        ApiKey: {
          Title: "APIキー",
          SubTitle: "カスタムAzure Keyを使用してパスワードアクセス制限を回避",
          Placeholder: "Azure APIキー",
        },

        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },

        ApiVerion: {
          Title: "APIバージョン（azure api version）",
          SubTitle: "指定されたバージョンを選択",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "APIキー",
          SubTitle:
            "カスタムAnthropic Keyを使用してパスワードアクセス制限を回避",
          Placeholder: "Anthropic APIキー",
        },

        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },

        ApiVerion: {
          Title: "APIバージョン（claude api version）",
          SubTitle: "特定のAPIバージョンを選択して入力",
        },
      },
      Google: {
        ApiKey: {
          Title: "APIキー",
          SubTitle: "Google AIからAPIキーを取得",
          Placeholder: "Google AI Studio APIキーを入力してください",
        },

        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },

        ApiVersion: {
          Title: "APIバージョン（gemini-proのみ適用）",
          SubTitle: "特定のAPIバージョンを選択",
        },
      },
      CustomModel: {
        Title: "カスタムモデル名",
        SubTitle: "カスタムモデルのオプションを追加、カンマで区切ってください",
      },
    },

    Model: "モデル（model）",
    Temperature: {
      Title: "ランダム性（temperature）",
      SubTitle: "値が大きいほど、応答がランダムになります",
    },
    TopP: {
      Title: "上位P（top_p）",
      SubTitle:
        "ランダム性と似ていますが、ランダム性と一緒に変更しないでください",
    },
    MaxTokens: {
      Title: "単一応答制限（max_tokens）",
      SubTitle: "1回の対話で使用される最大トークン数",
    },
    PresencePenalty: {
      Title: "話題の新鮮さ（presence_penalty）",
      SubTitle: "値が大きいほど、新しい話題に拡張する可能性が高くなります",
    },
    FrequencyPenalty: {
      Title: "頻度ペナルティ（frequency_penalty）",
      SubTitle: "値が大きいほど、単語の繰り返しを減らす可能性が高くなります",
    },
  },
  Store: {
    DefaultTopic: "新しいチャット",
    BotHello: "何かお手伝いできることはありますか",
    Error: "エラーが発生しました。後でもう一度お試しください",
    Prompt: {
      History: (content: string) =>
        "これは過去のチャットの要約として前提情報です：" + content,
      Topic:
        "4〜5文字で直接この文の簡単なトピックを返してください。説明、句読点、感嘆詞、余分なテキストは不要です。太字にしないでください。トピックがない場合は「雑談」と直接返してください",
      Summarize:
        "会話の内容を簡潔に要約し、後続の文脈プロンプトとして使用してください。200文字以内に収めてください",
    },
  },
  Copy: {
    Success: "クリップボードにコピーしました",
    Failed: "コピーに失敗しました。クリップボードの権限を許可してください",
  },
  Download: {
    Success: "コンテンツはあなたのディレクトリにダウンロードされました。",
    Failed: "ダウンロードに失敗しました。",
  },
  Context: {
    Toast: (x: any) => `${x}個のプリセットプロンプトを含む`,
    Edit: "現在の会話設定",
    Add: "新しい会話を追加",
    Clear: "コンテキストがクリアされました",
    Revert: "コンテキストを復元",
  },
  Plugin: {
    Name: "プラグイン",
  },
  FineTuned: {
    Sysmessage: "あなたはアシスタントです",
  },
  Mask: {
    Name: "アシスタント",
    Page: {
      Title: "プリセットアシスタント",
      SubTitle: (count: number) => `${count}個のプリセットアシスタント定義`,
      Search: "アシスタントを検索",
      Create: "新規作成",
    },
    Item: {
      Info: (count: number) => `${count}個のプリセット会話を含む`,
      Chat: "チャット",
      View: "表示",
      Edit: "編集",
      Delete: "削除",
      DeleteConfirm: "削除しますか？",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `プリセットアシスタントを編集 ${readonly ? "（読み取り専用）" : ""}`,
      Download: "プリセットをダウンロード",
      Clone: "プリセットをクローン",
    },
    Config: {
      Avatar: "アシスタントのアバター",
      Name: "アシスタント名",
      Sync: {
        Title: "グローバル設定を使用",
        SubTitle: "現在の会話でグローバルモデル設定を使用するかどうか",
        Confirm:
          "現在の会話のカスタム設定は自動的に上書きされます。グローバル設定を有効にしますか？",
      },
      HideContext: {
        Title: "プリセット会話を非表示",
        SubTitle:
          "非表示にするとプリセット会話がチャットインターフェースに表示されません",
      },
      Share: {
        Title: "このアシスタントを共有",
        SubTitle: "このアシスタントの直接リンクを生成",
        Action: "リンクをコピー",
      },
    },
  },
  NewChat: {
    Return: "戻る",
    Skip: "すぐに始める",
    NotShow: "今後表示しない",
    ConfirmNoShow:
      "無効にしますか？無効にした後でも、設定からいつでも再度有効にできます。",
    Title: "アシスタントを選択",
    SubTitle: "今から、アシスタントの背後にある魂と思考の衝突を始めましょう",
    More: "すべて表示",
  },

  URLCommand: {
    Code: "リンクにアクセスコードが含まれています。自動的に入力しますか？",
    Settings: "リンクに事前設定が含まれています。自動的に入力しますか？",
  },

  UI: {
    Confirm: "確認",
    Cancel: "キャンセル",
    Close: "閉じる",
    Create: "新規作成",
    Edit: "編集",
    Export: "エクスポート",
    Import: "インポート",
    Sync: "同期",
    Config: "設定",
  },
  Exporter: {
    Description: {
      Title: "コンテキストをクリアした後のメッセージのみが表示されます",
    },
    Model: "モデル",
    Tool: "ツール",
    Messages: "メッセージ",
    Source: "ソース",
    Topic: "トピック",
    Time: "時間",
  },
  GPTs: {
    PrefixName: "[アプリ]",
    Modal: {
      Title: "アプリストア",
      Subtitle: "",
    },
    Error: {
      Deleted: "アプリは削除されました",
    },
  },
  Dall: {
    Num: "生成する画像の数",
    Quality: "画像品質",
    ResponseFormat: "返却データ形式",
    Size: "解像度",
    Style: "スタイル",
    RevisedPrompt: (prompt: string) => `**修正後のプロンプト:**\n${prompt}`,
    FetchImageError: "画像を取得できないか、OSSが設定されていません",
  },
  Config: {
    title: `Model Arena - 302.AI`,
    description: (type: string = "AI") =>
      `ワンクリックで自分だけの${type}ボットを生成`,
    AppDescTitle: "説明",
    AppDescSubTitle: "モデルアリーナの詳細プレビュー",
    AppDescContent: "",
  },
  Sidebar: {
    Title: "モデルアリーナ",
    Description: "すべてのモデルが一緒に回答",
  },
};

export default jp;
