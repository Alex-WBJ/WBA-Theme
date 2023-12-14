import 'slick-carousel';

import {
    activatePlayPauseButton,
    analizeSlides,
    arrowAriaLabling,
    dotsSetup,
    getActiveSlideIdxAndSlidesQuantity,
    handleImageAspectRatio,
    handleImageLoad,
    refreshFocus,
    updateTextWithLiveData,
} from './utils';

import tmplProductCard from '../../templates/product-card';
import cartCarousel from './cartCarousel';

export const setCarouselState = ({ delegateTarget }, carouselObj) => {
    const carouselObjCurrent = carouselObj || delegateTarget.slick;
    const { $slider } = carouselObjCurrent;

    $slider.data('state', getActiveSlideIdxAndSlidesQuantity(carouselObjCurrent));
};

export const onUserCarouselChange = ({ data }, context, $slider) => {
    const $activeSlider = $slider || data;
    const $parentContainer = $activeSlider.hasClass('productView-thumbnails') ? $activeSlider.parent('.productView-images') : $activeSlider;
    const { activeSlideIdx, slidesQuantity } = $activeSlider.data('state');
    const $carouselContentElement = $('[data-carousel-content-change-message]', $parentContainer);
    const carouselContentAnnounceMessage = updateTextWithLiveData(context.carouselContentAnnounceMessage, (activeSlideIdx + 1), slidesQuantity);

    $carouselContentElement.text(carouselContentAnnounceMessage);
};

export const onSlickCarouselChange = (e, carouselObj, context) => {
    const {
        $dots,
        $slider,
        $prevArrow,
        $nextArrow,
        options: { infinite },
    } = carouselObj;

    const { activeSlideIdx, slidesQuantity } = $slider.data('state') || getActiveSlideIdxAndSlidesQuantity(carouselObj);

    dotsSetup($dots, activeSlideIdx, slidesQuantity, context);
    arrowAriaLabling($prevArrow, $nextArrow, activeSlideIdx, slidesQuantity, infinite, context.carouselArrowAndDotAriaLabel);
    analizeSlides($slider.find('.slick-slide'));
    refreshFocus($prevArrow, $nextArrow, $dots, $slider, activeSlideIdx, slidesQuantity, infinite);

    $slider.data('state', null);
};

