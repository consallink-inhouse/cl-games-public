document.body.classList.add('fade-in');

document.querySelectorAll('div[onclick]').forEach(item => {
    item.addEventListener('click', function (e) {
        e.preventDefault();
        const target = this.getAttribute('onclick').replace("location.href=", "").replace(/['"]/g, "");
        document.body.classList.remove('fade-in');
        document.body.classList.add('fade-out');
        setTimeout(() => {
            window.location.href = target;
        }, 500);
    });
});
