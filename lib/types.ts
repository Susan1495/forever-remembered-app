/**
 * Core TypeScript types for Forever Remembered
 */

export type TributeStatus = 'processing' | 'published' | 'failed' | 'draft'

export type AgeGroup = 'adult' | 'child' | 'infant' | 'pet'

export type TemplateId = 'golden-hour' | 'classic' | 'garden' | 'minimal'

export type AITheme =
  | 'gentle'
  | 'joyful'
  | 'faith'
  | 'nature'
  | 'humor'
  | 'strength'
  | 'family'
  | 'adventure'
  | 'wisdom'
  | 'love'

export interface TributeBody {
  opening: string
  life: string
  legacy: string
  closing: string
}

export interface Tribute {
  id: string
  slug: string
  creator_email: string | null
  creator_ip: string | null
  subject_name: string
  subject_bio: string | null
  birth_date: string | null
  death_date: string | null
  relationship: string | null
  extra_context: string | null
  is_living: boolean
  subject_age_group: AgeGroup | null
  ai_headline: string | null
  ai_pull_quote: string | null
  ai_body: TributeBody | null
  ai_themes: AITheme[] | null
  hero_photo_idx: number
  template_id: TemplateId | null
  ai_photo_captions: Record<string, string> | null
  status: TributeStatus
  view_count: number
  candle_count: number
  created_at: string
  published_at: string | null
  expires_at: string
}

export interface TributePhoto {
  id: string
  tribute_id: string
  storage_path: string
  cdn_url: string
  display_order: number
  file_size_bytes: number | null
  width: number | null
  height: number | null
  created_at: string
}

export interface UpsellLead {
  id: string
  tribute_id: string
  email: string
  trigger: 'post_creation' | 'share' | 'return'
  notified_at: string | null
  created_at: string
}

// API request/response types

export interface CreateTributeRequest {
  subjectName: string
  subjectBio?: string
  birthDate?: string
  deathDate?: string
  relationship?: string
  extraContext?: string
  photoStoragePaths?: string[]
  creatorEmail?: string
}

export interface CreateTributeResponse {
  slug: string
  tributeId: string
}

export interface TributeStatusResponse {
  status: TributeStatus
}

export interface PresignRequest {
  files: Array<{
    name: string
    type: string
    size: number
  }>
}

export interface PresignResponse {
  uploads: Array<{
    presignedUrl: string
    storagePath: string
    photoId: string
  }>
}

export interface CandleResponse {
  candleCount: number
}

export interface UpsellLeadRequest {
  tributeId: string
  email: string
  trigger: string
}

// Form state types (client-side)

export interface TributeFormData {
  subjectName: string
  subjectBio: string
  birthDate: string
  deathDate: string
  relationship: string
  relationshipOther: string
  extraContext: string
  photos: UploadedPhoto[]
  creatorEmail: string
}

export interface UploadedPhoto {
  id: string
  file: File
  previewUrl: string
  uploadedUrl?: string
  storagePath?: string
  uploadProgress: number
  uploadStatus: 'pending' | 'uploading' | 'done' | 'error'
}
