/*
 Import all product specific js
 */
import PageManager from './page-manager';
import Review from './product/reviews';
import collapsibleFactory from './common/collapsible';
import ProductDetails from './common/product-details';
import videoGallery from './product/video-gallery';
import { classifyForm } from './common/utils/form-utils';
import modalFactory from './global/modal';

import tmplProductCard from './templates/product-card';
import setupWishlist from './common/carousel/setupWishlist';

export default class Product extends PageManager {
    constructor(context) {
        super(context);
        this.url = window.location.href;
        this.$reviewLink = $('[data-reveal-id="modal-review-form"]');
        this.$bulkPricingLink = $('[data-reveal-id="modal-bulk-pricing"]');
        this.reviewModal = modalFactory('#modal-review-form')[0];
    }

    onReady() {
        // Listen for foundation modal close events to sanitize URL after review.
        $(document).on('close.fndtn.reveal', () => {
            if (this.url.indexOf('#write_review') !== -1 && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, document.title, window.location.pathname);
            }
        });

        let validator;

        // Init collapsible
        collapsibleFactory();

        this.productDetails = new ProductDetails($('.productView'), this.context, window.BCData.product_attributes);
        this.productDetails.setProductVariant();

        videoGallery();

        this.bulkPricingHandler();

        const $reviewForm = classifyForm('.writeReview-form');

        if ($reviewForm.length === 0) return;

        const review = new Review({ $reviewForm });

        $('body').on('click', '[data-reveal-id="modal-review-form"]', () => {
            validator = review.registerValidation(this.context);
            this.ariaDescribeReviewInputs($reviewForm);
        });

        $reviewForm.on('submit', () => {
            if (validator) {
                validator.performCheck();
                return validator.areAll('valid');
            }

            return false;
        });

        this.productReviewHandler();

        this.setupPriceSwitcher();

        this.setupCategoryProducts();

        const elDescription = document.getElementById('tab-description');
        const elMoreInformation = document.getElementById('tab-moreinformation');
        const elMoreInformationLink = document.getElementById('tablink-moreinformation');
        if (elDescription && elMoreInformation && elMoreInformationLink) {
            const elsDescriptionContent = elDescription.children;
            let breakIndex = null;
            for (let i = 0, l = elsDescriptionContent.length; i < l; i++) {
                const el = elsDescriptionContent[i];
                if (el.innerHTML.indexOf('<!-- pagebreak -->') > -1) {
                    breakIndex = i + 1;
                    break;
                }
            }

            if (breakIndex !== null) {
                for (let i = breakIndex, l = elsDescriptionContent.length; i < l; i++) {
                    const el = elsDescriptionContent[i];
                    elMoreInformation.append(el);
                }
                elMoreInformation.classList.add('--show');
                elMoreInformationLink.classList.add('--show');
            }
        }

