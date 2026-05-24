import { useEffect, useState } from 'react';
import { getConfig } from '../api/client';
import styles from './Page.module.css';

export default function Map() {
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfig()
      .then((config) => setMapImageUrl(config.map_image_url))
      .catch(() => setMapImageUrl(''))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Карта</h1>
      {loading ? (
        <p className={styles.placeholder}>Загрузка…</p>
      ) : mapImageUrl.trim() ? (
        <img src={mapImageUrl} alt="Карта площадки" style={{ width: '100%' }} />
      ) : (
        <p className={styles.placeholder}>Карта скоро появится</p>
      )}
    </div>
  );
}
