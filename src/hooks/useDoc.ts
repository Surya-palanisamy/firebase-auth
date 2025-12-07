"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot, type Unsubscribe, type DocumentData } from "firebase/firestore"
import { getFirebaseDb } from "../firebase/client"

interface UseDocReturn<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export const useDoc = <T extends DocumentData>(collectionName: string, docId: string | null): UseDocReturn<T> => {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!docId)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!docId) {
      setData(null)
      setLoading(false)
      return
    }

    const db = getFirebaseDb()
    let unsubscribe: Unsubscribe

    try {
      const docRef = doc(db, collectionName, docId)
      unsubscribe = onSnapshot(
        docRef,
        (snapshot) => {
          if (snapshot.exists()) {
            setData({
              ...snapshot.data(),
              id: snapshot.id,
            } as T)
          } else {
            setData(null)
          }
          setLoading(false)
          setError(null)
        },
        (err) => {
          setError(err instanceof Error ? err.message : "Document error")
          setLoading(false)
        },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Document setup error")
      setLoading(false)
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [collectionName, docId])

  return { data, loading, error }
}
