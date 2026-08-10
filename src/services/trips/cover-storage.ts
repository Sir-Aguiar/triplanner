import * as FileSystem from 'expo-file-system/legacy';

import { createUuidV4 } from '@/database/uuid';
import { isLocalCoverUri } from '@/utils/cover-image';

const COVER_DIR_NAME = 'trip-covers';

function extensionFromUri(uri: string): string {
  const withoutQuery = uri.split('?')[0] ?? uri;
  const match = withoutQuery.match(/\.([a-zA-Z0-9]+)$/);
  const ext = match?.[1]?.toLowerCase();
  if (!ext || ext.length > 5) {
    return 'jpg';
  }
  return ext;
}

function coverDirectoryUri(): string {
  const base = FileSystem.documentDirectory;
  if (!base) {
    throw new Error('Armazenamento local indisponível neste dispositivo.');
  }
  return `${base}${COVER_DIR_NAME}/`;
}

/**
 * Copia a imagem da galeria (URI temporária / content://) para o diretório permanente do app.
 * Retorna a URI `file://...` estável para gravar em `coverImage`.
 *
 * Usa a API legacy: `copyAsync` aceita URIs compartilhadas pela galeria (Android/iOS).
 */
export async function persistCoverImage(sourceUri: string, tripId: string): Promise<string> {
  const directory = coverDirectoryUri();
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const filename = `${tripId}-${createUuidV4()}.${extensionFromUri(sourceUri)}`;
  const destination = `${directory}${filename}`;

  const sourceInfo = await FileSystem.getInfoAsync(sourceUri);
  if (!sourceInfo.exists) {
    throw new Error('Arquivo de imagem não encontrado no dispositivo.');
  }

  await FileSystem.copyAsync({ from: sourceUri, to: destination });

  const destinationInfo = await FileSystem.getInfoAsync(destination);
  if (!destinationInfo.exists) {
    throw new Error('Falha ao persistir a capa no armazenamento local.');
  }

  return destination;
}

/** Remove o arquivo físico local após o swap para URL remota (RN04). */
export async function deleteLocalCoverFile(coverImage: string | null | undefined): Promise<void> {
  const uri = (coverImage ?? '').trim();
  if (!isLocalCoverUri(uri)) {
    return;
  }

  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (error) {
    console.warn('Não foi possível remover arquivo local de capa:', error);
  }
}
