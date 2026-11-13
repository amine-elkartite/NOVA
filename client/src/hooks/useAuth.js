import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext.jsx'

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth doit être utilisé dans AuthProvider'
    )
  }

  return context
}

export default useAuth