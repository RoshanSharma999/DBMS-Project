document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('bookingForm');
    const fromDateInput = document.getElementById('fromDate');
    const toDateInput = document.getElementById('toDate');
    const today = new Date().toISOString().split('T')[0];
    fromDateInput.setAttribute('min', today);
    fromDateInput.addEventListener('change', function() {
        toDateInput.setAttribute('min', this.value);
    });
    
    form.addEventListener('submit', function(event) {
        form.classList.add('was-validated');
        
        let isValid = true;
        const fromDate = new Date(fromDateInput.value);
        const toDate = new Date(toDateInput.value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (fromDate < today) {
            fromDateInput.classList.add('is-invalid');
            isValid = false;
        } else {
            fromDateInput.classList.remove('is-invalid');
        }
        if (toDate < fromDate) {
            toDateInput.classList.add('is-invalid');
            isValid = false;
        } else {
            toDateInput.classList.remove('is-invalid');
        }
        
        if (!isValid) {
            event.preventDefault();
            event.stopPropagation();
        }
    });
});
