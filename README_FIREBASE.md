# Configuração do Firebase para Sincronização Automática

Este projeto usa Firebase Firestore para sincronização automática de dados entre dispositivos.

## 📋 Pré-requisitos

1. Conta no Google (para acessar Firebase Console)
2. Projeto criado no Firebase

## 🚀 Passo a Passo

### 1. Criar Projeto no Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Digite o nome do projeto (ex: "sistema-clientes")
4. Siga as instruções para criar o projeto

### 2. Criar App Web

1. No Firebase Console, clique no ícone `</>` (Web)
2. Registre o app com um nome (ex: "Sistema de Clientes")
3. **Copie as credenciais** que aparecerão (firebaseConfig)

### 3. Configurar Firestore Database

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Começar em modo de teste" (para desenvolvimento)
4. Escolha uma localização (ex: us-central1)
5. Clique em "Ativar"

### 4. Configurar Regras de Segurança (Importante!)

No Firestore, vá em "Regras" e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir leitura/escrita apenas para documentos do usuário
    match /clientes/{document=**} {
      allow read, write: if request.auth != null || resource.data.userId == request.auth.uid;
    }
    match /servidores/{document=**} {
      allow read, write: if request.auth != null || resource.data.userId == request.auth.uid;
    }
  }
}
```

**Para desenvolvimento/teste rápido**, você pode usar regras mais permissivas (NÃO use em produção):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **ATENÇÃO**: As regras acima permitem acesso total. Use apenas para desenvolvimento!

### 5. Configurar Variáveis de Ambiente

1. Crie um arquivo `.env` na raiz do projeto
2. Cole as credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=sua-api-key-aqui
VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=seu-project-id
VITE_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=seu-app-id
```

### 6. Instalar Dependências

```bash
npm install
```

### 7. Testar

1. Execute `npm run dev`
2. Crie um cliente no sistema
3. Abra o mesmo app em outro dispositivo/navegador
4. Os dados devem aparecer automaticamente! 🎉

## 🔄 Como Funciona

- **LocalStorage**: Mantém cache local para funcionar offline
- **Firebase**: Sincroniza automaticamente entre dispositivos
- **Tempo Real**: Mudanças aparecem instantaneamente em todos os dispositivos
- **Offline**: Funciona sem internet e sincroniza quando voltar online

## 📱 Sincronização

O sistema mostra um indicador no header:
- 🟢 **Sincronizado**: Dados atualizados
- 🔵 **Sincronizando...**: Sincronizando dados
- 🔴 **Erro**: Problema na sincronização
- ⚫ **Offline**: Sem conexão

## ⚙️ Configuração Avançada

### Mudar User ID

Por padrão, todos os dados são salvos com `userId: 'default-user'`. Para usar autenticação do Firebase:

1. Configure Firebase Auth
2. Atualize `USER_ID` em `src/lib/firebaseSync.js` para usar `auth.currentUser.uid`

### Limites Gratuitos do Firebase

O plano gratuito (Spark) inclui:
- 1 GB de armazenamento
- 50K leituras/dia
- 20K escritas/dia
- 20K exclusões/dia

Para mais informações: [Firebase Pricing](https://firebase.google.com/pricing)

## 🐛 Troubleshooting

### Erro: "Missing or insufficient permissions"
- Verifique as regras do Firestore
- Certifique-se de que as regras permitem leitura/escrita

### Erro: "Firebase: Error (auth/unauthorized-domain)"
- Adicione seu domínio nas configurações do Firebase
- Vá em Authentication > Settings > Authorized domains

### Dados não sincronizam
- Verifique se as variáveis de ambiente estão corretas
- Verifique o console do navegador para erros
- Certifique-se de que o Firestore está ativado

## 📚 Recursos

- [Documentação Firebase](https://firebase.google.com/docs)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Firebase Console](https://console.firebase.google.com/)

