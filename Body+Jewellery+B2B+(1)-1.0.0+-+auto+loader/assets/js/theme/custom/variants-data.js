import formatPrice from './price';
import { getProductByEntityIdRaw, getProductBySkuRaw } from './graphql/get-products';
import { getVariants, getVariantsBySku } from './graphql/get-variants';
import baseVariantData from './variants/base';

class variantData extends baseVariantData {
    columns = [];
    filters = {};
    productId = null;
    queuedItems = [];
    tmrRefresh = null;
    bundleFields = ['bundle child', 'bundle parent'];

    getTotalsObj() {
        const obj = {
            qty: 0,
            subtotal: 0
        };

        this.items.forEach(item => {
            if (item.qty > 0) {
                obj.qty += item.qty;

                if (item.priceWithTax) {
                    obj.subtotal += item.qty * item.priceWithTax.calculated;
                }
            }
        });

        obj.subtotal_formatted = formatPrice(obj.subtotal);

        return obj;
    }

    addData(product) {
        // Prepare nicer data before rendering //
        const preparedDataProductOptions = []; // Product data options with entityId as key
        const productCustomizationDefaults = {};

        // Store product ID to build lineItems
        this.productId = product.entityId;

        product.productOptions.edges.forEach(({ node }) => {
            node.origDisplayName = node.displayName;

            if (this.bundleFields.indexOf(node.displayName.toLowerCase()) === -1) {
                if (node.displayName.toLowerCase().indexOf('colour') > -1 && !node.isVariantOption) {
                    // Force the colour option to use a simplified header text
                    node.displayName = 'Colour';
                    this.columns.unshift(node);
                } else {
                    node.displayName =  node.displayName.replace(/(\(.+\))/ig, "<small>$1</small>");
                    this.columns.push(node);
                }
            } else {
                this.bundleOption = node;
            }

            if (!node.isVariantOption) {
                let defaultValue = null;
                node.values?.edges.forEach(({ node }) => {
                    if (defaultValue === null || node.isDefault) {
                        defaultValue = node.entityId;
                    }
                });
                productCustomizationDefaults[node.entityId] = defaultValue;
            }

            preparedDataProductOptions[node.entityId] = node;
        });

        product.variants.edges.forEach(({ node }) => {
            // Prepare the items (rows)
            const item = {
                name: product.name,
                id: node.entityId,
                opts: { ...productCustomizationDefaults },
                columns: [],
                inventory: node.inventory,
                priceWithTax: null,
                priceWithoutTax: null,
                qty: 0
            };

            // Move to an indexed array for easier reference
            const opts = [];
            node.options.edges.forEach(({ node }) => {
                opts[node.entityId] = node.values.edges[0].node.label;
                // Used for filtering
                item.opts[node.entityId] = node.values.edges[0].node.entityId;
            })

            // Map the item columns correctly (GraphQl seems to do it's own thing with these otherwise)
            this.columns.forEach(column => {
                if (column.isVariantOption) {
                    item.columns.push(opts[column.entityId])
                } else {
                    item.columns.push(preparedDataProductOptions[column.entityId])
                }
            });

            if (node.priceWithTax) {
                const { price } = node.priceWithTax;
                item.priceWithTax = node.priceWithTax
                item.priceWithTax.calculated = price.value;
                item.priceWithTax.formatted = formatPrice(price.value, price.currencyCode);
            }

            if (node.priceWithoutTax) {
                const { price } = node.priceWithoutTax;
                item.priceWithoutTax = node.priceWithoutTax
                item.priceWithoutTax.calculated = price.value;
                item.priceWithoutTax.formatted = formatPrice(price.value, price.currencyCode);
            }

            this.items.push(item);
        });
    }

    getItemIndex(id) {
        return this.items.findIndex(item => item.id === Number(id));
    }

    getColumnIndex(id) {
        return this.columns.findIndex(column => column.entityId === Number(id));
    }

    setItemQty(id, qty) {
        this.items[this.getItemIndex(id)].qty = qty;

        // Relace with navillajs custom event?
        $(window).trigger('grid-changed');
        $(window).trigger('grid-qty-changed', { id, qty });
    }

    getItemsToDisplay() {
        return this.items.filter(item => {
            for (const key in this.filters) {
                if (this.filters.hasOwnProperty(key)
                    && this.filters[key]) {
                    if (item.opts[key] !== this.filters[key]) {
                        return false;
                    }
                }
            }
            return true;
        });
    }

