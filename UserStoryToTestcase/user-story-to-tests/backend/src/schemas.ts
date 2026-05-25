import { z } from 'zod'

export const JiraConfigSchema = z.object({
  baseUrl: z.string().url('Invalid URL format'),
  email: z.string().email('Invalid email format'),
  apiToken: z.string().min(1, 'API token is required'),
  projectKey: z.string()
    .min(1, 'Project key is required')
    .max(10, 'Project key must be 10 characters or less')
    .regex(/^[A-Z][A-Z0-9]*$/, 'Project key must be uppercase alphanumeric starting with a letter')
})

export const JiraStorySchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  acceptanceCriteria: z.string()
})

export const GenerateRequestSchema = z.object({
  storyTitle: z.string().min(1, 'Story title is required'),
  acceptanceCriteria: z.string().min(1, 'Acceptance criteria is required'),
  description: z.string().optional(),
  additionalInfo: z.string().optional()
})

export const TestCaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  steps: z.array(z.string()),
  testData: z.string().optional(),
  expectedResult: z.string(),
  category: z.string()
})

export const GenerateResponseSchema = z.object({
  cases: z.array(TestCaseSchema),
  model: z.string().optional(),
  promptTokens: z.number(),
  completionTokens: z.number()
})

// Type exports
export type JiraConfig = z.infer<typeof JiraConfigSchema>
export type JiraStory = z.infer<typeof JiraStorySchema>
export type JiraStory = z.infer<typeof JiraStorySchema>
export type GenerateRequest = z.infer<typeof GenerateRequestSchema>
export type TestCase = z.infer<typeof TestCaseSchema>
export type GenerateResponse = z.infer<typeof GenerateResponseSchema>