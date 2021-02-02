import * as lottie from "lottie-web";

export default {
  methods: {
    play() {
      this.animData.play();
    },
    stop() {
      this.animData.stop();
    },
    goToAndStop(value, isFrame) {
      this.animData.goToAndStop(value, isFrame, this.name);
    },
    setSpeed(speed) {
      this.animData.setSpeed(speed, this.name);
    },
    setDirection(direction) {
      this.animData.setDirection(direction, this.name);
    },
    freeze() {
      this.animData.freeze();
    },
    unfreeze() {
      this.animData.unfreeze();
    },
    inBrowser() {
      return this.animData.inBrowser();
    },
    resize() {
      this.animData.resize();
    },
    setQuality(quality) {
      this.animData.setQuality(quality);
    },
  },
};
