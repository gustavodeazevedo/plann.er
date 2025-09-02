# Plann.er - Planejador de Viagens

Plann.er é uma aplicação web para planejamento de viagens que permite aos usuários gerenciar destinos, datas, convidados, tarefas e passagens.

## 🌟 Funcionalidades

- ✅ Cadastro e login de usuários (email/senha e Google)
- ✅ Criação e gerenciamento de viagens
- ✅ Pesquisa de destinos com geocodificação via OpenCage API
- ✅ Checklists personalizados para cada viagem
- ✅ Visualização de detalhes da viagem para convidados
- ✅ Upload e gerenciamento de passagens (PDF)
- ✅ Sincronização em tempo real das alterações
- ✅ Acesso de informações da viagem para convidados sem necessidade de cadastro
- ✅ Tema escuro moderno

## 🛠 Tecnologias Utilizadas

### Backend

- Node.js com Express
- TypeScript
- MongoDB (Atlas)
- JWT para autenticação
- Cookies HttpOnly para sessões seguras
- SendGrid para envio de emails
- Vercel Blob para armazenamento de arquivos em PDF
- Multer para upload de arquivos

### Frontend

- React com TypeScript
- Vite como bundler
- Tailwind CSS para estilização
- Axios para requisições HTTP
- Context API para gerenciamento de estado
- Autenticação com Google

## 🚀 Configuração de Deploy

### Pré-requisitos

- Conta no [Render](https://render.com/)
- Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- Conta no [SendGrid](https://sendgrid.com/) para envio de emails
- Conta no [Vercel](https://vercel.com/) para armazenamento de arquivos (Vercel Blob)

### Variáveis de Ambiente

Configure as seguintes variáveis de ambiente no dashboard do Render:

- `NODE_ENV`: `production`
- `PORT`: `3333`
- `MONGODB_URI`: Sua string de conexão do MongoDB
- `JWT_SECRET`: Uma string secreta para assinar tokens JWT
- `SENDGRID_API_KEY`: Sua chave de API do SendGrid
- `SENDGRID_FROM_EMAIL`: Email verificado no SendGrid
- `CORS_ORIGIN`: URL do frontend (ex: `https://plann-er.vercel.app`)
- `FRONTEND_URL`: URL do frontend (ex: `https://plann-er.vercel.app`)
- `BLOB_READ_WRITE_TOKEN`: Token de acesso ao Vercel Blob para armazenamento de arquivos

### Deploy Backend (Render)

1. No dashboard do Render, crie um novo Web Service
2. Conecte ao repositório GitHub
3. Configure o serviço com as seguintes opções:
   - **Environment**: `Node`
   - **Build Command**: `cd backend && yarn install && yarn run build`
   - **Start Command**: `cd backend && yarn start`
   - **Auto-Deploy**: Enabled

### Deploy Frontend (Vercel)

1. No dashboard da Vercel, importe o repositório GitHub
2. Configure as variáveis de ambiente:
   - `VITE_API_URL`: URL do backend no Render
3. Deploy automático configurado via vercel.json

## 💻 Desenvolvimento Local

### Backend

```bash
cd backend
cp .env.example .env    # Configure suas variáveis locais
yarn install
yarn dev
```

### Frontend

```bash
cd frontend
yarn install
yarn dev
```

## 📂 Estrutura do Projeto

```
/
├── backend/            # API Node.js/Express/TypeScript
│   ├── src/            # Código fonte
│   │   ├── @types/     # Tipos personalizados
│   │   ├── config/     # Configurações (auth, etc)
│   │   ├── controllers/# Controladores das rotas
│   │   ├── middlewares/# Middlewares (auth, etc)
│   │   ├── models/     # Modelos do MongoDB
│   │   ├── services/   # Serviços (email, armazenamento, etc)
│   │   ├── routes.ts   # Definição de rotas
│   │   └── server.ts   # Entrada da aplicação
│   └── ...
└── frontend/           # Cliente React/TypeScript
    ├── public/         # Arquivos estáticos
    └── src/            # Código fonte
        ├── components/ # Componentes React
        ├── hooks/      # Hooks personalizados
        ├── lib/        # Bibliotecas/clientes
        ├── pages/      # Páginas da aplicação
        ├── styles/     # Estilos CSS
        └── utils/      # Utilitários
```

## 🔐 Autenticação

O sistema utiliza:

- JWT (JSON Web Tokens) para autenticação de API
- Cookies HttpOnly para sessões seguras
- Suporte para autenticação via Google
- Recuperação de senha por email

## 🧩 Funcionalidades Avançadas

### Sistema de Convites

- Convidados podem ver detalhes da viagem sem cadastro
- Links de convite personalizados

### Gerenciamento de Passagens

- Upload de arquivos PDF
- Armazenamento seguro no Vercel Blob
- Visualização online
- Download

### Sincronização de Dados

- Sincronização em tempo real
- Cache local para operações offline
- Resolução de conflitos

## 📱 Responsividade

A interface foi desenvolvida para funcionar adequadamente em:

- Desktops
- Tablets
- Smartphones

## 📝 Licença

Este projeto está sob licença privada.

## 👨‍💻 Contato

Para mais informações, entre em contato com o desenvolvedor do projeto.
