import variantsDataFactory from './variants-data';
import variantsTemplateFactory from './templates/variants-table';
import canShowPricing from './can-show-pricing';

export async function buildVariantTable(el, id, context, opts = {}) {
    // New data object for this table
    const data = variantsDataFactory(context, 'simple');
    const tmpl = variantsTemplateFactory('simple', context);
    await data.loadProduct(id);

    const config = {
        complex: false,
        ...opts
    };

    if (config.complex) {
        tmpl.setQtyMode('button');
    }

    const elContainer = document.createElement('div');
    elContainer.classList.add('variant-container');

    const elBody = document.createElement('div');

    elContainer.innerHTML += tmpl.tmplHeader(data);
    elContainer.append(elBody);

    elBody.innerHTML = tmpl.tmplContent(data.getItemsToDisplay());

    const elFooter = document.createElement('div');
    elFooter.innerHTML = tmplGenericFooter(context);

    elContainer.append(elFooter);

    el.append(elContainer);

    $(elContainer)
        .on('change', '.variant-grid_filter', event => {
            const el = event.currentTarget;
            const val = el.value ? Number(el.value) : null;

            data.addFilter(el.dataset.entityid, val);
            elBody.innerHTML = tmpl.tmplContent(data.getItemsToDisplay());

            $(el).trigger('content-updated');
        });

    setupVariantFooter(el, data, context);

    $(el)
        .on('content-updated', () => {
            $('.variant-set-option', el)
                .on('click', event => {
                    const el = event.currentTarget;
                    const { id, optionId, valueId } = el.dataset;
                    data.setItemOption(id, optionId, valueId);

                    // Update the button for the property if it exists
                    // Primarily folr the 'Colour' option but could
                    // extend to other attributes in the future
                    // Nicer than using the table-refresh event as that
                    // rebuilds the full HTML
                    const elVal = document.querySelector(`[data-item="${id}"][data-column="${optionId}"]`);
                    const strValue = data.getOptionValue(optionId, valueId);

                    if (elVal && strValue) {
                        elVal.textContent = strValue;
                    }
                });

            $('.variant-select', el)
                .on('click', event => {
                    const el = event.currentTarget;
                    const { id, action } = el.dataset;
                    data.resetQty(); // Clear currently selected item

                    if (action === 'add') {
                        data.setItemQty(id, 1); // Add qty to the new item
                    } else {
                        data.setItemQty(id, 0); // Add qty to the new item
                    }

                    $(window)
                        .trigger('table-refresh');
                });

            setupQtyBoxes(el, data);
            setupVariantPagination(el);
        })
        .trigger('content-updated')
        .removeClass('--loading');

    $(window)
        .on('table-refresh', () => {
            elBody.innerHTML = tmpl.tmplContent(data.getItemsToDisplay());
            $(el).trigger('content-updated');
        })
        .on('variants-loader-start', () => {
            el.classList.add('--loading');
        })
        .on('variants-loader-stop', () => {
            el.classList.remove('--loading');
        });

    return data;
}




