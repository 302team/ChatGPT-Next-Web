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
  WIP: "この機能は開発中です",
  Error: {
    Unauthorized: (region = 0) =>
      `[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のボットを作成してください`,
    ApiTimeout: "リクエストに失敗しました。もう一度お試しください",
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
      `このボットはデモ展示用です。<a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a>にアクセスして、あなた自身のボットを作成してください`,
    Title: "共有コードを入力",
    Tips: "作成者が認証を有効にしています。以下に共有コードを入力してください",
    SubTips: "または、OpenAIやGoogle APIキーを入力してください",
    Input: "共有コードを入力してください",
    Remember: "共有コードを記憶する",
    ValidError: "共有コードが無効です。もう一度お試しください",
    Confirm: "確認",
    Later: "後で",
    CAPTCHA_ERROR: "共有コードが無効です。もう一度お試しください",
    CHATBOT_DISABLED_ERROR: (region = 0) =>
      `ボットが無効化されています。詳細は <a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a> をご覧ください`,
    CHATBOT_DELETE_ERROR: (region = 0) =>
      `ボットが削除されました。詳細は <a target="_blank" href="${getLink(region).homeLink}">${getLink(region).homeText}</a> をご覧ください`,
    SERVER_ERROR:
      "内部エラーが発生しました。カスタマーサポートにお問い合わせください",
    BALANCE_LIMIT_ERROR: "アカウント残高が不足しています。チャージしてください",
    TOKEN_EXPIRED_ERROR:
      "トークンの有効期限が切れました。再度ログインしてください",
    CHATBOT_DISABLED_ERROR2: (region = 0) =>
      `ボットが無効化されています。詳細は[${getLink(region).homeText}](${getLink(region).homeLink})をご覧ください`,
    TOTAL_QUOTA_ERROR: (region = 0) =>
      `ボットの総利用枠に達しました。[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のボットを作成してください`,
    DAILY_QUOTA_ERROR: (region = 0) =>
      `ボットの1日の利用枠に達しました。[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のボットを作成してください`,
    HOUR_QUOTA_ERROR: (region = 0) =>
      `この無料ツールは現在の1時間の利用枠に達しました。[${getLink(region).homeText}](${getLink(region).homeLink})にアクセスして、あなた自身のツールを生成してください`,
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
    ChatItemCount: (count: number) => `${count} 通のチャット`,
  },
  Chat: {
    SubTitle: (count: number) => `合計 ${count} 件の会話`,
    EditMessage: {
      Title: "メッセージ記録を編集",
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
      new: "新しいチャットを作成",
      newm: "アシスタントから新しいチャットを作成",
      next: "次のチャット",
      prev: "前のチャット",
      clear: "コンテキストをクリア",
      del: "チャットを削除",
    },
    InputActions: {
      Stop: "応答を停止",
      ToBottom: "最新にスクロール",
      Theme: {
        auto: "自動テーマ",
        light: "ライトモード",
        dark: "ダークモード",
      },
      Prompt: "クイックコマンド",
      Masks: "すべてのアシスタント",
      Clear: "チャットをクリア",
      Settings: "会話設定",
      UploadImage: "画像をアップロード",
      Waiting: "お待ちください...",
      Translate: "翻訳",
      InputTips: "内容を入力してください！",
      TranslateTo: (target: string = navigator.language) =>
        `ユーザー入力の内容が ${target} かどうかを検出し、そうでない場合は ${target} に翻訳してください。句読点も変換してください。注意：翻訳結果のみを出力し、他のプロンプトは不要です。`,
      TranslateError: "翻訳エラー！",
    },
    Rename: "会話の名前を変更",
    Typing: "入力中…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} 送信`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "、Shift + Enter で改行";
      }
      return "メッセージを送信"; // inputHints + "、/ で補完をトリガー、: でコマンドをトリガー";
    },
    Send: "送信",
    Config: {
      Reset: "メモリをクリア",
      SaveAs: "アシスタントとして保存",
    },
    IsContext: "プリセットプロンプト",
    Speech: {
      Voice: "音声",
      ResponseFormat: "返信データ形式",
      Speed: "速度",
      FetchAudioError:
        "音声ファイルの取得エラー。インターフェースまたはOSS設定を確認してください",
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
    Tips: "AIは間違える可能性があります。重要な情報は確認してください。",
    Upload: {
      Limit: (size: string) => {
        return `ファイルは${size}を超えることはできません`;
      },
    },
  },
  Export: {
    Title: "チャット履歴を共有",
    Copy: "コピー",
    Download: "ダウンロード",
    Share: "リンクを共有",
    MessageFromYou: "ユーザー",
    MessageFromChatGPT: "ChatGPT",
    Format: {
      Title: "エクスポート形式",
      SubTitle: "MarkdownテキストまたはPNG画像としてエクスポートできます",
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
    ShareMessage: (pwd?: string, isGpts?: string, modelName?: string) => {
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
    Search: "検索",
    All: "すべて選択",
    Latest: "新しいメッセージを選択",
    Clear: "クリア",
  },
  Memory: {
    Title: "履歴メモリ",
    EmptyContent: "まだ記憶されていません",
    Send: "メモリを送信",
    Copy: "メモリをコピー",
    Reset: "チャットをリセット",
    ResetConfirm:
      "リセット後、現在のチャット履歴と過去のメモリがクリアされます。リセットしてもよろしいですか？",
  },
  Home: {
    NewChat: "新しいチャット",
    DeleteChat: "選択したチャットを削除してもよろしいですか？",
    DeleteToast: "チャットが削除されました",
    Revert: "元に戻す",
  },
  Settings: {
    Title: "設定",
    SubTitle: "設定オプション",
    Danger: {
      Reset: {
        Title: "設定をリセット",
        SubTitle: "すべての設定項目をデフォルトにリセットします",
        Action: "今すぐリセットする",
        Confirm: "すべての設定項目をリセットしてもよろしいですか？",
      },
      Clear: {
        Title: "データを消去",
        SubTitle: "すべてのチャット履歴と設定を消去します",
        Action: "今すぐ消去する",
        Confirm: "すべてのチャット履歴と設定を消去しますか？",
      },
    },
    Lang: {
      Name: "Language", // ATTENTION: if you wanna add a new translation, please do not translate this value, leave it as `Language`
      All: "全ての言語",
    },
    Avatar: "アバター",
    FontSize: {
      Title: "フォントサイズ",
      SubTitle: "チャット内容のフォントサイズ",
    },
    InjectSystemPrompts: {
      Title: "システムプロンプトの挿入",
      SubTitle:
        "各リクエストのメッセージリストの先頭に、ChatGPTのシステムプロンプトを強制的に追加します",
    },
    InputTemplate: {
      Title: "入力の前処理",
      SubTitle: "新規入力がこのテンプレートに埋め込まれます",
    },
    Update: {
      Version: (x: string) => `現在のバージョン：${x}`,
      IsLatest: "最新バージョンです",
      CheckUpdate: "アップデートを確認",
      IsChecking: "アップデートを確認しています...",
      FoundUpdate: (x: string) => `新しいバージョンが見つかりました：${x}`,
      GoToUpdate: "更新する",
    },
    SendKey: "送信キー",
    Theme: "テーマ",
    TightBorder: "ボーダーレスモード",
    SendPreviewBubble: {
      Title: "プレビューバブルの送信",
      SubTitle: "プレビューバブルでマークダウンコンテンツをプレビュー",
    },
    Mask: {
      Splash: {
        Title: "キャラクターページ",
        SubTitle: "新規チャット作成時にキャラクターページを表示する",
      },
      Builtin: {
        Title: "ビルトインマスクを非表示",
        SubTitle: "マスクリストからビルトインを非表示する",
      },
    },
    Prompt: {
      Disable: {
        Title: "プロンプトの自動補完を無効にする",
        SubTitle:
          "入力フィールドの先頭に / を入力すると、自動補完がトリガーされます。",
      },
      List: "カスタムプロンプトリスト",
      ListCount: (builtin: number, custom: number) =>
        `組み込み ${builtin} 件、ユーザー定義 ${custom} 件`,
      Edit: "編集",
      Modal: {
        Title: "プロンプトリスト",
        Add: "新規追加",
        Search: "プロンプトワード検索",
      },
      EditModal: {
        Title: "編集",
      },
    },
    HistoryCount: {
      Title: "履歴メッセージ数を添付",
      SubTitle: "リクエストごとに添付する履歴メッセージ数",
    },
    CompressThreshold: {
      Title: "履歴メッセージの長さ圧縮しきい値",
      SubTitle:
        "圧縮されていない履歴メッセージがこの値を超えた場合、圧縮が行われます。",
    },

    Usage: {
      Title: "残高照会",
      SubTitle(used: any, total: any) {
        return `今月は $${used} を使用しました。総額は $${total} です。`;
      },
      IsChecking: "確認中...",
      Check: "再確認",
      NoAccess: "APIキーまたはアクセスパスワードを入力して残高を表示",
    },
    Model: "モデル (model)",
    Temperature: {
      Title: "ランダム性 (temperature)",
      SubTitle:
        "値が大きいほど、回答がランダムになります。1以上の値には文字化けが含まれる可能性があります。",
    },
    MaxTokens: {
      Title: "シングルレスポンス制限 (max_tokens)",
      SubTitle: "1回のインタラクションで使用される最大トークン数",
    },
    PresencePenalty: {
      Title: "トピックの新鮮度 (presence_penalty)",
      SubTitle: "値が大きいほど、新しいトピックへの展開が可能になります。",
    },
    FrequencyPenalty: {
      Title: "話題の頻度 (frequency_penalty)",
      SubTitle: "値が大きいほど、重複語を低減する可能性が高くなります",
    },
    AutoGenerateTitle: {
      Title: "タイトルの自動生成",
      SubTitle: "会話内容に基づいて適切なタイトルを生成する",
    },
  },
  Store: {
    DefaultTopic: "新しいチャット",
    BotHello: "何かお手伝いできることはありますか",
    Error: "エラーが発生しました。しばらくしてからやり直してください。",
    Prompt: {
      History: (content: string) =>
        "これは過去の会話の要約として前提となる情報です：" + content,
      Topic:
        "四から五文字で直接この文の簡潔な主題を返してください。説明、句読点、感嘆詞、余分なテキストは不要で、太字にしないでください。主題がない場合は「雑談」と直接返してください",
      Summarize: (type: string): string => {
        if (type === "medium") {
          return "会話の内容を詳しく要約し、後続の文脈プロンプトとして使用してください。800字以内に収めてください";
        } else if (type === "long") {
          return "会話の内容を詳しく要約し、細部を見逃さないようにしてください。後続の文脈プロンプトとして使用し、2000字以内に収めてください";
        } else {
          return "会話の内容を簡潔に要約し、後続の文脈プロンプトとして使用してください。200字以内に収めてください";
        }
      },
    },
  },
  Copy: {
    Success: "クリップボードに書き込みました",
    Failed: "コピーに失敗しました。クリップボード許可を与えてください。",
  },
  Download: {
    Success: "コンテンツはあなたのディレクトリにダウンロードされました。",
    Failed: "ダウンロードに失敗しました。",
  },
  Context: {
    Toast: (x: any) => `${x} 個のプリセットプロンプトを含む`,
    Edit: "現在の会話設定",
    Add: "新しい会話を追加",
    Clear: "コンテキストがクリアされました",
    Revert: "コンテキストを復元",
  },
  Plugin: { Name: "プラグイン" },
  FineTuned: { Sysmessage: "あなたはアシスタントです" },
  Mask: {
    Name: "キャラクタープリセット",
    Page: {
      Title: "キャラクタープリセット",
      SubTitle: (count: number) => `${count} 件見つかりました。`,
      Search: "検索",
      Create: "新規",
    },
    Item: {
      Info: (count: number) => `包含 ${count} 条预设对话`,
      Chat: "会話",
      View: "詳細",
      Edit: "編集",
      Delete: "削除",
      DeleteConfirm: "本当に削除しますか？",
    },
    EditModal: {
      Title: (readonly: boolean) =>
        `キャラクタープリセットを編集 ${readonly ? "（読み取り専用）" : ""}`,
      Download: "ダウンロード",
      Clone: "複製",
    },
    Config: {
      Avatar: "キャラクターのアイコン",
      Name: "キャラクターの名前",
      Sync: {
        Title: "グローバル設定を利用する",
        SubTitle: "このチャットでグローバル設定を利用します。",
        Confirm:
          "カスタム設定を上書きしてグローバル設定を使用します、よろしいですか？",
      },
      HideContext: {
        Title: "キャラクター設定を表示しない",
        SubTitle: "チャット画面でのキャラクター設定を非表示にします。",
      },
    },
  },
  NewChat: {
    Return: "戻る",
    Skip: "スキップ",
    Title: "キャラクター",
    SubTitle: "さあ、AIにキャラクターを設定して会話を始めてみましょう",
    More: "もっと探す",
    NotShow: "今後は表示しない",
    ConfirmNoShow: "いつでも設定から有効化できます。",
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
    Num: "生成画像の数",
    Quality: "画像品質",
    ResponseFormat: "返却データ形式",
    Size: "解像度",
    Style: "スタイル",
    RevisedPrompt: (prompt: string) => `**修正後のプロンプト:**\n${prompt}`,
    FetchImageError: "画像を取得できないか、OSSが設定されていません",
  },
  Config: {
    title: "チャットボット - 302.AI",
    GPTs: "アプリケーション",
    description: (type: string = "AI") =>
      `ワンクリックで自分専用の${type}ボットを生成`,
    AppDescTitle: "説明",
    AppDescSubTitle: "チャットボットの詳細プレビュー",
    AppDescContent: "",
  },
};

export default jp;
