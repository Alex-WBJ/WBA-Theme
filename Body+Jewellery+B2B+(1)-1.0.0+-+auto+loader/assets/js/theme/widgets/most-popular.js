export default function () {
    const $mostPopular = $('#mostPopular');
    if (window.top != window.self) {
        // In a Frame or IFrame
        $mostPopular.css('position', 'relative');
        $mostPopular.css('visibility', 'visible');
        $mostPopular.css('opacity', '1');
    }
}
