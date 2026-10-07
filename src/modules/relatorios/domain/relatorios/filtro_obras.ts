import FiltroObrasDto from '@/modules/relatorios/dtos/filtro_obras.dto';
import FiltroObrasEntity from '@/modules/relatorios/domain/entities/filtro_obras.entity';
import { LinhaObraRelatorio } from '@/modules/relatorios/domain/relatorios/relatorios_read_models';

export function normalizar(valor: string | null | undefined): string {
  return (valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function aplicarFiltroObras(
  linhas: LinhaObraRelatorio[],
  filtro: FiltroObrasDto,
): LinhaObraRelatorio[] {
  const entity = FiltroObrasEntity.fromData(filtro);
  return linhas.filter((linha) => entity.matches(linha));
}
