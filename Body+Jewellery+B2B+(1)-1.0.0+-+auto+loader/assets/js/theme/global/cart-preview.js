import 'foundation-sites/js/foundation/foundation';
import 'foundation-sites/js/foundation/foundation.dropdown';
import utils from '@bigcommerce/stencil-utils';

export const CartPreviewEvents = {
    close: 'closed.fndtn.dropdown',
    open: 'opened.fndtn.dropdown',
};

export default function (secureBaseUrl, cartId) {
    const loadingClass = 'is-loading';
    const $cart = $('[data-cart-preview]');
    const $cartDropdown = $('#cart-preview-dropdown');
    const $cartLoading = $('<div class="loadingOverlay"></div>');

    const $body = $('body');

    if (window.ApplePaySession) {
        $cartDropdown.addClass('apple-pay-supported');
    }

    $body
    .on('click', '.previewCart-close', () => {
        $('.navUser-item--cart.is-active').removeClass('is-active');
    })
    .on('click', '.minicart', () => {
        $('.navUser-item--cart.is-active').removeClass('is-active');
    })
    .on('click', '.previewCartWrapper', event => {
        event.stopPropagation();
    })
    .on('cart-quantity-update', (event, { quantity, subtotal }) => {
        $cart.attr('aria-label', (_, prevValue) => prevValue.replace(/\d+/, quantity));

        $('[data-view-content="cart-quantity"]')
            .text(quantity)
            .toggleClass('countPill--positive', quantity > 0);

            
        subtotal = subtotal ? subtotal : '-.--';
        
        const currencyType = $('[data-currency]').attr('data-currency') ?? '£';
        const checkedSubtotal = (typeof subtotal === 'number') ? `${currencyType}${subtotal.toFixed(2)}` : subtotal;
            
        $('[data-view-content="cart-total"]').text(checkedSubtotal);

        $('[data-cart-quantity]').attr('data-cart-quantity', quantity);

        if (utils.tools.storage.localStorageAvailable()) {
            localStorage.setItem('cart-quantity', quantity);
            localStorage.setItem('cart-subtotal', subtotal);
        }
    });

    $cart.on('click', event => {
        const options = {
            template: 'common/cart-preview',
        };

        event.preventDefault();

        $cartDropdown
            .addClass(loadingClass)
            .html($cartLoading);
        $cartLoading
            .show();

        utils.api.cart.getContent(options, (err, response) => {
            $cartDropdown
                .removeClass(loadingClass)
                .html(response);

            //
            setupBundles($cartDropdown);
            //

            $cartLoading
                .hide();
        });
    });

    let quantity = 0;

    function refreshContent(cartPreviewReload = false) {
        const options = {
            template: 'common/cart-preview',
        };

        utils.api.cart.getContent(options, (err, response) => {
            if (cartPreviewReload === true) {
                $cartDropdown.html(response);

                //
                setupBundles($cartDropdown);
                //
                // orderComment();
            }

            const quantity = /(data-cart-quantity="(.*?)(\"))/g.exec(response)[2] || 0;
            const subtotal = /(data-cart-total="(.*?)(\"))/g.exec(response)[2] || '';

            $('body').trigger('cart-quantity-update', { quantity, subtotal });
        });
    }

    if (cartId) {
        refreshContent();
    }


    function cartUpdate($target) {
        const itemId = $target.data('cartItemid');
        const action =  $target.data('action');
        const $el = $(`#qty-${itemId}`);
        const oldQty = parseInt($el.val(), 10);
        const maxQty = parseInt($el.data('quantityMax'), 10);
        const minQty = parseInt($el.data('quantityMin'), 10);
        const minError = $el.data('quantityMinError');
        const maxError = $el.data('quantityMaxError');
        let newQty = 0;

        if (action === 'inc') {
            newQty = oldQty + 1;
        } else if (action === 'dec') {
            newQty = oldQty - 1
        } else if (action === 'manualQtyChange') {
            newQty = $el.val();
        }

        // Does not quality for min/max quantity
        if (newQty < minQty) {
            return showAlertModal(minError);
        } else if (maxQty > 0 && newQty > maxQty) {
            return showAlertModal(maxError);
        }

        if (!$cartDropdown.find($cartLoading).length) {
            $cartDropdown.append($cartLoading);
        }

        $cartLoading.show();

        utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
            if (!response) return;

            if (response.data.status === 'succeed') {
                refreshContent(true);
            } else {
                $cartLoading.hide();
                $el.val(oldQty);
                showAlertModal(response.data.errors.join('\n'));
            }
        });
    }

    function cartRemoveItem(itemId) {
        $cartDropdown.html($cartLoading);
        $cartLoading.show();

        utils.api.cart.itemRemove(itemId, (err, response) => {
            if (response.data.status === 'succeed') {
                refreshContent(true);
            } else {
                showAlertModal(response.data.errors.join('\n'));
            }
        });
    }

    let qtyInputTimer = null;

    $cartDropdown
        .on('click', '.form-increment button', event => {
            event.preventDefault();

            const $target = $(event.currentTarget);
            cartUpdate($target);
        })
        .on('input', '.form-increment input', event => {
            clearTimeout(qtyInputTimer);

            qtyInputTimer = setTimeout(() => {
                const $target = $(event.currentTarget);
                cartUpdate($target);
            }, 2000);
        })
        .on('click', '.cart-item-remove', event => {
            event.preventDefault();

            if (event.currentTarget.classList.contains('--bundle')) {
                // Remove all 'bundle' items
                // First get all relevant cart item IDs
                const idxBundle = $(event.currentTarget).parents('[data-bundleidx]').first().data('bundleidx');
                const arrIds = [];
                const arrFetch = [];

                let elsBundled = null;
                if (idxBundle) {
                    elsBundled = document.querySelectorAll(`.previewCartItem[data-bundleidx="${idxBundle}"]`);
                }

                if (elsBundled) {
                    for (let i = 0, l = elsBundled.length; i < l; i++) {
                        arrIds.push(elsBundled[i].dataset.itemId);
                        arrFetch.push(`/api/storefront/carts/${cartId}/items/${elsBundled[i].dataset.itemId}`)
                    }
                }

                if (arrFetch.length) {
                    deleteCartItems(arrFetch);
                }

                return;
            }
            const itemId = $(event.currentTarget).data('cartItemid');
            cartRemoveItem(itemId);
        });

    $(window)
        .on('refresh-cart', () => refreshContent(true));

    function setupBundles($cart) {
        const elCart = $cart[0];
        const elRows = elCart.querySelectorAll('.previewCartItem');

        $(elRows)
            .each((idx, el) => {
                const elData = el.querySelectorAll('.definitionList-key');
                $(elData)
                    .each((idxKey, elKey) => {
                        if (elKey.dataset.optionName === 'Bundle Parent') {
                            el.dataset.bundleidx = elKey.dataset.optionValue;
                            el.classList.add('--bundle-parent');
                        }
                        if (elKey.dataset.optionName === 'Bundle Child') {
                            el.dataset.bundleidx = elKey.dataset.optionValue;
                            el.classList.add('--bundle-child');
                        }
                    })
                
            });

        elCart.classList.add('--loaded');
    }

    async function deleteCartItems(arr) {
        document.body.classList.add('--loading');
        const deleteOptions = {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        };

        for (let i = 0, l = arr.length; i < l; i++) {
            await fetch(arr[i], deleteOptions)
                .catch((error) => {
                    console.error(error);
                });

        }

        refreshContent(true);
        document.body.classList.remove('--loading');
    }
}
