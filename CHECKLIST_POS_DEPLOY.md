# ✅ Checklist Pós-Deploy

Use este checklist para garantir que tudo está funcionando corretamente após o deploy.

## 🔐 Firebase - Configurações de Segurança

### ✅ 1. Regras de Produção Aplicadas
- [x] Regras de produção aplicadas no Firestore
- [ ] **Testar se está funcionando** (veja abaixo)

### ✅ 2. Autorizar Domínio da Vercel

**IMPORTANTE**: Autorize o domínio da Vercel no Firebase para evitar erros de CORS.

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Authentication** > **Settings** > **Authorized domains**
3. Adicione:
   - Seu domínio da Vercel (ex: `seu-projeto.vercel.app`)
   - `*.vercel.app` (opcional, permite todos os subdomínios)
4. Clique em **Adicionar**

### ✅ 3. Verificar Regras Aplicadas

1. Firebase Console > **Firestore Database** > **Regras**
2. Verifique se as regras estão assim:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /clientes/{documentId} {
      allow read: if resource.data.userId == 'default-user';
      allow create: if request.resource.data.userId == 'default-user';
      allow update, delete: if resource.data.userId == 'default-user';
    }
    match /servidores/{documentId} {
      allow read: if resource.data.userId == 'default-user';
      allow create: if request.resource.data.userId == 'default-user';
      allow update, delete: if resource.data.userId == 'default-user';
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## 🧪 Testes de Funcionamento

### ✅ 4. Testar no Navegador

1. Acesse seu app na Vercel (ex: `seu-projeto.vercel.app`)
2. Abra o **Console do Navegador** (F12)
3. Verifique se aparece:
   - ✅ "Firebase inicializado com sucesso!"
   - ✅ Badge de sincronização no header (verde = sincronizado)

### ✅ 5. Testar CRUD

1. **Criar Cliente**:
   - Clique em "Novo Cliente"
   - Preencha os dados
   - Clique em "Criar"
   - ✅ Deve aparecer toast de sucesso
   - ✅ Cliente deve aparecer na lista

2. **Editar Cliente**:
   - Clique no botão de editar
   - Modifique algum dado
   - Salve
   - ✅ Deve atualizar corretamente

3. **Excluir Cliente**:
   - Clique no botão de excluir
   - Confirme
   - ✅ Deve remover o cliente

4. **Verificar Sincronização**:
   - Abra o app em outro dispositivo/navegador
   - ✅ Os dados devem aparecer automaticamente

### ✅ 6. Testar no Celular

1. Acesse o app pelo celular
2. Faça login
3. Crie um cliente
4. Abra no computador
5. ✅ O cliente deve aparecer automaticamente

## 🐛 Verificar Problemas

### ❌ Se aparecer erro "Missing or insufficient permissions"

**Causa**: As regras não estão corretas ou os documentos não têm `userId: 'default-user'`

**Solução**:
1. Verifique as regras no Firebase Console
2. Verifique se os documentos têm o campo `userId`
3. Se não tiver, os dados antigos precisam ser migrados

### ❌ Se aparecer erro de CORS ou "unauthorized-domain"

**Causa**: Domínio não autorizado no Firebase

**Solução**:
1. Firebase Console > Authentication > Settings > Authorized domains
2. Adicione seu domínio da Vercel

### ❌ Se os dados não sincronizam

**Causa**: Variáveis de ambiente não configuradas ou Firebase não inicializado

**Solução**:
1. Verifique as variáveis de ambiente na Vercel
2. Verifique o console do navegador para erros
3. Verifique se o Firebase está inicializado (deve aparecer no console)

## 📊 Monitoramento

### ✅ 7. Verificar Logs do Firebase

1. Firebase Console > **Firestore Database** > **Uso**
2. Veja estatísticas de:
   - Leituras
   - Escritas
   - Armazenamento

### ✅ 8. Verificar Logs da Vercel

1. Vercel Dashboard > Seu Projeto > **Deployments**
2. Clique no último deploy
3. Veja os logs para verificar se há erros

## 🎯 Próximos Passos

Após verificar tudo:

- [ ] ✅ Sistema funcionando corretamente
- [ ] ✅ Dados sincronizando entre dispositivos
- [ ] ✅ Regras de segurança aplicadas
- [ ] ✅ Domínio autorizado no Firebase
- [ ] ✅ Testado no celular

## 🆘 Precisa de Ajuda?

Se algo não estiver funcionando:

1. **Verifique o Console do Navegador** (F12) para erros
2. **Verifique os Logs da Vercel** para erros de build
3. **Verifique os Logs do Firebase** para erros de acesso
4. **Teste localmente** com `npm run dev` para isolar o problema

## 📝 Notas Importantes

- As regras de produção **não expiram** (diferente das de teste)
- Os dados antigos criados antes das regras podem precisar de migração
- Se mudar o `USER_ID` no código, precisa atualizar as regras também

