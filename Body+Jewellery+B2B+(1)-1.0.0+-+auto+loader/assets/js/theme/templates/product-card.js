function tmplPrice(objPriceType) {
    if (objPriceType && objPriceType.price) {
        const objPrice = objPriceType.price;
        const nfPrice = new Intl.NumberFormat('en-GB', { style: 'currency', currency: objPrice.currencyCode });
        return  nfPrice.format(objPrice.value);
    }
}

function tmplStock(product) {
    return product.inventory.isInStock ? '<div class="card-stock --in-stock">In stock</div>' : '<div class="card-stock --out-of-stock">Out of stock</div>';
}

function attrImageSrc(product) {
    return product.defaultImage ? product.defaultImage.url : window.jsContext.defaultProductImage;
}

function tmplActionText(product) {
    return (product.productOptions && product.productOptions.edges && product.productOptions.edges.length) ? 'Choose Option' : 'Add to Cart';
}

function hasPrices(product) {
    return product.priceWithTax && product.priceWithoutTax ? true : false;
}

export default function templateProductCard(product, context) {
    const isLoggedIn = context.customer ?? false;
    const pageTypeCheckout = document.querySelector('body').classList.contains('page_type__cart') ?? false;
    let hidePrice = false;

    if(!isLoggedIn) {
        product?.categories?.edges.forEach(category => {
            if(category.node.name === 'Body Jewellery'
                || category.node.name === 'Medical Supplies'
                ) {
                hidePrice = true;
            }
        });
    }

    return `<article
        class="card card-product"
        data-product="card-${product.entityId}"
        data-product-id="${product.entityId}"
        data-category="">
        <figure class="card-figure">
            <a href="${product.path}" class="card-figure__link">
                <div class="card-img-container">
                    <img class="card-image" src="${attrImageSrc(product)}" />
                </div>
            </a>
        </figure>
        <div class="card-body">
            <h3 class="card-title">
                <a href="${product.path}">
                    ${product.name}
                </a>
            </h3>

            <div class="card-info">
                <div class="card-sku">
                    <span>SKU:</span> <strong>${product.sku}</strong>
                </div>

                ${tmplStock(product)}
            </div>

            <div class="card-text card-text--price">
                ${hidePrice ? '<p class="price-login-card" translate data-cust-hide><a href="/login.php">Log in for pricing</a></p>' :
                        `
                        <div class="price-section price-section--withTax">
                            <span class="price">${tmplPrice(product.priceWithTax)}</span>
                        </div>
                        <div class="price-section price-section--withoutTax">
                            <span class="price">${tmplPrice(product.priceWithoutTax)}</span>
                        </div>
                        `
                }
            </div>

            ${tmplActionText(product) === 'Choose Option' ? `
            <a href="${product.path}" class="button button-add-to-cart ${!isLoggedIn ? '--restricted' : ''}" ${pageTypeCheckout && tmplActionText(product) === 'Choose Option'}  ${!isLoggedIn ? 'disabled' : ''}>
                <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1H4.63636L7.07273 13.1148C7.15586 13.5313 7.38355 13.9055 7.71595 14.1718C8.04835 14.4381 8.46427 14.5796 8.89091 14.5714H17.7273C18.1539 14.5796 18.5698 14.4381 18.9022 14.1718C19.2346 13.9055 19.4623 13.5313 19.5455 13.1148L21 5.52381H5.54545M9.18182 19.0952C9.18182 19.5949 8.7748 20 8.27273 20C7.77065 20 7.36364 19.5949 7.36364 19.0952C7.36364 18.5956 7.77065 18.1905 8.27273 18.1905C8.7748 18.1905 9.18182 18.5956 9.18182 19.0952ZM19.1818 19.0952C19.1818 19.5949 18.7748 20 18.2727 20C17.7707 20 17.3636 19.5949 17.3636 19.0952C17.3636 18.5956 17.7707 18.1905 18.2727 18.1905C18.7748 18.1905 19.1818 18.5956 19.1818 19.0952Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>${tmplActionText(product)}</span>
            </a>` : 
            `
            <button type="button" class="button button-add-to-cart quickview ${!isLoggedIn ? '--restricted' : ''}" data-product-id="${product.entityId}" ${!isLoggedIn ? 'disabled' : ''}>
                <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 1H4.63636L7.07273 13.1148C7.15586 13.5313 7.38355 13.9055 7.71595 14.1718C8.04835 14.4381 8.46427 14.5796 8.89091 14.5714H17.7273C18.1539 14.5796 18.5698 14.4381 18.9022 14.1718C19.2346 13.9055 19.4623 13.5313 19.5455 13.1148L21 5.52381H5.54545M9.18182 19.0952C9.18182 19.5949 8.7748 20 8.27273 20C7.77065 20 7.36364 19.5949 7.36364 19.0952C7.36364 18.5956 7.77065 18.1905 8.27273 18.1905C8.7748 18.1905 9.18182 18.5956 9.18182 19.0952ZM19.1818 19.0952C19.1818 19.5949 18.7748 20 18.2727 20C17.7707 20 17.3636 19.5949 17.3636 19.0952C17.3636 18.5956 17.7707 18.1905 18.2727 18.1905C18.7748 18.1905 19.1818 18.5956 19.1818 19.0952Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Add to cart</span>
            </button>`
            }
        
            <div class="card-wishlist" data-wishlist-add>
                <button class="js-wishlist wishlist-widget" data-id="${product.entityId}">
                    <svg width="23" height="20" viewBox="0 0 23 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.2913 2.61183C19.7805 2.10083 19.1741 1.69547 18.5066 1.41891C17.8392 1.14235 17.1238 1 16.4013 1C15.6788 1 14.9634 1.14235 14.2959 1.41891C13.6285 1.69547 13.022 2.10083 12.5113 2.61183L11.4513 3.67183L10.3913 2.61183C9.3596 1.58013 7.96032 1.00053 6.50129 1.00053C5.04226 1.00053 3.64298 1.58013 2.61129 2.61183C1.5796 3.64352 1 5.04279 1 6.50183C1 7.96086 1.5796 9.36013 2.61129 10.3918L11.4513 19.2318L20.2913 10.3918C20.8023 9.88107 21.2076 9.27464 21.4842 8.60718C21.7608 7.93972 21.9031 7.22431 21.9031 6.50183C21.9031 5.77934 21.7608 5.06393 21.4842 4.39647C21.2076 3.72901 20.8023 3.12258 20.2913 2.61183Z" stroke="#171718" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </button>

                <ul class="wishlist-menu">
                    <li>
                        <a href="/wishlist.php?action=addwishlist&product_id=${product.entityId}">Create New Wish List</a>
                    </li>
                </ul>
            </div>
        </div>
    </article>`;
}
