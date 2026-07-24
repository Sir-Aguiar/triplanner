import * as Crypto from 'expo-crypto';
import { setGenerator } from '@nozbe/watermelondb/utils/common/randomId';

/** RN02 — todas as PKs/FKs geradas pelo WatermelonDB usam UUID v4. */
export function configureUuidGenerator(): void {
  setGenerator(() => Crypto.randomUUID());
}

export function createUuidV4(): string {
  return Crypto.randomUUID();
}
