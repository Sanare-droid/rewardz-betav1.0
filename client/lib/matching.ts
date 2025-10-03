/**
 * Advanced pet matching algorithm for Rewardz
 * Calculates match scores between lost and found reports
 */

import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import type { Report } from '@/shared/types';

export interface MatchScore {
  reportId: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  matchedFields: string[];
}

export interface MatchResult {
  id?: string;
  lostReportId: string;
  foundReportId: string;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  reasons: string[];
  matchedFields: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: any;
}

/**
 * Calculate distance between two coordinates in meters
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Calculate color similarity between two color strings
 */
function calculateColorSimilarity(color1: string, color2: string): number {
  if (!color1 || !color2) return 0;
  
  const c1 = color1.toLowerCase().split(/[,\s]+/);
  const c2 = color2.toLowerCase().split(/[,\s]+/);
  
  let matches = 0;
  for (const color of c1) {
    if (c2.some(c => c.includes(color) || color.includes(c))) {
      matches++;
    }
  }
  
  return matches / Math.max(c1.length, c2.length);
}

/**
 * Calculate similarity between markings/descriptions
 */
function calculateMarkingSimilarity(markings1: string, markings2: string): number {
  if (!markings1 || !markings2) return 0;
  
  const m1 = markings1.toLowerCase().split(/[,\s]+/);
  const m2 = markings2.toLowerCase().split(/[,\s]+/);
  
  let matches = 0;
  for (const marking of m1) {
    if (m2.some(m => m.includes(marking) || marking.includes(m))) {
      matches++;
    }
  }
  
  return matches / Math.max(m1.length, m2.length);
}

/**
 * Calculate comprehensive match score between two reports
 */
