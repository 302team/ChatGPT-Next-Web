// 参考：<https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html>
import wx from "weixin-js-sdk";
import { ApiPath } from "../constant";
import Locale, { getLang, langCodeMap } from "../locales";
import { useAccessStore, useAppConfig } from "../store";

/**
 * 通过config接口注入权限验证配置
 * 请在前端页面调用
 * @param {Object} params.url - 当前网页的URL，注意必须是绝对路径
 */
const getSignature = async (url: string) => {
  let data = null;
  let n = 0;
  do {
    const response = await fetch(
      `${ApiPath.WechatShare}?url=${encodeURIComponent(url)}`,
    );
    const resJson = await response.json();
    data = resJson.data;
  } while (!data && n++ < 3);

  if (data) {
    return data;
  }

  throw new Error("获取微信签名失败");
};

export const shareApp = (params: wx.IupdateAppMessageShareData) => {
  const { title, desc, link, imgUrl } = params;
  // 自定义“分享给朋友”及“分享到QQ”按钮的分享内容
  wx.updateAppMessageShareData({
    title, // 分享标题
    desc, // 分享描述
    link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
    imgUrl, // 分享图标
    success: function () {
      // 设置成功
      console.log("分享给朋友配置成功");
    },
  });

  // 自定义“分享给朋友”及“分享到QQ”按钮的分享内容
  wx.updateTimelineShareData({
    title, // 分享标题
    link, // 分享链接，该链接域名或路径必须与当前页面对应的公众号JS安全域名一致
    imgUrl, // 分享图标
    success: function () {
      // 设置成功
      console.log("分享朋友圈配置成功");
    },
  });

  // 获取“分享到腾讯微博”按钮点击状态及自定义分享内容接口
  wx.onMenuShareWeibo({
    title, // 分享标题
    desc, // 分享描述
    link, // 分享链接
    imgUrl, // 分享图标
    success: function () {
      // 用户确认分享后执行的回调函数
      console.log("分享到腾讯微博成功");
    },
    cancel: function () {
      // 用户取消分享后执行的回调函数
      console.log("取消分享到腾讯微博");
    },
  });
};

const wxConfig = async (params: any) => {
  const { appId, timestamp, nonceStr, signature, jsApiList, onReady, onError } =
    params;
  wx.config({
    debug: location.href.includes("debug=wxdebug"), // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
    appId, // 必填，公众号的唯一标识
    timestamp, // 必填，生成签名的时间戳
    nonceStr, // 必填，生成签名的随机串
    signature, // 必填，签名
    jsApiList: jsApiList, // 必填，需要使用的JS接口列表，具体可以查看JS接口列表：<https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/JS-SDK.html#63>
  });
  // 通过ready接口处理成功验证
  wx.ready(function () {
    // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
    console.log("wx ready");
    onReady && onReady();
  });

  // 通过error接口处理失败验证
  wx.error(function (error) {
    // config信息验证失败会执行error函数，如签名过期导致验证失败，具体错误信息可以打开config的debug模式查看，也可以在返回的res参数中查看，对于SPA可以在这里更新签名。
    console.error("wx error", error);
    onError && onError(error);
  });
};

/**
 * 微信Api初始化
 * 请在需要分享的前端页面调用
 * @param {Object} params.url -需要分享的前端页面
 */
export const wxShareInit = async (params: {
  url: string;
  title?: string;
  desc?: string;
  imgUrl?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}) => {
  const data = await getSignature(params.url); // 后端提供的获取签名api，具体实现可以看上面的”获取签名信息参考代码”小节

  const { appId, timestamp, nonceStr, signature } = data;
  wxConfig({
    appId,
    timestamp,
    nonceStr,
    signature,
    jsApiList: [
      // 分享需要用到以下几个接口
      "updateAppMessageShareData", // 自定义“分享给朋友”及“分享到QQ”按钮的分享内容
      "updateTimelineShareData", // 自定义“分享给朋友”及“分享到QQ”按钮的分享内容
      "updateTimelineShareData", // 获取“分享到腾讯微博”按钮点击状态及自定义分享内容接口
    ],
    onReady: () => {
      console.log("初始化成功");
      params.onSuccess?.();

      shareApp({
        title: params.title ?? Locale.Config.title,
        desc: params.desc ?? Locale.Config.description(),
        link: handlerUrl(params.url),
        imgUrl:
          params.imgUrl ??
          "https://file.302ai.cn/gpt/imgs/20240827/c2afd19a90b641f7ad997015cdd466c6.png",
        success: () => {},
      }); // 分享配置
    },
    onError: (error: any) => {
      console.log("初始化失败", error);
    },
  });
};

const handlerUrl = (url: string) => {
  const accessStore = useAccessStore.getState();
  const configStore = useAppConfig.getState();
  const langCode = getLang();

  const lang = Object.entries(langCodeMap).find(([key, value]) => {
    return value === langCode;
  });

  let query = url.includes("?") ? `&` : `?`;

  query += `region=${configStore.region}&confirm=true&lang=${lang?.at(0)}&pwd=${accessStore.pwd}`;

  return `${url}${query}`;
};
