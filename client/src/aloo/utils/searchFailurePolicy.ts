import type { LoopState } from '../types';

export type SearchPausePolicyInput = {
  status: number;
  contentType: string;
  errorCode?: unknown;
};

export type SearchPausePolicy = {
  reason: string;
};

export function getSearchFailurePausePolicy(input: SearchPausePolicyInput): SearchPausePolicy | null {
  if (input.errorCode === 'SEARCH_SOURCE_BLOCKED' || input.errorCode === 'SEARCH_PROVIDER_UNAVAILABLE') {
    return { reason: 'A fonte externa de busca não está disponível.' };
  }

  if (input.status === 404 || input.status === 405) {
    return { reason: 'O endpoint de busca não está disponível.' };
  }

  if (input.status >= 500) {
    return { reason: 'O serviço de busca está indisponível no momento.' };
  }

  if (input.status === 200 && !input.contentType.includes('application/json')) {
    return { reason: 'O endpoint de busca retornou um formato inesperado.' };
  }

  return null;
}

export function shouldScheduleNextLoopBatch(input: {
  isSubscribed: boolean;
  searchUnavailable: boolean;
  loopStatus: string;
}): boolean {
  return input.isSubscribed && !input.searchUnavailable && input.loopStatus === 'running';
}

export function getLoopPausePatch(reason: string): Pick<LoopState, 'status' | 'activeBatch' | 'backoffActive' | 'manualRequiredReason'> {
  return {
    status: 'paused_manual',
    activeBatch: [],
    backoffActive: false,
    manualRequiredReason: reason,
  };
}

export function resolveClientSearchFailureTransition(input: SearchPausePolicyInput & { queryTerm: string }) {
  const policy = getSearchFailurePausePolicy(input);
  if (!policy) return null;

  return {
    loopPatch: getLoopPausePatch(policy.reason),
    logMessage: `Busca externa indisponível para "${input.queryTerm}". O loop foi pausado para evitar tentativas repetidas sem resultado.`,
    shouldScheduleNextBatch: false,
  };
}
