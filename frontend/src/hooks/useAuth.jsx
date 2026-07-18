import { createContext, useContext } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getOne } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const query = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: () => getOne('/auth/me'),
    enabled: !!localStorage.getItem('iman_access_token'),
    staleTime: 60_000,
  })
  const value = {
    user: query.data,
    loading: query.isLoading,
    can: (permission) => query.data?.permissions?.includes(permission) || query.data?.roles?.includes('SUPER_ADMIN'),
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
