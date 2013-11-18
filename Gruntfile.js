
module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-express-server');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.initConfig({
    express: {
      dev: {
        options: {
          script: 'src/server.js'
        }
      }
    },

    watch: {
      express: {
        files:  [ 'src/*.js', 'widget/widget.js', 'Gruntfile.js' ],
        tasks:  [ 'express:dev' ],
        options: {
          nospawn: true //Without this option specified express won't be reloaded
        }
      }
    }
  });

  grunt.registerTask('default', ['express:dev', 'watch']);
};
