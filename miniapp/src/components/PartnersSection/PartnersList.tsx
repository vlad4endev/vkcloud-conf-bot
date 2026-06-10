import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPartners, type Partner } from '../../api/client';
import PartnerLogo from './PartnerLogo';
import styles from './PartnersSection.module.css';

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
            <div className={styles.logoColumn}>
              <div className={styles.logoBox}>
                <PartnerLogo partner={partner} variant="card" />
              </div>
            </div>
            <div className={styles.content}>
              <h2 className={styles.cardName}>{partner.name}</h2>
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
            </div>
          </article>
        </li>
      ))}
    </ul>
  );
}
