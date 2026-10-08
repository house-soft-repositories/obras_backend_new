/**
 * Sinalização de Chromium indisponível para o renderer de PDFs. Vive em
 * módulo próprio (sem importar o `puppeteer-core`, que é ESM puro) para que
 * services e testes unitários possam usá-la sem carregar o browser.
 */
export const CHROMIUM_NAO_ENCONTRADO =
  'Chromium não encontrado: defina CHROMIUM_EXECUTABLE_PATH ou instale o binário.';

export function isChromiumIndisponivel(error: unknown): boolean {
  return (
    error instanceof Error && error.message.includes('Chromium não encontrado')
  );
}
