import fetch from 'node-fetch'

export interface JiraConfig {
  baseUrl: string
  email: string
  apiToken: string
  projectKey: string
}

export interface JiraStory {
  key: string
  fields: {
    summary: string
    description: string
    customfield_10000?: string
  }
}

export interface JiraStoryDetails {
  id: string
  title: string
  description: string
  acceptanceCriteria: string
}

export class JiraClient {
  private config: JiraConfig | null = null

  setConfig(config: JiraConfig): void {
    this.config = config
  }

  private getAuthHeader(): string {
    if (!this.config) throw new Error('JIRA not configured')
    const credentials = Buffer.from(
      `${this.config.email}:${this.config.apiToken}`
    ).toString('base64')
    return `Basic ${credentials}`
  }

  async testConnection(): Promise<boolean> {
    if (!this.config) throw new Error('JIRA not configured')
    try {
      const response = await fetch(`${this.config.baseUrl}/rest/api/3/myself`, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json'
        }
      }) as any

      if (!response.ok) {
        console.error(`Connection test failed with status: ${response.status}`)
        const errorText = await response.text()
        console.error('Error response:', errorText)
        return false
      }
      return true
    } catch (error) {
      console.error('JIRA connection test failed:', error)
      return false
    }
  }

  async getStories(): Promise<JiraStoryDetails[]> {
    if (!this.config) throw new Error('JIRA not configured')

    try {
      // Use project key with proper encoding
      const jql = `project = "${this.config.projectKey}" AND type = Story`
      const encodedJql = encodeURIComponent(jql)
      const url = `${this.config.baseUrl}/rest/api/3/search?jql=${encodedJql}&maxResults=50`

      console.log('Fetching stories from URL:', url)
      console.log('JQL Query:', jql)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json'
        }
      }) as any

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error ${response.status}:`, errorText)
        
        // Try fallback to v2 API if v3 fails
        if (response.status === 410 || response.status === 404) {
          console.log('Attempting fallback to JIRA API v2...')
          return await this.getStoriesV2()
        }
        
        throw new Error(`JIRA API error: ${response.status} - ${errorText}`)
      }

      const data = (await response.json()) as any

      if (!data.issues || data.issues.length === 0) {
        console.warn('No stories found for project:', this.config.projectKey)
        return []
      }

      return data.issues.map((issue: any) => ({
        id: issue.key,
        title: issue.fields.summary,
        description: this.extractDescription(issue.fields.description),
        acceptanceCriteria: this.extractAcceptanceCriteria(issue.fields)
      }))
    } catch (error) {
      console.error('Error fetching JIRA stories:', error)
      throw error
    }
  }

  private async getStoriesV2(): Promise<JiraStoryDetails[]> {
    if (!this.config) throw new Error('JIRA not configured')

    try {
      const jql = `project = "${this.config.projectKey}" AND type = Story`
      const encodedJql = encodeURIComponent(jql)
      const url = `${this.config.baseUrl}/rest/api/2/search?jql=${encodedJql}&maxResults=50`

      console.log('Fetching stories from v2 API:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json'
        }
      }) as any

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API v2 Error ${response.status}:`, errorText)
        throw new Error(`JIRA API v2 error: ${response.status}`)
      }

      const data = (await response.json()) as any

      if (!data.issues || data.issues.length === 0) {
        console.warn('No stories found in v2 API for project:', this.config.projectKey)
        return []
      }

      return data.issues.map((issue: any) => ({
        id: issue.key,
        title: issue.fields.summary,
        description: this.extractDescription(issue.fields.description),
        acceptanceCriteria: this.extractAcceptanceCriteria(issue.fields)
      }))
    } catch (error) {
      console.error('Error fetching JIRA stories from v2 API:', error)
      throw error
    }
  }

  async getStoryDetails(storyKey: string): Promise<JiraStoryDetails> {
    if (!this.config) throw new Error('JIRA not configured')

    try {
      const url = `${this.config.baseUrl}/rest/api/3/issue/${storyKey}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json'
        }
      }) as any

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error ${response.status}:`, errorText)
        
        // Fallback to v2 API
        if (response.status === 410 || response.status === 404) {
          console.log('Attempting fallback to v2 API for story details...')
          return await this.getStoryDetailsV2(storyKey)
        }
        
        throw new Error(`JIRA API error: ${response.status}`)
      }

      const issue = (await response.json()) as any

      return {
        id: issue.key,
        title: issue.fields.summary,
        description: this.extractDescription(issue.fields.description),
        acceptanceCriteria: this.extractAcceptanceCriteria(issue.fields)
      }
    } catch (error) {
      console.error('Error fetching JIRA story details:', error)
      throw error
    }
  }

  private async getStoryDetailsV2(storyKey: string): Promise<JiraStoryDetails> {
    if (!this.config) throw new Error('JIRA not configured')

    try {
      const url = `${this.config.baseUrl}/rest/api/2/issue/${storyKey}`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json'
        }
      }) as any

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API v2 Error ${response.status}:`, errorText)
        throw new Error(`JIRA API v2 error: ${response.status}`)
      }

      const issue = (await response.json()) as any

      return {
        id: issue.key,
        title: issue.fields.summary,
        description: this.extractDescription(issue.fields.description),
        acceptanceCriteria: this.extractAcceptanceCriteria(issue.fields)
      }
    } catch (error) {
      console.error('Error fetching story details from v2 API:', error)
      throw error
    }
  }

  private extractDescription(description: any): string {
    if (!description) return ''
    
    if (typeof description === 'string') {
      return description
    }

    // Handle Atlassian Document Format (ADF)
    if (description.content && Array.isArray(description.content)) {
      return description.content
        .map((block: any) => {
          if (block.type === 'paragraph' && block.content) {
            return block.content
              .map((inline: any) => inline.text || '')
              .join('')
          }
          return ''
        })
        .join('\n')
    }

    return ''
  }

  private extractAcceptanceCriteria(fields: any): string {
    // Try common acceptance criteria field names
    const criteriaFields = [
      'customfield_10000',
      'customfield_10001',
      'customfield_10002',
      'customfield_10010',
      'customfield_10020'
    ]

    for (const field of criteriaFields) {
      if (fields[field]) {
        const value = fields[field]
        if (typeof value === 'string') {
          return value
        }
        if (typeof value === 'object' && value.content) {
          return this.extractDescription(value)
        }
      }
    }

    // Fallback to description if no dedicated field
    return this.extractDescription(fields.description) || 'No acceptance criteria provided'
  }
}
