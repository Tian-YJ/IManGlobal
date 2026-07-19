/** Industry → cover image fallback for portfolio cards (01/02/03…). */
export const PORTFOLIO_INDUSTRIES = [
  { key: 'Enterprise AI', label: 'Enterprise AI', image: '/images/portfolio-ai.jpg' },
  { key: 'Healthcare', label: 'Healthcare', image: '/images/portfolio-health.jpg' },
  { key: 'Fintech', label: 'Fintech', image: '/images/portfolio-fintech.jpg' },
  { key: 'Crypto', label: 'Crypto', image: '/images/portfolio-crypto.jpg' },
  { key: 'Physical AI', label: 'Physical AI', image: '/images/portfolio-physical-ai.jpg' },
  { key: 'Sustainability', label: 'Sustainability', image: '/images/portfolio-climate.jpg' },
  { key: 'Enterprise', label: 'Enterprise', image: '/images/portfolio-enterprise.jpg' },
  { key: 'Consumer', label: 'Consumer', image: '/images/portfolio-consumer.jpg' },
]

export function industryImage(industry) {
  return PORTFOLIO_INDUSTRIES.find((item) => item.key === industry)?.image
}
