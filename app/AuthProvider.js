'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/auth'
import { logger } from "@/utils/logger";

const AccountContext = createContext({ user: null, loading: true, profile: null, role: null })

const SIGNED_OUT = { uid: null, profile: null, role: null }

// The signed-in user with their profile document and admin role, read once for the whole
// layout instead of separately by the navbar and each page.
export default function AuthProvider({ children }) {
  const [user, loading] = useAuthState(auth)
  const locale = useLocale()
  const [account, setAccount] = useState(SIGNED_OUT)

  useEffect(() => {
    if (!user) {
      setAccount(SIGNED_OUT)
      return undefined
    }

    let active = true
    import('@/utils/account')
      .then(({ loadAccount }) => loadAccount(user, locale))
      .then((next) => {
        if (active) setAccount({ uid: user.uid, ...next })
      })
      .catch((error) => logger.warn("Failed to load the account:", error))

    return () => {
      active = false
    }
    // The locale only fills in a new profile document; switching it must not reload the account.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const value = useMemo(() => {
    const current = user && account.uid === user.uid ? account : SIGNED_OUT
    return { user: user ?? null, loading, profile: current.profile, role: current.role }
  }, [user, loading, account])

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  return useContext(AccountContext)
}
