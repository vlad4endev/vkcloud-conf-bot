import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPartners, type Partner } from '../../api/client';
import styles from './PartnersSection.module.css';

function PartnerLogo({ partner }: { partner: Partner }) {
  if (partner.logoUrl) {
    return (
      <img
        src={partner.logoUrl}
        alt=""
        className={styles.logo}
        width={44}
        height={44}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <span
      className={`${styles.logo} ${styles.logoFallback}`}
      aria-hidden
    >
      {partner.name.slice(0, 3)}
    </span>
  );
}

export default function PartnersList() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPartners()
      .then(setPartners)
      .catch(() => {
        setPartners([]);
        setError('Не удалось загрузить партнёров');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="placeholder">Загрузка…</p>;
  }

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (partners.length === 0) {
    return <p className="placeholder">Партнёры скоро появятся</p>;
  }

  return (
    <ul className={styles.list}>
      {partners.map((partner) => (
        <li key={partner.id}>
          <article className={styles.card}>
            <div className={styles.cardHeader}>
              <PartnerLogo partner={partner} />
              <h2 className={styles.cardName}>{partner.name}</h2>
            </div>
            {partner.description ? (
              <p className={styles.description}>{partner.description}</p>
            ) : null}
            <a
              href={partner.url}
              className={styles.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              Перейти на сайт
              <ExternalLink
                className={styles.linkIcon}
                size={15}
                strokeWidth={2}
                aria-hidden
              />
            </a>
          </article>
        </li>
      ))}
    </ul>
  );
}
