"use client"

import { useEffect, useState, useCallback } from "react"
import {
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  type User as FirebaseUser,
  onAuthStateChanged,
} from "firebase/auth"
import { getFirebaseAuth } from "../firebase/client"

export interface AuthUser {
  uid: string
  email: string | null
  displayName: string | null
}

interface UseAuthReturn {
  user: AuthUser | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  logOut: () => Promise<void>
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const auth = getFirebaseAuth()
    let unsubscribe: (() => void) | undefined

    try {
      unsubscribe = onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth error")
      setLoading(false)
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<void> => {
    setError(null)
    try {
      const auth = getFirebaseAuth()
      await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed"
      setError(message)
      throw err
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string): Promise<void> => {
    setError(null)
    try {
      const auth = getFirebaseAuth()
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign up failed"
      setError(message)
      throw err
    }
  }, [])

  const logOut = useCallback(async (): Promise<void> => {
    setError(null)
    try {
      const auth = getFirebaseAuth()
      await signOut(auth)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign out failed"
      setError(message)
      throw err
    }
  }, [])

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    logOut,
  }
}
