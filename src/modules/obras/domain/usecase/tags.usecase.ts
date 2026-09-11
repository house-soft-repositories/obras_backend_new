import type UseCase from '@/core/types/use_case';
import TagEntity from '@/modules/obras/domain/entities/tag.entity';

export interface AplicarTagsParam {
  obraId: string;
  tags: string;
}

export interface ListTagsParam {
  obraId: string;
}

export interface RemoveTagParam {
  obraId: string;
  tagId: string;
}

type ITagsUseCase = UseCase<AplicarTagsParam, TagEntity[]>;
export default ITagsUseCase;
