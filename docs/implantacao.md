# Implantação (VPS)

## Domínios

| App | Domínio | Container |
| --- | --- | --- |
| Backend (API) | https://api.frostware.com.br | `backend` (porta `3000`) |
| Frontend | https://app.frostware.com.br | `frontend` (porta `80`) |

## Visão geral

```
                    ┌───────────────────────────────────────────┐
                    │                     VPS                    │
                    │                                             │
 Internet ── TLS ──▶│  nginx (host) + certbot                    │
                    │    api.frostware.com.br ──▶ localhost:3000 │
                    │    app.frostware.com.br ──▶ localhost:80   │
                    │              │                              │
                    │              ▼                              │
                    │  docker compose (backend + frontend + db)  │
                    └───────────────────────────────────────────┘
```

- **nginx no host** (fora dos containers) faz o *reverse proxy* de cada domínio para a porta correspondente exposta pelo `docker-compose.yml` de orquestração, e **certbot** emite/renova os certificados TLS (Let's Encrypt) para os dois domínios — a comunicação com o navegador do usuário é sempre via HTTPS; o tráfego entre o nginx do host e os containers segue em HTTP na própria VPS.
- **Containers** (backend, frontend, db) sobem via o `docker-compose.yml` descrito abaixo, que builda as imagens de produção de cada repositório (`ops/Dockerfile`) — o mesmo setup validado localmente, sem diferença de configuração entre ambiente de desenvolvimento e produção além das variáveis de ambiente.

## Onde vive o `docker-compose.yml` de orquestração

Diferente do `docker-compose.yaml` deste repositório (que sobe só `backend` + `db` para desenvolvimento local), a implantação na VPS usa um **terceiro arquivo**, fora de ambos os repositórios, numa pasta que contém os dois projetos como irmãos:

```
mre/
  mre-test-backend/    (este repositório)
  mre-test-frontend/
  docker-compose.yml   (orquestra os dois + o banco)
  .env                 (DB_PASSWORD, VITE_NOTICIAS_API_URL)
```

Esse compose builda a imagem de produção de cada app a partir do respectivo `ops/Dockerfile` — o backend usando build multi-stage sem devDependencies, e o frontend compilando os assets estáticos com Vite e servindo via nginx dentro do próprio container.

Ponto importante: `VITE_NOTICIAS_API_URL` é resolvida pelo Vite em **build-time** (fica embutida no bundle estático gerado), então na VPS ela é passada como build arg apontando para `https://api.frostware.com.br` — não é uma variável de runtime do container do frontend.

## Deploy/atualização

```bash
cd mre/
git -C mre-test-backend pull
git -C mre-test-frontend pull
docker compose up -d --build
```

O nginx e o certbot do host não fazem parte desse compose — são configurados uma única vez na VPS (fora do escopo deste repositório) e não precisam ser tocados a cada deploy, só quando um domínio novo é adicionado.
