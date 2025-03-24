document.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function(event) {
        const targetId = this.getAttribute('href');
        if (targetId.startsWith('#')) {
            event.preventDefault();
            document.querySelector(targetId).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});
