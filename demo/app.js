function filterBooks() {
  const query = document.querySelector('input').value;
  document.querySelector('#results').textContent = `Searching for ${query}`;
}

function showResults() {
  filterBooks();
}
