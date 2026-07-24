/**
 * Estratégia de persistência.
 * Hoje apenas `local` está implementado; `api` fica preparado para sync remoto.
 */
export type PersistenceMode = 'local' | 'api';

export const DEFAULT_PERSISTENCE_MODE: PersistenceMode = 'local';
