export type CountryOption = {
  code: string;
  name: string;
};

/** Países disponíveis no autocomplete de localização (MVP: somente Brasil). */
export const COUNTRIES: CountryOption[] = [{ code: 'BR', name: 'Brasil' }];
