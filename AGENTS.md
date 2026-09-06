@RTK.md

## Git commits

Não crie commits, não adicione arquivos ao índice Git e não envie alterações ao repositório remoto sem autorização explícita do usuário para aquele momento.

## Build and Test

**Validação preferencial via Docker (ambiente canônico):**

```bash
docker compose up --build -d api   # rebuilda e sobe o container da API
docker compose logs -f api         # verificar se o container subiu corretamente
docker compose exec api pnpm test
docker compose exec api pnpm test -- test/modules/<name>/<file>.spec.ts
docker compose exec api pnpm run test:e2e
docker compose exec api pnpm run test:e2e -- test/modules/<name>/<file>.e2e-spec.ts
docker compose exec api pnpm run test:integration
docker compose exec api pnpm run test:integration -- test/modules/<name>/<layer>/<file>.spec.ts
docker compose exec api pnpm run build
```

Sempre que possível, rode os testes dentro do container `api`, pois ele usa o mesmo ambiente de dependências/serviços do desenvolvimento Docker. Use `docker compose logs api` ou `docker compose logs -f api` quando precisar confirmar boot, erros de runtime ou estado do container.

**Fallback local (sem Docker):**

```bash
pnpm install          # instalar dependências
pnpm run build        # compilar para dist/ (NestJS CLI)
pnpm run start:dev    # desenvolvimento com hot-reload (sem Docker: localhost:3000)
pnpm test             # rodar suite Jest
pnpm test -- test/modules/<name>/<file>.spec.ts
pnpm run test:watch   # modo watch ao iterar em specs
pnpm run test:e2e     # testes e2e (jest-e2e.json)
pnpm run test:integration # testes de integração (jest-integration.json)
pnpm run lint         # ESLint + Prettier fix
```

**Checklist antes de abrir PR:** preferir `docker compose up --build -d api && docker compose exec api pnpm run build && docker compose exec api pnpm run lint && docker compose exec api pnpm test`.

## Architecture

**Clean Architecture + Domain-Driven Design (DDD).**

Documentação completa e conceitos fundamentais em [docs/architecture.md](docs/architecture.md):

- Estrutura de camadas (Domain, Application, Infra, Presentation)
- Entidades ricas com validações de negócio
- Use cases como contratos
- Separation of concerns

Stack: NestJS v11, TypeORM 0.3, PostgreSQL 16, `class-validator`/`class-transformer`, `@nestjs/swagger`.

Módulos ativos registrados em `src/app.module.ts`:
`CoreModule, UsersModule, AuthModule, DocumentTypeModule, ActivitiesModule, AttachmentsModule, FileModule, ImovelModule, ProcessoModule, ProcuradorModule, SetorModule, MovimentoProcessoModule`

Cada módulo em `src/modules/<name>/` segue este layout fixo:

```
symbols.ts           ← tokens Symbol para DI
<name>.module.ts     ← NestJS providers via useFactory (nunca useClass)
adapters/            ← interfaces de repositórios e serviços externos (contratos)
application/         ← implementações concretas dos use cases (Services implementam contratos de domain/usecase/)
controller/          ← controllers HTTP NestJS
domain/
  entities/          ← entidades ricas com factory estático + validações
  usecase/           ← types dos use cases (contratos)
dtos/                ← request/response DTOs
exceptions/          ← domain e repository exceptions do módulo
infra/
  mapper/            ← Entity ↔ TypeORM Model (métodos estáticos)
  models/            ← classes @Entity TypeORM
  query/             ← query objects tipados
  repositories/      ← implementações concretas dos adapters
```

## Code Style

| Elemento                               | Convenção                               | Exemplo                                 |
| -------------------------------------- | --------------------------------------- | --------------------------------------- |
| Arquivos                               | `snake_case`                            | `create_user.service.ts`                |
| Classes/Interfaces                     | `PascalCase`                            | `CreateUserService`                     |
| Interfaces adapter / types de use case | prefixo `I`                             | `IUserRepository`, `ICreateUserUseCase` |
| Symbols DI                             | `UPPER_SNAKE_CASE`                      | `CREATE_USER_SERVICE`                   |
| Entidades de domínio                   | sufixo `Entity`                         | `UserEntity`                            |
| Modelos TypeORM                        | sufixo `Model`                          | `UserModel`                             |
| Mappers                                | sufixo `Mapper`                         | `UserMapper`                            |
| Imports                                | alias `@/` → `src/`, `@test/` → `test/` | `@/core/types/either`                   |

