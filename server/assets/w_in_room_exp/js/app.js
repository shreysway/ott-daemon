/**
 * Main THREE instance
 * This file contains the configuration options for mood effects
 * alongside some text generation functions.
 */

// Helper functions
// -- Scene functions

/**
 * Loads a texture and returns texture object
 * @param {string} path
 * @return {THREE.Texture}
 */
const loadTexture = path => {
  // instantiate texture loader
  const loader = new THREE.TextureLoader();

  return new Promise((resolve, reject) => {
    loader.load(path, texture => resolve(texture), undefined, error => {
      console.error(error);
      return reject(error);
    });
  });
};

class Experience {
  constructor(config = {}) {
    // Viewport size
    this.vWidth = window.innerWidth;
    this.vHeight = window.innerHeight;

    // Basic state management
    this.transitioning = false;

    const params = new URL(location.href).searchParams;

    // Default app config
    this.config = {
      default: {
        mood: 2,
        coords: {
          latitude: parseFloat(params.get('latitude')) || 51,
          longitude: parseFloat(params.get('longitude')) || 0,
        },
      },
      camera: {
        z: 3.8,
        fov: 20,
      },
      ...config,
    };
    // These are the default gradients
    this.gradients = {
      plane: [
        {
          // Mood #0
          colorBottomLeft: new THREE.Vector3(0 / 255, 176 / 255, 255 / 255),
          colorBottomRight: new THREE.Vector3(0, 218 / 255, 238 / 255),
          colorTopLeft: new THREE.Vector3(0, 218 / 255, 233 / 255),
          colorTopRight: new THREE.Vector3(0, 255 / 255, 128 / 255),
        },
        {
          // Mood #1
          colorBottomLeft: new THREE.Vector3(255 / 255, 247 / 255, 0),
          colorBottomRight: new THREE.Vector3(0, 231 / 255, 26 / 255),
          colorTopLeft: new THREE.Vector3(0, 228 / 255, 138 / 255),
          colorTopRight: new THREE.Vector3(213 / 255, 255 / 255, 0),
        },
        {
          // Mood #2
          colorBottomLeft: new THREE.Vector3(255 / 255, 247 / 255, 30 / 255),
          colorBottomRight: new THREE.Vector3(180 / 255, 246 / 255, 0),
          colorTopLeft: new THREE.Vector3(255 / 255, 70 / 255, 170 / 255),
          colorTopRight: new THREE.Vector3(255 / 255, 171 / 255, 41 / 255),
        },
        {
          // Mood #3
          colorBottomLeft: new THREE.Vector3(255 / 255, 53 / 255, 113 / 255),
          colorBottomRight: new THREE.Vector3(249 / 255, 159 / 255, 28 / 255),
          colorTopLeft: new THREE.Vector3(169 / 255, 0, 243 / 255),
          colorTopRight: new THREE.Vector3(247 / 255, 0, 135 / 255),
        },
      ],
      globe: {
        colorTop: new THREE.Vector3(157 / 255, 255 / 255, 109 / 255),
        colorLeft: new THREE.Vector3(249 / 255, 159 / 255, 28 / 255),
        colorRight: new THREE.Vector3(150 / 255, 20 / 255, 255 / 255),
        colorBottom: new THREE.Vector3(0, 182 / 255, 237 / 255),
      },
    };

    // These are the uniform values that all uniforms extend from
    this.baseUniforms = {
      resolution: {
        type: 'v2',
        value: new THREE.Vector2(this.vWidth, this.vHeight),
      },
      time: {
        type: 'hf',
        value: 0,
      },
    };

    // Let's start our main thread
    this.main();
  }

  shader(name) {
    return document.querySelector(`#${name}`).textContent;
  }

