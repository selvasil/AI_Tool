import express from 'express'
import { JiraClient } from '../llm/jiraClient'
import { JiraConfigSchema } from '../schemas'

export const jiraRouter = express.Router()

// Global JIRA client instance
const jiraClient = new JiraClient()

// Connect to JIRA
jiraRouter.post('/connect', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const validationResult = JiraConfigSchema.safeParse(req.body)

    if (!validationResult.success) {
      res.status(400).json({
        error: `Validation error: ${validationResult.error.message}`
      })
      return
    }

    const config = validationResult.data
    jiraClient.setConfig(config)

    // Test the connection
    const isConnected = await jiraClient.testConnection()

    if (!isConnected) {
      res.status(401).json({
        error: 'Failed to connect to JIRA. Please verify your credentials.'
      })
      return
    }

    res.json({ success: true, message: 'Successfully connected to JIRA' })
  } catch (error) {
    console.error('Error connecting to JIRA:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to connect to JIRA'
    })
  }
})

// Get all stories
jiraRouter.get('/stories', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const stories = await jiraClient.getStories()
    res.json({ stories })
  } catch (error) {
    console.error('Error fetching stories:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch stories'
    })
  }
})

// Get story details
jiraRouter.get('/stories/:key', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { key } = req.params
    const story = await jiraClient.getStoryDetails(key)
    res.json(story)
  } catch (error) {
    console.error('Error fetching story details:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to fetch story details'
    })
  }
})
