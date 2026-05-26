import { useEffect, useState } from 'react';
import { getApiErrorMessage, getFeedback } from '../../api/adminClient';

export default function AdminFeedback() {
  const [items, setItems] = useState<
    Array<{ id: string; text: string; user: { fullName: string } | null }>
  >([]);

  useEffect(() => {
    getFeedback()
      .then(setItems)
      .catch((e) => console.error(getApiErrorMessage(e)));
  }, []);

  return (
    <div className="page">
      <h1 className="title">Отзывы</h1>
      <ul className="list">
        {items.map((item) => (
          <li key={item.id} className="session">
            <p className="sessionTitle">{item.text}</p>
            <p className="sessionMeta">{item.user?.fullName ?? 'Аноним'}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
