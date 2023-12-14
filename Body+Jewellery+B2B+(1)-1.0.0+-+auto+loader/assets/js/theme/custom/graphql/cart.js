export async function getCart (context) {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${context.token ?? window.jsContext.settings.storefront_api.token}`,
            },
            body: JSON.stringify({
                query: `
                    query getCart {
                        site {
                            cart {
                                entityId
                                currencyCode
                                isTaxIncluded
                                baseAmount {
                                    currencyCode
                                    value
                                }
                                discountedAmount {
                                    currencyCode
                                    value
                                }
                                amount {
                                    currencyCode
                                    value
                                }
                                discounts {
                                    entityId
                                    discountedAmount {
                                        currencyCode
                                        value
                                    }
                                }
                                lineItems {
                                    physicalItems {
                                        entityId
                                        parentEntityId
                                        variantEntityId
                                        productEntityId
                                        sku
                                        name
                                        url
                                        imageUrl
                                        brand
                                        quantity
                                        isTaxable
                                        discounts {
                                            entityId
                                            discountedAmount {
                                                currencyCode
                                                value
                                            }
                                        }
                                        discountedAmount {
                                            currencyCode
                                            value
                                        }
                                        couponAmount {
                                            currencyCode
                                            value
                                        }
                                        listPrice {
                                            currencyCode
                                            value
                                        }
                                        originalPrice {
                                            currencyCode
                                            value
                                        }
                                        salePrice {
                                            currencyCode
                                            value
                                        }
                                        isShippingRequired
                                        selectedOptions {
                                            entityId
                                            name
                                            ... on CartSelectedCheckboxOption {
                                                value
                                                valueEntityId
                                            }
                                            ... on CartSelectedDateFieldOption {
                                                date {
                                                    utc
                                                }
                                            }
                                            ... on CartSelectedFileUploadOption {
                                                fileName
                                            }
                                            ... on CartSelectedMultiLineTextFieldOption {
                                                text
                                            }
                                            ... on CartSelectedMultipleChoiceOption {
                                                value
                                                valueEntityId
                                            }
                                            ... on CartSelectedNumberFieldOption {
                                                number
                                            }
                                            ... on CartSelectedTextFieldOption {
                                                text
                                            }
                                        }
    
                                    }
                                    digitalItems {
                                        entityId
                                        parentEntityId
                                        variantEntityId
                                        productEntityId
                                        sku
                                        name
                                        url
                                        imageUrl
                                        brand
                                        quantity
                                        isTaxable
                                        discounts {
                                            entityId
                                            discountedAmount {
                                                currencyCode
                                                value
                                            }
                                        }
                                        discountedAmount {
                                            currencyCode
                                            value
                                        }
                                        couponAmount {
                                            currencyCode
                                            value
                                        }
                                        listPrice {
                                            currencyCode
                                            value
                                        }
                                        originalPrice {
                                            currencyCode
                                            value
                                        }
                                        salePrice {
                                            currencyCode
                                            value
                                        }
                                        selectedOptions {
                                            entityId
                                            name
                                            ... on CartSelectedCheckboxOption {
                                                value
                                                valueEntityId
                                            }
                                            ... on CartSelectedDateFieldOption {
                                                date {
                                                    utc
                                                }
                                            }
                                            ... on CartSelectedFileUploadOption {
                                                fileName
                                            }
                                            ... on CartSelectedMultiLineTextFieldOption {
                                                text
                                            }
                                            ... on CartSelectedMultipleChoiceOption {
                                                value
                                                valueEntityId
                                            }
                                            ... on CartSelectedNumberFieldOption {
                                                number
                                            }
                                            ... on CartSelectedTextFieldOption {
                                                text
                                            }
                                        }
                                    }
                                    totalQuantity
                                }
                                createdAt {
                                    utc
                                }
                                updatedAt {
                                    utc
                                }
                                locale
                            }
                        }
                    }
                `
            })
        });
        const data = await response.json();
        return data.data.site.cart;
    } catch (error) {
        console.error(`Error getting cart (${error})`);
        throw error;
    }
}

export async function createCart (items, context) {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${context.token ?? window.jsContext.settings.storefront_api.token}`,
            },
            body: JSON.stringify({
                query: `
                    mutation createCart($createCartInput: CreateCartInput!) {
                        cart {
                            createCart(input: $createCartInput) {
                                cart {
                                    entityId
                                    lineItems {
                                        physicalItems {
                                            entityId
                                            variantEntityId
                                            name
                                            quantity
                                        }
                                        digitalItems {
                                            entityId
                                            variantEntityId
                                            name
                                            quantity
                                        }
                                    }
                                }
                            }
                        }
                    }
                `,
                variables: {
                    createCartInput: {
                        lineItems: items
                    }
                }
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error creating cart (${error})`);
        throw error;
    }
}

export async function addCartLineItems (cartId, items, context) {
    try {
        const response = await fetch('/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${context.token ?? window.jsContext.settings.storefront_api.token}`,
            },
            body: JSON.stringify({
                query: `
                    mutation addCartLineItems($addCartLineItemsInput: AddCartLineItemsInput!) {
                        cart {
                            addCartLineItems(input: $addCartLineItemsInput) {
                                cart {
                                    entityId
                                }
                            }
                        }
                    }
                `,
                variables: {
                    addCartLineItemsInput: {
                        cartEntityId: cartId,
                        data: {
                            lineItems: items
                        }
                    }
                }
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error adding to cart (${error})`);
        throw error;
    }
}
