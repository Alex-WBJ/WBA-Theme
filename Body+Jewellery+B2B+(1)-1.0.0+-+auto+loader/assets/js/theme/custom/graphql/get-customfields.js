export default async function getCustomFields (id, context) {
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
                                entityId
                                name
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
