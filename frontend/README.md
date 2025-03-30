# Plann.er - Planejador de Viagens

Plann.er é uma aplicação web fullstack que permite aos usuários planejar viagens e convidar amigos de forma simples e elegante.

## 🚀 Funcionalidades

- **Autenticação Completa**

  - Login e registro de usuários
  - Recuperação de senha via email
  - Sistema de tokens JWT

- **Gerenciamento de Viagens**
  - Criação e edição de viagens
  - Convite de participantes via email
  - Sistema de confirmação de participação
  - Salvamento de rascunhos

## 💻 Tecnologias

### Backend

- Node.js com TypeScript
- Express.js
- MongoDB com Mongoose
- JWT para autenticação
- SendGrid para envio de emails

### Frontend

- React.js com TypeScript
- Vite
- TailwindCSS para estilização
- Axios para requisições HTTP
- React Router para navegação

## 🛠️ Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/planner

# Instale as dependências do backend
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie o servidor
npm run dev

# Em outro terminal, instale as dependências do frontend
cd ../frontend
npm install

# Inicie o frontend
npm run dev
```
