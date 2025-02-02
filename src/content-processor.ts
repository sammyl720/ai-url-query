import axios from "axios";
import * as cheerio from "cheerio";
import { IEmbeddingsGenerator } from "./types.js";
import { IContentChunker } from "./types.js";
import { IVectorDatabase } from "./types.js";
import { IContentProcessor } from "./types.js";
import { TOP_K_RESULTS } from "./consts.js";

export class ContentProcessor implements IContentProcessor {
  constructor(
    private embeddingsGenerator: IEmbeddingsGenerator,
    private contentChunker: IContentChunker,
    private vectorDatabase: IVectorDatabase
  ) {}

  async StoreUrlContentEmbeddings(url: string, force = false) {
    if (!force && (await this.vectorDatabase.has(url))) {
      console.warn(
        `Database already contains embeddings for provided url. Skipping url embeddings. To embed the content anyways provide set 'force' to 'true'. `
      );
      return;
    }
    const content = await this.getUrlContent(url);
    const chunks = await this.contentChunker.Chunk(content);
    await this.storeChunksEmbeddings(chunks, url);
  }

  async RetrieveRevelantMatches(
    query: string,
    numberOfResults = TOP_K_RESULTS
  ): Promise<any> {
    const embeddings = await this.embeddingsGenerator.getEmbeddings(query);
    const matches = await this.vectorDatabase.query(
      embeddings,
      numberOfResults
    );
    return matches.map(({ metadata: { text } }) => text);
  }

  private async storeChunksEmbeddings(
    chunks: string[],
    source: string
  ): Promise<void> {
    for (const chunk of chunks) {
      const vector = await this.embeddingsGenerator.getEmbeddings(chunk);
      await this.vectorDatabase.store({
        vector,
        metadata: {
          source,
          text: chunk,
        },
      });
    }
  }

  /**
   * Fetches the content of a URL and extracts its text.
   * Uses axios to fetch HTML and cheerio to extract the text content.
   *
   * @param {string} url - The URL to fetch.
   * @returns {Promise<string>} - The extracted plain text.
   */
  private async getUrlContent(url: string): Promise<string> {
    try {
      const response = await axios.get(url);
      const html = response.data;
      // Load HTML into Cheerio and extract text from the body.
      const $ = cheerio.load(html);
      const text = $("body").text();
      // Clean up the text: collapse multiple spaces and trim.
      return text.replace(/\s+/g, " ").trim();
    } catch (err) {
      console.error("Error fetching URL content:", err);
      throw err;
    }
  }
}
