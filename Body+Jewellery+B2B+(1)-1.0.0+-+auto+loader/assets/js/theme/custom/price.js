export default function formatPrice(value, currencyCode = 'GBP', countryCode = 'en-GB') {
    const nfPrice = new Intl.NumberFormat(countryCode, { style: 'currency', currency: currencyCode });
    return nfPrice.format(value);
}
