import { ChatCompletionMessageToolCall } from "openai/resources/chat/completions.js";

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

export interface IToolProperty {
  type: string | string[]; // e.g. "string", "number", or a union like ["string", "null"]
  description?: string;
  enum?: string[];
}

export interface IToolProperties extends Record<string, IToolProperty> {}

/**
 * Represents the JSON schema–like parameters for a function.
 */
export interface IFunctionParameters {
  type: "object";
  properties: IToolProperties;
  required?: string[];
  additionalProperties?: boolean; // typically set to false in strict mode
}

/**
 * The function definition provided to OpenAI.
 * It describes the tool's purpose, name, and input parameters.
 */
export interface IFunctionDefinition {
  name: string;
  description?: string;
  parameters?: IFunctionParameters;
  strict?: boolean; // when true, ensures the model adheres to the schema exactly
}

export interface IToolDefinition {
  type: "function";
  function: IFunctionDefinition;
}

export type CompletionMessageToolCall = ChatCompletionMessageToolCall;
/**
 * The expected structure of a tool result message.
 * This is the message you send back to OpenAI after executing a tool.
 */
export interface IToolResultMessage {
  role: "tool";
  tool_call_id: string;
  content: string; // can be a JSON string, plain text, or other stringified result
}

/**
 * ITool ties together a valid function definition (to register with OpenAI)
 * and a handler method that implements the tool's logic. The handler accepts
 * the parsed arguments and returns a promise that resolves to a tool result message.
 */
export interface ITool extends IToolHandler {
  /**
   * The tool definition used in the API call.
   * This object will be passed as part of the `tools` array when making a request.
   */
  toolDefinition: IToolDefinition;

  /**
   * The handler executes the tool’s logic.
   * @param tool_call - the tool call object.
   * @returns A promise that resolves with a valid tool result message.
   */
  handler: (
    tool_call: CompletionMessageToolCall
  ) => Promise<IToolResultMessage>;
}

export interface IToolHandler {
  name: string;
  isToolHandler(tool_call: CompletionMessageToolCall): boolean;
}

export interface IEmbeddingsGenerator {
  getEmbeddings(input: string): Promise<number[]>;
}
