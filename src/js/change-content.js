document.querySelectorAll('.item__icon').forEach(btn => {
  btn.addEventListener('touchstart', () => {
    btn.closest('.item').classList.toggle('touch');
  });
});
