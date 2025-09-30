import { useSubscribeDev } from '@subscribe.dev/react'
import './App.css'
import SignInScreen from './components/SignInScreen'
import FrogGenerator from './components/FrogGenerator'

function App() {
  const { isSignedIn } = useSubscribeDev()

  return isSignedIn ? <FrogGenerator /> : <SignInScreen />
}

export default App
