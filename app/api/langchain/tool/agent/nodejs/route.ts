import { NextRequest, NextResponse } from "next/server";
import { AgentApi, RequestBody, ResponseBody } from "../agentapi";
import { auth } from "@/app/api/auth";
import { NodeJSTool } from "@/app/api/langchain-tools/nodejs_tools";
import { ModelProvider } from "@/app/constant";
import { OpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Textract } from "@/app/api/utils";

async function handle(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return NextResponse.json({ body: "OK" }, { status: 200 });
  }
  try {
    const authResult = auth(req, ModelProvider.GPT);
    if (authResult.error) {
      return NextResponse.json(authResult, {
        status: 401,
      });
    }

    const encoder = new TextEncoder();
    const transformStream = new TransformStream();
    const writer = transformStream.writable.getWriter();
    const controller = new AbortController();
    const agentApi = new AgentApi(encoder, transformStream, writer, controller);

    const authToken = req.headers.get("Authorization") ?? "";
    const token = authToken.trim().replaceAll("Bearer ", "").trim();

    let reqBody: RequestBody;

    try {
      reqBody = await Textract.create(token).parsePrompt4Tools(
        await req.json(),
      );
    } catch (error) {
      return NextResponse.json(
        {
          error: error,
          message: `对不起，我无法打开这个文件`,
        },
        {
          status: 200,
        },
      );
    }

    const apiKey = await agentApi.getOpenAIApiKey(token);
    const baseUrl = await agentApi.getOpenAIBaseUrl(reqBody.baseUrl);

    const model = new OpenAI(
      {
        temperature: 0,
        modelName: reqBody.model,
        openAIApiKey: apiKey,
      },
      { basePath: baseUrl },
    );
    const embeddings = new OpenAIEmbeddings(
      {
        openAIApiKey: apiKey,
      },
      { basePath: baseUrl },
    );

    var dalleCallback = async (data: string) => {
      console.log("🚀 ~ dalleCallback ~ data:", data);
      var response = new ResponseBody();
      response.message = data;
      await writer.ready;
      await writer.write(
        encoder.encode(`data: ${JSON.stringify(response)}\n\n`),
      );
      controller.abort({
        reason: "dall-e tool abort",
      });
    };

    var nodejsTool = new NodeJSTool(
      apiKey,
      baseUrl,
      model,
      embeddings,
      dalleCallback,
    );
    var nodejsTools = await nodejsTool.getCustomTools();
    var tools = [...nodejsTools];
    return await agentApi.getApiHandler(req, reqBody, tools);
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as any).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export const GET = handle;
export const POST = handle;

export const runtime = "nodejs";
