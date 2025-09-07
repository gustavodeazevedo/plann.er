<div align="center">
  <img src="frontend/public/logo.svg" alt="Plann.er Logo" width="120" height="120">
</div>

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
- Google OAuth para login social
- OpenCage API para geocodificação de destinos
- Cookies HttpOnly para sessões seguras
- Resend para envio de emails
- Vercel Blob para armazenamento de arquivos em PDF
- Multer para upload de arquivos

### Frontend

- React com TypeScript
- Vite como bundler
- React Router para roteamento
- Tailwind CSS para estilização
- Lucide React para ícones
- Axios para requisições HTTP
- Context API para gerenciamento de estado
- Autenticação com Google

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

Para mais informações, entre em contato com o e-mail => [gustavodeazevedo2003@outlook.com](mailto:gustavodeazevedo2003@outlook.com).
