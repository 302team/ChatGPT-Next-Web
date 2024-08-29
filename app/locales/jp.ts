import type { PartialLocaleType } from "./index";
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

const jp: PartialLocaleType = {
  WIP: "この機能はまだ開発中です...",
  Error: {
    Unauthorized: (region = 0) =>
      `[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のボットを作成してください`,
    ApiTimeout: "リクエストが失敗しました。もう一度お試しください",
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
      `このボットはデモ用です。<a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a>にアクセスして、あなた自身のボットを作成してください`,
    ShareCode: "共有コード",
    Title: "共有コードを入力してください",
    Tips: "作成者が認証を有効にしています。以下に共有コードを入力してください",
    SubTips: "または、OpenAIまたはGoogle APIキーを入力してください",
    Input: "共有コードを入力してください",
    Remember: "共有コードを記憶する",
    ValidError: "共有コードが無効です。もう一度お試しください",
    Confirm: "確認",
    Later: "後で",
    CAPTCHA_ERROR: "共有コードが無効です。もう一度お試しください",
    CHATBOT_DISABLED_ERROR: (region = 0) =>
      `ボットは無効になっています。詳細は<a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a>をご覧ください`,
    CHATBOT_DELETE_ERROR: (region = 0) =>
      `ボットは削除されました。詳細は<a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a>をご覧ください`,
    SERVER_ERROR: "内部エラーです。カスタマーサービスにお問い合わせください",
    BALANCE_LIMIT_ERROR: "アカウント残高が不足しています。チャージしてください",
    TOKEN_EXPIRED_ERROR:
      "トークンの有効期限が切れています。再度ログインしてください",
    CHATBOT_DISABLED_ERROR2: (region = 0) =>
      `ボットは無効になっています。詳細は[${getLink(region).homeText}](${getLink(region).homeLink})をご覧ください`,
    TOTAL_QUOTA_ERROR: (region = 0) =>
      `ボットの総クォータに達しました。[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のボットを作成してください`,
    DAILY_QUOTA_ERROR: (region = 0) =>
      `ボットの1日のクォータに達しました。[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のボットを作成してください`,
    HOUR_QUOTA_ERROR: (region = 0) =>
      `この無料ツールは今時間のクォータに達しました。[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のツールを生成してください`,
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
      new: "新しいチャットを開始",
      newm: "アシスタントから新しいチャットを開始",
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
      Masks: "全てのアシスタント",
      Clear: "チャットをクリア",
      Settings: "会話設定",
      UploadImage: "画像をアップロード",
      Waiting: "お待ちください...",
      Translate: "翻訳",
      InputTips: "内容を入力してください！",
      TranslateTo: (target: string = navigator.language) =>
        `ユーザーの入力が${target}でない場合、${target}に翻訳してください。句読点も変換してください。注意：翻訳結果のみを出力し、他の説明は不要です。`,
      TranslateError: "翻訳エラー！",
    },
    Rename: "チャットの名前を変更",
    Typing: "入力中...",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} で送信`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "、Shift + Enter で改行";
      }
      return "メッセージを送信";
    },
    Send: "送信",
    Config: {
      Reset: "メモリをクリア",
      SaveAs: "アシスタントとして保存",
    },
    IsContext: "プリセットプロンプト",
    Speech: {
      Voice: "音声",
      ResponseFormat: "返却データフォーマット",
      Speed: "速度",
      FetchAudioError:
        "音声ファイルの取得に失敗しました。インターフェースまたはOSS設定を確認してください",
      Recording: "録音中：",
      ToVoiceError: "テキストから音声への変換エラー！",
      ToTextEmpty: "認識できません",
      ToTextError: "音声からテキストへの変換エラー！",
      StartSpeaking: "話し始める",
      StopSpeaking: "話すのを止める",
      NotSupport: "お使いのブラウザは録音機能をサポートしていません",
      ConverError: "音声フォーマットの変換に失敗しました",
    },
    Model: {
      Selector: "モデルを選択",
      Local: "ローカルモデル",
      KnowledgeBase: "知識ベース",
      SearchPlaceholder: "名前を入力してください",
    },
    Tips: "AIは間違える可能性があります。重要な情報は確認してください。",
    Upload: {
      Limit: (size: string) => {
        return `ファイルサイズは${size}を超えることはできません`;
      },
    },
  },
  Export: {
    Title: "チャット履歴を共有",
    Copy: "すべてコピー",
    Download: "ダウンロード",
    Share: "共有リンク",
    MessageFromYou: "ユーザー",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "エクスポート形式",
      SubTitle: "Markdownテキストまたは画像としてエクスポートできます",
    },
    IncludeContext: {
      Title: "アシスタントのコンテキストを含める",
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
      msg += `\n---302.AIメンバーからの共有`;

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
    Title: "履歴の要約",
    EmptyContent: "会話が短すぎるため、要約は不要です",
    Send: "チャット履歴を自動的に圧縮し、コンテキストとして送信します",
    Copy: "要約をコピー",
    Reset: "[未使用]",
    ResetConfirm: "履歴の要約をクリアしてもよろしいですか？",
  },
  Home: {
    NewChat: "新しいチャット",
    DeleteChat: "選択した会話を削除してもよろしいですか？",
    DeleteToast: "会話が削除されました",
    Revert: "元に戻す",
    Search: "チャットを検索",
  },
  Settings: {
    Title: "設定",
    SubTitle: "すべての設定オプション",

    Danger: {
      Reset: {
        Title: "すべての設定をリセット",
        SubTitle: "すべての設定項目をデフォルト値にリセットします",
        Action: "今すぐリセット",
        Confirm: "すべての設定をリセットしてもよろしいですか？",
      },
      Clear: {
        Title: "すべてのデータを消去",
        SubTitle: "すべてのチャットと設定データを消去します",
        Action: "今すぐ消去",
        Confirm: "すべてのチャットと設定データを消去してもよろしいですか？",
      },
    },
    Lang: {
      Name: "Language",
      All: "すべての言語",
    },
    Avatar: "アバター",
    FontSize: {
      Title: "フォントサイズ",
      SubTitle: "チャットコンテンツのフォントサイズ",
      Normal: "普通",
      Large: "大きい",
      ExtraLarge: "特大",
    },
    InjectSystemPrompts: {
      Title: "システムプロンプトの注入",
      SubTitle:
        "各リクエストのメッセージリストの先頭にChatGPTのシミュレートされたシステムプロンプトを強制的に追加します",
    },
    InputTemplate: {
      Title: "ユーザー入力の前処理",
      SubTitle: "最新のユーザーメッセージがこのテンプレートに入力されます",
    },

    Update: {
      Version: (x: string) => `現在のバージョン：${x}`,
      IsLatest: "最新バージョンです",
      CheckUpdate: "アップデートを確認",
      IsChecking: "アップデートを確認中...",
      FoundUpdate: (x: string) => `新しいバージョンが見つかりました：${x}`,
      GoToUpdate: "アップデートする",
    },
    SendKey: "送信キー",
    Theme: "テーマ",
    TightBorder: "ボーダーレスモード",
    SendPreviewBubble: {
      Title: "プレビューバブル",
      SubTitle: "プレビューバブルでMarkdownコンテンツをプレビュー",
    },
    AutoGenerateTitle: {
      Title: "タイトルの自動生成",
      SubTitle: "会話の内容に基づいて適切なタイトルを生成します",
    },
    Sync: {
      CloudState: "クラウドデータ",
      NotSyncYet: "まだ同期されていません",
      Success: "同期成功",
      Fail: "同期失敗",

      Config: {
        Modal: {
          Title: "クラウド同期の設定",
          Check: "利用可能性を確認",
        },
        SyncType: {
          Title: "同期タイプ",
          SubTitle: "お好みの同期サーバーを選択してください",
        },
        Proxy: {
          Title: "プロキシを有効にする",
          SubTitle:
            "ブラウザで同期する際、CORSの制限を回避するためにプロキシを有効にする必要があります",
        },
        ProxyUrl: {
          Title: "プロキシアドレス",
          SubTitle: "このプロジェクトに付属のCORSプロキシにのみ適用されます",
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
        return `${overview.chat}件の会話、${overview.message}件のメッセージ、${overview.prompt}件のプロンプト、${overview.mask}個のアシスタント`;
      },
      ImportFailed: "インポート失敗",

      Storage: {
        Title: "ストレージ使用量",
        SubTitle:
          "ローカルデータストレージの使用状況。ブラウザのLocalStorageは5MBしかありません。ストレージがほぼいっぱいになったら、データをエクスポートしてバックアップし、削除することをお勧めします",
      },

      Actions: {
        Upload: "アップロード",
        Download: "ダウンロード",
      },
      SyncToCloud: {
        Title: "チャット履歴をクラウドにアップロード",
        SubTitle:
          "初めてアップロードする場合、同期パスワードが自動的に生成されます",
      },
      SyncFromCloud: {
        Title: "クラウドからチャット履歴をダウンロード",
        SubTitle:
          "同期パスワードを入力してください。現在のチャット履歴が上書きされることに注意してください",
      },
      UploadSucceed: "アップロード成功",
      DownloadSucceed: "ダウンロード成功",
      UploadFailed: "アップロード失敗",
      DownloadFailed: "ダウンロード失敗",
      EmptyPwd: "同期パスワードを入力してください",
      EmptyLogs: "同期記録はありません",
      Logs: "同期記録",

      Prompt: {
        Title: "長期記憶",
        SubTitle:
          "ロボットにあなたに関する情報を記憶させます。この記憶はローカルに保存したり、チャット履歴と一緒にアップロードしたりできます",
        Placeholder:
          "例：私はxxxで、xxxに住んでいて、xxxという名前の犬を飼っています",
        Required: "記憶内容を入力してください",
      },
      PromptActions: {
        Title: "記憶の管理",
        List: "管理",
        Edit: "記憶を編集",
        Add: "記憶を追加",
        Delete: "記憶を削除",
      },
    },
    Mask: {
      Splash: {
        Title: "アシスタントスプラッシュ画面",
        SubTitle:
          "新しいチャットを開始する際、アシスタントスプラッシュ画面を表示します",
      },
      Builtin: {
        Title: "内蔵アシスタントを非表示",
        SubTitle:
          "すべてのアシスタントリストから内蔵アシスタントを非表示にします",
      },
    },
    Prompt: {
      Disable: {
        Title: "プロンプトの自動補完を無効にする",
        SubTitle:
          "入力ボックスの先頭に / を入力すると自動補完がトリガーされます",
      },
      List: "カスタムプロンプトリスト",
      ListCount: (builtin: number, custom: number) =>
        `組み込み ${builtin} 件、ユーザー定義 ${custom} 件`,
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
      SubTitle: "リクエストごとに添付する履歴メッセージの数",
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
        SubTitle: "異なるプロバイダー間で切り替え",
      },
      OpenAI: {
        ApiKey: {
          Title: "APIキー",
          SubTitle: "カスタムOpenAIキーを使用してパスワードアクセス制限を回避",
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
          SubTitle: "カスタムAzureキーを使用してパスワードアクセス制限を回避",
          Placeholder: "Azure APIキー",
        },

        Endpoint: {
          Title: "エンドポイントアドレス",
          SubTitle: "例：",
        },

        ApiVerion: {
          Title: "APIバージョン（azure api version）",
          SubTitle: "指定のバージョンを選択",
        },
      },
      Anthropic: {
        ApiKey: {
          Title: "APIキー",
          SubTitle:
            "カスタムAnthropicキーを使用してパスワードアクセス制限を回避",
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
          Placeholder: "Google AI Studio APIキーを入力",
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

    Model: "モデル (model)",
    Temperature: {
      Title: "ランダム性 (temperature)",
      SubTitle: "値が大きいほど、回答がランダムになります",
    },
    TopP: {
      Title: "上位P (top_p)",
      SubTitle:
        "ランダム性と似ていますが、ランダム性と同時に変更しないでください",
    },
    MaxTokens: {
      Title: "単回応答制限 (max_tokens)",
      SubTitle: "1回のインタラクションで使用する最大トークン数",
    },
    PresencePenalty: {
      Title: "話題の新鮮さ (presence_penalty)",
      SubTitle: "値が大きいほど、新しい話題に展開する可能性が高くなります",
    },
    FrequencyPenalty: {
      Title: "頻度ペナルティ (frequency_penalty)",
      SubTitle: "値が大きいほど、重複する単語が減少する可能性が高くなります",
    },
  },
  Store: {
    DefaultTopic: "新しい会話",
    BotHello: "何かお手伝いできることはありますか",
    Error: "エラーが発生しました。後でもう一度お試しください",
    Prompt: {
      History: (content: string) =>
        "これは過去のチャットの要約として、前提条件として機能します：" +
        content,
      Topic:
        "4〜5文字で、この文の簡潔な主題を直接返してください。説明、句読点、感嘆詞、余分なテキストは不要です。主題がない場合は「雑談」と直接返してください。",
      Summarize: (type: string): string => {
        if (type === "medium") {
          return "対話の内容を、後続のコンテキストのプロンプトとして使用するために、800字以内で詳しく要約してください";
        } else if (type === "long") {
          return "詳細な要約を作成してください。すべての重要な詳細を保持し、後続のコンテキストのプロンプトとして使用するために、2000字以内に収めてください";
        } else {
          return "対話の内容を、後続のコンテキストのプロンプトとして使用するために、200字以内で簡潔に要約してください";
        }
      },
    },
  },
  Copy: {
    Success: "クリップボードに書き込みました",
    Failed: "コピーに失敗しました。クリップボード許可を与えてください。",
  },
  Download: {
    Success: "コンテンツがディレクトリにダウンロードされました。",
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
      DeleteConfirm: "削除してもよろしいですか？",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `プリセットアシスタントを編集 ${readonly ? "（読み取り専用）" : ""}`,
      Download: "プリセットをダウンロード",
      Clone: "プリセットをクローン",
    },
    Config: {
      Avatar: "アシスタントのアバター",
      Name: "アシスタントの名前",
      Sync: {
        Title: "グローバル設定を使用",
        SubTitle: "現在の会話でグローバルモデル設定を使用するかどうか",
        Confirm:
          "現在の会話のカスタム設定は自動的に上書きされます。グローバル設定を有効にしますか？",
      },
      HideContext: {
        Title: "プリセット会話を隠す",
        SubTitle:
          "隠すとプリセット会話がチャットインターフェースに表示されません",
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
    Skip: "スキップ",
    NotShow: "今後表示しない",
    ConfirmNoShow: "無効にしますか？設定からいつでも再度有効にできます。",
    Title: "アシスタントを選択",
    SubTitle: "アシスタントの背後にある魂との対話を始めましょう",
    More: "すべて表示",
  },
  URLCommand: {
    Code: "リンクにアクセスコードが含まれていることが検出されました。自動的に入力しますか？",
    Settings:
      "リンクに事前設定が含まれていることが検出されました。自動的に入力しますか？",
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
    Messages: "メッセージ",
    Source: "ソース",
    Topic: "トピック",
    Time: "時間",
    ModelName: "文心一言",
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
    Quality: "画質",
    ResponseFormat: "レスポンス形式",
    Size: "解像度",
    Style: "スタイル",
    RevisedPrompt: (prompt: string) => `**修正されたプロンプト:**\n${prompt}`,
    FetchImageError: "画像を取得できないか、OSSが設定されていません",
  },
  Config: {
    title: "チャットボット - 302.AI",
    GPTs: "アプリケーション",
    Chat: "チャット",
    description: (type: string = "AI") =>
      `ワンクリックで自分専用の${type}ボットを生成`,
    AppDescTitle: "説明",
    AppDescSubTitle: "チャットボットの詳細プレビュー",
    AppDescContent: "",
  },
};
export default jp;
