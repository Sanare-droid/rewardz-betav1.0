import { describe, it, expect } from 'vitest';
import { matchScore } from '@/lib/matching';
import type { Report } from '@/shared/types';

describe('matchScore function', () => {
  const createReport = (overrides: Partial<Report> = {}): Report => ({
    id: '1',
    type: 'lost',
    species: 'Dog',
    breed: 'Labrador',
    color: 'Brown',
    markings: 'White spot on chest',
    lat: 40.7128,
    lon: -74.0060,
    pubLat: 40.7128,
    pubLon: -74.0060,
    createdAt: Date.now(),
    userId: 'user1',
    name: 'Buddy',
    location: 'New York',
    keywords: ['dog', 'labrador', 'brown'],
    ...overrides,
  });

  it('should return -Infinity for same type reports', () => {
    const lostReport = createReport({ type: 'lost' });
    const anotherLostReport = createReport({ type: 'lost' });
    
    expect(matchScore(lostReport, anotherLostReport)).toBe(-Infinity);
  });

  it('should score based on species match', () => {
    const lostDog = createReport({ type: 'lost', species: 'Dog' });
    const foundDog = createReport({ type: 'found', species: 'Dog' });
    
    expect(matchScore(lostDog, foundDog)).toBeGreaterThan(0);
  });

  it('should score based on breed match', () => {
    const lostLab = createReport({ type: 'lost', species: 'Dog', breed: 'Labrador' });
    const foundLab = createReport({ type: 'found', species: 'Dog', breed: 'Labrador' });
    
    expect(matchScore(lostLab, foundLab)).toBeGreaterThan(50);
  });

  it('should score based on color overlap', () => {
    const lostBrown = createReport({ type: 'lost', color: 'Brown with white' });
    const foundBrown = createReport({ type: 'found', color: 'Brown and white' });
    
    expect(matchScore(lostBrown, foundBrown)).toBeGreaterThan(0);
  });

  it('should score based on markings overlap', () => {
    const lostMarked = createReport({ type: 'lost', markings: 'White spot on chest' });
    const foundMarked = createReport({ type: 'found', markings: 'White spot chest' });
    
    expect(matchScore(lostMarked, foundMarked)).toBeGreaterThan(0);
  });

  it('should score based on location proximity', () => {
    const lostNear = createReport({ 
      type: 'lost', 
      lat: 40.7128, 
      lon: -74.0060,
      pubLat: 40.7128,
      pubLon: -74.0060
    });
    const foundNear = createReport({ 
      type: 'found', 
      lat: 40.7130, 
      lon: -74.0058,
      pubLat: 40.7130,
      pubLon: -74.0058
    });
    
    expect(matchScore(lostNear, foundNear)).toBeGreaterThan(0);
  });

  it('should score based on time proximity', () => {
    const now = Date.now();
    const lostRecent = createReport({ 
      type: 'lost', 
      createdAt: now,
      lastSeen: new Date(now).toISOString()
    });
    const foundRecent = createReport({ 
      type: 'found', 
      createdAt: now + 1000 * 60 * 60, // 1 hour later
      dateFound: new Date(now + 1000 * 60 * 60).toISOString()
    });
    
    expect(matchScore(lostRecent, foundRecent)).toBeGreaterThan(0);
  });

  it('should return higher score for better matches', () => {
    const lostPerfect = createReport({ 
      type: 'lost', 
      species: 'Dog', 
      breed: 'Labrador', 
      color: 'Brown',
      lat: 40.7128, 
      lon: -74.0060
    });
    const foundPerfect = createReport({ 
      type: 'found', 
      species: 'Dog', 
      breed: 'Labrador', 
      color: 'Brown',
      lat: 40.7129, 
      lon: -74.0059
    });
    
    const lostPartial = createReport({ 
      type: 'lost', 
      species: 'Dog', 
      breed: 'Labrador', 
      color: 'Black',
      lat: 40.7128, 
      lon: -74.0060
    });
    const foundPartial = createReport({ 
      type: 'found', 
      species: 'Dog', 
      breed: 'Labrador', 
      color: 'Black',
      lat: 40.7200, 
      lon: -74.0000
    });
    
    const perfectScore = matchScore(lostPerfect, foundPerfect);
    const partialScore = matchScore(lostPartial, foundPartial);
    
    expect(perfectScore).toBeGreaterThan(partialScore);
  });
});
