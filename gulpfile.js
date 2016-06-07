"use strict";

var gulp = require("gulp");
var gutil = require("gulp-util");
var sass = require("gulp-sass");
var sourcemaps = require("gulp-sourcemaps");
var production = process.env.NODE_ENV === "production";

gulp.task("sass", function() {
  return gulp.src("./public/css/*.scss")
    .pipe(sourcemaps.init())
    .pipe(sass(production ? { outputStyle: "compressed" } : {})
        .on("error", sass.logError))
    // create sourcemap file
    .pipe(sourcemaps.write("./"))
    .pipe(gulp.dest("./public/css/"));
});

// complete default task before watching
gulp.task("watch", ["default"], function() {
  gulp.watch("./public/css/*.scss", ["sass"])
    .on("change", function(file) {
      gutil.log(gutil.colors.yellow("CSS changed" + " (" + file.path + ")"));
    });
});

gulp.task("default", ["sass"]);
