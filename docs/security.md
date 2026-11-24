# Segurança local sem senha

A pedido do usuário, o editor abre diretamente e não bloqueia por inatividade. Essa decisão substitui o cofre de senha mestra do setup inicial.

## Proteção atual

- AES-256-GCM por Web Crypto, tag de 128 bits, IV aleatório de 96 bits a cada escrita.
- Chave gerada por `crypto.subtle.generateKey` com `extractable: false`.
- Persistência nativa da **CryptoKey** em IndexedDB por structured clone; nenhuma chave bruta é exportada ou salva como texto.
- Todos os campos do chamado, dados do colaborador e preferências ficam em envelopes cifrados.
- AAD vincula o envelope ao tipo/versão/revisão. Zod valida a forma dos dados.
- Inicialização atômica impede salvar ciphertext com outra chave em aberturas concorrentes.
- Corrupção ou chave ausente não resultam em sobrescrita por um atendimento vazio.

Não há senha padrão escondida, senha fixa no código ou PBKDF2 com segredo constante. PBKDF2 continua apenas no leitor legado.

## Limite essencial

**Não existe controle de acesso por senha.** Qualquer pessoa ou processo com acesso ao perfil e à execução da extensão pode abrir os registros. A chave está no mesmo perfil que os dados; não prometer resistência à cópia integral do perfil nem proteção equivalente ao antigo cofre. A representação física da CryptoKey é responsabilidade do navegador e do sistema operacional; não se afirma que ela seja protegida por hardware.

A marcação não exportável impede `exportKey`, mas não impede usar a chave para decifrar no contexto autorizado. Não protege contra malware, perfil comprometido, captura de tela ou inspeção da aplicação.

Clipboard contém texto em claro depois de gerar/copiar. Histórico e sincronização do clipboard pelo sistema operacional estão fora do controle da extensão. AES-GCM detecta adulteração, mas não impede exclusão do banco ou rollback integral para uma cópia válida.

## Recuperação de dados antigos

O banco original `service-desk-v1` é mantido no esquema 1, com senha/chave apenas em memória durante a recuperação opcional. Mantém PBKDF2-HMAC-SHA-256, 600.000 iterações, salt aleatório de 16 bytes e AES-256-GCM. Referência: [OWASP PBKDF2](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).

Somente quem tem a senha antiga consegue decifrar esses registros. A ausência da senha não bloqueia o novo editor nem apaga os dados anteriores. A recuperação:

- só preenche atendimento novo vazio;
- preserva o texto antigo do colaborador integralmente em Observações;
- não altera o ciphertext nem os metadados originais;
- não persiste a senha, limpa o formulário e remove referências de sessão ao finalizar.

Strings JavaScript e memória gerenciada não permitem garantir apagamento forense. Backups/exportação e gestão de múltiplos registros continuam pendentes.

## Rede e permissões

Sem backend, IA, telemetria, CDN, content scripts ou permissões de leitura das páginas. A CSP de produção inclui `script-src 'self'`, `object-src 'none'`, `connect-src 'none'` e `base-uri 'none'`.

Permissões: clipboardWrite e sidePanel onde aplicável. Bibliotecas, fontes e traduções são locais. A extensão não sincroniza dados em nuvem; backups do perfil e políticas do sistema são externos. A pasta do código em OneDrive não é o armazenamento dos atendimentos.

Nunca registrar conteúdo de chamados, senhas ou chaves em logs, URLs, capturas de testes ou relatórios. Não alegar conformidade regulatória apenas pelo uso de criptografia.
