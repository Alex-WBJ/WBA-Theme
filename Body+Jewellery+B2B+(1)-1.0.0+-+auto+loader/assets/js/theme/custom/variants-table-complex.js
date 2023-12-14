import { buildVariantTable } from './variants-table';
import { getMultiVariants } from './graphql/get-variants';
import { getProductIdBySkuRaw } from './graphql/get-products';
import formatPrice from './price';
import baseVariantData from './variants/base';

class complexBundleData extends baseVariantData {
    elSummary = null;
    product = null;
    productId = null;
    arrProducts = [];
    products = {};
    rows = [];
    titles = [];
    tables = {};
    qty = 1;
    queuedItems = [];
    tmrRefresh = null;

    constructor(context) {
        super(context);
        this.productId = Number(window.jsContext.productId);
        this.elSummary = document.getElementById('complex-summary');
    }

    async addData(data) {
        data.forEach(({ name, value }) => {
            const r = name.match(/bundle_line_(?<index>[0-9]+)/);
            if (r?.groups?.index) {
                value.split(',').forEach(v => {
                    this.rows.push(v);
                });
            }

            const t = name.match(/bundle_title_(?<index>[0-9]+)/);
            if (t?.groups?.index) {
                value.split(',').forEach(v => {
                    this.titles.push(v);
                });
            }
        });

        await Promise.all(this.rows.map(row => {
                if (isNaN(row)) {
                    return getProductIdBySkuRaw(row, this.context);
                }
            }))
            .then((responses) => {
                return Promise.all(responses.map((response) => {
                    if (response) {
                        return response.json();
                    }

                    return false;
                }));
            })
            .then(data => {                
                data.forEach(dataItem => {
                    if (!dataItem) return;
                    const { sku, entityId } = dataItem.data.site.product
                    let idx = this.rows.findIndex(row => row === sku);
                    if (idx > -1) {
                        this.rows[idx] = entityId;
                    }
                })
            });
        

        return getMultiVariants([this.productId, ...this.rows], this.context)
            .then(data => {
                data.forEach(({ node }) => {
                    if (node.entityId === this.productId) {
                        this.product = node;
                    }

                    this.arrProducts.push(node);
                    this.products[node.entityId] = node;
                });
            });
    }

    addTableData(key, data) {
        this.tables[key] = data;
    }

    getSelectedOptions() {
        const opts = {};
        for (const key in this.tables) {
            if (this.tables.hasOwnProperty(key)) {
                opts[key] = this.tables[key].getSelectedItems();
            }
        }
        return opts;
    }

    getLineItem() {
        const optionSelections = [];

        const elBundleParentField = document.querySelector('[data-field-label]');

        if (elBundleParentField) {
            optionSelections.push({
                optionId: Number(elBundleParentField.dataset.fieldId),
                optionValue: this.uid
            });
        }

        return {
            quantity: 1,
            productId: Number(this.productId),
            optionSelections
        };
    }

    generateLineItems() {
        let lineItems = [];

        lineItems.push(this.getLineItem());

        for (const key in this.tables) {
            if (this.tables.hasOwnProperty(key)) {
                this.tables[key].uid = this.uid;
                const tableLineItems = this.tables[key].getLineItems();
                tableLineItems.forEach(lineItem => {
                    lineItem.quantity = this.qty;
                });
                lineItems = [...lineItems, ...tableLineItems];
            }
        }

        return lineItems;
    }

