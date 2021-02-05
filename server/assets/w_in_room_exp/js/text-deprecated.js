
// We use this to hold the coordinates of added text
const textPosition = {
  lowest: 0,
  highest: 0,
}



/**
* Returns an object with information about how the text
* would be sized if rendered
* @param {String} text
* @param {Object} parameters
* @param {Number} renderedWidth
*/
const calculateTextDimensions = (text, parameters, width) => {
  const sample = new THREE.TextGeometry(text, parameters)

  sample.computeBoundingBox()

  const lines = Math.ceil(
    (sample.boundingBox.max.x - sample.boundingBox.min.x) / width
  )

  return {
    lines: lines,
    lineHeight: sample.boundingBox.max.y - sample.boundingBox.min.y,
    characters: {
      perLine: text.length / lines,
      averageSize:
        (sample.boundingBox.max.x - sample.boundingBox.min.x) / text.length,
    },
  }
}

/**
* Returns a promise and loads a font
* @param {Object} font
* @return THREE.Font
*/
const loadFont = font => {
  return new Promise((resolve, reject) => {
    if (font instanceof Object === false) {
      console.error('Invalid font object')
      return reject(new Error('invalid font, needs to be conformant JSON'))
    }

    return resolve(new THREE.Font(font))
  })
}



/**
* Sets the current text to be overlaid
* @param {String} text
* @param {Object} parameters
* @param {Decimal} width
* @param {Array} secondaryTexts
* @return {Texture}
*/
const setCurrentText = (
  text,
  parameters = {
    height: 1,
    curveSegments: 30,
    bevelEnabled: false,
  },
  contentFlow = 0.75,
  secondaryTexts = []
) => {
  const subScene = new THREE.Scene()
  const width = window.innerWidth * contentFlow
  const height = window.innerHeight
  const subCamera = new THREE.OrthographicCamera(
    window.innerWidth / -2,
    window.innerWidth / 2,
    height / 2,
    height / -2,
    1,
    1000
  )

  subCamera.position.z = 2

  /**
  * Let's see how large the text would be rendered as is,
  * and break it into appropriate breaks.
  */

  const mainText = calculateTextDimensions(
    text,
    { ...parameters, size: width * parameters.size },
    width
  )

  // Calculate our text size if written out in its entirety
  const meshes = []

  // Let's loop through and create a bunch of elements
  let slice

  for (let index = 0; index < mainText.lines; index++) {
    slice = text.slice(
      index * mainText.characters.perLine,
      (index + 1) * mainText.characters.perLine
    )

    meshes.push(
      new THREE.Mesh(
        new THREE.TextGeometry(slice, {
          ...parameters,
          size: width,
        }),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      )
    )
  }

  // Reverse order and then add to texture
  meshes.reverse().forEach((mesh, index) => {
    mesh.scale.set(parameters.size, parameters.size, parameters.size)

    mesh.position.x = width / -2
    mesh.position.y =
      (mainText.lines - index) * mainText.lineHeight * -1.2 +
      (mainText.lines * mainText.lineHeight) / 2

    // Let's add the heights so that we can work off them
    if (index === 0) {
      textPosition.highest = mesh.position.y - mainText.lineHeight
    }

    if (index === meshes.length - 1) {
      textPosition.lowest = mesh.position.y + mainText.lineHeight
    }

    subScene.add(mesh)
  })

  const secondaries = []

  // Let's go ahead and add any further texts
  secondaryTexts.forEach((secondaryText, index) => {
    const textProperties = calculateTextDimensions(
      secondaryText.text,
      {
        ...secondaryText.parameters,
        size: secondaryText.parameters.size * width,
      },
      width
    )

    secondaries[index] = []

    for (let i = 0; i < textProperties.lines; i++) {
      let sliced = secondaryText.text.slice(
        i * textProperties.characters.perLine,
        (i + 1) * textProperties.characters.perLine
      )

      let text = new THREE.Mesh(
        new THREE.TextGeometry(sliced, {
          ...secondaryText.parameters,
          size: width,
        }),
        new THREE.MeshBasicMaterial({ color: 0x00ff00 })
      )

      text.position.y = textPosition.highest
      text.position.x = width / -2

      textPosition.highest -= textProperties.lineHeight
      text.scale.set(
        secondaryText.parameters.size,
        secondaryText.parameters.size,
        secondaryText.parameters.size
      )

      secondaries[index].push(text)
    }
  })

  secondaries.forEach(secondary =>
    secondary.reverse().forEach(text => subScene.add(text))
  )

  const renderTarget = new THREE.WebGLRenderTarget(width * 4, height * 4, {
    magFilter: THREE.NearestFilter,
    minFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  })

  renderer.render(subScene, subCamera, renderTarget)

  // return texture
  return renderTarget.texture
}