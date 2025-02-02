export interface IContentProcessor {
  /**
   * Store a list of embeddings for the content of the provided url.
   *
   * @param url - the url to process
   * @param force - Force storage of embeddings even if database already has embeddings for the provided url.
   */
  StoreUrlContentEmbeddings(url: string, force?: boolean): Promise<void>;

  /**
   * Retrieve the most relevant content for query
   * @param query A text query of stored content
   * @param numberOfResults the amount of text results to retrieve
   */
  RetrieveRevelantMatches(
    query: string,
    numberOfResults?: number
  ): Promise<string[]>;
}
export interface IContentChunker {
  /**
   * Splits a long text content into chunks of text suitable for embedding.
   */
  Chunk(content: string): Promise<string[]>;
}
export interface EmbeddingEntry {
  vector: number[];
  metadata: {
    /** the source of the embeddings */
    source: string;
    text: string;
  };
}
export interface IVectorDatabase {
  store(entry: EmbeddingEntry): Promise<void>;
  query(vector: number[], numberOfResults: number): Promise<EmbeddingEntry[]>;
  has(source: string): Promise<boolean>;
}
