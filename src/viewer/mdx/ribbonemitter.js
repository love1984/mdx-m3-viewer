// Copyright (c) 2013 Chananya Freiman (aka GhostWolf)

function RibbonEmitter(emitter, materials, model) {
  var i, l;
  var keys = Object.keys(emitter);
  
  for (i = keys.length; i--;) {
    this[keys[i]] = emitter[keys[i]];
  }
  
  var ribbons = Math.ceil(this.emissionRate * this.lifespan);
  
  this.maxRibbons = ribbons;
  this.model = model;
  this.lastCreation = 0;
  this.ribbons = [];
  this.data = new Float32Array(ribbons  * 10);
  this.buffer = ctx.createBuffer();
  
  ctx.bindBuffer(ctx.ARRAY_BUFFER, this.buffer);
  ctx.bufferData(ctx.ARRAY_BUFFER, this.data, ctx.DYNAMIC_DRAW);
  
  this.cellWidth = 1 / this.columns;
  this.cellHeight = 1 / this.rows;
  
  var groups = [[], [], [], []];
  var layers = materials[this.materialId].layers;
        
  for (i = 0, l = layers.length; i < l; i++) {
    var layer = new Layer(layers[i], 0);
    
    groups[layer.renderOrder].push(layer);
  }
      
  this.layers = groups[0].concat(groups[1]).concat(groups[2]).concat(groups[3]);
}

RibbonEmitter.prototype = {
  update: function (allowCreate) {
    for (var i = 0, l = this.ribbons.length; i < l; i++) {
      this.ribbons[i].update(this);
    }
    
    while (this.ribbons.length > 0 && this.ribbons[0].health <= 0) {
      this.ribbons.shift();
    }
    
    if (allowCreate && this.shouldRender()) {
      this.lastCreation += 1 * ANIMATION_SCALE;
      
      var amount = Math.floor((this.emissionRate * FRAME_TIME) / (1 / this.lastCreation));
      
      if (amount > 0) {
        this.lastCreation = 0;
        
        for (; amount--;) {
          this.ribbons.push(new Ribbon(this, this.model));
        }
      }
    }
  },
  
  render: function () {
    var i, l;
    var ribbons = Math.min(this.ribbons.length, this.maxRibbons);
    
    if (ribbons > 2) {
      var textureSlot = getTrack(this.tracks.textureSlot, 0, this.model);
      //var uvOffsetX = (textureSlot % this.columns) / this.columns;
      var uvOffsetY = (Math.floor(textureSlot / this.rows) - 1) / this.rows;
      var uvFactor = 1 / ribbons * this.cellWidth;
      var top = uvOffsetY;
      var bottom = uvOffsetY + this.cellHeight;
      var data = this.data;
      
      for (i = 0, l = ribbons; i < l; i++) {
        var index = i * 10;
        var ribbon = this.ribbons[i];
        var left = (ribbons - i) * uvFactor;
        var right = left - uvFactor;
        var v1 = ribbon.p2;
        var v2 = ribbon.p1;
      
        data[index + 0] = v1[0];
        data[index + 1] = v1[1];
        data[index + 2] = v1[2];
        data[index + 3] = left;
        data[index + 4] = top;
        
        data[index + 5] = v2[0];
        data[index + 6] = v2[1];
        data[index + 7] = v2[2];
        data[index + 8] = right;
        data[index + 9] = bottom;
      }
      
      ctx.bindBuffer(ctx.ARRAY_BUFFER, this.buffer);
      ctx.bufferSubData(ctx.ARRAY_BUFFER, 0, this.data);
      
      gl.vertexAttribPointer("a_position", 3, ctx.FLOAT, false, 20, 0);
      gl.vertexAttribPointer("a_uv", 2, ctx.FLOAT, false, 20, 12);
      
      for (i = 0, l = this.layers.length; i < l; i++) {
        var layer = this.layers[i];
        
        if (layer.shouldRender()) {
          var modifier = [1, 1, 1, 1];
          var uvoffset = [0 ,0];
          
          layer.setMaterial();
          
          gl.bindTexture(model.textures[Math.floor(getTrack(layer.tracks.textureId, layer.textureId, this.model))].fileName, 0);
          
          var color = getTrack(this.tracks.color, this.color, this.model);
          var alpha = getTrack(this.tracks.alpha, this.alpha, this.model);
          
          modifier[0] = color[0];
          modifier[1] = color[1];
          modifier[2] = color[2];
          modifier[3] = alpha;
          
          gl.setParameter("u_modifier", modifier);
          
          if (layer.textureAnimationId !== 4294967295 && this.model.textureAnimations) {
            var textureAnimation = this.model.textureAnimations[layer.textureAnimationId];
            // What is Z used for?
            var v = getTrack(textureAnimation.tracks.translation, [0, 0, 0], this.model);
            
            uvoffset[0] = v[0];
            uvoffset[1] = v[1];
          }
          
          gl.setParameter("u_uv_offset", uvoffset);
          
          gl.setParameter("u_type", [0, 0, 0]);
          
          ctx.drawArrays(ctx.TRIANGLE_STRIP, 0, ribbons * 2);
        }
      }
    }
  },
  
  shouldRender: function () {
    return (getTrack(this.tracks.visibility, 1, this.model) > 0.1);
  }
};