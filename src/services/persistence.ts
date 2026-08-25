/**
 * Persistência de viagens e atividades:
 * 1. Sempre grava no WatermelonDB (a UI nunca espera a rede).
 * 2. Com sessão + internet, o SyncService envia na hora
 *    (`POST /trips/sync`, `DELETE`, upload de capa) e aplica o snapshot do servidor.
 * 3. Sem rede (ou convidado), fica só no aparelho; o envio ocorre no reconnect / abertura do app.
 */
export type PersistenceMode = 'local' | 'api';

export const DEFAULT_PERSISTENCE_MODE: PersistenceMode = 'local';
