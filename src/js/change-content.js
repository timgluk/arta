document.querySelectorAll('.item__icon').forEach(btn => {
  btn.addEventListener('touchstart', () => {
    btn.closest('.item').classList.add('touch');
  });

  btn.addEventListener('touchend', () => {
    btn.closest('.item').classList.remove('touch');
  });
});
ы