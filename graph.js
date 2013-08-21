function SingleAxisGraph(options_orig) {
  var self = this;
  var zoomDragging = false;
  var zoomStart = 0;

  var defaults = {
    width: 960,
    height: 500,
    margin: 60,
    graphLocation: "#graph",
    addSeriesLocation: ".add-series",
    data: [],
    series: {
      lock: true
    },
    tooltip: {
      on: true
    },
    legend: {
      on: true,
      target: '.legend'
    },
    xTickLabel: {
      type: 'number',
      start: 0
    },
    axisLabels: {
      x: 'Time',
      y: 'Score'
    },
    term: 'Default'
  };

  this.options = _.defaults(options_orig, defaults);

  this.graph = function() {
    var graph = this.addSeriesGraph(this.options.data.orig, this.options.width, this.options.height, this.options.term)
    return graph;
  };

  this.setupGraph = function(w, h) {
    var vis = d3.select(this.options.graphLocation)
      .append('svg:svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .attr('class', 'series-graph')
    return vis;
  };

  this.addSeriesGraph = function(data, w, h, term) {
    $(this.options.graphLocation).empty();
    var vis = this.setupGraph(w, h);
    var graph = this.drawGraph(this.options.data, w, h, vis, term);
    return graph;
  };

  this.initDrawingArea = function(vis) {
    return vis.append("svg:g")
      .attr("transform", "translate(0, "+this.options.height+")")
      .attr("class", "main-graph-group");
  };

  this.max = function() {
    var merged = d3.merge(d3.merge(this.options.data));
    return d3.max(merged);
  }

  this.min = function() {
    var merged = d3.merge(d3.merge(this.options.data));
    return d3.min(merged);
  }


  this.y = d3.scale.linear().domain([self.min(), self.max()]).range([this.options.height - 10, 10 + this.options.margin]);

  this.x = d3.scale.linear().domain([0, this.options.data[0].length - 1]).range([this.options.margin, this.options.width - this.options.margin]);

  this.yAxis = d3.svg.axis().scale(this.y).ticks(6).orient('left')
    .tickFormat(function(d, i) { return $.humanizeNumber(d); });

  this.line = d3.svg.line()
    .x(function(d,i) { return self.x(i); })
    .y(function(d) { return self.y(d); })
    .interpolate('linear')

  this.drawZoomBar = function(mouseX) {
    var g = d3.select('.main-graph-group');

    g.append('svg:line')
      .attr('class', 'zoomStartLine')
      .attr('x1', mouseX)
      .attr('x2', mouseX)
      .attr('y1', -self.options.margin)
      .attr('y2', -self.options.height)
      .attr('fill', '#999999')
      .attr('stroke', 1);
  }

  this.initEvents = function() {
    var g = d3.select(self.options.graphLocation+' .main-graph-group');

    d3.select('text').on('dragstart', function() {
      return false;
    });

    g.on('mousedown', function() {
      zoomStart = d3.mouse(this)[0];
      self.drawZoomBar(zoomStart);
      zoomDragging = true;
    });

    g.on('mouseup', function() {
      zoomDragging = false;
      var rect = d3.select('.zoomRect')
      var selection = [zoomStart, parseInt(rect.attr('width')) + zoomStart];

      d3.select('.zoomStartLine').remove();

      var data = [];
      d3.selectAll(self.options.graphLocation+' circle').each(function(d, i) {
	if(d3.select(this).attr('cx') > selection[0] && d3.select(this).attr('cx') < selection[1]) {
	  data.push(parseInt(d3.select(this).attr('num')));
	}

      });

      self.y.domain([d3.min(data), d3.max(data)])
      self.x.domain([0, data.length-1])
      d3.select(self.options.graphLocation+' path')
	.transition()
	.duration(2000)
	.attr('d', self.line(data));
      d3.select(self.options.graphLocation+' .y_axis')
	.transition()
	.duration(2000)
	.call(self.yAxis);
    });

    g.on('mousemove', function() {
      d3.select('.zoomHoverLine')
	.attr('x1', d3.mouse(this)[0])
	.attr('x2', d3.mouse(this)[0])
	.attr('style', 'display:block');

      if(zoomDragging) {
	g.select('.zoomRect')
	  .attr('x', zoomStart)
	  .attr('y', -1 * self.options.height)
	  .attr('width', d3.mouse(this)[0] - zoomStart)
	  .attr("height", self.options.height - self.options.margin)
	  .attr("style", "display:block")
      } else {
	g.select('.zoomRect')
	  .attr("style", "display:none")
      }
    });

    g.on('mouseout', function() {
      d3.select('.zoomHoverLine')
	.attr('style', 'display:none');
    });
  }

  this.drawLine = function(i, data) {
    d3.select(self.options.graphLocation+' .main-graph-group').append("svg:path")
      .attr("d", this.line(data[i]))
      .style('stroke-width', 2)
      .style('stroke', 'black')
      .attr('class', 'series-'+i)
      .style('fill', 'none')
      .attr('transform', 'translate(0, '+(-self.options.height-self.options.margin+10)+')');
  }

  this.drawCircles = function(i, data) {
    d3.selectAll(self.options.graphLocation+' .series-graph')
      .selectAll('.circle-'+i)
      .data(data[i])
      .enter().append('circle')
      .attr('class', 'circle-'+i)
      .attr('cx', function(d, i) { return self.x(i) })
      .attr('cy', function(d) { return self.y(d) - self.options.margin + 10})
      .attr('r', 4)
      .attr('num', function(d, i) { return d })
      .style('fill', 'black')
      .on("mouseover", function(){
	d3.select(this).attr('r', 6);
	if(self.options.tooltip.on) {
	  var y = $(this).offset().top - 10,
	  x = $(this).offset().left + 20;
	  var num = $(this).attr('num');
	  $('body').prepend('<div class="graph-tooltip" style="position: absolute; top:'+y+'px;left:'+x+'px; z-index: 2;">'+Utils.addCommas(num)+'</div>');
	}
      })
      .on("mouseout", function(){
	d3.select(this).attr('r', 4);
	if(self.options.tooltip.on) $('.graph-tooltip').remove();
      });
  }

  this.drawGraph = function(data_obj, w, h, vis, term) {

    var self = this;

    var all_data = d3.merge(data_obj),
    colors = ['#ff9900', '#ff0000', '#33ccff', '#66ffff', '#336600', '#000000', '#ff0066', '#ff00cc', '#339966', '#ff00ff'];

    var g = this.initDrawingArea(vis);

    vis.append("svg:g")
      .attr('class', 'y_axis')
      .attr('transform', 'translate(60, -50)')
      .call(this.yAxis);

    g.selectAll('rect')
      .data([1])
      .enter().append('rect')
      .attr('x', this.options.margin)
      .attr('y', -1 * h)
      .attr('width', (w - this.options.margin * 2))
      .attr("height", h - this.options.margin)
      .attr("class", "graph-background")

    g.selectAll(".xLines")
      .data(this.options.data[0])
      .enter().append("svg:line")
      .attr("class", "xLines")
      .attr("x1", function(d, i) { return Math.floor(self.x(i)) + .5})
      .attr("y1", -1 * this.options.margin)
      .attr("x2", function(d, i) { return Math.floor(self.x(i)) + .5})
      .attr("y2", -1 * h)

    g.selectAll(".yLines")
      .data(self.y.ticks(10))
      .enter().append("svg:line")
      .attr("class", "yLines")
      .attr("x1", 0 + this.options.margin)
      .attr("y1", function(d, i) { return Math.floor(-1 * self.y(d)) + .5 })
      .attr("x2", w - this.options.margin)
      .attr("y2", function(d, i) { return Math.floor(-1 * self.y(d)) + .5 })

    for(var i = 0; i < data_obj.length; i++) {
      this.drawLine(i, data_obj);
      this.drawCircles(i, data_obj);
    }

    g.append("svg:line")
      .attr("x1", this.options.margin)
      .attr("y1", -1 * (this.options.height))
      .attr("x2", this.options.margin)
      .attr("y2", -1 * (this.options.margin))
      .attr("class", "y-line");

    g.append("svg:line")
      .attr("x1", this.options.width - this.options.margin)
      .attr("y1", -1 * (this.options.height))
      .attr("x2", this.options.width - this.options.margin)
      .attr("y2", -1 * (this.options.margin))
      .attr("class", "y-line");

    g.append("svg:line")
      .attr("x1", this.options.margin)
      .attr("y1", -1 * (this.options.height - .5))
      .attr("x2", this.options.width - this.options.margin)
      .attr("y2", -1 * (this.options.height - .5))
      .attr("class", "x-line");

    var mod = Math.floor((this.options.data[0].length - 1) / 4);

    if(this.options.xTickLabel.type == 'date') {
      var date_arr = [];
      var date_inc = _.isDate(this.options.xTickLabel.start) ? new Date(this.options.xTickLabel.start) : Date.parse(Utils.createDate(this.options.xTickLabel.start));
      for(var i = 0; i < this.options.data[0].length; i++) {
	var date = new Date(date_inc);
	date = (parseInt(date.getMonth()) + 1)+'/'+date.getDate();
	date_arr.push(date);
	date_inc = date_inc.add(1).days();
      }

      var xticklabel = g.selectAll(".x-tick-label");
      _.each(this.options.data[0], function(ele, i){
	xticklabel.data([i])
	  .enter().append("svg:text")
	  .attr("class", "xLabel")
	  .text(date_arr[i])
	  .attr("x", function(d) { return self.x(d)})
	  .attr("y", -1 * self.options.margin + 30)
	  .attr("text-anchor", "middle")
	  .attr("class", "x-tick-label");
      });
    } else if(this.options.xTickLabel.type == 'spread') {
      var xticklabel = g.selectAll(".x-tick-label");
      var start = this.options.xTickLabel.start;
      var end = this.options.xTickLabel.end;
      var hour_arr = d3.time.hours(start, end);
      xticklabel.data(hour_arr)
	.enter().append("svg:text")
	.attr("class", "xLabel")
	.text(function(d, j) {
	  if(j === 0) {
	    return (start.getMonth()+1)+'/'+start.getDate();
	  } else if(j === hour_arr.length - 1) {
	    return (end.getMonth()+1)+'/'+end.getDate();
	  }
	  return d.getHours();
	})
	.attr("x", function(d, i) { return self.x(i)})
	.attr("y", -1 * self.options.margin + 30)
	.attr("text-anchor", "middle")
	.attr("class", "x-tick-label");
    } else {
      var xticklabel = g.selectAll(".x-tick-label");
      _.each(this.options.data[0], function(ele, i ,arr){
	xticklabel.data([i])
	  .enter().append("svg:text")
	  .attr("class", "xLabel")
	  .text(arr.length - i)
	  .attr("x", function(d) { return self.x(d)})
	  .attr("y", -1 * self.options.margin + 30)
	  .attr("text-anchor", "middle")
	  .attr("class", "x-tick-label");
      });
    }

    var xtick = g.selectAll(".xTicks");
    _.each(this.options.data[0], function(ele, i){
      if(i == 0 || i % mod == 0) { return } else {
	xtick.data([i])
	  .enter().append("svg:line")
	  .attr("class", "xTicks")
	  .attr("x1", self.x(i))
	  .attr("y1", -1 * self.options.margin + 20)
	  .attr("x2", self.x(i))
	  .attr("y2", -1 * self.options.margin + 30);
      }
    });
    vis.selectAll('cover-rect-'+i)
      .data([1])
      .enter().append('rect')
      .attr('x', this.options.margin)
      .attr('y', 0)
      .attr('width', (7 + w - this.options.margin * 2))
      .attr("height", h - this.options.margin + 5)
      .attr("class", "graph-background")
      .attr('style', 'float: right')
      .transition()
      .duration(3000)
      .ease('linear')
      .attr('width', 0)
      .attr('x', this.options.width - this.options.margin + 7)


    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 1)
      .attr("height", 1)
      .attr("class", "zoomRect")
      .attr("style", "display:none")

    g.append('svg:line')
      .attr('class', 'zoomHoverLine')
      .attr('x1', 0)
      .attr('x2', 0)
      .attr('y1', -self.options.margin)
      .attr('y2', -self.options.height)
      .attr('style', 'display: none')
      .attr('fill', '#999999')
      .attr('stroke', 1);

    this.drawAxisLabels(g);

  },
  this.removeSeries = function(series) {
    if(series == 0 && this.options.series.lock == true) return;
    this.options.data.splice(series, 1);
    $(this.options.graphLocation).empty();
    $(this.options.legend.target+' li[series|="'+series+'"]').remove();
    var vis = this.setupGraph(this.options.width, this.options.height);
    this.drawGraph($.graph_data, this.options.width, this.options.height, vis, false);
  };

  this.clearData = function() {
    $.graph_data = [];
  };

  this.drawAxisLabels = function(g) {
    g.selectAll('.x-label')
      .data([this.options.axisLabels.x])
      .enter().append('svg:text')
      .text(String)
      .attr("x", this.options.width/2)
      .attr("y", -5)
      .attr("text-anchor", "middle")
      .attr("dx", 0)
      .attr("class", "x-label");

    g.selectAll('.y-label')
      .data([this.options.axisLabels.y])
      .enter().append('svg:text')
      .text(String)
      .attr("x", (this.options.height + this.options.margin) / 2)
      .attr("y", 10)
      .attr("text-anchor", "middle")
      .attr("dx", 0)
      .attr("class", "y-label")
      .attr("transform", "rotate(270)");
  };

  this.updateAndTransition = function(new_data, hidden) {
    var max_length = self.options.data.length > new_data.length ? self.options.data.length : new_data.length;
    var old_data = self.options.data;
    if(hidden) {
      var used = [];
      _.each(new_data, function(v, i) {
	var c = false;
	_.each(hidden, function(v) {
	  if(i == v) { c = true; }
	});
	if(!c) {
	  used.push(v);
	}
      });
      self.options.data = used;
    } else {
      self.options.data = new_data;
    }
    self.y.domain([self.min(), self.max()]);
    for(var i = 0;i<max_length;i++) {
      if(new_data[i] && i < old_data.length) {
	transitionThings(i, new_data);
      } else if(new_data[i]) {
	self.drawLine(i, new_data);
	self.drawCircles(i, new_data);
      } else {
	d3.select('.series-'+i).remove();
	d3.selectAll('.circle-'+i).remove();
      }
    }
    d3.select(self.options.graphLocation+' .y_axis')
      .transition()
      .duration(2000)
      .call(self.yAxis);

    function transitionThings(i, new_data) {
      d3.select(self.options.graphLocation+' .series-'+i)
	.transition()
	.duration(2000)
	.attr('d', self.line(new_data[i]));

      d3.selectAll(self.options.graphLocation+' .circle-'+i)
	.transition()
	.duration(2000)
	.attr('cy', function(d, j) { return self.y(new_data[i][j]) - self.options.margin + 10; })
	.attr('num', function(d, j) { return new_data[i][j]; });
    }
    self.options.data = new_data;
  };

  this.graph();
  //this.initEvents();
  return this;
}

