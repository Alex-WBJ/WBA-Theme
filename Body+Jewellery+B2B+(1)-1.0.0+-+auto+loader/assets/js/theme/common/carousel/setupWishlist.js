import wishlist from "../../product/wishlist";

export default function (context) {
    // Actions
    // Login
    // login.php
    // New wishlist w/item:
    // wishlist.php?action=addwishlist&product_id=X
    // Add item to existing wishlist:
    // /wishlist.php?action=add&wishlistid=X&product_id=X
    let wishlistAction = 'login';

    fetch('/graphql', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.jsContext.settings.storefront_api.token}`
        },
        body: JSON.stringify({
            query:
                `query wishlist {
                    customer {
                        wishlists {
                            edges {
                                node {
                                    name
                                    entityId
                                    items {
                                        edges {
                                            node {
                                                product {
                                                    id,
                                                    entityId
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }`
        })
    })
    .then(res => res.json())
    .then(dataObj => {
        const data = dataObj.data;

        if (!data.customer) {
            wishlistAction = 'login';
            return true;
        }

        if (!data.customer.wishlists
            || !data.customer.wishlists.edges
            || data.customer.wishlists.edges.length === 0)
        {
            wishlistAction = 'newwishlist';
            return true;
        }

        wishlistAction = 'toggle';

        let htmlWishlists = ``;

        data.customer.wishlists.edges.forEach(wishlist => {
            htmlWishlists += `<li><a class="js-add-to-wishlist" data-wishlist-id="${wishlist.node.entityId}" data-product-id>${wishlist.node.name}</a></li>`;
            wishlist.node.items.edges.forEach(item => {
                const els = document.querySelectorAll(`.card-product[data-product="card-${item.node.product.entityId}"]`);
                for (let i = 0, l = els.length; i < l; i++)
                {
                    els[i].classList.add('--in-wishlist');
                }
            })
        });

        const els = document.querySelectorAll(`.card-product`);

        if(els) {
            const elWishlistLists = document.querySelectorAll('.card-wishlist ul');

            for (let i = 0, l = elWishlistLists.length; i < l; i++)
            {
                elWishlistLists[i].innerHTML = htmlWishlists + elWishlistLists[i].innerHTML;
                const closestCard = elWishlistLists[i].closest('.card');

                let elDataAttr = elWishlistLists[i].querySelectorAll('[data-product-id]');

                elDataAttr.forEach(el => {
                    el.dataset.productId = closestCard.dataset.productId;
                })
            }
        }
    }).then(() => {
        wishlist(context);
    }) // will log JSON result to browser console
    .catch(error => console.error(error));

    $('.js-wishlist')
        .on('click', event => {
            switch(wishlistAction)
            {
                case 'login':
                    window.location = '/login.php';
                    break;
                case 'newwishlist':
                    window.location = `/wishlist.php?action=addwishlist&product_id=${event.target.dataset.id}`;
                    break;
                case 'toggle':
                    event.currentTarget.classList.toggle('--open');
                    break;
            }
        });
}
