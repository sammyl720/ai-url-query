// --- Configuration Constants ---
export const OPENAI_MODEL_EMBEDDING = 'text-embedding-3-small';
export const OPENAI_MODEL_COMPLETION = 'gpt-4o-mini'; // or another ChatCompletion model
export const CHUNK_SIZE = 1000; // approximate maximum characters per chunk (adjust as needed)
export const TOP_K_RESULTS = 3; // default number of top embeddings to retrieve
export const MIN_SCORE_MATCH = 0.7;
