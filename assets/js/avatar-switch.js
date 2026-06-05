document.addEventListener('DOMContentLoaded', function () {
  var avatarSwitch = document.querySelector('.avatar-switch');
  if (!avatarSwitch) return;

  function toggleAvatar() {
    avatarSwitch.classList.toggle('is-real');
  }

  avatarSwitch.addEventListener('click', toggleAvatar);
  avatarSwitch.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleAvatar();
    }
  });
});
