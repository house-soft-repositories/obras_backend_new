import {
  CategoriaArquivoPrivado,
  VinculoArquivoPrivado,
} from '@/modules/obras-privadas/domain/enums/obras_privadas.enum';

export type ListArquivosQuery = {
  obraPrivadaId: string;
  vinculo?: VinculoArquivoPrivado;
  vinculoId?: string;
  categoria?: CategoriaArquivoPrivado;
};
