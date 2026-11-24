# Service Desk Notas

Extensão local para organizar atendimentos e gerar descrições padronizadas. Interface azul, editor com acesso direto, sem senha ou bloqueio, painel lateral e página completa com configurações compartilhadas.

## Executar

Node.js 22.12+ e pnpm 10.32.1:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Use `pnpm dev:firefox` ou `pnpm dev:edge` para os outros alvos. Sem pnpm global, substitua o prefixo por `npm exec --yes pnpm@10.32.1 --`.

## Funcionalidades atuais

- Boas-vindas na primeira instalação; não reabre automaticamente em updates.
- Um atendimento salvo automaticamente neste perfil, sem tela de senha e sem bloqueio por inatividade.
- INC/WO opcional, KBA, resumo, descrição e troubleshooting.
- Dados do colaborador em campos separados: **nome, login/matrícula, e-mail, telefone/ramal, setor, localidade e observações**.
- Título `KBA1000013 - Acesso SAP`, geração e cópia; seções e campos vazios são omitidos.
- PT-BR, inglês e espanhol; troubleshooting por linhas/texto, marcadores, temas claro/escuro/sistema e densidade.
- Reordenação de seções por arrastar, teclado ou botões; seções recolhíveis.
- Autosave após 400 ms de pausa, recuperação ao reabrir, sincronização local entre janelas e detecção de conflitos.
- Dados cifrados com AES-256-GCM; chave não exportável mantida pelo próprio navegador em IndexedDB.

**Quem usa o mesmo perfil do navegador também pode abrir os registros.** A chave local dispensa senha, mas não oferece a separação de acesso da senha mestra anterior. Não há backend, telemetria, CDN, leitura de páginas corporativas ou sincronização em nuvem pela extensão.

## Registros da versão com senha

O banco antigo `service-desk-v1` permanece intacto, com o esquema original. Se houver registros, aparece uma seção opcional de recuperação: a senha antiga só é usada uma vez para decifrar o registro anterior. Não impede o uso do editor. A recuperação preenche apenas um atendimento vazio; texto livre antigo do colaborador vai para Observações, sem truncamento. A origem não é apagada.

## Verificar e instalar

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build:all
pnpm exec playwright install chromium
pnpm test:e2e
```

Chrome: modo desenvolvedor em `chrome://extensions` → carregar sem compactação → `.output/chrome-mv3`. Edge: equivalente em `edge://extensions` → `.output/edge-mv3`. Firefox: `about:debugging#/runtime/this-firefox` → carregar temporariamente o manifest de `.output/firefox-mv3`.

Clique no ícone da extensão para abrir o painel. Use “Abrir em aba” ou “Configurações” na barra superior. Alvos iniciais: Chromium 116+ e Firefox 140+; validar painéis nativos nos navegadores finais antes de distribuir.

Histórico, vários atendimentos e editor completo de campos ainda estão planejados.

## Documentação

- [Requisitos e decisões](docs/requirements.md)
- [Arquitetura e migração](docs/architecture.md)
- [Segurança e limites](docs/security.md)
- [Desenvolvimento e testes](docs/development.md)
- [Regras do projeto](AGENTS.md)

Não usar dados corporativos reais em testes, capturas de tela ou logs.
