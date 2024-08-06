import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "@/app/config/server";
import { auth } from "@/app/api/auth";
import { ModelProvider } from "@/app/constant";

async function handle(req: NextRequest, res: NextResponse) {
  const authResult = auth(req, ModelProvider.GPT);
  if (authResult.error) {
    return NextResponse.json(authResult, {
      status: 401,
    });
  }

  const serverConfig = getServerSideConfig();
  const url = `${serverConfig.apiDomain}/api/run/code`;

  const authToken = req.headers.get("Authorization") ?? "";

  const storeHeaders = () => ({
    Authorizations: authToken,
  });

  if (req.method === "POST") {
    try {
      const result = await fetch(url, {
        method: "POST",
        body: req.body,
        headers: {
          "content-type": "application/json",
          ...storeHeaders(),
        },
      });

      if (result.status === 200) {
        const resJson = await result.json();
        return NextResponse.json(
          {
            ...resJson.data,
          },
          { status: result.status },
        );
      } else {
        return NextResponse.json(result, { status: result.status });
      }
    } catch (error) {
      return NextResponse.json(
        {
          msg: "Internal Server Error",
          error,
        },
        { status: 501 },
      );
    }
  }

  return NextResponse.json(
    { error: true, msg: "Invalid request" },
    { status: 400 },
  );
}

export const POST = handle;
export const GET = handle;

export const runtime = "edge";
