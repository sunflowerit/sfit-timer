// This is a custom library for handling message notifications
var alertAwesome = (function () {
  let resolvePromise;
  let modalStack = [];
  return {
    options: {
      title: "Notification",
      message: "You need to design you custom message. html code allowed",
      buttons: [
        { text: "OK", value: "ok", color: "#28a745" },
        { text: "Cancel", value: "cancel", color: "#dc3545" },
      ]
    },

    showCustomAlert: function (title, message, buttons) {
      // Set defaults
      if (!buttons) buttons = alertAwesome.options.buttons;
      if (!title) title = alertAwesome.options.title;
      if (!title) message = alertAwesome.options.message;

      const modal = document.createElement("div");
      modal.id = "customAlert";
      modal.classList.add("modal");

      const modalContent = document.createElement("div");
      modalContent.classList.add("modal-content");

      const titleElement = document.createElement("h2");
      titleElement.id = "alertTitle";
      titleElement.textContent = title || "Alert";
      modalContent.appendChild(titleElement);

      const messageElement = document.createElement("div");
      messageElement.id = "alertMessage";
      // original regex = /^<.*>$/
      // find html <> tags in string
      if (/<[^>]+>/.test(message)) {
        messageElement.innerHTML = message;
      } else {
        messageElement.textContent = message;
      }

      modalContent.appendChild(messageElement);

      const buttonsElement = document.createElement("div");
      buttonsElement.classList.add("modal-buttons");

      buttons.forEach((button) => {
        const buttonElement = document.createElement("button");
        buttonElement.textContent = button.text;
        buttonElement.style.backgroundColor = button.color || "#4CAF50";
        buttonElement.addEventListener("click", () =>
          alertAwesome.handleButtonClick(button.value)
        );
        buttonsElement.appendChild(buttonElement);
      });

      modalContent.appendChild(buttonsElement);
      modal.appendChild(modalContent);

      document.body.appendChild(modal);

      modal.style.display = "flex";
      modalStack.push(modal); // Push the modal to the stack
    },

    hideCustomAlert: function () {
      const modal = modalStack.pop(); // Pop the modal from the stack
      modal.style.display = "none";
    },

    handleButtonClick: function (value) {
      resolvePromise(value);
      alertAwesome.hideCustomAlert();
    },

    show: function (title, message, buttons) {
      return new Promise((resolve) => {
        alertAwesome.showCustomAlert(title, message, buttons);
        resolvePromise = resolve;
      });
    },
  };
})();

// Example to test with
async function showAlert() {
  const buttons = [
    { text: "OK", value: "ok", color: "#4CAF50" },
    { text: "Cancel", value: "cancel", color: "#f44336" },
  ];

  alertAwesome
    .show(
      "Custom Title",
      '<form><label for="input">Enter something:</label><input type="text" id="input" name="input"></form>',
      buttons
    )
    .then((result) => {
      if (result === "ok") {
        const userInput = document.getElementById("input").value;
        alertAwesome.show("User entered", userInput);
      } else if (result === "cancel") {
        alertAwesome.show("Cancelled", "User clicked Cancel");
      }
    });
}