var MultipleAxisGraph = {

  _: this._,

  defaults: {
    graphLocation: '.axisgraph',
    width: 960,
    height: 500,
    data: {
      y1: [3,1,2,3,1,2,6,9,5,4,6,12,3,1,2,3,1,2,6,9,5,4,6,12,3,1,2,3,1,2,6,9,5,4,6,12,3,1,2,3,1,2,6,9,5,4,6,12],
      y2: [31,71,21,31,11,21,61,12,51,41,61,121,7,11,21,31,11,21,61,91,65,41,61,121,31,11,29,31,11,21,61,901,51,41,61,121,31,11,21,31,11,21,61,91,51,41,61,121]
    },
    margin: 60,
    axisLabels: {
      y1: "Comments",
      y2: "Votes",
      x: "Time Ago (minutes)"
    }
  },

  graph: function(options) {
    this.options = _.defaults(options, this.defaults);

    var neg_marg = this.options.margin * -1;

    this.vis = d3.select(this.options.graphLocation)
      .append('svg:svg')
      .attr('width', this.options.width)
      .attr('height', this.options.height)
      .attr('class', 'axis-graph')

    $('.axis-graph').css({
      "position": "absolute",
      "left": "-"+this.options.margin+"px",
      "top": "-"+this.options.margin+"px"
    });

    this.g = this.vis.append("svg:g")
      .attr("transform", "translate(0, "+this.options.height+")");

    colors = ['#ff9900', '#ff0000', '#33ccff', '#66ffff', '#336600', '#000000', '#ff0066', '#ff00cc', '#339966', '#ff00ff'];

    var y1 = d3.scale.linear().domain([0, d3.max(this.options.data.y1) == 0 ? 100 : d3.max(this.options.data.y1)]).range([0 + this.options.margin, this.options.height - this.options.margin]),
    y2 = d3.scale.linear().domain([0, d3.max(this.options.data.y2) == 0 ? 100 : d3.max(this.options.data.y2)]).range([0 + this.options.margin, this.options.height - this.options.margin]),
    x = d3.scale.linear().domain([0, this.options.data.y1.length]).range([0 + this.options.margin + 20, this.options.width - this.options.margin + 20])

    var line1 = d3.svg.line()
      .x(function(d,i) { return x(i); })
      .y(function(d) { return -1 * y1(d); });

    var line2 = d3.svg.line()
      .x(function(d,i) { return x(i); })
      .y(function(d) { return -1 * y2(d); });

    this.g.append("svg:path")
      .attr("d", line1(this.options.data.y1))
      .attr('stroke', 'darkslateblue')
      .attr('class', 'series-0')

    this.g.append("svg:path")
      .attr("d", line2(this.options.data.y2))
      .attr('stroke', 'crimson')
      .attr('class', 'series-1')

    this.vis.selectAll('circle-0')
      .data(this.options.data.y1)
      .enter().append('circle')
      .attr('class', 'circle')
      .attr('cx', function(d, i) { return x(i) })
      .attr('cy', function(d) { return y1.range()[1] - y1(d) + options.margin })
      .attr('r', 3)
      .attr('num', function(d, i) { return d })
      .style('fill', 'darkslateblue')
      .on("mouseover", function(){
	d3.select(this).attr('r', 6);
	var y = $(this).offset().top - 10,
	x = $(this).offset().left + 20;
	var num = $(this).attr('num');
	$('body').prepend('<div class="graph-tooltip" style="position: absolute; top:'+y+'px;left:'+x+'px; z-index: 2;">'+num+'</div>');
      })
      .on("mouseout", function(){
	d3.select(this).attr('r', 3);
	$('.graph-tooltip').remove();
      });

    this.vis.selectAll('circle-1')
      .data(this.options.data.y2)
      .enter().append('circle')
      .attr('class', 'circle')
      .attr('cx', function(d, i) { return x(i) })
      .attr('cy', function(d) { return y2.range()[1] - y2(d) + options.margin })
      .attr('r', 3)
      .attr('num', function(d, i) { return d })
      .style('fill', 'crimson')
      .on("mouseover", function(){
	d3.select(this).attr('r', 6);
	var y = $(this).offset().top - 10,
	x = $(this).offset().left + 20;
	var num = $(this).attr('num');
	$('body').prepend('<div class="graph-tooltip" style="position: absolute; top:'+y+'px;left:'+x+'px; z-index: 2;">'+num+'</div>');
      })
      .on("mouseout", function(){
	d3.select(this).attr('r', 3);
	$('.graph-tooltip').remove();
      });

    var mod = Math.floor((this.options.data.y1.length - 1) / 4);

    var xticklabel = this.g.selectAll(".x-tick-label");
    _.each(this.options.data.y1, function(ele, i){
      if(i == 0 || i % 4 == 0) {
	xticklabel.data([i])
	  .enter().append("svg:text")
	  .attr("class", "xLabel")
	  .text((MultipleAxisGraph.options.data.y1.length * 20) - (i*20))
	  .attr("x", function(d) { return x(d) })
	  .attr("y", -1 * MultipleAxisGraph.options.margin + 30)
	  .attr("text-anchor", "middle")
	  .attr("class", "x-tick-label");
      }
    });

    var xtick = this.g.selectAll(".xTicks");
    _.each(this.options.data.y1, function(ele, i){
      if(i == 0 || i % 4 == 0) { return } else {
	xtick.data([1])
	  .enter().append("svg:line")
	  .attr("class", "xTicks")
	  .attr("x1", x(i))
	  .attr("y1", -1 * MultipleAxisGraph.options.margin + 20)
	  .attr("x2", x(i))
	  .attr("y2", -1 * MultipleAxisGraph.options.margin + 30);
      }
    });

    this.g.selectAll(".y1-tick-label")
      .data(y1.ticks(10))
      .enter().append("svg:text")
      .attr("class", "y1Label")
      .text(function(d, i) {
	return Math.floor(d * 100) / 100;
      })
      .attr("x", this.options.margin - 5)
      .attr("y", function(d) { return -1 * y1(d) })
      .attr("text-anchor", "end")
      .attr("dy", 5)
      .attr("dx", 0)
      .attr("class", "y1-tick-label");

    this.g.selectAll(".y2-tick-label")
      .data(y2.ticks(10))
      .enter().append("svg:text")
      .attr("class", "y2Label")
      .text(function(d, i) {
	return Math.floor(d * 100) / 100;
      })
      .attr("x", this.options.width - this.options.margin + 5)
      .attr("y", function(d) { return -1 * y2(d) })
      .attr("text-anchor", "start")
      .attr("dy", 5)
      .attr("dx", 0)

    this.g.append("svg:line")
			.attr("x1", this.options.margin)
			.attr("y1", -1 * (this.options.height - this.options.margin))
			.attr("x2", this.options.margin)
			.attr("y2", -1 * (this.options.margin))
		  .attr("class", "y-line");

		this.g.append("svg:line")
			.attr("x1", this.options.width - this.options.margin)
			.attr("y1", -1 * (this.options.height - this.options.margin))
			.attr("x2", this.options.width - this.options.margin)
			.attr("y2", -1 * (this.options.margin))
		  .attr("class", "y-line");

		this.g.append("svg:line")
			.attr("x1", this.options.margin)
			.attr("y1", -1 * (this.options.height - this.options.margin))
			.attr("x2", this.options.width - this.options.margin)
			.attr("y2", -1 * (this.options.height - this.options.margin))
		  .attr("class", "x-line");

		this.g.selectAll('.x-label')
		  .data([this.options.axisLabels.x])
		  .enter().append('svg:text')
		  .text(String)
			.attr("x", this.options.width/2)
			.attr("y", -5)
			.attr("text-anchor", "middle")
			.attr("dx", 0)
			.attr("class", "x-label");

		this.g.selectAll('.y1-label')
		  .data([this.options.axisLabels.y1])
		  .enter().append('svg:text')
		  .text(String)
			.attr("x", this.options.height/2)
			.attr("y", 10)
			.attr("text-anchor", "middle")
			.attr("class", "y-label")
		  .attr("transform", "rotate(270)")
		  .attr('fill', 'darkslateblue');

		this.g.selectAll('.y2-label')
		  .data([this.options.axisLabels.y2])
		  .enter().append('svg:text')
		  .text(String)
			.attr("x", -1 * this.options.height/2)
			.attr("y", -1 * this.options.width + this.options.margin - 50)
			.attr("text-anchor", "middle")
			.attr("class", "y-label")
		  .attr("transform", "rotate(90)")
		  .attr('fill', 'crimson');

		}
/*
    _.extend(Graph.prototype, {

        // put methods here

    });

  return Graph();
*/
};

