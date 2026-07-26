// Confirms before submitting any form marked data-confirm-delete (the per-artwork delete
// buttons in the admin dashboard). No-op on pages without one.
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-confirm-delete]').forEach((form) => {
    form.addEventListener('submit', (e) => {
      if (!window.confirm('Delete this artwork? This cannot be undone.')) {
        e.preventDefault();
      }
    });
  });
});
