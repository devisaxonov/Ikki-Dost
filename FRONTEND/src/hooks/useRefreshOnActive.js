import { useEffect } from 'react'

const useRefreshOnActive = (onRefresh, enabled = true) => {
  useEffect(() => {
    if (!enabled) {
      return undefined
    }

    let lastRefreshAt = 0

    const triggerRefresh = () => {
      const now = Date.now()

      if (now - lastRefreshAt < 500) {
        return
      }

      lastRefreshAt = now
      onRefresh()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh()
      }
    }

    window.addEventListener('focus', triggerRefresh)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', triggerRefresh)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [enabled, onRefresh])
}

export default useRefreshOnActive
