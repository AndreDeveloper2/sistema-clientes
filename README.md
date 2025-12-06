# Sistema de Gestão de Clientes

Sistema completo de gestão de clientes desenvolvido com React + Vite, TailwindCSS, shadcn/ui e Firebase.

## 🚀 Deploy Rápido na Vercel

### Opção 1: Via GitHub (Recomendado)

1. **Faça push do código para o GitHub**
2. **Acesse [vercel.com](https://vercel.com)** e faça login
3. **Clique em "Add New Project"** e importe seu repositório
4. **Configure as variáveis de ambiente** (veja `DEPLOY.md`)
5. **Clique em Deploy** ✅

### Opção 2: Via CLI

```bash
npm install -g vercel
vercel login
vercel
```

📖 **Guia completo:** Veja [DEPLOY.md](./DEPLOY.md)

## 🛠️ Tecnologias

- **React 19** + **Vite 7**
- **TailwindCSS** + **shadcn/ui**
- **Firebase Firestore** (sincronização automática)
- **Zustand** (gerenciamento de estado)
- **React Router DOM** (navegação)
- **LocalStorage** (cache offline)

## ✨ Funcionalidades

- ✅ CRUD completo de clientes e servidores
- ✅ Dashboard com estatísticas
- ✅ Sincronização automática entre dispositivos (Firebase)
- ✅ Funciona offline (LocalStorage + Firebase offline)
- ✅ Tema claro/escuro
- ✅ Design responsivo (mobile + desktop)
- ✅ Login simples com autenticação local

## 📦 Instalação Local

```bash
npm install
npm run dev
```

## 🔥 Configuração Firebase

Veja [README_FIREBASE.md](./README_FIREBASE.md) para configurar o Firebase.

## 📱 Acesso Mobile

Após o deploy na Vercel, acesse pelo celular:
- Os dados são sincronizados automaticamente
- Funciona offline
- Pode adicionar à tela inicial (PWA)

## 📄 Licença

MIT
