# Deploy na Vercel

1. Envie esta pasta para um repositório GitHub e importe-o na Vercel como projeto estático.
2. Em **Settings → Environment Variables**, cadastre:
   - `KALANGOPAY_CLIENT_ID`
   - `KALANGOPAY_CLIENT_SECRET`
   - `KALANGOPAY_WEBHOOK_URL` com `https://SEU-DOMINIO/api/webhooks/kalangopay`
3. Faça o deploy. A função `api/create-pix.js` gera a cobrança e a função `api/webhooks/kalangopay.js` valida a assinatura dos avisos de pagamento.
4. No painel da KalangoPay, configure a URL do webhook para `https://SEU-DOMINIO/api/webhooks/kalangopay`.

Não publique o arquivo `.env.example` preenchido e não coloque as credenciais da KalangoPay no navegador.

## Próxima etapa de produção

O webhook já valida a assinatura. Para liberar automaticamente o preparo após o PIX pago, conecte o comentário existente no webhook a um banco de dados de pedidos usando `externalRef` como identificador.