## Project Conventions

### Entidades: factory estático obrigatório, construtor privado

```typescript
export default class UserEntity {
  private constructor(private readonly props: UserEntityProps) {}

  // `create*` valida e gera id — lança *DomainException (400) diretamente
  static createUserWithRoleUser(props: ...): UserEntity {
    this.validate(props);
    return new UserEntity({ ...props, id: crypto.randomUUID(), createdAt: new Date() });
  }

  // `fromData` reconstitui do banco SEM validação
  static fromData(props: UserEntityProps): UserEntity { return new UserEntity(props); }

  // Getters para cada prop (props imutável via private readonly)
  get id() { return this.props.id; }
}
```

Referência: `src/modules/users/domain/entities/user.entity.ts`

### AsyncResult / Either em todos os use cases e repositórios

```typescript
// src/core/types/async_result.ts
type AsyncResult<L extends AppException, R> = Promise<Either<L, R>>;

// Either: left = falha, right = sucesso
// Métodos disponíveis: .isLeft(), .isRight(), .when({ onSuccess, onFailure }), .map(), .onSuccess(), .onFailure(), .getOrThrow()

// Padrão no application service:
async execute(param): AsyncResult<AppException, Response> {
  try {
    const found = await this.repo.findOne({ email: param.email });
    if (found.isRight()) return left(new ServiceException(ErrorMessages.ALREADY_EXISTS, 409));
    if (found.isLeft() && !(found.value instanceof RepoNotFoundException))
      return left(found.value); // propaga erro inesperado do repo

    const entity = MyEntity.create(param); // lança DomainException se inválido
    const saved = await this.repo.save(entity);
    if (saved.isLeft()) return left(saved.value);
    return right(new MyResponse(saved.value));
  } catch (error) {
    if (error instanceof AppException) return left(error); // captura DomainException
    return left(new AppException(ErrorMessages.UNEXPECTED_ERROR, 500, error));
  }
}
```

Referência: `src/modules/users/application/create_user.service.ts`

### Services de application implementam contratos de use case

Todo service em `application/` DEVE implementar um contrato correspondente em `domain/usecase/`. O contrato é um `type` que referencia o `UseCase` genérico de `core/types`, não uma interface duplicada. Não crie services concretos sem contrato: o controller injeta o símbolo do use case, e o módulo fornece a implementação via `useFactory`.

```typescript
// domain/usecase/create_tenancy.usecase.ts
type ICreateTenancyUseCase = UseCase<CreateTenancyParam, TenancyEntity>;
export default ICreateTenancyUseCase;

// application/create_tenancy.service.ts
export default class CreateTenancyService implements ICreateTenancyUseCase {
  async execute(
    param: CreateTenancyParam,
  ): AsyncResult<AppException, TenancyEntity> {
    // ...
  }
}
```

### Repositórios: try/catch → left/right (nunca throw)

```typescript
async findOne(query: QueryOptions): AsyncResult<AppException, MyEntity> {
  try {
    const model = await this.repo.findOneOrFail({ where: { ... } });
    return right(MyMapper.toEntity(model));
  } catch (error) {
    if (error instanceof EntityNotFoundError)
      return left(new MyRepositoryNotFoundException()); // 404
    return left(new MyRepositoryException(ErrorMessages.UNEXPECTED_ERROR, 500, error));
  }
}
```

Referência: `src/modules/users/infra/repositories/user.repository.ts`

### Controllers: @Inject(SYMBOL) + left → HttpException

```typescript
@Controller('api/my-resource')
export default class MyController {
  constructor(
    @Inject(MY_SERVICE_SYMBOL) private readonly service: IMyUseCase,
  ) {}

  @Get()
  async findAll(@Query() dto: FilterDto) {
    const result = await this.service.execute(dto);
    if (result.isLeft())
      throw new HttpException(result.value.message, result.value.statusCode, {
        cause: result.value.cause,
      });
    return result.value; // ou result.value.fromResponse()
  }
}
```

Referência: `src/modules/users/controller/tipo_pessoa.controller.ts`

### File Uploads: FileInterceptor vs FileFieldsInterceptor

