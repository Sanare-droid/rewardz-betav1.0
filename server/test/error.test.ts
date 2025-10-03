import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../index';

describe('Error Handling', () => {
  it('should handle 404 errors', async () => {
    const app = createServer();
    
    const response = await request(app)
      .get('/nonexistent-route')
      .expect(404);

    expect(response.body).toHaveProperty('success', false);
    expect(response.body).toHaveProperty('error');
  });

  it('should handle malformed JSON', async () => {
    const app = createServer();
    
    const response = await request(app)
      .post('/api/notify/email')
      .send('invalid json')
      .expect(400);

    expect(response.body).toHaveProperty('success', false);
  });
});
