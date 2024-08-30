const langCodeMap = {
  "zh-CN": "cn",
  "en-US": "en",
  "pt-BR": "pt",
  "zh-TW": "tw",
  "ja-JP": "jp",
  "ko-KR": "ko",
  "id-ID": "id",
  "fr-FR": "fr",
  "es-ES": "es",
  "it-IT": "it",
  "tr-TR": "tr",
  "de-DE": "de",
  "vi-VN": "vi",
  "ru-RU": "ru",
  "cs-CZ": "cs",
  "no-NO": "no",
  "ar-SA": "ar",
  "bn-BD": "bn",
  "sk-SK": "sk",
};

try {
  let hash = window.location.hash;
  if (hash.includes("lang=")) {
    const query = hash.split("?").pop();
    const langRecord = query?.split("&").find((q) => q.includes("lang"));
    if (langRecord) {
      const lang = langRecord.split("=")[1];
      console.log("🚀 ~ [search params] lang:", lang);
      localStorage.setItem("lang", langCodeMap[lang] ?? "en");
    }
  }
} catch (error) {}