**Um arquivo (DocumentFile):**

```typescript
@Post()
@UseGuards(AuthGuard)
@UseInterceptors(FileInterceptor('documentFile'))
async create(@UploadedFile() file: Express.Multer.File, @Body() body: CreateDto) {
  // file.buffer, file.originalname, file.mimetype, file.size
}
```

**Múltiplos arquivos (perimetroImovel + documento):**

```typescript
@Post()
@UseGuards(AuthGuard)
@UseInterceptors(
  FileFieldsInterceptor([
    { name: 'documentFile', maxCount: 1 },
    { name: 'perimetroImovelFile', maxCount: 1 },
  ]),
)
async create(
  @UploadedFiles()
  files: {
    documentFile?: Express.Multer.File[];
    perimetroImovelFile?: Express.Multer.File[];
  },
  @Body() body: CreateDto,
) {
  if (!files.documentFile?.[0])
    throw new HttpException('Arquivo documento é obrigatório', 400);
  if (!files.perimetroImovelFile?.[0])
    throw new HttpException('Arquivo perímetro é obrigatório', 400);

  const doc = files.documentFile[0];
  const perimetro = files.perimetroImovelFile[0];
  // Passar para service.execute() como BaseFileInterface
}
```

Referências:

- Único arquivo: `src/modules/procurador/controller/procurador.controller.ts`
- Múltiplos: `src/modules/imovel/controller/imovel.controller.ts`
- Geoprocessamento: `src/modules/geoprocessing/controller/geoprocessamento.controller.ts`

### DI com Symbols + useFactory (sem @Injectable nas classes de domínio/aplicação)

```typescript
// symbols.ts
export const MY_REPOSITORY = Symbol('MY_REPOSITORY');
export const MY_SERVICE = Symbol('MY_SERVICE');

// my.module.ts
providers: [
  {
    provide: MY_REPOSITORY,
    inject: [getRepositoryToken(MyModel)],
    useFactory: (repo: Repository<MyModel>) => new MyRepository(repo),
  },
  {
    provide: MY_SERVICE,
    inject: [MY_REPOSITORY],
    useFactory: (repo: IMyRepository) => new MyService(repo),
  },
];
// exports: array de Symbols, não de classes
```

`TypeOrmModule.forFeature([MyModel])` é obrigatório para usar `getRepositoryToken(MyModel)`.

Referência: `src/modules/users/users.module.ts`

### Mappers com métodos estáticos (abstract class nunca instanciada)

```typescript
export default abstract class MyMapper extends BaseMapper<MyEntity, MyModel> {
  static toEntity(model: MyModel): MyEntity { return MyEntity.fromData({ id: model.id, ... }); }
  static toModel(entity: MyEntity): Partial<MyModel> { return { id: entity.id, ... }; }
}
```

Referência: `src/modules/users/infra/mapper/user.mapper.ts`

Todo módulo persistente DEVE ter um mapper para cada par Entity/Model. O mapper implementa `toEntity(model)` e `toModel(entity)`; repositories nunca montam objetos de domínio ou TypeORM manualmente fora dele.

### Hierarquia de exceções

```
AppException(code, statusCode, message?, cause?)    ← base, estende Error
├── *DomainException(400)   ← throw dentro de Entity.create()
├── ServiceException(400)   ← return left() no application service
└── *RepositoryException(500)  ← return left() no infra/repository
    └── *RepositoryNotFoundException(404)
```

`code` é obrigatório e `message` é opcional. `AppException` é apenas a base técnica: nunca a instancie diretamente fora do core. Cada camada é proprietária de suas exceções concretas (`*DomainException`, `*ServiceException` e `*RepositoryException`), que estendem `AppException`; cada domínio declara seus códigos em `src/core/constants/error_code.constants.ts` e suas exceções só retornam códigos registrados ali. O frontend usa o código, não a mensagem, para traduzir o erro. Use nomes estáveis em `UPPER_SNAKE_CASE`, por exemplo `USER_NOT_FOUND`, `TENANCY_INVALID_SLUG` e `TENANCY_PROVISION_FAILED`.

Construa exceções com um objeto de parâmetros nomeados, por exemplo `new UserServiceException({ code, statusCode, cause })`; nunca use argumentos posicionais ou `undefined` como preenchimento.

Ao criar uma nova exceção de domínio, serviço ou repositório:

