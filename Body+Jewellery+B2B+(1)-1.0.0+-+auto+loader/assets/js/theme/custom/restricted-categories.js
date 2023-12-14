import getRestrictedCategories from "./get-restricted-categories";
import canShowPricing from "./can-show-pricing";

export default async function setupRestrictedCategories(context) {
    let restrictedCategories = [];

    await getRestrictedCategories().then(resp => {
        restrictedCategories = resp;
        context.restrictedCategories = restrictedCategories;
    });

    const elStyleRestricted = document.createElement('style');

    let styleContent = ``;
    let arrHidePrice = [];
    let arrShowPriceLogin = [];
    let arrDisableButton = [];

    restrictedCategories.forEach(category => {
        arrHidePrice.push(`[data-product-category*="${category}"] .price-login ~ *`);
        arrShowPriceLogin.push(`[data-product-category*="${category}"] .price-login`);
        arrDisableButton.push(`[data-product-category*="${category}"] .button-add-to-cart`);
    });

    if (arrHidePrice.length) {
        styleContent += `${arrHidePrice.join(',')} {
            display: none;
        }`;
    }

    if (arrShowPriceLogin.length) {
        styleContent += `${arrShowPriceLogin.join(',')} {
            display: initial;
        }`;
    }

    if(arrDisableButton.length && !context.customer) {
        styleContent += `${arrDisableButton.join(',')} {
            pointer-events: none;
            opacity: 0.7;
        }`;
    }

    if (styleContent) {
        elStyleRestricted.innerHTML = styleContent;
        document.body.appendChild(elStyleRestricted);
    }

    // Render the full category name paths
    // used for updating widget products
    const objCategories = {};
    doCategory(objCategories, context.categories);

    const elCardsCategories = document.querySelectorAll('.card-product[data-product-category-ids]:not([data-product-category])');
    for (let i = 0, l = elCardsCategories.length; i < l; i++) {
        const el = elCardsCategories[i];
        let categoryNames = [];

        el.dataset.productCategoryIds.split(',').forEach(catId => {
            categoryNames.push(objCategories[catId]);
        });

        el.dataset.productCategory = categoryNames.join(',');
    }

    if (!context.cid) {
        removeSelector('[data-anon-hide]');
    } else {
        removeSelector('[data-cust-hide]');
    }

    // Product page: disable add to basket button
    if (!canShowPricing(context)) {
        document.body.classList.add('--product-restricted');
    }

    document.body.classList.add('--restrictions-loaded');
}

function removeSelector(selector) {
    const els = document.querySelectorAll(selector);

    for (let i = 0, l = els.length; i < l; i++) {
        const el = els[i];
        el.parentElement.removeChild(el);
    }

}

function doCategory(objCategories, categoryGroup, parentName = '') {
    categoryGroup.forEach(category => {
        const categoryName = parentName ? `${parentName}/${category.name}` : category.name;
        objCategories[category.id] = categoryName;

        if (category.children) {
            doCategory(objCategories, category.children, categoryName);
        }
    });
}