    addFilter(key, val) {
        this.filters[key] = val;
    }

    setItemOption(id, optionId, valueId) {
        const idx = this.getItemIndex(id);
        this.items[idx].opts[Number(optionId)] = Number(valueId);

        // Update formatted price if required
        let priceModifier = 0;
        this.items[idx].columns.forEach(column => {
            if (typeof column === 'object') {
                if (column.displayName === 'Colour') {
                    column.values.edges.forEach(({ node }) => {
                        if (node.entityId === this.items[idx].opts[column.entityId]) {
                            if (node.label !== 'Highly Polished') {
                                priceModifier = 0.1;
                            }
                        }
                    })
                }
            }
        });

        let v = this.items[idx].priceWithTax.price.value;
        v += priceModifier;

        if (v !== this.items[idx].priceWithTax.calculated) {
            this.items[idx].priceWithTax.calculated = v;
            this.items[idx].priceWithTax.formatted = formatPrice(this.items[idx].priceWithTax.calculated);
            this.updateRowPrice(this.items[idx].id);

            $(window)
                .trigger('grid-changed');
        }
    }

    updateRowPrice(id, withTax = true) {
        if (this.canShowPricing()) {
            const idx = this.getItemIndex(id);
            const el = document.querySelector(`.variant-grid_row[data-id="${id}"] .variant-grid_cell.--price`);
            const { formatted } = withTax ? this.items[idx].priceWithTax : this.items[idx].priceWithoutTax;
            if (el) {
                el.innerHTML = formatted;
            }
        }
    }

    async loadProduct(id) {
        let loadFunction = getVariants;

        if (isNaN(id)) {
            loadFunction = getVariantsBySku;
        }

        await loadFunction(id, this.context)
            .then(product => {
                this.addData(product);
            })
    }

    getSelectedItems() {
        const items = [];

        this.items.forEach(item => {
            if (item.qty > 0) {
                items.push(item);
            }
        });
        return items;
    }

    getOptionValue(optionId, valueId) {
        const column = this.columns[this.getColumnIndex(optionId)];
        const valIdx = column.values.edges.findIndex(({ node }) => node.entityId === Number(valueId));
        const value = column.values.edges[valIdx].node;

        if (value.isDefault) {
            return column.displayName;
        }

        return value.label;
    }

    //
    getOptionValueDisplay(optionId, valueId)
    {
        const rtn = {};

        const column = this.columns[this.getColumnIndex(optionId)];
        const value = column.values.edges.find(({node}) => {
            return node.entityId === Number(valueId);
        });

        rtn.displayName = column.origDisplayName;
        rtn.displayValue = value.node.label;

        return rtn;
    }

    getLineItem(item) {
        const optionSelections = [];

        for (const key in item.opts) {
            if (item.opts.hasOwnProperty(key)) {
                if (this.bundleOption?.entityId === Number(key)) {
                    if (this.uid) {
                        optionSelections.push({
                            optionId: Number(key),
                            optionValue: this.uid
                        });
                    }
                } else {
                    optionSelections.push({
                        optionId: Number(key),
                        optionValue: Number(item.opts[key]),
                        // MLTEST
                        ...this.getOptionValueDisplay(key, item.opts[key])
                    });
                }

            }

        }

        return {
            quantity: item.qty,
            productId: Number(this.productId),
            variantId: Number(item.id),
            optionSelections
        };
    }
}

class variantDataTattoo extends baseVariantData { // Change to more generic 'grid' name?
    arrProductIds = [];
    headers = {};
    rows = [];

    constructor(context) {
        super(context);
        
        this.headers = {
            top: {
                label: '',
                headings: []
            },
            side: {
                label: ''
            }
        };
    }

    // Check row exists if not add structure
    checkDataRow(index) {
        if (typeof this.rows[index] === 'undefined') {
            this.rows[index] = {
                label: '',
                items: []
            };
        }
    }

