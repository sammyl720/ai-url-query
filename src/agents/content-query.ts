import OpenAI from "openai";
import { OPENAI_MODEL_COMPLETION } from "../consts.js";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const SYSTEM_PROMPT = `
You are a highly knowledgeable assistant whose task is to provide clear, comprehensive, and well-informed answers based on a provided context. The relevant information is delivered in a string wrapped in <context> and </context> tags. Follow these guidelines:

Context Analysis:

Read and understand the entire content between the <context> and </context> tags before generating your answer.
Use the details, data, and insights from this context as your primary source of information.
Answer Generation:

Construct your answer by directly referencing and synthesizing the information from the <context> ... </context> string.
If parts of the user's question are not fully addressed by the context, you may supplement your answer with general knowledge—but clearly indicate any uncertainty.
Ensure that your answer is accurate, detailed, and directly addresses every aspect of the user's inquiry.
Clarity and Structure:

Organize your answer logically, using clear sections or bullet points if needed.
Include a brief summary at the end that highlights the key points of your response.
Caveats and Transparency:

If the context lacks sufficient information on any point, mention this explicitly.
Avoid adding unsupported details or making assumptions beyond what the context provides.
By following these instructions, you will generate responses that are well-informed and grounded in the provided context, ensuring that the user receives the most accurate and relevant information available.`;

export class ContentAnalysisAssistant {
  private messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: SYSTEM_PROMPT,
    },
  ];

  constructor(
    private openai: OpenAI,
    private model = OPENAI_MODEL_COMPLETION
  ) {}

  async Ask(context: string, question: string): Promise<any> {
    this.addUserMessage(question);
    this.addContextMessage(context);
    const message = await this.getAssistantResponseMessage();
    this.messages.push(message);
    return message.content;
  }

  private async getAssistantResponseMessage() {
    const response = await this.openai.chat.completions.create({
      messages: this.messages,
      model: this.model,
    });

    return response.choices[0].message;
  }

  private addUserMessage(content: string) {
    this.messages.push({
      role: "user",
      content,
    });
  }

  private addContextMessage(context: string) {
    this.messages.push({
      role: "system",
      content: `
        <context>
            ${context}
        </context>`,
    });
  }
}
