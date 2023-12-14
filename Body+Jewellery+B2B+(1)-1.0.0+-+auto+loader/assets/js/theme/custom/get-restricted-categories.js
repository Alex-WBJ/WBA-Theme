let restrictedCategories = null;
export default function () {
    if (restrictedCategories !== null) {
        return new Promise(resolve => resolve(restrictedCategories));
    }
    return fetch('/content/config.json')
        .then(resp => resp.json())
        .then(resp => {
            restrictedCategories = resp?.restrictedCategories;
            return restrictedCategories;
        })
        .catch(err => console.error(err));
}