1. Adicione o código correspondente a `ErrorCodeConstants`.
2. Faça a exceção receber e propagar esse código para `AppException`.
3. Teste o código retornado, além do status HTTP e do comportamento de falha.

### DTOs: fronteira HTTP, validação e transformação

DTOs pertencem a `src/modules/<name>/dtos/` e são a fronteira entre HTTP e o controller. Eles não representam entidades de domínio nem modelos TypeORM: contêm somente dados serializáveis e tipos primitivos, arrays e outros DTOs aninhados. Não aceite `Entity`, `Model`, `Date` de domínio, repository ou service em DTO.

Todo campo recebido pela API deve declarar o validador `class-validator` correspondente, como `@IsString()`, `@IsNumber()`, `@IsBoolean()`, `@IsEmail()`, `@IsUUID()`, `@IsEnum()`, `@IsArray()` e `@ValidateNested()`. Combine-o com restrições de formato e negócio da fronteira, por exemplo `@IsNotEmpty()`, `@MinLength()`, `@MaxLength()`, `@Min()`, `@Max()` e `@Matches()`. Use `@IsOptional()` apenas para campos realmente opcionais.

Use `class-transformer` somente para normalização de entrada e conversão explícita: `@Transform(..., { toClassOnly: true })` para `trim`, lowercase ou conversão segura; `@Type(() => NestedDto)` para objetos/arrays aninhados e valores numéricos/datas quando o contrato HTTP exigir. A transformação não substitui validação. Campos normalizados devem continuar validados.

O DTO base descreve a forma pública primitiva da entidade. Especializações reutilizam os mapped types de `@nestjs/swagger`: `OmitType` para remover campos não aceitos, `PickType` para operações estreitas e `PartialType` para atualização. A classe derivada declara os decorators adicionais ou mais restritivos do endpoint. Use `as const` na lista de campos.

```typescript
class CreateUserDto extends OmitType(UserDto, [
  'id',
  'createdAt',
  'updatedAt',
] as const) {
  @Transform(({ value }) => value.trim().toLowerCase(), { toClassOnly: true })
  @IsEmail()
  declare email: string;
}
// Forçar role via @Equals no DTO especializado
class CreateUserWithRoleUserDto extends CreateUserDto {
  @Equals(USER_ROLE.USER) declare role: USER_ROLE;
}

class UpdateUserDto extends PartialType(CreateUserDto) {}
```

Controllers recebem DTOs, convertem-nos para o parâmetro primitivo do use case e nunca passam o DTO como entidade. Respostas devem expor DTOs de resposta ou objetos primitivos deliberados, sem senha, hash, token interno ou campos de infraestrutura. Configure `ValidationPipe` global com `transform: true`, `whitelist: true` e `forbidNonWhitelisted: true` antes de expor endpoints que recebem DTOs.

### TypeORM Models: herdar BaseModel correto

- UUID gerado pela entidade (não pelo banco): estenda `BaseModelPrimaryColumnUuid`
- ID autoincrement: estenda `BaseModelIdGeneratedIncrement`

Referência: `src/core/interface/base_model.ts`

### Validators de domínio

Classes com `static validate(value): boolean` em `src/core/validators/`. Nunca instanciar — use direto nas entities: `if (!EmailValidator.validate(props.email)) throw new UserDomainException(...)`.

### File Handling em Services

Serviços que lidam com uploads seguem este padrão:

