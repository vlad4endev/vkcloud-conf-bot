import { useEffect, useState } from 'react';
import { getConfig } from '../api/client';

export default function Map() {
  const [mapImageUrl, setMapImageUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConfig()
      .then((config) => setMapImageUrl(config.map_image_url))
      .catch(() => setMapImageUrl(''))
      .finally(() => setLoading(false));
  }, []);

  const hasMap = mapImageUrl.trim().length > 0;

  return (
    <div className="page">
      <h1 className="title">Карта площадки</h1>

      {loading ? (
        <p className="placeholder">Загрузка…</p>
      ) : hasMap ? (
        <img
          src={mapImageUrl}
          alt="Карта мероприятия"
          className="mapImage"
        />
      ) : (
        <div className="mapPlaceholder">🗺 Карта площадки появится здесь</div>
      )}
    </div>
  );
}
