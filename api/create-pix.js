const KALANGOPAY_PIX_URL = 'https://app.kalangopay.com/v3/pix/qrcode';

function readJsonBody(req) {
  if (typeof req.body === 'object' && req.body) return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Método não permitido.' });
  }
  const { name, cpf, amount, description, externalRef } = readJsonBody(req);
  const cleanCpf = String(cpf || '').replace(/\D/g, '');
  const numericAmount = Number(amount);
  if (!name || cleanCpf.length !== 11 || !Number.isFinite(numericAmount) || numericAmount < 1 || !externalRef) return res.status(400).json({ error: 'Dados inválidos para gerar o PIX.' });

  const clientId = process.env.KALANGO_CLIENT_ID || process.env.KALANGOPAY_CLIENT_ID;
  const clientSecret = process.env.KALANGO_SECRET_KEY || process.env.KALANGOPAY_CLIENT_SECRET;
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const webhookUrl = process.env.KALANGOPAY_WEBHOOK_URL || (host ? `https://${host}/api/webhooks/kalangopay` : '');
  if (!clientId || !clientSecret || !webhookUrl) return res.status(503).json({ error: 'Pagamento PIX ainda não foi configurado.' });

  const form = new URLSearchParams({ nome: String(name).trim(), cpf: cleanCpf, valor: numericAmount.toFixed(2), descricao: String(description || `Pedido ${externalRef}`).slice(0, 255), urlnoty: webhookUrl });
  try {
    const response = await fetch(KALANGOPAY_PIX_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: `Bearer ${clientId}.${clientSecret}`, 'Idempotency-Key': `acai-${externalRef}` }, body: form });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.qrcode || !data.transactionId) {
      console.error('Kalango Pay recusou a geração do PIX', { status: response.status, reason: data?.message || data?.error || data?.detail || null });
      return res.status(502).json({ error: 'Não foi possível gerar o PIX.' });
    }
    return res.status(200).json({ qrcode: data.qrcode, transactionId: data.transactionId, amount: data.amount ?? numericAmount });
  } catch {
    return res.status(502).json({ error: 'Falha ao comunicar com o gateway de pagamento.' });
  }
}
