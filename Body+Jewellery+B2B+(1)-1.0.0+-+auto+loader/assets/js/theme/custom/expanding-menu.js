export default function expandingMenu(context) {
    function buildMenu(category, level = 0) {
        let output = ``;
        let listOutput = ``;
        let childOutput = ``;

        if (category.children) {
            listOutput = `<div class="navPages-expandingNav-list" data-level="${level}" data-category="${category.id}">
                <h2>${level === 0 ? 'By product' : category.name}</h2>
                <ul>`;
            category.children.forEach(cat => {
                let attrShow = '';
                if (cat.children) {
                    attrShow = `data-show="${cat.id}"`;
                    childOutput += buildMenu(cat, level + 1);
                }
                listOutput += `<li><a href="${cat.url}" data-level="${level}" ${attrShow}>${cat.name}</a></li>`;
            });
            listOutput += `</ul></div>`;

            output += listOutput;
            output += childOutput;
        }

        return output;

    }

    function clearClass(elContainer, className) {
        const els = elContainer.querySelectorAll(`.${className}`);
        for (let i = 0, l = els.length; i < l; i++) {
            els[i].classList.remove(className);
        }
    }

    const listItems = document.querySelectorAll('[data-depth="1"]');
    const listSubMenus = document.querySelectorAll('[data-depth="2"]');

    if(!listItems && !listSubMenus) return;

    listItems.forEach(el => {
        if(el.querySelector('[data-depth="2"]')) {
            el.addEventListener('mouseenter', (e) => {
                const childContainer = el.querySelector('[data-depth="2"]');
    
                listSubMenus.forEach(el => {
                    if(el.classList.contains('active')) {
                        el.classList.remove('active');
                    }
                });

                const container = el.closest('.navPage-subMenu-item').getBoundingClientRect();
                const currEl = el.getBoundingClientRect();

                const posY = currEl.top - container.top;
                childContainer.style["top"] = posY - 55 + "px";
            });
        }
    })

    // context.categories.forEach(category => {
    //     const elFrame = document.createElement('div');
    //     elFrame.classList.add('navPages-expandingNav')

    //     let htmlOutput = ``;

    //     // Build the top level of the categories navigation
    //     htmlOutput += buildMenu(category);

    //     elFrame.innerHTML = htmlOutput;

    //     // Add to the appropriate container
    //     // Debug add all to the elExpandingMenu...
    //     const elOutput = document.querySelector(`[data-expanding-menu="${category.id}"]`);
    //     if (elOutput) {
    //         elOutput.appendChild(elFrame);
    //     }

    //     // Handle functionality...
    //     const arrActive = [];

    //     $(elFrame)
    //         .on('click', '[data-show]', event => {
    //             event.preventDefault();
    //             const { show, level } = event.currentTarget.dataset;
    //             arrActive[level] = show;
    //             arrActive.length = parseInt(level, 10) + 1;

    //             // Move to a separate refresh function/event?
    //             // Hide lists / clear styles
    //             clearClass(elFrame, '--show');
    //             clearClass(elFrame, '--active');

    //             arrActive.forEach(item => {
    //                 const elUl = elFrame.querySelector(`.navPages-expandingNav-list[data-category="${item}"]`);
    //                 if (elUl) {
    //                     elUl.classList.add('--show');
    //                 }

    //                 const elA = elFrame.querySelector(`a[data-show="${item}"]`);
    //                 if (elA) {
    //                     elA.classList.add('--active');
    //                 }
    //             });
    //         })
    // });
}
