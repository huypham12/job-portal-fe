import { Navigate, useLocation } from 'react-router-dom'
import { getRole } from './auth.js'

export default function RequireAdmin({ children }){
  const location = useLocation()
  const role = getRole()
  console.log('RequireAdmin check:', { role, pathname: location.pathname })
  
  // Check if user is admin
  if(role !== 'admin'){
    console.log('RequireAdmin: Redirecting to admin login, role is:', role)
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/admin/login?redirect=${redirect}`} replace />
  }
  console.log('RequireAdmin: Allowing access')
  return children
}