export function calculateMatchScore(
  lostReport: Report,
  foundReport: Report
): MatchScore {
  let score = 0;
  const reasons: string[] = [];
  const matchedFields: string[] = [];
  
  // Required: Species must match
  if (lostReport.species?.toLowerCase() !== foundReport.species?.toLowerCase()) {
    return {
      reportId: foundReport.id,
      score: 0,
      confidence: 'low',
      reasons: ['Different species'],
      matchedFields: []
    };
  }
  
  score += 25;
  matchedFields.push('species');
  reasons.push(`Same species: ${lostReport.species}`);
  
  // Breed matching (20 points)
  if (lostReport.breed && foundReport.breed) {
    const breedMatch = lostReport.breed.toLowerCase() === foundReport.breed.toLowerCase();
    if (breedMatch) {
      score += 20;
      matchedFields.push('breed');
      reasons.push(`Same breed: ${lostReport.breed}`);
    } else if (
      lostReport.breed.toLowerCase().includes(foundReport.breed.toLowerCase()) ||
      foundReport.breed.toLowerCase().includes(lostReport.breed.toLowerCase())
    ) {
      score += 10;
      matchedFields.push('breed');
      reasons.push(`Similar breed: ${lostReport.breed} / ${foundReport.breed}`);
    }
  }
  
  // Location proximity (30 points max)
  if (lostReport.lat && lostReport.lon && foundReport.lat && foundReport.lon) {
    const distance = haversineDistance(
      lostReport.lat,
      lostReport.lon,
      foundReport.lat,
      foundReport.lon
    );
    
    if (distance < 500) {
      // Within 500m
      score += 30;
      matchedFields.push('location');
      reasons.push('Found very close to lost location (< 500m)');
    } else if (distance < 2000) {
      // Within 2km
      score += 20;
      matchedFields.push('location');
      reasons.push('Found nearby (< 2km)');
    } else if (distance < 5000) {
      // Within 5km
      score += 10;
      matchedFields.push('location');
      reasons.push('Found in same area (< 5km)');
    } else if (distance < 10000) {
      // Within 10km
      score += 5;
      reasons.push('Found in broader region (< 10km)');
    }
  } else if (lostReport.location && foundReport.location) {
    // Text-based location matching
    const loc1 = lostReport.location.toLowerCase();
    const loc2 = foundReport.location.toLowerCase();
    if (loc1 === loc2) {
      score += 15;
      matchedFields.push('location');
      reasons.push(`Same location: ${lostReport.location}`);
    } else if (loc1.includes(loc2) || loc2.includes(loc1)) {
      score += 8;
      reasons.push('Similar location area');
    }
  }
  
  // Color matching (15 points max)
  if (lostReport.color && foundReport.color) {
    const colorSimilarity = calculateColorSimilarity(lostReport.color, foundReport.color);
    if (colorSimilarity >= 0.8) {
      score += 15;
      matchedFields.push('color');
      reasons.push('Colors match closely');
    } else if (colorSimilarity >= 0.5) {
      score += 8;
      matchedFields.push('color');
      reasons.push('Similar colors');
    } else if (colorSimilarity > 0) {
      score += 3;
      reasons.push('Some color similarities');
    }
  }
  
  // Markings/distinguishing features (10 points)
  if (lostReport.markings && foundReport.markings) {
    const markingSimilarity = calculateMarkingSimilarity(
      lostReport.markings,
      foundReport.markings
    );
    if (markingSimilarity >= 0.7) {
      score += 10;
      matchedFields.push('markings');
      reasons.push('Markings match well');
    } else if (markingSimilarity >= 0.4) {
      score += 5;
      reasons.push('Some marking similarities');
    }
  }
  
  // Microchip ID (instant match if same)
  if (lostReport.microchipId && foundReport.microchipId) {
    if (lostReport.microchipId === foundReport.microchipId) {
      score = 100; // Perfect match
      matchedFields.push('microchipId');
      reasons.unshift('MICROCHIP MATCH - Confirmed same pet!');
    }
  }
  
  // Time proximity (10 points max)
  if (lostReport.createdAt && foundReport.createdAt) {
    const lostDate = new Date(lostReport.createdAt);
    const foundDate = new Date(foundReport.createdAt);
    const daysDiff = Math.abs((foundDate.getTime() - lostDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 3) {
      score += 10;
      reasons.push('Found within 3 days');
    } else if (daysDiff < 7) {
      score += 7;
      reasons.push('Found within a week');
    } else if (daysDiff < 14) {
      score += 4;
      reasons.push('Found within 2 weeks');
    } else if (daysDiff < 30) {
      score += 2;
      reasons.push('Found within a month');
    }
  }
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low';
  if (score >= 70 || matchedFields.includes('microchipId')) {
    confidence = 'high';
  } else if (score >= 40) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }
  
  return {
    reportId: foundReport.id,
    score: Math.min(100, score),
    confidence,
    reasons,
    matchedFields
  };
}

/**
 * Find potential matches for a report
 */
export async function findMatches(
  report: Report,
  minScore: number = 30
): Promise<MatchScore[]> {
  const oppositeType = report.type === 'lost' ? 'found' : 'lost';
  
  // Query for opposite type reports of same species
  const reportsQuery = query(
    collection(db, 'reports'),
    where('type', '==', oppositeType),
    where('species', '==', report.species),
    where('status', '==', 'open')
  );
  
  const snapshot = await getDocs(reportsQuery);
  const matches: MatchScore[] = [];
  
  snapshot.forEach((doc) => {
    const candidateReport = { id: doc.id, ...doc.data() } as Report;
    
    // Calculate match score
    const matchScore = calculateMatchScore(
      report.type === 'lost' ? report : candidateReport,
      report.type === 'found' ? report : candidateReport
    );
    
    // Only include matches above minimum score
    if (matchScore.score >= minScore) {
      matches.push(matchScore);
    }
  });
  
  // Sort by score (highest first)
  return matches.sort((a, b) => b.score - a.score);
}

/**
 * Create a match record in the database
 */
