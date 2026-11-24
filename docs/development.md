# Desenvolvimento e validação

Node.js 22.12+ (CI: Node 24) e pnpm 10.32.1. Windows usado na validação local. TypeScript 6.0.x respeita a faixa de compatibilidade de typescript-eslint.

## Comandos

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm dev:edge
pnpm dev:firefox
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build:all
pnpm exec playwright install chromium
pnpm test:e2e
```

Sem pnpm global, usar `npm exec --yes pnpm@10.32.1 --` como prefixo. Configure o binário Edge no runner WXT se necessário. Não relaxar CSP de produção para habilitar HMR.

Builds ficam em `.output/{chrome,edge,firefox}-mv3`. Os comandos `zip:chrome`, `zip:edge` e `zip:firefox` preparam arquivos, mas não publicam nem assinam.

## Cobertura

- **Unitários:** AES-GCM, IV, salt, chave não exportável, adulteração, AAD, geração do título/descrição, campos separados do colaborador, tradução e evento install.
- **Integração atual:** chave nativa persistida e reabertura sem senha, inicialização concorrente, conflitos, corrupção, chave ausente.
- **Compatibilidade:** leitor/escritor v1; banco original preservado, senha antiga errada, migração única, notas antigas sem truncamento e recusa de sobrescrita.
- **E2E Chromium:** onboarding, acesso direto sem senha, preenchimento de colaborador incluindo Localidade, geração, reload, sincronização e conflito; idioma/tema/ordem, ícones transparentes e permanência do editor após uma hora de inatividade simulada.

Perfis de teste são temporários e distintos dos perfis pessoais. Caminhos de remoção são conferidos antes de excluir. Traces, screenshots e vídeos não são salvos por padrão. Nunca usar dados reais nos testes.

## Resultado local — 24/11/2026

| Verificação                        | Resultado                                                            |
| ---------------------------------- | -------------------------------------------------------------------- |
| Typecheck / ESLint / Prettier      | Passaram                                                             |
| Vitest                             | 27 testes em 5 arquivos passaram                                     |
| E2E Chromium                       | 4 testes passaram                                                    |
| Builds Chrome / Edge / Firefox MV3 | Os três passaram                                                     |
| Inspeção visual                    | Página completa e painel estreito, azul e inputs separados           |
| Acesso sem senha                   | Abre diretamente, persiste após reload, sem bloqueio por inatividade |

O build atual tem aproximadamente 638 kB antes de compressão, em chunks compartilhados menores. Nenhuma permissão de páginas foi acrescentada.

## Smoke antes de publicar

1. Instalar em perfil de teste e verificar onboarding apenas no install; usar botão inicial sem criação de cofre.
2. Confirmar painel nativo e aba completa em Chrome/Edge/Firefox reais.
3. Preencher, aguardar status salvo, fechar/reabrir e conferir colaborador e Localidade.
4. Alterar entre painel/aba; confirmar atualização limpa e conflito sem sobrescrita silenciosa.
5. Testar temas, teclado, movimento reduzido, zoom 200%, leitor de tela, contraste e clipboard.
6. Num perfil de teste com dados v1, recuperar opcionalmente com senha antiga; conferir que origem/esquema permanecem intactos. Sem senha antiga, editor novo continua utilizável.
7. Conferir ausência de tráfego externo, chave bruta ou conteúdo sensível em claro nas stores/logs.

Build não equivale à execução do painel nativo em todos os navegadores. Leitor de tela e auditoria assistiva completa continuam necessários. O zoom de 200% do onboarding é testado; não representa certificação de toda a aplicação.

## Versionamento

Seguir AGENTS.md: a cada novo commit, incrementar SemVer e criar tag anotada correspondente; publicar tags junto dos commits. Nenhum commit é criado automaticamente pelo fluxo de desenvolvimento.

## Referências

- [WXT entrypoints](https://wxt.dev/guide/essentials/entrypoints.html)
- [WXT alvos de navegador](https://wxt.dev/guide/essentials/target-different-browsers.html)
- [Tailwind Vite](https://tailwindcss.com/docs/installation/using-vite)
- [shadcn/ui Vite](https://ui.shadcn.com/docs/installation/vite)
