import type { Partner } from '@prisma/client';

export type PartnerDto = {
  id: string;
  name: string;
  description: string;
  url: string;
  logoUrl: string | null;
  logoScale: number;
  order: number;
};

export function serializePartner(partner: Partner): PartnerDto {
  return {
    id: partner.id,
    name: partner.name,
    description: partner.description,
    url: partner.url,
    logoUrl: partner.logoUrl,
    logoScale: partner.logoScale,
    order: partner.order,
  };
}

export function serializePartners(partners: Partner[]): PartnerDto[] {
  return partners.map(serializePartner);
}
