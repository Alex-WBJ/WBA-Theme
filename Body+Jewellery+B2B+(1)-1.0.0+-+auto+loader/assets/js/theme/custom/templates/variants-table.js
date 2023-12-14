import canShowPricing from "../can-show-pricing";

class templateVariantsSimple {
    context = null;
    qtyMode = 'input';
    qtyLabel = 'Qty'

    constructor(context) {
        this.context = context;
    }

    // Header Templates
    tmplHeader(data) {
        return `<div class="variant-grid --header">
            <div class="variant-grid_row variant-grid_header">
                ${this.tmplHeaderColumns(data)}
                <div class="variant-grid_cell --price">Price <small>inc VAT</small></div>
                <div class="variant-grid_cell --qty">${this.qtyLabel}</div>
            </div>
            <div class="variant-grid_row variant-grid_filters">
                ${this.tmplFilterColumns(data)}
                <div class="variant-grid_cell --price"></div>
                <div class="variant-grid_cell --qty"></div>
            </div>
        </div>`;
    }

    // Header Columns
    tmplHeaderColumns({ columns }) {
        let output = ``;
        columns.forEach(column => {
            output += `
            <div class="variant-grid_cell">
                ${this.tmplHeaderColumnExtra(column)}
                ${column.displayName}
            </div>`;
        });
        return output;
    }

    tmplHeaderColumnExtra(column) {
        let output = ``;
        if (column.displayName.toLowerCase().indexOf('gauge') > -1) {
            output = `
            <button type="button" class="variant-grid_tooltip" data-tooltip="tooltip-gauge">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 10.8V8M8 5.2H8.007M15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1C11.866 1 15 4.13401 15 8Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>`;
        }
        return output;
    }

    // Filter Columns
    tmplFilterColumns({ columns }) {
        let output = ``;
        columns.forEach(column => {
            output += this.tmplFilterColumn(column);
        });
        return output;
    }

    tmplFilterColumn(column) {
        let { isVariantOption, entityId, values } = column;
        let output = ``;
        if (isVariantOption) {
            output = `<select class="variant-grid_filter" data-entityid="${entityId}">
                <option value="">Filter</option>
                ${this.tmplFilterOptions(values)}
            </select>`
        }
        return `<div class="variant-grid_cell">${output}</div>`;
    }

    tmplFilterOptions(values) {
        let output = ``;
        values.edges.forEach(({ node }) => {
            output += `<option value="${node.entityId}">${node.label}</option>`;
        });
        return output;
    }

    // Item Templates
    tmplContent(items) {
        return `
        <div class="variant-scroll-frame">
            <div class="variant-grid --content">${this.tmplItems(items)}</div>
            ${tmplGenericPagination(items)}
        </div>`;
    }

    tmplItems(items) {
        let output = ``;
        items.forEach(item => {
            output += `<div data-id="${item.id}" class="variant-grid_row paged-item ${item.qty ? '--added' : ''} ${!item.inventory.isInStock ? '--out-of-stock' : ''}" ${!item.inventory.isInStock ? 'title="Out of stock"' : ''}">${this.tmplItem(item)}</div>`;
        });
        return output;
    }

    tmplItem(item) {
        return `${this.tmplItemColumns(item)}
            <div class="variant-grid_cell --price">${this.tmplItemPrice(item)}</div>
            <div class="variant-grid_cell --qty">
                ${this.tmplItemQty(item)}
            </div>`;
    }
    tmplItemQty(item) {
        if (this.qtyMode === 'input') {
            return this.tmplItemQtyInput(item);
        }
        if (this.qtyMode === 'button') {
            return this.tmplItemQtyButton(item);
        }
    }
    tmplItemQtyInput(item) {
        return `
        <div class="variant-qty" data-qty-box>
            <button type="button" data-action="dec">
                <svg width="11" height="7" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 2L5.5 6L9 2" stroke="#171718" stroke-width="2" stroke-linecap="square" stroke-linejoin="round"></path>
                </svg>
            </button>
            <input type="num" data-id="${item.id}" value="${item.qty}" data-qty>
            <button type="button" data-action="inc">
                <svg width="11" height="7" viewBox="0 0 11 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 5L5.5 1L2 5" stroke="#171718" stroke-width="2" stroke-linecap="square" stroke-linejoin="round"></path>
                </svg>
            </button>
        </div>`;
    }
    tmplItemQtyButton(item) {
        return `
            <button
                class="variant-select"
                type="button"
                data-id="${item.id}"
                data-action="${item.qty > 0 ? 'remove' : 'add'}">
                ${item.qty > 0 ? 'Remove' : 'Add +'}
            </button>
        `;
    }

