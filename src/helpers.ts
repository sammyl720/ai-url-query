import path from 'path';
import { fileURLToPath } from 'url';

// Determine current directory since ES modules do not have __dirname.
const __filename = fileURLToPath(import.meta.url);

/** Absolute path to `src` or `dist` when running built package. */
export const __dirname = path.dirname(__filename);

// Path to store the vectra index locally; you can change as needed.
export const INDEX_PATH = path.join(path.dirname(__dirname), 'vectra_index');
