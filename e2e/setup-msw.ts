// e2e/setup-msw.ts
import { setupWorker } from 'msw/browser';
import { handlers } from '../__mocks__/handlers';

export default async function(page) {
  const worker = setupWorker(...handlers);
  await worker.start();
  await page.evaluate((workerScript) => {
    // Evaluate MSW worker in the browser context
    const script = document.createElement('script');
    script.textContent = workerScript;
    document.head.appendChild(script);
  }, await worker.listHandlers());
}