# Documento de Visão e Escopo

## 1. Visão do Produto (Elevator Pitch)

Votlado para viajantes que desejam planejar roteiros e controlar o orçamento de suas viagens, este sistema é um aplicativo móvel que fornece ferramentas de estruturação de itinerários e cálculo de custos.

Diferente de planilhas complexas ou aplicativos que exigem cadastros burocráticos imediatos, nosso produto oferece uma **experiência sem fricção (offline-first)**, permitindo que o usuário comece a planejar instantaneamente apenas com o aparelho, com a opção de criar uma conta posteriormente para salvar na nuvem, publicar seus roteiros para a comunidade e clonar as viagens de outros usuários.

---

## 2. Perfis de Usuário e Expectativas

### Personas

- **O Planejador Metódico (Criador):** Quer controle total sobre o que vai fazer e quanto vai gastar. É o usuário que vai gerar conteúdo de valor para a plataforma (viagens detalhadas, custos bem definidos).
- **O Explorador Pragmático (Consumidor):** Não gosta de planejar do zero. Prefere navegar no feed do aplicativo, encontrar um roteiro que caiba no seu orçamento e "cloná-lo" para adaptar às suas datas.

### O que esperam (Success Criteria)

- **Onboarding Imediato:** Capacidade de abrir o app e criar a primeira viagem rapidamente, sem barreiras de login.
- **Transparência Financeira:** Visualização clara do custo total da viagem e do custo por categoria (alimentação, transporte, hospedagem).
- **Transição Fluida (Local -> Nuvem):** Ao decidir criar a conta, os dados que estavam apenas no aparelho devem ser sincronizados perfeitamente para o servidor, sem perda de informações.
- **Reuso de Inteligência:** Capacidade de clonar um roteiro público inteiro com um clique, importando itens e estimativas de custo para sua área pessoal.

### O que NÃO esperam (Anti-goals/Fricções)

- **Bloqueio de Conectividade:** O aplicativo não pode parar de funcionar ou impedir a adição de gastos durante a viagem só porque o usuário está sem sinal de internet.
- **Perda de Dados no Sync:** Frustração extrema se, ao criar a conta, o roteiro salvo localmente for sobrescrito por um estado vazio do servidor.
- **Burocracia na Inserção de Dados:** Formulários gigantescos ou campos obrigatórios desnecessários para registrar um simples gasto.

---

## 3. Derivação de Funcionalidades e Requisitos

### Funcionalidades Épicas (Core Features)

1. **Gestão Offline-First de Viagens e Custos:** O motor principal do app, permitindo criar itinerários e registrar despesas localmente.
2. **Sincronização e Gestão de Identidade:** Módulo que gerencia a transição do usuário anônimo para autenticado e orquestra o envio de dados para a nuvem.
3. **Hub Social de Roteiros:** Vitrine pública onde usuários autenticados publicam suas viagens e clonam viagens de terceiros.

### Matriz de Rastreabilidade

- **1. Gestão Offline-First**
  - **Requisitos Funcionais (RF) Derivados:**
    - **RF01:** Permitir criação, edição e exclusão de viagens/custos sem autenticação.
    - **RF02:** Calcular dinamicamente o custo total em tempo real.
  - **Requisitos Não Funcionais (RNF) Associados:**
    - **RNF01 (Persistência):** Armazenamento em banco de dados local robusto (ex: WatermelonDB).

- **2. Sincronização e Identidade**
  - **Requisitos Funcionais (RF) Derivados:**
    - **RF03:** Cadastro via e-mail/senha ou OAuth.
    - **RF04:** Realizar o "merge" de dados locais para a nuvem após o primeiro login.
  - **Requisitos Não Funcionais (RNF) Associados:**
    - **RNF03 (Arquitetura):** Uso de filas (_background sync_) e _retry_ em falhas de rede.
    - **RNF04 (Segurança):** Tokens (JWT) no _Secure Storage_.

- **3. Hub Social**
  - **Requisitos Funcionais (RF) Derivados:**
    - **RF05:** Alternar visibilidade de viagem (Privada/Pública).
    - **RF06:** Permitir clonagem de viagem pública para repositório pessoal.
  - **Requisitos Não Funcionais (RNF) Associados:**
    - **RNF05 (Escalabilidade):** Feed com paginação (_infinite scroll_).
    - **RNF06 (Integridade):** Clonagem via _Deep Copy_ (geração de novos IDs).

---

## 4. Fora de Escopo (Out of Scope - MVP)

- **Integração com APIs de Reservas:** Sem busca/compra de passagens ou hotéis (Booking, etc.).
- **Divisão de Contas Complexa:** Sem rateio estilo _Splitwise_ no MVP.
- **Conversão de Moedas Real-time:** Sem APIs de cotação cambial ao vivo.
- **Upload de Mídia:** Sem anexo de fotos ou PDFs para economizar storage e complexidade.

---

## 5. Definições Arquiteturais e Regras de Negócio

- **RN01 - Resolução de Conflitos (Sincronização):** Modelo **Last-Write-Wins (LWW)**. Tabelas com coluna `updatedAt`. Prevalece o timestamp mais recente.
- **RN02 - Isolamento de Clonagem:** **Deep Copy estático**. Novos UUIDs para todos os registros. Sem sincronia em cascata (alterar o original não afeta o clone).
- **RN03 - Ciclo de Vida de Dados Locais (Logoff):** Alerta com duas opções:
  - **Opção A (Limpar):** Banco local expurgado (_Truncate_).
  - **Opção B (Manter):** Dados mantidos para uso offline contínuo.
- **Constraint Arquitetural (Edge Case):** Se o usuário escolher "Manter" e um _novo_ usuário logar no aparelho, o sistema fará o merge automático dos dados órfãos para esta nova conta.