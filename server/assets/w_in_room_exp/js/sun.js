// Sun.js
// Copyright (c) 2019 Stockholm Department AB
// Created by Fredrik Jonsson on 14/06/2019

/**
 * Constants for sun calculation
 */
const Constant = {
  j1970: 2440588,
  j2000: 2451545,
  th0: (280.16 * Math.PI) / 180,
  th1: (360.9856235 * Math.PI) / 180,
};

/**
 * Translate longitude and latitude
 * @param {number} latitude
 * @param {number} longitude
 * @return {object}
 */
const coordinateToNormal = (latitude, longitude) =>
  new THREE.Vector3(
    Math.cos(latitude) * Math.sin(longitude),
    Math.sin(latitude),
    Math.cos(latitude) * Math.cos(longitude)
  );

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @return {number}
 */
const degreesToRadians = degrees => degrees * (Math.PI / 180);

/**
 * Translate degrees to normal coordinate system
 * @param {number} latitude
 * @param {number} longitude
 * @return {object}
 */
const coordinateInDegreesToNormal = (latitude, longitude) =>
  coordinateToNormal(degreesToRadians(latitude), degreesToRadians(longitude));

const mod = function(n, m) {
  return ((n % m) + m) % m;
};

/**
 *
 * @param {Number} degrees
 * @return {Number}
 */
const range360 = degrees => {
  let a = degrees;

  while (a < 0) {
    a += 360;
  }

  while (a >= 360) {
    a -= 360;
  }

  return a;
};

/**
 * Safe, albeit inelegant way to get current UTC time as a date object
 * @return {Date}
 */
const getDateUTC = () => {
  const date = new Date();
  const unix = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );

  const utc = new Date(unix);

  console.log('The time is now:', utc);

  return utc;
};

/**
 * Returns the difference in angle between two angles
 * @param {Number} a1
 * @param {Number} a2
 * @return {Number}
 */
const angleDiff = (a1, a2) => {
  let phi = mod(Math.abs(a1 - a2), 360); // This is either the distance or 360 - distance
  return phi > 180 ? 360 - phi : phi;
};

/**
 * Returns a normalized position of the sun
 * @param {Date} date
 * @return {Object}
 */
const calculateSunPositionNormalized = (date = Date.now()) => {
  let coordinates = sunGraphicalCoordinates(date);
  return coordinateInDegreesToNormal(
    coordinates.latitude,
    coordinates.longitude
  );
};

/**
 *
 * @param {Number} timeBase
 * @param {Number} val
 * @return {Number}
 */
const siderealTime = (timeBase, val) => {
  return Constant.th0 + Constant.th1 * (timeBase - Constant.j2000) - val;
};

/**
 * Returns the coordinates of the sun mapped onto a sphere?
 * @param {Date} date
 * @param {Number} latitude
 * @param {Number} longitude
 */
const sunGraphicalCoordinates = () => {
  const calendar = getDateUTC();

  let hour = calendar.getHours();

  let time = calendar.getTime() / (60 * 60 * 24 * 1000) - 0.5 + Constant.j1970;

  let r2000 = (time - Constant.j2000) / 36525.0;

  let m = 2.0 * Math.PI * (0.993133 + 99.997361 * r2000);

  let l =
    2.0 *
    Math.PI *
    (0.7859453 +
      m / (2.0 * Math.PI) +
      (6893.0 * Math.sin(m) + 72.0 * Math.sin(2.0 * m) + 6191.2 * r2000) /
        1296000);

  let e =
    (2 *
      Math.PI *
      (23.43929111 +
        (-46.815 * r2000 -
          0.00059 * r2000 * r2000 +
          0.001813 * r2000 * r2000 * r2000) /
          3600)) /
    360;

  let dk = Math.asin(Math.sin(e) * Math.sin(l));

  let ra = Math.atan2(Math.tan(l), Math.cos(e));

  let gmst = Math.abs(mod(siderealTime(time, 0), 2.0 * Math.PI));

  let latitude = dk * 57.2957795;

  let longitude = range360((ra - gmst) * 57.2957795);

  var expected = (12 - hour) * 15; // -12 - 12 => -180 - 180

  if (Math.abs(angleDiff(expected, longitude)) < 40) {
    longitude -= 180;
  }

  if (expected < 0) {
    expected += 360;
  }

  if (Math.abs(angleDiff(expected, longitude)) < 40) {
    longitude -= 180;
  }

  return (output = {
    latitude: latitude,
    longitude: range360(longitude + 180),
  });
};
