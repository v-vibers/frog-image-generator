import { useSubscribeDev } from '@subscribe.dev/react'

export default function SignInScreen() {
  const { signIn } = useSubscribeDev()

  return (
    <div className="sign-in-container">
      <div className="sign-in-card">
        <h1 className="app-title">Frog Image Generator</h1>
        <p className="app-description">
          Generate unique and creative frog images using AI
        </p>
        <div className="sign-in-actions">
          <button onClick={signIn} className="btn-primary">
            Sign In
          </button>
        </div>
        <p className="sign-in-note">
          Sign in to start generating amazing frog images
        </p>
      </div>
    </div>
  )
}