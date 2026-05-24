import { useLocation, useNavigate } from 'react-router-dom'
import styles from './BackButton.module.css'

const MAIN_SECTIONS = ['/', '/schedule', '/speakers', '/quiz']

export default function BackButton() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  if (MAIN_SECTIONS.includes(pathname)) {
    return null
  }

  return (
    <button type="button" className={styles.button} onClick={() => navigate(-1)}>
      ← Назад
    </button>
  )
}
