document.addEventListener('DOMContentLoaded', () => {
  const sections = document.querySelectorAll('.checkup');
  if (!sections.length) return;

  const io = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');   // запустили анимации
        observer.unobserve(entry.target);        // один раз; убери строку — если нужно каждый раз
      }
    });
  }, {
    root: null,
    threshold: 0.15   // достаточно 15% площади в вьюпорте, чтобы считать «видимой»
  });

  sections.forEach(sec => io.observe(sec));
});