//VoilaVideo, Copyright (c) 2010 Faruk Can Bilir, MIT Style License.

var VoilaVideo = new Class({
  options: {
    autoplay: true,
    thumbWidth: 200,
    playButton: 'img/play.png'
  },
  initialize: function (els, options) {
    $extend(this.options, options);
    var optsAlias = {};
    var test = [];
    $H(this.options).each(function(value, key) {
     if ($type(value) != 'object') optsAlias[key]=value;
    }, this);
    var aFunc, tFunc;
    this.specs.each(function(spec) {
      aFunc = tFunc = null;
      if($type(spec.autoplay)=='function') aFunc = spec.autoplay;
      if($type(spec.thumb)=='function') tFunc = spec.thumb;
      if(optsAlias)
        $extend(spec, optsAlias);
      if(this.options.specs && this.options.specs[spec.name])
        $extend(spec, this.options.specs[spec.name]);
      if(this.specPresets[spec.type])
        $extend(spec, $merge(this.specPresets[spec.type], spec));
      if(aFunc) spec.autoplayFunc = aFunc;
      if(tFunc && spec.thumb) spec.thumb = tFunc;
      test.push(spec.name);
    }, this);
    $H(this.options.specs).each(function(value, key){
      if (test.indexOf(key)==-1) {
        value.name = key;
        $extend(value, $merge(this.specPresets[value.type], value));
        if(this.options.autoplay==false) value.autoplay = false;
        if(this.options.thumb==false) value.thumb = false;
        this.specs.push(value);
      }
    }, this);
    els.each(function (el) {
      el = this.createThumb(el);
      el.addEvent('click', function(e) {
        e.stop();
        this.createVideo(el);
      }.bind(this));
    }, this);
  },
  createVideo: function (el) {
    var matches = null;
    el.get('class').split(' ').each(function(className){
      if(matches = className.match(/^([0-9]+)-([0-9]+)$/)) {
        el.store('width', matches[1]);
        el.store('height', matches[2]);
      }
      if(matches = className.match(/^(autoplay)-(true|false)$/)) {
        el.store('autoplay', (matches[2]=='true') ? true : false);
      }
    }, this);
    this.specs.each(function (value) {
      if (el.get('href').contains(value.base)) {
        var clone = $unlink(value);
        var uri = new URI(el.get('href'));
        clone.id = ($type(clone.id)=='function') ? clone.id(uri) : uri.getData(clone.id);
        clone.src = ($type(clone.src)=='function') ? clone.src(uri) : clone.src.substitute({id: clone.id});
        if ((clone.autoplay && el.retrieve('autoplay')!=false) || el.retrieve('autoplay')==true)
          (clone.autoplayFunc) ? clone.autoplayFunc(uri) : clone.src += '&autoplay=1';
        clone.width = el.retrieve('width') || clone.width;
        clone.height = el.retrieve('height') || clone.height;
        switch (clone.type) {
          case 'flash':
            (el.getParent().hasClass('vv-wrapper')) ? this.createFlash(clone).inject(el.getParent().empty()) : this.createFlash(clone).replaces(el);
            break;
          case 'frame':
            (el.getParent().hasClass('vv-wrapper')) ? this.createFrame(clone).inject(el.getParent().empty()) : this.createFrame(clone).replaces(el);
            break;
          default:
            (el.getParent().hasClass('vv-wrapper')) ? this.createCustom(clone).inject(el.getParent().empty()) : this.createCustom(clone).replaces(el);
            break;
        }
      }
    }, this);
  },
  createFlash: function(obj) {
    var video = new Swiff(obj.src, {
      width: obj.width,
      height: obj.height,
      params: obj.params,
      vars: obj.vars
    });
    return video;
  },
  createFrame: function(obj) {
    var video = new Element('iframe', {
      'src': obj.src,
      'width': obj.width,
      'height': obj.height,
      'frameborder': 0
    });
    return video;
  },
  createCustom: function(obj) {
    var video = new Element(obj.type, {
      'src': obj.src,
      'width': obj.width,
      'height': obj.height
    });
    video.setProperties(obj.properties);
    return video;
  },
  createThumb: function(el) {
    var src = null;
    var id = null;
    var thumbWidth = null;
    var wrapper = null;
    var uri = new URI(el.get('href'));
    this.specs.each(function (value) {
      if (el.get('href').contains(value.base) && value.thumb) {
        id = ($type(value.id)=='function') ? value.id(uri) : uri.getData(value.id);
        src = ($type(value.thumb)=='function') ? value.thumb(uri) : value.thumb.substitute({id: id});
        thumbWidth = value.thumbWidth;
      }
    }, this);
    if (src) {
      var wrapper = new Element('div', {
        'id': 'vv_'+$time(),
        'class': 'vv-wrapper'
      });
      var thumb = new Element('div', {
        'class': 'vv-thumb',
        'events': {
          'click': function (e) { el.fireEvent('click', e); }
        },
        'styles': {
          'position': 'relative'
        }
      });
      var play = new Element('img', {
        'src': this.options.playButton,
        'styles': {
          'position': 'absolute',
          'left': 0,
          'bottom': 0,
          'visibility': 'hidden'
        }
      });
      var img = new Element('img', {
        'class': 'vv-img',
        'src': src,
        'events': {
          'load': function() {
            var thumbSize = this.getSize();
            thumb.setStyles({
              'width': thumbSize.x,
              'height': thumbSize.y
            });
            play.setStyle('visibility', 'visible');
          }
        },
        'styles': {
          'position': 'absolute',
          'width': thumbWidth,
          'height': 'auto'
        }
      });

      wrapper.wraps(el.addClass('vv-link'));
      img.inject(thumb);
      play.inject(thumb.inject(wrapper));

    }
    return (wrapper) ? $(wrapper.getChildren()[0]) : $(el);
  },
  specPresets: {
    flash: {
      width: 400,
      height: 300,
      params: {
            allowFullScreen: 'true',
            allowScriptAccess: 'always'
      },
      vars: {}
    },
    frame: {
      width: 400,
      height: 300
    }
  },
  specs: [
    {
      name: 'youtube',
      base: 'youtube.com',
      type: 'flash',
      id: 'v',
      src: 'http://www.youtube.com/v/{id}?fs=1',
      thumb: 'http://img.youtube.com/vi/{id}/0.jpg'
    },
    {
      name: 'googlevideo',
      base: 'video.google.com',
      type: 'flash',
      id: 'docid',
      src: 'http://video.google.com/googleplayer.swf?docid={id}&fs=true',
      thumb: 'thumbs.php?s=googlevideo&id={id}'
    },
    {
      name: 'dailymotion',
      base: 'dailymotion.com',
      type: 'flash',
      id: function(uri) { return uri.get('file'); },
      src: 'http://www.dailymotion.com/swf/video/{id}?additionalInfos=0',
      thumb: 'http://www.dailymotion.com/thumbnail/160x120/video/{id}'
    },
    {
      name: 'metacafe',
      base: 'metacafe.com',
      type: 'flash',
      id: function(uri) {
        var res = uri.get('directory').split('/');
        return res[2]+'/'+res[3]; 
      },
      src: 'http://www.metacafe.com/fplayer/{id}.swf',
      thumb: function(uri) {
        var res = uri.get('directory').split('/');
        return 'http://www.metacafe.com/thumb/'+res[2]+'.jpg'; 
      },
      autoplay: function() {
        this['vars']['playerVars'] = 'showStats=yes|autoPlay=yes';
      }
    },
    {
      name: 'vimeo',
      base: 'vimeo.com',
      type: 'frame',
      id: function(uri) { return uri.get('file'); },
      src: 'http://player.vimeo.com/video/{id}?',
      thumb: 'thumbs.php?s=vimeo&id={id}'
    }
  ]
});