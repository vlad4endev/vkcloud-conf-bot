import { useEffect, useState } from 'react';
import { getApiErrorMessage, getQuestions } from '../../api/adminClient';

export default function AdminQuestions() {
  const [items, setItems] = useState<
    Array<{
      id: string;
      question: string;
      speaker: { name: string };
      user: { fullName: string };
    }>
  >([]);

  useEffect(() => {
    getQuestions()
      .then(setItems)
      .catch((e) => console.error(getApiErrorMessage(e)));
  }, []);

  return (
    <div className="page">
      <h1 className="title">Вопросы спикерам</h1>
      <ul className="list">
        {items.map((item) => (
          <li key={item.id} className="session">
            <p className="sessionTime">{item.speaker.name}</p>
            <p className="sessionTitle">{item.question}</p>
            <p className="sessionMeta">{item.user.fullName}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
