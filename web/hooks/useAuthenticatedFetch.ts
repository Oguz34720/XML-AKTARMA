export function useAuthenticatedFetch() {
  return typeof window !== 'undefined' ? window.fetch : fetch;
}
