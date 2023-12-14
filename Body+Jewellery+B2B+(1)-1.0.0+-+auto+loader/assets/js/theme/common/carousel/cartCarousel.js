import tmplProductCard from "../../templates/product-card";
import getCarouselProducts from "../../custom/graphql/get-carousel-products";
import getMetafields from "../../custom/graphql/get-metafields";
import setupWishlist from "./setupWishlist";

export default async function (context, el) {
    const elBody = el.querySelector('.carousel-slider_body'),
                elPager  = el.querySelector('.carousel-slider_controls');

        let elSlider = null,
            elCurrent = null;

        const tmplListItem = p => {
            return `<li>${tmplProductCard(p, context)}</li>`;
        };

        const tmplCarousel = arrP => {
            let htmlItems = '';
            arrP.forEach(p => htmlItems += tmplListItem(p));
            return `<ul class="carousel-slider_carousel">${htmlItems}</ul>`;
        };

        const getMetaFields = async (productIds, namespace) => {
            let prodIds = [];

            el.classList.add('--is-loading');

            try {
                const data = await getMetafields(productIds, namespace);

                if(!data) return;

                const products = data.data.site.products.edges.map(prod => prod.node.metafields.edges);
                products.forEach(item => {
                    if(item[0] !== undefined) {
                        const splitVal = item[0].node.value.split(',');
                        prodIds = [...splitVal];
                    }
                });
                
            } catch (error) {
                console.error(error);
            }

            return prodIds;
        }

        const loadProducts = async (productIds) => {
            el.classList.add('--is-loading');

            const productSkus = productIds.split(',');
            const prodData = [];

            for(const sku of productSkus) {
                const data = await getCarouselProducts(sku);

                if(data.data.site.product !== null) {
                    prodData.push(data.data.site.product);
                }
            }

            if(prodData) {
                stopCarousel();
                elBody.innerHTML = tmplCarousel(prodData);
                elSlider = el.querySelector('.carousel-slider_carousel');
                startCarousel();
                el.classList.remove('--is-loading');
                setupWishlist(context);
            }
        };

        if (el.classList.contains('--active')) return;

        if (elCurrent && elCurrent !== el)
        {
            elCurrent.classList.remove('--active');
        }

        elCurrent = el
        el.classList.add('--active');

        const arrOfIds = await getMetaFields(el.dataset.loaditems, "cart_recommendation");
        let results = [];
        
        if(!arrOfIds) return;

        const numToSlice = arrOfIds.length >= 15 ? 15 : arrOfIds.length;

        const sortedArr = arrOfIds
        .map((a) => ({sort: Math.random(), value: a}))
        .sort((a, b) => a.sort - b.sort)
        .map((a) => a.value);

        results = sortedArr.slice(0, numToSlice);
        loadProducts(results.join(','));

        const startCarousel = () => {
            $(elSlider)
                .slick({
                    slidesToShow: 4,
                    slidesToScroll: 1,
                    appendArrows: elPager,
                    responsive: [{
                        breakpoint: 800,
                        settings: {
                            slidesToShow: 1,
                            slidesToScroll: 1
                        }
                    }]
                });
        };

        const stopCarousel = () => {
            $(elSlider)
                .slick('unslick');
        }

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
}
