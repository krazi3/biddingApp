var gulp = require('gulp'),
    plugins = require('gulp-load-plugins')(),
    mainBowerFiles = require('main-bower-files'),
    del = require('del');


//// GULP ASSESTS BUILDING ////
var isProduction = plugins.util.env.prod,
    debug        = plugins.util.env.debug;

// TODO: Fix the destination paths to point directly to 'public/client/'
// TODO: Fix script watchers being fired on 'gulp watch'
var paths = {
  clean: ['public/client/'],
  bower: {
    bowerFile: ['client/*/bower.json'],
    src: 'client/',
    dest: 'public/client/',
    fileJs: 'vendor.js',
    fileCss: 'vendor.css'
  },
  scripts: {
    src: getFolders('client/'),
    dest: 'public/',
    file: 'main.js',
    glob: 'src/**/*.js',
    watch: watchFolders('client/', 'src/**/*.js')
  },
  html: {
    src: getFolders('client/'),
    dest: 'public/',
    glob: 'src/**/*.html',
    watch: watchFolders('client/', 'src/**/*.html')
  },
  styles: {
    src: getFolders('client/'),
    dest: 'public/',
    main: 'app.styl',
    glob: 'src/**/*.styl',
    watch: watchFolders('client/', 'src/**/*.styl')
  },
  static: {
    html: {
      src: 'client/common/*.html',
      dest: 'public/client/'
    },
    fonts: {
      src: ['client/common/bower_components/bootstrap/fonts/*'],
      dest: 'public/client/fonts/',
    }
  }
};

function getFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    }).map(function(folder) {
      return dir + folder + '/';
    });
}

function watchFolders(dir, glob){
  return fs.readdirSync(dir)
    .filter(function(file) {
      return fs.statSync(path.join(dir, file)).isDirectory();
    }).map(function(folder) {
      return dir + folder + '/' + glob;
    });
}


gulp.task('default', ['build']);

if (isProduction)
  gulp.task('build', plugins.sequence('clean', 'bower', 'scripts', 'html', ['static', 'styles'], 'rev'));
else
  gulp.task('build', plugins.sequence('clean', 'bower', 'scripts', 'html', ['static', 'styles']));

gulp.task('watch', ['build'], function() {
  plugins.livereload.listen();
  gulp.watch(paths.scripts.watch, ['scripts']);
  gulp.watch(paths.html.watch, ['html']);
  gulp.watch(paths.styles.watch, ['styles']);
});

gulp.task('clean', clean(paths.clean));
function clean(paths) {
  return function() {
    return del(paths);
  };
}

gulp.task('static', ['html:static', 'fonts']);
gulp.task('html:static', static(paths.static.html));
gulp.task('fonts', static(paths.static.fonts));
function static(paths) {
  return function() {
    return gulp.src(paths.src)
      .pipe(gulp.dest(paths.dest))
      .pipe(plugins.livereload());
  };
}

gulp.task('bower:install', function() {
  return gulp.src(paths.bower.bowerFile).pipe(plugins.install());
});

gulp.task('bower', ['bower:install'], function() {
  var folders = getBowerFolders(paths.bower.src);
  folders.map(function(folder) {
    return gulp.src(mainBowerFiles({
      paths: path.join(paths.bower.src, folder),
      filter: '**/*.js'
    })).pipe(plugins.concat(paths.bower.fileJs))
    .pipe(plugins.size({ showFiles: true }))
    .pipe(gulp.dest(path.join(paths.bower.dest, folder)));
  });
  folders.map(function(folder) {
    return gulp.src(mainBowerFiles({
        paths: path.join(paths.bower.src, folder),
        filter: '**/*.css'
      }))
      .pipe(plugins.concat(paths.bower.fileCss))
      .pipe(plugins.size({ showFiles: true }))
      .pipe(gulp.dest(path.join(paths.bower.dest, folder)));
  });
});

function getBowerFolders(dir) {
  return fs.readdirSync(dir)
    .filter(function(file) {
      try {
        return fs.statSync(path.join(dir, file)).isDirectory() && fs.statSync(path.join(dir, file, 'bower_components')).isDirectory();
      } catch (e) {
        return false;
      }
    });
}

gulp.task('scripts', scripts(paths.scripts));
function scripts(paths) {
  return function() {
    paths.src.map(function(path) {
      return gulp.src(path + paths.glob)
        .pipe(plugins.if(debug,
          plugins.debug({ title: 'Scripts' })
        ))
        .pipe(plugins.if(!isProduction,
          plugins.sourcemaps.init()
        ))
        .pipe(plugins.plumber({ errorHandler: plugins.notify.onError("Error: <%= error.message %>") }))
        .pipe(plugins.babel({
            blacklist: ["strict"]
          })
        )
        .pipe(plugins.angularFilesort())
        .pipe(plugins.concat(paths.file))
        .pipe(plugins.if(isProduction,
          plugins.uglify({ mangle: false })
        ))
        .pipe(plugins.if(!isProduction,
          plugins.sourcemaps.write('.')
        ))
        .pipe(plugins.size({ showFiles: true }))
        .pipe(gulp.dest(paths.dest + path))
        // .pipe(plugins.ignore.exclude('**/*.map'))
        .pipe(plugins.livereload());
    });
  };
}

gulp.task('html', html(paths.html));
function html(paths){
  return function() {
    paths.src.map(function(path) {
      return gulp.src(path + paths.glob)
        .pipe(plugins.angularTemplatecache())
        .pipe(gulp.dest(paths.dest + path));
    });
  };
}

gulp.task('styles', styles(paths.styles));
function styles(paths) {
  return function() {
    paths.src.map(function(path) {
      return gulp.src(path + paths.main)
        .pipe(plugins.if(debug,
          plugins.debug({ title: 'Styles' })
        ))
        .pipe(plugins.if(!isProduction,
          plugins.sourcemaps.init()
        ))
        .pipe(plugins.plumber({ errorHandler: plugins.notify.onError("Error: <%= error.message %>\n<%= error.fileName %>:<%= error.lineNumber %>") }))
        .pipe(plugins.stylus({}))
        .pipe(plugins.if(!isProduction,
          plugins.sourcemaps.write('.')
        ))
        .pipe(plugins.size({ showFiles: true }))
        .pipe(gulp.dest(paths.dest + path))
        // .pipe(plugins.ignore.exclude('**/*.map'))
        .pipe(plugins.livereload());
    });
  };
}
