"use client"

import type { Unsubscribe } from "firebase/firestore"
import { async } from "rxjs"

/**
 * Manages multiple Firestore unsubscribe functions for organized cleanup.
 * Prevents memory leaks from uncleaned listeners.
 */
export class FirestoreListenerManager {
  private listeners: Map<string, Unsubscribe> = new Map()

  /**
   * Register a listener with a unique key for tracking
   */
  subscribe(key: string, unsubscribe: Unsubscribe): void {
    if (this.listeners.has(key)) {
      this.listeners.get(key)?.()
    }
    this.listeners.set(key, unsubscribe)
  }

  /**
   * Unsubscribe from a specific listener
   */
  unsubscribe(key: string): void {
    const unsub = this.listeners.get(key)
    if (unsub) {
      unsub()
      this.listeners.delete(key)
    }
  }

  /**
   * Unsubscribe from all registered listeners
   */
  unsubscribeAll(): void {
    for (const [, unsub] of this.listeners) {
      unsub()
    }
    this.listeners.clear()
  }

  /**
   * Get count of active listeners for debugging
   */
  getActiveListenerCount(): number {
    return this.listeners.size
  }

  /**
   * Get all listener keys for inspection
   */
  getListenerKeys(): string[] {
    return Array.from(this.listeners.keys())
  }
}

/**
 * Type-safe Firestore document converter for custom serialization
 */
export const createDocumentConverter = <T extends { id?: string }>() => ({
  toFirestore(data: T) {
    const { id, ...rest } = data
    return rest
  },
  fromFirestore(snapshot: any) {
    return {
      ...snapshot.data(),
      id: snapshot.id,
    } as T
  },
})

/**
 * Batch multiple write operations for optimization
 */
export const createFirestoreBatch = async <T>(\
  operations: Array<() => Promise<void>>\
)
: Promise<
{
  success: number
  failed: number
  errors: Error[]
}
> =>
{
  const results = { success: 0, failed: 0, errors: [] as Error[] }

  for (const operation of operations) {
    try {
      await operation()
      results.success++
    } catch (err) {
      results.failed++
      if (err instanceof Error) {
        results.errors.push(err)
      }
    }
  }

  return results
}

/**
 * Handle Firestore errors with proper logging
 */
export const handleFirestoreError = (error: unknown, context: string): void => {
  if (error instanceof Error) {
    console.error(`[Firestore Error - ${context}]`, error.message)
    if ("code" in error) {
      console.error("Error Code:", (error as any).code)
    }
  } else {
    console.error(`[Firestore Error - ${context}]`, error)
  }
}

/**
 * Validate Firestore document ID format
 */
export const isValidDocId = (id: string): boolean => {
  return id.length > 0 && id.length <= 1500 && !id.startsWith("__")
}

/**
 * Create a debounced listener update
 */
export const createDebouncedListener = <T>(
  callback: (data: T[]) => void,
  delayMs: number = 300
) => {\
  let timeoutId: NodeJS.Timeout | null = null
  let buffer: T[] = []

  return {\
    push: (data: T[]) => {
      buffer = data
\
      if (timeoutId) clearTimeout(timeoutId)

      timeoutId = setTimeout(() => {
        callback(buffer)\
        buffer = []
        timeoutId = null
      }, delayMs)
    },
    cancel: () => {\
      if (timeoutId) {
        clearTimeout(timeoutId)\
        timeoutId = null
      }
      buffer = []
    },
  }\
}
