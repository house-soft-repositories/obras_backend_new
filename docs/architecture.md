# Arquitetura do Projeto Base API

## Visão Geral

Este projeto segue os princípios da **Clean Architecture** e **Domain-Driven Design (DDD)**, organizando o código em camadas bem definidas que promovem a separação de responsabilidades, testabilidade e manutenibilidade.

## Estrutura das Camadas

### 1. **Domain (Domínio)**

A camada de domínio contém a lógica de negócio pura e é independente de qualquer framework ou tecnologia externa.

#### **Entities (Entidades)**

- Contêm as regras de negócio fundamentais
- **NÃO são domínios anêmicos** - possuem comportamentos e validações
- Exemplo: `UserEntity` com validações de email, nome e senha

```typescript
// Exemplo de Entity com regras de negócio
export default class UserEntity {
  private constructor(private readonly props: UserEntityProps) {}

  static create(
    props: Omit<UserEntityProps, 'id' | 'createdAt' | 'updatedAt'>,
  ) {
    this.validate(props); // Validação das regras de negócio
    return new UserEntity({
      ...props,
      id: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Métodos com lógica de negócio...
}
```

#### **Use Cases (Casos de Uso)**

- Types que definem as operações de negócio
- Seguem o padrão `UseCase<Input, Output>`
- Definem contratos que serão implementados na camada de aplicação
- Cada service em `application/` implementa obrigatoriamente um contrato em `domain/usecase/`

```typescript
// Interface do Use Case
export default interface UseCase<P, R> {
  execute(param: P): AsyncResult<AppException, R>;
}

// Use Case específico
type ICreateUserUseCase = UseCase<CreateUserParam, CreateUserResponse>;
export default ICreateUserUseCase;
```

Não crie services concretos sem contrato de use case. Cada contrato específico é um `type` que referencia o `UseCase` genérico de `core/types`; o controller depende dele e o módulo registra a implementação concreta via símbolo e `useFactory`.

### 2. **Application (Aplicação)**

Camada responsável pela **implementação dos Use Cases**, orquestrando as operações de negócio.

#### **Services**

- Implementam os contratos dos Use Cases
- Coordenam chamadas para repositories e outros serviços
- Contêm a lógica de aplicação (não de negócio)

```typescript
export default class CreateUserService implements ICreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly encryptionService: IEncryptionService,
  ) {}

  async execute(
    param: CreateUserParam,
  ): AsyncResult<AppException, CreateUserResponse> {
    // Orquestração da lógica de aplicação
  }
}
```

### 3. **Adapters (Adaptadores)**

Camada que **adapta tecnologias externas** para interfaces conhecidas pelo domínio.

#### **Interfaces de Repository**

- Definem contratos para persistência de dados
- Abstraem detalhes de implementação do banco de dados

```typescript
export default interface IUserRepository {
  findOne(query: UserQueryOptions): AsyncResult<AppException, UserEntity>;
  save(user: UserEntity): AsyncResult<AppException, UserEntity>;
}
```

#### **Outros Adapters**

- Serviços de Storage
- APIs externas
- Sistemas de notificação
- Qualquer dependência externa

### 4. **Infrastructure (Infraestrutura)**

Camada que contém as **implementações concretas** dos adapters.

#### **Repositories**

- Implementações concretas dos adapters de repository
- Geralmente usando ORMs como TypeORM

```typescript
export default class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserModel)
    private userRepository: Repository<UserModel>,
  ) {}

  async findOne(
    query: UserQueryOptions,
  ): AsyncResult<AppException, UserEntity> {
    // Implementação específica do TypeORM
  }
}
```

#### **Mappers**

- Convertem entre modelos de infraestrutura e entidades de domínio
- Exemplo: `UserMapper.toEntity(userModel)`
- São obrigatórios para cada par `Entity`/`Model` persistente
- Expõem os métodos estáticos `toEntity(model)` e `toModel(entity)`
- Repositories não constroem entidades ou models diretamente

#### **Models (Read Models)**

- Modelos específicos da tecnologia de persistência
- Representam a estrutura dos dados no banco

```typescript
@Entity('users')
export default class UserModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  // Outras propriedades...
}
```

## Sistema de Injeção de Dependência

### **Symbols**

Cada módulo possui um arquivo `symbols.ts` na raiz que define as chaves para injeção de dependência:

```typescript
// symbols.ts
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
export const CREATE_USER_SERVICE = Symbol('CREATE_USER_SERVICE');
```

### **Modules**

Arquivo responsável pela configuração da injeção de dependência usando NestJS:

```typescript
@Module({
  providers: [
    {
      inject: [getRepositoryToken(UserModel)],
      provide: USER_REPOSITORY,
      useFactory: (userRepository: Repository<UserModel>) =>
        new UserRepository(userRepository),
    },
    {
      inject: [USER_REPOSITORY, EncryptionService],
      provide: CREATE_USER_SERVICE,
      useFactory: (
        userRepository: IUserRepository,
        encryption: IEncryptionService,
      ) => new CreateUserService(userRepository, encryption),
    },
  ],
})
export default class UsersModule {}
```

## Fluxo de Dados

1. **Controller** recebe a requisição
2. **Controller** chama o **Use Case** (via Service)
3. **Service** (Application) coordena a operação
4. **Service** usa **Repositories** (via interface)
5. **Repository** (Infrastructure) acessa o banco de dados
6. **Mapper** converte Model para Entity
7. **Entity** aplica regras de negócio
8. Retorno segue o caminho inverso

## DTOs e fronteira HTTP

DTOs ficam em `src/modules/<name>/dtos/` e são contratos de transporte entre a API e os controllers. Eles usam somente valores serializáveis: tipos primitivos, arrays, objetos simples e DTOs aninhados. Entities de domínio, modelos TypeORM, repositories e services não atravessam essa fronteira.

