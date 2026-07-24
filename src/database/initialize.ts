import Constants, { ExecutionEnvironment } from 'expo-constants';

import { getDatabase } from '@/database/client';
import { seedCategories } from '@/database/seeds';

const REQUIRED_TABLES = ['trips', 'categories', 'activities'] as const;
const INIT_TIMEOUT_MS = 15_000;

/**
 * Garante que o SQLite local está pronto para leitura/escrita (RN01: 100% offline).
 * Na primeira abertura cria o esquema; nas seguintes apenas valida o existente (CA01/CA02).
 */
export async function initializeDatabase(): Promise<void> {
  assertNativeRuntime();
  const database = getDatabase();

  await withTimeout(runInitialization(database), INIT_TIMEOUT_MS, [
    'A inicialização do banco local excedeu o tempo limite.',
    'WatermelonDB precisa de um development build nativo.',
    'Pare o Expo Go e rode: npx expo run:android',
  ].join(' '));
}

async function runInitialization(database: ReturnType<typeof getDatabase>): Promise<void> {
  try {
    await verifySchemaReady(database);
  } catch (error) {
    console.warn('Esquema incompatível ou corrompido. Recriando banco local.', error);
    await database.unsafeResetDatabase();
    await verifySchemaReady(database);
  }

  await seedCategories();
  await verifyReadWrite(database);
}

function assertNativeRuntime(): void {
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    throw new Error(
      'WatermelonDB não funciona no Expo Go. Gere um development build com: npx expo run:android',
    );
  }
}

async function verifySchemaReady(database: ReturnType<typeof getDatabase>): Promise<void> {
  for (const table of REQUIRED_TABLES) {
    await database.get(table).query().fetchCount();
  }
}

async function verifyReadWrite(database: ReturnType<typeof getDatabase>): Promise<void> {
  // Confirma leitura após o seed — prova que o banco aceita R/W.
  const categoriesCount = await database.get('categories').query().fetchCount();
  if (categoriesCount <= 0) {
    throw new Error('Falha ao validar leitura/escrita: categorias não encontradas após o seed.');
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}
