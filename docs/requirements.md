# Requisitos consolidados

Origem: conversa “Perguntas sobre extensão” (`6b050cb7-e7d0-83e9-a906-58534ad1f19d`), recuperada em 24/11/2026, pedido de setup atual e orientação posterior sobre pasta e AGENTS.md. Respostas do usuário prevalecem sobre recomendações do assistente. O texto anterior dizia que havia encaminhado o setup, mas não havia implementação na pasta inicial; o repositório de destino tinha apenas `.git`, `.gitattributes` e `.gitignore`.

## Confirmados e situação atual

Alteração posterior explícita do usuário: interface azul, inputs redesenhados, sem senha e sem bloqueio; dados do colaborador em campos separados, incluindo **Localidade**. Essa decisão substitui o fluxo inicial de senha mestra, preservando o banco antigo para recuperação opcional.

| ID  | Requisito                                                                                 | Situação                                                                                                        |
| --- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| R01 | Chrome, Edge e Firefox com mesma base                                                     | Configurado; builds separados MV3                                                                               |
| R02 | Painel lateral e página completa interna, configurações em página própria                 | Implementado                                                                                                    |
| R03 | Sincronizar painel/aba e recuperar após fechar navegador                                  | Implementado, com acesso direto sem desbloqueio                                                                 |
| R04 | Número opcional, reconhecer INC/WO; não completar zeros/prefixos nem rejeitar por formato | Implementado; número fica na interface e armazenamento, fora da descrição                                       |
| R05 | Adaptar-se aos formatos existentes; não personalizar prefixos/quantidade de dígitos       | Sem regex restritiva; exemplos preservados como exemplos                                                        |
| R06 | Campo KBA e título/resumo no formato `KBA1000013 - Acesso SAP`                            | Implementado; sem KBA usa apenas resumo                                                                         |
| R07 | Descrição, troubleshooting e colaborador                                                  | Nome, login/matrícula, e-mail, telefone/ramal, setor, localidade e observações separados                        |
| R08 | Troubleshooting por linhas ou texto inteiro, definido nas configurações                   | Implementado                                                                                                    |
| R09 | Autosave; novo atendimento preserva o anterior; duplicar e histórico                      | Autosave implementado; ciclo de múltiplos registros planejado                                                   |
| R10 | Vários atendimentos simultâneos, configurável                                             | Registrado; não implementado neste setup                                                                        |
| R11 | Criar/excluir/renomear/reordenar seções e campos; obrigatoriedade configurável            | Reordenação das seções iniciais implementada; editor completo planejado                                         |
| R12 | Drag and drop                                                                             | dnd-kit usado na ordem das seções; teclado e botões alternativos                                                |
| R13 | Marcadores configuráveis                                                                  | `-`, `•`, `1.` implementados; marcador arbitrário ainda depende de escopo                                       |
| R14 | Omitir seções completamente vazias                                                        | Implementado; linhas vazias de listas omitidas                                                                  |
| R15 | Gerar e copiar automaticamente                                                            | Implementado com feedback e fallback selecionável se a área de transferência falhar                             |
| R16 | Claro/escuro/automático, densidade configurável, seções recolhíveis                       | Implementado; persistência do estado recolhido ainda não implementada                                           |
| R17 | PT-BR, inglês e espanhol na interface e texto gerado                                      | Implementado; dados digitados não são traduzidos                                                                |
| R18 | Sem sincronização entre computadores                                                      | Implementado: nenhum serviço de nuvem                                                                           |
| R19 | Offline/local-first, sem backend/IA, CDN, telemetria ou leitura automática de páginas     | Implementado na arquitetura e permissões                                                                        |
| R20 | Criptografia local; sem senha/bloqueio no uso atual                                       | AES-GCM com CryptoKey não exportável persistida pelo navegador; PBKDF2 somente para recuperar registros antigos |
| R21 | Nunca usar fundo exclusivo em ícones; práticas atuais de UI/UX de 2026                    | AGENTS.md e componentes ajustados; critérios verificáveis documentados                                          |

