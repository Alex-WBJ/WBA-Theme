
import { buildVariantTable, buildTattooVariantTable } from './variants-table';
import buildComplexTable from './variants-table-complex';

export default function(context) {
    const arrBundlePageTypes = ['bundle', 'bundle-tattoo', 'bundle-complex'];
    const variantTable = document.getElementById('variantTable');
    const complexTable = document.getElementById('complex-table');
    
    const variantsAddToCart = document.getElementById('variants-addToCart');
    const $productId = window.jsContext.productId;
    const productType = window.jsContext?.productType;

    if (!arrBundlePageTypes.includes(productType)) return;

    let tableData = null;

    // Set up variants table
    if (productType === 'bundle-tattoo') {
        buildTattooVariantTable(variantTable, $productId, context)
            .then(data => {tableData = data});
    } else if (productType === 'bundle-complex') {
        buildComplexTable(context);
    } else {
        buildVariantTable(variantTable, $productId, context)
            .then(data => {tableData = data});
    }

    const bindEvents = el => {
        $(el)
            .on('click', '[data-id]', e => {
                const el = e.currentTarget;
                
                el.classList.add('--active');
    
                $(el)
                    .siblings()
                    .removeClass('--active');
            })
            .on('click', '.variant-select-colour', e => {
                e.currentTarget.nextElementSibling.classList.add('--show');
            })
            .on('click', '.colour-modal', e => {
                e.currentTarget.classList.remove('--show');
            })
            .on('click', '.colour-modal-content', e => {
                e.stopPropagation();
            })
            .on('click', '[data-action="close-colour-modal"]', e => {
                $(e.currentTarget).parents('.--show').first().removeClass('--show')
            });
        };

    if (variantTable) {
        bindEvents(variantTable);
    }

    if (complexTable) {
        bindEvents(complexTable);
    }



    // Add selected variants to cart
    if (variantsAddToCart) {
        variantsAddToCart.addEventListener('click', e => {
            e.preventDefault();
    
            if (tableData) {
                tableData.addToCart();
            } else {
                console.error('No TableData set to handle addToCart');
            }
        });
    }

    const funcHandleResize = () => {
        const elVariantContainers = document.querySelectorAll('.variant-container');

        for (let i = 0, l = elVariantContainers.length; i < l; i++) {
            const elContainer = elVariantContainers[i];
            elContainer.style.setProperty('--variant-width', `${elContainer.offsetWidth}px`);
        }
    };

    $(window)
        .on('resize', funcHandleResize);

    funcHandleResize();
}
