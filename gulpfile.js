const { src, dest, watch, series, parallel } = require("gulp");
const sass = require("gulp-sass")(require("sass"));
const cleanCSS = require("gulp-clean-css");
const concat = require("gulp-concat");
const uglify = require("gulp-uglify");
const webp = require("gulp-webp");
const imagemin = require("gulp-imagemin").default || require("gulp-imagemin");
const imageminOptipng = require("imagemin-optipng");
const newer = require("gulp-newer");
const sourcemaps = require("gulp-sourcemaps");
const browserSync = require("browser-sync").create();
const fonter = require("gulp-fonter");
const ttf2woff2 = require("gulp-ttf2woff2");
const rename = require('gulp-rename');
const merge = require("merge-stream");
const flatten = require('gulp-flatten');
const fs = require('fs');
const path = require('path');

const paths = {
  scss: "src/scss/**/*.scss",
  js: "src/js/**/*.js",
  imgs: "src/imgs/**/*.{jpg,jpeg,png}",
  pngs: "src/imgs/png/**/*.png",
  fonts: "src/fonts/**/*.{ttf,otf}",
  fontsRaw: "src/fonts/**/*.{woff,woff2}",
  destCss: "assets/",
  destJs: "assets/",
  destImgs: "assets/imgs/",
  destFonts: "assets/fonts/",
};

// Clean assets folder
function cleanAssets(cb) {
  const assetsPath = path.join(__dirname, 'assets');
  
  if (fs.existsSync(assetsPath)) {
    fs.rmSync(assetsPath, { recursive: true, force: true });
  }
  
  cb();
}

// SCSS → CSS, Sourcemaps, concat, minify (for development)
function styles() {
  return src(paths.scss)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(concat("style.min.css"))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.destCss))
    .pipe(browserSync.stream());
}

// SCSS → CSS, concat, minify (for production, no sourcemaps)
function stylesBuild() {
  return src(paths.scss)
    .pipe(sass().on("error", sass.logError))
    .pipe(concat("style.min.css"))
    .pipe(cleanCSS({ level: 2 }))
    .pipe(dest(paths.destCss));
}

// JS concat, minify, Sourcemaps (for development)
function scripts() {
  return src(paths.js)
    .pipe(sourcemaps.init())
    .pipe(concat("script.min.js"))
    .pipe(uglify())
    .pipe(sourcemaps.write("."))
    .pipe(dest(paths.destJs))
    .pipe(browserSync.stream());
}

// JS concat, minify (for production, no sourcemaps)
function scriptsBuild() {
  return src(paths.js)
    .pipe(concat("script.min.js"))
    .pipe(uglify())
    .pipe(dest(paths.destJs));
}

// WebP conversion
function toWebp() {
  return src(paths.imgs)
    .pipe(newer(paths.destImgs))
    .pipe(webp())
    .pipe(dest(paths.destImgs));
}

// PNG optimization
function optimizePng() {
  return src(paths.pngs)
    .pipe(newer(paths.destImgs))
    .pipe(imagemin([imageminOptipng({ optimizationLevel: 5 })]))
    .pipe(dest(paths.destImgs));
}

// Fonts: copy .woff/.woff2 and convert .ttf/.otf with clean filenames
function fonts() {
  // Copy existing .woff/.woff2 files
  const raw = src(paths.fontsRaw)
    .pipe(newer(paths.destFonts))
    .pipe(flatten())
    .pipe(dest(paths.destFonts));

  // Convert .ttf/.otf to .woff with clean names
  const woff = src(paths.fonts)
    .pipe(newer({ dest: paths.destFonts, ext: '.woff' }))
    .pipe(fonter({ formats: ['woff'] }))
    .pipe(rename((path) => {
      path.dirname = '';
      path.basename = path.basename.replace(/^fonts/, '').replace(/[\\\/]/g, '');
    }))
    .pipe(dest(paths.destFonts));

  // Convert .ttf/.otf to .woff2 with clean names
  const woff2 = src(paths.fonts)
    .pipe(newer({ dest: paths.destFonts, ext: '.woff2' }))
    .pipe(ttf2woff2())
    .pipe(rename((path) => {
      path.dirname = '';
      path.basename = path.basename.replace(/^fonts/, '').replace(/[\\\/]/g, '');
    }))
    .pipe(dest(paths.destFonts));

  return merge(raw, woff, woff2);
}

// BrowserSync development server
function serve() {
  browserSync.init({
    server: "./",
    notify: false,
  });
  
  watch(paths.scss, styles);
  watch(paths.js, scripts);
  watch(paths.imgs, toWebp);
  watch(paths.pngs, optimizePng);
  watch([paths.fonts, paths.fontsRaw], fonts);
  watch("*.html").on("change", browserSync.reload);
}

// Build task - cleans first, then processes all assets without sourcemaps
const build = series(cleanAssets, parallel(stylesBuild, scriptsBuild, toWebp, optimizePng, fonts));

// Dev build task - processes all assets with sourcemaps (no cleaning for faster dev)
const devBuild = parallel(styles, scripts, toWebp, optimizePng, fonts);

// Export tasks
exports.clean = cleanAssets;
exports.dev = series(devBuild, serve);
exports.build = build;
exports.default = build;