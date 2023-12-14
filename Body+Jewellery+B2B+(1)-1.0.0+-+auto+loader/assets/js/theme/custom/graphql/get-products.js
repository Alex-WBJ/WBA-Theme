const productBody = `
name
id
entityId
sku
inventory {
    isInStock
    aggregated {
        availableToSell
    }
}
maxPurchaseQuantity
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
}`;

export default async function getProductsByEntityId (ids, context) {
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
                                        ${productBody}
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
        return data.data.site.products;
    } catch (error) {
        console.error(`Error loading product (${error})`);
        throw error;
    }
}

export async function getProductByEntityIdRaw (id, context) {
    return fetch('/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${context.settings.storefront_api.token}`,
        },
        body: JSON.stringify({
            query: `
                query ProductById($id: Int) {
                    site {
                        product(entityId: $id) {
                            ${productBody}
                        }
                    }
                }
            `,
            variables: {
                id
            }
        })
    });
}

export async function getProductBySkuRaw (sku, context) {
    return fetch('/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${context.settings.storefront_api.token}`,
        },
        body: JSON.stringify({
            query: `
                query ProductById($sku: String) {
                    site {
                        product(sku: $sku) {
                            ${productBody}
                        }
                    }
                }
            `,
            variables: {
                sku
            }
        })
    });
}

export async function getProductIdBySkuRaw(sku, context) {
    return fetch('/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${context.settings.storefront_api.token}`,
        },
        body: JSON.stringify({
            query: `
                query ProductById($sku: String) {
                    site {
                        product(sku: $sku) {
                            entityId
                            sku
                        }
                    }
                }
            `,
            variables: {
                sku
            }
        })
    });
}


export async function getProductsByCategoryId (id, context) {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${context.settings.storefront_api.token}`,
            },
            body: JSON.stringify({
                query: `
                    query ProductsByCategory($id: Int!) {
                        site {
                            category(entityId: $id) {
                                products {
                                    edges {
                                        node {
                                            ${productBody}
                                            defaultImage {
                                                url: url(width: 300)
                                            }
                                            path
                                        }
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: {
                    id
                }
            })
        });
        const data = await response.json();
        return data.data?.site.category?.products.edges ?? [];

    } catch (error) {
        console.error(`Error loading products by category ID (${error})`);
        throw error;
    }
}
