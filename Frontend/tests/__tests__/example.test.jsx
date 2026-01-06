import { describe, it, expect } from 'vitest';

describe('Example Test Suite', () => {
  it('basic math operations', () => {
    expect(2 + 2).toBe(4);
    expect(10 - 5).toBe(5);
    expect(3 * 3).toBe(9);
  });

  it('string operations', () => {
    const str = 'HVTSocial';
    expect(str).toContain('Social');
    expect(str.length).toBe(9);
    expect(str.toLowerCase()).toBe('hvtsocial');
  });

  it('array operations', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(arr).toHaveLength(5);
    expect(arr).toContain(3);
    expect(arr[0]).toBe(1);
  });

  it('object operations', () => {
    const user = {
      id: 1,
      name: 'Test User',
      email: 'test@example.com',
    };

    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('email', 'test@example.com');
    expect(user.name).toBe('Test User');
  });

  it('async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});
