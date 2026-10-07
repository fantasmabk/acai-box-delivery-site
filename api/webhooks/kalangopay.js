import crypto from 'node:crypto';

export const config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }

  const secret = process.env.KALANGOPAY_CLIENT_SECRET;
  const signature = req.headers['x-kalangopay-signature'];
  if (!secret || typeof signature !== 'string') return res.status(403).end();

  try {
    const rawBody = await getRawBody(req);
    const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
    const received = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (received.length !== expectedBuffer.length || !crypto.timingSafeEqual(received, expectedBuffer)) {
      return res.status(403).end();
    }

    const event = JSON.parse(rawBody.toString('utf8'));
    if (event.event === 'transaction.paid' && event.status === 'PAID') {
      // Conecte aqui ao banco de dados: localize pelo externalRef e marque o pedido como pago.
      console.log('Pagamento confirmado:', event.externalRef, event.transactionId);
    }
    return res.status(200).json({ received: true });
  } catch {
    return res.status(400).end();
  }
}