    getLineItems() {
        const isValid = this.validate();
        this.uid = this.generateUid();

        if (!isValid) {
            return [];
        }

        let lineItems = this.generateLineItems();

        // 
        let objBundles = {};
        
        // Build the existing objBundles
        // Potential re-work to load cart data on load?
        const arrBundleOptions = ['Bundle Parent', 'Bundle Child'];
        window.cartData.items.forEach(item => {
            let bundleKey = false;
            item.options.forEach(option => {
                // Check each option to see if it matches
                // a bundle option name
                if (arrBundleOptions.includes(option.name)) {
                    bundleKey = option.value;
                }
            });

            if (bundleKey) {
                if (!objBundles.hasOwnProperty(bundleKey)) {
                    objBundles[bundleKey] = [];
                }
    
                objBundles[bundleKey].push({
                    productId: item.product_id ? item.product_id : item.productId,
                    variantId: item.variant_id ? item.variant_id : item.variantId,
                    options: item.options
                });
            }
        });

        // For each bundle in the basket
        for (const key in objBundles) {
            if (objBundles.hasOwnProperty(key)) {
                const arrBundle = objBundles[key];

                let matches = true;

                lineItems.forEach(item => {
                    const result = arrBundle.find(b => {
                        // Try and match against the new line items
                        // Only match the productId the item does not have variantId
                        let bundleMatches = b.productId === item.productId && (!item.hasOwnProperty('variantId') || b.variantId === item.variantId);

                        if (bundleMatches) {
                            // Check options
                            item.optionSelections.forEach(opt => {
                                // Skip the uid field
                                if (!opt.displayName) return;
                                let bundleOptionMatch = b.options.find(bundleOpt => {
                                    return opt.displayName === bundleOpt.name && opt.displayValue === bundleOpt.value;
                                });

                                if (!bundleOptionMatch) {
                                    matches = false;
                                }
                            })
                        }

                        return bundleMatches;
                    })

                    // Find will return undefined if no matches
                    if (!result) {
                        matches = false;
                    }
                });
                
                if (matches) {
                    //  Change line items uid to the matching key
                    this.uid = key;
                    // Get the line items with the new key
                    lineItems = this.generateLineItems();
                }
            }
        }

        return lineItems;
    }

    setQty(qty) {
        this.qty = Number(qty);
    }

    getProductPrice(withTax = false) {
        if (withTax) {
            return this.product.priceWithTax.price.value;
        }
        return this.product.priceWithoutTax.price.value;
    }

    validate(selectedOptions = false) {
        let isValid = true;
        let goTo = false;

        if (!selectedOptions) {
            selectedOptions = this.getSelectedOptions();
        }

        for (const key in selectedOptions) {
            if (selectedOptions.hasOwnProperty(key)) {
                const items = selectedOptions[key];
                const elSummaryLine = document.querySelector(`.complex-summary_option[data-key="${key}"]`)

                if (items.length === 0) {
                    isValid = false;
                    elSummaryLine.classList.add('--invalid');
                    if (!goTo) {
                        goTo = key;
                    }
                } else {
                    elSummaryLine.classList.remove('--invalid');
                }
            }
        }

        if (this.elSummary) {
            if (isValid) {
                this.elSummary.classList.remove('--invalid');
            } else {
                this.elSummary.classList.add('--invalid');
            }
        }

        return isValid;
    }

    validateRow(row) {
        const selectedOptions = this.getSelectedOptions();

        if (selectedOptions[row] && selectedOptions[row].length) {
            return true;
        }

        return false;
    }

    resetQty() {
        for (const key in this.tables) {
            if (this.tables.hasOwnProperty(key)) {
                this.tables[key].resetQty();
            }
        }

        $(window)
            .trigger('grid-changed');
    }
}

