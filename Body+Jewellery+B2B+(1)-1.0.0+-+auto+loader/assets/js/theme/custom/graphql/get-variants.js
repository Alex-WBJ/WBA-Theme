const variantBody = `
    entityId
    name
    addToCartUrl
    defaultImage {
        url: url(width: 500)
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
    productOptions {
        edges {
            node {
                displayName
                entityId
                isVariantOption
                ... on MultipleChoiceOption {
                    values {
                        edges {
                            node {
                                entityId
                                isDefault
                                label
                                ... on SwatchOptionValue {
                                    imageUrl: imageUrl(width:500),
                                    hexColors
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    variants(first: 200) {
        edges {
            node {
                id
                entityId
                sku
                isPurchasable
                defaultImage {
                    url: url(width: 500)
                }
                options {
                    edges {
                        node {
                            entityId
                            displayName
                            values {
                                edges {
                                    node {
                                        entityId
                                        label
                                    }
                                }
                            }
                        }
                    }
                }
                inventory {
                    isInStock
                    aggregated {
                        availableToSell
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
            }
        }
}`;

export async function getVariants(id, context) {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${context.settings.storefront_api.token}`,
            },
            body: JSON.stringify({
                query: `
                    query SingleProduct($id: Int) {
                        site {
                            product(entityId: $id) {
                                ${variantBody}
                            }
                        }
                    }
                `,
                variables: {
                    id: Number(id)
                }
            })
        });
        const data = await response.json();
        return data.data.site.product;
    } catch (error) {
        console.error(`Error loading product (${error})`);
        throw error;
    }
}

export async function getVariantsBySku(sku, context) {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${context.settings.storefront_api.token}`,
            },
            body: JSON.stringify({
                query: `
                    query SingleProduct($sku: String) {
                        site {
                            product(sku: $sku) {
                                ${variantBody}
                            }
                        }
                    }
                `,
                variables: {
                    sku
                }
            })
        });
        const data = await response.json();
        return data.data.site.product;
    } catch (error) {
        console.error(`Error loading product (${error})`);
        throw error;
    }
}

export async function getMultiVariants(ids, context) {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${context.settings.storefront_api.token}`,
            },
            body: JSON.stringify({
                query: `
                    query SeveralProductsById($ids: [Int!]) {
                        site {
                            products(entityIds: $ids) {
                                edges {
                                    node {
                                        entityId
                                        name
                                        addToCartUrl
                                        defaultImage {
                                            url: url(width: 500)
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
                                        productOptions {
                                            edges {
                                                node {
                                                    displayName
                                                    entityId
                                                    isVariantOption
                                                    ... on MultipleChoiceOption {
                                                        values {
                                                            edges {
                                                                node {
                                                                    entityId
                                                                    isDefault
                                                                    label
                                                                    ... on SwatchOptionValue {
                                                                        imageUrl: imageUrl(width:500),
                                                                        hexColors
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                        variants(first: 200) {
                                            edges {
                                                node {
                                                    id
                                                    entityId
                                                    sku
                                                    isPurchasable
                                                    defaultImage {
                                                        url(width: 50)
                                                    }
                                                    options {
                                                        edges {
                                                            node {
                                                                entityId
                                                                displayName
                                                                values {
                                                                    edges {
                                                                        node {
                                                                            entityId
                                                                            label
                                                                        }
                                                                    }
                                                                }
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
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: {
                    ids
                }
            })
        });
        const data = await response.json();
        return data.data.site.products.edges;
    } catch (error) {
        console.error(`Error loading product (${error})`);
        throw error;
    }

}
