import { NextRequest } from "next/server";
import Decimal from "decimal.js";
import { getEncoding } from "js-tiktoken";
import { getServerSideConfig } from "@/app/config/server";

interface ModelPrice {
  input: number;
  output: number;
}

function getCost(
  role: "user" | "assistant",
  token: number,
  modelPrice: ModelPrice,
) {
  if (role === "user") {
    return new Decimal(token * modelPrice.input).toNumber();
  } else if (role === "assistant") {
    return new Decimal(token * modelPrice.output).toNumber();
  } else {
    return 0;
  }
}

async function handle(req: NextRequest) {
  const serverConfig = getServerSideConfig();
  const json = await req.clone().json();

  const url = `${serverConfig.apiDomain}/gpt/api/model/price`;

  if (!json || !json.message) {
    return new Response("Bad Request", { status: 400 });
  }

  try {
    const result = await fetch(`${url}?model_name=${json.model}`, {
      headers: {
        Authorization: `Bearer ${serverConfig.apiKey}`,
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
        data: resJson.data,
      }),
      {
        status: 200,
      },
    );

    // const enc = getEncoding("cl100k_base");
    // const tokens = enc.encode(json.message);

    // return new Response(
    //   JSON.stringify({
    //     code: 0,
    //     data: {
    //       tokens,
    //       cost: getCost(json.role, tokens.length, resJson.data),
    //     },
    //   }),
    //   {
    //     status: 200,
    //   },
    // );
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

export const POST = handle;
export const GET = handle;

export const runtime = "edge";
