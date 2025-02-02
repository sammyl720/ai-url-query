import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";
import { OpenAI } from "openai";
import dotenv from "dotenv";
import { ContentSegmentationAgent } from "./agents/content-segmentation.js";
import { VectraDatabase } from "./database/vector/vector-database.js";
import { ContentProcessor } from "./content-processor.js";
import { EmbeddingsGenerator } from "./tools/embedding-generator.js";
import { QueryURLTool } from "./tools/query-url.js";

// Load environment variables from .env file
dotenv.config();

// Determine current directory since ES modules do not have __dirname.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Path to store the index locally; you can change as needed.
const INDEX_PATH = path.join(path.dirname(__dirname), "vectra_index");

const openai = new OpenAI();
const textSegmentationAgent = new ContentSegmentationAgent(openai);
const embeddingsGenerator = new EmbeddingsGenerator(openai);

async function main() {
  const vectorDatabase = await VectraDatabase.From(INDEX_PATH);
  const contentProcessor = new ContentProcessor(
    embeddingsGenerator,
    textSegmentationAgent,
    vectorDatabase
  );
  const queryUrlTool = new QueryURLTool(contentProcessor, openai);

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

// Run the main function
main();
