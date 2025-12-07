# 🔒 Configuração do Firebase para Produção

Este guia explica como configurar o Firestore para produção com regras de segurança adequadas.

## ⚠️ Importante

Você **NÃO precisa criar um novo banco de dados**. O mesmo banco pode ser usado, mas com **regras de segurança de produção**.

## 🔐 Regras de Segurança para Produção

### Opção 1: Regras Baseadas em UserId (Recomendado)

Como o sistema usa `userId: 'default-user'`, vamos criar regras que permitam acesso apenas aos documentos com esse userId:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para Clientes
    match /clientes/{documentId} {
      // Permitir leitura se o documento tiver userId correto
      allow read: if resource.data.userId == 'default-user';
      
      // Permitir escrita apenas se:
      // 1. O documento não existe (criação) OU
      // 2. O documento existe e tem userId correto (atualização)
      allow create: if request.resource.data.userId == 'default-user';
      allow update, delete: if resource.data.userId == 'default-user';
    }
    
    // Regras para Servidores
    match /servidores/{documentId} {
      allow read: if resource.data.userId == 'default-user';
      allow create: if request.resource.data.userId == 'default-user';
      allow update, delete: if resource.data.userId == 'default-user';
    }
    
    // Negar acesso a qualquer outra coleção
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Opção 2: Regras com Autenticação Firebase (Mais Seguro)

Se você quiser usar autenticação do Firebase no futuro:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regras para Clientes
    match /clientes/{documentId} {
      // Permitir leitura se autenticado E userId corresponder
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      
      // Permitir escrita apenas se autenticado E userId corresponder
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                              resource.data.userId == request.auth.uid;
    }
    
    // Regras para Servidores
    match /servidores/{documentId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                              resource.data.userId == request.auth.uid;
    }
    
    // Negar acesso a qualquer outra coleção
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 📝 Como Aplicar as Regras

### Passo 1: Acessar Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto: `sistema-clientes-cab76`
3. No menu lateral, clique em **Firestore Database**
4. Clique na aba **Regras**

### Passo 2: Aplicar as Regras

1. **Cole as regras da Opção 1** (recomendado para começar)
2. Clique em **Publicar**
3. Aguarde a confirmação

### Passo 3: Testar

1. Acesse seu app em produção
2. Tente criar/editar um cliente
3. Se funcionar, as regras estão corretas! ✅

## 🔍 Verificar Regras Atuais

Para ver as regras atuais:

1. Firebase Console > Firestore Database > Regras
2. Você verá algo como:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2024, 12, 31);
    }
  }
}
```

⚠️ **Essas são as regras de teste** que expiram em 30 dias. Substitua pelas regras de produção acima!

## 🛡️ Segurança Adicional

### 1. Limitar Tamanho dos Documentos

Você pode adicionar validação de tamanho:

```javascript
allow create: if request.resource.data.userId == 'default-user' &&
                 request.resource.data.size() < 10000; // 10KB máximo
```

### 2. Validar Estrutura dos Dados

```javascript
allow create: if request.resource.data.userId == 'default-user' &&
                 request.resource.data.keys().hasAll(['nome', 'dataVencimento', 'valor']);
```

### 3. Rate Limiting (Plano Blaze)

Se você tiver o plano Blaze, pode adicionar rate limiting usando Cloud Functions.

## 📊 Monitoramento

### Ver Logs de Acesso

1. Firebase Console > Firestore Database > Uso
2. Veja estatísticas de leituras/escritas
3. Monitore para detectar acessos suspeitos

### Alertas

Configure alertas no Firebase Console para:
- Muitas leituras/escritas em pouco tempo
- Tentativas de acesso negadas
- Uso excessivo de recursos

## 🔄 Atualizar Regras no Futuro

Se você mudar o `USER_ID` no código:

1. Atualize `src/lib/firebaseSync.js`:
   ```javascript
   const USER_ID = 'novo-user-id'
   ```

2. Atualize as regras do Firestore para usar o novo userId

3. Migre os dados existentes (se necessário)

## ⚙️ Configuração Atual do Sistema

O sistema atual usa:
- `USER_ID = 'default-user'` (em `src/lib/firebaseSync.js`)
- Sem autenticação Firebase Auth
- Acesso baseado apenas no campo `userId` dos documentos

## 🚨 Importante para Produção

1. ✅ **Aplique as regras de produção** antes de fazer deploy
2. ✅ **Teste as regras** localmente primeiro
3. ✅ **Monitore os logs** após o deploy
4. ✅ **Configure alertas** no Firebase Console
5. ✅ **Faça backup** dos dados regularmente

## 📚 Recursos

- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Console](https://console.firebase.google.com/)
- [Regras de Segurança Avançadas](https://firebase.google.com/docs/firestore/security/rules-conditions)