BarGraph = function(init_options) {
	var self = this;

  var defaults = {
		graphLocation: '.bargraph',
		width: 300,
		height: 400,
		data: {
			y1: [3000, 1000, 2000, 3000, 1000, 2000, 6000, 3000, 1000, 2000, 3000, 1000, 2000, 6000, 3000, 1000, 2000, 3000, 1000, 2000, 6000, 1000, 2000, 6000]
		},
		margin: 60,
		label: ["su", "m", "t", "w", "th", "f", "s"],
		labels_on: true,
		axisLabels: {
			y1: "Comments",
			x: "Time Ago (minutes)"
		},
		barwidth: 9
  }

	this.options = {};

	this.setOptions = function() {
		self.options = _.defaults(init_options, defaults);
	}

	this.setOptions();

	this.y = d3.scale.linear()
			.domain([0, d3.max(self.options.data.y1)])
			.rangeRound([5, self.options.height]);

	this.x = d3.scale.linear()
			.domain([0, self.options.data.y1.length])
			.range([0, self.options.width])

  this.graph = function() {

		var chart = d3.select(this.options.graphLocation).append('svg')
			.attr('width', this.options.width)
			.attr('height', this.options.height)
			.attr('class', 'bargraph');

		var space = (this.options.width / this.options.data.y1.length / 2) - (this.options.barwidth / 2);

		chart.selectAll('rect')
			.data(this.options.data.y1)
			.enter().append('rect')
			.attr('x', function(d, i) { return (space + self.x(i)) })
			.attr('y', function(d) { return self.options.height - self.y(d) - .5; })
			.attr('width', this.options.barwidth)
			.attr("height", function(d) { return self.y(d) })
			.attr("barnum", function(d, i) { return i })

		if(this.options.labels_on) {
			chart.selectAll('number')
				.data(this.options.data.y1)
				.enter().append('svg:text')
				.text(String)
				.attr('y', function(d, i) { return  (self.x(i) + (self.options.barwidth - 1.5) + space) })
				.attr('x', function(d) { return -1 * (self.options.height - self.y(d) - 4) })
				.attr("transform", "rotate(270)")
				.attr("text-anchor", "start")
				.attr("class", "number");

			var xticklabel = g.selectAll(".x-tick-label");
			_.each(this.options.label, function(ele, i){
				var iter = i;
				xticklabel.data([i])
					.enter().append("svg:text")
					.attr("class", "day")
					.text(ele)
					.attr("x", function(d) { return (self.x(iter) + space + (self.options.barwidth / 2))})
					.attr("y", self.options.height - self.options.margin + 16)
					.attr("text-anchor", "middle")
			});
		}

		var g = chart.append("svg:g");

		/*g.append("svg:line")
			.attr("x1", 0)
			.attr("y1", this.options.height - this.options.margin - 1)
			.attr("x2", this.options.width)
			.attr("y2", this.options.height - this.options.margin - 1)
		  .attr("class", "x-line")*/
	}

	this.graph();
	return this;
};

