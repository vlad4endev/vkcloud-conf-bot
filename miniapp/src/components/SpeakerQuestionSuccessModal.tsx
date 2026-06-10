import { CircleCheck } from 'lucide-react';
import AppIcon from './AppIcon';
import styles from './SpeakerQuestionSuccessModal.module.css';

const PARAGRAPHS = [
  {
    text: 'Мы получили ваше сообщение и передадим его спикеру. Самые интересные вопросы зададим в прямом эфире после выступления.',
    variant: 'accent' as const,
  },
  {
    text: 'Если на ваш вопрос не успеем ответить на сцене, спикер обязательно ответит онлайн.',
    variant: 'default' as const,
  },
  {
    text: 'Продолжайте задавать вопросы — ваше участие делает конференцию лучше!',
    variant: 'highlight' as const,
  },
];

type SpeakerQuestionSuccessModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function SpeakerQuestionSuccessModal({
  open,
  onClose,
}: SpeakerQuestionSuccessModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="speaker-question-success-title"
      onClick={onClose}
    >
      <div className={styles.card} onClick={(event) => event.stopPropagation()}>
        <div className={styles.accentBar} aria-hidden />

        <div className={styles.iconWrap}>
          <AppIcon icon={CircleCheck} size={28} />
        </div>

        <h2 id="speaker-question-success-title" className={styles.title}>
          Вопрос отправлен
        </h2>

        <div className={styles.body}>
          {PARAGRAPHS.map((paragraph) => (
            <p
              key={paragraph.text}
              className={`${styles.paragraph} ${
                paragraph.variant === 'accent'
                  ? styles.paragraphAccent
                  : paragraph.variant === 'highlight'
                    ? styles.paragraphHighlight
                    : ''
              }`}
            >
              {paragraph.text}
            </p>
          ))}
        </div>

        <button type="button" className="btn" onClick={onClose}>
          Понятно
        </button>
      </div>
    </div>
  );
}