Stack solicitada: WXT, React, TypeScript, Tailwind, shadcn/ui, Dexie, Zustand, React Hook Form, Zod, dnd-kit, i18next, Lucide, Vitest, Playwright, pnpm, ESLint e Prettier. A base permanece configurada; o antigo estado de autenticação foi removido. Zustand continua instalado para estado de interface futuro, sem middleware persistente sensível.

## Respostas rastreáveis da rodada de 35 perguntas

- 1 opcional; 2 reconhecer INC/WO; 3 não completar; 4 interface e registros; 5 não validar formato; 6 não personalizar, adaptar.
- 7 múltiplos configurável; 8 sincronização entre interfaces; 9 recuperar; 10 novo atendimento salva anterior; 11 duplicar; 12 obrigatoriedade configurável.
- 13 seções personalizáveis; 14 campos personalizáveis; 15 drag and drop; 18 marcador configurável; 19 omitir seções não preenchidas.
- 22 cópia automática; 28 temas; 29 densidade; 31 recolher seções configurável; 32 português/inglês **e espanhol**; 33 Chrome/Edge (Firefox acrescentado no pedido de tecnologias/setup); 34 sem sync entre computadores; 35 página de configurações.

## Perguntas ainda abertas

Requisito adicional confirmado após o setup: abrir uma página de onboarding depois da instalação. Implementado em `onboarding.html`, apenas quando `runtime.onInstalled.reason` é `install`, sem reabertura automática em updates. A página oferece PT-BR/EN/ES, explica o uso direto sem senha e abre o editor. A seleção de idioma da página é temporária; não cria atendimento nem chave antes da ação do usuário.

Não inferir respostas apenas porque o assistente recomendou uma opção.

| Pergunta        | Pendente                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| 16 e 17         | Múltiplos modelos e valores padrão dos campos                                                                   |
| 20 e 21         | Importar/exportar configurações e restaurar padrões; formatos e confirmação                                     |
| Tipos de campos | Texto curto/longo, seleção, lista dinâmica e demais tipos permitidos                                            |
| 23–27           | Editar saída antes de copiar, prévia em tempo real, copiar por seção/tudo e formatação avançada                 |
| 30              | Atalhos de teclado e personalização                                                                             |
| Colaborador     | Campos separados implementados; personalização de campos e validações adicionais ainda depende do editor futuro |
| Histórico       | Retenção, exclusão e descarte de atendimentos; política de limpeza automática                                   |
| Backup          | Exportação/restauração cifradas e gestão de perda do perfil/chave                                               |

| Idioma inicial | PT-BR até carregar a preferência salva; idioma do onboarding independente |
| Edição simultânea | UX final de fusão/exportação da edição em conflito; setup detecta e preserva a tela local |
| Distribuição | Nome/ícones finais, IDs definitivos, lojas ou uso interno, versões mínimas oficiais |
| Limites | Máximo de registros e migração de payload único para registros independentes |

Snippets, autocomplete, cronômetro, indicadores e contagem de caracteres foram sugestões, não requisitos confirmados. Não entram neste setup.

## Critérios de conclusão desta etapa

1. Código existente inspecionado e arquivos Git preservados.
2. Dependências instaláveis com lockfile; entrypoints React compartilhados e builds separados.
3. Fluxo abrir → editar → salvar cifrado → reabrir sem senha exercitado; origem antiga preservada na recuperação opcional.
4. Nenhum campo sensível ou chave bruta em claro na persistência; chave nativa não exportável persistida. GCM rejeita adulteração. O uso do perfil não tem barreira de acesso por senha.
5. Documentação distingue recursos implementados, planejados e decisões abertas.
6. Typecheck, lint, formatação, testes e builds executados; limitações reais registradas em development.md.
