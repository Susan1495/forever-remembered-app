/**
 * Slug generation for tribute URLs
 * Format: "margaret-anne-kowalski-xk7p2"
 */

import { customAlphabet } from 'nanoid'

// URL-safe alphabet, no lookalikes
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 6)

export function generateSlug(subjectName: string): string {
  // "Margaret Anne Kowalski" → "margaret-anne-kowalski-xk7p2"
  const namePart = subjectName
    .toLowerCase()
    .normalize('NFD') // decompose accented chars
    .replace(/[\u0300-\u036f]/g, '') // strip accent marks
    .replace(/[^a-z0-9\s]/g, '') // strip remaining special chars
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3) // max 3 name parts for readable URLs
    .join('-')

  const uniquePart = nanoid()
  return namePart ? `${namePart}-${uniquePart}` : `tribute-${uniquePart}`
}

/**
 * Determine subject age group from dates and relationship
 * Used to set appropriate AI tone
 */
export function determineAgeGroup(
  birthDate: string | null,
  deathDate: string | null,
  relationship: string | null
): 'adult' | 'child' | 'infant' | 'pet' {
  // Pet check first
  if (relationship?.toLowerCase() === 'pet') return 'pet'

  // Check for child/baby relationship
  const childRelationships = ['child', 'my child', 'my baby', 'baby', 'son', 'daughter', 'infant']
  if (relationship && childRelationships.some(r => relationship.toLowerCase().includes(r))) {
    // Could be adult child — check dates to confirm
    if (birthDate && deathDate) {
      const birth = new Date(birthDate)
      const death = new Date(deathDate)
      const ageYears = (death.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365)
      if (ageYears < 1) return 'infant'
      if (ageYears < 18) return 'child'
    }
    // No dates — if they said "my baby" treat as infant
    if (relationship.toLowerCase().includes('baby') || relationship.toLowerCase().includes('infant')) {
      return 'infant'
    }
  }

  // Calculate age from dates if available
  if (birthDate && deathDate) {
    const birth = new Date(birthDate)
    const death = new Date(deathDate)
    const ageYears = (death.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24 * 365)
    if (ageYears < 1) return 'infant'
    if (ageYears < 18) return 'child'
  }

  return 'adult'
}

/**
 * Check if person is still living (no death date, or death date in future)
 */
export function isPersonLiving(deathDate: string | null): boolean {
  if (!deathDate) return true
  const death = new Date(deathDate)
  return death > new Date()
}