```typescript
export class CreateImovelService implements ICreateImovelUseCase {
  constructor(
    private readonly unitOfWork: IUnitOfWork,
    private readonly uploadFileUseCase: IUploadFileUseCase, // injeta use case de upload
    private readonly attachmentUseCase: ICreateAttachmentUseCase,
  ) {}

  async execute(
    param: CreateImovelParam, // pode conter: documentFile e perimetroImovelFile como BaseFileInterface
    user: UserProps,
  ): AsyncResult<AppException, CreateImovelResponse> {
    // 1. Upload arquivo de documento
    const uploadResult = await this.uploadFileUseCase.execute({
      id: crypto.randomUUID(),
      buffer: param.documentFile.buffer,
      mimetype: param.documentFile.mimetype,
      originalName: param.documentFile.originalName,
      size: param.documentFile.size,
      encoding: param.documentFile.encoding,
    });

    if (uploadResult.isLeft()) {
      await this.unitOfWork.rollback();
      return left(uploadResult.value); // propaga erro do upload
    }

    // 2. Upload arquivo de perímetro (shapefile/KML)
    const perimetroUploadResult = await this.uploadFileUseCase.execute({
      id: crypto.randomUUID(),
      buffer: param.perimetroImovelFile.buffer,
      mimetype: param.perimetroImovelFile.mimetype,
      originalName: param.perimetroImovelFile.originalName,
      size: param.perimetroImovelFile.size,
      encoding: param.perimetroImovelFile.encoding,
    });

    if (perimetroUploadResult.isLeft()) {
      await this.unitOfWork.rollback();
      return left(perimetroUploadResult.value);
    }

    // 3. Criar entidade com URLs dos uploads
    const entity = MyEntity.create({
      name: param.name,
      documentoUrl: uploadResult.value.fileName, // retorna path do arquivo
      perimetroImovel: perimetroUploadResult.value.fileName, // armazena como string URL
      // ... outros campos
    });

    // 4. Salvar e criar attachment (rastrear arquivo)
    const saveResult = await repository.save(entity);
    if (saveResult.isLeft()) return left(saveResult.value);

    const attachmentResult = await this.attachmentUseCase.execute({
      entityId: saveResult.value.id,
      fileUrl: [
        uploadResult.value.fileName,
        perimetroUploadResult.value.fileName,
      ],
      scope: ATTACHMENT_SCOPE.MY_ENTITY,
      unitOfWork: this.unitOfWork,
    });

    // ... retornar resultado
  }
}
```

**Formulário esperado do cliente (multipart/form-data):**

```
documentFile: <binary file>
perimetroImovelFile: <binary file (.zip, .rar, ou .kml)>
name: "Nome do Imóvel"
...outros campos
```

## Testing

- Testes em `test/modules/<name>/<layer>/`. Fixtures em `test/constants/<name>/<layer>/` e mocks em `test/mocks/<name>/<layer>/`, espelhando o módulo e a camada de `src/modules/` que possuem o contrato ou dado representado.
- Constants contêm dados imutáveis reutilizáveis; mocks implementam um único contrato tipado. Dados exclusivos de uma asserção podem permanecer no próprio teste.
- **Sem `@nestjs/testing`** — services instanciados diretamente com mocks `jest.fn()`.
- Mocks tipados como `jest.Mocked<IMyInterface>`.

```typescript
describe('MyService', () => {
  let service: MyService;
  let repo: jest.Mocked<IMyRepository>;

  const mockRepo = (): jest.Mocked<IMyRepository> => ({
    save: jest.fn(), findOne: jest.fn(),
  } as unknown as jest.Mocked<IMyRepository>);

  beforeEach(() => {
    repo = mockRepo();
    service = new MyService(repo);
  });

  describe('happy path', () => {
    it('should ...', async () => {
      repo.findOne.mockResolvedValue(left(new MyRepositoryNotFoundException()));
      repo.save.mockResolvedValue(right(myEntity));
      const result = await service.execute(param);
      expect(result.isRight()).toBe(true);
    });
  });

  describe('error cases', () => { ... });
});
```

**Com File Upload (multiple mocks para cada upload):**

```typescript
describe('CreateImovelService', () => {
  let mockUploadFileUseCase: jest.Mocked<IUploadFileUseCase>;

  beforeEach(() => {
    mockUploadFileUseCase = { execute: jest.fn() } as any;
  });

  it('should upload document and perimetro files', async () => {
    // Mock PRIMEIRO upload (documento)
    mockUploadFileUseCase.execute.mockResolvedValueOnce(
      right(new UploadFileResponse('document.pdf')),
    );
    // Mock SEGUNDO upload (perímetro)
    mockUploadFileUseCase.execute.mockResolvedValueOnce(
      right(new UploadFileResponse('perimetro.zip')),
    );

    const result = await service.execute({
      documentFile: { buffer: Buffer.from(...), ... },
      perimetroImovelFile: { buffer: Buffer.from(...), ... },
      // ... outros dados
    }, user);

    expect(result.isRight()).toBe(true);
    // Validar que ambos os uploads foram chamados
    expect(mockUploadFileUseCase.execute).toHaveBeenCalledTimes(2);
  });
});
```
