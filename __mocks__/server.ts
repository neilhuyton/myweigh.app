// __mocks__/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

server.events.on('request:start', ({ request }) => {
  console.log('MSW request:', request.method, request.url, request.headers.get('authorization'), request.body);
});