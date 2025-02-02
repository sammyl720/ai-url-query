# AI URL Query

**AI URL Query** is a Node.js and TypeScript library that enables you to ask questions about the content of any web URL using OpenAI’s embeddings and chat completion APIs. It fetches a webpage, extracts and segments its text content, generates embeddings for each segment, and then uses a vector database to efficiently retrieve and answer queries based on that content.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
  - [CLI Example](#cli-example)
- [Project Structure](#project-structure)
- [API Overview](#api-overview)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Content Extraction & Segmentation:**  
  Uses [axios](https://www.npmjs.com/package/axios) and [cheerio](https://www.npmjs.com/package/cheerio) to fetch a URL and extract its text, then segments the text into chunks using a content segmentation agent powered by OpenAI’s chat completion API.

- **Embeddings Generation:**  
  Wraps OpenAI’s embeddings API to generate vector representations of text chunks using the `text-embedding-3-small` model.

- **Vector Database Integration:**  
  Stores and queries embeddings using a simple interface over [vectra](https://www.npmjs.com/package/vectra).

- **Intelligent Query Tool:**  
  Provides a high-level tool (`QueryURLTool`) that integrates the content processor and OpenAI to answer natural language questions about the content of a given URL.

- **TypeScript First:**  
  Built with TypeScript, featuring clear interface definitions (e.g., `IContentProcessor`, `IContentChunker`, `IVectorDatabase`, `ITool`) that make it easy to understand and extend the library’s functionality.

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/sammyl720/ai-agents.git
   cd ai-agents
   ```

2. **Install Dependencies:**

   ```bash
   npm install
   ```

3. **Build the Project (if needed):**

   ```bash
   npm run build
   ```

4. **Run in Development Mode:**

   ```bash
   npm run dev
   ```

## Configuration

Create a `.env` file in the root directory of the project and add your OpenAI API key:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

This key is required for both generating embeddings and making chat completion requests.

## Usage

The library can be used as a standalone CLI tool or integrated into other applications. Below is an example of using the CLI tool provided in `src/examples/cli.ts`.

### CLI Example

The CLI example demonstrates how to:

1. Instantiate OpenAI and the required agents/tools.
2. Fetch a URL's content.
3. Segment the content and store embeddings.
4. Accept a natural language question from the user and retrieve an answer based on the URL’s content.

```typescript
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

export async function main() {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // Create an instance of the content segmentation agent.
  const textSegmentationAgent: IContentChunker = new ContentSegmentationAgent(openai);

  // Wrap OpenAI embeddings API.
  const embeddingsGenerator: IEmbeddingsGenerator = new EmbeddingsGenerator(openai);

  // Initialize the vector database using vectra.
  const vectorDatabase: IVectorDatabase = await VectraDatabase.From(INDEX_PATH);

  // Initialize the content processor that handles fetching, segmentation, and storage of embeddings.
  const contentProcessor: IContentProcessor = new ContentProcessor(
    embeddingsGenerator,
    textSegmentationAgent,
    vectorDatabase
  );

  // Create the high-level URL query tool.
  const queryUrlTool = new QueryURLTool(contentProcessor, openai);

  // Set up terminal input using readline.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Promisify question asking.
  const askQuestion = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  try {
    // Prompt the user for a URL and a question.
    const url = await askQuestion("Enter URL: ");
    const question = await askQuestion("Enter your question about the URL content: ");
    const answer = await queryUrlTool.queryUrl(url, question);

    console.log("\nAnswer:");
    console.log(answer);
  } catch (err) {
    console.error("An error occurred:", err);
  } finally {
    rl.close();
  }
}
```

To run the CLI example, execute:

```bash
ts-node src/examples/cli.ts
```

*(Make sure you have `ts-node` installed either globally or as a dev dependency.)*

## Project Structure

```
├── src
│   ├── agents
│   │   └── content-segmentation.ts      # Implements content segmentation using OpenAI
│   ├── database
│   │   └── vector
│   │       └── vector-database.ts       # Implements vector database using vectra
│   ├── examples
│   │   └── cli.ts                     # CLI example demonstrating the library usage
│   ├── tools
│   │   ├── embedding-generator.ts      # OpenAI embeddings wrapper
│   │   └── query-url.ts                # Tool to query URLs using the processed content
│   ├── content-processor.ts           # Core logic for processing URL content (fetch, chunk, embed, store)
│   ├── helpers.ts                     # Helper constants and methods (e.g., INDEX_PATH)
│   ├── types.ts                       # TypeScript interface definitions
│   └── consts.ts                      # Various constants used across the project
├── .env                               # Environment configuration (OpenAI API key)
├── package.json
├── tsconfig.json
└── README.md
```

## API Overview

The project defines several key interfaces to standardize functionality:

- **IContentProcessor:**  
  Provides methods to store URL content embeddings and retrieve relevant matches for a query.

- **IContentChunker:**  
  Splits long text into manageable chunks suitable for embedding.

- **IVectorDatabase:**  
  Abstracts the storage and querying of embeddings.

- **ITool & IToolHandler:**  
  Define how tools (like the URL query tool) are structured and executed, making it easier to integrate with OpenAI’s function calling mechanism.

- **IEmbeddingsGenerator:**  
  A simple interface to generate embeddings for a given text input.

These abstractions allow you to easily swap out implementations or extend functionality.

## Contributing

Contributions are welcome! Feel free to open issues or submit pull requests if you have suggestions, bug fixes, or new features.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/my-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/my-feature`).
5. Create a new Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).

---

If you have any questions about the content or functionality of this library, feel free to open an issue or reach out. Happy coding!

---

Feel free to modify this README as your project evolves or to better fit your documentation style.