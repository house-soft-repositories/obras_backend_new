import type FonteEntity from '@/modules/fontes/domain/entities/fonte.entity';

export interface FonteResumo {
  id: string;
  nome: string;
  valorPrevisto: string | null;
}

export function toFonteResumo(fonte: FonteEntity): FonteResumo {
  return {
    id: fonte.id,
    nome: fonte.nome,
    valorPrevisto: fonte.valorPrevisto,
  };
}