    canShowPricing() {
        return canShowPricing(this.context);
    }

    tmplItemPrice(item) {
        let output = ``;
        
        if (this.canShowPricing() && item.priceWithTax) {
            output = item.priceWithTax.formatted;
        } else {
            output = `-`;
        }
        return output;
    }

    tmplItemColumns(item) {
        const { columns } = item;
        let output = ``;
        columns.forEach(column => {
            if (typeof column === 'string') {
                output += `<div class="variant-grid_cell">${column}</div>`;
            } else if (typeof column === 'undefined') {
                output += `<div class="variant-grid_cell">...</div>`;
            } else {
                output += `<div class="variant-grid_cell">${this.tmplItemColumnCustom(column, item)}</div>`
            }
        });
        return output;
    }

    tmplItemColumnCustom(column, item) {
        let output = ``;
        switch (column.displayName) {
            case 'Colour':
                output = this.tmplItemColumnColour(column, item);
                break;
        }
        return output;
    }

    tmplItemColumnColour(column, item) {
        const colourEntityId = column.entityId;
        let output = ``;
        output += `<button class="variant-select-colour" type="button" data-item="${item.id}" data-column="${colourEntityId}">${this.tmplItemColumnColourText(column, item)}</button>`;
        output += `
        <div class="colour-modal">
            <div class="colour-modal-content">
                <h2>Select Colour</h2>
                <button type="button" class="colour-modal-close" data-action="close-colour-modal"></button>
                <div class="colour-modal-grid-wrapper">
                    <div class="colour-modal-grid">`

                    column.values.edges.forEach(({ node }) => {
                        const { label, entityId, hexColors, imageUrl } = node;

                        let content = ``;


                        if (imageUrl) {
                            content = `<img src="${imageUrl}">`;
                        } else if (hexColors && hexColors.length) {
                            content = `<div class="color-modal-item-colour-swatch --colours-${hexColors.length}"
                                            style="${hexColors[0] ? `--colour-1:${hexColors[0]};` : ''}
                                                   ${hexColors[1] ? `--colour-2:${hexColors[1]};` : ''}
                                                   ${hexColors[2] ? `--colour-3:${hexColors[2]};` : ''}"></div>`;
                        } else {
                            content = `<img src="${this.context.defaultProductImage}">`;
                        }

                        output += `
                            <button type="button" class="colour-modal-item variant-set-option ${item.opts[colourEntityId] === entityId ? '--active' : ''}"
                                    data-id="${item.id}"
                                    data-option-id="${colourEntityId}"
                                    data-value-id="${entityId}">
                                <div class="colour-modal-item-image">
                                    ${content}
                                </div>
                                <div class="colour-modal-item-name">
                                    ${label}
                                    ${this.tmplModifierPrice(column, node)}
                                </div>
                            </button>`;
                    });

        output += `
                    </div>
                    <button type="button" class="button button--checkout" data-action="close-colour-modal"><span>Apply</span></button>
                </div>
            </div>
        </div>`;
        return output;
    }

    tmplItemColumnColourText(column, item) {
        let output = `Colour`;
        const { entityId } = column;
        const optValue = item.opts[entityId];
        const valIdx = column.values.edges.findIndex(({ node }) => node.entityId === optValue);
        const selectedOption = column.values.edges[valIdx].node;

        if (!selectedOption.isDefault) {
            output = selectedOption.label;
        }

        return output;
    }

    tmplModifierPrice(attribute, option) {
        let output = ``;

        if (attribute.displayName === 'Colour') {
            if (option.label !== 'Highly Polished') {
                output = `(+£0.10)`;
            }
        }

        return output;
    }

    // Utility functions
    setQtyMode(mode = 'input') {
        if (mode === 'button') {
            this.qtyMode = 'button';
            this.qtyLabel = '';
        } else {
            this.qtyMode = 'input';
            this.qtyLabel = 'Qty';
        }
    }
}
class templateVariantsTattoo {}

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

export default function variantsTemplateFactory(type, context) {
    switch (type) {
        case 'tattoo':
            return new templateVariantsTattoo(context);
        break;
        default:
            return new templateVariantsSimple(context);
    }
}
