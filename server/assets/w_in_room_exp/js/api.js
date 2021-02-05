/**
 * Rudimentary API functions for changing and accessing data
 */

class Source {
  /**
   * Changes between sources, i.e. mood/globe
   */
  change(source, payload) {
    source = source.toLowerCase();
    if (!['globe', 'mood'].incudes(source)) {
      throw exception('Invalid source');
    }

    // Let's change the source
    setSource(source);

    // Handle payloads differently
    // -- Globe
    if (source === 'globe') {
      moveTo(payload.latitude, payload.longitude);
    }

    // -- Mood
    if (source === 'mood') {
      mood.change(payload.mood);
    }
  }
}

/* Mood functions */
class Mood {
  /**
   * Returns the current mood
   * @return {Number}
   */
  current() {
    return experience.activeMood;
  }

  /**
   * Returns the current mood colors
   * @return {Array}
   */
  colors() {
    return experience.getColors();
  }

  /**
   * Change the 'mood' of the visualizer
   * @param {Number}
   * @return void
   */
  change(mood) {
    return experience.setMood(mood);
  }

  /**
   * Set the speed of the animation
   * @param {Number}
   */
  setSpeed(speed) {
    experience.setSpeed(speed);
  }

  /**
   * Try out a new color scheme
   * @param {Array}
   * @return void
   */
  tryMood(rgbs) {
    experience.testMood(rgbs);
  }
}

class Text {
  /**
   * Construct the text class, sets visibility to true
   * and binds up text wrapper
   */
  constructor() {
    this.visible = true;
    this.element = document.querySelector('#text-wrapper');
    this.largeText = this.element.querySelector('h1');
    this.smallText = this.element.querySelector('h3');
  }

  /**
   * Toggles the main element between hidden and visible
   */
  toggleFade() {
    return new Promise(resolve => {
      this.element.classList.toggle('--hidden');
      this.visible = !this.visible;

      this.element.addEventListener('transitionend', () => {
        return resolve(this.visible);
      });
    });
  }

  /**
   * Makes text visible
   */
  fadeIn() {
    return new Promise(resolve => {
      this.element.classList.remove('--hidden');
      this.visible = true;

      this.element.addEventListener('transitionend', () => {
        return resolve();
      });
    });
  }

  /**
   * Hides text
   */
  fadeOut() {
    return new Promise(resolve => {
      this.element.classList.add('--hidden');
      this.visible = false;

      this.element.addEventListener('transitionend', () => {
        return resolve();
      });
    });
  }

  /**
   * Changes the large text
   * @param {String} text
   */
  setLargeText(text) {
    this.largeText.innerText = text;
  }

  /**
   * Changes the small text
   * @param {String} text
   */
  setSmallText(text) {
    this.smallText.innerText = text;
  }

  /**
   * Whether there is text present
   * @return {Boolean}
   */
  hasText() {
    return Boolean(this.largeText.innerText.length);
  }

  /**
   * Is text visible
   * @return {Boolean}
   */
  isVisible() {
    return this.visible;
  }
}

class Guest {
  /**
   * Set the guest name
   * @param {String} name
   */
  constructor(name) {
    this.name = name;
    this.updateTexts();
  }

  /**
   * Updates the text for a new guest
   * Fade is unnecessary, but good demonstration
   * of possible text transition.
   */
  async updateTexts() {
    // If extant guest, then let's fade it out
    if (text.hasText()) {
      await text.fadeOut();
    }

    // Let's go ahead and set the text
    text.setLargeText(
      `Welcome ${this.name}, we hope that you'll have a good stay.`
    );
    text.setSmallText(`Touch the iPad to begin playing music`);

    // Fade in, if invisible
    if (!text.isVisible()) {
      await text.fadeIn();
    }
  }

  /**
   * Returns a contextual greeting
   * @return {String}
   */
  static getGreeting() {
    const hours = new Date().getHours();

    let greeting = null;

    switch (hours) {
      case hours > 5 && hours < 12:
        greeting = 'Good morning';
        break;
      case hours > 12 && hours < 17:
        greeting = 'Good afternoon';
        break;
      default:
        greeting = 'Good evening';
        break;
    }

    return greeting;
  }
}

// Bind the classes up to window for ease of use
window.mood = new Mood();
window.text = new Text();
// window.guest = new Guest('Mr. Mochsioni');
