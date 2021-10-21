export default class RegistrationForm {
  constructor() {
    this._csrf = document.querySelector("input[name='_csrf']").value;
    this.form = document.querySelector("#registration-form");
    this.allFields = document.querySelectorAll(
      "#registration-form .form-control"
    );
    this.insertValidationElements();
    this.username = document.querySelector("#username-register");
    this.username.previousValue = "";
    this.email = document.querySelector("#email-register");
    this.email.previousValue = "";
    this.password = document.querySelector("#password-register");
    this.password.previousValue = "";
    this.email.isUnique = false;
    this.username.isUnique = false;
    this.events();
  }

  events() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.formSubmitHandler();
    });

    this.username.addEventListener("keyup", () => {
      this.isDifferent(this.username, this.usernameHandler.bind(this));
    });

    this.email.addEventListener("keyup", () => {
      this.isDifferent(this.email, this.emailHandler.bind(this));
    });

    this.password.addEventListener("keyup", () => {
      this.isDifferent(this.password, this.passwordHandler.bind(this));
    });

    this.username.addEventListener("blur", () => {
      this.isDifferent(this.username, this.usernameHandler.bind(this));
    });

    this.email.addEventListener("blur", () => {
      this.isDifferent(this.email, this.emailHandler.bind(this));
    });

    this.password.addEventListener("blur", () => {
      this.isDifferent(this.password, this.passwordHandler.bind(this));
    });
  }

  // methods
  isDifferent(el, handler) {
    if (el.previousValue !== el.value) {
      handler();
      el.previousValue = el.value;
    }
  }

  formSubmitHandler() {
    this.passwordAfterDelay();
    if (this.username.errors || this.email.errors) {
      return;
    }

    console.log(this.username.isUnique, this.email.isUnique);
    if (this.username.isUnique && this.email.isUnique) {
      this.form.submit();
    }
  }

  usernameHandler() {
    this.username.errors = false;
    this.usernameImmediately();
    clearTimeout(this.username.timer);
    this.username.timer = setTimeout(() => this.usernameAfterDelay(), 1500);
  }

  emailHandler() {
    this.email.errors = false;
    clearTimeout(this.email.timer);
    this.email.timer = setTimeout(() => this.emailAfterDelay(), 1000);
  }

  passwordHandler() {
    this.password.errors = false;
    this.passwordImmediately();
    clearTimeout(this.password.timer);
    this.password.timer = setTimeout(() => this.passwordAfterDelay(), 1500);
  }

  passwordImmediately() {
    if (this.password.value.length > 50) {
      this.showValidationError(
        this.password,
        "Password cannot exceed 50 characters"
      );
      return;
    }

    this.hideValidationError(this.password);
  }

  passwordAfterDelay() {
    if (this.password.value.length < 12) {
      this.showValidationError(
        this.password,
        "Password must be at least 12 characters"
      );
      return;
    }

    this.hideValidationError(this.password);
  }

  usernameImmediately() {
    if (this.username.value && !/^([a-zA-Z0-9]+)$/.test(this.username.value)) {
      this.showValidationError(
        this.username,
        "username can only contain letters and numbers"
      );
      return;
    }

    if (this.username.value.length > 30) {
      this.showValidationError(
        this.username,
        "username cannot exceed 30 characters."
      );
      return;
    }

    this.hideValidationError(this.username);
  }

  usernameAfterDelay() {
    if (this.username.value.length < 3) {
      this.showValidationError(
        this.username,
        "username cannot be less than 3 characters."
      );
      this.username.errors = true;
      return;
    }

    if (!this.username.errors) {
      fetch("/doesUsernameExist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: this.username.value, _csrf: this._csrf, }),
      })
        .then((response) => {
          return response.json()
        })
        .then((data) => {
          if (data.exists) {
            this.showValidationError(
              this.username,
              "That username is already taken."
            );
            this.username.isUnique = false;
          } else {
            this.username.isUnique = true;
            this.hideValidationError(this.username);
          }
        })
        .catch((err) => {
          console.log(err)
          console.log("Please try again later.");
        });
    }

    this.hideValidationError(this.username);
  }

  emailAfterDelay() {
    if (!/^\S+@\S+\.\S{2,4}$/.test(this.email.value)) {
      this.showValidationError(
        this.email,
        "Please provide a valid email address."
      );
      this.email.errors = true;
      return;
    }

    if (!this.email.errors) {
      fetch("/doesEmailExist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: this.email.value, _csrf: this._csrf, }),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log(data)
          if (data.exists) {
            this.showValidationError(
              this.email,
              "That email is already being used."
            );
            this.email.isUnique = false;
          } else {
            this.email.isUnique = true;
            this.hideValidationError(this.email);
          }
        })
        .catch((err) => {
          console.log(err)
          console.log("Please try again later.");
        });
    }

    this.hideValidationError(this.email);
  }

  showValidationError(el, message) {
    el.nextElementSibling.innerHTML = message;
    el.nextElementSibling.classList.add("liveValidateMessage--visible");
    el.errors = true;
  }

  hideValidationError(el) {
    el.nextElementSibling.innerHTML = "";
    el.nextElementSibling.classList.remove("liveValidateMessage--visible");
    el.errors = false;
  }

  insertValidationElements() {
    this.allFields.forEach((el) => {
      el.insertAdjacentHTML(
        "afterend",
        '<div class="alert alert-danger small liveValidateMessage"></div>'
      );
    });
  }
}
