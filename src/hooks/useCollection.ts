"use client"

import { useEffect, useState } from "react"
import {
  collection,
  query,
  onSnapshot,
  type QueryConstraint,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore"
import { getFirebaseDb } from "../firebase/client"

interface UseCollectionReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
}

export const useCollection = <T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
): UseCollectionReturn<T> => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const db = getFirebaseDb()
    let unsubscribe: Unsubscribe

    try {
      const q =
        constraints.length > 0
          ? query(collection(db, collectionName), ...constraints)
          : query(collection(db, collectionName))

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map(
            (doc) =>
              ({
                ...doc.data(),
                id: doc.id,
              }) as T,
          )
          setData(docs)
          setLoading(false)
          setError(null)
        },
        (err) => {
          setError(err instanceof Error ? err.message : "Collection error")
          setLoading(false)
        },
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Collection setup error")
      setLoading(false)
    }

    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [collectionName, constraints])

  return { data, loading, error }
}
