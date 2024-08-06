import { BaseLanguageModel } from "langchain/dist/base_language";
import { PDFBrowser } from "@/app/api/langchain-tools/pdf_browser";
import { Embeddings } from "langchain/dist/embeddings/base.js";
import { ArxivAPIWrapper } from "@/app/api/langchain-tools/arxiv";
import { DallEAPINodeWrapper } from "@/app/api/langchain-tools/dalle_image_generator_node";
import { StableDiffusionNodeWrapper } from "@/app/api/langchain-tools/stable_diffusion_image_generator_node";
import { Calculator } from "langchain/tools/calculator";
import { WebBrowser } from "langchain/tools/webbrowser";
import { WolframAlphaTool } from "@/app/api/langchain-tools/wolframalpha";
// import { Glm4vWrapper } from "@/app/api/langchain-tools/glm_4v";
import { GPT4vWrapper } from "./image-recognition";
import { CodeInterpreterTool } from "./code_interpreter";

export class NodeJSTool {
  private apiKey: string | undefined;

  private baseUrl: string;

  private model: BaseLanguageModel;

  private embeddings: Embeddings;

  private callback?: (data: string) => Promise<void>;

  private modelName?: string;

  private multimodalType4Models?: Record<string, number>;

  constructor(
    apiKey: string | undefined,
    baseUrl: string,
    model: BaseLanguageModel,
    embeddings: Embeddings,
    callback?: (data: string) => Promise<void>,
    modelName?: string,
    multimodalType4Models?: Record<string, number>,
  ) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.model = model;
    this.embeddings = embeddings;
    this.callback = callback;

    this.modelName = modelName;
    this.multimodalType4Models = multimodalType4Models;
  }

  async getCustomTools(): Promise<any[]> {
    const webBrowserTool = new WebBrowser({
      model: this.model,
      embeddings: this.embeddings,
    });
    const calculatorTool = new Calculator();
    const dallEAPITool = new DallEAPINodeWrapper(
      this.apiKey,
      this.baseUrl,
      this.callback,
    );
    const stableDiffusionTool = new StableDiffusionNodeWrapper();
    const arxivAPITool = new ArxivAPIWrapper();
    const wolframAlphaTool = new WolframAlphaTool();
    const pdfBrowserTool = new PDFBrowser(this.model, this.embeddings);

    // const glm4vTool = new Glm4vWrapper(this.apiKey!, this.baseUrl);
    const gpt4vTool = new GPT4vWrapper(
      this.apiKey!,
      this.baseUrl,
      this.modelName,
      this.multimodalType4Models,
    );

    const codeInterpreterTool = new CodeInterpreterTool(this.apiKey!);

    let tools = [
      calculatorTool,
      webBrowserTool,
      dallEAPITool,
      stableDiffusionTool,
      arxivAPITool,
      wolframAlphaTool,
      pdfBrowserTool,

      gpt4vTool,
      codeInterpreterTool,
    ];
    return tools;
  }
}
