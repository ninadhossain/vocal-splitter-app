import { Response } from 'express';

interface SSEClient {
  res: Response;
  jobId: string;
}

class SSEManager {
  private clients: Map<string, Set<Response>> = new Map();

  constructor() {
    // Keep-alive heartbeat every 15s to prevent client disconnection/timeouts
    setInterval(() => {
      this.sendHeartbeat();
    }, 15000);
  }

  public register(jobId: string, res: Response): void {
    if (!this.clients.has(jobId)) {
      this.clients.set(jobId, new Set());
    }
    this.clients.get(jobId)!.add(res);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    // Initial connection ack
    res.write(`event: connected\ndata: ${JSON.stringify({ jobId, message: 'SSE stream connected' })}\n\n`);

    res.on('close', () => {
      this.unregister(jobId, res);
    });
  }

  public unregister(jobId: string, res: Response): void {
    const jobClients = this.clients.get(jobId);
    if (jobClients) {
      jobClients.delete(res);
      if (jobClients.size === 0) {
        this.clients.delete(jobId);
      }
    }
  }

  public broadcast(jobId: string, eventName: string, data: any): void {
    const jobClients = this.clients.get(jobId);
    if (!jobClients || jobClients.size === 0) return;

    const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of jobClients) {
      try {
        res.write(payload);
      } catch (err) {
        console.error(`[SSE] Failed to write to client for job ${jobId}:`, err);
      }
    }
  }

  private sendHeartbeat(): void {
    for (const [jobId, set] of this.clients.entries()) {
      for (const res of set) {
        try {
          res.write(`: heartbeat ${Date.now()}\n\n`);
        } catch {
          // Will be cleaned up on close
        }
      }
    }
  }
}

export const sseManager = new SSEManager();
