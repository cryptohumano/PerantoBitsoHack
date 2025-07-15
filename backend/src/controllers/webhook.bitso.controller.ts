import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// IPs permitidas de Bitso (sandbox, stage, producción)
const ALLOWED_IPS = [
  '3.142.85.93', '3.18.37.180', '18.188.192.89', // sandbox
  '3.129.233.228', '3.22.247.241', '3.134.133.168', // stage
  '52.15.91.227', '18.216.72.107', '18.219.140.132' // producción
];

function getClientIp(req: Request): string {
  // X-Forwarded-For o IP directa
  return (
    req.headers['x-forwarded-for']?.toString().split(',')[0] ||
    req.socket?.remoteAddress ||
    req.ip ||
    ''
  );
}

function isAllowedIP(ip: string): boolean {
  // Permitir localhost para pruebas
  if (ip.startsWith('127.') || ip === '::1') return true;
  return ALLOWED_IPS.includes(ip);
}

const handleBitsoWebhook = async (req: Request, res: Response) => {
  const clientIp = getClientIp(req);
  if (!isAllowedIP(clientIp)) {
    return res.status(403).json({ error: 'IP no autorizada', ip: clientIp });
  }

  const event = req.body;
  try {
    // Guardar el evento en la base de datos
    await prisma.webhookEvent.create({
      data: {
        eventType: event.event || 'unknown',
        eventId: event.payload?.fid || event.payload?.wid || event.payload?.payment_id || 'unknown',
        payload: event,
        ipAddress: clientIp,
        userAgent: req.headers['user-agent'] || ''
      }
    });
    res.status(200).json({ success: true });
    // Aquí puedes disparar procesamiento asíncrono si lo deseas
  } catch (error) {
    res.status(500).json({ error: 'Error guardando evento', details: error instanceof Error ? error.message : 'Error desconocido' });
  }
};

export default { handleBitsoWebhook }; 