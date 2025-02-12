document.addEventListener("DOMContentLoaded", function () {
  function openInBrowser(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const url = button.getAttribute("nextstream-data-url");

    try {
      window.location.href = url;
    } catch (e) {
      window.open(url, "_blank");
    }
  }

  function showOpenButton() {
    const button = document.getElementById("open-browser-btn");
    if (button) {
      button.style.display = "block";
      button.removeEventListener("click", openInBrowser);
      button.addEventListener("click", openInBrowser);
    }
  }

  showOpenButton();
});