import { useQuery } from '@tanstack/react-query';
import { api } from './client.js';

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/categories')).data.categories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts(params) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => (await api.get('/products', { params })).data,
    keepPreviousData: true,
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await api.get(`/products/${slug}`)).data,
    enabled: Boolean(slug),
  });
}

export function useSearchSuggestions(q) {
  return useQuery({
    queryKey: ['search-suggestions', q],
    queryFn: async () => (await api.get('/products/search-suggestions', { params: { q } })).data.suggestions,
    enabled: q.trim().length > 1,
    staleTime: 30 * 1000,
  });
}

export function useProductReviews(productId) {
  return useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => (await api.get(`/reviews/product/${productId}`)).data.reviews,
    enabled: Boolean(productId),
  });
}

export function useHomepageContent() {
  return useQuery({
    queryKey: ['homepage-content'],
    queryFn: async () => (await api.get('/site-content/homepage')).data.content,
    staleTime: 5 * 60 * 1000,
  });
}
