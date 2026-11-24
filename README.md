# Service Desk Notas

Extensão de navegador para organizar atendimentos de service desk e gerar, com um clique, um texto padronizado pronto para colar no chamado.

Funciona 100% no seu navegador: sem conta, sem senha, sem servidor e sem sincronização na nuvem.

## O que ela faz

- **Painel lateral** ao lado da plataforma de atendimento, ou página completa em outra aba.
- Campos para número do chamado (INC/WO), KBA, título, descrição, troubleshooting e dados do colaborador (nome, login, e-mail, telefone, setor, localidade e observações).
- **Gerar e copiar**: monta o título (`KBA1000013 - Acesso SAP`) e a descrição organizada, e copia para a área de transferência. Seções vazias ficam de fora.
- **Salvamento automático** neste navegador, com aviso de conflito quando outra janela altera o mesmo registro.
- Português, inglês e espanhol; temas claro, escuro ou automático; densidade confortável ou compacta.
- Ordem das seções personalizável por arrastar, pelo teclado ou com os botões subir/descer.

## Instalação

A extensão ainda não está nas lojas. Você gera os arquivos e carrega no navegador em modo desenvolvedor, o que leva uns 5 minutos.

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) **22.12 ou mais recente**
- [Git](https://git-scm.com/)
- pnpm: depois de instalar o Node, rode `corepack enable` (o projeto fixa a versão certa sozinho)

### 2. Baixar e gerar a extensão

```sh
git clone https://github.com/eupsa/service-desk-notas.git
cd service-desk-notas
pnpm install --frozen-lockfile
pnpm build:all
```

Isso cria uma pasta por navegador dentro de `.output/`:

| Navegador | Pasta                 |
| --------- | --------------------- |
| Chrome    | `.output/chrome-mv3`  |
| Edge      | `.output/edge-mv3`    |
| Firefox   | `.output/firefox-mv3` |

Para gerar só um navegador: `pnpm build:chrome`, `pnpm build:edge` ou `pnpm build:firefox`.

### 3. Carregar no navegador

**Chrome** (versão 116+)

1. Abra `chrome://extensions`.
2. Ative **Modo do desenvolvedor** (canto superior direito).
3. Clique em **Carregar sem compactação** e escolha a pasta `.output/chrome-mv3`.

**Edge** (versão 116+)

1. Abra `edge://extensions`.
2. Ative **Modo de desenvolvedor**.
3. Clique em **Carregar sem pacote** e escolha a pasta `.output/edge-mv3`.

**Firefox** (versão 140+)

1. Abra `about:debugging#/runtime/this-firefox`.
2. Clique em **Carregar extensão temporária…** e escolha o arquivo `manifest.json` dentro de `.output/firefox-mv3`.

> No Firefox, a extensão temporária some quando o navegador fecha; é preciso carregá-la de novo a cada sessão.

Na primeira instalação abre uma página de boas-vindas.

### 4. Usar

1. Clique no ícone do **Service Desk** no menu de extensões (fixe-o na barra para achar mais fácil). O painel lateral abre.
2. Preencha o atendimento e clique em **Gerar e copiar**.
3. Cole o texto na sua plataforma de chamados.

No topo do painel, **Abrir em aba** leva à página completa e **Configurações** abre idioma, tema, formato do troubleshooting e ordem das seções.

### Atualizar para uma versão nova

```sh
git pull
pnpm install --frozen-lockfile
pnpm build:all
```

Depois clique em **Recarregar** (↻) no card da extensão em `chrome://extensions` ou `edge://extensions`. Seus dados são mantidos.

## Privacidade e segurança

- Os dados ficam só neste perfil do navegador, cifrados com AES-256-GCM. A chave é gerada pelo próprio navegador, não pode ser exportada e fica no IndexedDB.
- **Quem usa o mesmo perfil do navegador também consegue abrir os registros.** Não há senha nem bloqueio; use um perfil só seu.
- Sem backend, telemetria, CDN, leitura de páginas corporativas ou sincronização em nuvem.
- Não use dados corporativos reais em testes, capturas de tela ou logs.

### Registros da versão antiga (com senha)

Se você usou a versão anterior protegida por senha, o banco antigo continua intacto e aparece uma seção opcional de recuperação. A senha antiga é pedida uma única vez, só para trazer o registro para um atendimento vazio. Nada é apagado, e o editor funciona normalmente sem essa etapa.

## Problemas comuns

- **`pnpm: command not found`**: rode `corepack enable` ou use `npm exec --yes pnpm@10.32.1 --` no lugar de `pnpm`.
- **O ícone não aparece**: abra o menu de extensões (ícone de quebra-cabeça) e fixe o Service Desk.
- **Mudanças não aparecem depois de atualizar**: confirme que rodou `pnpm build:all` e clicou em **Recarregar** na página de extensões.

## Desenvolvimento

```sh
pnpm dev            # Chrome com recarga automática
pnpm dev:edge
pnpm dev:firefox
```

Antes de enviar alterações:

```sh
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm build:all
pnpm exec playwright install chromium
pnpm test:e2e
```

Ainda estão planejados: histórico, vários atendimentos e editor completo de campos.

## Documentação

- [Requisitos e decisões](docs/requirements.md)
- [Arquitetura e migração](docs/architecture.md)
- [Segurança e limites](docs/security.md)
- [Desenvolvimento e testes](docs/development.md)
- [Regras do projeto](AGENTS.md)
