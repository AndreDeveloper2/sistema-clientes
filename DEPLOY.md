# 🚀 Guia de Deploy na Vercel

Este guia vai te ajudar a fazer o deploy do Sistema de Clientes na Vercel.

## 📋 Pré-requisitos

1. Conta na Vercel (gratuita): [vercel.com](https://vercel.com)
2. Projeto no GitHub/GitLab/Bitbucket (opcional, mas recomendado)
3. Firebase configurado (já feito ✅)

## 🎯 Opção 1: Deploy via GitHub (Recomendado)

### Passo 1: Preparar o Repositório

1. **Criar repositório no GitHub** (se ainda não tiver):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/sistema-clientes.git
   git push -u origin main
   ```

2. **Verificar .gitignore**:
   Certifique-se de que `.env` está no `.gitignore` (já está ✅)

### Passo 2: Conectar com Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. **Importe seu repositório** do GitHub
4. A Vercel detectará automaticamente que é um projeto Vite

### Passo 3: Configurar Variáveis de Ambiente

Na página de configuração do projeto na Vercel:

1. Vá em **Settings** > **Environment Variables**
2. Adicione as seguintes variáveis:

```
VITE_FIREBASE_API_KEY=AIzaSyA2gPFFQ3nciLrJNJ1JLHZ39nkJ6CzB_OU
VITE_FIREBASE_AUTH_DOMAIN=sistema-clientes-cab76.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sistema-clientes-cab76
VITE_FIREBASE_STORAGE_BUCKET=sistema-clientes-cab76.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=413092474188
VITE_FIREBASE_APP_ID=1:413092474188:web:3dac8150dbe55de4f6f3e9
VITE_FIREBASE_MEASUREMENT_ID=G-EV812QEX3F
```

3. Selecione **Production**, **Preview** e **Development**
4. Clique em **Save**

### Passo 4: Deploy

1. Clique em **Deploy**
2. Aguarde o build (geralmente 1-2 minutos)
3. ✅ Pronto! Seu app estará online!

---

## 🎯 Opção 2: Deploy via CLI da Vercel

### Passo 1: Instalar Vercel CLI

```bash
npm install -g vercel
```

### Passo 2: Fazer Login

```bash
vercel login
```

### Passo 3: Deploy

```bash
vercel
```

Siga as instruções:
- **Set up and deploy?** → `Y`
- **Which scope?** → Selecione sua conta
- **Link to existing project?** → `N` (primeira vez)
- **Project name?** → `sistema-clientes` (ou o nome que preferir)
- **Directory?** → `.` (pasta atual)

### Passo 4: Configurar Variáveis de Ambiente

```bash
vercel env add VITE_FIREBASE_API_KEY
# Cole: AIzaSyA2gPFFQ3nciLrJNJ1JLHZ39nkJ6CzB_OU

vercel env add VITE_FIREBASE_AUTH_DOMAIN
# Cole: sistema-clientes-cab76.firebaseapp.com

vercel env add VITE_FIREBASE_PROJECT_ID
# Cole: sistema-clientes-cab76

vercel env add VITE_FIREBASE_STORAGE_BUCKET
# Cole: sistema-clientes-cab76.firebasestorage.app

vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
# Cole: 413092474188

vercel env add VITE_FIREBASE_APP_ID
# Cole: 1:413092474188:web:3dac8150dbe55de4f6f3e9

vercel env add VITE_FIREBASE_MEASUREMENT_ID
# Cole: G-EV812QEX3F
```

### Passo 5: Deploy de Produção

```bash
vercel --prod
```

---

## 🔧 Configurações Adicionais

### Domínio Personalizado

1. Na Vercel, vá em **Settings** > **Domains**
2. Adicione seu domínio personalizado
3. Siga as instruções para configurar DNS

### Build Settings (Já configurado)

O arquivo `vercel.json` já está configurado com:
- ✅ Framework: Vite
- ✅ Build Command: `npm run build`
- ✅ Output Directory: `dist`
- ✅ SPA Routing: Configurado para React Router

---

## 🐛 Troubleshooting

### Erro: "Build failed"

**Solução:**
1. Verifique se todas as dependências estão no `package.json`
2. Execute `npm run build` localmente para testar
3. Verifique os logs na Vercel

### Erro: "404 Not Found" ao navegar

**Solução:**
O arquivo `vercel.json` já está configurado com rewrites para SPA. Se ainda assim não funcionar, verifique se o arquivo está na raiz do projeto.

### Firebase não funciona em produção

**Solução:**
1. Verifique se todas as variáveis de ambiente estão configuradas na Vercel
2. **Configure as regras de segurança do Firestore** (veja `FIREBASE_PRODUCTION.md`)
3. Verifique se o domínio está autorizado no Firebase Console
4. Vá em Firebase Console > Authentication > Settings > Authorized domains
5. Adicione seu domínio da Vercel (ex: `seu-projeto.vercel.app`)

### ⚠️ IMPORTANTE: Configurar Regras de Produção

**Antes de fazer deploy**, configure as regras de segurança do Firestore:

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Firestore Database** > **Regras**
3. Substitua as regras de teste pelas regras de produção
4. Veja o arquivo `FIREBASE_PRODUCTION.md` para as regras corretas
5. Clique em **Publicar**

As regras de teste expiram em 30 dias e permitem acesso total. Use as regras de produção para segurança!

### Erro: "Analytics não disponível"

**Solução:**
Isso é normal em alguns ambientes. O Analytics é opcional e não afeta o funcionamento do sistema.

---

## 📱 Acessar no Celular

Após o deploy:

1. Acesse o link fornecido pela Vercel (ex: `seu-projeto.vercel.app`)
2. No celular, você pode:
   - Adicionar à tela inicial (PWA)
   - Usar normalmente no navegador
3. Os dados serão sincronizados automaticamente entre dispositivos via Firebase!

---

## 🔄 Deploy Automático

Se você conectou com GitHub:

- ✅ **Push para `main`** → Deploy automático em produção
- ✅ **Push para outras branches** → Deploy de preview
- ✅ **Pull Requests** → Deploy de preview automático

---

## 📊 Monitoramento

Na Vercel você pode:
- Ver logs de build
- Ver logs de runtime
- Monitorar performance
- Ver analytics de visitas

---

## 🎉 Pronto!

Seu sistema está online e funcionando! 

**Lembre-se:**
- Os dados são salvos no Firebase (sincronização automática)
- Funciona offline (LocalStorage + Firebase offline persistence)
- Acessível de qualquer dispositivo

---

## 📚 Recursos

- [Documentação Vercel](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Firebase Console](https://console.firebase.google.com/)

