import type {
  CompletionMessageToolCall,
  ITool,
  IToolDefinition,
  IToolResultMessage,
} from '../types.js';

export abstract class BaseTool implements ITool {
  constructor(public readonly name: string) {}

  abstract toolDefinition: IToolDefinition;
  abstract handler(
    tool_call: CompletionMessageToolCall,
  ): Promise<IToolResultMessage>;

  isToolHandler(tool_call: CompletionMessageToolCall): boolean {
    return tool_call.function.name === this.name;
  }
}
