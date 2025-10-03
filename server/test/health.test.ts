import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../index';

describe('Server Health', () => {
  it('should return health status', async () => {
    const app = createServer();
    
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('should return ping message', async () => {
    const app = createServer();
    
    const response = await request(app)
      .get('/api/ping')
      .expect(200);

    expect(response.body).toHaveProperty('message');
  });

  it('should return demo response', async () => {
    const app = createServer();
    
    const response = await request(app)
      .get('/api/demo')
      .expect(200);

    expect(response.body).toEqual({
      message: 'Hello from Express server',
    });
  });
});