export async function buildTattooVariantTable(el, id, context) {
    if (!el) return;
    const data = variantsDataFactory(context, 'tattoo');
    await data.addData(window.productData);

    // 
    const pageSize = 6;

    // Header/top templates
    const tmplTopColumn = (title) => `<div class="variant-tattoo-grid_header variant-tattoo-grid_top-column">${title}</div>`;
    const tmplTopColumns = (headings) => {
        let output = ``;
        headings.forEach(title => {
            output += tmplTopColumn(title)
        })
        return output;
    };
    const tmplHeader = (top) => {
        const { label, headings } = top;
        return `<div class="variant-tattoo-grid --header">
            <div class="variant-tattoo-grid_header variant-tattoo-grid_spacer">&nbsp;</div>
            <div class="variant-tattoo-grid_header variant-tattoo-grid_top-title">${label}</div>
            ${tmplTopColumns(headings)}
        </div>`;
    }

    // Row templates
    const tmplRows = (rows) => {
        let output = ``;
        let idx = 0;
        rows.forEach(row => {
            output += tmplRow(row, idx);
            idx += 1;
        });
        return output;
    };
    const tmplRow = (row, idx) => {
        const { label, items } = row;

        return `<div data-page="${Math.floor(idx / pageSize)}" class="variant-row variant-tattoo-grid_header variant-tattoo-grid_side-column paged-item">${label}</div>
            ${tmplItems(items, idx)}
        `;
    };

    // Item templates
    const tmplItems = (items, idx) => {
        let output = ``;
        items.forEach(item => {
            output += tmplItem(item, idx);
        });
        return output;
    };
    const tmplItem = (item, idx) => {
        const { id, sku, stock, priceWithTax, qty } = data.getProduct(item);
        return `<div data-key="${idx}"
                     data-page="${Math.floor(idx / pageSize)}"
                     data-price="${priceWithTax?.price?.value}" 
                     data-id="${id}"
                     class="variant-row variant-tattoo-grid_item paged-item ${!stock ? '--no-stock' : ''} ${idx % 2 === 0 ? '--even' : '--odd'}">
            <div class="variant-tattoo-grid_item-qty" data-qty-box><input data-id="${id}" data-qty type="num" value="${qty}" data-qty></div>
            <div class="variant-tattoo-grid_item-stock">${stock ? 'In stock' : 'Out of stock'}</div>
            <div class="variant-tattoo-grid_item-sku">${sku}</div>
        </div>`;
    };

    // Body template
    const tmplContent = (data) => {
        return `<div class="variant-scroll-frame">
            <div class="variant-tattoo-grid --content">
                <div class="variant-tattoo-grid_header variant-tattoo-grid_side-title"><span>${data.headers.side.label}</span></div>
                ${tmplRows(data.rows)}
            </div>
            ${tmplGenericPagination(data.rows, pageSize)}
        </div>`;
    };

    const elWrapper = document.createElement('div');
    elWrapper.classList.add('variant-tattoo-container');
    elWrapper.classList.add('variant-container');

    elWrapper.innerHTML += tmplHeader(data.headers.top);

    const elBody = document.createElement('div');
    elBody.innerHTML = tmplContent(data);

    elWrapper.append(elBody);

    const elFooter = document.createElement('div');
    elFooter.innerHTML = tmplGenericFooter(context);

    elWrapper.append(elFooter);

    if (Math.floor(data.rows.length / pageSize) === 0) {
        elWrapper.classList.add('--no-pagination');
    }

    // Set JS properties
    elWrapper.style.setProperty('--variant-columns', data.rows.length);
    elWrapper.style.setProperty('--variant-rows', data.headers.top.headings.length);

    el.classList.add('--variant-table-tattoo');
    el.append(elWrapper);

    setupQtyBoxes(el, data);
    setupVariantPagination(el, pageSize);
    setupVariantFooter(el, data, context);

    $(el)
        .on('content-updated', () => {
            setupQtyBoxes(el, data);
            setupVariantPagination(el);
        })
        .trigger('content-updated')
        .removeClass('--loading');

    $(window)
        .on('table-refresh', () => {
            elBody.innerHTML = tmplContent(data);
            $(el).trigger('content-updated');
            $(window)
                .trigger('grid-changed');
        })
        .on('variants-loader-start', () => {
            el.classList.add('--loading');
        })
        .on('variants-loader-stop', () => {
            el.classList.remove('--loading');
        });

    return data;
}

function setupVariantFooter(variantTable, data, context) {
    const elFooter = variantTable.querySelectorAll('.variant-footer:not(.--setup)');
    const funcUpdateTotals = (elFooter, totals) => {
        const elQty = elFooter.querySelector('[data-variant-total-qty]'),
              elSub = elFooter.querySelector('[data-variant-total-subtotal]');

        elQty.textContent = totals.qty;
        if (canShowPricing(context)) {
            elSub.textContent = totals.subtotal_formatted;
        }
    };

    $(elFooter)
        .each((index, element) => {
            element.classList.add('--setup');
    
            funcUpdateTotals(element, data.getTotalsObj());
    
            $(window)
                .on('grid-changed', () => {
                    funcUpdateTotals(element, data.getTotalsObj());
                })
                .on('grid-qty-changed', (event, details) => {
                    const { id, qty } = details;

                    const elsRows = document.querySelectorAll(`.variant-grid_row[data-id="${id}"]`);
                    for (let i = 0, l = elsRows.length; i < l; i++) {
                        const elRow = elsRows[i];
                        if (qty) {
                            elRow.classList.add('--added');
                        } else {
                            elRow.classList.remove('--added');
                        }
                    }
                });
        });
}


