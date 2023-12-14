import 'focus-within-polyfill';

import './global/jquery-migrate';
import './common/select-option-plugin';
import PageManager from './page-manager';
import quickSearch from './global/quick-search';
import currencySelector from './global/currency-selector';
import mobileMenuToggle from './global/mobile-menu-toggle';
import menu from './global/menu';
import foundation from './global/foundation';
import quickView from './global/quick-view';
import cartPreview from './global/cart-preview';
import privacyCookieNotification from './global/cookieNotification';
import carousel from './common/carousel';
import bcCarousel from './common/bcCarousel';
import svgInjector from './global/svg-injector';
import utils from '@bigcommerce/stencil-utils';
import mostPopular from './widgets/most-popular';
import Messages from './custom/message';
import wishlist from './product/wishlist';
import restrictedCategories from './custom/restricted-categories';
import quickReorder from './custom/quickReorder';
import mostPopularProducts from './custom/most-popular-products';
import expandingMenu from './custom/expanding-menu';

export default class Global extends PageManager {
    onReady() {
        const { cartId, secureBaseUrl } = this.context;
        cartPreview(secureBaseUrl, cartId);
        quickSearch();
        currencySelector(cartId);
        foundation($(document));
        quickView(this.context);
        carousel(this.context);
        menu();
        mobileMenuToggle();
        privacyCookieNotification();
        svgInjector();
        mostPopular();
        quickReorder(this.context);
        mostPopularProducts(this.context);
        expandingMenu(this.context);
        this.hideNavElements();
        this.moveTrustpilot();

        // Mobile Nav
        $('.navPages')
            .each((idx, el) => {
                const classIsOpen = '__is-open';
                const _el = $(el);

                _el
                    .on('click', '.has-subMenu', event => {
                        const mq = window.matchMedia('( max-width: 800px )');
                        if (mq.matches) {
                            event.preventDefault();

                            if(event.target.classList.contains('navPages-action-text')) {
                                if(event.target.parentElement.href) {
                                    location.href = event.target.parentElement.href;
                                } else {
                                    location.href = event.target.href;
                                }
                            } else {
                                event.currentTarget.classList.add(classIsOpen);                                
                            }

                        }

                        _el.trigger('checkState');
                    })
                    .on('click', '.navPages-title--mobile', event => {
                        const elnavAction = document.querySelector(`[data-navid="${event.currentTarget.dataset.navid}"]`);
                        if (elnavAction)
                        {
                            elnavAction.classList.remove(classIsOpen);
                        }

                        _el.trigger('checkState');
                    })
                    .on('click', '.navPages-mobileClose', () => {
                        $('[data-mobile-menu-toggle]').data('mobileMenuToggleInstance').hide();
                    })
                    .on('checkState', () => {
                        if (el.querySelector(`.${classIsOpen}`)) {
                            el.classList.add('__no-scroll');
                        } else {
                            el.classList.remove('__no-scroll');
                        }
                    });
            });

            // some button clicks dont work on ios unless it's an <a> tag or said <button> has empty "onClick()" event inline... 3 cheers for apple being *****!
            $('.navPages-mobileClose').on('click touch', () => {
                $('[data-mobile-menu-toggle]').data('mobileMenuToggleInstance').hide();
            });

        /* BundleB2B */
        const $body = $('body');
        const B3StorefrontURL = 'https://cdn.bundleb2b.net/b3-auto-loader.js';
        $body.append(`<script src="${B3StorefrontURL}"></script>`);
        window.b3themeConfig = window.b3themeConfig || {};
        window.b3themeConfig.useJavaScript = {
            login: {
                callback(instance) {
                    const {
                        context: {
                            inDevelopment,
                        },
                        isB2BUser,
                    } = instance;

                    if (inDevelopment) {
                        console.log(instance.name, instance);
                    }

                    const showBCOrdersContent = () => {
                        const style = `
                            <style>
                                .page_type__account_orderstatus .body .container .account {
                                    display: block !important;
                                }
                            </style>
                        `;
                        $('head').append(style);
                    };

                    if (!isB2BUser) {
                        showBCOrdersContent();
                    }
                },
            },
            orders: {
                callback(instance) {
                    const {
                        context: {
                            inDevelopment,
                        },
                        isB2BUser,
                    } = instance;

                    if (inDevelopment) {
                        console.log(instance.name, instance);
                    }

                    const fixClasslist = () => {
                        $('.order-lists-wrap').addClass('account');
                    };

                    const showB3OrdersContent = () => {
                        const style = `
                            <style>
                                .page_type__account_orderstatus .body .container .order-lists-wrap {
                                    display: block !important;
                                }
                            </style>
                        `;
                        $('head').append(style);
                    };

                    if (isB2BUser) {
                        fixClasslist();
                        showB3OrdersContent();
                    }
                },
            },
        };
        /* BundleB2B */

        this.setupFooter();
        this.setupCartPreview();
        this.setupCategoryBlocks();
        this.setupToggle();

        $(window)
            .on('content-updated', event => {
                this.setupToggle(event.target);
            });

        this.setupWishlist();
        this.setupTimeAgo();
        this.setupSelectNav();
        this.onNavHover();

        const messages = new Messages(this.context);
        messages.init();


        $(document.body)
            .on('click', '[data-tooltip]', event => {
                const el = event.currentTarget;
                const { tooltip } = el.dataset;
                const elTooltip = document.getElementById(tooltip);
                elTooltip.classList.toggle('--show');

                elTooltip.style.setProperty('--tooltip-top', `${el.offsetTop}px`);
                elTooltip.style.setProperty('--tooltip-left', `${el.offsetLeft + (el.offsetWidth / 2)}px`);
            });

        $('#complex-summary')
            .each((index, el) => {
                $('.complex-summary-toggle')
                    .on('click', () => {
                        el.classList.toggle('--expanded');
                    });
            });

        restrictedCategories(this.context);

        window.addEventListener('widgetRefresh', () => {
            console.info('Widget has been updated.');
            const evtRunSlick = new Event('runSlick');
            window.dispatchEvent(evtRunSlick);
        });
    }

