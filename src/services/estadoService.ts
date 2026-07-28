const estados: Record<string, string> = {};

export function definirEstado(usuario: string, estado: string): void {
  estados[usuario] = estado;
}

export function obterEstado(usuario: string): string | undefined {
  return estados[usuario];
}

export function limparEstado(usuario: string): void {
  delete estados[usuario];
}
