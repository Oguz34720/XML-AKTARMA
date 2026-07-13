export function useAuthenticatedFetch() {
  const fetchFn = typeof window !== 'undefined' ? window.fetch : fetch;
  
  return async (uri: RequestInfo | URL, options?: RequestInit) => {
    const response = await fetchFn(uri, options);
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const cloned = response.clone();
      try {
        const data = await cloned.json();
        if (data && data.jobId && Object.keys(data).length === 1) {
          return new Promise<Response>((resolve, reject) => {
            const poll = async () => {
              const statusRes = await fetchFn(`/api/jobs/${data.jobId}`);
              const statusData = await statusRes.json();
              if (statusData.done) {
                if (statusData.error) {
                    resolve(new Response(JSON.stringify({ error: statusData.error }), {
                        status: 500,
                        headers: { 'Content-Type': 'application/json' }
                    }));
                } else {
                    resolve(new Response(JSON.stringify(statusData.result), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }));
                }
              } else {
                setTimeout(poll, 3000);
              }
            };
            poll();
          });
        }
      } catch (e) {
      }
    }
    
    return response;
  };
}
