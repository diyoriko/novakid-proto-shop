// Wearable anchor geometry measured in Figma (insets = [top,right,bottom,left]
// % of the 159.95x151.53 item thumbnail). hat/glasses reference the mannequin
// head; eyes reference the pad_face skin patch (mapped via the eyes-1 calibration).
const WEAR_DATA = {
  hat: [
    { itemInset: [0, 20.74, 35.81, 15.63],     headInset: [17.85, 16.17, 3.74, 28.23] },
    { itemInset: [10.56, 31.7, 35.19, 21.26],  headInset: [11.86, 20.93, 9.73, 23.47] },
    { itemInset: [7.12, 15.65, 43.7, 12.53],   headInset: [15.12, 15.21, 6.47, 29.19] },
    { itemInset: [-1.32, 26.68, 45.11, 26.26], headInset: [37.04, 15.41, 3.95, 29] },
    { itemInset: [9.24, 17.41, 42.32, 13.13],  headInset: [31.48, 20.54, 9.51, 23.86] },
    { itemInset: [7.26, 20.9, 48.71, 20.01],   headInset: [14.72, 19.37, 6.86, 25.04] },
  ],
  glasses: [
    { itemInset: [40.15, 17.56, 28.22, 24.15], headInset: [17.16, 19.77, 16.26, 17.51] },
    { itemInset: [58.91, 28.43, 30, 47.34],    headInset: [17.16, 18.52, 16.26, 18.76] },
    { itemInset: [42.85, 19.58, 29.67, 30.17], headInset: [16.5, 18.52, 16.92, 18.76] },
    { itemInset: [44.56, 20.08, 28.87, 29.97], headInset: [17.16, 18.52, 16.26, 18.76] },
    { itemInset: [52.11, 17.8, 28.94, 31.1],   headInset: [17.16, 19.77, 16.26, 17.51] },
    { itemInset: [41.62, 9.03, 28.81, 8.75],   headInset: [17.16, 22.05, 16.26, 15.23] },
  ],
  eyes: [
    { itemInset: [35.14, 23.67, 34.98, 24.85], headInset: [31.68, 19.35, 31.37, 19.38] },
    { itemInset: [35.14, 20.57, 34.98, 20.48], headInset: [31.68, 19.35, 31.37, 19.38] },
    { itemInset: [35.14, 20.21, 34.98, 19.93], headInset: [31.68, 19.35, 31.37, 19.38] },
    { itemInset: [40.91, 24.44, 39.08, 24.31], headInset: [31.68, 19.35, 31.37, 19.38] },
    { itemInset: [39.76, 20.81, 39.35, 22.11], headInset: [31.68, 19.35, 31.37, 19.38] },
    { itemInset: [37.45, 20.41, 37.29, 19.93], headInset: [31.68, 19.35, 31.37, 19.38] },
  ],
};
AVATAR.setAnchors(WEAR_DATA);
