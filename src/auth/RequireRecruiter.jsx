import { Navigate, useLocation } from 'react-router-dom'
import { isEmployer, getRole } from './auth.js'

export default function RequireRecruiter({ children }){
  const location = useLocation()
  const role = getRole()
  console.log('RequireRecruiter check:', { role, pathname: location.pathname })

  // Accept only 'recruiter' role
  if(role !== 'recruiter'){
    console.log('RequireRecruiter: Redirecting to login, role is:', role)
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?role=recruiter&redirect=${redirect}`} replace />
  }
  console.log('RequireRecruiter: Allowing access')
  return children
}
