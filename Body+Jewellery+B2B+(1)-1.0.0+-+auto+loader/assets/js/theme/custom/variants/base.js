import { showAlertModal } from '../../global/modal';
import getRestrictedCategories from "../get-restricted-categories";
import canShowPricing from '../can-show-pricing';

export default class baseVariantData {
    bundleOption;
    context;
    items;
    uid;

    constructor(context) {
        this.context = context;
        this.items = [];
    }

    addToCartCallback() {
        $(window)
            .trigger('refresh-cart')
            .trigger('show-message', 'Products added to cart')
            .trigger('variants-loader-stop');

        this.resetQty();
        this.uid = null;
    }

    resetProduct() {
        $(window)
            .trigger('refresh-cart')
            .trigger('variants-loader-stop');

        this.resetQty();
        this.uid = null;
    }

    resetQty() {
        this.items.forEach(item => {item.qty = 0});
        $(window)
            .trigger('table-refresh');
    }

    canShowPricing() {
        return canShowPricing(this.context);
    }

    getLineItem(item) {
        // Stub
        return {};
    }

    getLineItems() {
        let lineItems = [];
        let errorProducts = [];

        this.items.forEach(item => {
            if (item.qty > 0) {
                let maxQty = 9999;

                if (item?.maxPurchaseQuantity) {
                    maxQty = item.maxPurchaseQuantity;
                }

                if (item?.inventory?.aggregated?.availableToSell) {
                    if (maxQty) {
                        maxQty = Math.min(maxQty, item.inventory.aggregated.availableToSell);
                    } else {
                        maxQty = item.inventory.aggregated.availableToSell;
                    }
                }

                if (item.qty <= maxQty) {
                    lineItems.push(this.getLineItem(item));
                } else {
                    errorProducts.push(item.name);
                }


            }
        });

        if (errorProducts.length) {
            return showAlertModal(`We don't have enough ${errorProducts.join(', ')} stock on hand for the quantity you selected. Please try again.`);
        }

        return lineItems;
    }

    updateCartItemsData(resp)
    {
        // Get around user adding multiple matching products without reloading
        try {
            window.cartData.items = resp?.lineItems?.physicalItems;
        } catch(e) {
            console.error(e);
        }
    }

    addToCart() {
        if (!this.canShowPricing()) {
            return showAlertModal(`Please login to buy this item. Thank you.`);
        }

        const lineItems = this.getLineItems();
        const locale = 'en';

        if (lineItems.length < 1) {
            return showAlertModal(`Please select the items you want to buy. Thank you.`);
        }

        $(window)
            .trigger('variants-loader-start');

        fetch('/api/storefront/carts', {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        })
            .then(resp => resp.json())
            .then(resp => {
                const cart = resp[0];
                if (cart?.id) {
                    // Add items to existing cart
                    fetch(`/api/storefront/carts/${cart.id}/items?include=lineItems.physicalItems.options`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            lineItems
                        })
                    })
                        .then(resp => resp.json())
                        .then(resp => {
                            this.updateCartItemsData(resp);

                            if (resp.status) {
                                showAlertModal(resp.title);
                                this.resetProduct();
                            } else {
                                this.addToCartCallback();
                            }
                        });
                } else {
                    // Create a new cart
                    fetch(`/api/storefront/carts?include=lineItems.physicalItems.options`, {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({
                            lineItems,
                            locale
                        })
                    })
                        .then(resp => resp.json())
                        .then(resp => {
                            this.updateCartItemsData(resp);

                            if (resp.status) {
                                showAlertModal(resp.title);
                                this.resetProduct();
                            } else {
                                this.addToCartCallback();
                            }
                        });
                }
            });
    }

    generateUid() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    getBundleOption() {

    }
}
