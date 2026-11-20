"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function TopLoaderBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  // When pathname or searchParams change, finish the progress bar
  useEffect(() => {
    if (visible) {
      setProgress(100)
      const timer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [pathname, searchParams])

  // Intercept click on internal links to kick off the progress bar instantly
  useEffect(() => {
    let t1: NodeJS.Timeout
    let t2: NodeJS.Timeout
    let t3: NodeJS.Timeout

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a")
      if (!target || !target.href) return

      try {
        const url = new URL(target.href, window.location.href)
        const isInternal = url.origin === window.location.origin
        const isNewTab = target.target === "_blank" || e.ctrlKey || e.metaKey || e.shiftKey
        const isAnchor = url.pathname === window.location.pathname && url.hash
        const isSamePage = url.href === window.location.href

        if (isInternal && !isNewTab && !isAnchor && !isSamePage) {
          setVisible(true)
          setProgress(20)

          clearTimeout(t1)
          clearTimeout(t2)
          clearTimeout(t3)

          t1 = setTimeout(() => setProgress(50), 120)
          t2 = setTimeout(() => setProgress(75), 300)
          t3 = setTimeout(() => setProgress(90), 600)
        }
      } catch {
        // Ignore invalid URLs
      }
    }

    document.addEventListener("click", handleClick, { capture: true })
    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[99999] h-[3px] pointer-events-none"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 300ms ease-in-out",
      }}
    >
      <div
        className="h-full bg-gradient-to-r from-[#FBDAA9] via-[#FE9820] to-[#FE9820] shadow-[0_0_12px_#FE9820,0_0_4px_#FE9820]"
        style={{
          width: `${progress}%`,
          transition:
            progress === 100
              ? "width 200ms ease-out"
              : "width 400ms cubic-bezier(0.1, 0.7, 0.1, 1)",
        }}
      />
    </div>
  )
}

export function TopLoader() {
  return (
    <Suspense fallback={null}>
      <TopLoaderBar />
    </Suspense>
  )
}
