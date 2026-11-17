# Oba Comida Admin — Painel Administrativo Central

Painel administrativo central da plataforma de marketplace e delivery **Oba Comida**.

Desenvolvido em **React 19 + TypeScript + Vite + Tailwind CSS**, preparado para operação em larga escala com simulação completa de perfis de acesso (RBAC), moderação de estabelecimentos, customização de paleta de cores por loja, gerenciamento flexível de domínios, comissões, pedidos, categorias, produtos e auditoria.

---

## 🚀 Funcionalidades Principais

* **📊 Dashboard Analítico:** GMV (Faturamento Bruto), receita estimada da plataforma, comissões retidas, volume de pedidos, ticket médio e gráficos de evolução temporal com filtros de período.
* **🏪 Gestão e Moderação de Estabelecimentos:**
  * Fluxo completo de homologação: *Pendente*, *Em análise*, *Aprovado*, *Ativo*, *Suspenso*, *Reprovado*.
  * Definição de taxas e comissões personalizadas por loja.
  * Histórico detalhado de auditoria de alterações por loja.
* **🎨 Temas e Paletas de Cores por Loja:**
  * Customização de cor primária e secundária da loja para refletir a identidade visual no App (ex: açaí, hamburgueria, pizzaria, oriental, churrascaria).
  * Presets inteligentes baseados na categoria cadastrada.
* **🔗 Links Oficiais Dedicados & Configuração de Domínios:**
  * Geração e cópia de links para o consumidor (`/{slug}-app`) e lojista (`/{slug}`).
  * Gerador de QR Code de mesa/balcão para impressão.
  * **Central de Domínios Globais (`Settings`):** configure qualquer domínio (produção, subdomínio, Vercel ou localhost) sem travar a aplicação em URLs fixas.
* **👥 Gestão de Usuários & Controle de Acesso (RBAC):**
  * Gestão de consumidores (pedidos, endereços fictícios, status).
  * Gestão de usuários internos da equipe com 4 perfis de permissão:
    * **Superadministrador:** Acesso irrestrito e configurações globais.
    * **Administrador:** Gestão de restaurantes, usuários, pedidos e relatórios.
    * **Operador:** Consulta e intervenção operacional de pedidos.
    * **Financeiro:** Faturamento, comissões e repasses.
* **📦 Central de Pedidos:** Acompanhamento de pedidos em tempo real com filtros por status, forma de pagamento, restaurante e intervenção operacional administrativa.
* **🏷️ Categorias Globais & Produtos:** Gerenciamento da árvore de categorias do marketplace, ícones, imagens e ordem de exibição.
* **💰 Financeiro & Repasses:** Relatórios de comissões da plataforma e repasses aos lojistas.
* **🛡️ Auditoria, Suporte & Chamados:** Trilha de auditoria rastreando todas as ações administrativas críticas e central de tickets de suporte.

---

## 🛠️ Tecnologias Utilizadas

* **React 19** com **TypeScript**
* **Vite** para compilação ultrarrápida
* **Tailwind CSS** para estilização moderna e responsiva
* **Lucide React** para ícones consistentes
* **LocalStorage Reativo** com padrão pub/sub para persistência local de dados mockados e integrável com API FastAPI

---

## 💻 Como Rodar o Projeto

1. Clone o repositório:
```bash
git clone https://github.com/antonioreboucas/obacomida-admin.git
cd obacomida-admin
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

4. Abra no navegador:
```text
http://localhost:3000
```

---

## 🔑 Contas Administrativas de Teste (Demonstração)

Você pode alternar os perfis diretamente na tela de login ou pelo seletor no cabeçalho:

| Perfil | E-mail | Senha |
|---|---|---|
| **Superadministrador** | `carlos.super@obacomida.com.br` | `admin123` |
| **Administrador** | `mariana.admin@obacomida.com.br` | `admin123` |
| **Operador** | `camila.oper@obacomida.com.br` | `admin123` |
| **Financeiro** | `beatriz.fin@obacomida.com.br` | `admin123` |

---

## 📄 Licença
Propriedade do ecossistema Oba Comida. Todos os direitos reservados.
