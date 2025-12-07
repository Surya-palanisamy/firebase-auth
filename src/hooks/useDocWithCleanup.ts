"use client"

import { useEffect, useRef, useState } from "react"
import { doc, onSnapshot, type Unsubscribe, type DocumentData } from "firebase/firestore"
import { getFirebaseDb } from "../firebase/client"

interface UseDocWithCleanupReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useDocWithCleanup = <T extends DocumentData>(
  collectionName: string,
  docId: string | null,
  onUpdate?: (data: T) => void,
): UseDocWithCleanupReturn<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!docId)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)

  const setupListener = () => {
    if (!docId) {
      setData(null)
      setLoading(false)
      return
    }

    const db = getFirebaseDb()

    try {
      const docRef = doc(db, collectionName, docId)
      unsubscribeRef.current = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const docData = {
              ...snapshot.data(),
              id: snapshot.id,
            } as T

            setData(docData)
            onUpdate?.(docData)
          } else {
            setData(null)
          }
          setLoading(false)
          setError(null)
        },
        (err) => {
          const message = err instanceof Error ? err.message : "Document error"
          setError(message)
          setLoading(false)
        },
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : "Document setup error"
      setError(message)
      setLoading(false)
    }
  }

  useEffect(() => {
    setupListener()

    return () => {
      // Clean up listener
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [collectionName, docId])

  const refetch = () => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }
    setupListener()
  }

  return { data, loading, error, refetch }
}
