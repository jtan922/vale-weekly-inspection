// Simple current datetime injection
function updateDateTime() {
  const now = new Date();
  const options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  document.getElementById('currentDateTime').textContent = now.toLocaleDateString('en-US', options);
}
updateDateTime();// Initialize current date/time
// (Truncated here for brevity)
// Place your full JS content here from your previous message
