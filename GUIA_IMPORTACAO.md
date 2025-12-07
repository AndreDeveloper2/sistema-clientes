# 📊 Guia de Importação de Planilha

Este guia explica como importar seus clientes de uma planilha Excel ou CSV.

## 📋 Formato da Planilha

### Colunas Obrigatórias

- **Nome** (ou Cliente, Name)
- **Data Vencimento** (ou Vencimento, Venc, Data de Vencimento)
- **Valor** (ou Preço, Price, Valor Pago)

### Colunas Opcionais

- **Data Entrada** (ou Entrada, Data de Entrada, Inicio)
- **Servidor** (ou Server, Servidor Nome)
- **Telas** (ou Tela, Quantidade Telas, Qtd Telas)
- **Situação** (ou Situacao, Status Pagamento, Pago) - valores: PAGO ou PENDENTE

## 📝 Exemplo de Planilha

| Nome | Data Entrada | Data Vencimento | Valor | Servidor | Telas | Situação |
|------|--------------|-----------------|-------|----------|-------|----------|
| João Silva | 01/01/2024 | 31/01/2024 | 100.00 | Servidor 1 | 2 | PAGO |
| Maria Santos | 15/01/2024 | 15/02/2024 | 150.50 | Servidor 2 | 1 | PENDENTE |

## 🚀 Como Importar

### Passo 1: Preparar a Planilha

1. Abra sua planilha no Excel ou Google Sheets
2. Certifique-se de que a primeira linha contém os cabeçalhos
3. Preencha os dados dos clientes nas linhas seguintes
4. Salve como **Excel (.xlsx)** ou **CSV (.csv)**

### Passo 2: Importar no Sistema

1. Acesse **Configurações** no menu lateral
2. Clique em **"Importar Planilha (Excel/CSV)"**
3. Selecione seu arquivo
4. Aguarde o processamento
5. ✅ Pronto! Seus clientes foram importados!

## ⚠️ Observações Importantes

### Formato de Data

- **Excel**: O sistema detecta automaticamente datas no formato Excel
- **CSV**: Use formato brasileiro (DD/MM/AAAA) ou ISO (AAAA-MM-DD)

### Formato de Valor

- Use números ou texto (ex: "100.50" ou "R$ 100,50")
- O sistema remove automaticamente símbolos de moeda

### Servidor

- Se não especificar um servidor, o sistema usará o primeiro servidor cadastrado
- Certifique-se de ter pelo menos um servidor cadastrado antes de importar

### Situação

- Valores aceitos: **PAGO** ou **PENDENTE**
- Se não especificar, padrão será **PENDENTE**

## 🔍 Mapeamento Automático de Colunas

O sistema detecta automaticamente as colunas pelos nomes. Ele procura por:

- **Nome**: "nome", "cliente", "name"
- **Data Entrada**: "data entrada", "entrada", "data de entrada", "inicio"
- **Data Vencimento**: "vencimento", "data vencimento", "venc", "data de vencimento"
- **Valor**: "valor", "preço", "price", "valor pago"
- **Servidor**: "servidor", "server", "servidor nome"
- **Telas**: "telas", "tela", "quantidade telas", "qtd telas"
- **Situação**: "situação", "situacao", "status pagamento", "pago"

## ❌ Erros Comuns

### "Planilha inválida. Colunas obrigatórias: Nome, Data Vencimento, Valor"

**Solução**: Certifique-se de que sua planilha tem essas colunas na primeira linha.

### "Nenhum cliente foi importado"

**Solução**: 
- Verifique se há dados nas linhas (não apenas cabeçalhos)
- Verifique se os nomes dos clientes estão preenchidos
- Verifique o formato das datas

### Datas incorretas

**Solução**: 
- Use formato brasileiro (DD/MM/AAAA) ou ISO (AAAA-MM-DD)
- No Excel, formate as células como Data

## ✅ Após a Importação

Após importar:

1. ✅ Os clientes aparecerão na lista
2. ✅ Status e dias restantes serão calculados automaticamente
3. ✅ Dados serão sincronizados com Firebase automaticamente
4. ✅ Você pode editar/remover clientes normalmente

## 📱 Sincronização

Os clientes importados serão:
- ✅ Salvos no LocalStorage
- ✅ Sincronizados automaticamente com Firebase
- ✅ Disponíveis em todos os dispositivos

## 💡 Dicas

1. **Faça backup** antes de importar (use Exportar Dados)
2. **Teste com poucos clientes** primeiro
3. **Verifique os dados** após importar
4. **Use a função de edição** para corrigir dados incorretos

## 🆘 Precisa de Ajuda?

Se tiver problemas:

1. Verifique o formato da planilha
2. Verifique se as colunas obrigatórias estão presentes
3. Tente salvar como CSV se Excel não funcionar
4. Verifique o console do navegador (F12) para erros

