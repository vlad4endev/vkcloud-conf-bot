import PartnersList from '../components/PartnersSection/PartnersList';

export default function Partners() {
  return (
    <div className="page">
      <h1 className="title">Партнеры конференции</h1>
      <p className="text">
        Компании и продукты, без которых конференция не состоялась бы.
      </p>
      <PartnersList />
    </div>
  );
}
