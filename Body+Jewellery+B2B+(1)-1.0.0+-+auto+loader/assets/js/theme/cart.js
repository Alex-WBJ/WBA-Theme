import PageManager from './page-manager';
import { bind, debounce } from 'lodash';
import checkIsGiftCertValid from './common/gift-certificate-validator';
import { createTranslationDictionary } from './common/utils/translations-utils';
import utils from '@bigcommerce/stencil-utils';
import ShippingEstimator from './cart/shipping-estimator';
import { defaultModal, showAlertModal, ModalEvents } from './global/modal';
import CartItemDetails from './common/cart-item-details';

export default class Cart extends PageManager {
    cartId;

    onReady() {
        this.$modal = null;
        this.$cartPageContent = $('[data-cart]');
        this.$cartContent = $('[data-cart-content]');
        this.$cartMessages = $('[data-cart-status]');
        this.$cartTotals = $('[data-cart-totals]');
        this.$cartAdditionalCheckoutBtns = $('[data-cart-additional-checkout-buttons]');
        this.$overlay = $('[data-cart] .loadingOverlay')
            .hide(); // TODO: temporary until roper pulls in his cart components
        this.$activeCartItemId = null;
        this.$activeCartItemBtnAction = null;

        this.setApplePaySupport();
        this.bindEvents();
        this.setupTotalsToggle();
        this.setupBundles();
        this.getCartId();
    }

    setApplePaySupport() {
        if (window.ApplePaySession) {
            this.$cartPageContent.addClass('apple-pay-supported');
        }
    }