export default async function buildComplexTable(context) {
    const elTable = document.getElementById('complex-table');
    const elSummary = document.getElementById('complex-summary');
    const elSummaryOpts = elSummary.querySelector('.complex-summary_options');
    const data = new complexBundleData(context);
    const arrRows = [];
    await data.addData(window.productData);

    let idx = 0;

    data.rows.forEach(row => {
        if (!data.products[row]) return;
        const elRow = document.createElement('div');
        elRow.classList.add('complex-steps_step')
        elRow.dataset.index = idx;
        elRow.dataset.key = row;
        if (idx === 0) {
            elRow.classList.add('--active');
        }

        elRow.innerHTML = `<div class="complex-steps_image"><img src="${data.products[row].defaultImage?.url || context.defaultProductImage}"></div>
        <div>
            <h2 class="complex-steps_title">Choose Your ${data.titles[idx] || 'Item'}</h2>
            <div class="complex-steps_table"></div>
            <div class="complex-steps_actions">
                <button class="button complex-goto" type="button" data-goto="${idx - 1}">Previous Step</button>
                <button class="button button--primary complex-goto" type="button" data-goto="${idx + 1}" data-validate="${row}">Next Step</button>
            </div>
        </div>`

        elSummaryOpts.innerHTML += `<div class="complex-summary_option complex-goto" data-goto="${idx}" data-validate="${row}" data-key="${row}">
            <div class="complex-summary_option-title">${data.titles[idx] || 'Item'}</div>
            <div class="complex-summary_option-value">-</div>
        </div>`;

        const elVariantTable = elRow.querySelector('.complex-steps_table');

        buildVariantTable(elVariantTable, row, context, {
            complex: true
        })
            .then(tableData => {
                data.addTableData(row, tableData);

                $(window)
                    .trigger('resize')
                    .trigger('grid-changed');
            });

        elTable.append(elRow);
        arrRows.push(elRow);

        idx += 1;
    });

    $(window)
        .trigger('resize');

    $(window)
        .on('grid-changed', () => {
            const selectedOptions = data.getSelectedOptions();
            const totals = {
                qty: 0,
                subtotal_with_tax: 0,
                subtotal_without_tax: 0,
                subtotal_with_tax_formatted: '',
                subtotal_without_tax_formatted: ''
            };
            totals.subtotal_with_tax = data.getProductPrice(true);
            totals.subtotal_without_tax = data.getProductPrice(false);

            for (const key in selectedOptions) {
                if (selectedOptions.hasOwnProperty(key)) {
                    const items = selectedOptions[key];

                    const el = document.querySelector(`.complex-summary_option[data-key="${key}"] .complex-summary_option-value`);
                    let content = ``;

                    items.forEach(item => {
                        const { qty, name, columns, priceWithTax, priceWithoutTax } = item;

                        totals.qty += qty;
                        totals.subtotal_with_tax += (priceWithTax.calculated * qty);
                        totals.subtotal_without_tax += (priceWithoutTax.calculated * qty);

                        let displayOptions = [];
                        columns.forEach(col => {
                            if (typeof col === 'string') {
                                displayOptions.push(col);
                                return;
                            }

                            if (typeof col === 'object') {
                                let idx = col.values.edges.findIndex(({ node }) => {
                                    return node.entityId === item.opts[col.entityId];
                                })

                                if (idx > -1) {
                                    displayOptions.push(col.values.edges[idx].node.label);
                                }
                            }
                        });

                        let opts = '';
                        if (displayOptions.length) {
                            opts = `: ${displayOptions.join(', ')}`;
                        }

                        content += `${qty} x ${name}${opts}`;
                    });

                    if (!content) {
                        content = '-';
                    }

                    el.innerHTML = content;
                }
            } // endfor

            if (elComplexQty) {
                const numQty = Number(elComplexQty.value);
                totals.subtotal_with_tax = totals.subtotal_with_tax * numQty;
                totals.subtotal_without_tax = totals.subtotal_without_tax * numQty;
            }

            totals.subtotal_with_tax_formatted = formatPrice(totals.subtotal_with_tax);
            totals.subtotal_without_tax_formatted = formatPrice(totals.subtotal_without_tax);

            const elSummarySubtotal = document.querySelector('[data-summary-total]');
            if (elSummarySubtotal) {
                elSummarySubtotal.textContent = totals.subtotal_with_tax_formatted;
            }

            if (totals.qty) {
                data.validate();
            }

            // re-evaluate if steps need disabling
            const elSteps = document.querySelectorAll('.complex-steps_step');
            let isValid = true;
            for (let i = 0, l = elSteps.length; i < l; i++) {
                const elStep = elSteps[i];
                const { key } = elStep.dataset;
                if (isValid) {
                    elStep.classList.add('--active');
                } else {
                    elStep.classList.remove('--active');
                }
                isValid = data.validateRow(key);
                if (isValid) {
                    elStep.classList.add('--option-selected');
                } else {
                    elStep.classList.remove('--option-selected');
                }
            }
        });

    const elComplexAddToCart = document.getElementById('complex-addToCart');
    if (elComplexAddToCart) {
        elComplexAddToCart.addEventListener('click', () => {
            data.addToCart();
        });
    }

    const elComplexQty = document.getElementById('complex-qty');
    if (elComplexQty) {
        elComplexQty.addEventListener('change', () => {
            data.setQty(elComplexQty.value);
            $(window)
                .trigger('grid-changed')
        });
    }

    $(document.body)
        .on('click', '.complex-goto', event => {
            const { goto, validate } = event.currentTarget.dataset;

            if (validate) {
                if (!data.validateRow(validate)) {
                    return false;
                }
                if (arrRows[goto]) {
                    arrRows[goto].classList.add('--active');
                }
            }

            if (arrRows[goto]) {
                const rect = arrRows[goto].getBoundingClientRect();
                window.scrollTo({
                    top: window.scrollY + rect.top,
                    left: 0,
                    behavior: 'smooth'
                });
            }
        });
}
