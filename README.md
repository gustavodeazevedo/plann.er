# Plann.er - Planejador de Viagens

## Configuração de Deploy no Render

Este guia fornece instruções detalhadas para configurar e implantar o projeto Plann.er na plataforma Render.

### Pré-requisitos

- Conta no [Render](https://render.com/)
- Conta no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (ou outro provedor MongoDB)
- Conta no [SendGrid](https://sendgrid.com/) para envio de emails (opcional)

### Configuração do Ambiente

1. **Variáveis de Ambiente**

   Configure as seguintes variáveis de ambiente no dashboard do Render:

   - `NODE_ENV`: `production`
   - `PORT`: `3333`
   - `MONGODB_URI`: Sua string de conexão do MongoDB
   - `JWT_SECRET`: Uma string secreta para assinar tokens JWT
   - `SENDGRID_API_KEY`: Sua chave de API do SendGrid (opcional)
   - `SENDGRID_FROM_EMAIL`: Email verificado no SendGrid (opcional)
   - `CORS_ORIGIN`: URL do frontend (ex: `https://plann-er.vercel.app`)
   - `FRONTEND_URL`: URL do frontend (ex: `https://plann-er.vercel.app`)

2. **Configuração do Render**

   O arquivo `render.yaml` já está configurado com as configurações necessárias para o deploy. Certifique-se de que as variáveis de ambiente estejam configuradas corretamente no dashboard do Render.

### Deploy Manual

Se preferir fazer o deploy manualmente:

1. No dashboard do Render, crie um novo Web Service
2. Conecte ao repositório GitHub
3. Configure o serviço com as seguintes opções:

   - **Environment**: `Node`
   - **Build Command**: `cd backend && yarn install && yarn run build`
   - **Start Command**: `cd backend && yarn start`
   - **Auto-Deploy**: Enabled

4. Configure as variáveis de ambiente conforme listado acima

### Estrutura do Projeto

```
/
├── backend/           # Código do servidor Node.js/Express
│   ├── src/           # Código fonte TypeScript
│   ├── dist/          # Código compilado (gerado pelo build)
│   ├── package.json   # Dependências e scripts
│   └── tsconfig.json  # Configuração do TypeScript
└── frontend/          # Código do cliente React
    └── ...            # Arquivos do frontend
```

### Scripts Importantes

No diretório `backend/`, os seguintes scripts estão disponíveis:

- `yarn dev`: Inicia o servidor em modo de desenvolvimento
- `yarn build`: Compila o código TypeScript para JavaScript
- `yarn start`: Inicia o servidor em modo de produção

### Solução de Problemas

- **Erro de Módulo não Encontrado**: Certifique-se de que o script de build está sendo executado corretamente antes do start
- **Erro de Conexão com MongoDB**: Verifique se a string de conexão do MongoDB está correta
- **Erro de CORS**: Verifique se a variável `CORS_ORIGIN` está configurada corretamente

### Contato

Para mais informações, entre em contato com o desenvolvedor do projeto.
