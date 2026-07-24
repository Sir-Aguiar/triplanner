import './polyfills';

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { NativeModules } from 'react-native';

import migrations from './migrations';
import { modelClasses } from './models';
import { schema } from './schema';
import { configureUuidGenerator } from './uuid';

let databaseInstance: Database | null = null;

function assertNativeBridge(): void {
  if (NativeModules.WMDatabaseBridge == null && (NativeModules as { WMDatabaseJSI?: unknown }).WMDatabaseJSI == null) {
    throw new Error(
      [
        'WatermelonDB nativo não encontrado (WMDatabaseBridge).',
        'Abra o app "triplanner" (development build), não o Expo Go.',
        'Se já estiver no triplanner, reinstale com: npx expo run:android',
      ].join(' '),
    );
  }
}

export function getDatabase(): Database {
  if (databaseInstance) {
    return databaseInstance;
  }

  assertNativeBridge();
  configureUuidGenerator();

  const adapter = new SQLiteAdapter({
    schema,
    migrations,
    jsi: false,
    onSetUpError: (error) => {
      console.error('WatermelonDB setup failed:', error);
    },
  });

  databaseInstance = new Database({
    adapter,
    modelClasses,
  });

  return databaseInstance;
}

/** Compat: encaminha para a instância real (receiver correto para getters). */
export const database = new Proxy({} as Database, {
  get(_target, property) {
    const db = getDatabase();
    const value = Reflect.get(db, property, db);
    return typeof value === 'function' ? value.bind(db) : value;
  },
});
