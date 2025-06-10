const userTypeInputs = document.querySelectorAll('input[name="userType"]');
const userTypeDiv = document.querySelector('.user-type');

// Create the phone number div element
const phoneDiv = document.createElement('div');
phoneDiv.className = 'mb-3';
phoneDiv.innerHTML = `
        <label class="form-label">Phone Number</label>
        <input type="tel" name="phone" class="form-control" autocomplete="off" required>
    `;

userTypeInputs.forEach(input => {
    input.addEventListener('change', () => {
        if (input.value === 'managers' && input.checked) {
            // Insert the phone field if not already inserted
            if (!document.querySelector('input[name="phone"]')) {
                userTypeDiv.parentNode.insertBefore(phoneDiv, userTypeDiv);
            }
        } else if (input.value === 'users' && input.checked) {
            // Remove the phone field if switching back to guest
            const existingPhone = document.querySelector('input[name="phone"]');
            if (existingPhone) {
                existingPhone.parentNode.remove();
            }
        }
    });
});
