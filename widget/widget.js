
(function(socketAddress, containerId, wantedKeys) {
/*!
  * $script.js Async loader & dependency manager
  * https://github.com/ded/script.js
  * (c) Dustin Diaz 2013
  * License: MIT
  */
(function(e,t,n){typeof module!="undefined"&&module.exports?module.exports=n():typeof define=="function"&&define.amd?define(n):t[e]=n()})("$script",this,function(){function v(e,t){for(var n=0,r=e.length;n<r;++n)if(!t(e[n]))return f;return 1}function m(e,t){v(e,function(e){return!t(e)})}function g(e,t,a){function d(e){return e.call?e():r[e]}function b(){if(!--p){r[h]=1,c&&c();for(var e in s)v(e.split("|"),d)&&!m(s[e],d)&&(s[e]=[])}}e=e[l]?e:[e];var f=t&&t.call,c=f?t:a,h=f?e.join(""):t,p=e.length;return setTimeout(function(){m(e,function(e){if(e===null)return b();if(u[e])return h&&(i[h]=1),u[e]==2&&b();u[e]=1,h&&(i[h]=1),y(!n.test(e)&&o?o+e+".js":e,b)})},0),g}function y(n,r){var i=e.createElement("script"),s=f;i.onload=i.onerror=i[d]=function(){if(i[h]&&!/^c|loade/.test(i[h])||s)return;i.onload=i[d]=null,s=1,u[n]=2,r()},i.async=1,i.src=n,t.insertBefore(i,t.firstChild)}var e=document,t=e.getElementsByTagName("head")[0],n=/^https?:\/\//,r={},i={},s={},o,u={},a="string",f=!1,l="push",c="DOMContentLoaded",h="readyState",p="addEventListener",d="onreadystatechange";return!e[h]&&e[p]&&(e[p](c,function b(){e.removeEventListener(c,b,f),e[h]="complete"},f),e[h]="loading"),g.get=y,g.order=function(e,t,n){(function r(i){i=e.shift(),e.length?g(i,r):g(i,t,n)})()},g.path=function(e){o=e},g.ready=function(e,t,n){e=e[l]?e:[e];var i=[];return!m(e,function(e){r[e]||i[l](e)})&&v(e,function(e){return r[e]})?t():!function(e){s[e]=s[e]||[],s[e][l](t),n&&n(i)}(e.join("|")),g},g.done=function(e){g([null],e)},g});

  $script.path(socketAddress);
  $script([ "socket.io/socket.io", "bower_components/jquery/jquery", "bower_components/handlebars/handlebars" ], 'base');
  $script.ready('base', function() { $script([ "bower_components/flot/jquery.flot" ], 'flot'); });
  $script.ready('flot', function() { $script(["bower_components/flot/jquery.flot.time", "bower_components/flot/jquery.flot.canvas"], 'flotPlugins'); });
  $script.ready('flotPlugins', function() {
    var template = Handlebars.compile(
      '<div class="well span3" id="{{key}}">'
       +   '<p class="lead">{{key}}</p>'
       +   '{{#each chunks}}'
       +     '<div id="{{../key}}_{{@key}}" style="height:200px;"/>'
       +   '{{/each}}'
       + '</div>'
    );

    var dataView = function(chunks, gran) {
      var total = chunks.reduce(function(sum, c) { return sum + c[1]; }, 0);
      return [{
        data: chunks,
        lines: { show: true, fill: true },
        label: gran + " (" + total + ")"
      }];
    };

    var plots = {};
    var updateDOM = function(data) {
      var key = data.key;
      Object.keys(data.chunks).forEach(function(gran) {
        plots[key] = plots[key] || {};
        plots[key][gran] = $.plot("#"+key+"_"+gran,
          dataView(data.chunks[gran], gran), {
            canvas:true,
            xaxis: {mode: 'time', ticks: 2},
            yaxis: {min: 0}
          });
      });
    };

    /* Notify server about keys we're interested in */
    var notify = function() {
      this.emit('stats', wantedKeys);
    };

    io.connect(socketAddress)
      .on('connect', notify)
      .on('reconnect', notify)
      .on('stats', function(data) {
        if (!$.isEmptyObject(data)) {
        // Update existing plots or render
        // new stats containers for new keys
        Object.keys(data).forEach(function(key) {
          if (!plots[key]) {
            $('#'+containerId+' em').remove();
            var view = { key: key, chunks: data[key] };
            $('#'+containerId).append(template(view));
            updateDOM(view);
          } else {
            Object.keys(data[key]).forEach(function(gran) {
              plots[key][gran].setData(dataView(data[key][gran], gran));
              plots[key][gran].setupGrid();
              plots[key][gran].draw();
            });
          }
        });

        // Remove stats containers which are no longer tracked
        Object.keys(plots).forEach(function(key) {
          if (!data[key]) {
            $('#'+key).remove();
            delete plots[key];
          }
        });
      } else {
        $('#'+containerId).html('<em>(no data yet)</em>');
        plots = {};
      }
    });
  });
})("%socket_address%", "%container_id%", "%wanted_keys%");
