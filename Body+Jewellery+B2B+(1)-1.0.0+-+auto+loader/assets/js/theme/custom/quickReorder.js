export default function async (context) {
    const reorderBanner = document.querySelector('.reorder-cta.--user');
    if(!reorderBanner) return;

    reorderBanner.addEventListener('click', (event) => {
        event.preventDefault();

        const orders = JSON.parse(reorderBanner.dataset.orders) ?? [];

        if(!orders) return;

        const lastOrder = orders?.at(-1);
        const orderId = parseInt(lastOrder?.id, 0);

        if(!orderId) return;

        window.location.href = `/account.php?action=view_order&order_id=${orderId}`;
    });
}
