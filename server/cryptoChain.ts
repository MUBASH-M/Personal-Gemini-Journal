import crypto from 'crypto';

export interface HashChainBlockInfo {
  sequenceIndex: number;
  entryId: string;
  hash: string;
  prevHash: string;
  calculatedHash: string;
  isValid: boolean;
  timestamp: string;
  summaryPreview: string;
  tampered?: boolean;
}

export interface HashChainVerificationResult {
  isValid: boolean;
  totalBlocks: number;
  verifiedAt: string;
  brokenBlockIndex?: number;
  reason?: string;
  blocks: HashChainBlockInfo[];
}

export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes canonical SHA-256 digest of an entry chained to previous hash.
 */
export function calculateBlockHash(
  prevHash: string,
  entry: {
    entryId: string;
    uid: string;
    createdAt: string;
    summary: string;
    mood: string;
    keyTakeaway?: string;
    turnCount: number;
  }
): string {
  const canonicalString = [
    prevHash,
    entry.entryId,
    entry.uid,
    entry.createdAt,
    entry.summary.trim(),
    entry.mood.trim().toLowerCase(),
    (entry.keyTakeaway || '').trim(),
    entry.turnCount,
  ].join('::');

  return crypto.createHash('sha256').update(canonicalString, 'utf8').digest('hex');
}

/**
 * Evaluates full cryptographic hash chain integrity for an ordered array of user entries.
 * Returns detailed block-by-block mathematical proof.
 */
export function verifyHashChain(entriesChronological: any[]): HashChainVerificationResult {
  const blocks: HashChainBlockInfo[] = [];
  let brokenBlockIndex: number | undefined = undefined;
  let brokenReason: string | undefined = undefined;

  let expectedPrevHash = GENESIS_HASH;

  for (let i = 0; i < entriesChronological.length; i++) {
    const entry = entriesChronological[i];
    const seq = entry.sequenceIndex || i + 1;
    const recordedHash = entry.hash || '';
    const recordedPrevHash = entry.prevHash || '';

    // Calculate what hash SHOULD be based on entry contents
    const calculatedHash = calculateBlockHash(recordedPrevHash, entry);

    // Verify two conditions:
    // 1. Previous hash link matches preceding block
    // 2. Calculated hash matches recorded block hash
    const prevLinkMatches = recordedPrevHash === expectedPrevHash;
    const contentHashMatches = calculatedHash === recordedHash;
    const isBlockValid = prevLinkMatches && contentHashMatches;

    if (!isBlockValid && brokenBlockIndex === undefined) {
      brokenBlockIndex = seq;
      if (!contentHashMatches) {
        brokenReason = `Content Tampering Detected at Block #${seq} (${entry.entryId}). Canonical digest ${calculatedHash.substring(0, 16)}... does not match sealed hash ${recordedHash.substring(0, 16)}...`;
      } else if (!prevLinkMatches) {
        brokenReason = `Chain Continuity Severed at Block #${seq}. Expected prevHash ${expectedPrevHash.substring(0, 16)}... but found ${recordedPrevHash.substring(0, 16)}...`;
      }
    }

    blocks.push({
      sequenceIndex: seq,
      entryId: entry.entryId,
      hash: recordedHash,
      prevHash: recordedPrevHash,
      calculatedHash,
      isValid: isBlockValid,
      timestamp: entry.createdAt,
      summaryPreview: entry.summary.substring(0, 80) + (entry.summary.length > 80 ? '...' : ''),
      tampered: !isBlockValid,
    });

    // Next expected prevHash is this block's recorded hash
    expectedPrevHash = recordedHash;
  }

  const allValid = brokenBlockIndex === undefined && blocks.every((b) => b.isValid);

  return {
    isValid: allValid,
    totalBlocks: blocks.length,
    verifiedAt: new Date().toISOString(),
    brokenBlockIndex,
    reason: brokenReason,
    blocks,
  };
}
