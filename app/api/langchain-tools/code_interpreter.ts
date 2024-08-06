import { StructuredTool } from "@langchain/core/tools";
import { getServerSideConfig } from "@/app/config/server";
import { z } from "zod";

export class CodeInterpreterTool extends StructuredTool {
  name = "code-interpreter";
  description = `The Code Interpreter is a tool designed to execute code. Input is code snippets in python or nodeJS, output is the execution results or output.`;

  apiKey: string;

  constructor(apiKey: string) {
    super();

    if (!apiKey) {
      throw new Error(
        "Code-Interpreter requires an API key. Please set it as API_KEY in your .env file, or pass it as a parameter to the CodeInterpreterTool constructor.",
      );
    }

    this.apiKey = apiKey;
  }

  schema = z.object({
    language: z
      .enum(["python3", "nodejs"])
      .describe("code language, one of 'python3' or 'nodejs'"),
    code: z.string().describe("code string"),
  });

  async _call(input: z.infer<typeof this.schema>) {
    if (!["python3", "nodejs"].includes(input.language)) {
      throw new Error(
        `The language ${input.language} is not currently supported`,
      );
    }

    const serverConfig = getServerSideConfig();
    const url = `${serverConfig.apiDomain}/api/run/code`;

    const storeHeaders = () => ({
      Authorizations: `Bearer ${this.apiKey}`,
    });

    let result = "";
    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(input),
        headers: {
          "content-type": "application/json",
          ...storeHeaders(),
        },
      });

      if (response.status === 200) {
        const resJson = await response.json();
        if (resJson.code === 0) {
          const error = resJson.data.error;
          const stdout = resJson.data.stdout;
          result = error ? error : stdout;
        }
      } else {
        throw new Error(`Failed to run code-interpreter: ${response}`);
      }
    } catch (error) {
      throw new Error(`Failed to run code-interpreter: ${error}`);
    }

    return result;
  }
}
