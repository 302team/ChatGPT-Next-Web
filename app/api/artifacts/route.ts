import md5 from "spark-md5";
import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";

async function handle(req: NextRequest, res: NextResponse) {
  const serverConfig = getServerSideConfig();
  const storeUrl = `${serverConfig.apiDomain}/gpt/api/upload/gpts/image`;

  const storeHeaders = () => ({
    Authorization: `Bearer ${serverConfig.apiKey}`,
  });

  if (req.method === "POST") {
    const clonedBody = await req.clone().text();
    const hashedCode = md5.hash(clonedBody).trim();

    const blob = new Blob([clonedBody]);
    const file = new File([blob], hashedCode);
    const formData = new FormData();
    formData.append("file", file);

    const result = await fetch(storeUrl, {
      method: "POST",
      body: formData,
    }).then((res) => res.json());

    console.log("save data", result);
    if (result.code === 0) {
      return NextResponse.json(
        { code: 0, id: hashedCode },
        { status: res.status },
      );
    } else {
      return NextResponse.json(
        { error: true, msg: "Save data error" },
        { status: 400 },
      );
    }
  }

  if (req.method === "GET") {
    const id = req?.nextUrl?.searchParams?.get("id");
    const result = await fetch(`https://file.302ai.cn/gpt/imgs/${id}`, {
      method: "GET",
    });
    console.log("🚀 ~ handle ~ res:", id, res);

    return new Response(result.body, {
      status: result.status,
      statusText: result.statusText,
      headers: result.headers,
    });
  }
  return NextResponse.json(
    { error: true, msg: "Invalid request" },
    { status: 400 },
  );
}

export const POST = handle;
export const GET = handle;

export const runtime = "edge";
