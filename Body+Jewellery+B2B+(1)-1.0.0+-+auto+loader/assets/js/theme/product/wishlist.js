import addItemWishlist from "../custom/graphql/addItemWishlist";

const addToWishlist = async (context) => {
    const addWishlistButton = document.querySelectorAll('[data-wishlist-add]');
    
    addWishlistButton.forEach(element => {
        const addToListLinks = element.querySelectorAll('.js-add-to-wishlist');

        if (!addToListLinks) return;

        for(const link of addToListLinks) {
            link.addEventListener('click', async (event) => {
                event.preventDefault();

                const wishlistId = parseInt(link.dataset.wishlistId, 0);
                const productId = parseInt(link.dataset.productId, 0);
                
                const data = await addItemWishlist(wishlistId, productId, context)

                if(data) {
                    const result = data.data.wishlist.addWishlistItems.result;

                    if(result) {
                        const wishlistMenu = element.querySelector('.wishlist-menu');
                        const successMsg = `<div id="success-message">The item has been added to your wishlist</div>`;
                        
                        if(wishlistMenu) {
                            if(!wishlistMenu.querySelector('#success-message')) {
                                wishlistMenu.insertAdjacentHTML('beforeend', successMsg);
                                wishlistMenu.querySelector('#success-message').classList.add('animate-in');

                                const card = wishlistMenu.closest('.card');
                                const wishlistBtn = element.querySelector('.js-wishlist');
                                if(!card.classList.contains('--in-wishlist')) {
                                    card.classList.add('--in-wishlist')
                                }
                                
                                if(wishlistBtn.classList.contains('--open')) {
                                    setTimeout(() => {
                                        wishlistBtn.classList.remove('--open');
                                    }, 4000);
                                }
                            }
                        }
                        
                        const successMessage = wishlistMenu.querySelector('#success-message');
                        
                        setTimeout(() => {
                            successMessage.classList.remove('animate-in');
                            successMessage.classList.add('animate-out');

                            successMessage.style.opacity = 0;
                        }, 3000);

                        setTimeout(() => {
                            successMessage.remove();
                        }, 3500);
                    }
                }
            });
        }
    });
}

export default function (context) {
    const customer = context.customer;

    if(!customer) return;

    addToWishlist(context);
}