Cada campo de entrada declara validators de `class-validator` compatíveis com seu tipo (`@IsString`, `@IsNumber`, `@IsBoolean`, `@IsEmail`, `@IsUUID`, `@IsEnum`, entre outros) e suas restrições (`@IsNotEmpty`, limites e padrões). `class-transformer` normaliza dados explicitamente antes da validação, usando `@Transform(..., { toClassOnly: true })`; `@Type` é obrigatório para objetos ou arrays aninhados que precisam de transformação. Transformação não substitui validação.

Um DTO base descreve a representação pública da entidade. DTOs de criação, atualização e ações específicas o reutilizam com `OmitType`, `PickType` e `PartialType` de `@nestjs/swagger`. O DTO especializado pode reforçar decorators para a rota. Controllers convertem o DTO validado em parâmetros primitivos do use case e retornam DTOs de resposta, sem expor senha, hashes ou detalhes de infraestrutura.

O bootstrap deve usar `ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })`. Assim, o request é convertido em instância de DTO, propriedades não declaradas são recusadas e os decorators podem validar e normalizar a entrada de forma previsível.

## Tratamento de Erros

O projeto utiliza o padrão **Either** para tratamento de erros:

```typescript
type AsyncResult<E, R> = Promise<Either<E, R>>;

// Uso
const result = await userRepository.findOne(query);
if (result.isLeft()) {
  // Tratamento do erro
  return left(new ServiceException(ErrorMessages.USER_NOT_FOUND));
}
// Sucesso
const user = result.value;
```

### Códigos de erro para o cliente

`AppException` exige um `code` estável e aceita `message` apenas como detalhe opcional. Ela é exclusivamente a base técnica compartilhada: nenhum domínio ou camada deve instanciá-la ou expô-la como seu erro concreto. O cliente traduz erros pelo código, sem depender de texto vindo da API.

Todos os códigos ficam em `src/core/constants/error_code.constants.ts`, como constantes `static` em `UPPER_SNAKE_CASE`. Cada domínio deve registrar seus próprios códigos antes de implementá-los em uma exceção. Exemplos: `USER_NOT_FOUND`, `TENANCY_INVALID_SLUG` e `TENANCY_PROVISION_FAILED`.

Cada camada é proprietária das próprias exceções: `*DomainException` para regras de entidade, `*ServiceException` para falhas de aplicação e `*RepositoryException` para infraestrutura. Cada classe concreta deve estender `AppException`, definir/aceitar somente códigos de seu domínio registrados em `ErrorCodeConstants` e encaminhá-los à base. Não use `new AppException(...)` fora do core. Os testes devem verificar o código emitido para cada regra de falha, além do status e do efeito observável.

Exceções são construídas exclusivamente com parâmetros nomeados — por exemplo, `new UserRepositoryException({ code, statusCode, cause })`. Não use argumentos posicionais nem `undefined` para pular parâmetros opcionais.

## Arquitetura de Testes

Os testes seguem a mesma divisão de domínio e camadas do código de produção. Os arquivos de teste ficam em `test/modules/<module>/<layer>/`. Dados reutilizáveis e dublês não ficam em uma pasta genérica: seus caminhos identificam o módulo e a camada proprietários.

```
test/
├── constants/
│   └── <module>/<layer>/          # dados imutáveis de entrada e saídas esperadas
├── mocks/
│   └── <module>/<layer>/          # mocks tipados de um contrato adapter/use case
└── modules/
    └── <module>/<layer>/          # specs da camada testada
```

Exemplo para o domínio de usuários:

```
test/
├── constants/users/domain/entities/user.constants.ts
├── mocks/users/adapters/user_repository.mock.ts
└── modules/users/domain/user.entity.spec.ts
```

Constants contêm somente dados imutáveis que serão reutilizados. Cada mock implementa um único contrato e usa `jest.Mocked<IContract>`. Dados usados por uma única asserção podem ser definidos no próprio teste.

## Vantagens da Arquitetura

1. **Testabilidade**: Cada camada pode ser testada isoladamente
2. **Manutenibilidade**: Separação clara de responsabilidades
3. **Flexibilidade**: Fácil substituição de implementações
4. **Independência**: Domínio independente de frameworks
5. **Escalabilidade**: Estrutura que cresce de forma organizada

## Exemplo Prático: Feature de Usuários

```
src/modules/users/
├── symbols.ts                     # Símbolos para DI
├── users.module.ts               # Configuração do módulo
├── domain/
│   ├── entities/
│   │   └── user.entity.ts        # Entidade com regras de negócio
│   └── usecase/
│       └── i_create_user_use_case.ts  # Interface do caso de uso
├── application/
│   └── create_user.service.ts    # Implementação do caso de uso
├── adapters/
│   └── i_user.repository.ts      # Interface do repository
└── infra/
    ├── models/
    │   └── user.model.ts         # Modelo do banco de dados
    ├── mapper/
    │   └── user.mapper.ts        # Conversão Model ↔ Entity
    └── repositories/
        └── user.repository.ts    # Implementação do repository
```

## Diretrizes para Novas Features

1. **Comece pelo Domain**: Defina entities e use cases
2. **Implemente Application**: Crie services que implementem os use cases
3. **Defina Adapters**: Crie interfaces para dependências externas
4. **Implemente Infrastructure**: Crie implementações concretas
5. **Configure Module**: Registre dependências no módulo
6. **Use Symbols**: Defina símbolos para injeção de dependência

Esta arquitetura garante que o código seja limpo, testável e facilmente extensível, seguindo as melhores práticas de desenvolvimento de software.
