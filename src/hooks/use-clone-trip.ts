import { router } from 'expo-router';
import { useCallback, useState } from 'react';

import { useToast } from '@/components/ui/toast';
import { useSession } from '@/contexts/session';
import { ServiceError, tripService } from '@/services';
import { isInternetReachable } from '@/utils/network';

const OFFLINE_CLONE_TOAST = 'Conecte-se à internet para clonar este roteiro do servidor';
const ERROR_CLONE_TOAST = 'Ocorreu um erro ao clonar o roteiro, tente novamente';
const LOGIN_CLONE_TOAST = 'Faça login para clonar um roteiro';

/**
 * Fluxo de clonagem API-first: checa rede → modal de data → POST → ingestão local → Minhas Viagens.
 */
export function useCloneTrip() {
  const { session, isLoggedIn } = useSession();
  const { showToast } = useToast();
  const [tripIdToClone, setTripIdToClone] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const requestClone = useCallback(
    async (tripId: string) => {
      if (!isLoggedIn || !session) {
        showToast(LOGIN_CLONE_TOAST);
        return;
      }

      const online = await isInternetReachable();
      if (!online) {
        showToast(OFFLINE_CLONE_TOAST);
        return;
      }

      setTripIdToClone(tripId);
    },
    [isLoggedIn, session, showToast],
  );

  const closeCloneModal = useCallback(() => {
    if (submitting) {
      return;
    }
    setTripIdToClone(null);
  }, [submitting]);

  const confirmClone = useCallback(
    async (newStartDate: string) => {
      if (!tripIdToClone || !session || submitting) {
        return;
      }

      setSubmitting(true);
      try {
        await tripService.clone(tripIdToClone, newStartDate, session);
        setTripIdToClone(null);
        showToast('Roteiro clonado!');
        router.replace('/(tabs)/viagens');
      } catch (error) {
        console.error('Falha ao clonar viagem:', error);
        const message =
          error instanceof ServiceError && error.message
            ? error.message
            : ERROR_CLONE_TOAST;
        showToast(message);
      } finally {
        setSubmitting(false);
      }
    },
    [session, showToast, submitting, tripIdToClone],
  );

  return {
    cloneModalVisible: tripIdToClone != null,
    submitting,
    requestClone,
    confirmClone,
    closeCloneModal,
  };
}
