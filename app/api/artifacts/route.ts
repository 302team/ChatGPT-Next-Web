import md5 from "spark-md5";
import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";
import { dataURLtoFile } from "../utils";

// async function handle(req: NextRequest, res: NextResponse) {
//   const serverConfig = getServerSideConfig();
//   const storeUrl = () =>
//     `https://api.cloudflare.com/client/v4/accounts/${serverConfig.cloudflareAccountId}/storage/kv/namespaces/${serverConfig.cloudflareKVNamespaceId}`;
//   const storeHeaders = () => ({
//     Authorization: `Bearer ${serverConfig.cloudflareKVApiKey}`,
//   });
//   if (req.method === "POST") {
//     const clonedBody = await req.text();
//     const hashedCode = md5.hash(clonedBody).trim();
//     const body: {
//       key: string;
//       value: string;
//       expiration_ttl?: number;
//     } = {
//       key: hashedCode,
//       value: clonedBody,
//     };
//     try {
//       const ttl = parseInt(serverConfig.cloudflareKVTTL as string);
//       if (ttl > 60) {
//         body["expiration_ttl"] = ttl;
//       }
//     } catch (e) {
//       console.error(e);
//     }
//     const res = await fetch(`${storeUrl()}/bulk`, {
//       headers: {
//         ...storeHeaders(),
//         "Content-Type": "application/json",
//       },
//       method: "PUT",
//       body: JSON.stringify([body]),
//     });
//     const result = await res.json();
//     console.log("save data", result);
//     if (result?.success) {
//       return NextResponse.json(
//         { code: 0, id: hashedCode, result },
//         { status: res.status },
//       );
//     }
//     return NextResponse.json(
//       { error: true, msg: "Save data error" },
//       { status: 400 },
//     );
//   }
//   if (req.method === "GET") {
//     const id = req?.nextUrl?.searchParams?.get("id");
//     const res = await fetch(`${storeUrl()}/values/${id}`, {
//       headers: storeHeaders(),
//       method: "GET",
//     });
//     return new Response(res.body, {
//       status: res.status,
//       statusText: res.statusText,
//       headers: res.headers,
//     });
//   }
//   return NextResponse.json(
//     { error: true, msg: "Invalid request" },
//     { status: 400 },
//   );
// }

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
    const result = await fetch(`https://file.302.ai/gpt/imgs/${id}`, {
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
