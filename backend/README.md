# Roomly — Backend

API do Roomly, feita em FastAPI. Usa PostgreSQL para guardar dados e Redis para saber quem está online.

## Pré-requisitos

- [uv](https://docs.astral.sh/uv/getting-started/installation/), que instala o Python 3.13 sozinho se ele faltar
- [Docker](https://docs.docker.com/get-docker/), para rodar o PostgreSQL e o Redis

## Configuração local

Rode todos os comandos dentro da pasta `backend/`.

### 1. Instale as dependências

```bash
uv sync
```

### 2. Suba o PostgreSQL e o Redis

```bash
docker run -d --name roomly-db -p 5434:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=roomly_db \
  postgres:15-alpine

docker run -d --name roomly-redis -p 6379:6379 redis:7-alpine
```

Se a porta 5434 ou a 6379 já estiver em uso na sua máquina, troque o número da esquerda (`-p 5435:5432`, por exemplo) e use a mesma porta no `.env`.

Nas próximas vezes, basta religar os containers:

```bash
docker start roomly-db roomly-redis
```

### 3. Crie o `.env`

```bash
cp .env.example .env
```

Depois, gere uma chave para o JWT e coloque o resultado em `JWT_SECRET_KEY`:

```bash
uv run python -c "import secrets; print(secrets.token_urlsafe(32))"
```

| Variável | Para que serve | Exemplo |
|---|---|---|
| `DATABASE_URL` | Conexão com o Postgres (driver `asyncpg`) | `postgresql+asyncpg://postgres:postgres@localhost:5434/roomly_db` |
| `REDIS_URL` | Conexão com o Redis | `redis://localhost:6379/0` |
| `JWT_SECRET_KEY` | Chave que assina os tokens de login | gerada pelo comando acima |
| `JWT_ALGORITHM` | Algoritmo do JWT | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Opcional. Validade do token, em minutos | `60` |
| `CORS_ORIGINS` | Opcional. Origens liberadas para o frontend | `["http://localhost:3000"]` |
| `CORS_ORIGIN_REGEX` | Opcional, para testar no celular. Libera origens por regex | `^http://(10\.\d+\|172\.(1[6-9]\|2\d\|3[01])\|192\.168)\.\d+\.\d+:3001$` |

O `.env` está no `.gitignore`. Nunca faça commit dele.

### 4. Crie as tabelas

```bash
uv run alembic upgrade head
```

### 5. Rode a API

```bash
uv run uvicorn app.main:app --reload --port 9000
```

A documentação interativa fica em <http://localhost:9000/api/docs>.

## Testando a autenticação

1. Crie uma conta em `POST /api/auth/register`.
2. Faça login em `POST /api/auth/login` e copie o `access_token` da resposta.
3. No `/api/docs`, clique em **Authorize** e cole o token.
4. As rotas protegidas, como `GET /api/user/me`, passam a funcionar.

## Chat

Há dois tipos de conversa (campo `is_group`):

- **Direta:** sempre exatamente duas pessoas. Abrir uma DM com quem você já conversa devolve a existente.
- **Grupo:** tem nome e é **público**: qualquer pessoa pode encontrar e entrar. Pode ser criado só com quem criou, e qualquer membro pode adicionar outras pessoas.

Todas as rotas exigem login.

| Rota | O que faz |
|---|---|
| `POST /api/chat/conversations/direct` | Abre a DM com alguém: `{"user_id": 2}` |
| `POST /api/chat/conversations/groups` | Cria um grupo: `{"name": "Café", "member_ids": []}` (membros opcionais) |
| `GET /api/chat/conversations/groups?search=café` | Busca grupos pelo nome (vazio = mais recentes) |
| `POST /api/chat/conversations/{id}/join` | Entra num grupo |
| `POST /api/chat/conversations/{id}/leave` | Sai de um grupo. Se você for o último membro, o grupo e as mensagens são apagados. DMs não podem ser deixadas. |
| `POST /api/chat/conversations/{id}/members` | Adiciona pessoas a um grupo de que você participa: `{"member_ids": [3, 4]}` |
| `GET /api/chat/conversations` | Lista as conversas do usuário logado |
| `GET /api/chat/conversations/{id}/messages` | Últimas 50 mensagens. Para carregar as anteriores: `?before_id=<id da mais antiga>` |
| `POST /api/chat/conversations/{id}/messages` | Envia `{"content": "..."}` |
| `GET /api/chat/online?user_ids=1&user_ids=2` | Quais desses usuários estão online, por exemplo `[2]`. Só responde sobre contatos (quem divide uma conversa com você ou é seu amigo); até 100 ids. |

Para receber eventos em tempo real, o frontend abre um WebSocket. Navegadores não permitem cabeçalhos no WebSocket, por isso o token vai na URL:

```js
const ws = new WebSocket(`ws://localhost:9000/api/chat/ws?token=${accessToken}`);
ws.onmessage = (e) => {
  const { type, data } = JSON.parse(e.data);
  // "message"      → data = mensagem nova
  // "conversation" → data = conversa nova ou atualizada (alguém entrou/foi adicionado):
  //                  trate como "insere ou substitui" pelo id
  // "conversation_removed" → data = { id } quando você sai de um grupo (avisa suas outras abas)
  // "presence"     → data = { user_id, online } quando um contato (conversa ou amigo) entra ou sai
  // "friends_changed" → data = null quando um pedido/amizade seu muda (recarregue GET /api/friends)
  // "call_state"   → data = { conversation_id, participant_ids } quando alguém entra/sai de uma chamada
  // "call_signal"  → data = { conversation_id, from, payload } sinal WebRTC vindo de outro participante
  // "call_ended"   → data = { conversation_id } a chamada continuou em outra aba sua
  // "error"        → data = { detail } um evento enviado por você foi recusado
};
```

O envio continua sendo pelo `POST`. O WebSocket só entrega eventos.

**Presença:** enquanto o WebSocket está aberto, o usuário fica online, numa chave `online:{id}` do Redis que expira em 60s e é renovada a cada 30s. Se o servidor cair, ninguém fica preso como online: a chave expira sozinha. O fluxo no frontend é chamar `GET /online` ao abrir a tela, para saber o estado inicial, e depois atualizar com os eventos `presence`.

## Senha nos grupos

Quem cria o grupo é o dono (`owner_id`). Só o dono pode colocar, trocar ou tirar a senha:

```
PUT /api/chat/conversations/{id}/password   { "password": "segredo" }   // null remove
```

Com senha, `POST /api/chat/conversations/{id}/join` precisa de `{ "password": "..." }` (senha errada → 403). Quem já é membro não é afetado, e quem está no grupo ainda pode adicionar pessoas sem senha. A resposta da conversa traz `has_password`; o hash nunca sai da API. Se o dono sai, o membro com menor id vira dono.

## Chamadas de voz e tela

Chamadas funcionam em qualquer conversa (grupo ou direta), só entre membros. O áudio e a tela vão direto entre os navegadores (WebRTC); o backend só guarda quem está em cada chamada e repassa os sinais pelo WebSocket. Cada pessoa fica em uma chamada por vez; se fechar a aba, sai dela.

Eventos que o cliente envia pelo WebSocket:

```js
ws.send(JSON.stringify({ type: "call_join", data: { conversation_id: 1 } }));
ws.send(JSON.stringify({ type: "call_leave", data: { conversation_id: 1 } }));
ws.send(JSON.stringify({ type: "call_signal", data: { conversation_id: 1, to: 2, payload: { description } } })); // ou { candidate }
```

`GET /api/chat/calls` lista as chamadas em andamento nas suas conversas (útil ao abrir a tela).

Limites: cada participante manda áudio para todos os outros (malha), o que funciona bem até umas 6 pessoas. O estado das chamadas fica na memória do processo, então a API precisa rodar com um único worker (como já acontece com o WebSocket). Em redes muito restritas, configure um servidor TURN em `NEXT_PUBLIC_ICE_SERVERS` no frontend.

## Amizade

Amizade funciona por pedido: quem recebe precisa aceitar. Há uma linha por par na tabela `friends` (`user_id` = quem pediu, `friend_id` = quem recebeu, `status` = `pending` ou `accepted`).

| Rota | O que faz |
| --- | --- |
| `GET /api/friends` | Amigos e pedidos pendentes. Cada item traz `status`, `direction` (`incoming` = pediram para você, `outgoing` = você pediu) e `user` (a outra pessoa). |
| `POST /api/friends` | Envia um pedido pelo e-mail: `{"email": "bia@email.com"}`. Se essa pessoa já tinha te pedido, vocês viram amigos na hora. Pedido repetido → 409. |
| `POST /api/friends/{id}/accept` | Aceita um pedido recebido |
| `DELETE /api/friends/{id}` | Recusa ou cancela um pedido, ou desfaz a amizade |

## Migrations

Depois de alterar um model em `app/infrastructure/database/models/`, gere e aplique uma migration nova:

```bash
uv run alembic revision --autogenerate -m "descricao da mudanca"
uv run alembic upgrade head
```

Revise sempre o arquivo gerado em `migrations/versions/` antes de aplicar: o autogenerate não detecta tudo, como renomeações de coluna. Para desfazer a última migration, use `uv run alembic downgrade -1`.

## Estrutura

O projeto segue arquitetura hexagonal (ports and adapters):

```
app/
├── domain/          # Regras de negócio: entidades, exceções e ports (interfaces)
├── application/     # Casos de uso (services), que só conhecem os ports
├── infrastructure/  # Implementações concretas: banco, Redis, JWT, hash de senha
├── presentation/    # Rotas FastAPI, schemas e injeção de dependências
└── core/            # Configuração (lida do .env)
```

Para trocar uma tecnologia, como o Redis, basta escrever outra classe em `infrastructure/` que implemente o mesmo port. Os services não mudam.

## Problemas comuns

**`Temporary failure in name resolution` ao rodar o alembic ou a API.** O host em `DATABASE_URL` não existe na sua máquina. Use `localhost` e a porta do container.

**`Connection refused`.** O container está parado. Rode `docker start roomly-db roomly-redis`.

**VS Code dizendo que não acha `fastapi` ou `sqlalchemy`.** O editor está usando outro Python. Abra `Ctrl+Shift+P` → "Python: Select Interpreter" e escolha `backend/.venv/bin/python`.
