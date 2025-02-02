import OpenAI from "openai";
import {
  CompletionMessageToolCall,
  IContentProcessor,
  IToolResultMessage,
} from "../types.js";
import { BaseTool } from "./base-tool.js";
import { createToolDefinition } from "./helpers.js";
import z from "zod";
import { ContentAnalysisAssistant } from "../agents/content-query.js";

const queryUrlParameters = z.object({
  question: z.string(),
  url: z.string(),
});

export class QueryURLTool extends BaseTool {
  constructor(
    private contentProcessor: IContentProcessor,
    private openai: OpenAI
  ) {
    super("query_url_content");
  }
  toolDefinition = createToolDefinition(
    super.name,
    "Ask a question about the content of the provided web url to retrieve an informed answer",
    {
      question: {
        type: "string",
        description:
          "A question related to the content of the provided web url.",
      },
      url: {
        type: "string",
        description: "A valid web url to a web page.",
      },
    }
  );

  async queryUrl(url: string, query: string): Promise<string> {
    await this.contentProcessor.StoreUrlContentEmbeddings(url);
    const topMatches = await this.contentProcessor.RetrieveRevelantMatches(
      query
    );

    if (!topMatches.length) {
      return "No relevant data found.";
    }
    const context = topMatches.join("\n---\n");

    return ContentAnalysisAssistant.AskAssistant(this.openai, query, context);
  }

  async handler(
    tool_call: CompletionMessageToolCall
  ): Promise<IToolResultMessage> {
    const {
      id,
      function: { arguments: args },
    } = tool_call;

    const response: IToolResultMessage = {
      tool_call_id: id,
      content: "Cannot process tool call request.",
      role: "tool",
    };

    if (!super.isToolHandler(tool_call)) {
      return response;
    }

    try {
      const { url, question } = queryUrlParameters.parse(JSON.parse(args));
      response.content = await this.queryUrl(url, question);
    } catch (error) {
      response.content = JSON.stringify(error);
    }

    return response;
  }
}
