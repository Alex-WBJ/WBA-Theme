export default async function getMetafields (productIds, namespace) {
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
                    `query SeveralProductsByID {
                        site {
                            products(entityIds: [${productIds}]) {
                                edges {
                                    node {
                                        metafields(namespace: "${namespace}") {
                                            edges {
                                                node {
                                                    key
                                                    value
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                `
            })
        });

        const data = await response.json();

        return data;
    } catch (error) {
        console.error(`Error loading product (${error})`);
        throw error;
    }
}
