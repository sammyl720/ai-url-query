import readline from "readline";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import { ContentSegmentationAgent } from "../agents/content-segmentation.js";
import { VectraDatabase } from "../database/vector/vector-database.js";
import { ContentProcessor } from "../content-processor.js";
import { EmbeddingsGenerator } from "../tools/embedding-generator.js";
import { QueryURLTool } from "../tools/query-url.js";
import { INDEX_PATH } from "../helpers.js";
import {
  IContentChunker,
  IContentProcessor,
  IEmbeddingsGenerator,
  IVectorDatabase,
} from "../types.js";

// Load environment variables from .env file
dotenv.config();

/**
 * Here is an example of a cli app that uses this library to query web urls using openai's embeddings and chat completion apis
 */
export async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  /** A `IContentChunker` implementation that uses openai chat completions api to split long text content in to smaller chunks suitable for embeddings */
  const textSegmentationAgent: IContentChunker = new ContentSegmentationAgent(
    openai
  );

  /** A simple wrapper of openai embeddings api to retrieve embeddings using the `text-embedding-3-small` model */
  const embeddingsGenerator: IEmbeddingsGenerator = new EmbeddingsGenerator(
    openai
  );

  // create a simple wrapper of `vectra`' LocalIndex that implements a `IVectorDatabase` for our database to store embeddings
  const vectorDatabase: IVectorDatabase = await VectraDatabase.From(INDEX_PATH);

  //** An implementation of `IContentProcessor` that is used to 'prepare' and 'simplify' querying the url */
  const contentProcessor: IContentProcessor = new ContentProcessor(
    embeddingsGenerator,
    textSegmentationAgent,
    vectorDatabase
  );

  /** A high level tool that can be used in any ui to ask question about provided urls. */
  const queryUrlTool = new QueryURLTool(contentProcessor, openai); // implements `ITool` so that it is setup be used as tool for openai chat completions to query urls

  // Set up terminal input using readline
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Promisify question asking
  const askQuestion = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  try {
    // Get URL and question from the user
    const url = await askQuestion("Enter URL: ");
    const question = await askQuestion(
      "Enter your question about the URL content: "
    );
    const answer = await queryUrlTool.queryUrl(url, question);

    console.log("\nAnswer:");
    console.log(answer);
  } catch (err) {
    console.error("An error occurred:", err);
  } finally {
    rl.close();
  }
}
