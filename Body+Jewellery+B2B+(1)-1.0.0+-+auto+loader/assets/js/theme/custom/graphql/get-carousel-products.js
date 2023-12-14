export default async function getCarouselProducts (productSku) {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {   
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.jsContext.settings.storefront_api.token}`
            },
            body: JSON.stringify({
                query:
                    `query SeveralProductsBySKU {
                        site {
                            product(sku: "${productSku}") {
                                    brand {
                                        name
                                    }
                                    name
                                    entityId
                                    addToCartUrl
                                    path
                                    sku
                                    inventory {
                                        isInStock
                                    }
                                    productOptions {
                                        edges {
                                            node {
                                                displayName
                                            }
                                        }
                                    }
                                    categories {
                                        edges {
                                            node {
                                                name
                                                path
                                            }
                                        }
                                    }
                                    priceWithTax: prices(
                                        includeTax: true
                                        currencyCode: GBP
                                    ) {
                                        price {
                                            currencyCode
                                            value
                                        }
                                    }
                                    priceWithoutTax: prices(
                                        includeTax: false
                                        currencyCode: GBP
                                    ) {
                                        price {
                                            currencyCode
                                            value
                                        }
                                    }
                                    defaultImage {
                                        url: url(width: 300)
                                    }
                                    customFields {
                                        edges {
                                            node {
                                                name
                                                value
                                            }
                                        }
                                    }
                            }
                        }
                    }`
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error loading product (${error})`);
        throw error;
    }
}
