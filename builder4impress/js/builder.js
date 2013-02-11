Builder=(function(){
  var state={
    editing:false,
    $node:false,
    data:{
      x:0,
      y:0,
      rotate:0,
      scale:0
    }
  },
  config={
    rotateStep:1,
    scaleStep:0.1,
    visualScaling:10,
    redrawFunction:false,
    setTransformationCallback:false
  },
  defaults={
    x:0,
    y:0,
    rotate:0,
    scale:1
  },
  mouse={
    prevX:false,
    prevY:false,
    activeFunction:false
  },
  handlers={},
  redrawTimeout,
  //nodes
  $menu,$controls,$impress,$overview;

  handlers.move=function(x,y){

    var v=fixVector(x,y);

    state.data.x = (state.data.x)? (state.data.x)+v.x : v.x;
    state.data.y = (state.data.y)? (state.data.y)+v.y : v.y;
  };
  handlers.scale=function(x){
    state.data.scale-= -x * config.scaleStep*config.visualScaling/10;
  };
  handlers.rotate=function(x){
    console.log(state.rotate);
    state.data.rotate-= -x*config.rotateStep;
  };


  function init(conf){
    config=$.extend(config,conf);

    if(config.setTransformationCallback){
      config.setTransformationCallback(function(x){
        // guess what, it indicates slide change too :)
        $controls.hide();

        //setting pu movement scale
        config.visualScaling=x.scale;
        console.log(x.scale);
      //TODO: implement rotation handling for move
        config.rotation=~~(x.rotate.z);
        console.log('rotate',x.rotate.z);
      //I don't see why I should need translation right now, but who knows...
      })
    }

    $impress=$('#impress');
    $overview=$('#overview');

    $menu=$('<div></div>').addClass('builder-main');
    $('<div></div>').addClass('builder-bt bt-add').appendTo($menu).on('click',addSlide);
    $('<div></div>').addClass('builder-bt bt-overview').appendTo($menu).on('click',function(){
      config['goto']('overview');
    });
    $('<div></div>').addClass('builder-bt bt-download').appendTo($menu).on('click',downloadResults);


    $menu.appendTo('body');


    $controls=$('<div></div>').addClass('builder-controls').hide();

    $('<div></div>').addClass('bt-move').attr('title','Move').attr('funct','move').appendTo($controls);
    $('<div></div>').addClass('bt-rotate').attr('title','Rotate').attr('funct','rotate').appendTo($controls);
    $('<div></div>').addClass('bt-scale').attr('title','Scale').attr('funct','scale').appendTo($controls);

    $('<span></span>').addClass('builder-bt').text('Src').appendTo($controls).click(editHTML);
    $('<span></span>').addClass('builder-bt').text('Wrap').appendTo($controls).click(wrapContents);
    $('<span></span>').addClass('builder-bt').text('Dims').appendTo($controls).click(showDimensions);
    $('<span></span>').addClass('builder-bt').text('Edit').appendTo($controls).click(editContent);

    var showTimer;

    $controls.appendTo('body').on('mousedown','div',function(e){
      e.preventDefault();
      mouse.activeFunction=handlers[$(this).attr('funct')];
      loadData();
      mouse.prevX=e.pageX;
      mouse.prevY=e.pageY;
      $(document).on('mousemove.handler1',handleMouseMove);
      return false;
    }).on('mouseenter',function(){
      clearTimeout(showTimer);
    });
    $(document).on('mouseup',function(){
      mouse.activeFunction=false;
      $(document).off('mousemove.handler1');
    });

    $('body').on('mouseenter','.step',function(){
      var $t=$(this);
      showTimer=setTimeout(function(){
        if(!mouse.activeFunction){
          //show controls
          state.$node=$t;
          showControls(state.$node);
        }
      },500);
      $t.data('showTimer',showTimer);
    }).on('mouseleave','.step',function(){
      //not showing when not staying
      clearTimeout($(this).data('showTimer'));
    });

    // $(window).on('beforeunload',function(){ return 'All changes will be lost'; });

    config['goto']('start');


  }

  var sequence = (function(){
    var s=2;
    return function(){
      return s++;
    }
  })()

  function addSlide(){
    //query slide id
    var id,$step;
    id='builderAutoSlide'+sequence();
    $step=$('<div></div>').addClass('step builder-justcreated').html('<h1>This is a new step. </h1> How about some contents?');
    $step[0].id=id;
    $step[0].dataset.scale=3;
    $step.insertAfter($('.step:last')); //not too performant, but future proof
    config.creationFunction($step[0]);
    // jump to the overview slide to make some room to look around
    config['goto']('overview');
  }

  function downloadResults(){
    var uriContent,content,$doc;
    $doc=$(document.documentElement).clone();
    //remove all current transforms
    $doc.find('.step, body, #impress, #impress>div').removeAttr('style');
    //remove builder gui elements
    $doc.find('.builder-controls, .builder-main').remove();
    //remove aloha-related cruft
    $doc.removeAttr("class");
    $doc.find(".aloha-editable-highlight").removeClass("aloha-editable-highlight");
    $doc.find(".aloha-editable").removeClass("aloha-editable");
    $doc.find('.aloha, .aloha-ui, .aloha-toolbar, .aloha-sidebar-bar').remove();
    $doc.find('script[data-requirecontext=aloha]').remove();
    $doc.find("[contenteditable]").removeAttr("contenteditable");
    //remove impress.js-added classes
    $doc.find('*').removeClass("future active present past earlier later current");
    //remove impress.js-added ids
    $doc.find("[id^=step-]").removeAttr("id");
    //remove LESS-added style tags
    $doc.find("style[id^=less]").remove();
    // remove default scale values
    $doc.find("[data-scale=1]").removeAttr("data-scale");
    // remove default rotate values
    $doc.find("[data-rotate=0]").removeAttr("data-rotate");
    //add impress.js base class
    $doc.find('body').attr('class','impress-not-supported');
    while (true) {
      var impresshtml = $doc.find("#impress > div").not(".step").html();
      if (!impresshtml) break;
      $doc.find("#impress").html(impresshtml);
    }
    content="<!doctype html>\n\n" + $doc[0].outerHTML;
    content = content.replace('<style type="text/css"></style>', '');
    var blob = new Blob([content], {type: "text/html;charset=utf-8"});
    saveAs(blob, "index.html");

  }

  function editHTML() {
    var $t = $(this);
    if(state.editing===true){
      state.editing=false;
      state.$node.html($t.parent().find('textarea').val());
      state.$node.removeClass('builder-justcreated');
      $t.parent().find('textarea').remove();
      $t.text('Src');
    }else{
      var $txt=$('<textarea>').on('keydown keyup',function(e){
        e.stopPropagation();
      });
      $t.text('OK');
      state.editing=true;
      $t.after($txt.val(state.$node.html()));
    }
  }

  function editContent() {
    var $t = $(this);
    if(state.editing===true){
      state.editing=false;
      state.$node.mahalo();
      $t.text('Edit');
    }else{
      state.$node.on('keydown keyup',function(e){
        e.stopPropagation();
      });
      $t.text('OK');
      state.editing=true;
      state.$node.aloha();
    }
  }

  function showDimensions() {
    var $t = $(this);
    if(state.editing===true){
      state.editing=false;
      state.$node.removeClass('builder-justcreated');
      $t.parent().find('textarea').remove();
      $t.text('Dims');
    }else{
      var $txt=$('<textarea>').on('keydown keyup',function(e){
        e.stopPropagation();
      });
      $t.text('OK');
      state.editing=true;
      var $div = $(state.$node[0].outerHTML).html("");
      $div.removeAttr("style").removeAttr("class");
      $t.after($txt.val($div[0].outerHTML));
    }
  }

  function wrapContents() {
    state.$node.toggleClass('slide');
  }

  function showControls($where){
    var top,left,pos=$where.offset();
    //not going out the edges (at least one way)
    top=(pos.top>0)? pos.top+(100/config.visualScaling) : 0;
    left=(pos.left>0)? pos.left+(100/config.visualScaling) : 0;

    $controls.show().offset({
      top:top,
      left:left
    });
  }


  function loadData(){
    console.log('load',state.$node[0].dataset.x);
    //state.data=state.$node[0].dataset;
    //add defaults


    state.data.x=parseFloat(state.$node[0].dataset.x) || defaults.x;
    state.data.y=parseFloat(state.$node[0].dataset.y) || defaults.y;
    state.data.scale=parseFloat(state.$node[0].dataset.scale) || defaults.scale;
    state.data.rotate=parseFloat(state.$node[0].dataset.rotate) || defaults.rotate;

  }

  function redraw(){
    clearTimeout(redrawTimeout);
    redrawTimeout=setTimeout(function(){
      //state.$node[0].dataset=state.data;

      state.$node[0].dataset.scale=state.data.scale;
      state.$node[0].dataset.rotate=state.data.rotate;
      state.$node[0].dataset.x=state.data.x;
      state.$node[0].dataset.y=state.data.y;
      /**/
      console.log(state.data,state.$node[0].dataset,state.$node[0].dataset===state.data);

      config.redrawFunction(state.$node[0]);
      showControls(state.$node);
    //console.log(['redrawn',state.$node[0].dataset]);
    },20);
  }

  function fixVector(x,y){
    var result={x:0,y:0},
      angle=(config.rotation/180)*Math.PI,
      cs=Math.cos(angle),
      sn=Math.sin(angle);

    result.x = (x*cs - y*sn) * config.visualScaling;
    result.y = (x*sn + y*cs) * config.visualScaling;
    return result;
  }

  function handleMouseMove(e){
    e.preventDefault();
    e.stopPropagation();


    var x=e.pageX-mouse.prevX,
    y=e.pageY-mouse.prevY;

    mouse.prevX=e.pageX;
    mouse.prevY=e.pageY;
    if(mouse.activeFunction){
      mouse.activeFunction(x,y);
      redraw();
    }

    return false;
  }

  return {
    init:init
  };

})();
