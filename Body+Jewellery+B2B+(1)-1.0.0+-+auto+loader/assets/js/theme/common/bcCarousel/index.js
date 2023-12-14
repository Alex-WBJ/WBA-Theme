export default function() {
    let interval;

    window.onload = (e) => {
        if(document.querySelector('body').classList.contains('page_title__jewellery') && !document.referrer.includes('/manage/page-builder')) {
            changeSlide();
        }
    }

    const changeSlide = () => {
        const bcCarousel = document.querySelector('[class*="bc-carousel-container"]');
        const carouselRightArrow = bcCarousel?.querySelector('[data-test-id="carousel-right-arrow"]');
        const carouselLeftArrow = bcCarousel?.querySelector('[data-test-id="carousel-left-arrow"]');

        if(!bcCarousel && !carouselRightArrow && !carouselLeftArrow) return;

        // set initial interval to stimulate click every 5s
        if(!interval) {
            interval = setInterval(nextSlide, 5000, carouselRightArrow);
        }

        // reset and restart interval on manual click
        carouselLeftArrow.addEventListener('click', () => resetAndRestart(carouselRightArrow));
        carouselRightArrow.addEventListener('click', () => resetAndRestart(carouselRightArrow));
    }

    const nextSlide = (button) => {
        button.click();
    }

    const resetAndRestart = (carouselRightArrow) => {
        if(interval) {
            clearInterval(interval);
        }

        interval = setInterval(nextSlide, 5000, carouselRightArrow);
    }
}
