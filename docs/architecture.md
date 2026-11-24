# Arquitetura

## Estrutura feature-based

```text
src/
  entrypoints/
    background.ts       # instalação e painel conforme navegador
    onboarding/         # boas-vindas na primeira instalação
    sidepanel/          # editor no painel lateral
    dashboard/          # editor em página completa
    options/            # configurações
  features/
    tickets/            # schemas v2, repositório local e autosave
    ticket-editor/      # React Hook Form + Zod, campos do colaborador
    description-generator/ # título e descrição, funções puras
    form-builder/       # ordem de seções, dnd-kit e alternativas
    settings/           # preferências locais, sem autenticação/bloqueio
    onboarding/         # orientação inicial sem criação de senha
    legacy-recovery/    # recuperação opcional de registros antigos
    vault/session.ts    # leitor/escritor v1 para compatibilidade
  infrastructure/
    browser/            # navegação e instalação
    database/           # Dexie, stores e erros de concorrência
    crypto/             # Web Crypto, AES-GCM e PBKDF2 legado
  shared/
    app.tsx             # composição direta, sem gate de autenticação
    components/ui/      # componentes shadcn/ui
    styles/             # tokens azuis, superfícies e inputs
    utils/
  i18n/locales/         # PT-BR, EN-US, ES
tests/
  unit/
  integration/
  e2e/
```

React, WXT, TypeScript, Tailwind, shadcn/ui, Dexie, RHF, Zod, dnd-kit, i18next e Lucide continuam na base. Zustand permanece instalado; o estado anterior de autenticação foi removido, sem persistir estado sensível em middleware.

## Armazenamento atual

Banco **service-desk-local-v2**, esquema Dexie 1, payload de workspace 2:

| Store          | Conteúdo                                                              |
| -------------- | --------------------------------------------------------------------- |
| deviceKeys     | ID fixo, CryptoKey AES não exportável e flag de recuperação concluída |
| localWorkspace | ID fixo, revisão e envelope cifrado com atendimento e preferências    |

A primeira abertura gera chave e payload inicial fora da transação; uma transação compara a existência e grava ambos atomicamente. Aberturas concorrentes reutilizam a chave vencedora. Falta de chave ou ciphertext inconsistente gera erro recuperável, nunca reset silencioso.

AES-GCM usa AAD `local-workspace:2:<revision>`. Comparação de revisão ocorre na mesma transação da escrita; uma janela atrasada recebe conflito. O hook de autosave serializa atualizações, aguarda 400 ms e mantém edições locais na tela quando há conflito.

O formulário e o gerador compartilham a lista de campos do colaborador: nome, login, e-mail, telefone, setor, localidade e observações. Apenas valores preenchidos são incluídos no texto. Localidade ausente em payload v2 anterior recebe string vazia, sem descartar os demais campos.

Não existem senha, chave derivada de senha, timer de inatividade, sessão desbloqueada ou botão de bloquear no fluxo atual. A chave é recuperada automaticamente do IndexedDB por cada página.

## Migração sem apagar a origem

A decisão posterior do usuário de remover senha/bloqueio substitui o requisito inicial de senha mestra.

1. O banco **service-desk-v1** continua com esquema Dexie 1 e tabelas `vault` e `workspace` originais. Não é atualizado, removido ou renomeado.
2. O novo editor grava em outro banco. Usuários sem dados anteriores começam diretamente.
3. Existindo cofre antigo, uma seção opcional permite fornecer a senha antiga para recuperação única.
4. O leitor v1 usa PBKDF2/AES-GCM originais. A migração converte o texto antigo do colaborador para Observações e remove apenas a preferência obsoleta de autoLock do novo payload.
5. A recuperação só grava se o atendimento atual está vazio e a revisão continua válida; nunca sobrescreve edição concorrente. Conclui a flag e o novo registro atomicamente.
6. Senha errada, falha ou tentativa repetida não apagam nenhuma origem.

**Rollback:** a versão anterior da extensão continua capaz de ler o banco original com a senha antiga, pois nome, esquema e ciphertext permanecem intactos. Alterações novas ficam no banco v2 e não são retropropagadas. Não há fusão automática entre clientes antigos e novos; não remover bancos para fazer rollback.

## UI

Azul semântico nos temas claro/escuro, campos com superfícies próprias, bordas arredondadas, foco destacado e labels persistentes. Painel estreito usa uma coluna; campos do colaborador passam a duas colunas em largura maior. Ícones isolados têm fundo transparente.

Base de acessibilidade: [WCAG 2.2](https://www.w3.org/TR/WCAG22/). Meta AA, sem alegação de certificação. Validar teclado, leitores de tela e contraste antes de publicar.