        this.setupZoom();
    }

    ariaDescribeReviewInputs($form) {
        $form.find('[data-input]').each((_, input) => {
            const $input = $(input);
            const msgSpanId = `${$input.attr('name')}-msg`;

            $input.siblings('span').attr('id', msgSpanId);
            $input.attr('aria-describedby', msgSpanId);
        });
    }

    productReviewHandler() {
        if (this.url.indexOf('#write_review') !== -1) {
            this.$reviewLink.trigger('click');
        }
    }

    bulkPricingHandler() {
        if (this.url.indexOf('#bulk_pricing') !== -1) {
            this.$bulkPricingLink.trigger('click');
        }
    }

    doGraphQl(query, variables = null) {
        return fetch('/graphql', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {   
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.jsContext.settings.storefront_api.token}`
            },
            body: JSON.stringify({
                query,
                variables
            })
        })
    }

    setupPriceSwitcher() {
        const query = `query productByID($productId: Int!) {
            site {
                product(entityId: $productId) {
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

        const elPriceWrapper = document.querySelector('.productView-price[data-product]');
        if (!elPriceWrapper) return false;
        let priceData = false;
        let elPriceSwitch = null;

        $('.productView-price[data-product]')
            .on('change', 'select', event => {
                const variables = { productId: parseInt(elPriceWrapper.dataset.product, 10) };

                if (event.target.value) {
                    if (priceData) {
                        elPriceWrapper.classList.add('--switch');
                    } else {
                    this.doGraphQl(query, variables)
                        .then(res => res.json())
                        .then(data => {
                            priceData = data.data;
                            let priceObj = null;
    
                            if (event.target.value === 'incl') {
                                priceObj = priceData.site.product.priceWithTax.price;
                            } else if (event.target.value === 'excl') {
                                priceObj = priceData.site.product.priceWithoutTax.price;
                            }
    
                            if (priceObj !== null) {
                                const nfPrice = new Intl.NumberFormat('en-GB', { style: 'currency', currency: priceObj.currencyCode });

                                if (!elPriceSwitch) {
                                    elPriceSwitch = document.createElement('div');
                                    elPriceSwitch.classList.add('price-section');
                                    elPriceSwitch.classList.add('price-section--switch');
                                    elPriceSwitch.innerHTML = `<span class="price">${nfPrice.format(priceObj.value)}</span>`;
                                    elPriceWrapper.prepend(elPriceSwitch);
                                    elPriceWrapper.classList.add('--switch');
                                }
                            }
                        })
                        .catch(error => console.error(error));
                    }
                } else {
                    elPriceWrapper.classList.remove('--switch');
                }
            });
    }

    setupCategoryProducts() {
        const el = document.querySelector('.js-category-products');
        if (!el) return;
        const elCarousel = el.querySelector('.carousel-slider_carousel');

        const query = `query productByID($productId: Int!) {
            site {
                product(entityId: $productId) {
                    categories {
                        edges {
                            node {
                                products {
                                    edges {
                                        node {
                                            brand {
                                                name
                                            }
                                            name
                                            entityId
                                            addToCartUrl
                                            path
                                            sku
                                            inventory {
                                                isInStock
                                            }
                                            productOptions {
                                                edges {
                                                    node {
                                                        displayName
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
                                            defaultImage {
                                                url: url(width: 300)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }`;

        this.doGraphQl(query, { productId: parseInt(el.dataset.product, 10) })
            .then(res => res.json())
            .then(data => {
                let hasContent = false;
                data.data.site.product.categories.edges.forEach(edgeCategory => {
                    edgeCategory.node.products.edges.forEach(edgeProduct => {
                        elCarousel.innerHTML += `<div data-product-slide class="productCarousel-slide">${tmplProductCard(edgeProduct.node, this.context)}</div>`;
                        hasContent = true;
                    });
                });

                if (hasContent) {
                    el.classList.add('--show');
                    $(el.querySelector('[data-product-slick]'))
                        .trigger('initslick');

                    setupWishlist(this.context);
                }
                

            })
            .catch(error => console.error(error));
    }

    setupZoom() {
        const elSlides = document.querySelectorAll('.productView-slider-image');

        $(elSlides)
            .each((idx, el) => {
                const elZoom = el.querySelector('.productView-slider-image-zoom');

                let height = el.offsetHeight;
                let width = el.offsetWidth;

                let maxTop = elZoom.offsetHeight - height;
                let maxLeft = elZoom.offsetWidth - width;

                el.addEventListener('mousemove', event => {
                    const { offsetX, offsetY } = event;
                    const l = offsetX / width;
                    const t = offsetY / height;

                    el.style.setProperty('--zoom-left', `-${l * maxLeft}px`);
                    el.style.setProperty('--zoom-top', `-${t * maxTop}px`);
                });

                el.addEventListener('mouseenter', () => {
                    height = el.offsetHeight;
                    width = el.offsetWidth;

                    maxTop = elZoom.offsetHeight - height;
                    maxLeft = elZoom.offsetWidth - width;
                });
            });
    }
}
