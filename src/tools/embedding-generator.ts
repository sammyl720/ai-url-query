import OpenAI from "openai";
import { OPENAI_MODEL_EMBEDDING } from "../consts.js";

export interface IEmbeddingsGenerator {
  getEmbeddings(input: string): Promise<number[]>;
}

export class EmbeddingsGenerator implements IEmbeddingsGenerator {
  constructor(
    private openai: OpenAI,
    private embeddingsModel = OPENAI_MODEL_EMBEDDING
  ) {}

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