  async main() {
    // Instantiate a new global renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false });

    // Set the current mood
    this.activeMood = this.config.default.mood;

    // Set current coords
    this.activeCoordinates = {
      latitude: 0,
      longitude: 0,
    };

    // Textures
    // -- Globe texture
    const globeTexture = await loadTexture('/assets/w_in_room_exp/textures/globe.png');

    // Let's set up uniforms
    // -- Gradient uniforms
    this.gradientUniforms = {
      colorTopLeft: {
        type: '3f',
        value: new THREE.Vector3().copy(
          this.gradients.plane[this.activeMood].colorTopLeft
        ),
      },
      colorTopRight: {
        type: '3f',
        value: new THREE.Vector3().copy(
          this.gradients.plane[this.activeMood].colorTopRight
        ),
      },
      colorBottomLeft: {
        type: '3f',
        value: new THREE.Vector3().copy(
          this.gradients.plane[this.activeMood].colorBottomLeft
        ),
      },
      colorBottomRight: {
        type: '3f',
        value: new THREE.Vector3().copy(
          this.gradients.plane[this.activeMood].colorBottomRight
        ),
      },
      speed: {
        type: 'hf',
        value: 1,
      },
      ...JSON.parse(JSON.stringify(this.baseUniforms)),
    };

    // -- Globe uniforms
    this.globeUniforms = {
      texture: {
        type: 't',
        value: globeTexture,
      },
      colorTop: {
        type: '3f',
        value: new THREE.Vector3().copy(this.gradients.globe.colorTop),
      },
      colorLeft: {
        type: '3f',
        value: new THREE.Vector3().copy(this.gradients.globe.colorBottom),
      },
      colorRight: {
        type: '3f',
        value: new THREE.Vector3().copy(this.gradients.globe.colorLeft),
      },
      colorBottom: {
        type: '3f',
        value: new THREE.Vector3().copy(this.gradients.globe.colorRight),
      },
      sunPositionNormal: {
        type: '3f',
        value: calculateSunPositionNormalized(),
      },
      ...JSON.parse(JSON.stringify(this.baseUniforms)),
    };

    // Let's dynamically update the position of the sun
    setInterval(() => {
      this.globeUniforms.sunPositionNormal.value = calculateSunPositionNormalized();
    }, 30 * 1000);

    /* Lets begin setting up our scene  */
    this.renderer.setSize(this.vWidth, this.vHeight);

    // Kick out our canvas
    document.body.appendChild(this.renderer.domElement);

    // Create our scene
    this.scene = new THREE.Scene();

    // Instantiate a perspective camera for our scene
    this.camera = new THREE.PerspectiveCamera(
      this.config.camera.fov,
      this.vWidth / this.vHeight,
      0.1,
      1000
    );

    // Let's place our camera
    this.camera.position.z = this.config.camera.z;

    // Store for use in time displacement noise functionis
    this.initialTime = Date.now();

    // Let's create our custom materials
    // -- Gradient
    const gradientMaterial = new THREE.ShaderMaterial({
      uniforms: this.gradientUniforms,
      fragmentShader: this.shader('gradient-fragment-shader'),
    });

    // -- Globe material
    const globeMaterial = new THREE.ShaderMaterial({
      uniforms: this.globeUniforms,
      vertexShader: this.shader('globe-vertex-shader'),
      fragmentShader: this.shader('globe-fragment-shader'),
    });

    // Calculate the total dimensions with FOV
    const dimensions = this.calculateDimensions(this.camera);

    // Let's create our plane mesh where we will project the mood gradients
    this.plane = new THREE.Mesh(
      new THREE.PlaneGeometry(dimensions.width, dimensions.height, 32),
      gradientMaterial
    );

    // Let's kick up our globe
    this.globe = new THREE.Mesh(
      new THREE.SphereGeometry(1.4, 48, 48),
      globeMaterial
    );

    this.fadePlane = new THREE.Mesh(
      new THREE.SphereGeometry(2.8, 4, 4),
      new THREE.MeshLambertMaterial({
        opacity: 0.0,
        color: 0x000000,
        transparent: true,
      })
    );

    this.fadePlane.position.z = 0.1;

    this.scene.add(this.fadePlane);

    // Place in space
    this.globe.position.z = 0;

    // Rotate to normalize coords
    // this.globe.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), -Math.PI / 2);

    this.scene.add(this.globe);
    this.scene.add(this.plane);

    // Start the render loop
    this.render();

    // Move to london by default unless overridden
    this.moveTo(
      this.config.default.coords.latitude,
      this.config.default.coords.longitude
    );

    // Let's listen for changes in the viewport
    window.addEventListener('resize', this.onResize);
  } // End of main

