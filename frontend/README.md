# Roomly — Frontend

Interface do Roomly: login, cadastro e chat em tempo real. Feita em Next.js 16, com componentes [shadcn/ui](https://ui.shadcn.com) (estilo `base-nova`, sobre Base UI) e Tailwind CSS 4.

## Configuração local

Pré-requisitos: Node 20.9+ e o [backend](../backend/README.md) rodando.

```bash
yarn install
cp .env.example .env.local   # ajuste NEXT_PUBLIC_BASEURL se o backend não estiver em localhost:9000
yarn dev
```

Abra <http://localhost:3000>.

**CORS:** o backend só aceita chamadas das origens em `CORS_ORIGINS` (padrão: `http://localhost:3000`). Se a porta 3000 estiver ocupada, o Next sobe na 3001 e o navegador bloqueia as chamadas. Nesse caso, adicione a porta no `.env` do backend: `CORS_ORIGINS=["http://localhost:3000","http://localhost:3001"]`.

## Scripts

| Comando       | O que faz                                 |
| ------------- | ----------------------------------------- |
| `yarn dev`    | Servidor de desenvolvimento               |
| `yarn build`  | Build de produção (também checa os tipos) |
| `yarn start`  | Roda o build de produção                  |
| `yarn lint`   | ESLint                                    |
| `yarn format` | Formata tudo com o Prettier               |

## Bibliotecas

| Para quê                | Biblioteca                                                     |
| ----------------------- | -------------------------------------------------------------- |
| Chamadas ao backend     | `axios`: instância única em `services/axios.service.ts`        |
| Estado                  | `zustand`: um store por assunto (`*.store.ts`)                 |
| Formulários e validação | `react-hook-form` + `zod` (via `@hookform/resolvers`)          |
| Datas                   | `date-fns` (locale `pt-BR`)                                    |
| Componentes             | `shadcn/ui`, ícones `@remixicon/react`, avisos `sonner`        |
| Formatação              | `prettier` + `prettier-plugin-tailwindcss` (ordena as classes) |

## Arquitetura: feature-based

O código é organizado por **funcionalidade**, não por tipo de arquivo. Tudo o que pertence ao chat fica junto em `features/chat/`.

```
app/                      # Só rotas: cada page monta componentes de uma feature
├── (auth)/login/         # O grupo (auth) compartilha um layout sem mudar a URL
├── (auth)/register/
└── page.tsx              # / → chat (exige login)

features/
├── auth/                 # Login, cadastro, guarda de rota
├── chat/                 # Conversas, mensagens, WebSocket, presença
└── users/                # Dados de usuário e avatar

services/                 # Infraestrutura: axios.service.ts, env.service.ts
store/                    # Stores compartilhados entre features: auth.store.ts
components/ui/            # Componentes do shadcn (gerados pelo CLI)
lib/                      # Funções utilitárias: cn, datas
```

Cada feature segue a mesma estrutura, usando só o que precisa:

```
features/chat/
├── services/chat.service.ts   # Chamadas HTTP (axios)
├── store/chat.store.ts        # Estado e ações (zustand)
├── schemas/                   # Validação de formulários (zod)
├── types/chat.ts              # Tipos (espelham os schemas do backend)
├── hooks/                     # Efeitos ligados à tela (sessão, WebSocket)
├── components/                # Componentes visuais
├── lib/                       # Funções puras
└── index.ts                   # API pública da feature
```

### Regras

1. **Importe uma feature só pelo `index.ts` dela**: `import { UserAvatar } from "@/features/users"`, nunca `@/features/users/components/user-avatar`. O `index.ts` é o contrato; o resto é detalhe interno.
2. **As dependências vão numa direção só:** `app → features → services / store / lib / components/ui`. Essas pastas compartilhadas nunca importam de `features/`. Por isso o `auth.store.ts` fica em `store/`: o interceptor do axios precisa ler o token, e `services/` não pode depender de uma feature.
3. **As páginas em `app/` são finas:** só montam componentes de features.
4. **O estado fica nos stores, e os efeitos nos hooks.** O `chat.store.ts` guarda os dados e as ações. O `useChatSession` só cuida do que depende da tela estar aberta (carga inicial, WebSocket), e os componentes leem do store com seletores.

## Sessão e estado

- **Token:** fica no `useAuth` (`store/auth.store.ts`). O middleware `persist` do zustand o salva para sobreviver a um recarregamento da página. Por baixo, o `persist` grava no `localStorage` do navegador; nenhum código do app acessa o `localStorage` direto.
- **Hidratação:** o store é carregado só depois que a página monta (`skipHydration` + `AuthHydration` no layout). Assim, o HTML do servidor e a primeira renderização no navegador são iguais. Enquanto isso, `useToken()` devolve `undefined` e o guarda de rota não renderiza nada.
- **401:** o interceptor do axios limpa o token quando o backend recusa um token enviado (sessão expirada), e o guarda de rota manda o usuário para `/login`.
- **Logout:** limpa o `useAuth` e reseta o `useChatStore`, para o próximo usuário não ver os dados do anterior. Fazer logout numa aba desloga as outras.

## Como o tempo real funciona

Ao entrar, o `useChatSocket` abre um WebSocket com o backend e reconecta sozinho se a conexão cair. Quando reconecta, recarrega as conversas e a conversa aberta, porque eventos podem ter sido perdidos. Os eventos recebidos (`message`, `conversation`, `presence`) chamam as ações do `useChatStore`. O envio de mensagens é por `POST`. A mensagem enviada volta também pelo WebSocket, e o store descarta a duplicata pelo `id`.

## Adicionando componentes do shadcn

```bash
yarn shadcn add <componente>
```

Os arquivos caem em `components/ui/`. O CLI atual gera `import { cn } from "cn"`; troque por `import { cn } from "@/lib/utils"`, que é a mesma função e já está no projeto, e não deixe o pacote `cn` ser instalado.