    async addData(data) {
        data.forEach(({ name, value }) => {
            const r = name.match(/table_tr_td_(?<index>[0-9]+)/);
            if (r?.groups?.index) {
                value.split(',').forEach(v => {
                    if (isNaN(v)) {
                        this.arrProductIds.push(v);
                    } else {
                        this.arrProductIds.push(Number(v));
                    }
                });
            }
        });

        data.forEach(({ name, value }) => {
            if (name === 'table_row_heading_1') {
                this.headers.top.label = value;
            }
            else if (name === 'table_column_heading_1') {
                this.headers.side.label = value;
            }
            else if (name === 'table_row_heading_2') {
                this.headers.top.headings = value.split(',');
            }
            else if (name === 'table_column_heading_2') {
                const arrValue = value.split(',');
                for (let i = 0, l = arrValue.length; i < l; i++) {
                    const v = arrValue[i];
    
                    this.checkDataRow(i);
    
                    this.rows[i].label = v;
                }
            }
        });


        await Promise.all(this.getFetches())
            .then((responses) => {
                return Promise.all(responses.map((response) => {
                    return response.json();
                }));
            }).then(data => {
                data.forEach(dataItem => {
                    if (dataItem.errors) return;
                    const { product } = dataItem.data.site;

                    if (product) {
                        this.items[product.entityId] = {
                            ...product,
                            qty: 0
                        };
                    }
                });
            }).catch((error) => {
                console.error(error);
            });

        this.addProductData(data);
    }

    getFetches() {
        const arrFetches = [];
        this.arrProductIds.forEach(idx => {
            if (isNaN(idx)) {
                arrFetches.push(getProductBySkuRaw(idx, this.context));
            } else {
                arrFetches.push(getProductByEntityIdRaw(idx, this.context));
            }
        });
        return arrFetches;
    }

    addProductData(data) {
        data.forEach(({ name, value }) => {
            const r = name.match(/table_tr_td_(?<index>[0-9]+)/);
            if (r?.groups?.index) {
                const i = Number(r?.groups?.index) - 1;

                this.checkDataRow(i);

                value.split(',').forEach(v => {
                    this.rows[i].items.push(v);

                });
            }
        });
    }

    findProduct(identifier) {
        if (isNaN(identifier)) {
            return this.findProductBySku(identifier);
        }

        return this.findProductById(Number(identifier));
    }

    findProductBySku(sku) {
        const idx = this.items.findIndex(product => {
            return product?.sku === sku;
        })

        return this.items[idx];
    }

    findProductById(id) {
        const idx = this.items.findIndex(product => {
            return product?.entityId === id;
        })

        return this.items[idx];
    }

    getProduct(id) {
        const product = this.findProduct(id);

        if (typeof product === 'undefined') {
            return {
                id: null,
                sku: 'N/A',
                stock: false,
                qty: 0
            };
        }

        const item = {
            id: product.entityId,
            sku: product.sku,
            stock: product.inventory.isInStock,
            qty: product.qty
        };

        if (product.priceWithTax) {
            const { price } = product.priceWithTax;
            item.priceWithTax = product.priceWithTax
            item.priceWithTax.calculated = price.value;
            item.priceWithTax.formatted = formatPrice(price.value, price.currencyCode);
        }

        if (product.priceWithoutTax) {
            const { price } = product.priceWithoutTax;
            item.priceWithoutTax = product.priceWithoutTax
            item.priceWithoutTax.calculated = price.value;
            item.priceWithoutTax.formatted = formatPrice(price.value, price.currencyCode);
        }
        
        return item;
    }

    getProductIds() {
        return this.arrProductIds;
    }

    getTotalsObj() {
        const obj = {
            qty: 0,
            subtotal: 0
        };

        this.items.forEach(item => {
            if (item.qty > 0) {
                obj.qty += item.qty;

                if (item.priceWithTax) {
                    obj.subtotal += item.qty * item.priceWithTax.calculated;
                }
            }
        });

        obj.subtotal_formatted = formatPrice(obj.subtotal);

        return obj;
    }

    setItemQty(id, qty) {
        this.items[Number(id)].qty = qty;
        // Relace with navillajs custom event?
        $(window).trigger('grid-changed');
    }

    getLineItem(item) {
        return {
            quantity: item.qty,
            productId: item.entityId
        };
    }
}

export default function variantsDataFactory(context, type = 'simple')
{
    switch (type) {
        case 'simple': 
        case 'colour':
            return new variantData(context);
            break;
        case 'tattoo': 
            return new variantDataTattoo(context);
            break;
    }
}