    cartUpdate($target) {
        const itemId = $target.data('cartItemid');
        this.$activeCartItemId = itemId;
        this.$activeCartItemBtnAction = $target.data('action');

        const $el = $(`#qty-${itemId}`);
        const oldQty = parseInt($el.val(), 10);
        const maxQty = parseInt($el.data('quantityMax'), 10);
        const minQty = parseInt($el.data('quantityMin'), 10);
        const minError = $el.data('quantityMinError');
        const maxError = $el.data('quantityMaxError');
        const newQty = $target.data('action') === 'inc' ? oldQty + 1 : oldQty - 1;
        // Does not quality for min/max quantity
        if (newQty < minQty) {
            return showAlertModal(minError);
        } else if (maxQty > 0 && newQty > maxQty) {
            return showAlertModal(maxError);
        }

        if ($target.parents('.--bundle-parent').first().get().length > 0) {
            const el = $target.parents('.--bundle-parent').first().get()[0];

            this.bundleQtyUpdate(newQty, el.dataset.bundleidx);
            return;
        }

        this.$overlay.show();

        utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
            this.$overlay.hide();

            if (response.data.status === 'succeed') {
                // if the quantity is changed "1" from "0", we have to remove the row.
                const remove = (newQty === 0);

                this.refreshContent(remove);
            } else {
                $el.val(oldQty);
                showAlertModal(response.data.errors.join('\n'));
            }
        });
    }

    cartUpdateQtyTextChange($target, preVal = null) {
        const itemId = $target.data('cartItemid');
        const $el = $(`#qty-${itemId}`);
        const maxQty = parseInt($el.data('quantityMax'), 10);
        const minQty = parseInt($el.data('quantityMin'), 10);
        const oldQty = preVal !== null ? preVal : minQty;
        const minError = $el.data('quantityMinError');
        const maxError = $el.data('quantityMaxError');
        const newQty = parseInt(Number($el.val()), 10);
        let invalidEntry;

        // Does not quality for min/max quantity
        if (!newQty) {
            invalidEntry = $el.val();
            $el.val(oldQty);
            return showAlertModal(this.context.invalidEntryMessage.replace('[ENTRY]', invalidEntry));
        } else if (newQty < minQty) {
            $el.val(oldQty);
            return showAlertModal(minError);
        } else if (maxQty > 0 && newQty > maxQty) {
            $el.val(oldQty);
            return showAlertModal(maxError);
        }

        if ($target.parents('.--bundle-parent').first().get().length > 0) {
            const el = $target.parents('.--bundle-parent').first().get()[0];

            this.bundleQtyUpdate(newQty, el.dataset.bundleidx);
            return;
        }

        this.$overlay.show();
        utils.api.cart.itemUpdate(itemId, newQty, (err, response) => {
            this.$overlay.hide();

            if (response.data.status === 'succeed') {
                // if the quantity is changed "1" from "0", we have to remove the row.
                const remove = (newQty === 0);

                this.refreshContent(remove);
            } else {
                $el.val(oldQty);

                return showAlertModal(response.data.errors.join('\n'));
            }
        });
    }

    cartRemoveItem(itemId) {
        this.$overlay.show();
        utils.api.cart.itemRemove(itemId, (err, response) => {
            if (response.data.status === 'succeed') {
                this.refreshContent(true);
            } else {
                this.$overlay.hide();
                showAlertModal(response.data.errors.join('\n'));
            }
        });
    }

    async cartRemoveItems(arr) {
        this.$overlay.show();

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

        this.refreshContent(true);
    }

    cartEditOptions(itemId, productId) {
        const context = { productForChangeId: productId, ...this.context };
        const modal = defaultModal();

        if (this.$modal === null) {
            this.$modal = $('#modal');
        }

        const options = {
            template: 'cart/modals/configure-product',
        };

        modal.open();
        this.$modal.find('.modal-content').addClass('hide-content');

        utils.api.productAttributes.configureInCart(itemId, options, (err, response) => {
            modal.updateContent(response.content);
            const optionChangeHandler = () => {
                const $productOptionsContainer = $('[data-product-attributes-wrapper]', this.$modal);
                const modalBodyReservedHeight = $productOptionsContainer.outerHeight();

                if ($productOptionsContainer.length && modalBodyReservedHeight) {
                    $productOptionsContainer.css('height', modalBodyReservedHeight);
                }
            };

            if (this.$modal.hasClass('open')) {
                optionChangeHandler();
            } else {
                this.$modal.one(ModalEvents.opened, optionChangeHandler);
            }

            this.productDetails = new CartItemDetails(this.$modal, context);

            this.bindGiftWrappingForm();
        });

        utils.hooks.on('product-option-change', (event, currentTarget) => {
            const $form = $(currentTarget).find('form');
            const $submit = $('input.button', $form);
            const $messageBox = $('.alertMessageBox');

            utils.api.productAttributes.optionChange(productId, $form.serialize(), (err, result) => {
                const data = result.data || {};

                if (err) {
                    showAlertModal(err);
                    return false;
                }

                if (data.purchasing_message) {
                    $('p.alertBox-message', $messageBox).text(data.purchasing_message);
                    $submit.prop('disabled', true);
                    $messageBox.show();
                } else {
                    $submit.prop('disabled', false);
                    $messageBox.hide();
                }

                if (!data.purchasable || !data.instock) {
                    $submit.prop('disabled', true);
                } else {
                    $submit.prop('disabled', false);
                }
            });
        });
    }

    refreshContent(remove) {
        const $cartItemsRows = $('[data-item-row]', this.$cartContent);
        const $cartPageTitle = $('[data-cart-page-title]');
        const options = {
            template: {
                content: 'cart/content',
                totals: 'cart/totals',
                pageTitle: 'cart/page-title',
                statusMessages: 'cart/status-messages',
                additionalCheckoutButtons: 'cart/additional-checkout-buttons',
            },
        };

        this.$overlay.show();

        // Remove last item from cart? Reload
        if (remove && $cartItemsRows.length === 1) {
            return window.location.reload();
        }

        utils.api.cart.getContent(options, (err, response) => {
            this.$cartContent.html(response.content);
            this.$cartTotals.html(response.totals);
            this.$cartMessages.html(response.statusMessages);
            this.$cartAdditionalCheckoutBtns.html(response.additionalCheckoutButtons);

            $cartPageTitle.replaceWith(response.pageTitle);
            this.bindEvents();
            this.$overlay.hide();

            const quantity = $('[data-cart-quantity]', this.$cartContent).data('cartQuantity') || 0;
            const subtotal = $('[data-cart-total]', this.$cartTotals).data('cartTotal') || 0;
            $('body').trigger('cart-quantity-update', { quantity, subtotal });

            $(`[data-cart-itemid='${this.$activeCartItemId}']`, this.$cartContent)
                .filter(`[data-action='${this.$activeCartItemBtnAction}']`)
                .trigger('focus');

            this.setupBundles();
        });
    }

    bindCartEvents() {
        const debounceTimeout = 400;
        const cartUpdate = bind(debounce(this.cartUpdate, debounceTimeout), this);
        const cartUpdateQtyTextChange = bind(debounce(this.cartUpdateQtyTextChange, debounceTimeout), this);
        const cartRemoveItem = bind(debounce(this.cartRemoveItem, debounceTimeout), this);
        let preVal;

        // cart update
        $('[data-cart-update]', this.$cartContent).on('click', event => {
            const $target = $(event.currentTarget);

            event.preventDefault();

            // update cart quantity
            cartUpdate($target);
        });

        // cart qty manually updates
        $('.cart-item-qty-input', this.$cartContent).on('focus', function onQtyFocus() {
            preVal = this.value;
        }).change(event => {
            const $target = $(event.currentTarget);
            event.preventDefault();

            // update cart quantity
            cartUpdateQtyTextChange($target, preVal);
        });

        $('.cart-item-remove', this.$cartContent).on('click', event => {
            const itemId = $(event.currentTarget).data('cartItemid');
            const string = $(event.currentTarget).data('confirmDelete');

            if (event.currentTarget.classList.contains('--bundle')) {
                // Remove all 'bundle' items
                // First get all relevant cart item IDs
                const idxBundle = $(event.currentTarget).parents('[data-bundleidx]').first().data('bundleidx');
                const arrIds = [];
                const arrFetch = [];

                let elsBundled = null;
                if (idxBundle) {
                    elsBundled = document.querySelectorAll(`.cart-item[data-bundleidx="${idxBundle}"]`);
                }

                if (elsBundled) {
                    for (let i = 0, l = elsBundled.length; i < l; i++) {
                        arrIds.push(elsBundled[i].dataset.itemId);
                        arrFetch.push(`/api/storefront/carts/${this.cartId}/items/${elsBundled[i].dataset.itemId}`)
                    }
                }

                if (arrFetch.length) {
                    showAlertModal(string, {
                        icon: 'warning',
                        showCancelButton: true,
                        onConfirm: () => {
                            // remove items from cart
                            this.cartRemoveItems(arrFetch);
                        },
                    });
                }

                return;
            }

            showAlertModal(string, {
                icon: 'warning',
                showCancelButton: true,
                onConfirm: () => {
                    // remove item from cart
                    cartRemoveItem(itemId);
                },
            });
            event.preventDefault();
        });

        $('[data-item-edit]', this.$cartContent).on('click', event => {
            const itemId = $(event.currentTarget).data('itemEdit');
            const productId = $(event.currentTarget).data('productId');
            event.preventDefault();
            // edit item in cart
            this.cartEditOptions(itemId, productId);
        });
    }

    bindPromoCodeEvents() {
        const $couponContainer = $('.coupon-code');
        const $couponForm = $('.coupon-form');
        const $codeInput = $('[name="couponcode"]', $couponForm);

        $('.coupon-code-add').on('click', event => {
            event.preventDefault();

            $(event.currentTarget).hide();
            $couponContainer.show();
            $('.coupon-code-cancel').show();
            $codeInput.trigger('focus');
        });

        $('.coupon-code-cancel').on('click', event => {
            event.preventDefault();

            $couponContainer.hide();
            $('.coupon-code-cancel').hide();
            $('.coupon-code-add').show();
        });

        $couponForm.on('submit', event => {
            const code = $codeInput.val();

            event.preventDefault();

            // Empty code
            if (!code) {
                return showAlertModal($codeInput.data('error'));
            }

            utils.api.cart.applyCode(code, (err, response) => {
                if (response.data.status === 'success') {
                    this.refreshContent();
                } else {
                    showAlertModal(response.data.errors.join('\n'));
                }
            });
        });
    }

    bindGiftCertificateEvents() {
        const $certContainer = $('.gift-certificate-code');
        const $certForm = $('.cart-gift-certificate-form');
        const $certInput = $('[name="certcode"]', $certForm);

        $('.gift-certificate-add').on('click', event => {
            event.preventDefault();
            $(event.currentTarget).toggle();
            $certContainer.toggle();
            $('.gift-certificate-cancel').toggle();
        });

        $('.gift-certificate-cancel').on('click', event => {
            event.preventDefault();
            $certContainer.toggle();
            $('.gift-certificate-add').toggle();
            $('.gift-certificate-cancel').toggle();
        });

        $certForm.on('submit', event => {
            const code = $certInput.val();

            event.preventDefault();

            if (!checkIsGiftCertValid(code)) {
                const validationDictionary = createTranslationDictionary(this.context);
                return showAlertModal(validationDictionary.invalid_gift_certificate);
            }

            utils.api.cart.applyGiftCertificate(code, (err, resp) => {
                if (resp.data.status === 'success') {
                    this.refreshContent();
                } else {
                    showAlertModal(resp.data.errors.join('\n'));
                }
            });
        });
    }

    bindGiftWrappingEvents() {
        const modal = defaultModal();

        $('[data-item-giftwrap]').on('click', event => {
            const itemId = $(event.currentTarget).data('itemGiftwrap');
            const options = {
                template: 'cart/modals/gift-wrapping-form',
            };

            event.preventDefault();

            modal.open();

            utils.api.cart.getItemGiftWrappingOptions(itemId, options, (err, response) => {
                modal.updateContent(response.content);

                this.bindGiftWrappingForm();
            });
        });
    }

    bindGiftWrappingForm() {
        $('.giftWrapping-select').on('change', event => {
            const $select = $(event.currentTarget);
            const id = $select.val();
            const index = $select.data('index');

            if (!id) {
                return;
            }

            const allowMessage = $select.find(`option[value=${id}]`).data('allowMessage');

            $(`.giftWrapping-image-${index}`).hide();
            $(`#giftWrapping-image-${index}-${id}`).show();

            if (allowMessage) {
                $(`#giftWrapping-message-${index}`).show();
            } else {
                $(`#giftWrapping-message-${index}`).hide();
            }
        });

        $('.giftWrapping-select').trigger('change');

        function toggleViews() {
            const value = $('input:radio[name ="giftwraptype"]:checked').val();
            const $singleForm = $('.giftWrapping-single');
            const $multiForm = $('.giftWrapping-multiple');

            if (value === 'same') {
                $singleForm.show();
                $multiForm.hide();
            } else {
                $singleForm.hide();
                $multiForm.show();
            }
        }

        $('[name="giftwraptype"]').on('click', toggleViews);

        toggleViews();
    }

    bindEvents() {
        this.bindCartEvents();
        this.bindPromoCodeEvents();
        this.bindGiftWrappingEvents();
        this.bindGiftCertificateEvents();

        // initiate shipping estimator module
        const shippingErrorMessages = {
            country: this.context.shippingCountryErrorMessage,
            province: this.context.shippingProvinceErrorMessage,
        };
        this.shippingEstimator = new ShippingEstimator($('[data-shipping-estimator]'), shippingErrorMessages);
    }

    setupTotalsToggle() {
        const elTotalsParent = document.querySelector('[data-cart-totals]');
        if (!elTotalsParent) return false;
        const elTotals = elTotalsParent.querySelector('.cart-totals');

        $(elTotalsParent)
            .on('click', '.cart-totals-toggle', () => {
                elTotalsParent.classList.toggle('--expanded');

                if (elTotalsParent.classList.contains('--expanded')) {
                    elTotalsParent.style.setProperty('--height', `${elTotals.offsetHeight}px`);
                } else {
                    elTotalsParent.style.setProperty('--height', '');
                }
            })
            .on('click', '.cart-totals-wrap', () => {
                elTotalsParent.classList.add('--expanded');
                elTotalsParent.style.setProperty('--height', `${elTotals.offsetHeight}px`);
            });
    }

    setupBundles() {
        const elCart = document.querySelector('.cart');
        const elRows = document.querySelectorAll('.cart-item');
        let arrNames = []; // Use for building 'Faux' bundles for simple variants of the same product

        $(elRows)
            .each((idx, el) => {
                let isBundle = false;
                const elData = el.querySelectorAll('.definitionList-key');
                const elRmv = el.querySelector('.cart-item-remove');

                const name = el.dataset.name;

                $(elData)
                    .each((idxKey, elKey) => {
                        if (elKey.dataset.optionName === 'Bundle Parent') {
                            isBundle = true;
                            el.dataset.bundleidx = elKey.dataset.optionValue;
                            el.classList.add('--bundle-parent');
                            if(elRmv) elRmv.classList.add('--bundle');
                        }
                        if (elKey.dataset.optionName === 'Bundle Child') {
                            isBundle = true;
                            el.dataset.bundleidx = elKey.dataset.optionValue;
                            el.classList.add('--bundle-child');
                            if(elRmv) elRmv.classList.add('--bundle');
                        }
                    })

                if (!isBundle) {
                    arrNames.push(name);
                }
            });

        // Filter non-duplicates
        arrNames = arrNames.filter((value, index, array) => array.indexOf(value) !== index);
        // Then filter the non-duplicate-duplicated
        arrNames = arrNames.filter((value, index, array) => array.indexOf(value) === index);

        arrNames.forEach(name => {
            const elRows = document.querySelectorAll(`.cart-item[data-name="${name}"]:not(.--bundle-child):not(.--bundle-parent)`);

            for (let i = 0, l = elRows.length; i < l; i++) {
                const elRow = elRows[i];

                if (i === 0) {
                    elRow.parentElement.appendChild(this.headerRow(elRow));
                }

                elRow.classList.add('--group-child')
                elRow.parentElement.appendChild(elRow);
            }

        });

        elCart.classList.add('--loaded');
    }

    headerRow(el) {
        const title = el.querySelector('.cart-item-name').textContent;
        const img = el.querySelector('.cart-item-figure').innerHTML;
        // const tmp = document.createElement('table');
        const tmp = document.createElement('tbody');
        tmp.innerHTML = `<tr class="cart-item --group-parent">
            <td class="cart-item-block cart-item-figure">${img}</td>
            <td class="cart-item-block cart-item-title">
                <h2 class="cart-item-name">
                    <a class="cart-item-name__label">${title}</a>
                </h2>
            </td>

            <td class="cart-item-block cart-item-info cart-item-quantity"></td>

            <td class="cart-item-block cart-item-info cart-item-price"></td>
        </tr>`;

        return tmp.firstChild;
    }
    
    getCartId() {
        fetch(
            '/api/storefront/cart',
            {
                method: 'GET',
                headers: {'Content-Type': 'application/json'}
            }
        )
            .then(resp => resp.json())
            .then(resp => {
                if (resp.length) {
                    this.cartId = resp[0].id;
                }
            })
            .catch(err => { console.error('getCartId', err) });
    }

    bundleQtyUpdate(quantity, bundleId) {
        this.$overlay.show();

        const els = document.querySelectorAll(`.cart-item[data-bundleidx="${bundleId}"]`);
        const arrIds = [];

        for (let i = 0, l = els.length; i < l; i++) {
            const el = els[i];
            arrIds.push(el.dataset.itemId);
        }

        const funcRunUpdate = () => {
            const id = arrIds.pop();

            utils.api.cart.itemUpdate(id, quantity, (err, response) => {
                if (arrIds.length === 0) {
                    const remove = (quantity === 0);
                    this.refreshContent(remove);
                    this.$overlay.hide();
                } else {
                    funcRunUpdate();
                }
            });
        }

        funcRunUpdate();
    }
}
