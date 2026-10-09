import { useQuery } from '@tanstack/react-query';
import { api } from './client.js';

const forever = { staleTime: Infinity, gcTime: Infinity };

export function useCountries() {
  return useQuery({
    queryKey: ['locations', 'countries'],
    queryFn: async () => (await api.get('/locations/countries')).data.countries,
    ...forever,
  });
}

export function useStates(countryCode) {
  return useQuery({
    queryKey: ['locations', 'states', countryCode],
    queryFn: async () => (await api.get(`/locations/countries/${countryCode}/states`)).data.states,
    enabled: Boolean(countryCode),
    ...forever,
  });
}

export function useCities(countryCode, stateCode) {
  return useQuery({
    queryKey: ['locations', 'cities', countryCode, stateCode],
    queryFn: async () => (await api.get(`/locations/countries/${countryCode}/states/${stateCode}/cities`)).data.cities,
    enabled: Boolean(countryCode && stateCode),
    ...forever,
  });
}
