document.addEventListener('DOMContentLoaded', function() {
    const reviewButton = document.getElementById('review-button');
    const ratingField = document.getElementById('rating-field');
    const commentField = document.getElementById('comment-field');
    const form = document.getElementById('review-form');
    let isFormVisible = false;

    reviewButton.addEventListener('click', function() {
        if (!isFormVisible) {
            ratingField.style.display = 'block';
            commentField.style.display = 'block';
            reviewButton.textContent = 'Submit Review';
            reviewButton.type = 'submit'; 
            isFormVisible = true;
        }
    });
    // document.addEventListener('click', function(e) {
    //     if (isFormVisible && !form.contains(e.target) && e.target !== reviewButton) {
    //         ratingField.style.display = 'none';
    //         commentField.style.display = 'none';
    //         reviewButton.textContent = 'Add a review';
    //         reviewButton.type = 'button';
    //         isFormVisible = false;
    //     }
    // });
});