export async function createMatch(
  lostReportId: string,
  foundReportId: string,
  matchScore: MatchScore
): Promise<string> {
  // Get both reports to get user IDs
  const lostReportDoc = await getDoc(doc(db, 'reports', lostReportId));
  const foundReportDoc = await getDoc(doc(db, 'reports', foundReportId));
  
  if (!lostReportDoc.exists() || !foundReportDoc.exists()) {
    throw new Error('One or both reports not found');
  }
  
  const lostReport = lostReportDoc.data();
  const foundReport = foundReportDoc.data();
  
  // Create match record
  const matchData: Omit<MatchResult, 'id'> = {
    lostReportId,
    foundReportId,
    score: matchScore.score,
    confidence: matchScore.confidence,
    reasons: matchScore.reasons,
    matchedFields: matchScore.matchedFields,
    status: 'pending',
    createdAt: serverTimestamp()
  };
  
  // Add to both reports' matches subcollection
  const lostMatchRef = await addDoc(
    collection(db, 'reports', lostReportId, 'matches'),
    {
      ...matchData,
      lostReportUserId: lostReport.userId,
      foundReportUserId: foundReport.userId
    }
  );
  
  const foundMatchRef = await addDoc(
    collection(db, 'reports', foundReportId, 'matches'),
    {
      ...matchData,
      lostReportUserId: lostReport.userId,
      foundReportUserId: foundReport.userId
    }
  );
  
  // Create notification for both users
  await createMatchNotifications(
    lostReport.userId,
    foundReport.userId,
    lostReportId,
    foundReportId,
    matchScore
  );
  
  return lostMatchRef.id;
}

/**
 * Create notifications for a match
 */
async function createMatchNotifications(
  lostReportUserId: string,
  foundReportUserId: string,
  lostReportId: string,
  foundReportId: string,
  matchScore: MatchScore
) {
  const notificationBase = {
    type: 'match',
    score: matchScore.score,
    confidence: matchScore.confidence,
    isRead: false,
    createdAt: serverTimestamp()
  };
  
  // Notification for lost pet owner
  await addDoc(collection(db, 'notifications'), {
    ...notificationBase,
    userId: lostReportUserId,
    title: 'Potential Match Found!',
    message: `We found a potential match for your lost pet with ${matchScore.score}% confidence`,
    reportId: lostReportId,
    relatedReportId: foundReportId,
    actionUrl: `/match?lost=${lostReportId}&found=${foundReportId}`
  });
  
  // Notification for found pet reporter
  await addDoc(collection(db, 'notifications'), {
    ...notificationBase,
    userId: foundReportUserId,
    title: 'Owner May Be Found!',
    message: `The pet you found may have an owner looking for them (${matchScore.score}% match)`,
    reportId: foundReportId,
    relatedReportId: lostReportId,
    actionUrl: `/match?lost=${lostReportId}&found=${foundReportId}`
  });
}

/**
 * Update match status
 */
export async function updateMatchStatus(
  reportId: string,
  matchId: string,
  status: 'accepted' | 'rejected'
) {
  await updateDoc(doc(db, 'reports', reportId, 'matches', matchId), {
    status,
    updatedAt: serverTimestamp()
  });
  
  // If accepted, update report status to reunited
  if (status === 'accepted') {
    await updateDoc(doc(db, 'reports', reportId), {
      status: 'reunited',
      reunitedAt: serverTimestamp()
    });
  }
}

/**
 * Automatically run matching when a new report is created
 */
export async function autoMatch(reportId: string): Promise<void> {
  try {
    // Get the report
    const reportDoc = await getDoc(doc(db, 'reports', reportId));
    if (!reportDoc.exists()) return;
    
    const report = { id: reportDoc.id, ...reportDoc.data() } as Report;
    
    // Find matches with minimum score of 40%
    const matches = await findMatches(report, 40);
    
    // Create match records for high-confidence matches
    for (const match of matches) {
      if (match.confidence === 'high' || match.score >= 70) {
        const oppositeReportId = match.reportId;
        await createMatch(
          report.type === 'lost' ? reportId : oppositeReportId,
          report.type === 'found' ? reportId : oppositeReportId,
          match
        );
      }
    }
  } catch (error) {
    console.error('Auto-matching error:', error);
  }
}