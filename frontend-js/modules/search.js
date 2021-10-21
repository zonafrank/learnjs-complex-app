import DOMPurify from "dompurify";

class Search {
  // 1. Select DOM elements and keep track of any useful data
  constructor() {
    this._csrf = document.querySelector("input[name='_csrf']").value;
    this.injectHTML();
    this.inputField = document.querySelector("#live-search-field");
    this.headerSearchIcon = document.querySelector(".header-search-icon");
    this.overlay = document.querySelector(".search-overlay");
    this.closeIcon = document.querySelector(".close-live-search");
    this.resultsArea = document.querySelector(".live-search-results");
    this.loaderIcon = document.querySelector(".circle-loader");
    this.typingWaitTimer;
    this.previousValue = "";
    this.events();
  }

  //2. Events
  events() {
    this.inputField.addEventListener("keyup", () => {
      this.keyPressHandler();
    });

    this.closeIcon.addEventListener("click", () => {
      this.closeOverlay();
    });

    this.headerSearchIcon.addEventListener("click", (e) => {
      e.preventDefault();
      this.openOverlay();
      setTimeout(() => this.inputField.focus(), 100);
    });
  }

  //3. Methods
  showLoaderIcon() {
    this.loaderIcon.classList.add("circle-loader--visible");
  }

  hideLoaderIcon() {
    this.loaderIcon.classList.remove("circle-loader--visible");
  }

  showResultsArea() {
    this.resultsArea.classList.add("live-search-results--visible");
  }

  hideResultsArea() {
    this.resultsArea.classList.remove("live-search-results--visible");
  }

  renderResultsHTML(posts) {
    let markup;

    if (posts.length > 0) {
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}
      `;
      };

      const innerMarkup = posts
        .map((post) => {
          return `
            <a href="/posts/${
              post._id
            }" class="list-group-item list-group-item-action">
              <img class="avatar-tiny" src="${post.author.avatar}"> <strong>${
            post.title
          }</strong>
              <span class="text-muted small">by ${
                post.author.username
              } on ${formatDate(post.createdDate)}</span>
            </a>
            `;
        })
        .join("");

      const itemsFoundText = `${posts.length} ${
        posts.length < 1 ? "item" : "items"
      } found`;
      markup = DOMPurify.sanitize(`
      <div class="list-group shadow-sm">
        <div class="list-group-item active"><strong>Search Results</strong> (${itemsFoundText})</div>
          ${innerMarkup}
        </div>
      </div>
    `);
    } else {
      markup = `<p class="alert alert-danger text-center shadow-sm">Sorry, we could not find any results for that search</p>`;
    }

    this.resultsArea.innerHTML = markup;
    this.hideLoaderIcon();
    this.showResultsArea();
  }

  sendRequest() {
    fetch("/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ searchTerm: this.inputField.value, _csrf: this._csrf }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        this.renderResultsHTML(data);
      })
      .catch((err) => console.log);
  }

  keyPressHandler() {
    const currentValue = this.inputField.value;
    if (currentValue === "") {
      clearTimeout(this.typingWaitTimer);
      this.hideLoaderIcon();
      this.hideResultsArea();
    } else {
      if (currentValue !== this.previousValue) {
        clearTimeout(this.typingWaitTimer);
        this.showLoaderIcon();
        this.hideResultsArea();
        this.typingWaitTimer = setTimeout(() => this.sendRequest(), 750);
      }
    }
    this.previousValue = currentValue;
  }

  closeOverlay() {
    this.overlay.classList.remove("search-overlay--visible");
  }

  openOverlay() {
    this.overlay.classList.add("search-overlay--visible");
  }

  injectHTML() {
    document.body.insertAdjacentHTML(
      "beforeend",
      `
    <div class="search-overlay">
    <div class="search-overlay-top shadow-sm">
      <div class="container container--narrow">
        <label for="live-search-field" class="search-overlay-icon"><i class="fas fa-search"></i></label>
        <input type="text" id="live-search-field" class="live-search-field" placeholder="What are you interested in?">
        <span class="close-live-search"><i class="fas fa-times-circle"></i></span>
      </div>
    </div>

    <div class="search-overlay-bottom">
      <div class="container container--narrow py-3">
        <div class="circle-loader"></div>
        <div class="live-search-results">
      </div>
    </div>
  </div>
    `
    );
  }
}

export default Search;