function PieChart(init_options){
	var self = this;

  var defaults = {
		graphLocation: '.piechart',
		width: 300,
		height: 320,
		radius: 100,
		innerRadius: 0,
		labels: true,
		data : [{label: 0, value: 4, color: '#2f8aa2'},
						{label: 3, value: 3, color: '#333'},
						{label: 4, value: 3, color: '#555'},
						{label: 5, value: 3, color: '#777'}
					 ],
		color : d3.scale.category20c(),
		hasLabels: true
  };

	this.options = {};

	this.setOptions = function() {
		self.options = _.defaults(init_options, defaults);
	}

	this.setOptions();

	this.vis = d3.select(self.options.graphLocation)
		.append("svg:svg")
		.data([self.options.data])
		.attr("width", self.options.width)
		.attr("height", self.options.height)
		.append("svg:g")
		.attr("transform", "translate(" + (self.options.radius + 30) + "," + (self.options.radius + 30) + ")")

	this.arc = d3.svg.arc();

	this.pie = d3.layout.pie()
		.value(function(d) { return d.value; });

	this.arcs = self.vis.selectAll("g.slice")
		.data(self.pie)
		.enter()
		.append("svg:g")
		.attr("class", function(d, i) { return "slice-"+i; })
		.attr('label', function(d, i) {
			return d.data.label;
		})
		.attr('val', function(d, i) {
			return d.data.value;
		});

  this.graph = function(options) {

		var x = [], y= [];

		self.arcs.append("svg:path")
			.attr("d", function(d, i) {
				d.outerRadius = self.options.radius;
				d.innerRadius = self.options.innerRadius;
				//d.startAngle = d.startAngle + .02;
				//d.endAngle = d.endAngle - .02;
				return self.arc(d);
			})
			.attr('fill', function(d) { return d.data.color })
			.on('mouseover', function() {
				self.growPiece(this);
			})
			.on('mouseout', function() {
				self.shrinkPiece(this);
			});

		if(self.options.hasLabels) {
			arcs.append("svg:text")
				.attr("transform", function(d, i) {
					d.innerRadius = self.options.innerRadius;
					d.outerRadius = self.options.radius;
					var x1 = arc.centroid(d)[0] + x[i];
					var y1 = arc.centroid(d)[1] + y[i];
					return "translate("+x1+","+y1+")";
				})
				.attr("text-anchor", "middle")
				.text(function(d, i) {
					if(self.options.data[i].value > 0) {
						return self.options.data[i].label;
					} else {
						return '';
					}
				})
				.style("dominant-baseline", "middle");
		}
	};

	this.growPiece = function(that, arc, options) {
		d3.select(that)
			.transition()
			.duration(500)
			.attrTween("d", function(d, i, a) {
				d.outerRadius = self.options.radius + 20;
				return d3.interpolate(a, self.arc(d));
			});
	};

	this.shrinkPiece = function(that, arc, options) {
		d3.select(that)
			.transition()
			.duration(500)
			.attrTween("d", function(d, i, a) {
				d.outerRadius = self.options.radius;
				return d3.interpolate(a, self.arc(d));
			});
	};

	self.graph();
	return self;
};

