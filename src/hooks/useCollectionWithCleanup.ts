"use client"

import { useEffect, useRef, useState } from "react"
import {
  collection,
  query,
  onSnapshot,
  type QueryConstraint,
  type Unsubscribe,
  type DocumentData,
} from "firebase/firestore"
import { getFirebaseDb } from "../firebase/client"
import type { FirestoreListenerManager } from "../utils/firestore-utils"

interface UseCollectionWithCleanupReturn<T> {
  data: T[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useCollectionWithCleanup = <T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = [],
  listenerKey?: string,
  listenerManager?: FirestoreListenerManager,
): UseCollectionWithCleanupReturn<T> => {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const unsubscribeRef = useRef<Unsubscribe | null>(null)

  const setupListener = () => {
    const db = getFirebaseDb()

    try {
      const q =
        constraints.length > 0
          ? query(collection(db, collectionName), ...constraints)
          : query(collection(db, collectionName))

      unsubscribeRef.current = onSnapshot(
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
          const message = err instanceof Error ? err.message : "Collection error"
          setError(message)
          setLoading(false)
        },
      )

      // Register with manager if provided
      if (listenerManager && listenerKey) {
        listenerManager.subscribe(listenerKey, unsubscribeRef.current)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Collection setup error"
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

      // Unregister from manager if provided
      if (listenerManager && listenerKey) {
        listenerManager.unsubscribe(listenerKey)
      }
    }
  }, [collectionName, JSON.stringify(constraints)])

  const refetch = () => {
    // Unsubscribe from old listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current()
    }

    // Set up new listener
    setupListener()
  }

  return { data, loading, error, refetch }
}