    setupFooter() {
        const elFooterAccordions = document.querySelector('.footer-row.--accordions');

        if (elFooterAccordions) {
            elFooterAccordions.addEventListener('click', event => {
                if (event.target.matches('.footer-accordion-title'))
                {
                    event.target.parentElement.classList.toggle('--is-expanded');
                }
            });
        }
    }

    setupCartPreview() {
        const elCartPreview = document.getElementById('cart-preview-wrapper');

        $('[data-cart-preview]')
            .on('click', () => {
                elCartPreview.classList.toggle('--show');
                document?.querySelector('.header-logo__link')?.classList.add('lowerIdx');
            });

        $(elCartPreview)
            .on('click', '.previewCart-close', () => {
                elCartPreview.classList.toggle('--show');
                document?.querySelector('.header-logo__link')?.classList.remove('lowerIdx');
            });

    }

    setupCategoryBlocks() {
        const elCategoryBlocks = document.querySelector('.category-blocks');

        if (elCategoryBlocks) {
            const opts = {
                root: elCategoryBlocks,
                rootMargin: '0px',
                threshold: 0.7,
            };

            const observer = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('--visible');
                    } else {
                        entry.target.classList.remove('--visible');
                    }
                });
            }, opts);

            const elItems = elCategoryBlocks.querySelectorAll('.category-blocks_link');

            for (let i = 0, l = elItems.length; i < l; i++)
            {
                observer.observe(elItems[i]);

            }
        }
    }

    setupToggleInstance(el) {
        const defaultConfig = {
            class: '--toggle',
            target: false,
            off: false
        };

        let config;

        try {
            config = {...config, ...JSON.parse(el.dataset.toggle)};
        } catch(e) {
            config = {...defaultConfig };

            if (el.dataset.toggle) {
                config.class = el.dataset.toggle;
            }
        }

        const elTarget = config.target ? document.querySelector(config.target) : event.currentTarget;

        el.addEventListener('click', event => {
            event.stopPropagation();
            elTarget.classList.toggle(config.class);
        });

        const elOff = config.off ? document.querySelector(config.off) : false;

        if (elOff) {
            document.body.addEventListener('click', event => {
                if (!event.target.closest(config.off)
                    && event.target !== el) {
                    elTarget.classList.remove(config.class)
                }
            });
        }
    }

    setupToggle(root = document) {
        const elToggles = root.querySelectorAll('[data-toggle]');

        for (let i = 0, l = elToggles.length; i < l; i++)
        {
            this.setupToggleInstance(elToggles[i]);
        }
    }

    setupWishlist() {
        // Actions
        // Login
        // login.php
        // New wishlist w/item:
        // wishlist.php?action=addwishlist&product_id=X
        // Add item to existing wishlist:
        // /wishlist.php?action=add&wishlistid=X&product_id=X
        let wishlistAction = 'login';

        fetch('/graphql', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.jsContext.settings.storefront_api.token}`
            },
            body: JSON.stringify({
                query:
                    `query wishlist {
                        customer {
                            wishlists {
                                edges {
                                    node {
                                        name
                                        entityId
                                        items {
                                            edges {
                                                node {
                                                    product {
                                                        id,
                                                        entityId
                                                    }
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
        .then(dataObj => {
            const data = dataObj.data;

            if (!data.customer) {
                wishlistAction = 'login';
                return true;
            }

            if (!data.customer.wishlists
                || !data.customer.wishlists.edges
                || data.customer.wishlists.edges.length === 0)
            {
                wishlistAction = 'toggle';
                return true;
            }

            wishlistAction = 'toggle';

            let htmlWishlists = ``;

            data.customer.wishlists.edges.forEach(wishlist => {
                htmlWishlists += `<li><a class="js-add-to-wishlist" data-wishlist-id="${wishlist.node.entityId}" data-product-id>${wishlist.node.name}</a></li>`;
                wishlist.node.items.edges.forEach(item => {
                    const els = document.querySelectorAll(`.card-product[data-product="card-${item.node.product.entityId}"]`);
                    for (let i = 0, l = els.length; i < l; i++)
                    {
                        els[i].classList.add('--in-wishlist');
                    }
                })
            });

            const elWishlistLists = document.querySelectorAll('.card-wishlist ul');

            for (let i = 0, l = elWishlistLists.length; i < l; i++)
            {
                elWishlistLists[i].innerHTML = htmlWishlists + elWishlistLists[i].innerHTML;
                const closestCard = elWishlistLists[i].closest('.card');
                let elDataAttr = elWishlistLists[i].querySelectorAll('[data-product-id]');

                elDataAttr.forEach(el => {
                    el.dataset.productId = closestCard.dataset.productId;
                })
            }
        }).then(() => {
            wishlist(this.context);
        }) // will log JSON result to browser console
        .catch(error => console.error(error));

        $('.js-wishlist')
            .on('click', event => {
                switch(wishlistAction)
                {
                    case 'login':
                        window.location = '/login.php';
                        break;
                    case 'toggle':
                        event.currentTarget.classList.toggle('--open');
                        break;
                }
            });
    }

    timeSinceSector(interval, single, plural) {
        const i = Math.floor(interval);
        let text = single;
        if (i > 1) {
            text = plural;
        }
        return `${i} ${text}`;
    }

    timeSince(date) {
        var seconds = Math.floor((new Date() - date) / 1000);
        var interval = seconds / 31536000;

        if (interval > 1) {
            return this.timeSinceSector(interval, 'year', 'years');
        }

        interval = seconds / 2592000;
        if (interval > 1) {
            return this.timeSinceSector(interval, 'month', 'months');
        }

        interval = seconds / 86400;
        if (interval > 1) {
            return this.timeSinceSector(interval, 'day', 'days');
        }

        interval = seconds / 3600;
        if (interval > 1) {
            return this.timeSinceSector(interval, 'hour', 'hours');
        }

        interval = seconds / 60;
        if (interval > 1) {
            return this.timeSinceSector(interval, 'minute', 'minutes');
        }

        return this.timeSinceSector(interval, 'second', 'seconds');
      }

    setupTimeAgo() {
        const els = document.querySelectorAll('[data-time-ago]');

        $(els)
            .each((index, el) => {
                const d = new Date(el.dataset.timeAgo);
                el.textContent = this.timeSince(d) + ' ago';
            });
    }

    setupSelectNav() {
        const els = document.querySelectorAll('[data-nav-select]');

        for (var i = 0, l = els.length; i < l; i++) {
            const el = els[i];
            el.addEventListener('change', () => {
                window.location = el.value;
            });
        }
    }

    onNavHover() {
        const menuWrapper = document.querySelector('.header-menu');

        if(!menuWrapper) return;

        const isDesktop = window.matchMedia('(min-width: 801px)').matches;

        const addOpacity = () => {
            document.querySelector('.body').style.opacity = "0.3";
        }

        const removeOpacity = () => {
            document.querySelector('.body').style.opacity = "1";
        }

        const initMenuOverlay = (menuWrapper) => {
            menuWrapper.addEventListener('mouseover', addOpacity);
            menuWrapper.addEventListener('mouseleave', removeOpacity);
        }

        const removeMenuOverlay = (menuWrapper) => {
            menuWrapper.removeEventListener('mouseover', addOpacity);
            menuWrapper.removeEventListener('mouseleave', removeOpacity);
        }
        
        if(isDesktop) {
            initMenuOverlay(menuWrapper);
        }

        window.addEventListener('resize', () => {
            if(window.innerWidth < 801) {
                removeMenuOverlay(menuWrapper);
            } else {
                initMenuOverlay(menuWrapper);
            }
        });
    }

    async hideNavElements() {
        const navList = document.querySelector('.navPages-list');
        const request = await fetch('/content/nav-links.json');
        const response = await request.json();

        if(!request) return;

        const jewellery = response.jewellery.map(elements => elements.toLowerCase());
        const tattoo = response.tattoo.map(elements => elements.toLowerCase());
        const home = response.home.map(elements => elements.toLowerCase());

        if(!navList || !jewellery || !tattoo || !home) return;

        const updateNav = (type, arr, signPost = false) => {
          const signpost = document.querySelector('.landing-signposts');
          const hasSubMenu = navList.querySelectorAll('.navPages-item') ?? '';
          const noSubMenu = navList.querySelectorAll('.navPages-item-page') ?? '';

          if(signPost) {
            signpost.classList.add(type);
          }

          hasSubMenu.forEach(el => {
              const title = el.querySelector('.navPages-action-text');

              if(title) {
                  checkTitle(el, arr, title);
              }
          });

          if(noSubMenu) {
              noSubMenu.forEach(el => {
                  const title = el.querySelector('.navPages-action');

                  if(title) {
                      checkTitle(el, arr, title);
                  }
              });
            }

            navList.style.opacity = 1;
        }

        const checkTitle = (el, arr, title) => {
            if(arr.includes(title.textContent.trim().toLowerCase())) {
                el.classList.add('hidden');
            }
        }

        for(const [key, value] of Object.entries(response)) {
            const urls = value.map(elements => elements.toLowerCase());
            const currLoc = location.pathname.split('/').at(1);

            if(location.pathname === '/tattoo/' && key === 'tattoo') {
                updateNav('tattoo', tattoo, true);
            } else if(location.pathname === '/jewellery/' && key === 'jewellery') {
                updateNav('jewellery', jewellery, true);
            } else if(location.pathname === '/' && key === 'home') {
                updateNav('home', home, false);
            } else if(currLoc === `${key}`) {
                updateNav(key, urls, false);
            } else {
                navList.style.opacity = 1;
            }
        }
    }

    moveTrustpilot() {
        const tpWidgetRegion = document.querySelector('.trustpilot-widget-wrapper');
        const embassador = document.querySelectorAll('.ambassador');

        if(!tpWidgetRegion || !embassador) return; 

        const lastEl = embassador.length > 1 ? embassador[embassador.length-1] : embassador[0];
        lastEl.insertAdjacentElement('beforebegin', tpWidgetRegion);
    }
}
