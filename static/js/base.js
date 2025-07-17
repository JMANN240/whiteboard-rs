const touch = matchMedia('(hover: none)').matches;

const hasModal = document.querySelector('#modal-options > *').length != 0;

const modal = document.querySelector('.modal');

document.body.style.height = `${window.innerHeight}px`;

document.addEventListener("keydown", (e) => {
    if (e.code == "Space" && hasModal && !modal.classList.contains('visible')) {
        e.preventDefault();
        modal.classList.add('visible');
    } else if (e.code == "Escape" && hasModal && modal.classList.contains('visible')) {
        e.preventDefault();
        modal.classList.remove('visible');
	}
});

document.addEventListener('click', (e) => {
    if (e.target == modal) {
        modal.classList.remove('visible');
    }
});

document.addEventListener('tap', (e) => {
    if (e.detail.fingeredness == 2 && e.detail.multiplicity == 1) {
        modal.classList.add('visible');
    } else if (e.detail.fingeredness == 1 && e.detail.target == modal) {
        modal.classList.remove('visible');
    }
});