var Streamgraph = {
  _: this._,

  defaults: {
		graphLocation: '.streamgraph',
		width: 300,
		height: 300,
		data0 : [.3, .32, .32, .45, .12, .31, .11],
		data1 : [.12, .14, .17, .23, .22, .21, .13],
		color : d3.interpolateRgb("#aad", "#556")
  },

  graph: function(options) {
    this.options = _.defaults(options, this.defaults);

	/*	var t = [];
		var a = [0, .1, .2, .3, .4, .5, .6, .7, .8, .9];

		var big_data = [];
		big_data[0] = [];

		_.each(this.data0, function(item, i, arr) {
			if(i < arr.length - 1) {
				var inte = d3.interpolate(item, arr[i+1]);
				_.each(a, function(num, j) {
					var g = inte(num);
					t.push(g);
				});
			};
		});

		t.push(this.data0[this.data0.length - 1]);

	*/

		var data0_new = [], data1_new = [];

		_.each(this.options.data0, function(d, i) {
			data0_new.push({x: i, y: d});
		});

		_.each(this.options.data1, function(d, i) {
			data1_new.push({x: i, y: d});
		});

		var all_data = this.options.data0.concat(this.options.data1);
		var y = d3.scale.linear().domain([0, d3.max(all_data)]).range([0, this.options.height]),
		x = d3.scale.linear().domain([0, this.options.data0.length-1]).range([0, this.options.width])

		var area = d3.svg.area()
			.x(function(d, i) { return x(i) })
			.y0(function(d) { return Streamgraph.options.height })
			.y1(function(d) { return Streamgraph.options.height - y(d.y) });

		var vis = d3.select(this.options.graphLocation)
			.append("svg")
			.attr("width", this.options.width)
			.attr("height", this.options.height)

		vis.selectAll('.path1')
			.data([data1_new])
			.enter().append("svg:path")
			.attr("d", area)
			.attr("class", "path1")

		vis.selectAll('.path0')
			.data([data0_new])
			.enter().append("svg:path")
			.attr("d", area)
			.attr("class", "path0")

/*		var line1 = d3.svg.line()
			.x(function(d,i) { return x(i); })
			.y(function(d) { return y(d); });

		vis.append("svg:path")
			.attr("d", line1(this.data0))
			.attr('stroke', 'darkslateblue')
			.attr('class', 'series-0')
	}

*/
	}
}