function setupVariantPagination(variantTable, pageSize = 6) {
    const elVariantOverflow = variantTable.querySelectorAll('.variant-scroll-frame');

    const funcShowPage = (elItems, elPagerButtons, page) => {
        const min = page * pageSize;
        const max = min + pageSize;

        if (variantTable.classList.contains('--variant-table-tattoo')) {
            for (let i = 0, l = elItems.length; i < l; i++) {
                const el = elItems[i];
                if (parseInt(el.dataset.page, 10) === page) {
                    el.classList.remove('--pagination-hidden');
                } else {
                    el.classList.add('--pagination-hidden');
                }
            }
        } else {
            for (let i = 0, l = elItems.length; i < l; i++) {
                const el = elItems[i];
                if (i >= min && i < max) {
                    el.classList.remove('--pagination-hidden');
                } else {
                    el.classList.add('--pagination-hidden');
                }
            }
        }

        for (let i = 0, l = elPagerButtons.length; i < l; i++) {
            const el = elPagerButtons[i];
            if (page === i) {
                el.classList.add('--current-page');
            } else {
                el.classList.remove('--current-page');
            }
        }
    };

    $(elVariantOverflow)
        .each((index, element) => {
            const elVariantPagination = element.querySelector('.variant-pagination');
            element.classList.add('--setup');

            let pageCurrent = 0;

            // 
            const elPageableItems = element.querySelectorAll('.paged-item');
            let pageLast = Math.ceil((elPageableItems.length - 1) / pageSize) - 1;

            // 
            const elPagerButtons = element.querySelectorAll('.variant-pagination_page');
            
    
            if (elVariantPagination) {
                $(elVariantPagination)
                    .on('click', '.variant-pagination_prev', () => {
                        if (pageCurrent > 0) {
                            pageCurrent -= 1;
                        }
    
                        funcShowPage(elPageableItems, elPagerButtons, pageCurrent);
                    })
                    .on('click', '.variant-pagination_next', () => {
                        if (pageCurrent < pageLast) {
                            pageCurrent += 1;
                        }
    
                        funcShowPage(elPageableItems, elPagerButtons, pageCurrent);
                    })
                    .on('click', '.variant-pagination_page', event => {
                        pageCurrent = parseInt(event.currentTarget.dataset.page, 10);
    
                        funcShowPage(elPageableItems, elPagerButtons, pageCurrent);
                    })

                
                funcShowPage(elPageableItems, elPagerButtons, pageCurrent);
            }
        });
}


function setupQtyBoxes(variantTable, data = null) {
    $(variantTable.querySelectorAll('[data-qty-box]'))
        .each((index, el) => {
            if (el.classList.contains('--active')) return;

            const elQty = el.querySelector('[data-qty]'),
                  elInc = el.querySelector('[data-action="inc"]'),
                  elDec = el.querySelector('[data-action="dec"]');

            el.classList.add('--active');

            let val = parseInt(elQty.value, 10);

            if (elInc) {
                elInc.addEventListener('click', () => {
                    val += 1;
    
                    elQty.value = val;
    
                    elQty.dispatchEvent(new Event('change'));
                });
            }

            if (elDec) {
                elDec.addEventListener('click', () => {
                    if (val > 0) {
                        val -= 1;
                    }
    
                    elQty.value = val;
    
                    elQty.dispatchEvent(new Event('change'));
                });
            }

            elQty.addEventListener('change', () => {
                val = parseInt(elQty.value, 10);

                data.setItemQty(elQty.dataset.id, val);
            });
        });
}


// Generic Templates
function tmplGenericPagination(rows, pageSize = 6) {
    if (Math.floor(rows.length / pageSize) === 0) return ``;

    const tmplPages = rows => {
        const pages = Math.ceil(rows.length / pageSize);
        let output = ``;
        
        for (let i = 0; i < pages; i++) {
            output += tmplPage(i);
        }
    
        return output;
    };

    const tmplPage = idx => {
        return `<button data-page="${idx}" class="variant-pagination_button variant-pagination_page" type="button">${idx + 1}</button>`
    };

    return `<div class="variant-pagination">
        <button class="variant-pagination_button variant-pagination_prev" type="button">
            <svg width="44" height="45" viewBox="0 0 44 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect y="0.872803" width="44" height="44" fill="#171718"/>
                <path d="M23.9314 28.9197L17.948 23.4349L23.9314 17.9502" stroke="white" stroke-width="4" stroke-linecap="square"/>
            </svg>
        </button>

        <div class="variant-pagination_pages">
            ${tmplPages(rows)}
        </div>

        <button class="variant-pagination_button variant-pagination_next" type="button">
            <svg width="44" height="45" viewBox="0 0 44 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect y="0.872803" width="44" height="44" fill="#171718"/>
                <path d="M19.0752 17.9501L25.0586 23.4349L19.0752 28.9197" stroke="white" stroke-width="4" stroke-linecap="square"/>
            </svg>
        </button>
    </div>`
};

// Footer template
const tmplGenericFooter = (context) => {
    return `<div class="variant-footer">
        <div>
            <span data-variant-total-qty>0</span> items added
        </div>

        <div>
            Subtotal
            <span data-variant-total-subtotal>${canShowPricing(context) ? '&pound;0.00' : '-'}</span>
        </div>
    </div>`
}
