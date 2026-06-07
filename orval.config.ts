import { defineConfig } from 'orval';

export default defineConfig({
  clinics: {
    input: { target: './api/openapi.yaml' }, // or 'https://<api-host>/openapi.json'
    output: {
      mode: 'tags-split',
      target: './src/api/generated',
      schemas: './src/api/generated/model',
      client: 'react-query',
      httpClient: 'axios',
      clean: true,
      prettier: true,
      override: {
        mutator: { path: './src/api/axios-instance.ts', name: 'customInstance' },
        // NOTE: a global `useQuery: true` here makes Orval v8 emit *every* operation
        // (incl. POST/PUT) as a query. Omit it so method-based detection applies:
        // GET -> useQuery, POST/PUT/PATCH/DELETE -> useMutation.
        query: { options: { staleTime: 30_000 } },
      },
    },
    hooks: { afterAllFilesWrite: 'prettier --write' },
  },
});
