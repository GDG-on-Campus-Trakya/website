'use client'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLocale } from 'next-intl'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/lib/firebase/auth'
import { logger } from "@/utils/logger";

const AccountContext = createContext({
  user: null,
  loading: true,
  profile: null,
  role: null,
  mergeProfile: () => {},
})

const SIGNED_OUT = { uid: null, profile: null, role: null }

// Switching language remounts the layout. Starting from the last account read in this tab shows
// the photo and admin link at once instead of blinking while Firestore answers again.
let lastAccount = SIGNED_OUT

// The signed-in user with their profile document and admin role, read once for the whole
// layout instead of separately by the navbar and each page.
export default function AuthProvider({ children }) {
  const [user, loading] = useAuthState(auth)
  const locale = useLocale()
  const [account, setAccount] = useState(lastAccount)

  useEffect(() => {
    if (!user) {
      lastAccount = SIGNED_OUT
      setAccount(SIGNED_OUT)
      return undefined
    }

    let active = true
    import('@/utils/account')
      .then(({ loadAccount }) => loadAccount(user, locale))
      .then((next) => {
        lastAccount = { uid: user.uid, ...next }
        if (active) setAccount(lastAccount)
      })
      .catch((error) => logger.warn("Failed to load the account:", error))

    return () => {
      active = false
    }
    // The locale only fills in a new profile document; it is not a reason to read the account again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // After a page writes to users/{uid}, it passes the same fields here so every reader of the
  // account (navbar, event registration) sees them without reading the document again.
  const mergeProfile = useCallback(
    (fields) => {
      if (!user) return
      setAccount((prev) => {
        const base = prev.uid === user.uid ? prev : { ...SIGNED_OUT, uid: user.uid }
        lastAccount = { ...base, profile: { ...(base.profile || {}), ...fields } }
        return lastAccount
      })
    },
    [user]
  )

  const value = useMemo(() => {
    const current = user && account.uid === user.uid ? account : SIGNED_OUT
    return {
      user: user ?? null,
      loading,
      profile: current.profile,
      role: current.role,
      mergeProfile,
    }
  }, [user, loading, account, mergeProfile])

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export function useAccount() {
  return useContext(AccountContext)
}
