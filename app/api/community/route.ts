import { getServerSideConfig } from "@/app/config/server";
import { NextRequest } from "next/server";

async function handler(req: NextRequest) {
  const serverConfig = getServerSideConfig();

  const response = await fetch("/community-prompts.json", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serverConfig.apiKey}`,
    },
  }).then((res) => res.json());

  return new Response(JSON.stringify(response));
}

export const GET = handler;
export const POST = handler;
