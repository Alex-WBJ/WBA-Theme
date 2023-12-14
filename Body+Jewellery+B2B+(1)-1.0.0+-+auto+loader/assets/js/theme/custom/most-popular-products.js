import { getProductsByCategoryId } from "./graphql/get-products";

export default function(context) {
    getProductsByCategoryId(1295, context)
        .then(data => {
            if(!data.length) return;
            
            let output = ``;

            data.forEach(({ node }) => {
                output += `<a title="${node.name}" href="${node.path}"><img src="${node.defaultImage.url}"><span>${node.name}</span></a>`;
            });

            const elPopularListing = document.querySelectorAll('[data-popular-products]');

            for (let i = 0, l = elPopularListing.length; i < l; i++) {
                const el = elPopularListing[i];
                el.innerHTML = output;
            }

            const sectionTitle = document.querySelectorAll('.navPage-popular .wrap');

            if(!sectionTitle) return;

            sectionTitle.forEach(title => title.classList.remove('hidden'));
        });
}
