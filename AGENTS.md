# Regras do projeto

## UI e UX

- Nunca usar background exclusivo nos ícones. Não colocar círculos, quadrados, chips, placas ou fundos decorativos atrás de ícones isolados. Botões somente com ícone têm fundo transparente em todos os estados; usar cor, opacidade e contorno de foco como feedback. Botões com texto podem ter o fundo semântico da ação.
- Aplicar as boas práticas de UI e UX vigentes em 2026. Consultar fontes oficiais atuais para decisões dependentes de padrões que possam mudar; tendências visuais não equivalem a normas. Não afirmar conformidade sem validação.
- Usar WCAG 2.2 nível AA como base verificável: contraste, foco visível e não encoberto, semântica, labels, feedback acessível, idioma correto e operação completa por teclado.
- Garantir responsividade do painel lateral à página completa, zoom de 200%, ausência de rolagem horizontal para conteúdo comum, temas claro/escuro/sistema e respeito a movimento reduzido.
- Preferir alvos interativos de 44 × 44 CSS px; respeitar sempre o mínimo aplicável da WCAG. Oferecer botões e teclado como alternativas a arrastar e soltar.
- Usar Lucide com estilo consistente; controles sem texto precisam de nome acessível. Ícones decorativos usam `aria-hidden`. Não comunicar estado somente por cor.
- Preservar o trabalho do usuário: feedback de salvamento, erros recuperáveis e conflitos entre janelas sem descarte silencioso de edições.
- Permitir colagem e gerenciadores de senha. Não prejudicar acessibilidade por conveniência visual.
- Internacionalizar interface e saída em PT-BR, EN e ES; nomes próprios e exemplos técnicos podem permanecer fixos.

## Arquitetura e segurança

- Arquitetura feature-based. Entry points inicializam a aplicação; infraestrutura concentra APIs do navegador e persistência.
- Local/offline-first, sem backend, IA, telemetria, CDN, leitura de páginas corporativas ou sincronização na nuvem.
- O uso normal não deve exigir senha nem bloquear a extensão. Manter os dados cifrados com uma `CryptoKey` AES não exportável persistida pelo navegador em IndexedDB; nunca exportar/persistir chave bruta, senha ou dados sensíveis em claro nem incluí-los em logs. Essa proteção não impede acesso por quem usa o mesmo perfil. A senha anterior só pode ser solicitada em recuperação opcional de registros legados, sem impedir o uso do editor.
- Validar alterações com typecheck, lint, testes pertinentes e builds Chrome/Edge/Firefox. Distinguir build de validação real no navegador.
- Documentar questões em aberto; recomendações anteriores não são decisões confirmadas pelo usuário.

## Commits e versionamento

- A cada novo commit, atualizar a versão da extensão em `package.json` conforme Semantic Versioning (`MAJOR.MINOR.PATCH`), incluindo commits de documentação, configuração ou manutenção.
- Usar `PATCH` para correções e manutenção compatíveis, `MINOR` para novas funcionalidades compatíveis e `MAJOR` para mudanças incompatíveis. Não criar commit sem incremento de versão.
- Manter a versão dos manifests gerados alinhada à versão de `package.json`; atualizar o lockfile quando necessário.
- Criar uma tag Git anotada no formato `vX.Y.Z` para cada novo commit, com a mesma versão da extensão, apontando para esse commit. Nunca reutilizar ou mover tags publicadas.
- Ao publicar os commits no GitHub, enviar também as tags correspondentes. Não considerar o versionamento publicado enquanto as tags existirem apenas localmente.

<!-- CODEGRAPH_START -->

## CodeGraph

Se existir `.codegraph/` na raiz, usar `codegraph_explore` (ou `codegraph explore`) antes de grep, busca ou leitura de código para localização e entendimento. Não criar índice sem solicitação. Sem `.codegraph/`, usar ferramentas normais.
<!-- CODEGRAPH_END -->
