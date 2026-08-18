# Estrutura de pastas e preparação para escalar

## Estrutura por módulo de domínio (`src/noticia/`)

```
src/noticia/
  entities/noticia.entity.ts   → modelo de persistência (TypeORM)
  dto/create-noticia.dto.ts    → contrato de entrada + regras de validação
  dto/update-noticia.dto.ts
  noticia.controller.ts        → camada HTTP (rotas, status codes)
  noticia.service.ts           → regra de negócio + acesso a dados
  noticia.module.ts            → composição/DI do módulo
```

Cada recurso do domínio (`Noticia`, e futuramente outros) vive em sua própria pasta autocontida, seguindo o padrão de **feature modules** do Nest, em vez de agrupar por camada técnica (`controllers/`, `services/`, `entities/` soltos na raiz). Isso importa para escalar porque:

- **Adicionar um novo recurso não toca em código existente.** Para um novo domínio (ex. `Usuario`, `Categoria`), basta criar `src/usuario/` no mesmo molde e importar o `UsuarioModule` em `AppModule` — nenhum arquivo de `Noticia` é modificado. Isso é o princípio aberto/fechado aplicado à arquitetura: crescimento por adição, não por edição.
- **Times/PRs não colidem.** Se o projeto crescer para mais de um desenvolvedor, cada um mexe na pasta do seu domínio sem gerar conflito de merge nos mesmos arquivos.
- **Um módulo pode ser extraído depois.** Se `Noticia` crescer a ponto de justificar virar um microsserviço separado, a pasta já é a unidade de corte natural — controller, service, dto e entity já estão isolados.

## Separação em camadas dentro do módulo

- **`entities/`** — só descreve a forma dos dados persistidos, sem lógica.
- **`dto/`** — define e valida o que entra pela API (`class-validator`), isolado do modelo de persistência. Isso permite que o formato aceito na API e o formato salvo no banco evoluam de forma independente.
- **`controller`** — só traduz HTTP ↔ chamadas de serviço, sem regra de negócio.
- **`service`** — concentra a regra de negócio e fala com o `Repository` via injeção de dependência (`@InjectRepository`), nunca acessando o banco diretamente.

Essa separação é o que permite mockar o `Repository` inteiro nos testes sem subir Postgres: como o service depende de uma interface injetada (não de uma conexão concreta), qualquer implementação (real ou mock) pode ser trocada sem alterar controller/service. Se amanhã o projeto trocar TypeORM por outro ORM, ou adicionar cache antes do banco, a mudança fica isolada no service/repository, sem vazar para controller ou DTOs.

## Configuração centralizada (`ConfigModule` + `.env`/`.env.example`)

Variáveis de ambiente (host, porta, credenciais do banco) não estão hardcoded — vêm de `.env`, carregado via `@nestjs/config` e injetado por `ConfigService`. Isso prepara o projeto para múltiplos ambientes (dev, teste, produção) sem alterar código: cada ambiente só precisa de um `.env` diferente. O `.env.example` documenta quais variáveis existem sem expor segredo real.

## Testes: unitário colado ao código vs. e2e em pasta própria

- `src/**/*.spec.ts` (padrão Nest) fica ao lado do código, sem necessidade de infraestrutura — roda rápido, em qualquer pipeline, sem serviço de banco.
- `test/**/*.e2e-spec.ts` fica separado, com sua própria config de Jest (`test/jest-e2e.json`), pensado para testes que sobem a aplicação inteira.

Essa divisão permite que a suíte cresça em dois eixos independentes: testes unitários (rápidos, muitos, rodam a cada commit) e testes de integração/e2e (mais caros, podem rodar em um estágio separado da pipeline) sem que um tipo de teste comece a depender do outro.

## Containerização (`Dockerfile` + `docker-compose.yaml`)

Separar `backend` e `db` como serviços independentes no compose prepara para escalar horizontalmente a infraestrutura: novos serviços (cache, fila, outro microsserviço) entram como blocos adicionais no mesmo arquivo, sem reestruturar o que já existe. Também garante paridade de ambiente entre máquinas de desenvolvimento e CI.

## Validação global (`ValidationPipe` em `main.ts`)

Ativada uma vez, no bootstrap, e vale para qualquer controller/DTO criado depois. Novos endpoints herdam automaticamente `whitelist`, `forbidNonWhitelisted` e `transform` sem precisar repetir configuração — reduz a chance de um novo módulo esquecer de validar input.
