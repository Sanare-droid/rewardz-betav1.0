import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge classes correctly', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    expect(cn('base-class', isActive && 'active-class')).toBe(
      'base-class active-class',
    );
  });

  it('should handle false and null conditions', () => {
    const isActive = false;
    expect(cn('base-class', isActive && 'active-class', null)).toBe(
      'base-class',
    );
  });

  it('should merge tailwind classes properly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should work with object notation', () => {
    expect(cn('base', { conditional: true, 'not-included': false })).toBe(
      'base conditional',
    );
  });

  it('should handle undefined values', () => {
    expect(cn('base', undefined, 'additional')).toBe('base additional');
  });

  it('should handle empty strings', () => {
    expect(cn('base', '', 'additional')).toBe('base additional');
  });

  it('should handle arrays', () => {
    expect(cn(['base', 'additional'])).toBe('base additional');
  });

  it('should handle mixed inputs', () => {
    expect(cn('base', ['array', 'classes'], { object: true }, 'string')).toBe(
      'base array classes object string',
    );
  });
});
