import { Tool } from "@langchain/core/tools";

interface ModelConfig {
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string;
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
}

interface MultimodalContent {
  type: "text" | "image_url" | "file";
  text?: string;
  image_url?: {
    url: string;
  };
  file?: {
    url: string;
    type: string;
    name: string;
  };
}

interface GML_4v_Parameters extends ModelConfig {
  model: string;
  messages: {
    role: "user" | "assistant" | string;
    content: string | MultimodalContent;
  };
}

export class Glm4v extends Tool {
  static lc_name() {
    return "Glm4v";
  }

  protected apiKey: string;

  protected params: Partial<GML_4v_Parameters>;

  constructor(apiKey: string, params: Partial<GML_4v_Parameters> = {}) {
    super(...arguments);

    if (!apiKey) {
      throw new Error(
        "SearchApi requires an API key. Please set it as SEARCHAPI_API_KEY in your .env file, or pass it as a parameter to the SearchApi constructor.",
      );
    }

    this.apiKey = apiKey;
    this.params = params;
  }

  name = "glm-4v";

  /**
   * Builds a URL for the GLM-4v request.
   * @param parameters The parameters for the request.
   * @returns A string representing the built URL.
   */
  protected buildUrl(searchQuery: string): string {
    const preparedParams: [string, string][] = Object.entries({
      engine: "google",
      api_key: this.apiKey,
      ...this.params,
      q: searchQuery,
    })
      .filter(
        ([key, value]) =>
          value !== undefined && value !== null && key !== "apiKey",
      )
      .map(([key, value]) => [key, `${value}`]);

    const searchParams = new URLSearchParams(preparedParams);
    return `https://api.gpt302.com/searchapi/search?${searchParams}`;
  }

  /** @ignore */
  async _call(input: string) {
    const resp = await fetch(this.buildUrl(input));

    const json = await resp.json();

    if (json.error) {
      throw new Error(
        `Failed to load results from GLM-4v due to: ${json.error}`,
      );
    }
    // TODO: 功能待实现
    //
    //
    //
    //
    //
    //
    // TODO:

    return "No good search result found";
  }

  description =
    "a search engine. useful for when you need to answer questions about current events. input should be a search query.";
}
