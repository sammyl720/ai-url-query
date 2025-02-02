import { LocalIndex } from 'vectra';
import { TOP_K_RESULTS } from '../../consts.js';
import type { EmbeddingEntry, IVectorDatabase } from '../../types.js';

export class VectraDatabase implements IVectorDatabase {
  private constructor(private index: LocalIndex) {}

  /**
   * Creates an instance of VectraDatabase using the provided path to create a local instance of vectra
   * @param INDEX_PATH the absolute path to the local `vectra` database
   * @returns
   */
  static async From(INDEX_PATH: string) {
    const index = new LocalIndex(INDEX_PATH);
    if (!(await index.isIndexCreated())) {
      console.log('Creating new Vectra index...');
      await index.createIndex();
    }

    return new VectraDatabase(index);
  }

  async store(entry: EmbeddingEntry): Promise<void> {
    await this.index.insertItem(entry);
  }

  async query(
    vector: number[],
    numberOfResults: number = TOP_K_RESULTS,
  ): Promise<EmbeddingEntry[]> {
    const results = await this.index.queryItems(vector, numberOfResults);
    return results.map(
      ({ item: { vector, metadata } }) =>
        ({ vector, metadata }) as EmbeddingEntry,
    );
  }

  async has(source: string): Promise<boolean> {
    const results = await this.index.listItemsByMetadata({
      source: { $eq: source },
    });

    return results.length > 0;
  }
}
