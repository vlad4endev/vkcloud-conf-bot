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

export default function PartnersSection() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPartners()
      .then(setPartners)
      .catch(() => setPartners([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || partners.length === 0) {
    return null;
  }

  return (
    <section className={styles.section} aria-labelledby="partners-title">
      <h2 id="partners-title" className={styles.title}>
        Партнёры VK Cloud Conf
      </h2>
      <p className={styles.subtitle}>
        Компании и продукты, без которых конференция не состоялась бы.
      </p>

      <ul className={styles.list}>
        {partners.map((partner) => (
          <li key={partner.id}>
            <article className={styles.card}>
              <div className={styles.cardHeader}>
                <PartnerLogo partner={partner} />
                <h3 className={styles.cardName}>{partner.name}</h3>
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
    </section>
  );
}