TreeMap = function(init_options) {
	var self = this;

	var defaults = {
		width: 960,
		height: 500,
		data: {name:"asdf",
						children: [{name:"dfre", size: 89423}, {name:"asdf", size: 45423}, {name:"asdf", size: 76423}, {name:"asdf", size: 567423}, {name:"asdf", size: 21423}, {name:"asdf", size: 23423}, {name:"asdf", size: 541423}, {name:"asdf", size: 341423}, {name:"asdf", size: 345423}]
					 },
		graphLocation: ".treemap"
	}

	this.options = 	_.defaults(init_options, defaults);

	this.treemap = function() {
		return d3.layout.treemap()
		.size([self.options.width, self.options.height])
		.sticky(true)
		.value(function(d) { return d.size; })
		.sort(function(a,b) {
			return a.size - b.size;
		})
	}

	this.div = function() {
		return d3.select(self.options.graphLocation).append('div')
		.style('position', 'relative')
		.style('width', self.options.width+'px')
		.style('height', self.options.height+'px');
	}

	this.drawMap = function() {
		self.div().data([self.options.data]).selectAll('div')
			.data(self.treemap().nodes)
			.enter().append('div')
			.call(self.cell)
	}

	this.cell = function() {
		this
			.style("left", function(d) { return d.x + "px"; })
      .style("top", function(d) { return d.y + "px"; })
      .style("width", function(d) { return Math.max(0, d.dx - 3) + "px"; })
      .style("height", function(d) { return Math.max(0, d.dy - 3) + "px"; })
      .style("background", "#fff")
      .style("position", "absolute")
      .attr("hash", function(d) { return d.name })
		  .attr("shares", function(d) { return d.value})
      .attr("class", 'cell')
	}

	this.drawMap();
	return this
}