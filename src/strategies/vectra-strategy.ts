import OpenAI from 'openai';
import type {
  IAssistant,
  IContentChunker,
  IContentProcessor,
  IEmbeddingsGenerator,
  IUrlQueryFactory,
  IUrlQueryToolSet,
  IVectorDatabase,
} from '../types.js';
import {
  ContentProcessor,
  ContentSegmentationAgent,
  EmbeddingsGenerator,
  QueryURLTool,
  VectraDatabase,
} from '../public-api.js';
import { OPENAI_MODEL_EMBEDDING } from '../consts.js';

export class VectraBasedUrlQueryFactory implements IUrlQueryFactory {
  #openai: OpenAI;
  #vectra!: IVectorDatabase;
  #contentChunker!: IContentChunker;
  #embeddingsGenerator!: IEmbeddingsGenerator;
  #processor!: IContentProcessor;
  #assistant!: IAssistant;
  #isInitialized = false;

  constructor(
    openaiApiKey: string,
    private pathToVectraIndexDatabase: string,
  ) {
    this.#openai = new OpenAI({ apiKey: openaiApiKey });
  }

  async Create(): Promise<IUrlQueryToolSet> {
    await this.initialize();
    return {
      vectorDatabase: this.#vectra,
      contentChunker: this.#contentChunker,
      embeddingsGenerator: this.#embeddingsGenerator,
      processor: this.#processor,
      assistant: this.#assistant,
      openai: this.#openai,
    };
  }

  private async initialize() {
    if (this.#isInitialized) return;
    this.#vectra = await VectraDatabase.From(this.pathToVectraIndexDatabase);
    this.#processor = this.createContentProcessor(this.#vectra);
    this.#assistant = new QueryURLTool(this.#processor, this.#openai);
    this.#isInitialized = true;
  }

  private createContentProcessor(
    vectorDatabase: IVectorDatabase,
  ): IContentProcessor {
    this.#embeddingsGenerator = new EmbeddingsGenerator(
      this.#openai,
      OPENAI_MODEL_EMBEDDING,
    );
    this.#contentChunker = new ContentSegmentationAgent(this.#openai);
    return new ContentProcessor(
      this.#embeddingsGenerator,
      this.#contentChunker,
      vectorDatabase,
    );
  }
}