  // Scene methods
  // -- Rotate to a given point on the globe
  moveTo(latitude, longitude) {
    return new Promise(resolve => {
      if (this.source === 'mood') {
        console.info('moveTo disabled while mood is active');
        return resolve(Date.now());
      }

      const latitudeRadians = degreesToRadians(latitude);
      const longitudeRadians = degreesToRadians(longitude);

      this.activeCoordinates = {
        latitude: latitude,
        longitude: longitude,
      };

      const vectorTo = coordinateToNormal(latitudeRadians, longitudeRadians);
      const vectorFrom = this.camera.position.clone().normalize();

      const obj = { v: 0 }; // dummy empty obj to animate

      const animation = TweenLite.to(obj, 10, {
        v: 1,
        ease: Power3.easeOut,
        onUpdate: () => {
          if (this.transitioning) {
            animation.kill();
            console.log(`Animation cancelled at:`, Date.now());
            return resolve(Date.now());
          }
          this.camera.position.lerpVectors(vectorFrom, vectorTo, obj.v);
          this.camera.position.multiplyScalar(this.config.camera.z);
          this.camera.lookAt(0, 0, 0);
        },
        onComplete: () => resolve(Date.now()),
      });
    });
  }

  /**
   * Toggle source between mood and globe
   * @param {string} source
   * @return {Promise}
   */
  async setSource(source, input = null) {
    if (!['globe', 'mood'].includes(source)) {
      throw new Error('Invalid source type');
    }

    if (this.transitioning) return console.warn('Transition in progress');

    this.transitioning = true;

    // Let's assign default values if none are given
    if (input === null) {
      input = source === 'mood' ? this.activeMood : this.activeCoordinates;
    }

    // Let's update the active mood index
    if (source === 'mood' && input !== this.activeMood) {
      await this.setMood(input);
    }

    if (source == this.source) {
      this.transitioning = false;
      return;
    }

    // set source
    this.source = source;

    const globeFade = source === 'mood';

    const obj = { v: 0 };

    await new Promise(resolve => {
      TweenLite.to(obj, 2, {
        v: 1,
        ease: Power3.easeIn,
        onStart: () => {
          console.log(`Began transition at`, Date.now());
        },
        onUpdate: () => {
          // Beginning
          if (obj.v < 0.4) {
            this.fadePlane.material.opacity = obj.v * 2.5;
          }

          // Midpoint
          if (obj.v >= 0.4 && obj.v <= 0.6) {
            // Reset camera
            if (source === 'mood') {
              this.camera.position.z = this.config.camera.z;
              this.camera.position.x = 0;
              this.camera.position.y = 0;
              this.camera.lookAt(0, 0, 0);
            }

            if (globeFade) {
              this.scene.remove(this.globe);
              this.scene.add(this.plane);
            } else {
              this.scene.remove(this.plane);
              this.scene.add(this.globe);
            }
          }

          // End
          if (obj.v > 0.6) {
            this.fadePlane.material.opacity = 1 - obj.v;
          }
        },
        onComplete: () => resolve(Date.now()),
      });
    });

    // Let's update our state to allow moveTo to work correctly
    this.transitioning = false;

    // If position is updated then let's go ahead and calculate
    if (source === 'globe' && input !== this.activeCoordinates) {
      await this.moveTo(input.latitude, input.longitude);
    }
  }

