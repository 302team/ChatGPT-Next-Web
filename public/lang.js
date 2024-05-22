try {
  let hash = window.location.hash;
  if (hash.includes("lang=")) {
    const query = hash.split("?").pop();
    const langRecord = query?.split("&").find((q) => q.includes("lang"));
    if (langRecord) {
      const lang = langRecord.split("=")[1];
      console.log("🚀 ~ lang:", lang);
      localStorage.setItem("lang", lang === "zh-CN" ? "cn" : "en");
    }
  }
} catch (error) {}
