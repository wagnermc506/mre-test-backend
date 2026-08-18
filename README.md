## Descrição

API REST desenvolvida em [NestJS](https://nestjs.com/) para o teste técnico do processo seletivo do Itamaraty. Expõe um CRUD de **Notícias** (`/noticias`), com persistência em PostgreSQL via TypeORM, validação de payload com `class-validator`, testes automatizados em estilo BDD e ambiente containerizado com Docker/Docker Compose.

**Stack:** NestJS · TypeScript · TypeORM · PostgreSQL · Jest/Supertest · Docker

## Pré-requisitos

- [Node.js](https://nodejs.org/) 24+ e [Yarn](https://yarnpkg.com/)
- [Docker](https://www.docker.com/) e Docker Compose (`docker compose`) — necessário para o banco de dados, mesmo rodando o backend localmente, e para a stack completa via container

## Configuração

1. Copie o arquivo de variáveis de ambiente de exemplo:

   ```bash
   cp .env.example .env
   ```

2. Ajuste os valores em `.env` se necessário (host, porta, usuário, senha e nome do banco). Os valores padrão já são compatíveis com o `docker-compose.yaml` deste repositório.

## Executando localmente

Nesse modo, o backend roda direto na sua máquina (fora de container) e só o Postgres sobe via Docker.

1. Instale as dependências:

   ```bash
   yarn install
   ```

2. Suba apenas o banco de dados:

   ```bash
   docker compose up -d db
   ```

3. Garanta que `.env` está com `DB_HOST=localhost` (padrão do `.env.example`), já que o Postgres está exposto na porta `5432` do host.

4. Inicie a aplicação em modo watch:

   ```bash
   yarn start:dev
   ```

5. A API estará disponível em `http://localhost:3000`, com as rotas de `Noticia` em `http://localhost:3000/noticias`.

## Executando com Docker

Nesse modo, backend e banco sobem juntos como containers, definidos em `docker-compose.yaml`.

1. Suba a stack completa (build da imagem do backend incluído):

   ```bash
   docker compose up --build
   ```

   Ou em background:

   ```bash
   docker compose up --build -d
   ```

   O container `backend` já recebe `DB_HOST=db` via `environment` no `docker-compose.yaml`, apontando para o serviço `db` na mesma rede — não é preciso editar `.env` para esse modo.

2. A API estará disponível em `http://localhost:3000`.

3. Para acompanhar os logs do backend:

   ```bash
   docker compose logs -f backend
   ```

4. Para parar os containers:

   ```bash
   docker compose down
   ```

   Adicione `-v` ao comando acima caso queira também apagar o volume com os dados do Postgres.

## Testes

Nenhum teste depende de um banco de dados rodando.

```bash
# testes unitários (src/**/*.spec.ts) — hoje só o boilerplate do AppController gerado pelo Nest CLI
yarn test

# testes de integração/e2e (test/**/*.e2e-spec.ts) — sobem a aplicação Nest inteira com o
# repositório de Noticia mockado; é onde está toda a cobertura do CRUD de Noticia
yarn test:e2e

# cobertura de testes
yarn test:cov
```

## Documentação

- [Estrutura de pastas e preparação para escalar](docs/estrutura-e-escalabilidade.md)

