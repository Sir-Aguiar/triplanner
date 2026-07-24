/** Formata número em máscara monetária BRL (ex: R$ 1.234,56). */
export function formatCurrencyBrl(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }

  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Converte texto com máscara BRL (ou só dígitos) em valor numérico.
 * Digitação é tratada em centavos: "1234" => 12,34.
 */
export function parseCurrencyBrl(text: string): number | null {
  const digits = text.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  const cents = Number.parseInt(digits, 10);
  if (!Number.isFinite(cents)) {
    return null;
  }

  return cents / 100;
}
