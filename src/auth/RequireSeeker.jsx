import { Navigate, useLocation } from 'react-router-dom'
import { getRole } from './auth.js'

export default function RequireSeeker({ children }){
  const location = useLocation()
  const role = getRole()
  if(role !== 'seeker'){
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?role=seeker&redirect=${redirect}`} replace />
  }
  return children
}

