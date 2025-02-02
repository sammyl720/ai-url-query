import OpenAI from "openai";
import { OPENAI_MODEL_EMBEDDING } from "../consts.js";
import {
  CompletionMessageToolCall,
  IEmbeddingsGenerator,
  ITool,
  IToolResultMessage,
} from "../types.js";
import { createToolDefinition } from "./helpers.js";
import z from "zod";
import { BaseTool } from "./base-tool.js";

const getEmbeddingsParameters = z.object({
  input: z.string().describe("The input text to generate embeddings for."),
});

export class EmbeddingsGenerator
  extends BaseTool
  implements IEmbeddingsGenerator, ITool
{
  toolDefinition = createToolDefinition(
    this.name,
    "Generate vector embeddings for the provided input",
    {
      input: {
        type: "string",
        description: "The input text to generate embeddings for.",
      },
    }
  );

  constructor(
    private openai: OpenAI,
    private embeddingsModel = OPENAI_MODEL_EMBEDDING
  ) {
    super("get_embeddings");
  }

  async handler(
    tool_call: CompletionMessageToolCall
  ): Promise<IToolResultMessage> {
    const {
      id,
      function: { arguments: args, name },
    } = tool_call;
    const result: IToolResultMessage = {
      tool_call_id: id,
      role: "tool",
      content: "Could not process request.",
    };

    try {
      const { input } = getEmbeddingsParameters.parse(JSON.parse(args));
      const embeddings = await this.getEmbeddings(input);
      result.content = JSON.stringify(embeddings);
    } catch (error) {
      result.content = JSON.stringify(error);
    }

    return result;
  }

  async getEmbeddings(input: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingsModel,
        input,
      });
      // OpenAI returns an array; we take the first embedding.
      return response.data[0].embedding;
    } catch (err) {
      console.error("Error getting embedding from OpenAI:", err);
      throw err;
    }
  }
}
