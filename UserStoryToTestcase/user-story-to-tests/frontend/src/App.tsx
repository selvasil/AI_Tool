import { useState } from 'react'
import { generateTests, connectJira, getJiraStories, getJiraStoryDetails } from './api'
import { GenerateRequest, GenerateResponse, TestCase, JiraConfig, JiraStory } from './types'

function App() {
  // JIRA Connection state
  const [jiraConnected, setJiraConnected] = useState<boolean>(false)
  const [jiraConfig, setJiraConfig] = useState<JiraConfig>({
    baseUrl: '',
    email: '',
    apiToken: '',
    projectKey: ''
  })
  const [stories, setStories] = useState<JiraStory[]>([])
  const [selectedStory, setSelectedStory] = useState<JiraStory | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<GenerateRequest>({
    storyTitle: '',
    acceptanceCriteria: '',
    description: '',
    additionalInfo: ''
  })
  
  // Results state
  const [results, setResults] = useState<GenerateResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedTestCases, setExpandedTestCases] = useState<Set<string>>(new Set())
  const [showJiraModal, setShowJiraModal] = useState<boolean>(false)
  const [jiraLoading, setJiraLoading] = useState<boolean>(false)

  // JIRA connection handlers
  const handleJiraConfigChange = (field: keyof JiraConfig, value: string) => {
    setJiraConfig(prev => ({ ...prev, [field]: value }))
  }

  const handleConnectJira = async (e: React.FormEvent) => {
    e.preventDefault()
    setJiraLoading(true)
    setError(null)
    
    try {
      await connectJira(jiraConfig)
      setJiraConnected(true)
      
      // Fetch stories after connection
      const fetchedStories = await getJiraStories()
      setStories(fetchedStories)
      setShowJiraModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect to JIRA')
    } finally {
      setJiraLoading(false)
    }
  }

  const handleStorySelect = async (story: JiraStory) => {
    try {
      setJiraLoading(true)
      const details = await getJiraStoryDetails(story.id)
      setSelectedStory(details)
      setFormData({
        storyTitle: details.title,
        acceptanceCriteria: details.acceptanceCriteria,
        description: details.description,
        additionalInfo: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch story details')
    } finally {
      setJiraLoading(false)
    }
  }

  const toggleTestCaseExpansion = (testCaseId: string) => {
    const newExpanded = new Set(expandedTestCases)
    if (newExpanded.has(testCaseId)) {
      newExpanded.delete(testCaseId)
    } else {
      newExpanded.add(testCaseId)
    }
    setExpandedTestCases(newExpanded)
  }

  const handleInputChange = (field: keyof GenerateRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.storyTitle.trim() || !formData.acceptanceCriteria.trim()) {
      setError('Story Title and Acceptance Criteria are required')
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await generateTests(formData)
      setResults(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate tests')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          background-color: #f5f5f5;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 95%;
          width: 100%;
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }
        
        @media (min-width: 768px) {
          .container {
            max-width: 90%;
            padding: 30px;
          }
        }
        
        @media (min-width: 1024px) {
          .container {
            max-width: 85%;
            padding: 40px;
          }
        }
        
        @media (min-width: 1440px) {
          .container {
            max-width: 1800px;
            padding: 50px;
          }
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-content {
          flex: 1;
        }
        
        .title {
          font-size: 2.5rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .subtitle {
          color: #666;
          font-size: 1.1rem;
        }
        
        .jira-status {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 15px;
          background: #f0f4f8;
          border-radius: 6px;
          border: 2px solid #e1e8ed;
        }
        
        .status-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #e74c3c;
        }
        
        .status-indicator.connected {
          background: #27ae60;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        
        .modal {
          background: white;
          border-radius: 8px;
          padding: 30px;
          max-width: 500px;
          width: 90%;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          position: relative;
        }
        
        .modal-title {
          font-size: 1.5rem;
          color: #2c3e50;
          margin-bottom: 20px;
        }
        
        .modal-close {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #666;
        }
        
        .form-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-label {
          display: block;
          font-weight: 600;
          margin-bottom: 8px;
          color: #2c3e50;
        }
        
        .form-input, .form-textarea, .form-select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e1e8ed;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        
        .form-input:focus, .form-textarea:focus, .form-select:focus {
          outline: none;
          border-color: #3498db;
        }
        
        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }
        
        .button-group {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        
        .submit-btn, .secondary-btn {
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          border: none;
        }
        
        .submit-btn {
          background: #3498db;
          color: white;
        }
        
        .submit-btn:hover:not(:disabled) {
          background: #2980b9;
        }
        
        .submit-btn:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
        }
        
        .secondary-btn {
          background: #95a5a6;
          color: white;
        }
        
        .secondary-btn:hover {
          background: #7f8c8d;
        }
        
        .jira-btn {
          background: #0052CC;
          color: white;
        }
        
        .jira-btn:hover {
          background: #003d99;
        }
        
        .error-banner {
          background: #e74c3c;
          color: white;
          padding: 15px;
          border-radius: 6px;
          margin-bottom: 20px;
        }
        
        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
          font-size: 18px;
        }
        
        .stories-list {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-height: 300px;
          overflow-y: auto;
        }
        
        .story-item {
          padding: 15px;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .story-item:hover {
          background: #f8f9fa;
        }
        
        .story-item.selected {
          background: #e3f2fd;
          border-color: #3498db;
        }
        
        .story-key {
          font-weight: 600;
          color: #0052CC;
          font-size: 12px;
        }
        
        .story-title {
          color: #2c3e50;
          margin-top: 5px;
          font-weight: 500;
        }
        
        .selected-story {
          background: #f0f4f8;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 20px;
          border: 2px solid #3498db;
        }
        
        .selected-story-title {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .results-container {
          background: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .results-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #e1e8ed;
        }
        
        .results-title {
          font-size: 1.8rem;
          color: #2c3e50;
          margin-bottom: 10px;
        }
        
        .results-meta {
          color: #666;
          font-size: 14px;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        .results-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        
        .results-table th,
        .results-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e1e8ed;
        }
        
        .results-table th {
          background: #f8f9fa;
          font-weight: 600;
          color: #2c3e50;
        }
        
        .results-table tr:hover {
          background: #f8f9fa;
        }
        
        .category-positive { color: #27ae60; font-weight: 600; }
        .category-negative { color: #e74c3c; font-weight: 600; }
        .category-edge { color: #f39c12; font-weight: 600; }
        .category-authorization { color: #9b59b6; font-weight: 600; }
        .category-non-functional { color: #34495e; font-weight: 600; }
        
        .test-case-id {
          cursor: pointer;
          color: #3498db;
          font-weight: 600;
          padding: 8px 12px;
          border-radius: 4px;
          transition: background-color 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .test-case-id:hover {
          background: #f8f9fa;
        }
        
        .test-case-id.expanded {
          background: #e3f2fd;
          color: #1976d2;
        }
        
        .expand-icon {
          font-size: 10px;
          transition: transform 0.2s;
        }
        
        .expand-icon.expanded {
          transform: rotate(90deg);
        }
        
        .expanded-details {
          margin-top: 15px;
          background: #fafbfc;
          border: 1px solid #e1e8ed;
          border-radius: 8px;
          padding: 20px;
        }
        
        .step-item {
          background: white;
          border: 1px solid #e1e8ed;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .step-header {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          align-items: start;
        }
        
        .step-id {
          font-weight: 600;
          color: #2c3e50;
          background: #f8f9fa;
          padding: 4px 8px;
          border-radius: 4px;
          text-align: center;
          font-size: 12px;
        }
        
        .step-description {
          color: #2c3e50;
          line-height: 1.5;
        }
        
        .step-test-data {
          color: #666;
          font-style: italic;
          font-size: 14px;
        }
        
        .step-expected {
          color: #27ae60;
          font-weight: 500;
          font-size: 14px;
        }
        
        .step-labels {
          display: grid;
          grid-template-columns: 80px 1fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 10px;
          font-weight: 600;
          color: #666;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      `}</style>
      
      <div className="container">
        <div className="header">
          <div className="header-content">
            <h1 className="title">User Story to Tests</h1>
            <p className="subtitle">Generate comprehensive test cases from your user stories</p>
          </div>
          <div className="jira-status">
            <div className={`status-indicator ${jiraConnected ? 'connected' : ''}`}></div>
            <div>
              <div style={{fontWeight: 600, fontSize: '14px'}}>
                {jiraConnected ? 'JIRA Connected' : 'JIRA Disconnected'}
              </div>
            </div>
            <button 
              onClick={() => setShowJiraModal(true)}
              className="jira-btn"
              style={{marginLeft: '10px'}}
            >
              {jiraConnected ? 'Reconnect' : 'Connect'} JIRA
            </button>
          </div>
        </div>

        {/* JIRA Connection Modal */}
        {showJiraModal && (
          <div className="modal-overlay" onClick={() => !jiraLoading && setShowJiraModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <button 
                className="modal-close" 
                onClick={() => setShowJiraModal(false)}
                disabled={jiraLoading}
              >
                ×
              </button>
              <h2 className="modal-title">Connect to JIRA</h2>
              <form onSubmit={handleConnectJira}>
                <div className="form-group">
                  <label className="form-label">JIRA Base URL *</label>
                  <input
                    type="url"
                    className="form-input"
                    value={jiraConfig.baseUrl}
                    onChange={(e) => handleJiraConfigChange('baseUrl', e.target.value)}
                    placeholder="https://your-domain.atlassian.net"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-input"
                    value={jiraConfig.email}
                    onChange={(e) => handleJiraConfigChange('email', e.target.value)}
                    placeholder="your-email@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Project Key *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={jiraConfig.projectKey}
                    onChange={(e) => handleJiraConfigChange('projectKey', e.target.value.toUpperCase())}
                    placeholder="e.g., PROJ, ABC, etc."
                    maxLength={10}
                    required
                  />
                  <div style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                    Project key from your JIRA URL (e.g., in PROJ-123, the key is PROJ)
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">API Token *</label>
                  <input
                    type="password"
                    className="form-input"
                    value={jiraConfig.apiToken}
                    onChange={(e) => handleJiraConfigChange('apiToken', e.target.value)}
                    placeholder="Enter your JIRA API token"
                    required
                  />
                </div>
                <div className="button-group">
                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={jiraLoading}
                  >
                    {jiraLoading ? 'Connecting...' : 'Connect'}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => setShowJiraModal(false)}
                    disabled={jiraLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stories List (when connected) */}
        {jiraConnected && stories.length > 0 && (
          <div className="stories-list">
            <h3 style={{marginBottom: '15px', color: '#2c3e50'}}>Available User Stories</h3>
            {stories.map((story) => (
              <div
                key={story.id}
                className={`story-item ${selectedStory?.id === story.id ? 'selected' : ''}`}
                onClick={() => handleStorySelect(story)}
              >
                <div className="story-key">{story.id}</div>
                <div className="story-title">{story.title}</div>
              </div>
            ))}
          </div>
        )}

        {/* Selected Story Details */}
        {selectedStory && (
          <div className="selected-story">
            <div className="selected-story-title">
              Selected: {selectedStory.id} - {selectedStory.title}
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label htmlFor="storyTitle" className="form-label">
              Story Title *
            </label>
            <input
              type="text"
              id="storyTitle"
              className="form-input"
              value={formData.storyTitle}
              onChange={(e) => handleInputChange('storyTitle', e.target.value)}
              placeholder="Enter the user story title..."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              className="form-textarea"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Additional description (optional)..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="acceptanceCriteria" className="form-label">
              Acceptance Criteria *
            </label>
            <textarea
              id="acceptanceCriteria"
              className="form-textarea"
              value={formData.acceptanceCriteria}
              onChange={(e) => handleInputChange('acceptanceCriteria', e.target.value)}
              placeholder="Enter the acceptance criteria..."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="additionalInfo" className="form-label">
              Additional Info
            </label>
            <textarea
              id="additionalInfo"
              className="form-textarea"
              value={formData.additionalInfo}
              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
              placeholder="Any additional information (optional)..."
            />
          </div>
          
          <button
            type="submit"
            className="submit-btn"
            disabled={isLoading || !formData.storyTitle.trim()}
          >
            {isLoading ? 'Generating...' : 'Generate Test Cases'}
          </button>
        </form>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="loading">
            Generating test cases...
          </div>
        )}

        {results && (
          <div className="results-container">
            <div className="results-header">
              <h2 className="results-title">Generated Test Cases</h2>
              <div className="results-meta">
                {results.cases.length} test case(s) generated
                {results.model && ` • Model: ${results.model}`}
                {results.promptTokens > 0 && ` • Tokens: ${results.promptTokens + results.completionTokens}`}
              </div>
            </div>
            
            <div className="table-container">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Test Case ID</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Expected Result</th>
                  </tr>
                </thead>
                <tbody>
                  {results.cases.map((testCase: TestCase) => (
                    <>
                      <tr key={testCase.id}>
                        <td>
                          <div 
                            className={`test-case-id ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}
                            onClick={() => toggleTestCaseExpansion(testCase.id)}
                          >
                            <span className={`expand-icon ${expandedTestCases.has(testCase.id) ? 'expanded' : ''}`}>
                              ▶
                            </span>
                            {testCase.id}
                          </div>
                        </td>
                        <td>{testCase.title}</td>
                        <td>
                          <span className={`category-${testCase.category.toLowerCase()}`}>
                            {testCase.category}
                          </span>
                        </td>
                        <td>{testCase.expectedResult}</td>
                      </tr>
                      {expandedTestCases.has(testCase.id) && (
                        <tr key={`${testCase.id}-details`}>
                          <td colSpan={4}>
                            <div className="expanded-details">
                              <h4 style={{marginBottom: '15px', color: '#2c3e50'}}>Test Steps for {testCase.id}</h4>
                              <div className="step-labels">
                                <div>Step ID</div>
                                <div>Step Description</div>
                                <div>Test Data</div>
                                <div>Expected Result</div>
                              </div>
                              {testCase.steps.map((step, index) => (
                                <div key={index} className="step-item">
                                  <div className="step-header">
                                    <div className="step-id">S{String(index + 1).padStart(2, '0')}</div>
                                    <div className="step-description">{step}</div>
                                    <div className="step-test-data">{testCase.testData || 'N/A'}</div>
                                    <div className="step-expected">
                                      {index === testCase.steps.length - 1 ? testCase.expectedResult : 'Step completed successfully'}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App