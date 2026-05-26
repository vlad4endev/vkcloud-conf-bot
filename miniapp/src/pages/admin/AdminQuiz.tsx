import { useEffect, useState } from 'react';
import {
  createQuizQuestion,
  deleteQuizQuestion,
  getApiErrorMessage,
  getQuizQuestions,
} from '../../api/adminClient';

export default function AdminQuiz() {
  const [questions, setQuestions] = useState<Array<{ id: string; question: string }>>([]);
  const [form, setForm] = useState({
    question: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'a',
  });
  const [message, setMessage] = useState('');

  async function load() {
    try {
      setQuestions(await getQuizQuestions());
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function add() {
    try {
      await createQuizQuestion({
        ...form,
        correctOption: form.correctOption as 'a' | 'b' | 'c' | 'd',
      });
      setForm({
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'a',
      });
      setMessage('Добавлено');
      await load();
    } catch (e) {
      setMessage(getApiErrorMessage(e));
    }
  }

  return (
    <div className="page">
      <h1 className="title">Квиз</h1>
      {message ? <p className={message.includes('Ошиб') ? 'error' : 'success'}>{message}</p> : null}
      <div className="form">
        <textarea className="textarea" placeholder="Вопрос" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} />
        <input className="input" placeholder="A" value={form.optionA} onChange={(e) => setForm((f) => ({ ...f, optionA: e.target.value }))} />
        <input className="input" placeholder="B" value={form.optionB} onChange={(e) => setForm((f) => ({ ...f, optionB: e.target.value }))} />
        <input className="input" placeholder="C" value={form.optionC} onChange={(e) => setForm((f) => ({ ...f, optionC: e.target.value }))} />
        <input className="input" placeholder="D" value={form.optionD} onChange={(e) => setForm((f) => ({ ...f, optionD: e.target.value }))} />
        <select className="input" value={form.correctOption} onChange={(e) => setForm((f) => ({ ...f, correctOption: e.target.value }))}>
          <option value="a">Верный: A</option>
          <option value="b">Верный: B</option>
          <option value="c">Верный: C</option>
          <option value="d">Верный: D</option>
        </select>
        <button type="button" className="btn" onClick={() => void add()}>
          Добавить вопрос
        </button>
      </div>
      <ul className="list" style={{ marginTop: 16 }}>
        {questions.map((q) => (
          <li key={q.id} className="session">
            <p className="sessionTitle">{q.question}</p>
            <button
              type="button"
              className="btn btnSecondary"
              style={{ marginTop: 8 }}
              onClick={() => {
                if (confirm('Удалить?')) void deleteQuizQuestion(q.id).then(load);
              }}
            >
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
