<template>
  <div class="skullify-container">
    <div v-if="false">
      <slot v-if="$slots.default" />
      <div
        v-else
        v-show="!mounted"
        :style="buildSkeleton()"
        class="skullify-skeleton"
      />
    </div>
    <div class="skullify-animation" />
  </div>
</template>

<script>
import * as lottie from "lottie-web";
import spy from "cep-spy";
import path from "path";

// Adobe is #1 concern, but node should be handled with fs/path resolution later
const isAdobe = window.__adobe_cep__ ? true : false;
const isNode =
  typeof process !== "undefined" && process.release.name === "node";

export default {
  name: "skullify",
  props: {
    animationData: {
      type: Object,
      default: () => {
        return null;
      },
    },
    debug: {
      type: Boolean,
      default: false,
    },
    name: {
      type: String,
      default: () => {
        return (
          Date.now().toString(36) + Math.random().toString(36).substring(2)
        );
      },
    },
    options: {
      type: Object,
      default: () => {
        return {
          loop: false,
          prerender: true,
          autoplay: false,
          animType: "svg",
        };
      },
    },
    folder: {
      type: String,
      default: "",
    },
    files: {
      type: Array,
      default: () => {
        return [];
      },
    },
    uniqueRollLength: {
      type: Number,
      default: 1,
    },
    speed: {
      type: Number,
      default: 1,
    },
    direction: {
      type: Number,
      default: 1,
    },
    skeleton: {
      type: Array,
      default: () => {
        return [960, 960];
      },
    },
  },
  data: () => ({
    animData: null,
    opts: {
      loop: false,
      prerender: true,
      autoplay: false,
      animType: "svg",
    },
    realFiles: [],
    activeFileIndex: 0,
    activeSegmentIndex: 0,
    previousFileRolls: [],
    previousSegmentRolls: [],
    loaded: false,
    mounted: false,
    evts: [
      "complete",
      "loopComplete",
      "enterFrame",
      "segmentStart",
      "config_ready",
      "data_ready",
      "data_failed",
      "loaded_images",
      "DOMLoaded",
      "destroy",
    ],
  }),
  mixins: [require("../utils/IO").default, require("../utils/lottie").default],
  async mounted() {
    if (this.folder) {
      if (this.debug) console.log("FOLDER:");
      this.realFiles = await this.getFileListFromFolder();
    } else if (this.files && this.files.length) {
      if (this.debug) console.log("FILES:");
      this.realFiles = await this.parseFileList();
    }
    await this.init();
  },
  watch: {
    loaded(val) {
      this.$emit(`${val ? "" : "un"}load`);
    },
    async animationData(val, last) {
      if (JSON.stringify(val) !== JSON.stringify(last))
        await this.reconstruct(val);
    },
    options: {
      async handler(val, last) {
        if (JSON.stringify(val) !== JSON.stringify(last))
          await this.reconstruct(val);
      },
      deep: true,
    },
    speed(val, last) {
      if (val !== last) this.setSpeed(val);
    },
    direction(val, last) {
      if (val !== last) this.setDirection(val);
    },
    realFiles(val) {
      if (this.debug) console.log("FILE LIST CHANGED:");
      if (this.debug) console.log(val);
    },
  },
  computed: {
    markers() {
      try {
        return this.animData.animationData.markers;
      } catch (err) {
        return [];
      }
    },
    segments() {
      try {
        if (!this.animData || !this.markers.length) return [];
        let list = [];
        for (
          let i = 0;
          i <
          this.markers.map((marker) => {
            return marker.tm;
          }).length -
            1;
          i++
        ) {
          const marker = markers[i];
          const nextmarker = markers[i + 1];
          let temp = {
            forward: [marker, nextmarker],
            reverse: [nextmarker, marker],
          };
          list.push(temp);
        }
        return list;
      } catch (err) {
        return [];
      }
    },
    realDirection() {
      return this.direction ? "forward" : "backward";
    },
    realFolderLocation() {
      if (!this.folder || !this.folder.length) return null;
      return this.sanitizeLocalPath(this.folder);
    },
  },
  methods: {
    convertToSnakeCase(str) {
      return str !== "DOMLoaded"
        ? (
            str[0].toLowerCase() +
            str
              .slice(1, str.length)
              .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
          ).replace("_", "-")
        : "dom-loaded";
    },
    getGCR(a, b) {
      return b == 0 ? a : this.getGCR(b, a % b);
    },
    getAspectRatio(a, b) {
      let r = this.getGCR(a, b);
      return `${a / r}:${b / r}`;
    },
    getRatio(str) {
      let string = str.split(":");
      if (!string.length) return null;
      return +string[0] / +string[1];
    },
    buildSkeleton() {
      let ratio = this.getAspectRatio(960, 540);
      if (this.debug) console.log(ratio);
      let pratio = this.getRatio(ratio);
      return `
          overflow: hidden;
          height: 0;
          padding-top: ${(this.skeleton[0] / this.skeleton[1]) * 100}%;
          width: 100%;
          background: var(--color-bg);
        `;
    },
    sendEvent() {
      if (!arguments.length || !arguments[0]) return null;
      this.$emit(this.convertToSnakeCase(arguments[0].type), arguments[0]);
    },
    generateEvents() {
      this.evts.forEach((evt) => {
        this.animData.addEventListener(evt, this.sendEvent);
      });
    },
    removeEvents() {
      this.evts.forEach((evt) => {
        this.animData.removeEventListener(evt, this.sendEvent);
      });
    },
    async parseFileList() {
      let temp = [];
      for (let file of this.files.filter((file) => {
        return /string/i.test(typeof file) ? /(json|lottie)$/.test(file) : true;
      }))
        if (/string/i.test(typeof file))
          temp.push(
            JSON.parse(await this.readFile(this.sanitizeLocalPath(file), false))
          );
        else if (/object/i.test(typeof file)) temp.push(file);
        else this.$emit("error", `${typeof file} is not supported`);
      return temp.filter((item) => {
        return this.checkIfValidLottie(item);
      });
    },
    checkIfValidLottie(item) {
      return (
        Object.keys(item).length &&
        ["v", "fr", "ip"].some((el) => Object.keys(item).includes(el))
      );
    },
    sanitizeLocalPath(targ) {
      return /^\.\//.test(targ) && isAdobe
        ? `${spy.path.root}/${targ.replace(/^\.\//, "")}`.replace(/\\/gm, "/")
        : path.resolve(targ);
    },
    async getFileListFromFolder() {
      if (this.debug) console.log("READING FROM FOLDER");
      if (
        this.folder &&
        this.folder.length &&
        this.realFolderLocation &&
        this.realFolderLocation.length
      ) {
        let temp = await this.readFiles(this.realFolderLocation, false);
        return temp
          .filter((item) => {
            return /string/i.test(typeof item);
          })
          .map((item) => {
            return JSON.parse(item);
          })
          .filter((item) => {
            return this.checkIfValidLottie(item);
          });
      } else if (this.files && this.files.length) {
        // This should have been handled via "files" prop
      } else return []; // This must be browser, we can't read files here
    },
    async reconstruct(val) {
      this.removeEvents();
      this.animData.destroy();
      this.loaded = false;
      if (val) await this.init();
    },
    async init() {
      try {
        let temp = this.animationData
          ? this.animationData
          : this.realFiles.length
          ? this.realFiles[this.activeFileIndex]
          : null;

        if (!temp) {
          this.$emit("error", "Animation data was empty");
          return null;
        } else this.animData = this.buildAnimation(temp);
        this.mounted = true;

        if (this.opts.autoplay && this.animData && this.animData.play)
          this.animData.play();
        if (this.debug) console.log(this.animData);
        this.loaded = true;
        this.generateEvents();
        return Promise.resolve(true);
      } catch (err) {
        return Promise.reject(err);
      }
    },
    buildAnimation(anim = null) {
      if (!anim) anim = this.animationData;
      return lottie.loadAnimation(
        Object.assign(
          {
            animationData: anim,
            wrapper: this.$el.children[0],
            name: this.name,
          },
          Object.assign(this.opts, this.options)
        )
      );
    },
    randomNum(min, max) {
      return Math.floor(Math.random() * max) + min;
    },
    shuffleFile() {
      while (this.previousFileRolls.length > this.uniqueRollLength)
        this.previousFileRolls.shift();
      let roll = this.rollRandom(this.realFiles.length, this.previousFileRolls);
      this.previousFileRolls.push(roll);
      this.activeFileIndex = roll;
      this.reconstruct(true);
    },
    shuffleSegment() {
      while (this.previousSegmentRolls.length > this.uniqueRollLength)
        this.previousSegmentRolls.shift();
      let roll = this.rollRandom(
        this.realFiles.length,
        this.previousSegmentRolls
      );
      this.previousSegmentRolls.push(roll);
      this.activeSegmentIndex = roll;
      this.playSegmentChunk(this.activeSegmentIndex);
    },
    rollRandom(max, excludes = []) {
      let roll = this.randomNum(0, max);
      return excludes.includes(roll) ? this.rollRandom(max, excludes) : roll;
    },
    playSegmentChunk(value) {
      this.animData.playSegments(
        this.segments[value][this.realDirection],
        true
      );
      this.play();
    },
  },
};
</script>

<style>
.skullify-container svg {
  width: 100%;
}
</style>
