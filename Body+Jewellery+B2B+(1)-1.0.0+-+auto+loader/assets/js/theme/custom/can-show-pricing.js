export default function(context) {
    if (!window.productPageDetails) return true;
    const { isLoggedIn, categories } = window.productPageDetails;
    if (isLoggedIn) return true;

    let arrFlatCategories = [];

    // Get the actual categories from the path names
    categories.forEach(category => {
        arrFlatCategories = [...arrFlatCategories, ...category.split('/')];
    });
    
    // Remove dupes
    arrFlatCategories = arrFlatCategories.filter((value, index, array) => array.indexOf(value) === index);

    // Are there any matches with restricted categories
    let arrFiltered = arrFlatCategories.filter(cat => context.restrictedCategories.includes(cat));
    if (arrFiltered.length === 0) return true;

    return false;
}