export default function (context) {
    $('[data-slick]').each((idx, carousel) => {
        // getting element using find to pass jest test
        const $carousel = $(document).find(carousel);

        $carousel.on('init breakpoint swipe', setCarouselState);
        $carousel.on('click', '.slick-arrow, .slick-dots', setCarouselState);

        $carousel.on('init breakpoint', (e, carouselObj) => activatePlayPauseButton(e, carouselObj, context));
        $carousel.on('init afterChange', (e, carouselObj) => onSlickCarouselChange(e, carouselObj, context));
        $carousel.on('click', '.slick-arrow, .slick-dots', $carousel, e => onUserCarouselChange(e, context));
        $carousel.on('swipe', (e, carouselObj) => onUserCarouselChange(e, context, carouselObj.$slider));

        if ($carousel.hasClass('heroCarousel')) {
            $carousel.on('init afterChange', handleImageLoad);
            $carousel.on('swipe', handleImageAspectRatio);
            $carousel.on('click', '.slick-arrow, .slick-dots', handleImageAspectRatio);

            // Alternative image styling for IE, which doesn't support objectfit
            if (typeof document.documentElement.style.objectFit === 'undefined') {
                $carousel.find('.heroCarousel-slide').each((index, slide) => {
                    $(slide).addClass('compat-object-fit');
                });
            }
        }

        const isMultipleSlides = $carousel.children().length > 1;
        const customPaging = isMultipleSlides
            ? () => (
                '<button data-carousel-dot type="button"></button>'
            )
            : () => {};

        $carousel.slick({
            accessibility: false,
            arrows: isMultipleSlides,
            customPaging,
            dots: isMultipleSlides,
        });
    });

    function doSlick(el, config = {})
    {
        // Elements
        const elSlider = el.querySelector('.carousel-slider_carousel'),
              elPager  = el.querySelector('.carousel-slider_controls');

        // Configuration
        const slickConfig = {
            appendArrows: elPager,
            ...config
        };

        if (elSlider.children.length) {
            return $(elSlider).slick(slickConfig);
        } else {
            $(el).on('initslick', () => {
                $(elSlider).slick(slickConfig);
            });
            return false;
        }
    }

    $(window)
        .on('runSlick', () => {
            $('[data-category-slick]:not(.--run-slick-init)')
                .each((index, el) => {
                    el.classList.add('--run-slick-init');
                    let opts = {
                        slidesToShow: 3,
                        slidesToScroll: 1,
                        responsive: [{
                            breakpoint: 800,
                            settings: {
                                slidesToShow: 2
                            }
                        }]
                    };
        
                    if (el.dataset.categorySlick === 'large') {
                        opts.slidesToShow = 6;
                        opts.responsive = [{
                            breakpoint: 900,
                            settings: {
                                slidesToShow: 4
                            }
                        },{
                            breakpoint: 600,
                            settings: {
                                slidesToShow: 2
                            }
                        }];
                    }
        
                    doSlick(el, opts);
                });
        
            $('[data-popular-earrings-slick]:not(.--run-slick-init)')
                .each((index, el) => {
                    el.classList.add('--run-slick-init');
                    const elSlider = el.querySelector('.carousel-slider_carousel'),
                        elPager  = el.querySelector('.carousel-slider_controls');
        
                    let elCurrent = el.querySelector('[data-goto].--active');
        
                    $(elSlider)
                        .slick({
                            slidesToShow: 2,
                            slidesToScroll: 2,
                            appendArrows: elPager,
                            responsive: [{
                                breakpoint: 800,
                                settings: {
                                    slidesToShow: 1,
                                    slidesToScroll: 1
                                }
                            }]
                        })
                        .on('afterChange', (e, slick, currentSlide) => {
                            const elButton = el.querySelector(`[data-goto="${currentSlide}"]`);
        
                            if (elButton) {
                                if (elCurrent && elCurrent !== elButton)
                                {
                                    elCurrent.classList.remove('--active');
                                }
        
                                elCurrent = elButton
                                elButton.classList.add('--active');
        
                            }
                        });
        
                    $(el)
                        .on('click', 'button[data-goto]', event => {
                            const el = event.currentTarget;
                            if (elCurrent && elCurrent !== el)
                            {
                                elCurrent.classList.remove('--active');
                            }
        
                            elCurrent = el
                            el.classList.add('--active');
        
                            $(elSlider).slick('slickGoTo', parseInt(el.dataset.goto, 10));
                        });
                });
        
            $('[data-popular-widget-slick]:not(.--run-slick-init)')
                .each((index, el) => {
                    el.classList.add('--run-slick-init');
                    const elBody = el.querySelector('.carousel-slider_body'),
                        elPager  = el.querySelector('.carousel-slider_controls');
        
                    let elSlider = null,
                        elCurrent = null,
                        elButtons = null;
        
                    const tmplListItem = p => {
                        return `<li>${tmplProductCard(p.node, context)}</li>`;
                    };
        
                    const tmplCarousel = arrP => {
                        let htmlItems = '';
                        arrP.forEach(p => htmlItems += tmplListItem(p));
                        return `<ul class="carousel-slider_carousel">${htmlItems}</ul>`;
                    };
        
                    const loadProducts = (productIds) => {
                        el.classList.add('--is-loading');
                        fetch('/graphql', {
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
                                                        categories {
                                                            edges {
                                                                node {
                                                                    name
                                                                    path
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
                                        }
                                    }`
                            })
                        })
                        .then(res => res.json())
                        .then(data => {
                            stopCarousel();
                            elBody.innerHTML = tmplCarousel(data.data.site.products.edges);
                            elSlider = el.querySelector('.carousel-slider_carousel');
                            startCarousel();
                            el.classList.remove('--is-loading');
        
                            const wishlistAction = 'toggle';
                            $('.wishlist-widget').on('click', (event) => {
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
                        })
                        .catch(error => console.error(error));
                    };
        
                    const startCarousel = () => {
                        $(elSlider)
                            .slick({
                                slidesToShow: 2,
                                slidesToScroll: 1,
                                appendArrows: elPager,
                                responsive: [{
                                    breakpoint: 800,
                                    settings: {
                                        slidesToShow: 1,
                                        slidesToScroll: 1
                                    }
                                }]
                            })
                            .on('afterChange', (event, slick, slide) => {
                                const elBtn = el.querySelector(`button[data-slide="${slide}"]`);
        
                                if (elBtn.classList.contains('--active')) return;
        
                                if (elCurrent && elCurrent !== elBtn)
                                {
                                    elCurrent.classList.remove('--active');
                                }
            
                                elCurrent = elBtn;
                                elBtn.classList.add('--active');
                            });
                    };
        
                    const stopCarousel = () => {
                        $(elSlider)
                            .slick('unslick');
                    }
        
                    elButtons = el.querySelectorAll('button[data-slide]');
                    elCurrent = el.querySelector('button[data-slide].--active');
        
                    if (el.dataset.products) {
                        loadProducts(el.dataset.products);
                    }
        
                    $(el)
                        .on('click', 'button[data-loaditems]', event => {
                            const el = event.currentTarget;
                            if (el.classList.contains('--active')) return;
        
                            if (elCurrent && elCurrent !== el)
                            {
                                elCurrent.classList.remove('--active');
                            }
        
                            elCurrent = el
                            el.classList.add('--active');
        
                            loadProducts(el.dataset.loaditems);
                        })
                        .find('button[data-loaditems]:first')
                            .trigger('click');
        
                    $(el)
                        .on('click', 'button[data-slide]', event => {
                            const el = event.currentTarget;
                            if (el.classList.contains('--active')) return;
        
                            if (elCurrent && elCurrent !== el)
                            {
                                elCurrent.classList.remove('--active');
                            }
        
                            elCurrent = el
                            el.classList.add('--active');
        
                            $(elSlider).slick('slickGoTo',$(el).data('slide'));
        
                        });
                });
        
            $('[data-product-slick]:not(.--run-slick-init)')
                .each((index, el) => {
                    el.classList.add('--run-slick-init');
                    const columns = el.dataset.productSlick ? parseInt(el.dataset.productSlick, 10) : 4;
        
                    doSlick(el, {
                        infinite: true,
                        mobileFirst: true,
                        slidesToShow: 2,
                        slidesToScroll: 2,
                        responsive: [
                            {
                                breakpoint: 800,
                                settings: {
                                    slidesToShow: columns,
                                    slidesToScroll: columns
                                }
                            },
                            {
                                breakpoint: 550,
                                settings: {
                                    slidesToShow: 3,
                                    slidesToScroll: 3
                                }
                            }
                        ]
                    });
                });
        
            $('[data-ambassador-slick]:not(.--run-slick-init)')
                .each((index, el) => {
                    el.classList.add('--run-slick-init');
                    const elSlider = el.querySelector('.carousel-slider_carousel'),
                            elPager  = el.querySelector('.carousel-slider_controls');
        
                    $(elSlider).slick({
                        slidesToShow: 2,
                        slidesToScroll: 2,
                        appendArrows: elPager,
                        responsive: [{
                            breakpoint: 800,
                            settings: {
                                slidesToShow: 1,
                                slidesToScroll: 1
                            }
                        }]
                    });
                });
        
            $('[data-product-gallery-slick]:not(.--run-slick-init)')
                .each((index, el) => {
                    el.classList.add('--run-slick-init');
                    const elSlider = el.querySelector('.carousel-slider_carousel'),
                        elPager  = el.querySelector('.carousel-slider_controls');
        
                    $(elSlider)
                        .slick({
                            slidesToShow: 1,
                            slidesToScroll: 1,
                            appendArrows: elPager
                        });
                });
    
            $('[data-reviews-slick]:not(.--run-slick-init)')
                .each((index, el) => {
                    el.classList.add('--run-slick-init');
                    $(el)
                        .slick({
                            slidesToShow: 3,
                            slidesToScroll: 3,
                            responsive: [{
                                breakpoint: 600,
                                settings: {
                                    slidesToShow: 1
                                }
                            },{
                                breakpoint: 1070,
                                settings: {
                                    slidesToShow: 2
                                }
                            }]
                        });
                });
        })
        .trigger('runSlick');


    $('[data-recommended-products-carousel]')
        .each(async (index, el) => {
            cartCarousel(context, el);
        });
}