  /**
   * Calculate dimensions to cover total scene space with a given FOV
   * @return {object}
   */
  calculateDimensions() {
    const vFOV = THREE.Math.degToRad(this.config.camera.fov);

    const height = 2 * Math.tan(vFOV / 2) * this.config.camera.z;

    return { width: height * this.camera.aspect, height: height };
  }

  /**
   * Update time in uniforms
   */
  updateTime() {
    const time = (Date.now() - this.initialTime) / 1000;
    this.globeUniforms.time.value = time;
    this.gradientUniforms.time.value = time;
  }

  /**
   * Updates camera, renderer and sets dimension values
   */
  onResize() {
    this.vWidth = window.innerWidth;
    this.vHeight = window.innerHeight;

    if (!this.camera) return;

    this.camera.aspect = this.vWidth / this.vHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.vWidth, this.vHeight);
  }

  /**
   * Render loop method
   */
  render() {
    this.updateTime();
    // console.log("this.scene", this.scene);
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.render());
  }

  /* Incorporated API methods */
  setMood(mood) {
    return new Promise((resolve, reject) => {
      if (mood < 0 || mood >= this.gradients.plane.length) {
        console.error(`Invalid mood: ${mood}`);
        return reject('indexError');
      }

      const to = this.gradients.plane[mood];
      const from = {};

      let key = null;

      for (key in to) {
        from[key] = new THREE.Vector3().copy(this.gradientUniforms[key].value);
      }
      const obj = { v: 0 }; // dummy empty obj to animate
      TweenLite.to(obj, 2, {
        v: 1,
        ease: Power3.easeOut,
        onUpdate: () => {
          for (key in to) {
            this.gradientUniforms[key].value.lerpVectors(
              from[key],
              to[key],
              obj.v
            );
          }
        },
        onComplete: () => {
          return resolve(Date.now());
        },
      });

      this.activeMood = mood;
    });
  }

  /**
   * Set the speed of the mood animation
   * @param {number}
   */
  setSpeed(speed) {
    this.gradientUniforms.speed.value = speed / 5;
    console.info(`Running at ${(speed / 5) * 100}% speed`);
  }

  /**
   * Try out a new color scheme
   * @param {Array}
   * @return void
   */
  testMood(rgbs) {
    const order = [
      'colorBottomLeft',
      'colorBottomRight',
      'colorTopLeft',
      'colorTopRight',
    ];

    if (rgbs.length !== 4) {
      console.error('mood must contain four hex colors in order:', order);
      return false;
    }

    const gradientIndex = this.gradients.plane.length;

    const gradient = {};

    rgbs.forEach((rgb, index) => {
      gradient[order[index]] = new THREE.Vector3().fromArray(
        rgb.map(color => {
          if (color == 0) return color;

          return Number(color) / 255;
        })
      );
    });

    this.gradients.plane.push(gradient);

    this.changeMood(gradientIndex);
  }

  /**
   * Returns the current mood colors
   * @return {Array}
   */
  getColors() {
    const colors = this.gradients.plane[this.activeMood];

    const output = [];
    let color;
    for (color in colors) {
      const rgb = colors[color].toArray().map(decimal => decimal * 255);

      output.push({
        rgb: rgb,
        hex: this.convertToHex(rgb),
      });
    }

    return output;
  }

  /**
   * Returns the current active mood
   * @return {Number}
   */
  getActiveMood() {
    return this.activeMood;
  }

  /**
   * Converts array to hex value
   * @param {Array} rgb
   * @return {String}
   */
  convertToHex(rgb) {
    const output = [];
    rgb.forEach(color => {
      let hex = Number(color).toString(16);
      if (hex.length < 2) hex = `0${hex}`;

      output.push(hex);
    });

    return `#${output.join('')}`;
  }
}

// Let's start the experience after DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  
  // experience.setSource('mood');
});
