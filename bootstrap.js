import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

// Register the ts-node ESM loader
register('ts-node/esm', pathToFileURL('./'));
