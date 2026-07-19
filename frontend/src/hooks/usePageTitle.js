import { useEffect } from 'react'

const SITE = 'IMan Investment'

export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${SITE}` : SITE
    return () => { document.title = SITE }
  }, [title])
}
