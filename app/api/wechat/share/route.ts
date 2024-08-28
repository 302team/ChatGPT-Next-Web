import { getServerSideConfig } from "@/app/config/server";
import { NextRequest } from "next/server";

async function handle(req: NextRequest) {
  // const authValue = req.headers.get("Authorization")?.trim() ?? "";

  // if (!authValue) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  const serverConfig = getServerSideConfig();
  const url = `${serverConfig.apiDomain}/gpt/api/wechat/share/card`;

  const paramUrl = req.nextUrl.searchParams.get("url") ?? "";
  console.log("🚀 ~ handle ~ paramUrl:", paramUrl);

  try {
    const result = await fetch(`${url}?url=${encodeURIComponent(paramUrl)}`, {
      headers: {
        // Authorization: authValue,
      },
    });

    if (result.status !== 200) {
      throw new Error(await result.text());
    }

    const resJson = await result.clone().json();

    if (resJson.code !== 0) {
      throw new Error(resJson.message);
    }

    return new Response(
      JSON.stringify({
        code: 0,
        data: resJson.data?.result ?? "",
      }),
      {
        status: 200,
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        code: -1,
        message: (error as Error).message,
      }),
      {
        status: 500,
      },
    );
  }
}

export const GET = handle;
export const POST = handle;
