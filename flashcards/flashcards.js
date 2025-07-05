document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('file-input');
  const flashcardView = document.getElementById('flashcard-view');
  const cardFront = document.getElementById('card-front');
  const cardBack = document.getElementById('card-back');
  const prevButton = document.getElementById('prev-card');
  const nextButton = document.getElementById('next-card');
  const shuffleButton = document.getElementById('shuffle-cards');
  const cardCounter = document.getElementById('card-counter');
  const flashcard = document.getElementById('flashcard');

  let cards = [];
  let currentIndex = 0;

  fileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          cards = JSON.parse(e.target.result);
          if (cards.length > 0) {
            document.querySelector('.file-loader').classList.add('hidden');
            flashcardView.classList.remove('hidden');
            currentIndex = 0;
            displayCard();
          }
        } catch (error) {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  });

  function displayCard() {
    if (cards.length === 0) return;

    const card = cards[currentIndex];
    cardFront.textContent = card.question;
    cardBack.textContent = card.answer;

    flashcard.classList.remove('is-flipped');
    updateCounter();
    updateNavButtons();
  }

  function flipCard() {
    if (cards.length === 0) return;
    flashcard.classList.toggle('is-flipped');
  }

  function shuffleCards() {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    currentIndex = 0;
    displayCard();
  }

  function updateCounter() {
    cardCounter.textContent = `${currentIndex + 1} / ${cards.length}`;
  }

  function updateNavButtons() {
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === cards.length - 1;
  }

  flashcard.addEventListener('click', flipCard);
  shuffleButton.addEventListener('click', shuffleCards);

  prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      displayCard();
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentIndex < cards.length - 1) {
      currentIndex++;
      displayCard();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (cards.length === 0) return;

    if (e.key === 'ArrowRight') {
      nextButton.click();
    } else if (e.key === 'ArrowLeft') {
      prevButton.click();
    } else if (e.key === ' ') {
      e.preventDefault(); // Prevent scrolling
      flipCard();
    }
  });
});
