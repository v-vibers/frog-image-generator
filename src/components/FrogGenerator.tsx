import { useState } from 'react'
import { useSubscribeDev } from '@subscribe.dev/react'

type GenerationHistory = {
  prompt: string
  imageUrl: string
  timestamp: number
}

type ErrorType = {
  type?: 'insufficient_credits' | 'rate_limit_exceeded' | 'network_error'
  message: string
  retryAfter?: number
}

export default function FrogGenerator() {
  const {
    client,
    user,
    usage,
    subscribe,
    subscriptionStatus,
    signOut,
    useStorage
  } = useSubscribeDev()

  const [history, setHistory, syncStatus] = useStorage<GenerationHistory[]>('frog-history', [])
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<ErrorType | null>(null)
  const [retryTimer, setRetryTimer] = useState<number | null>(null)

  const generateFrogImage = async () => {
    if (!client || !prompt.trim()) return

    setLoading(true)
    setError(null)
    setRetryTimer(null)

    try {
      const { output } = await client.run('black-forest-labs/flux-schnell', {
        input: {
          prompt: `A frog ${prompt}`,
          width: 1024,
          height: 1024
        }
      })

      const imageUrl = output[0] as string
      const newEntry: GenerationHistory = {
        prompt: `A frog ${prompt}`,
        imageUrl,
        timestamp: Date.now()
      }

      setHistory([newEntry, ...history])
      setPrompt('')
    } catch (err: any) {
      if (err.type === 'insufficient_credits') {
        setError({
          type: 'insufficient_credits',
          message: 'Insufficient credits. Please upgrade your subscription to continue generating images.'
        })
      } else if (err.type === 'rate_limit_exceeded') {
        const retryAfter = err.retryAfter || 60000
        setError({
          type: 'rate_limit_exceeded',
          message: `Rate limit exceeded. Please wait ${Math.ceil(retryAfter / 1000)} seconds before trying again.`,
          retryAfter
        })
        setRetryTimer(retryAfter)

        const interval = setInterval(() => {
          setRetryTimer(prev => {
            if (prev === null || prev <= 1000) {
              clearInterval(interval)
              return null
            }
            return prev - 1000
          })
        }, 1000)
      } else {
        setError({
          type: 'network_error',
          message: err.message || 'An error occurred while generating the image. Please try again.'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      generateFrogImage()
    }
  }

  return (
    <div className="frog-generator-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">Frog Image Generator</h1>
          <div className="user-info">
            <div className="user-details">
              {user?.email && <span className="user-email">{user.email}</span>}
              <div className="user-stats">
                <span className="credits-badge">
                  {usage?.remainingCredits ?? 0} credits
                </span>
                <span className="plan-badge">
                  {subscriptionStatus?.plan?.name ?? 'Free'}
                </span>
              </div>
            </div>
            <div className="user-actions">
              {subscribe && (
                <button onClick={subscribe} className="btn-secondary">
                  Manage Subscription
                </button>
              )}
              <button onClick={signOut} className="btn-secondary">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="generator-section">
          <div className="input-section">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="sitting on a lily pad, wearing a crown, jumping in the air..."
              className="prompt-input"
              disabled={loading || retryTimer !== null}
            />
            <button
              onClick={generateFrogImage}
              disabled={loading || !prompt.trim() || retryTimer !== null}
              className="btn-primary generate-btn"
            >
              {loading ? 'Generating...' : retryTimer ? `Wait ${Math.ceil(retryTimer / 1000)}s` : 'Generate Frog'}
            </button>
          </div>

          {error && (
            <div className={`error-message error-${error.type}`}>
              <p>{error.message}</p>
              {error.type === 'insufficient_credits' && subscribe && (
                <button onClick={subscribe} className="btn-primary">
                  Upgrade Now
                </button>
              )}
              {error.type === 'network_error' && (
                <button onClick={generateFrogImage} className="btn-secondary">
                  Retry
                </button>
              )}
            </div>
          )}

          {syncStatus === 'syncing' && (
            <div className="sync-indicator">
              Syncing...
            </div>
          )}
          {syncStatus === 'error' && (
            <div className="sync-error">
              Failed to sync history
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="history-section">
            <h2 className="section-title">Your Frog Gallery</h2>
            <div className="image-grid">
              {history.map((item, index) => (
                <div key={index} className="image-card">
                  <img
                    src={item.imageUrl}
                    alt={item.prompt}
                    className="generated-image"
                  />
                  <div className="image-info">
                    <p className="image-prompt">{item.prompt}</p>
                    <p className="image-date">
                      {new Date(item.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && !loading && (
          <div className="empty-state">
            <p>No frogs generated yet. Enter a description and click Generate!</p>
          </div>
        )}
      </main>
    </div>
  )
}