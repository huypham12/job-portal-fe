import { Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn } from './auth.js'

export default function RequireAuth({ children }){
  const location = useLocation()
  if(!isLoggedIn()){
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?role=seeker&redirect=${redirect}`} replace />
  }
  return children
}

