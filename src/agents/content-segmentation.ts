import OpenAI from 'openai';
import { OPENAI_MODEL_COMPLETION } from '../consts.js';
import { z } from 'zod';
import type { IContentChunker } from '../types.js';

const chunksParser = z.object({
  chunks: z.string().array(),
});

const toolFunctionName = 'save_content_chunks';

const systemPrompt = `
You are a text segmentation agent whose sole purpose is to process the complete text content of a web page and divide it into chunks that are optimized for embedding generation. Follow these instructions:

1. **Input Processing:**  
   - Accept the entire text content from a web page.  
   - Remove extraneous whitespace and normalize the text if needed.

2. **Chunking Requirements:**  
   - **Coherence:** Ensure that each chunk represents a semantically coherent block of text. Do not split in the middle of sentences or paragraphs.
   - **Token Limit:** Aim for a maximum token (or character) length per chunk (for example, around 250–300 tokens) that suits the embedding model’s input limits.
   - **Overlap:** Include a small overlap between consecutive chunks (e.g., 20–30 tokens) to preserve context across boundaries.

3. **Splitting Strategy:**  
   - Use natural language boundaries as splitting points. Start by splitting on larger delimiters (such as paragraph breaks) and, if necessary, further subdivide using sentence boundaries.
   - If a segment is still too long after an initial split, apply a recursive strategy: break the segment further using a hierarchy of separators (e.g., paragraphs → sentences → phrases) until each chunk meets the token limit.
   - Avoid cutting off sentences; if a sentence would be partially split, adjust the boundaries to include the entire sentence in one chunk.

4. **Output Format:**  
   - Return a list of text chunks, where each chunk is a self-contained, contextually meaningful segment ready for embedding.
   - Ensure that no chunk is empty and that adjacent chunks have the specified overlap to maintain continuity.

By adhering to these guidelines, you will produce a set of chunks that can be directly fed into an embedding model for downstream tasks such as semantic search or retrieval-augmented generation.
`;

export class ContentSegmentationAgent implements IContentChunker {
  constructor(private openai: OpenAI) {}

  async Chunk(content: string) {
    return this.segmentContentIntoSuitableChunks(content);
  }

  private async segmentContentIntoSuitableChunks(content: string) {
    const result = await this.openai.chat.completions.create({
      model: OPENAI_MODEL_COMPLETION,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'developer',
          content: `Please segment the content below and call the \`${toolFunctionName}\` function with the result
          \n\n${content}`,
        },
      ],
      tool_choice: 'required',
      tools: [
        {
          type: 'function',
          function: {
            name: toolFunctionName,
            description: 'Save content chunks.',
            strict: true,
            parameters: {
              type: 'object',
              required: ['chunks'],
              properties: {
                chunks: {
                  type: 'array',
                  description:
                    'Array of strings representing content chunks that are suitable embeddings',
                  items: {
                    type: 'string',
                    description: 'Content chunk',
                  },
                },
              },
              additionalProperties: false,
            },
          },
        },
      ],
    });

    return this.processResult(result);
  }

  processResult(
    result: OpenAI.Chat.Completions.ChatCompletion & {
      _request_id?: string | null;
    },
  ) {
    const toolCalls = result.choices[0]!.message.tool_calls;

    if (
      !toolCalls?.length ||
      toolCalls[0]!.function.name !== toolFunctionName
    ) {
      console.log(`Message: ${result.choices[0]!.message.content}`);
      throw new Error(`Could not chunk content.`);
    }

    const { chunks } = chunksParser.parse(
      JSON.parse(toolCalls[0]!.function.arguments),
    );
    return chunks;
  }
}
