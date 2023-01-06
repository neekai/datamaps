(function () {
  var svg;

  // Save off default references
  var d3 = window.d3,
    topojson = window.topojson;

  var defaultOptions = {
    scope: 'world',
    responsive: false,
    aspectRatio: 0.5625,
    setProjection: setProjection,
    projection: 'equirectangular',
    dataType: 'json',
    data: {},
    done: function () {},
    fills: {
      defaultFill: '#ABDDA4',
    },
    filters: {},
    geographyConfig: {
      dataUrl: null,
      hideAntarctica: true,
      hideHawaiiAndAlaska: false,
      borderWidth: 1,
      borderOpacity: 1,
      borderColor: '#FDFDFD',
      popupTemplate: function (geography, data) {
        return (
          '<div class="hoverinfo"><strong>' +
          geography.properties.name +
          '</strong></div>'
        );
      },
      popupOnHover: true,
      highlightOnHover: true,
      highlightFillColor: '#FC8D59',
      highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
      highlightBorderWidth: 2,
      highlightBorderOpacity: 1,
    },
    projectionConfig: {
      rotation: [97, 0],
    },
    bubblesConfig: {
      borderWidth: 2,
      borderOpacity: 1,
      borderColor: '#FFFFFF',
      popupOnHover: true,
      radius: null,
      popupTemplate: function (geography, data) {
        return (
          '<div class="hoverinfo"><strong>' + data.name + '</strong></div>'
        );
      },
      fillOpacity: 0.75,
      animate: true,
      highlightOnHover: true,
      highlightFillColor: '#FC8D59',
      highlightBorderColor: 'rgba(250, 15, 160, 0.2)',
      highlightBorderWidth: 2,
      highlightBorderOpacity: 1,
      highlightFillOpacity: 0.85,
      exitDelay: 100,
      key: JSON.stringify,
    },
    arcConfig: {
      strokeColor: '#DD1C77',
      strokeWidth: 1,
      arcSharpness: 1,
      animationSpeed: 600,
      popupOnHover: false,
      popupTemplate: function (geography, data) {
        // Case with latitude and longitude
        if (
          data.origin &&
          data.destination &&
          data.origin.latitude &&
          data.origin.longitude &&
          data.destination.latitude &&
          data.destination.longitude
        ) {
          return (
            '<div class="hoverinfo"><strong>Arc</strong><br>Origin: ' +
            JSON.stringify(data.origin) +
            '<br>Destination: ' +
            JSON.stringify(data.destination) +
            '</div>'
          );
        }
        // Case with only country name
        else if (data.origin && data.destination) {
          return (
            '<div class="hoverinfo"><strong>Arc</strong><br>' +
            data.origin +
            ' -> ' +
            data.destination +
            '</div>'
          );
        }
        // Missing information
        else {
          return '';
        }
      },
    },
  };

  /*
    Getter for value. If not declared on datumValue, look up the chain into optionsValue
  */
  function val(datumValue, optionsValue, context) {
    if (typeof context === 'undefined') {
      context = optionsValue;
      var optionsValues = undefined;
    }
    var value = typeof datumValue !== 'undefined' ? datumValue : optionsValue;

    if (typeof value === 'undefined') {
      return null;
    }

    if (typeof value === 'function') {
      var fnContext = [context];
      if (context.geography) {
        fnContext = [context.geography, context.data];
      }
      return value.apply(null, fnContext);
    } else {
      return value;
    }
  }

  function addContainer(element, height, width) {
    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', width || element.offsetWidth)
      .attr('data-width', width || element.offsetWidth)
      .attr('class', 'datamap')
      .attr('height', height || element.offsetHeight)
      .style('overflow', 'hidden'); // IE10+ doesn't respect height/width when map is zoomed in

    if (this.options.responsive) {
      d3.select(this.options.element)
        .style('position', 'relative')
        .style('padding-bottom', this.options.aspectRatio * 100 + '%');

      d3.select(this.options.element)
        .select('svg')
        .style('position', 'absolute')
        .style('width', '100%')
        .style('height', '100%');

      d3.select(this.options.element)
        .select('svg')
        .select('g')
        .selectAll('path')
        .style('vector-effect', 'non-scaling-stroke');
    }

    return this.svg;
  }

  // setProjection takes the svg element and options
  function setProjection(element, options) {
    var width = options.width || element.offsetWidth;
    var height = options.height || element.offsetHeight;
    var projection, path;
    var svg = this.svg;

    if (options && typeof options.scope === 'undefined') {
      options.scope = 'world';
    }

    if (options.scope === 'usa') {
      projection = d3
        .geoAlbersUsa()
        .scale(width)
        .translate([width / 2, height / 2]);
    } else if (options.scope === 'world') {
      projection = d3.geo[options.projection]()
        .scale((width + 1) / 2 / Math.PI)
        .translate([
          width / 2,
          height / (options.projection === 'mercator' ? 1.45 : 1.8),
        ]);
    }

    if (options.projection === 'orthographic') {
      svg
        .append('defs')
        .append('path')
        .datum({ type: 'Sphere' })
        .attr('id', 'sphere')
        .attr('d', path);

      svg.append('use').attr('class', 'stroke').attr('xlink:href', '#sphere');

      svg.append('use').attr('class', 'fill').attr('xlink:href', '#sphere');
      projection
        .scale(250)
        .clipAngle(90)
        .rotate(options.projectionConfig.rotation);
    }

    path = d3.geoPath().projection(projection);

    return { path: path, projection: projection };
  }

  function addStyleBlock() {
    if (d3.select('.datamaps-style-block').empty()) {
      d3.select('head')
        .append('style')
        .attr('class', 'datamaps-style-block')
        .html(
          '.datamap path.datamaps-graticule { fill: none; stroke: #777; stroke-width: 0.5px; stroke-opacity: .5; pointer-events: none; } .datamap .labels {pointer-events: none;} .datamap path:not(.datamaps-arc), .datamap circle, .datamap line {stroke: #FFFFFF; vector-effect: non-scaling-stroke; stroke-width: 1px;} .datamaps-legend dt, .datamaps-legend dd { float: left; margin: 0 3px 0 0;} .datamaps-legend dd {width: 20px; margin-right: 6px; border-radius: 3px;} .datamaps-legend {padding-bottom: 20px; z-index: 1001; position: absolute; left: 4px; font-size: 12px; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;} .datamaps-hoverover {display: none; font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; } .hoverinfo {padding: 4px; border-radius: 1px; background-color: #FFF; box-shadow: 1px 1px 5px #CCC; font-size: 12px; border: 1px solid #CCC; } .hoverinfo hr {border:1px dotted #CCC; }'
        );
    }
  }

  function drawSubunits(data) {
    var fillData = this.options.fills,
      colorCodeData = this.options.data || {},
      geoConfig = this.options.geographyConfig;

    var subunits = this.svg.select('g.datamaps-subunits');
    if (subunits.empty()) {
      subunits = this.addLayer('datamaps-subunits', null, true);
    }

    var geoData = topojson.feature(
      data,
      data.objects[this.options.scope]
    ).features;
    if (geoConfig.hideAntarctica) {
      geoData = geoData.filter(function (feature) {
        return feature.id !== 'ATA';
      });
    }

    if (geoConfig.hideHawaiiAndAlaska) {
      geoData = geoData.filter(function (feature) {
        return feature.id !== 'HI' && feature.id !== 'AK';
      });
    }

    var geo = subunits.selectAll('path.datamaps-subunit').data(geoData);

    geo
      .enter()
      .append('path')
      .attr('d', this.path)
      .attr('class', function (d) {
        return 'datamaps-subunit ' + d.id;
      })
      .attr('data-info', function (d) {
        return JSON.stringify(colorCodeData[d.id]);
      })
      .style('fill', function (d) {
        // If fillKey - use that
        // Otherwise check 'fill'
        // Otherwise check 'defaultFill'
        var fillColor;

        var datum = colorCodeData[d.id];
        if (datum && datum.fillKey) {
          fillColor =
            fillData[
              val(datum.fillKey, { data: colorCodeData[d.id], geography: d })
            ];
        }

        if (typeof fillColor === 'undefined') {
          fillColor = val(datum && datum.fillColor, fillData.defaultFill, {
            data: colorCodeData[d.id],
            geography: d,
          });
        }

        return fillColor;
      })
      .style('stroke-width', geoConfig.borderWidth)
      .style('stroke-opacity', geoConfig.borderOpacity)
      .style('stroke', geoConfig.borderColor);
  }

  function handleGeographyConfig() {
    var hoverover;
    var svg = this.svg;
    var self = this;
    var options = this.options.geographyConfig;

    if (options.highlightOnHover || options.popupOnHover) {
      svg
        .selectAll('.datamaps-subunit')
        .on('mouseover', function (d) {
          var value = d.target.__data__;
          var $this = d3.select(this);
          var datum = self.options.data[value.id] || {};
          if (options.highlightOnHover) {
            var previousAttributes = {
              fill: $this.style('fill'),
              stroke: $this.style('stroke'),
              'stroke-width': $this.style('stroke-width'),
              'fill-opacity': $this.style('fill-opacity'),
            };

            $this
              .style(
                'fill',
                val(datum.highlightFillColor, options.highlightFillColor, datum)
              )
              .style(
                'stroke',
                val(
                  datum.highlightBorderColor,
                  options.highlightBorderColor,
                  datum
                )
              )
              .style(
                'stroke-width',
                val(
                  datum.highlightBorderWidth,
                  options.highlightBorderWidth,
                  datum
                )
              )
              .style(
                'stroke-opacity',
                val(
                  datum.highlightBorderOpacity,
                  options.highlightBorderOpacity,
                  datum
                )
              )
              .style(
                'fill-opacity',
                val(
                  datum.highlightFillOpacity,
                  options.highlightFillOpacity,
                  datum
                )
              )
              .attr(
                'data-previousAttributes',
                JSON.stringify(previousAttributes)
              );

            // As per discussion on https://github.com/markmarkoh/datamaps/issues/19
            if (!/((MSIE)|(Trident))/.test(navigator.userAgent)) {
              moveToFront.call(this);
            }
          }

          if (options.popupOnHover) {
            self.updatePopup($this, value, options, svg);
          }
        })
        .on('mouseout', function () {
          var $this = d3.select(this);

          if (options.highlightOnHover) {
            // Reapply previous attributes
            var previousAttributes = JSON.parse(
              $this.attr('data-previousAttributes')
            );
            for (var attr in previousAttributes) {
              $this.style(attr, previousAttributes[attr]);
            }
          }
          $this.on('mousemove', null);
          d3.selectAll('.datamaps-hoverover').style('display', 'none');
        });
    }

    function moveToFront() {
      this.parentNode.appendChild(this);
    }
  }

  // Plugin to add a simple map legend
  function addLegend(layer, data, options) {
    data = data || {};
    if (!this.options.fills) {
      return;
    }

    var html = '<dl>';
    var label = '';
    if (data.legendTitle) {
      html = '<h2>' + data.legendTitle + '</h2>' + html;
    }
    for (var fillKey in this.options.fills) {
      if (fillKey === 'defaultFill') {
        if (!data.defaultFillName) {
          continue;
        }
        label = data.defaultFillName;
      } else {
        if (data.labels && data.labels[fillKey]) {
          label = data.labels[fillKey];
        } else {
          label = fillKey + ': ';
        }
      }
      html += '<dt>' + label + '</dt>';
      html +=
        '<dd style="background-color:' +
        this.options.fills[fillKey] +
        '">&nbsp;</dd>';
    }
    html += '</dl>';

    var hoverover = d3
      .select(this.options.element)
      .append('div')
      .attr('class', 'datamaps-legend')
      .html(html);
  }

  function addGraticule(layer, options) {
    var graticule = d3.geoGraticule();
    this.svg
      .insert('path', '.datamaps-subunits')
      .datum(graticule)
      .attr('class', 'datamaps-graticule')
      .attr('d', this.path);
  }

  function handleArcs(layer, data, options) {
    var self = this,
      svg = this.svg;

    if (!data || (data && !data.slice)) {
      throw 'Datamaps Error - arcs must be an array';
    }

    // For some reason arc options were put in an `options` object instead of the parent arc
    // I don't like this, so to match bubbles and other plugins I'm moving it
    // This is to keep backwards compatability
    for (var i = 0; i < data.length; i++) {
      data[i] = defaults(data[i], data[i].options);
      delete data[i].options;
    }

    if (typeof options === 'undefined') {
      options = defaultOptions.arcConfig;
    }

    var arcs = layer.selectAll('path.datamaps-arc').data(data, JSON.stringify);

    var path = d3.geoPath().projection(self.projection);

    arcs
      .enter()
      .append('svg:path')
      .attr('class', 'datamaps-arc')
      .style('stroke-linecap', 'round')
      .style('stroke', function (datum) {
        return val(datum.strokeColor, options.strokeColor, datum);
      })
      .style('fill', 'none')
      .style('stroke-width', function (datum) {
        return val(datum.strokeWidth, options.strokeWidth, datum);
      })
      .attr('d', function (datum) {
        var originXY, destXY;

        if (typeof datum.origin === 'string') {
          switch (datum.origin) {
            case 'CAN':
              originXY = self.latLngToXY(56.624472, -114.665293);
              break;
            case 'CHL':
              originXY = self.latLngToXY(-33.44889, -70.669265);
              break;
            case 'IDN':
              originXY = self.latLngToXY(-6.208763, 106.845599);
              break;
            case 'JPN':
              originXY = self.latLngToXY(35.689487, 139.691706);
              break;
            case 'MYS':
              originXY = self.latLngToXY(3.139003, 101.686855);
              break;
            case 'NOR':
              originXY = self.latLngToXY(59.913869, 10.752245);
              break;
            case 'USA':
              originXY = self.latLngToXY(41.140276, -100.760145);
              break;
            case 'VNM':
              originXY = self.latLngToXY(21.027764, 105.83416);
              break;
            default:
              originXY = self.path.centroid(
                svg.select('path.' + datum.origin).data()[0]
              );
          }
        } else {
          originXY = self.latLngToXY(
            val(datum.origin.latitude, datum),
            val(datum.origin.longitude, datum)
          );
        }

        if (typeof datum.destination === 'string') {
          switch (datum.destination) {
            case 'CAN':
              destXY = self.latLngToXY(56.624472, -114.665293);
              break;
            case 'CHL':
              destXY = self.latLngToXY(-33.44889, -70.669265);
              break;
            case 'IDN':
              destXY = self.latLngToXY(-6.208763, 106.845599);
              break;
            case 'JPN':
              destXY = self.latLngToXY(35.689487, 139.691706);
              break;
            case 'MYS':
              destXY = self.latLngToXY(3.139003, 101.686855);
              break;
            case 'NOR':
              destXY = self.latLngToXY(59.913869, 10.752245);
              break;
            case 'USA':
              destXY = self.latLngToXY(41.140276, -100.760145);
              break;
            case 'VNM':
              destXY = self.latLngToXY(21.027764, 105.83416);
              break;
            default:
              destXY = self.path.centroid(
                svg.select('path.' + datum.destination).data()[0]
              );
          }
        } else {
          destXY = self.latLngToXY(
            val(datum.destination.latitude, datum),
            val(datum.destination.longitude, datum)
          );
        }
        var midXY = [
          (originXY[0] + destXY[0]) / 2,
          (originXY[1] + destXY[1]) / 2,
        ];
        if (options.greatArc) {
          // TODO: Move this to inside `if` clause when setting attr `d`
          var greatArc = d3
            .geoGreatArc()
            .source(function (d) {
              return [val(d.origin.longitude, d), val(d.origin.latitude, d)];
            })
            .target(function (d) {
              return [
                val(d.destination.longitude, d),
                val(d.destination.latitude, d),
              ];
            });

          return path(greatArc(datum));
        }
        var sharpness = val(datum.arcSharpness, options.arcSharpness, datum);
        return (
          'M' +
          originXY[0] +
          ',' +
          originXY[1] +
          'S' +
          (midXY[0] + 50 * sharpness) +
          ',' +
          (midXY[1] - 75 * sharpness) +
          ',' +
          destXY[0] +
          ',' +
          destXY[1]
        );
      })
      .attr('data-info', function (datum) {
        return JSON.stringify(datum);
      })
      .on('mouseover', function (datum) {
        var $this = d3.select(this);

        if (options.popupOnHover) {
          self.updatePopup($this, datum, options, svg);
        }
      })
      .on('mouseout', function (datum) {
        var $this = d3.select(this);

        d3.selectAll('.datamaps-hoverover').style('display', 'none');
      })
      .transition()
      .delay(100)
      .style('fill', function (datum) {
        /*
              Thank you Jake Archibald, this is awesome.
              Source: http://jakearchibald.com/2013/animated-line-drawing-svg/
            */
        var length = this.getTotalLength();
        this.style.transition = this.style.WebkitTransition = 'none';
        this.style.strokeDasharray = length + ' ' + length;
        this.style.strokeDashoffset = length;
        this.getBoundingClientRect();
        this.style.transition = this.style.WebkitTransition =
          'stroke-dashoffset ' +
          val(datum.animationSpeed, options.animationSpeed, datum) +
          'ms ease-out';
        this.style.strokeDashoffset = '0';
        return 'none';
      });

    arcs.exit().transition().style('opacity', 0).remove();
  }

  function handleLabels(layer, options) {
    var self = this;
    options = options || {};
    var labelStartCoodinates = this.projection([-67.707617, 42.722131]);
    this.svg.selectAll('.datamaps-subunit').attr('data-foo', function (d) {
      var center = self.path.centroid(d);
      var xOffset = 7.5,
        yOffset = 5;

      if (['FL', 'KY', 'MI'].indexOf(d.id) > -1) xOffset = -2.5;
      if (d.id === 'NY') xOffset = -1;
      if (d.id === 'MI') yOffset = 18;
      if (d.id === 'LA') xOffset = 13;

      var x, y;

      x = center[0] - xOffset;
      y = center[1] + yOffset;

      var smallStateIndex = [
        'VT',
        'NH',
        'MA',
        'RI',
        'CT',
        'NJ',
        'DE',
        'MD',
        'DC',
      ].indexOf(d.id);
      if (smallStateIndex > -1) {
        var yStart = labelStartCoodinates[1];
        x = labelStartCoodinates[0];
        y = yStart + smallStateIndex * (2 + (options.fontSize || 12));
        layer
          .append('line')
          .attr('x1', x - 3)
          .attr('y1', y - 5)
          .attr('x2', center[0])
          .attr('y2', center[1])
          .style('stroke', options.labelColor || '#000')
          .style('stroke-width', options.lineWidth || 1);
      }

      layer
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .style('font-size', (options.fontSize || 10) + 'px')
        .style('font-family', options.fontFamily || 'Verdana')
        .style('fill', options.labelColor || '#000')
        .text(function () {
          if (options.customLabelText && options.customLabelText[d.id]) {
            return options.customLabelText[d.id];
          } else {
            return d.id;
          }
        });

      return 'bar';
    });
  }

  function handleBubbles(layer, data, options) {
    var self = this,
      fillData = this.options.fills,
      filterData = this.options.filters,
      svg = this.svg;

    if (!data || (data && !data.slice)) {
      throw 'Datamaps Error - bubbles must be an array';
    }

    var bubbles = layer
      .selectAll('circle.datamaps-bubble')
      .data(data, options.key);

    bubbles
      .enter()
      .append('svg:circle')
      .attr('class', 'datamaps-bubble')
      .attr('cx', function (datum) {
        var latLng;
        if (datumHasCoords(datum)) {
          latLng = self.latLngToXY(datum.latitude, datum.longitude);
        } else if (datum.centered) {
          if (datum.centered === 'USA') {
            latLng = self.projection([-98.58333, 39.83333]);
          } else {
            latLng = self.path.centroid(
              svg.select('path.' + datum.centered).data()[0]
            );
          }
        }
        if (latLng) return latLng[0];
      })
      .attr('cy', function (datum) {
        var latLng;
        if (datumHasCoords(datum)) {
          latLng = self.latLngToXY(datum.latitude, datum.longitude);
        } else if (datum.centered) {
          if (datum.centered === 'USA') {
            latLng = self.projection([-98.58333, 39.83333]);
          } else {
            latLng = self.path.centroid(
              svg.select('path.' + datum.centered).data()[0]
            );
          }
        }
        if (latLng) return latLng[1];
      })
      .attr('r', function (datum) {
        // If animation enabled start with radius 0, otherwise use full size.
        return options.animate ? 0 : val(datum.radius, options.radius, datum);
      })
      .attr('data-info', function (datum) {
        return JSON.stringify(datum);
      })
      .attr('filter', function (datum) {
        var filterKey =
          filterData[val(datum.filterKey, options.filterKey, datum)];

        if (filterKey) {
          return filterKey;
        }
      })
      .style('stroke', function (datum) {
        return val(datum.borderColor, options.borderColor, datum);
      })
      .style('stroke-width', function (datum) {
        return val(datum.borderWidth, options.borderWidth, datum);
      })
      .style('stroke-opacity', function (datum) {
        return val(datum.borderOpacity, options.borderOpacity, datum);
      })
      .style('fill-opacity', function (datum) {
        return val(datum.fillOpacity, options.fillOpacity, datum);
      })
      .style('fill', function (datum) {
        var fillColor = fillData[val(datum.fillKey, options.fillKey, datum)];
        return fillColor || fillData.defaultFill;
      })
      .on('mouseover', function (datum) {
        var $this = d3.select(this);

        if (options.highlightOnHover) {
          // Save all previous attributes for mouseout
          var previousAttributes = {
            fill: $this.style('fill'),
            stroke: $this.style('stroke'),
            'stroke-width': $this.style('stroke-width'),
            'fill-opacity': $this.style('fill-opacity'),
          };

          $this
            .style(
              'fill',
              val(datum.highlightFillColor, options.highlightFillColor, datum)
            )
            .style(
              'stroke',
              val(
                datum.highlightBorderColor,
                options.highlightBorderColor,
                datum
              )
            )
            .style(
              'stroke-width',
              val(
                datum.highlightBorderWidth,
                options.highlightBorderWidth,
                datum
              )
            )
            .style(
              'stroke-opacity',
              val(
                datum.highlightBorderOpacity,
                options.highlightBorderOpacity,
                datum
              )
            )
            .style(
              'fill-opacity',
              val(
                datum.highlightFillOpacity,
                options.highlightFillOpacity,
                datum
              )
            )
            .attr(
              'data-previousAttributes',
              JSON.stringify(previousAttributes)
            );
        }

        if (options.popupOnHover) {
          self.updatePopup($this, datum, options, svg);
        }
      })
      .on('mouseout', function (datum) {
        var $this = d3.select(this);

        if (options.highlightOnHover) {
          // Reapply previous attributes
          var previousAttributes = JSON.parse(
            $this.attr('data-previousAttributes')
          );
          for (var attr in previousAttributes) {
            $this.style(attr, previousAttributes[attr]);
          }
        }

        d3.selectAll('.datamaps-hoverover').style('display', 'none');
      });

    bubbles
      .transition()
      .duration(400)
      .attr('r', function (datum) {
        return val(datum.radius, options.radius, datum);
      })
      .transition()
      .duration(0)
      .attr('data-info', function (d) {
        return JSON.stringify(d);
      });

    bubbles.exit().transition().delay(options.exitDelay).attr('r', 0).remove();

    function datumHasCoords(datum) {
      return (
        typeof datum !== 'undefined' &&
        typeof datum.latitude !== 'undefined' &&
        typeof datum.longitude !== 'undefined'
      );
    }
  }

  function defaults(obj) {
    Array.prototype.slice.call(arguments, 1).forEach(function (source) {
      if (source) {
        for (var prop in source) {
          // Deep copy if property not set
          if (obj[prop] == null) {
            if (typeof source[prop] == 'function') {
              obj[prop] = source[prop];
            } else {
              obj[prop] = JSON.parse(JSON.stringify(source[prop]));
            }
          }
        }
      }
    });
    return obj;
  }
  /**************************************
             Public Functions
  ***************************************/

  function Datamap(options) {
    if (typeof d3 === 'undefined' || typeof topojson === 'undefined') {
      throw new Error(
        'Include d3.js (v3.0.3 or greater) and topojson on this page before creating a new map'
      );
    }
    // Set options for global use
    this.options = defaults(options, defaultOptions);
    this.options.geographyConfig = defaults(
      options.geographyConfig,
      defaultOptions.geographyConfig
    );
    this.options.projectionConfig = defaults(
      options.projectionConfig,
      defaultOptions.projectionConfig
    );
    this.options.bubblesConfig = defaults(
      options.bubblesConfig,
      defaultOptions.bubblesConfig
    );
    this.options.arcConfig = defaults(
      options.arcConfig,
      defaultOptions.arcConfig
    );

    // Add the SVG container
    if (d3.select(this.options.element).select('svg')._groups.length > 0) {
      addContainer.call(
        this,
        this.options.element,
        this.options.height,
        this.options.width
      );
    }

    // Add core plugins to this instance
    this.addPlugin('bubbles', handleBubbles);
    this.addPlugin('legend', addLegend);
    this.addPlugin('arc', handleArcs);
    this.addPlugin('labels', handleLabels);
    this.addPlugin('graticule', addGraticule);

    // Append style block with basic hoverover styles
    if (!this.options.disableDefaultStyles) {
      addStyleBlock();
    }

    return this.draw();
  }

  // Resize map
  Datamap.prototype.resize = function () {
    var self = this;
    var options = self.options;

    if (options.responsive) {
      var newsize = options.element.clientWidth,
        oldsize = d3.select(options.element).select('svg').attr('data-width');

      d3.select(options.element)
        .select('svg')
        .selectAll('g')
        .attr('transform', 'scale(' + newsize / oldsize + ')');
    }
  };

  // Actually draw the features(states & countries)
  Datamap.prototype.draw = function () {
    // Save off in a closure
    var self = this;
    var options = self.options;

    // Set projections and paths based on scope
    var pathAndProjection = options.setProjection.apply(this, [
      options.element,
      options,
    ]);

    this.path = pathAndProjection.path;
    this.projection = pathAndProjection.projection;

    // If custom URL for topojson data, retrieve it and render
    if (options.geographyConfig.dataUrl) {
      d3.json(options.geographyConfig.dataUrl, function (error, results) {
        if (error) throw new Error(error);
        self.customTopo = results;
        draw(results);
      });
    } else {
      draw(this[options.scope + 'Topo'] || options.geographyConfig.dataJson);
    }

    return this;

    function draw(data) {
      // If fetching remote data, draw the map first then call `updateChoropleth`
      if (self.options.dataUrl) {
        // Allow for csv or json data types
        d3[self.options.dataType](self.options.dataUrl, function (data) {
          // In the case of csv, transform data to object
          if (self.options.dataType === 'csv' && data && data.slice) {
            var tmpData = {};
            for (var i = 0; i < data.length; i++) {
              tmpData[data[i].id] = data[i];
            }
            data = tmpData;
          }
          Datamaps.prototype.updateChoropleth.call(self, data);
        });
      }
      drawSubunits.call(self, data);
      handleGeographyConfig.call(self);

      if (
        self.options.geographyConfig.popupOnHover ||
        self.options.bubblesConfig.popupOnHover
      ) {
        var hoverover = d3
          .select(self.options.element)
          .append('div')
          .attr('class', 'datamaps-hoverover')
          .style('z-index', 10001)
          .style('position', 'absolute');
      }

      // Fire off finished callback
      self.options.done(self);
    }
  };
  /**************************************
                TopoJSON
  ***************************************/
  Datamap.prototype.worldTopo = {"type":"Topology","objects":{"world":{"type":"GeometryCollection","geometries":[{"type":"Polygon","id":"ABW","properties":{"name":"Aruba","iso":"ABW"},"arcs":[[0]]},{"type":"Polygon","id":"AFG","properties":{"name":"Afghanistan","iso":"AFG"},"arcs":[[1,2,3,4,5,6]]},{"type":"MultiPolygon","id":"AGO","properties":{"name":"Angola","iso":"AGO"},"arcs":[[[7,8,9,10]],[[11,12,13]]]},{"type":"Polygon","id":"AIA","properties":{"name":"Anguilla","iso":"AIA"},"arcs":[[14]]},{"type":"Polygon","id":"ALB","properties":{"name":"Albania","iso":"ALB"},"arcs":[[15,16,17,18,19]]},{"type":"MultiPolygon","id":"ALA","properties":{"name":"Åland Islands","iso":"ALA"},"arcs":[[[20]],[[21]],[[22]]]},{"type":"Polygon","id":"AND","properties":{"name":"Andorra","iso":"AND"},"arcs":[[23,24]]},{"type":"MultiPolygon","id":"ARE","properties":{"name":"United Arab Emirates","iso":"ARE"},"arcs":[[[25]],[[26]],[[27]],[[28]],[[29,30,31,32,33],[34]]]},{"type":"MultiPolygon","id":"ARG","properties":{"name":"Argentina","iso":"ARG"},"arcs":[[[35]],[[36,37]],[[38]],[[39,40,41,42,43,44]]]},{"type":"MultiPolygon","id":"ARM","properties":{"name":"Armenia","iso":"ARM"},"arcs":[[[45]],[[46,47,48,49,50],[51]]]},{"type":"Polygon","id":"ASM","properties":{"name":"American Samoa","iso":"ASM"},"arcs":[[52]]},{"type":"MultiPolygon","id":"ATA","properties":{"name":"Antarctica","iso":"ATA"},"arcs":[[[53]],[[54]],[[55]],[[56]],[[57]],[[58]],[[59]],[[60]],[[61]],[[62]],[[63]],[[64]],[[65]],[[66]],[[67]],[[68]],[[69]],[[70]],[[71]],[[72]],[[73]],[[74]],[[75]],[[76]],[[77]],[[78]],[[79]],[[80]],[[81]],[[82]],[[83]],[[84]],[[85]],[[86]],[[87]],[[88]],[[89]],[[90]],[[91]],[[92]],[[93]],[[94]],[[95]],[[96]],[[97]],[[98]],[[99]],[[100]],[[101]],[[102]],[[103]],[[104]],[[105]],[[106]],[[107]],[[108]],[[109]],[[110]],[[111]],[[112]],[[113]],[[114]],[[115]],[[116]],[[117]],[[118]],[[119]],[[120]],[[121]],[[122]],[[123]],[[124]],[[125]],[[126]],[[127]],[[128]],[[129]],[[130]],[[131]],[[132]],[[133]],[[134]],[[135]],[[136]],[[137]],[[138]],[[139]],[[140]],[[141]],[[142]],[[143]],[[144]],[[145]],[[146]],[[147]],[[148]],[[149]],[[150]],[[151]],[[152]],[[153]],[[154]],[[155]],[[156]],[[157]],[[158]]]},{"type":"MultiPolygon","id":"ATF","properties":{"name":"French Southern Territories","iso":"ATF"},"arcs":[[[159]],[[160]],[[161]]]},{"type":"MultiPolygon","id":"ATG","properties":{"name":"Antigua and Barbuda","iso":"ATG"},"arcs":[[[162]],[[163]]]},{"type":"MultiPolygon","id":"AUS","properties":{"name":"Australia","iso":"AUS"},"arcs":[[[164]],[[165]],[[166]],[[167]],[[168]],[[169]],[[170]],[[171]],[[172]],[[173]],[[174]],[[175]],[[176]],[[177]],[[178]],[[179]],[[180]],[[181]],[[182]],[[183]],[[184]],[[185]],[[186]],[[187]],[[188]],[[189]],[[190]],[[191]],[[192]],[[193]],[[194]],[[195]],[[196]],[[197]],[[198]],[[199]],[[200]],[[201]],[[202]]]},{"type":"Polygon","id":"AUT","properties":{"name":"Austria","iso":"AUT"},"arcs":[[203,204,205,206,207,208,209,210,211]]},{"type":"MultiPolygon","id":"AZE","properties":{"name":"Azerbaijan","iso":"AZE"},"arcs":[[[212,213,-48]],[[-52]],[[214,-51,215,216,217],[-46]]]},{"type":"Polygon","id":"BDI","properties":{"name":"Burundi","iso":"BDI"},"arcs":[[218,219,220]]},{"type":"Polygon","id":"BEL","properties":{"name":"Belgium","iso":"BEL"},"arcs":[[221,222,223,224,225,226,227]]},{"type":"Polygon","id":"BEN","properties":{"name":"Benin","iso":"BEN"},"arcs":[[228,229,230,231,232]]},{"type":"Polygon","id":"BFA","properties":{"name":"Burkina Faso","iso":"BFA"},"arcs":[[-230,233,234,235,236,237]]},{"type":"MultiPolygon","id":"BGD","properties":{"name":"Bangladesh","iso":"BGD"},"arcs":[[[238]],[[239]],[[240]],[[241]],[[242]],[[243]],[[244,245,246]]]},{"type":"Polygon","id":"BGR","properties":{"name":"Bulgaria","iso":"BGR"},"arcs":[[247,248,249,250,251,252]]},{"type":"Polygon","id":"BHR","properties":{"name":"Bahrain","iso":"BHR"},"arcs":[[253]]},{"type":"MultiPolygon","id":"BHS","properties":{"name":"Bahamas","iso":"BHS"},"arcs":[[[254]],[[255]],[[256]],[[257]],[[258]],[[259]],[[260]],[[261]],[[262]],[[263]],[[264]],[[265]],[[266]],[[267]],[[268]]]},{"type":"Polygon","id":"BIH","properties":{"name":"Bosnia and Herzegovina","iso":"BIH"},"arcs":[[269,270,271,272,273]]},{"type":"Polygon","id":"BLM","properties":{"name":"Saint Barthélemy","iso":"BLM"},"arcs":[[274]]},{"type":"Polygon","id":"BLR","properties":{"name":"Belarus","iso":"BLR"},"arcs":[[275,276,277,278,279]]},{"type":"MultiPolygon","id":"BLZ","properties":{"name":"Belize","iso":"BLZ"},"arcs":[[[280]],[[281]],[[282,283,284]]]},{"type":"Polygon","id":"BMU","properties":{"name":"Bermuda","iso":"BMU"},"arcs":[[285]]},{"type":"Polygon","id":"BOL","properties":{"name":"Bolivia, Plurinational State of","iso":"BOL"},"arcs":[[-45,286,287,288,289]]},{"type":"MultiPolygon","id":"BRA","properties":{"name":"Brazil","iso":"BRA"},"arcs":[[[290]],[[291]],[[292]],[[293]],[[294]],[[295]],[[296]],[[297]],[[298]],[[299]],[[300]],[[301]],[[302]],[[303]],[[304]],[[305]],[[306,307,308,309,-41,310,-289,311,312,313,314]]]},{"type":"Polygon","id":"BRB","properties":{"name":"Barbados","iso":"BRB"},"arcs":[[315]]},{"type":"MultiPolygon","id":"BRN","properties":{"name":"Brunei Darussalam","iso":"BRN"},"arcs":[[[316,317]],[[318,319]]]},{"type":"Polygon","id":"BTN","properties":{"name":"Bhutan","iso":"BTN"},"arcs":[[320,321]]},{"type":"Polygon","id":"BWA","properties":{"name":"Botswana","iso":"BWA"},"arcs":[[322,323,324]]},{"type":"Polygon","id":"CAF","properties":{"name":"Central African Republic","iso":"CAF"},"arcs":[[325,326,327,328,329,330]]},{"type":"MultiPolygon","id":"CAN","properties":{"name":"Canada","iso":"CAN"},"arcs":[[[331]],[[332]],[[333]],[[334]],[[335]],[[336]],[[337]],[[338]],[[339]],[[340]],[[341]],[[342]],[[343,344]],[[345]],[[346]],[[347]],[[348]],[[349]],[[350]],[[351]],[[352]],[[353]],[[354]],[[355]],[[356]],[[357]],[[358]],[[359]],[[360]],[[361]],[[362]],[[363]],[[364]],[[365]],[[366]],[[367]],[[368]],[[369]],[[370]],[[371,372]],[[373]],[[374]],[[375]],[[376]],[[377]],[[378]],[[379]],[[380]],[[381]],[[382]],[[383]],[[384]],[[385]],[[386]],[[387]],[[388]],[[389]],[[390]],[[391]],[[392]],[[393]],[[394]],[[395]],[[396]],[[397]],[[398]],[[399]],[[400]],[[401]],[[402]],[[403]],[[404]],[[405]],[[406]],[[407]],[[408]],[[409]],[[410]],[[411]],[[412]],[[413]],[[414]],[[415]],[[416]],[[417]],[[418]],[[419]],[[420]],[[421]],[[422]],[[423]],[[424]],[[425]],[[426,427,428,429]],[[430]],[[431]],[[432]],[[433]],[[434]],[[435]],[[436]],[[437]],[[438]],[[439]],[[440]],[[441]],[[442]],[[443]],[[444]],[[445]],[[446]],[[447]],[[448]],[[449]],[[450]],[[451]],[[452]],[[453]],[[454]],[[455]],[[456]],[[457]],[[458]],[[459]],[[460]],[[461]],[[462]],[[463]],[[464]],[[465]],[[466]],[[467]],[[468]],[[469]]]},{"type":"Polygon","id":"CHE","properties":{"name":"Switzerland","iso":"CHE"},"arcs":[[470,-207,471,472,473,-209]]},{"type":"MultiPolygon","id":"CHL","properties":{"name":"Chile","iso":"CHL"},"arcs":[[[474]],[[475]],[[476]],[[477]],[[478]],[[479]],[[480]],[[481]],[[482]],[[-37,483]],[[484]],[[485]],[[486]],[[487]],[[488]],[[489]],[[490]],[[491]],[[492]],[[493]],[[494]],[[495]],[[496]],[[497]],[[498]],[[499]],[[500]],[[501]],[[502]],[[503]],[[-44,504,505,-287]]]},{"type":"MultiPolygon","id":"CHN","properties":{"name":"China","iso":"CHN"},"arcs":[[[506]],[[507]],[[508]],[[509]],[[510]],[[511]],[[512]],[[513]],[[514]],[[515]],[[516]],[[517]],[[518,519,520,521,522,523,524,525,526,527,-321,528,529,530,531,532,533,534,-7,535,536,537,538,539,540]]]},{"type":"MultiPolygon","id":"CIV","properties":{"name":"Côte d'Ivoire","iso":"CIV"},"arcs":[[[541,542]],[[-236,543,544,545,546,547]]]},{"type":"Polygon","id":"CMR","properties":{"name":"Cameroon","iso":"CMR"},"arcs":[[548,549,550,551,552,553,-329]]},{"type":"Polygon","id":"COD","properties":{"name":"Congo, the Democratic Republic of the","iso":"COD"},"arcs":[[554,555,-219,556,557,-11,558,-13,559,-327,560]]},{"type":"Polygon","id":"COG","properties":{"name":"Congo","iso":"COG"},"arcs":[[-12,561,562,-549,-328,-560]]},{"type":"Polygon","id":"COK","properties":{"name":"Cook Islands","iso":"COK"},"arcs":[[563]]},{"type":"MultiPolygon","id":"COL","properties":{"name":"Colombia","iso":"COL"},"arcs":[[[564]],[[565,-313,566,567,568,569,570]]]},{"type":"MultiPolygon","id":"COM","properties":{"name":"Comoros","iso":"COM"},"arcs":[[[571]],[[572]],[[573]]]},{"type":"MultiPolygon","id":"CPV","properties":{"name":"Cape Verde","iso":"CPV"},"arcs":[[[574]],[[575]],[[576]],[[577]],[[578]],[[579]],[[580]],[[581]]]},{"type":"Polygon","id":"CRI","properties":{"name":"Costa Rica","iso":"CRI"},"arcs":[[582,583,584,585]]},{"type":"MultiPolygon","id":"CUB","properties":{"name":"Cuba","iso":"CUB"},"arcs":[[[586]],[[587]],[[588]],[[589]],[[590]],[[591]],[[592]]]},{"type":"Polygon","id":"CUW","properties":{"name":"Curaçao","iso":"CUW"},"arcs":[[593]]},{"type":"MultiPolygon","id":"CYM","properties":{"name":"Cayman Islands","iso":"CYM"},"arcs":[[[594]],[[595]]]},{"type":"Polygon","id":"northern_cyprus","properties":{"name":"Northern Cyprus","iso":null},"arcs":[[596,597]]},{"type":"Polygon","id":"CYP","properties":{"name":"Cyprus","iso":"CYP"},"arcs":[[-597,598]]},{"type":"Polygon","id":"CZE","properties":{"name":"Czech Republic","iso":"CZE"},"arcs":[[599,-211,600,601]]},{"type":"MultiPolygon","id":"DEU","properties":{"name":"Germany","iso":"DEU"},"arcs":[[[602,603]],[[604]],[[605]],[[606]],[[607,-601,-210,-474,608,609,-222,610,611,612,613]],[[614]]]},{"type":"Polygon","id":"DJI","properties":{"name":"Djibouti","iso":"DJI"},"arcs":[[615,616,617,618]]},{"type":"Polygon","id":"DMA","properties":{"name":"Dominica","iso":"DMA"},"arcs":[[619]]},{"type":"MultiPolygon","id":"DNK","properties":{"name":"Denmark","iso":"DNK"},"arcs":[[[620]],[[621]],[[622]],[[623]],[[624]],[[625]],[[626]],[[627]],[[628]],[[629]],[[630]],[[-613,631]]]},{"type":"Polygon","id":"DOM","properties":{"name":"Dominican Republic","iso":"DOM"},"arcs":[[632,633]]},{"type":"Polygon","id":"DZA","properties":{"name":"Algeria","iso":"DZA"},"arcs":[[634,635,636,637,638,639,640,641]]},{"type":"MultiPolygon","id":"ECU","properties":{"name":"Ecuador","iso":"ECU"},"arcs":[[[642]],[[643]],[[644]],[[645]],[[646]],[[647]],[[648]],[[649]],[[650,651,-568]]]},{"type":"Polygon","id":"EGY","properties":{"name":"Egypt","iso":"EGY"},"arcs":[[652,653,654,655,656,657]]},{"type":"MultiPolygon","id":"ERI","properties":{"name":"Eritrea","iso":"ERI"},"arcs":[[[658]],[[659]],[[-617,660,661,662]]]},{"type":"MultiPolygon","id":"ESP","properties":{"name":"Spain","iso":"ESP"},"arcs":[[[663]],[[664]],[[665]],[[666]],[[667]],[[668]],[[669]],[[670]],[[671]],[[672]],[[673]],[[674,-25,675,676,677,678,679]]]},{"type":"MultiPolygon","id":"EST","properties":{"name":"Estonia","iso":"EST"},"arcs":[[[680]],[[681]],[[682]],[[683,684,685]]]},{"type":"Polygon","id":"ETH","properties":{"name":"Ethiopia","iso":"ETH"},"arcs":[[-616,686,687,688,689,690,-661]]},{"type":"MultiPolygon","id":"FIN","properties":{"name":"Finland","iso":"FIN"},"arcs":[[[691]],[[692]],[[693]],[[694]],[[695]],[[696]],[[697]],[[698,699,700,701]]]},{"type":"MultiPolygon","id":"FJI","properties":{"name":"Fiji","iso":"FJI"},"arcs":[[[702]],[[703]],[[704]],[[705]],[[706]],[[707]],[[708]],[[709]],[[710]],[[711]],[[712]],[[713]],[[714]],[[715]],[[716]]]},{"type":"MultiPolygon","id":"FLK","properties":{"name":"Falkland Islands (Malvinas)","iso":"FLK"},"arcs":[[[717]],[[718]],[[719]],[[720]],[[721]],[[722]]]},{"type":"MultiPolygon","id":"FRA","properties":{"name":"France","iso":"FRA"},"arcs":[[[723]],[[724]],[[725,-609,-473,726,727,728,729,-676,-24,-675,730,-224]]]},{"type":"Polygon","id":"GUF","properties":{"name":"French Guiana","iso":"GUF"},"arcs":[[-308,731,732]]},{"type":"MultiPolygon","id":"FRO","properties":{"name":"Faroe Islands","iso":"FRO"},"arcs":[[[733]],[[734]],[[735]],[[736]],[[737]]]},{"type":"MultiPolygon","id":"FSM","properties":{"name":"Micronesia, Federated States of","iso":"FSM"},"arcs":[[[738]],[[739]],[[740]],[[741]],[[742]]]},{"type":"Polygon","id":"GAB","properties":{"name":"Gabon","iso":"GAB"},"arcs":[[743,-550,-563,744]]},{"type":"MultiPolygon","id":"GBR","properties":{"name":"United Kingdom","iso":"GBR"},"arcs":[[[745]],[[746]],[[747,748]],[[749]],[[750]],[[751]],[[752]],[[753]],[[754]],[[755]],[[756]],[[757]],[[758]],[[759]],[[760]],[[761]],[[762]],[[763]],[[764]],[[765]],[[766]]]},{"type":"Polygon","id":"GEO","properties":{"name":"Georgia","iso":"GEO"},"arcs":[[-50,767,768,769,-216]]},{"type":"Polygon","id":"GGY","properties":{"name":"Guernsey","iso":"GGY"},"arcs":[[770]]},{"type":"Polygon","id":"GHA","properties":{"name":"Ghana","iso":"GHA"},"arcs":[[-542,771,-544,-235,772,773]]},{"type":"Polygon","id":"GIN","properties":{"name":"Guinea","iso":"GIN"},"arcs":[[-547,774,775,776,777,778,779]]},{"type":"Polygon","id":"GMB","properties":{"name":"Gambia","iso":"GMB"},"arcs":[[780,781]]},{"type":"MultiPolygon","id":"GNB","properties":{"name":"Guinea-Bissau","iso":"GNB"},"arcs":[[[782]],[[783]],[[784]],[[785]],[[786]],[[787]],[[788,-778,789]]]},{"type":"MultiPolygon","id":"GNQ","properties":{"name":"Equatorial Guinea","iso":"GNQ"},"arcs":[[[-551,-744,790]],[[791]]]},{"type":"MultiPolygon","id":"GRC","properties":{"name":"Greece","iso":"GRC"},"arcs":[[[792]],[[793]],[[794]],[[795]],[[796]],[[797]],[[798]],[[799]],[[800]],[[801]],[[802]],[[803]],[[804]],[[805]],[[806]],[[807]],[[808]],[[809]],[[810]],[[811]],[[812]],[[813]],[[814]],[[815]],[[816]],[[817]],[[818]],[[819]],[[820]],[[821]],[[822]],[[823]],[[824]],[[825]],[[826]],[[827]],[[828]],[[829]],[[-17,830,-249,831,832]]]},{"type":"Polygon","id":"GRD","properties":{"name":"Grenada","iso":"GRD"},"arcs":[[833]]},{"type":"MultiPolygon","id":"GRL","properties":{"name":"Greenland","iso":"GRL"},"arcs":[[[834]],[[835]],[[836]],[[837]],[[838]],[[839]],[[840]],[[841]],[[842]],[[843]],[[844]],[[845]],[[846]],[[847]],[[848]],[[849]],[[850]]]},{"type":"Polygon","id":"GTM","properties":{"name":"Guatemala","iso":"GTM"},"arcs":[[851,852,853,854,-283,855]]},{"type":"Polygon","id":"GUM","properties":{"name":"Guam","iso":"GUM"},"arcs":[[856]]},{"type":"Polygon","id":"GUY","properties":{"name":"Guyana","iso":"GUY"},"arcs":[[-315,857,858,859]]},{"type":"MultiPolygon","id":"HKG","properties":{"name":"Hong Kong","iso":"HKG"},"arcs":[[[860]],[[861]],[[-521,862]]]},{"type":"Polygon","id":"HMD","properties":{"name":"Heard Island and McDonald Islands","iso":"HMD"},"arcs":[[863]]},{"type":"MultiPolygon","id":"HND","properties":{"name":"Honduras","iso":"HND"},"arcs":[[[864,865,866,-852,867]],[[868]],[[869]]]},{"type":"MultiPolygon","id":"HRV","properties":{"name":"Croatia","iso":"HRV"},"arcs":[[[870]],[[-272,871,872]],[[873]],[[874]],[[875]],[[876]],[[877]],[[878]],[[879,-274,880,881,882]]]},{"type":"MultiPolygon","id":"HTI","properties":{"name":"Haiti","iso":"HTI"},"arcs":[[[883]],[[-633,884]],[[885]]]},{"type":"Polygon","id":"HUN","properties":{"name":"Hungary","iso":"HUN"},"arcs":[[886,887,-883,888,-204,889,890]]},{"type":"MultiPolygon","id":"IDN","properties":{"name":"Indonesia","iso":"IDN"},"arcs":[[[891]],[[892]],[[893]],[[894]],[[895,896,897,898]],[[899]],[[900]],[[901]],[[902]],[[903]],[[904]],[[905]],[[906]],[[907]],[[908]],[[909]],[[910]],[[911]],[[912]],[[913]],[[914]],[[915]],[[916]],[[917]],[[918]],[[919]],[[920]],[[921]],[[922]],[[923]],[[924]],[[925]],[[926]],[[927]],[[928]],[[929]],[[930]],[[931]],[[932]],[[933]],[[934]],[[935]],[[936]],[[937]],[[938]],[[939]],[[940]],[[941]],[[942]],[[943]],[[944]],[[945]],[[946]],[[947]],[[948]],[[949]],[[950]],[[951]],[[952]],[[953]],[[954]],[[955]],[[956]],[[957]],[[958]],[[959]],[[960]],[[961]],[[962]],[[963]],[[964]],[[965]],[[966]],[[967]],[[968]],[[969]],[[970]],[[971]],[[972]],[[973]],[[974]],[[975]],[[976]],[[977]],[[978]],[[979]],[[980]],[[981,982,983]],[[984]],[[985]],[[986]],[[987]],[[988]],[[989]],[[990]],[[991]],[[992]],[[993]],[[994]],[[995]],[[996]],[[997]],[[998]],[[999]],[[1000]],[[1001]],[[1002]],[[1003]],[[1004]],[[1005]],[[1006]],[[1007]],[[1008]],[[1009]],[[1010]],[[1011]],[[1012]],[[1013]],[[1014]],[[1015]],[[1016]],[[1017]],[[1018]],[[1019]],[[1020]],[[1021]],[[1022,1023]],[[1024]],[[1025,1026]],[[1027]],[[1028]],[[1029]]]},{"type":"Polygon","id":"IMN","properties":{"name":"Isle of Man","iso":"IMN"},"arcs":[[1030]]},{"type":"MultiPolygon","id":"IND","properties":{"name":"India","iso":"IND"},"arcs":[[[1031]],[[1032]],[[1033]],[[1034]],[[1035]],[[1036]],[[1037]],[[1038]],[[1039]],[[1040]],[[1041,-531,1042,-529,-322,-528,1043,-247,1044,1045,1046,-533]]]},{"type":"Polygon","id":"CCK","properties":{"name":"Cocos (Keeling) Islands","iso":"CCK"},"arcs":[[1047]]},{"type":"Polygon","id":"CXR","properties":{"name":"Christmas Island","iso":"CXR"},"arcs":[[1048]]},{"type":"Polygon","id":"IOT","properties":{"name":"British Indian Ocean Territory","iso":"IOT"},"arcs":[[1049]]},{"type":"MultiPolygon","id":"IRL","properties":{"name":"Ireland","iso":"IRL"},"arcs":[[[1050]],[[-748,1051]]]},{"type":"MultiPolygon","id":"IRN","properties":{"name":"Iran, Islamic Republic of","iso":"IRN"},"arcs":[[[1052]],[[-47,-215,1053,1054,-3,1055,1056,1057,1058,-213]]]},{"type":"Polygon","id":"IRQ","properties":{"name":"Iraq","iso":"IRQ"},"arcs":[[1059,1060,1061,1062,1063,-1058,1064]]},{"type":"Polygon","id":"ISL","properties":{"name":"Iceland","iso":"ISL"},"arcs":[[1065]]},{"type":"Polygon","id":"ISR","properties":{"name":"Israel","iso":"ISR"},"arcs":[[1066,1067,1068,-653,1069,1070,1071,1072,1073]]},{"type":"MultiPolygon","id":"ITA","properties":{"name":"Italy","iso":"ITA"},"arcs":[[[1074]],[[1075]],[[1076]],[[1077]],[[1078]],[[1079]],[[1080]],[[1081,1082,-727,-472,-206],[1083]]]},{"type":"Polygon","id":"JAM","properties":{"name":"Jamaica","iso":"JAM"},"arcs":[[1084]]},{"type":"Polygon","id":"JEY","properties":{"name":"Jersey","iso":"JEY"},"arcs":[[1085]]},{"type":"Polygon","id":"JOR","properties":{"name":"Jordan","iso":"JOR"},"arcs":[[-1068,1086,-1074,1087,-1062,1088,1089]]},{"type":"MultiPolygon","id":"JPN","properties":{"name":"Japan","iso":"JPN"},"arcs":[[[1090]],[[1091]],[[1092]],[[1093]],[[1094]],[[1095]],[[1096]],[[1097]],[[1098]],[[1099]],[[1100]],[[1101]],[[1102]],[[1103]],[[1104]],[[1105]],[[1106]],[[1107]],[[1108]],[[1109]],[[1110]],[[1111]],[[1112]],[[1113]],[[1114]],[[1115]],[[1116]],[[1117]],[[1118]],[[1119]],[[1120]],[[1121]],[[1122]]]},{"type":"MultiPolygon","id":"KAZ","properties":{"name":"Kazakhstan","iso":"KAZ"},"arcs":[[[1123]],[[1124]],[[1125]],[[-538,1126,1127,1128,1129,1130]]]},{"type":"MultiPolygon","id":"KEN","properties":{"name":"Kenya","iso":"KEN"},"arcs":[[[1131]],[[1132,1133,1134,1135,1136,-689]]]},{"type":"Polygon","id":"KGZ","properties":{"name":"Kyrgyzstan","iso":"KGZ"},"arcs":[[1137,1138,-1127,-537],[1139],[1140],[1141]]},{"type":"MultiPolygon","id":"KHM","properties":{"name":"Cambodia","iso":"KHM"},"arcs":[[[1142]],[[1143,1144,1145,1146]]]},{"type":"MultiPolygon","id":"KIR","properties":{"name":"Kiribati","iso":"KIR"},"arcs":[[[1147]],[[1148]],[[1149]],[[1150]],[[1151]],[[1152]],[[1153]]]},{"type":"MultiPolygon","id":"KNA","properties":{"name":"Saint Kitts and Nevis","iso":"KNA"},"arcs":[[[1154]],[[1155]]]},{"type":"MultiPolygon","id":"KOR","properties":{"name":"Korea, Republic of","iso":"KOR"},"arcs":[[[1156]],[[1157]],[[1158]],[[1159]],[[1160]],[[1161]],[[1162]],[[1163]],[[1164]],[[1165]],[[1166,1167]]]},{"type":"Polygon","id":"kosovo","properties":{"name":"Kosovo","iso":null},"arcs":[[-20,1168,1169,1170]]},{"type":"MultiPolygon","id":"KWT","properties":{"name":"Kuwait","iso":"KWT"},"arcs":[[[1171]],[[1172,-1060,1173]]]},{"type":"Polygon","id":"LAO","properties":{"name":"Lao People's Democratic Republic","iso":"LAO"},"arcs":[[-1145,1174,1175,-526,1176]]},{"type":"Polygon","id":"LBN","properties":{"name":"Lebanon","iso":"LBN"},"arcs":[[1177,-1072,1178]]},{"type":"Polygon","id":"LBR","properties":{"name":"Liberia","iso":"LBR"},"arcs":[[1179,-775,-546,1180]]},{"type":"Polygon","id":"LBY","properties":{"name":"Libya","iso":"LBY"},"arcs":[[1181,1182,1183,-635,1184,1185,-656]]},{"type":"Polygon","id":"LCA","properties":{"name":"Saint Lucia","iso":"LCA"},"arcs":[[1186]]},{"type":"Polygon","id":"LIE","properties":{"name":"Liechtenstein","iso":"LIE"},"arcs":[[-208,-471]]},{"type":"MultiPolygon","id":"LKA","properties":{"name":"Sri Lanka","iso":"LKA"},"arcs":[[[1187]],[[1188]],[[1189]]]},{"type":"Polygon","id":"LSO","properties":{"name":"Lesotho","iso":"LSO"},"arcs":[[1190,1191]]},{"type":"MultiPolygon","id":"LTU","properties":{"name":"Lithuania","iso":"LTU"},"arcs":[[[1192,1193]],[[-278,1194,1195,1196,1197]]]},{"type":"Polygon","id":"LUX","properties":{"name":"Luxembourg","iso":"LUX"},"arcs":[[-726,-223,-610]]},{"type":"Polygon","id":"LVA","properties":{"name":"Latvia","iso":"LVA"},"arcs":[[-279,-1198,1198,-685,1199]]},{"type":"Polygon","id":"MAC","properties":{"name":"Macao","iso":"MAC"},"arcs":[[-523,1200]]},{"type":"Polygon","id":"MAF","properties":{"name":"Saint Martin (French part)","iso":"MAF"},"arcs":[[1201,1202]]},{"type":"Polygon","id":"MAR","properties":{"name":"Morocco","iso":"MAR"},"arcs":[[-640,1203,1204]]},{"type":"Polygon","id":"MCO","properties":{"name":"Monaco","iso":"MCO"},"arcs":[[1205,-729]]},{"type":"Polygon","id":"MDA","properties":{"name":"Moldova, Republic of","iso":"MDA"},"arcs":[[1206,1207]]},{"type":"MultiPolygon","id":"MDG","properties":{"name":"Madagascar","iso":"MDG"},"arcs":[[[1208]],[[1209]],[[1210]]]},{"type":"MultiPolygon","id":"MDV","properties":{"name":"Maldives","iso":"MDV"},"arcs":[[[1211]],[[1212]]]},{"type":"MultiPolygon","id":"MEX","properties":{"name":"Mexico","iso":"MEX"},"arcs":[[[1213]],[[1214]],[[1215]],[[1216]],[[1217]],[[1218]],[[1219]],[[1220]],[[1221]],[[1222]],[[1223]],[[1224]],[[1225]],[[-284,-855,1226,1227,1228]]]},{"type":"MultiPolygon","id":"MHL","properties":{"name":"Marshall Islands","iso":"MHL"},"arcs":[[[1229]],[[1230]]]},{"type":"Polygon","id":"MKD","properties":{"name":"Macedonia","iso":"MKD"},"arcs":[[-831,-16,-1171,1231,-250]]},{"type":"Polygon","id":"MLI","properties":{"name":"Mali","iso":"MLI"},"arcs":[[-237,-548,-780,1232,1233,-637,1234]]},{"type":"Polygon","id":"MLT","properties":{"name":"Malta","iso":"MLT"},"arcs":[[1235]]},{"type":"MultiPolygon","id":"MMR","properties":{"name":"Myanmar","iso":"MMR"},"arcs":[[[1236]],[[1237]],[[1238]],[[1239]],[[1240]],[[1241]],[[1242]],[[1243]],[[1244]],[[1245]],[[1246]],[[1247]],[[1248]],[[1249]],[[1250]],[[1251]],[[-1176,1252,1253,-245,-1044,-527]]]},{"type":"Polygon","id":"MNE","properties":{"name":"Montenegro","iso":"MNE"},"arcs":[[-1169,-19,1254,-872,-271,1255]]},{"type":"Polygon","id":"MNG","properties":{"name":"Mongolia","iso":"MNG"},"arcs":[[1256,-540]]},{"type":"MultiPolygon","id":"MNP","properties":{"name":"Northern Mariana Islands","iso":"MNP"},"arcs":[[[1257]],[[1258]],[[1259]],[[1260]],[[1261]],[[1262]]]},{"type":"Polygon","id":"MOZ","properties":{"name":"Mozambique","iso":"MOZ"},"arcs":[[1263,1264,1265,1266,1267,1268,1269,1270],[1271],[1272]]},{"type":"MultiPolygon","id":"MRT","properties":{"name":"Mauritania","iso":"MRT"},"arcs":[[[1273]],[[1274,1275,1276,-638,-1234]]]},{"type":"Polygon","id":"MSR","properties":{"name":"Montserrat","iso":"MSR"},"arcs":[[1277]]},{"type":"Polygon","id":"MUS","properties":{"name":"Mauritius","iso":"MUS"},"arcs":[[1278]]},{"type":"MultiPolygon","id":"MWI","properties":{"name":"Malawi","iso":"MWI"},"arcs":[[[-1273]],[[-1272]],[[-1268,1279,1280]]]},{"type":"MultiPolygon","id":"MYS","properties":{"name":"Malaysia","iso":"MYS"},"arcs":[[[1281]],[[1282]],[[-1023,1283]],[[1284]],[[1285]],[[1286,1287]],[[-1026,1288,-319,-318,1289]],[[1290]]]},{"type":"Polygon","id":"NAM","properties":{"name":"Namibia","iso":"NAM"},"arcs":[[-324,1291,1292,-9,1293]]},{"type":"MultiPolygon","id":"NCL","properties":{"name":"New Caledonia","iso":"NCL"},"arcs":[[[1294]],[[1295]],[[1296]],[[1297]],[[1298]]]},{"type":"Polygon","id":"NER","properties":{"name":"Niger","iso":"NER"},"arcs":[[1299,-231,-238,-1235,-636,-1184,1300]]},{"type":"Polygon","id":"NFK","properties":{"name":"Norfolk Island","iso":"NFK"},"arcs":[[1301]]},{"type":"MultiPolygon","id":"NGA","properties":{"name":"Nigeria","iso":"NGA"},"arcs":[[[1302]],[[1303,-553,1304,-232,-1300]]]},{"type":"Polygon","id":"NIC","properties":{"name":"Nicaragua","iso":"NIC"},"arcs":[[-585,1305,-865,1306]]},{"type":"Polygon","id":"NIU","properties":{"name":"Niue","iso":"NIU"},"arcs":[[1307]]},{"type":"MultiPolygon","id":"NLD","properties":{"name":"Netherlands","iso":"NLD"},"arcs":[[[-226,1308]],[[1309]],[[1310]],[[-611,1311,-227,1312]],[[1313]],[[1314]]]},{"type":"MultiPolygon","id":"NOR","properties":{"name":"Norway","iso":"NOR"},"arcs":[[[1315]],[[1316]],[[1317]],[[1318]],[[1319]],[[1320]],[[1321]],[[1322]],[[1323]],[[1324]],[[1325]],[[1326]],[[1327]],[[1328]],[[1329]],[[1330]],[[1331]],[[1332]],[[1333]],[[1334]],[[1335,-702,1336,1337]],[[1338]]]},{"type":"Polygon","id":"NPL","properties":{"name":"Nepal","iso":"NPL"},"arcs":[[-530,-1043]]},{"type":"Polygon","id":"NRU","properties":{"name":"Nauru","iso":"NRU"},"arcs":[[1339]]},{"type":"MultiPolygon","id":"NZL","properties":{"name":"New Zealand","iso":"NZL"},"arcs":[[[1340]],[[1341]],[[1342]],[[1343]],[[1344]],[[1345]],[[1346]],[[1347]],[[1348]],[[1349]],[[1350]]]},{"type":"MultiPolygon","id":"OMN","properties":{"name":"Oman","iso":"OMN"},"arcs":[[[1351]],[[1352,1353,-30,1354]],[[-35]],[[-33,1355]]]},{"type":"Polygon","id":"PAK","properties":{"name":"Pakistan","iso":"PAK"},"arcs":[[-1046,1356,-1056,-2,-535,1357]]},{"type":"MultiPolygon","id":"PAN","properties":{"name":"Panama","iso":"PAN"},"arcs":[[[1358]],[[1359]],[[1360]],[[-570,1361,-583,1362]]]},{"type":"Polygon","id":"PCN","properties":{"name":"Pitcairn","iso":"PCN"},"arcs":[[1363]]},{"type":"Polygon","id":"PER","properties":{"name":"Peru","iso":"PER"},"arcs":[[-288,-506,1364,-651,-567,-312]]},{"type":"MultiPolygon","id":"PHL","properties":{"name":"Philippines","iso":"PHL"},"arcs":[[[1365]],[[1366]],[[1367]],[[1368]],[[1369]],[[1370]],[[1371]],[[1372]],[[1373]],[[1374]],[[1375]],[[1376]],[[1377]],[[1378]],[[1379]],[[1380]],[[1381]],[[1382]],[[1383]],[[1384]],[[1385]],[[1386]],[[1387]],[[1388]],[[1389]],[[1390]],[[1391]],[[1392]],[[1393]],[[1394]],[[1395]],[[1396]],[[1397]],[[1398]],[[1399]],[[1400]],[[1401]],[[1402]],[[1403]],[[1404]],[[1405]],[[1406]],[[1407]],[[1408]],[[1409]],[[1410]],[[1411]],[[1412]]]},{"type":"Polygon","id":"PLW","properties":{"name":"Palau","iso":"PLW"},"arcs":[[1413]]},{"type":"MultiPolygon","id":"PNG","properties":{"name":"Papua New Guinea","iso":"PNG"},"arcs":[[[1414]],[[1415]],[[1416]],[[1417]],[[1418]],[[1419]],[[1420]],[[1421]],[[1422]],[[1423]],[[1424]],[[1425]],[[1426]],[[1427]],[[1428]],[[1429]],[[1430]],[[1431]],[[1432]],[[1433]],[[-983,1434,1435]],[[1436]],[[1437]],[[1438]],[[1439]],[[1440]]]},{"type":"Polygon","id":"POL","properties":{"name":"Poland","iso":"POL"},"arcs":[[-1195,-277,1441,1442,-602,-608,1443,-603,1444,1445]]},{"type":"MultiPolygon","id":"PRI","properties":{"name":"Puerto Rico","iso":"PRI"},"arcs":[[[1446]],[[1447]],[[1448]]]},{"type":"Polygon","id":"PRK","properties":{"name":"Korea, Democratic People's Republic of","iso":"PRK"},"arcs":[[1449,1450,-1167,1451,-519]]},{"type":"MultiPolygon","id":"PRT","properties":{"name":"Portugal","iso":"PRT"},"arcs":[[[1452]],[[1453]],[[1454]],[[1455]],[[1456]],[[1457]],[[1458]],[[-679,1459]]]},{"type":"Polygon","id":"PRY","properties":{"name":"Paraguay","iso":"PRY"},"arcs":[[-40,-290,-311]]},{"type":"MultiPolygon","id":"PSE","properties":{"name":"Palestinian Territories","iso":"PSE"},"arcs":[[[-658,1460,-1070]],[[-1067,-1087]]]},{"type":"MultiPolygon","id":"PYF","properties":{"name":"French Polynesia","iso":"PYF"},"arcs":[[[1461]],[[1462]],[[1463]],[[1464]],[[1465]],[[1466]],[[1467]],[[1468]],[[1469]],[[1470]],[[1471]]]},{"type":"Polygon","id":"QAT","properties":{"name":"Qatar","iso":"QAT"},"arcs":[[1472,1473]]},{"type":"Polygon","id":"ROU","properties":{"name":"Romania","iso":"ROU"},"arcs":[[-252,1474,-887,1475,-1208,1476,1477]]},{"type":"MultiPolygon","id":"RUS","properties":{"name":"Russian Federation","iso":"RUS"},"arcs":[[[1478]],[[1479]],[[1480]],[[1481]],[[1482]],[[1483]],[[1484]],[[1485]],[[1486]],[[1487]],[[1488]],[[1489]],[[1490]],[[1491]],[[1492]],[[1493]],[[-1196,-1446,1494,-1193,1495]],[[1496]],[[1497]],[[1498]],[[1499]],[[1500]],[[1501]],[],[[1502]],[[1503]],[[1504]],[[1505]],[[1506]],[[1507]],[[1508]],[],[[1509]],[[1510]],[[1511]],[[1512]],[[1513]],[[1514]],[[1515]],[[1516]],[[1517]],[[1518]],[[1519]],[[1520]],[[1521]],[[1522]],[[1523]],[[1524]],[[1525]],[[1526]],[[1527]],[[1528]],[[1529]],[[1530]],[[1531]],[[1532]],[[1533]],[[1534]],[[1535]],[[1536]],[[1537]],[[1538]],[[1539]],[[1540]],[[1541]],[[-1450,-541,-1257,-539,-1131,1542,-217,-770,1543,1544,-280,-1200,-684,1545,-699,-1336,1546]],[[1547]],[[1548]],[[1549]],[[1550]],[[1551]],[[1552]],[[1553]],[[1554]],[[1555]],[[1556]],[[1557]],[[1558]],[[1559]],[[1560]],[[1561]],[[1562]],[[1563]],[[1564]],[[1565]],[[1566]],[[1567]],[[1568]],[[1569]],[[1570]],[[1571]],[[1572]],[[1573]],[[1574]],[[1575]],[[1576]]]},{"type":"Polygon","id":"RWA","properties":{"name":"Rwanda","iso":"RWA"},"arcs":[[-220,-556,1577,1578]]},{"type":"Polygon","id":"ESH","properties":{"name":"Western Sahara","iso":"ESH"},"arcs":[[-1204,-639,-1277,1579]]},{"type":"MultiPolygon","id":"SAU","properties":{"name":"Saudi Arabia","iso":"SAU"},"arcs":[[[1580]],[[1581]],[[-1173,1582,-1473,1583,-31,-1354,1584,1585,-1089,-1061]]]},{"type":"Polygon","id":"SDN","properties":{"name":"Sudan","iso":"SDN"},"arcs":[[-662,-691,1586,-331,1587,-1182,-655,1588]]},{"type":"Polygon","id":"SSD","properties":{"name":"South Sudan","iso":"SSD"},"arcs":[[-690,-1137,1589,-561,-326,-1587]]},{"type":"Polygon","id":"SEN","properties":{"name":"Senegal","iso":"SEN"},"arcs":[[-779,-789,1590,-781,1591,-1275,-1233]]},{"type":"Polygon","id":"SGP","properties":{"name":"Singapore","iso":"SGP"},"arcs":[[1592]]},{"type":"MultiPolygon","id":"SGS","properties":{"name":"South Georgia and the South Sandwich Islands","iso":"SGS"},"arcs":[[[1593]],[[1594]]]},{"type":"MultiPolygon","id":"SHN","properties":{"name":"Saint Helena, Ascension and Tristan da Cunha","iso":"SHN"},"arcs":[[[1595]],[[1596]]]},{"type":"MultiPolygon","id":"SLB","properties":{"name":"Solomon Islands","iso":"SLB"},"arcs":[[[1597]],[[1598]],[[1599]],[[1600]],[[1601]],[[1602]],[[1603]],[[1604]],[[1605]],[[1606]],[[1607]],[[1608]],[[1609]],[[1610]],[[1611]],[[1612]],[[1613]],[[1614]],[[1615]],[[1616]],[[1617]]]},{"type":"MultiPolygon","id":"SLE","properties":{"name":"Sierra Leone","iso":"SLE"},"arcs":[[[1618]],[[-1180,1619,-776]]]},{"type":"Polygon","id":"SLV","properties":{"name":"El Salvador","iso":"SLV"},"arcs":[[-853,-867,1620]]},{"type":"Polygon","id":"SMR","properties":{"name":"San Marino","iso":"SMR"},"arcs":[[-1084]]},{"type":"Polygon","id":"somaliland","properties":{"name":"Somaliland","iso":null},"arcs":[[-687,-619,1621,1622]]},{"type":"Polygon","id":"SOM","properties":{"name":"Somalia","iso":"SOM"},"arcs":[[-688,-1623,1623,-1133]]},{"type":"Polygon","id":"SPM","properties":{"name":"Saint Pierre and Miquelon","iso":"SPM"},"arcs":[[1624]]},{"type":"Polygon","id":"SRB","properties":{"name":"Serbia","iso":"SRB"},"arcs":[[-1475,-251,-1232,-1170,-1256,-270,-880,-888]]},{"type":"MultiPolygon","id":"STP","properties":{"name":"Sao Tome and Principe","iso":"STP"},"arcs":[[[1625]],[[1626]]]},{"type":"Polygon","id":"SUR","properties":{"name":"Suriname","iso":"SUR"},"arcs":[[-307,-860,1627,-732]]},{"type":"Polygon","id":"SVK","properties":{"name":"Slovakia","iso":"SVK"},"arcs":[[-890,-212,-600,-1443,1628]]},{"type":"Polygon","id":"SVN","properties":{"name":"Slovenia","iso":"SVN"},"arcs":[[-1082,-205,-889,-882,1629]]},{"type":"MultiPolygon","id":"SWE","properties":{"name":"Sweden","iso":"SWE"},"arcs":[[[1630]],[[1631]],[[1632]],[[1633]],[[1634]],[[-1337,-701,1635]]]},{"type":"Polygon","id":"SWZ","properties":{"name":"Swaziland","iso":"SWZ"},"arcs":[[1636,-1264]]},{"type":"Polygon","id":"SXM","properties":{"name":"Sint Maarten (Dutch part)","iso":"SXM"},"arcs":[[-1202,1637]]},{"type":"Polygon","id":"SYC","properties":{"name":"Seychelles","iso":"SYC"},"arcs":[[1638]]},{"type":"Polygon","id":"SYR","properties":{"name":"Syrian Arab Republic","iso":"SYR"},"arcs":[[-1088,-1073,-1178,1639,1640,-1063]]},{"type":"MultiPolygon","id":"TCA","properties":{"name":"Turks and Caicos Islands","iso":"TCA"},"arcs":[[[1641]],[[1642]],[[1643]]]},{"type":"Polygon","id":"TCD","properties":{"name":"Chad","iso":"TCD"},"arcs":[[-330,-554,-1304,-1301,-1183,-1588]]},{"type":"Polygon","id":"TGO","properties":{"name":"Togo","iso":"TGO"},"arcs":[[-773,-234,-229,1644]]},{"type":"MultiPolygon","id":"THA","properties":{"name":"Thailand","iso":"THA"},"arcs":[[[1645]],[[1646]],[[1647]],[[1648]],[[1649]],[[1650]],[[1651]],[[1652]],[[1653]],[[-1175,-1144,1654,-1287,1655,-1253]]]},{"type":"MultiPolygon","id":"TJK","properties":{"name":"Tajikistan","iso":"TJK"},"arcs":[[[-1140]],[[1656]],[[-1138,-536,-6,1657]]]},{"type":"MultiPolygon","id":"TKM","properties":{"name":"Turkmenistan","iso":"TKM"},"arcs":[[[1658]],[[-4,-1055,1659,-1129,1660]]]},{"type":"MultiPolygon","id":"TLS","properties":{"name":"Timor-Leste","iso":"TLS"},"arcs":[[[-896,1661]],[[-898,1662]],[[1663]]]},{"type":"MultiPolygon","id":"TON","properties":{"name":"Tonga","iso":"TON"},"arcs":[[[1664]],[[1665]],[[1666]]]},{"type":"MultiPolygon","id":"TTO","properties":{"name":"Trinidad and Tobago","iso":"TTO"},"arcs":[[[1667]],[[1668]]]},{"type":"MultiPolygon","id":"TUN","properties":{"name":"Tunisia","iso":"TUN"},"arcs":[[[1669]],[[1670]],[[-1185,-642,1671]]]},{"type":"MultiPolygon","id":"TUR","properties":{"name":"Turkey","iso":"TUR"},"arcs":[[[1672]],[[-768,-49,-214,-1059,-1064,-1641,1673]],[[-832,-248,1674]]]},{"type":"MultiPolygon","id":"TWN","properties":{"name":"Taiwan","iso":"TWN"},"arcs":[[[1675]],[[1676]]]},{"type":"MultiPolygon","id":"TZA","properties":{"name":"Tanzania, United Republic of","iso":"TZA"},"arcs":[[[1677]],[[1678]],[[1679]],[[-1135,1680,-1269,-1281,1681,-557,-221,-1579,1682]]]},{"type":"Polygon","id":"UGA","properties":{"name":"Uganda","iso":"UGA"},"arcs":[[-1578,-555,-1590,-1136,-1683]]},{"type":"MultiPolygon","id":"UKR","properties":{"name":"Ukraine","iso":"UKR"},"arcs":[[[1683]],[[-1477,-1207,-1476,-891,-1629,-1442,-276,-1545,1684]]]},{"type":"Polygon","id":"URY","properties":{"name":"Uruguay","iso":"URY"},"arcs":[[-42,-310,1685]]},{"type":"MultiPolygon","id":"USA","properties":{"name":"United States","iso":"USA"},"arcs":[[[1686]],[[1687]],[[1688]],[[1689]],[[1690]],[[1691]],[[1692]],[[1693]],[[1694]],[[1695]],[[1696]],[[1697]],[[1698]],[[1699]],[[1700]],[[1701]],[[1702]],[[1703]],[[1704]],[[1705]],[[1706]],[[1707]],[[1708]],[[1709]],[[1710]],[[1711]],[[1712]],[[1713]],[[1714]],[[1715]],[[1716]],[[1717]],[[1718]],[[1719]],[[-344,1720,-1228,1721,-429]],[[1722]],[[1723]],[[1724]],[[1725]],[[1726]],[[1727]],[[1728]],[[1729]],[[1730]],[[1731]],[[1732]],[[1733]],[[1734]],[[1735]],[[1736]],[[1737]],[[1738]],[[1739]],[[1740]],[[1741]],[[1742]],[[1743]],[[1744]],[[1745]],[[1746]],[[1747]],[[1748]],[[1749]],[[1750]],[[1751]],[[1752]],[[1753]],[[1754]],[[1755]],[[1756]],[[1757]],[[1758]],[[1759]],[[1760]],[[1761]],[[1762]],[[1763]],[[1764]],[[1765]],[[1766]],[[1767]],[[1768]],[[1769]],[[1770]],[[1771]],[[1772]],[[1773]],[[1774]],[[1775]],[[1776]],[[1777]],[[1778]],[[1779]],[[1780]],[[1781]],[[1782]],[[1783]],[[1784]],[[1785]],[[1786]],[[-427,1787,-372,1788]]]},{"type":"MultiPolygon","id":"UZB","properties":{"name":"Uzbekistan","iso":"UZB"},"arcs":[[[-1141]],[[-1142]],[[-1139,-1658,-5,-1661,-1128]]]},{"type":"Polygon","id":"VCT","properties":{"name":"Saint Vincent and the Grenadines","iso":"VCT"},"arcs":[[1789]]},{"type":"MultiPolygon","id":"VEN","properties":{"name":"Venezuela, Bolivarian Republic of","iso":"VEN"},"arcs":[[[1790]],[[1791]],[[1792]],[[1793]],[[-858,-314,-566,1794]]]},{"type":"Polygon","id":"VGB","properties":{"name":"Virgin Islands, British","iso":"VGB"},"arcs":[[1795]]},{"type":"MultiPolygon","id":"VIR","properties":{"name":"Virgin Islands, U.S.","iso":"VIR"},"arcs":[[[1796]],[[1797]],[[1798]]]},{"type":"MultiPolygon","id":"VNM","properties":{"name":"Viet Nam","iso":"VNM"},"arcs":[[[1799]],[[1800]],[[1801]],[[1802]],[[1803]],[[1804]],[[1805]],[[-1146,-1177,-525,1806]]]},{"type":"MultiPolygon","id":"VUT","properties":{"name":"Vanuatu","iso":"VUT"},"arcs":[[[1807]],[[1808]],[[1809]],[[1810]],[[1811]],[[1812]],[[1813]],[[1814]],[[1815]],[[1816]],[[1817]],[[1818]],[[1819]],[[1820]]]},{"type":"MultiPolygon","id":"WLF","properties":{"name":"Wallis and Futuna","iso":"WLF"},"arcs":[[[1821]],[[1822]]]},{"type":"MultiPolygon","id":"WSM","properties":{"name":"Samoa","iso":"WSM"},"arcs":[[[1823]],[[1824]]]},{"type":"MultiPolygon","id":"YEM","properties":{"name":"Yemen","iso":"YEM"},"arcs":[[[1825]],[[1826]],[[1827]],[[-1585,-1353,1828]]]},{"type":"MultiPolygon","id":"ZAF","properties":{"name":"South Africa","iso":"ZAF"},"arcs":[[[1829]],[[-1265,-1637,-1271,1830,-1292,-323,1831],[-1192,1832]]]},{"type":"Polygon","id":"ZMB","properties":{"name":"Zambia","iso":"ZMB"},"arcs":[[-1267,1833,-1294,-8,-558,-1682,-1280]]},{"type":"Polygon","id":"ZWE","properties":{"name":"Zimbabwe","iso":"ZWE"},"arcs":[[-325,-1834,-1266,-1832]]},{"type":"MultiPolygon","id":"SJM","properties":{"name":"Svalbard and Jan Mayen","iso":"SJM"},"arcs":[[[1834]],[[1835]],[[1836]],[[1837]],[[1838]],[[1839]],[[1840]],[[1841]],[[1842]],[[1843]]]},{"type":"MultiPolygon","id":"BES","properties":{"name":"Bonaire, Sint Eustatius and Saba","iso":"BES"},"arcs":[[[1844]],[[1845]],[[1846]]]},{"type":"Polygon","id":"MYT","properties":{"name":"Mayotte","iso":"MYT"},"arcs":[[1847]]},{"type":"Polygon","id":"MTQ","properties":{"name":"Martinique","iso":"MTQ"},"arcs":[[1848]]},{"type":"Polygon","id":"REU","properties":{"name":"Réunion","iso":"REU"},"arcs":[[1849]]},{"type":"Polygon","id":"VAT","properties":{"name":"Holy See (Vatican City State)","iso":"VAT"},"arcs":[[1850]]},{"type":"MultiPolygon","id":"TKL","properties":{"name":"Tokelau","iso":"TKL"},"arcs":[[[1851]],[[1852]],[[1853]]]},{"type":"MultiPolygon","id":"TUV","properties":{"name":"Tuvalu","iso":"TUV"},"arcs":[[[1854]],[[1855]],[[1856]],[[1857]],[[1858]],[[1859]],[[1860]],[[1861]],[[1862]]]},{"type":"Polygon","id":"BVT","properties":{"name":"Bouvet Island","iso":"BVT"},"arcs":[[1863]]},{"type":"Polygon","id":"GIB","properties":{"name":"Gibraltar","iso":"GIB"},"arcs":[[1864]]},{"type":"MultiPolygon","id":"GLP","properties":{"name":"Guadeloupe","iso":"GLP"},"arcs":[[[1865]],[[1866]],[[1867]]]},{"type":"Polygon","id":"UMI","properties":{"name":"United States Minor Outlying Islands","iso":"UMI"},"arcs":[[1868]]}]}},"arcs":[[[3058,5901],[0,-2],[-2,1],[-1,3],[-2,3],[0,3],[1,1],[3,-8],[1,-1]],[[7069,7316],[-3,-3],[-11,-9],[-7,4],[-10,0],[-8,-1],[-10,-2],[-4,0],[-5,-4],[-3,-1],[-5,-3],[-2,-4],[-4,-5],[-3,-3],[-3,-4],[-3,1],[-2,-3],[-2,-5],[-4,-7],[-3,-3],[-1,-5],[1,-2],[4,-4],[2,-6],[2,-13],[2,-3],[0,-5],[1,-3],[-2,-5],[0,-2],[2,-5],[0,-3],[-2,-3],[-2,-8],[-5,-5],[-2,-5],[-3,-6],[-1,-5],[-3,-4],[0,-2],[4,-7],[0,-6],[-1,-4],[1,-4],[-2,-4],[-5,-4],[-6,-2],[-9,0],[-2,1],[-7,5],[-3,-3],[0,-6],[5,-10],[2,-6],[2,-10],[2,-5],[0,-4],[-5,-6],[-5,-4],[-10,-3],[-2,-3],[-1,-11],[-1,-4],[0,-4],[-5,-15],[1,-10],[0,-18],[-2,-6],[-3,-6],[-3,-4],[-3,-2],[-3,1],[-1,4],[-4,5],[-2,0],[-2,-3],[-3,1],[-3,2],[-2,0],[-4,-7],[-8,-8],[-3,0],[-1,-2],[2,-6],[2,-1],[0,-2],[-7,-7],[-5,-1],[-5,2],[-2,3],[-3,0],[-3,-2],[-3,-4],[-3,-9],[0,-1],[-6,-6],[-1,-7],[-2,-11],[1,-6],[0,-10],[-1,-8],[-1,-4],[0,-4],[2,-5],[-2,-5],[-2,-2],[-6,-3],[-8,-5],[-16,-8],[-5,-1],[-2,1],[-9,0],[-7,-3],[-3,-3],[-2,-4],[-3,2],[-11,4],[-31,-5],[-3,1],[-10,6],[-13,8],[-8,5],[-11,6]],[[6689,6903],[7,16],[6,13],[7,14],[6,13],[1,5],[0,9],[-2,12],[-2,6],[-9,2],[-14,4],[-1,0],[-1,10],[1,4],[-1,8],[0,7],[1,10],[1,5],[-4,20],[-2,11],[-1,12],[-1,3],[0,5],[4,11],[2,2],[2,5],[2,3],[0,2],[-3,1],[-4,0],[-3,2],[-2,7],[1,8],[-1,14],[2,7],[2,5],[7,1],[-3,9],[-1,1],[0,3],[3,2],[3,4],[0,4],[3,8],[0,4],[2,7],[0,6],[-1,3],[0,4],[3,2],[0,3],[1,4],[0,3],[1,2],[0,6]],[[6701,7235],[2,0],[5,-9],[5,-3],[8,2],[3,-4],[4,-7],[1,-4],[1,-1],[2,4],[2,1],[2,-1],[4,1],[5,5],[5,6],[1,7],[1,4],[2,2],[-2,5],[0,5],[2,1],[3,0],[6,3],[10,6],[5,0],[0,3],[1,2],[3,2],[5,5],[4,6],[1,5],[1,8],[2,11],[3,12],[0,6],[1,4],[4,4],[4,2],[6,1],[7,0],[2,12],[1,3],[2,3],[1,0],[9,-9],[7,-2],[3,-2],[2,1]],[[6847,7335],[8,1],[7,-2],[3,-6],[4,-1],[5,3],[1,-2],[2,-1],[2,1],[2,-2],[0,-2]],[[6881,7324],[2,-6],[4,-5],[3,-1],[4,4],[1,-1],[1,2],[0,3],[2,2],[5,3],[3,4],[2,1],[1,-1],[2,1],[0,3],[2,1],[4,-4],[3,-6],[3,-3],[1,0],[3,5],[0,16],[2,4],[4,3],[5,1],[4,-1],[2,-3],[3,0],[3,7],[0,6],[-1,6],[0,3],[3,3],[3,5],[3,7],[2,8],[4,5],[4,2],[4,-2],[6,-6],[2,-8],[-1,-10],[0,-5],[1,-1],[5,2],[2,-1],[0,-3],[-1,-4],[-2,-20],[0,-10],[-1,-8],[1,-7],[2,-9],[2,-7],[3,-3],[2,1],[4,4],[6,8],[6,4],[8,3],[3,8],[4,6],[8,8],[5,3],[3,1],[5,-3],[2,0],[0,-3],[-1,-3],[-2,-3],[1,-2],[2,0],[10,5],[2,0],[1,3],[4,3],[5,-3],[4,1],[2,-2],[4,-7]],[[7079,7328],[-1,-1],[-3,4],[-5,-3],[-5,-4],[0,-2],[4,-6]],[[5665,4557],[0,-7],[1,-11],[0,-7],[1,-4],[0,-2],[-1,-2],[0,-4],[-1,-4],[0,-23],[-1,-8],[2,-13],[-1,-4],[-1,-7],[-2,-12],[0,-3],[3,-9],[0,-2],[-2,0],[-2,-1],[-14,0],[-16,0],[-22,0],[0,-45],[0,-37],[0,-37],[0,-19],[0,-32],[2,-17],[3,-20],[5,-5],[4,-7],[2,-6],[5,-9],[7,-12],[6,-11],[5,-10]],[[5648,4167],[-8,-3],[-21,-8],[-10,-4],[-7,-2],[-8,-4],[-4,3],[-5,0],[-5,-3],[-5,-1],[-6,4],[-4,4],[-5,1],[-8,-1],[-8,1],[-7,3],[-5,1],[-3,-1],[-4,1],[-3,2],[-3,4],[-4,7],[-3,8],[-1,2],[-17,0],[-4,1],[-21,0],[-21,0],[-11,0],[-21,0],[-17,0],[-5,-1],[-6,0],[-3,2],[-3,5],[-3,3],[-3,5],[-3,6],[-2,2],[-6,2],[-2,0],[-7,-5],[-2,-3],[-6,-6],[-10,0],[-3,3],[-2,-1],[-3,-3],[-5,-1]],[[5325,4190],[1,22],[1,9],[0,42],[-2,8],[5,7],[1,5],[2,7],[1,15],[6,35],[3,35],[3,16],[2,18],[9,24],[3,14],[5,8],[7,7],[5,14],[2,9],[3,18],[0,19],[2,25],[-1,7],[-2,10],[-1,7],[-2,7],[-3,5],[-1,10],[-5,14],[-1,10],[-2,7],[0,9],[-2,9],[-4,20],[0,3],[1,1],[1,-1],[8,18],[1,4],[-1,4],[0,4],[1,6],[-8,34],[-7,32],[-1,16],[-8,21],[-4,13],[-1,10],[-2,4],[3,2],[5,2],[6,2],[8,8]],[[5362,4845],[3,1],[3,-1],[2,1],[17,0],[4,-1],[2,0],[6,-1],[7,0],[3,1],[18,0],[9,1],[9,-1],[7,0],[3,-2],[3,-3],[2,-4],[1,-5],[2,-3],[0,-17],[1,-9],[2,-9],[3,-9],[1,-7],[0,-6],[1,-6],[2,-6],[2,-3],[0,-2],[3,-10],[5,-15],[3,-11],[1,-1],[2,0],[8,2],[2,-3],[5,5],[4,1],[4,2],[3,2],[2,0],[7,-3],[1,-1],[6,0],[5,2],[1,15],[0,3],[1,6],[2,5],[0,11],[1,8],[4,6],[6,3],[3,0],[6,2],[8,2],[3,0],[0,-1],[-2,-11],[0,-3],[1,-4],[1,-2],[17,0],[8,-1],[7,0],[2,-2],[1,-5],[-1,-11],[-1,-15],[1,-14],[2,-13],[0,-20],[-1,-13],[-1,-15],[0,-17],[1,-7],[3,-8],[4,-8],[3,-10],[2,-13],[0,-16],[1,-9],[-1,-5],[-2,-2],[-1,-4],[1,-7],[0,-6],[1,-3],[2,-2],[5,7],[2,1],[3,0],[4,-1],[9,0],[7,6],[4,0],[4,-2],[4,0],[2,2],[0,2],[1,3],[1,1]],[[5333,4895],[1,3],[3,7],[1,3],[3,1],[1,2],[1,4],[0,2],[7,5],[2,4],[2,2],[2,0],[1,-1],[2,-6],[2,-4],[1,-1]],[[5362,4916],[0,-1],[-7,-5],[-4,-9],[-2,-4],[-3,-4],[-1,-2],[2,-4],[0,-16],[-1,-17],[-7,-2],[-1,0]],[[5338,4852],[-1,7],[0,5],[1,4],[-1,9],[-2,7],[-2,9],[0,2]],[[3249,6233],[-4,-3],[0,2],[3,4],[2,-1],[-1,-2]],[[5570,7595],[-1,-9],[0,-8],[-2,-3],[1,-8],[0,-6],[2,-9],[3,-4],[1,-7],[1,-2],[4,1],[2,-4]],[[5581,7536],[0,-4],[2,-7],[0,-2],[-2,-7],[-4,-3],[-3,-9],[0,-3],[-1,-7],[-2,-2],[-4,-1],[-4,-5],[0,-2],[2,-6],[0,-3],[-2,1],[-1,-6],[-2,-3],[-5,3]],[[5555,7470],[-1,6],[0,4],[-4,10],[-10,9],[-2,5],[-2,7],[3,-2],[0,5],[-3,9],[1,10],[3,8],[-1,10],[1,7],[-1,5],[0,6],[2,8],[2,5],[0,8],[-3,4],[-4,1]],[[5536,7595],[0,3],[1,4],[0,4],[-2,6],[1,5],[6,14],[1,4],[3,5],[1,-1],[0,-6],[2,-3],[2,0],[5,4]],[[5556,7634],[1,-1],[3,-6],[1,-5],[5,-4],[2,-3],[1,-3],[1,-9],[1,-5],[-1,-3]],[[5571,8642],[0,-2],[-5,1],[0,2],[2,1],[3,-2]],[[5545,8650],[-3,-2],[-1,2],[1,3],[2,0],[1,-3]],[[5554,8659],[3,1],[5,-6],[-2,-4],[-2,1],[-3,-3],[0,-3],[-6,-1],[-2,1],[-2,8],[4,5],[0,2],[2,3],[3,-4]],[[5039,7637],[2,2],[2,0],[4,-3],[0,-3],[-1,-2]],[[5046,7631],[-6,-4],[-1,1],[0,3],[-1,2],[1,4]],[[6497,6576],[0,-2],[-3,0],[-1,-1],[-4,2],[1,3],[4,3],[3,-5]],[[6460,6582],[-1,3],[2,2],[1,-2],[-2,-3]],[[6480,6581],[-2,-1],[-2,2],[4,3],[3,4],[-1,-7],[-2,-1]],[[6512,6591],[-1,-1],[-2,1],[-1,2],[2,2],[2,-4]],[[6565,6622],[-1,0],[-2,-6],[-2,-2],[-1,-3],[-3,-3],[-2,7],[1,1],[-1,5],[-2,1],[-3,-4],[0,-16],[-1,-3],[0,-9],[1,-4],[-1,-6],[1,-2],[3,0],[2,-7],[0,-2],[-6,-2],[-2,0],[-4,-2],[-2,-3],[1,-3],[0,-9],[-1,-5],[-4,-15],[-2,-11],[-2,-9],[0,-19]],[[6532,6491],[-2,-5],[-6,2],[-3,0],[-4,1],[-5,2],[-6,1],[-6,2],[-6,1],[-6,2],[-6,1],[-6,2],[-5,1],[-7,2],[-5,1],[-2,3],[-1,4],[-2,4],[-1,4],[-2,3],[-1,4],[-2,4],[-1,4],[-2,3],[-1,4],[-2,4],[-1,4],[-5,11],[-1,4],[-3,6],[-1,3],[0,9]],[[6431,6582],[1,3],[2,-5],[2,1],[1,-1],[1,-10],[1,-4],[2,-1],[6,-1],[3,1],[8,7],[3,3],[11,-1],[8,-3],[13,-1],[3,0],[7,6],[4,4],[3,2],[2,4],[2,10],[2,5],[1,6],[3,5],[9,14],[6,11],[1,4],[3,5],[2,6],[12,17],[2,7],[1,8],[1,0]],[[6557,6684],[2,0],[0,-18],[-1,-3],[1,-3],[3,-1],[1,2]],[[6563,6661],[1,-5],[1,-34]],[[6560,6636],[1,-1],[1,2],[0,4],[-2,-2],[0,-3]],[[3206,2032],[3,-2],[6,1],[5,0],[0,-1],[5,1],[1,-2],[-4,-3],[-1,1],[-9,0],[-3,-2],[-2,0],[-3,-4],[-3,2],[-1,2],[2,3],[2,0],[2,4]],[[3092,2024],[0,13],[1,17],[0,47],[0,32],[0,18]],[[3093,2151],[1,-3],[7,-12],[2,-4],[1,-6],[-3,3],[-3,-2],[-2,-7],[0,-2],[3,-4],[7,-1],[0,-1],[4,-14],[9,-13],[5,-8],[6,-7],[6,-6],[6,-4],[5,-5],[6,-7],[6,-6],[7,-4],[7,-3],[10,2],[4,-1],[2,-2],[-2,-6],[-3,-6],[-3,-2],[-7,0],[-4,1],[-9,-4],[-3,0],[-6,-3],[-4,1],[-8,5],[-5,1],[-19,2],[-6,1],[-6,2],[-7,-1],[-4,0],[-1,-1]],[[3280,2927],[1,-4],[-2,1],[-3,3],[-1,4],[5,-2],[0,-2]],[[3259,3903],[1,-4],[2,-3],[5,-5],[4,-10],[4,-15],[4,-11],[7,-12],[3,-3],[2,-4],[8,-10],[3,-5],[2,-6],[5,-6],[9,-6],[7,-3],[4,0],[6,-4],[8,-10],[5,-7],[2,-4],[5,-6],[13,-13],[6,-4],[5,-7],[2,1],[3,-1],[5,-4],[4,-6],[7,-15],[0,-7],[-5,-10],[0,-1],[-4,-14],[0,-3],[-1,-2],[-4,-5],[-1,-5],[-2,-5],[-1,-4],[0,-6],[1,-6],[0,-3],[-2,-2],[0,-6],[-2,-1],[0,-4],[-1,-2],[-2,-1],[-3,-10],[-2,-2],[-1,-4],[1,-7],[12,2],[10,-2],[12,-7],[8,-2],[4,2],[2,0],[2,-3],[3,0],[3,1],[2,-1],[2,-4],[2,1],[2,6],[4,7],[3,0],[3,-1],[3,-2],[1,-3],[3,0],[2,4],[1,4],[0,4],[1,3],[2,2],[2,7],[2,2],[4,0],[2,2],[0,3],[3,4],[3,8],[2,1],[2,7],[2,13],[2,17],[0,25]],[[3482,3710],[2,0],[1,-2],[2,-1],[3,3],[2,0],[1,3],[2,0],[2,-3],[2,0],[1,-4],[2,-1],[1,-5],[1,-12],[4,-15],[0,-4],[-1,-4],[0,-5],[-1,-13],[0,-4],[1,-4],[0,-4],[-1,-6],[-2,-8],[-3,-2],[-3,-5],[-2,-2],[-1,2],[-2,-3],[-1,-5],[-5,-4],[-3,0],[-2,-1],[-1,-3],[-5,-2],[-2,-5],[0,-4],[-1,-2],[-3,-1],[-1,-2],[1,-2],[-1,-2],[-4,-2],[-3,-3],[-2,-5],[-2,-3],[-3,-1],[-4,-5],[0,-3],[2,-5],[-2,-3],[-2,2],[-3,-2],[0,-5],[-2,-1],[-1,-2],[0,-3],[-2,-4],[-4,-5],[-4,-15],[-5,-8],[-2,-4],[-1,-5],[-7,-17],[-11,-15],[0,-5],[-2,-6],[-5,-6],[-1,-2]],[[3399,3445],[-1,-3],[0,-4],[-2,-5],[-3,-6],[-1,-6],[1,-7],[0,-12],[-2,-1],[1,-5],[0,-4],[-1,-6],[-4,-12],[0,-5],[1,-2],[0,-9],[-1,-5],[-4,-6],[1,-6],[0,-4],[-1,-4],[0,-4],[2,-3],[0,-4],[-3,-9]],[[3382,3313],[0,-5],[1,-23],[-2,-7],[-3,0],[-2,-2],[-3,-32],[0,-5],[2,-8],[2,-10],[0,-7],[-1,-4],[-3,-2],[3,-14],[4,-8],[15,-13],[6,-7],[6,-10],[4,-10],[0,-8],[-5,-12],[-1,-11],[2,-7],[1,-7],[6,-8],[4,-4],[5,1],[1,-3],[1,-20],[0,-6],[-12,-35],[-8,-17],[-3,-9],[-1,-10],[-3,-5],[-15,-16],[-23,-13],[-19,-7],[-4,-3],[-30,-8],[-5,-1],[-8,1],[-6,-1],[-7,2],[-6,3],[-3,6],[-4,0],[-1,-3],[2,-7],[-1,-10],[1,-5],[2,-1],[4,-7],[-3,0],[1,-3],[2,-2],[0,-6],[-2,-15],[-4,-4],[-1,-3],[-2,-14],[-1,-9],[1,-6],[4,-12],[-1,-9],[-3,-4],[-16,-13],[-7,-2],[-15,0],[-10,8],[-7,5],[-7,4],[-6,2],[1,4],[-3,1],[-4,-4],[-2,-4],[-1,-4],[0,-9],[1,-8],[3,-19],[0,-10],[-1,-13],[2,-8],[2,-3],[6,-4],[2,-2],[3,0],[0,-2],[-2,-3],[1,-4],[4,-1],[9,2],[1,3],[0,5],[-6,1],[1,2],[9,5],[3,1],[3,-5],[2,-5],[1,-7],[0,-9],[-1,-8],[-2,-6],[-10,-5],[-2,2],[-3,6],[0,6],[-3,4],[-4,4],[-5,-1],[-4,-6],[-5,-2],[-1,-6],[11,-8],[5,-3],[4,-1],[-4,-5],[-7,-4],[-4,-3],[-4,-6],[-7,-16],[-1,-4],[-1,-9],[2,-15],[-2,-6],[1,-7],[0,-5],[-2,-7],[-8,-10],[-2,-8],[3,-4],[0,-4],[-1,-4],[-3,0],[-12,2],[-5,-4],[-4,-4],[-2,-4],[-9,-3],[-1,-1],[-9,-19],[-4,-11],[-4,-12],[-2,-4],[0,-7],[1,-6],[0,-4],[2,-6],[3,-6],[17,-26],[4,-2],[18,-3],[4,-4],[2,-6],[1,-5],[-1,-13],[-1,-4],[-6,-8],[-5,-2],[1,-2],[2,0],[5,2],[2,-2],[1,-5],[-3,-2],[-1,-3],[-12,-18],[-6,-5],[-5,-6],[-7,-6],[-3,-3],[-3,-7],[-6,-8],[-6,-17],[0,-4],[1,-2],[-4,-29],[-1,-4],[-2,-4],[-7,-6],[-3,-1],[-4,4],[-6,10],[-1,-4],[-3,-3],[5,-1],[2,-2],[3,-7],[-2,-2],[-8,-5],[-5,-6],[-3,-6],[-1,-5],[-1,-10],[-1,-6],[-2,-5],[3,-9],[2,-12],[1,-8],[-1,-6],[-5,-1],[-3,1],[-2,-3],[3,0],[4,-3],[4,1],[3,-4],[6,-18],[6,-10],[2,-7],[-1,-2]],[[3098,2168],[-1,3],[-7,2],[-5,3],[-8,4],[-8,0],[-6,4],[-7,4],[-27,0],[-14,1],[-14,0],[-1,1],[0,5],[-2,4],[-3,4],[-3,3],[-4,9],[3,14],[0,4],[-2,3],[0,6],[2,2],[1,7],[-2,13],[-2,3],[-3,1],[-3,-2],[-5,1],[-2,-1],[-2,-3],[-4,-3],[-2,1],[0,4],[-2,3],[-1,3],[0,5],[-1,7],[-2,7],[-3,6],[-1,6],[0,7],[1,6],[-1,6],[-2,6],[1,7],[2,4],[1,5],[9,1],[-1,6],[2,5],[1,5],[2,2],[7,5],[2,3],[2,7],[0,3],[-1,9],[3,6],[4,3],[2,7],[-1,7],[-2,6],[-3,2],[0,6],[1,5],[4,12],[0,5],[1,2],[5,6],[2,6],[4,3],[0,3],[-2,3],[0,9],[1,6],[6,7],[1,3],[0,4],[-1,9],[-1,6],[-3,10],[1,3],[4,3],[1,5],[-1,5],[-2,2],[0,15],[2,3],[5,1],[0,4],[4,6],[0,6],[-5,9],[-2,6],[-12,4],[-1,5],[0,3],[3,-2],[14,3],[3,-2],[3,1],[1,8],[2,4],[0,4],[-2,3],[-3,0],[-14,3],[0,16],[2,2],[2,8],[-3,10],[2,6],[-1,4],[-2,3],[-2,5],[0,6],[4,3],[0,3],[-1,4],[-3,1],[-6,5],[-1,4],[1,12],[0,8],[-1,4],[1,3],[2,3],[-1,7],[-1,3],[0,3],[2,6],[3,-1],[5,3],[0,8],[-2,11],[-2,7],[0,3],[1,2],[-1,10],[0,6],[1,17],[0,6],[-2,6],[0,6],[1,4],[2,5],[1,5],[2,3],[1,3],[-3,5],[-1,4],[2,5],[1,0],[2,4],[0,8],[-1,3],[0,7],[-1,4],[2,3],[3,-1],[0,5],[1,1],[3,17],[-1,13],[2,5],[4,5],[4,3],[3,1],[2,3],[1,5],[0,3],[-1,3],[-2,3],[-2,14],[0,9],[-4,16],[0,12],[1,7],[-2,8],[3,11],[0,3],[-1,8],[-1,4],[1,5],[2,7],[0,7],[3,2],[2,4],[3,0],[1,1],[0,3],[3,8],[2,3],[3,1],[2,4],[0,5],[-1,6],[1,6],[-1,9],[0,5],[-1,4],[0,8],[-2,1],[-1,3],[1,2],[2,1],[2,3],[1,13],[2,8],[0,3],[2,8],[3,9],[1,5],[0,3],[5,2],[1,2],[0,8],[-1,9],[0,19],[2,12],[0,6],[-2,2],[-2,-2],[-2,1],[-2,4],[0,10],[2,4],[0,4],[-2,5],[-2,10],[0,9],[-2,2],[0,7],[-2,3],[-1,5],[0,8],[2,0],[1,5],[-2,4],[-2,0],[-2,2],[-2,10],[-2,6],[1,8],[0,6],[1,6],[0,4],[2,2],[2,0],[2,5],[-1,4],[0,3],[1,4],[1,9],[3,14],[0,5],[2,-2],[4,2],[2,8],[1,2],[0,3],[-2,1],[-1,2],[0,3],[1,9],[0,6],[-2,13],[-1,12],[1,5],[5,8],[0,3],[2,15],[0,9],[1,4],[1,9],[4,7],[1,5],[1,0],[3,7],[3,6],[2,3],[0,4],[3,16],[3,10],[3,14],[4,3],[1,-2],[2,0],[1,3],[4,2],[2,2],[0,8],[-1,4],[-3,8],[-3,9],[0,9],[5,12],[-1,5],[-2,19],[-1,5],[-1,9],[0,4],[1,11],[2,4],[3,4],[-2,2],[0,3],[-1,5],[-1,1],[-1,4],[0,5],[1,7],[2,2],[2,5],[2,2],[1,4],[6,5],[4,4],[9,7],[6,5],[1,3],[0,3],[3,17],[4,22],[2,14],[-5,11]],[[3133,3869],[4,10],[0,5],[1,3],[6,6],[1,3],[0,5],[1,3],[2,0],[8,6],[1,3],[2,13],[1,2],[3,-2],[1,-3],[6,-8],[2,-5],[3,0],[4,1],[1,-1],[14,0],[4,-2],[2,-2],[5,-3],[2,-8],[2,-13],[3,-14],[1,2],[1,11],[4,14],[4,17],[3,4],[4,-1],[1,1],[12,0],[12,0],[0,-3],[2,-6],[3,-4]],[[6264,7523],[-2,-1],[0,3],[2,0],[0,-2]],[[6290,7424],[-5,1],[-4,-3],[-1,1]],[[6280,7423],[-2,8],[-3,9],[1,4],[-1,2],[-5,5],[1,3],[0,7],[-3,1],[-6,-4],[-3,2],[-3,4],[-2,-2],[-1,1],[0,4],[-3,7],[-5,-3],[-3,-1]],[[6242,7470],[-1,3],[-4,8],[-5,6],[-3,3],[-8,-2],[-6,3],[-3,4],[1,2],[-3,11],[0,5],[-1,2],[3,5],[1,5],[0,8],[-2,8],[-3,4],[-2,4],[0,2]],[[6206,7551],[5,1],[4,0],[4,2],[4,1],[2,2],[9,-1],[3,1],[7,0],[1,1],[-1,2],[4,1],[1,1]],[[6249,7562],[2,-6],[2,-1],[1,-3],[-3,-1],[1,-2],[4,-4],[3,0],[2,-1],[0,-2],[4,-6],[0,-2],[-5,-6],[-1,-4],[2,-6],[4,-7],[4,-5],[7,-5],[0,-4],[-1,-4],[-2,-5],[-7,0],[-1,-2],[2,-1],[4,-5],[2,-4],[2,-2],[7,-10],[4,1],[4,-3],[0,-5],[-3,-2],[0,-3],[2,-2],[4,-7],[-1,-2],[-4,1],[0,-3],[2,-3],[0,-12]],[[6248,7546],[2,0],[0,2],[-2,1],[0,-3]],[[257,4357],[-1,-1],[-2,3],[4,3],[1,-1],[-2,-4]],[[500,396],[-9,-2],[-21,3],[-14,6],[-1,4],[-5,5],[27,-2],[13,-3],[20,-6],[-6,-1],[-4,-4]],[[611,454],[-22,13],[12,-1],[2,-3],[12,-5],[-4,-4]],[[542,484],[-3,-1],[-74,7],[-15,2],[-5,3],[3,4],[18,3],[21,-2],[25,-5],[17,-4],[9,-3],[4,-4]],[[724,574],[-6,-1],[-23,4],[-2,4],[-20,4],[2,4],[14,-5],[18,-5],[14,-3],[3,-2]],[[3340,556],[-1,-18],[-2,-5],[-8,-6],[-13,-6],[-40,3],[-18,3],[-7,4],[-6,10],[-16,-1],[-11,-3],[-4,-5],[-26,8],[-39,15],[-5,3],[6,4],[5,1],[5,-2],[1,-6],[5,-2],[97,1],[8,0],[16,2],[9,2],[3,3],[-8,0],[-6,7],[1,6],[10,2],[-1,6],[7,1],[2,3],[12,4],[20,-2],[5,-5],[-3,-8],[0,-5],[8,-1],[5,-5],[-8,-3],[-3,-5]],[[4135,587],[3,-1],[4,5],[5,0],[22,-5],[7,-5],[-11,-2],[-11,-4],[-12,4],[-21,3],[-6,2],[-5,7],[11,5],[14,-9]],[[4101,594],[-7,1],[6,7],[6,1],[6,-3],[-11,-6]],[[3161,571],[-4,0],[-3,6],[-13,4],[-5,8],[-18,8],[-2,5],[3,1],[7,-2],[13,-1],[5,-2],[14,0],[7,-1],[4,-6],[9,-2],[2,-11],[-11,-5],[-8,-2]],[[3131,607],[-5,-3],[-20,1],[-11,3],[6,8],[8,4],[9,1],[18,-3],[-5,-4],[0,-7]],[[4056,615],[-3,-3],[-67,4],[-4,1],[1,4],[22,3],[7,4],[32,-8],[11,-3],[1,-2]],[[581,587],[-34,-3],[-14,2],[-30,6],[-40,12],[-18,7],[-7,4],[-2,4],[2,11],[2,3],[9,4],[4,4],[9,5],[3,3],[10,0],[14,-2],[20,-8],[25,-14],[14,-8],[16,-7],[12,-11],[3,-5],[4,-3],[-2,-4]],[[3045,594],[-18,0],[-12,2],[-7,4],[-3,7],[3,12],[6,7],[6,4],[17,9],[25,7],[9,5],[54,19],[12,2],[9,-3],[-2,-3],[-11,-8],[-8,-7],[-19,-11],[-13,-8],[-17,-11],[-13,-14],[2,-4],[-3,-6],[-17,-3]],[[9655,682],[-3,-4],[-4,-2],[-12,2],[-9,-4],[-9,-1],[-5,2],[-2,3],[-1,7],[15,-3],[9,-3],[7,4],[10,8],[3,-2],[1,-7]],[[3743,644],[33,0],[9,-1],[5,-4],[7,-15],[2,-8],[7,-10],[-1,-19],[-2,-5],[-6,-5],[-9,0],[-4,-3],[7,-4],[-1,-6],[-157,-26],[-6,-1],[-6,-3],[-4,-4],[-122,-5],[-6,7],[1,11],[8,4],[10,12],[6,6],[2,4],[9,-4],[7,1],[10,6],[3,-1],[1,-4],[17,9],[29,21],[10,11],[-2,6],[-10,3],[6,10],[0,9],[4,1],[4,6],[-4,3],[6,13],[22,19],[8,10],[38,12],[19,3],[21,-1],[8,-1],[38,-12],[14,-8],[7,-5],[2,-5],[0,-5],[-2,-6],[-3,-4],[-31,-3],[-4,-2],[-4,-6],[4,-1]],[[854,729],[-6,-2],[-6,4],[8,1],[4,-3]],[[822,727],[-27,4],[-4,1],[13,4],[15,-7],[3,-2]],[[9640,730],[10,-4],[28,0],[23,-4],[2,-4],[-7,-2],[-10,-5],[-6,-2],[-6,0],[-11,2],[-15,0],[-3,-3],[-7,-3],[-8,-6],[-2,5],[-12,13],[11,10],[0,2],[-6,5],[3,3],[6,2],[7,-2],[3,-4],[0,-3]],[[872,748],[-12,-1],[-6,2],[-2,4],[2,1],[15,-2],[7,-2],[-4,-2]],[[854,741],[-2,-1],[-12,1],[-3,1],[-17,2],[-9,5],[3,2],[6,1],[2,2],[17,1],[1,-3],[6,-4],[3,-4],[5,-3]],[[927,750],[-10,-2],[-3,1],[1,3],[-2,3],[1,3],[6,0],[17,-3],[2,-4],[-12,-1]],[[851,764],[19,0],[8,-1],[0,-3],[-8,0],[-4,-3],[-5,0],[-7,2],[-6,3],[3,2]],[[826,761],[-11,-1],[-7,3],[1,2],[19,1],[2,-3],[-4,-2]],[[900,768],[-4,0],[-8,5],[7,0],[5,-5]],[[922,769],[-3,-4],[-9,2],[-4,3],[2,4],[4,1],[6,-1],[4,-5]],[[925,792],[-6,-1],[-13,6],[-2,5],[13,-2],[8,-8]],[[9525,831],[-5,-8],[-5,2],[7,6],[3,0]],[[965,822],[-22,6],[-3,2],[2,3],[8,1],[10,-4],[5,-6],[0,-2]],[[9553,873],[-5,2],[-1,5],[7,5],[6,1],[-3,-7],[-4,-6]],[[1322,896],[-4,-4],[-9,2],[1,3],[7,2],[6,-2],[-1,-1]],[[1359,887],[-3,-1],[-22,5],[-6,5],[6,5],[10,1],[1,-2],[9,-3],[7,0],[1,-2],[-3,-8]],[[1461,885],[-4,-1],[-11,6],[-5,4],[-1,8],[3,1],[5,-1],[10,-4],[7,-1],[3,-4],[-3,-5],[-4,-3]],[[1757,912],[-14,-2],[-4,2],[0,4],[28,13],[6,-3],[-13,-9],[3,-1],[-6,-4]],[[1679,915],[-8,-1],[-2,2],[6,6],[-4,10],[4,0],[4,2],[9,0],[7,-2],[2,-4],[-5,-7],[-11,-4],[-2,-2]],[[1651,935],[6,-9],[1,-4],[-19,-10],[-3,-10],[-34,-4],[-15,3],[-3,3],[0,3],[5,1],[-3,7],[7,8],[-10,7],[-10,0],[3,6],[6,4],[3,-1],[13,0],[13,-1],[13,-2],[27,-1]],[[4427,928],[-2,-13],[2,-5],[5,-7],[0,-8],[-2,-2],[-7,0],[-3,3],[-4,12],[-5,5],[-12,3],[-12,-1],[3,3],[18,4],[4,2],[3,4],[1,5],[3,7],[5,3],[3,0],[2,-5],[0,-5],[-2,-5]],[[9716,944],[-3,-1],[-6,3],[-1,2],[5,7],[1,4],[3,1],[3,-8],[2,-3],[-4,-5]],[[1490,962],[8,-2],[5,-4],[7,-3],[3,-7],[5,-3],[1,-4],[-12,-1],[-3,-1],[-1,-3],[2,-2],[7,-1],[6,2],[9,-2],[11,5],[2,0],[11,-5],[3,-3],[-3,-5],[6,-2],[3,-4],[-1,-9],[-2,-2],[-8,2],[-18,1],[-6,2],[-10,6],[-7,2],[-6,5],[-9,3],[-7,5],[0,6],[-6,3],[-4,0],[-5,-4],[-3,-1],[-3,2],[0,7],[-3,1],[-2,3],[1,8],[3,4],[4,1],[4,-1],[11,2],[7,-1]],[[2947,958],[-3,-1],[-4,3],[2,6],[6,6],[5,1],[3,-2],[-4,-5],[-1,-4],[-4,-4]],[[2095,969],[-3,-3],[-6,1],[-5,4],[-2,6],[1,4],[3,1],[12,-13]],[[2934,973],[-4,-8],[-5,-2],[3,-3],[0,-3],[5,-5],[-2,-6],[-3,-3],[-37,16],[-3,3],[-3,8],[3,4],[6,1],[8,-3],[2,4],[4,0],[1,2],[-10,3],[-3,5],[9,3],[25,-4],[4,-2],[3,-4],[-3,-6]],[[2394,983],[-5,0],[-4,4],[3,2],[6,-4],[0,-2]],[[2467,968],[-10,-1],[2,13],[3,4],[-6,9],[-3,7],[1,2],[9,3],[10,-1],[4,-3],[1,-7],[-4,-5],[4,-2],[0,-8],[-6,-8],[-5,-3]],[[2360,998],[-6,0],[0,4],[13,4],[5,3],[2,-1],[2,-7],[-16,-3]],[[4552,997],[-6,-1],[-4,3],[-2,7],[2,3],[3,1],[5,-8],[2,-5]],[[6901,1019],[-2,0],[7,11],[2,1],[3,-4],[-1,-4],[-4,-3],[-5,-1]],[[4652,1026],[-6,-1],[-5,3],[-2,3],[1,4],[4,1],[4,-4],[4,-6]],[[6941,1041],[-4,-7],[-2,4],[1,3],[5,0]],[[2275,1041],[-3,-6],[0,-6],[7,0],[3,12],[7,2],[3,-7],[-3,-5],[3,-6],[3,0],[6,9],[1,5],[6,6],[14,1],[7,-4],[-5,-8],[-11,-5],[-8,-6],[8,-2],[6,3],[16,5],[6,4],[2,-1],[0,-6],[3,-4],[-2,-9],[-7,-2],[-7,-1],[2,-4],[-1,-3],[-18,2],[-9,-2],[-6,3],[-16,-2],[-9,0],[-7,1],[-7,3],[-6,1],[-8,0],[-8,4],[-6,1],[-10,4],[-5,3],[-4,-1],[-35,6],[-8,-1],[-10,3],[-2,4],[2,4],[3,1],[48,7],[5,2],[4,0],[7,-12],[3,0],[5,5],[8,-1],[5,2],[3,5],[10,5],[6,-1],[6,-2],[3,-6]],[[4917,1081],[-3,-1],[-7,2],[-3,5],[1,3],[3,1],[2,-3],[7,-7]],[[3317,1091],[-3,-1],[-7,3],[-1,3],[5,3],[7,-3],[-1,-5]],[[4929,1107],[3,-2],[4,1],[5,-2],[-8,-13],[-6,-5],[-5,-2],[-1,3],[0,8],[-4,2],[-2,5],[-13,7],[-1,3],[14,1],[8,-2],[6,-4]],[[2952,1115],[4,-5],[-4,-4],[-14,-8],[-8,-3],[-9,-2],[-38,-7],[-5,1],[-2,2],[-2,5],[0,3],[7,5],[29,5],[2,1],[5,9],[5,-2],[5,-9],[4,4],[0,8],[2,0],[7,-4],[1,4],[2,2],[9,-5]],[[3312,1110],[-2,0],[-5,7],[1,4],[2,1],[9,0],[3,-2],[-1,-6],[-7,-4]],[[4835,1120],[-7,-4],[-1,2],[-7,7],[6,1],[4,2],[4,-1],[1,-7]],[[5083,1117],[-9,-2],[-2,2],[-1,4],[1,2],[12,6],[4,0],[2,-3],[-3,-6],[-4,-3]],[[4908,1121],[-5,0],[-1,2],[6,9],[3,2],[10,1],[3,-2],[0,-8],[-1,-3],[-15,-1]],[[3008,1136],[1,-2],[6,2],[3,-3],[-6,-7],[-4,0],[-3,7],[0,2],[3,1]],[[6999,1115],[-5,1],[-5,7],[0,9],[4,4],[2,-8],[4,-3],[3,-7],[-3,-3]],[[5125,1124],[-5,-2],[-5,3],[-3,8],[1,3],[4,2],[7,-1],[3,-7],[-2,-6]],[[5745,1129],[-2,-2],[-5,1],[-4,-2],[-3,0],[-10,4],[-1,6],[1,4],[9,7],[3,1],[5,-1],[4,-6],[3,-9],[0,-3]],[[5035,1137],[-2,-8],[-2,1],[-1,4],[-5,8],[0,4],[3,3],[8,1],[2,-1],[2,-5],[-5,-7]],[[3300,1153],[-4,0],[-3,2],[3,5],[5,-2],[1,-4],[-2,-1]],[[2916,1167],[5,-1],[10,-10],[0,-3],[-3,-1],[-3,-8],[-5,-3],[-12,2],[-12,3],[-3,6],[4,6],[9,3],[3,5],[7,1]],[[5450,1151],[-2,-4],[-9,5],[-5,2],[-3,4],[1,3],[3,3],[6,3],[9,1],[9,-1],[2,-1],[-9,-6],[-2,-9]],[[3000,1169],[-6,-3],[-4,2],[-12,4],[-5,7],[0,3],[2,2],[4,1],[7,-2],[4,-2],[10,-12]],[[3277,1167],[-2,0],[-3,5],[-1,8],[-8,12],[-2,7],[4,2],[9,-4],[8,-10],[1,-3],[-1,-5],[-3,-1],[1,-3],[-3,-8]],[[3053,1198],[0,-7],[4,3],[6,-3],[10,-20],[3,-14],[4,-11],[10,-18],[8,-16],[0,-8],[3,-2],[1,-3],[1,-11],[0,-12],[1,-24],[0,-6],[-5,-8],[-1,-7],[-5,-7],[-15,-12],[-1,-7],[-24,-5],[-13,-2],[-11,3],[-6,-1],[-36,-2],[-1,3],[-8,2],[-7,5],[-2,5],[6,6],[7,1],[7,-1],[6,-2],[36,-2],[12,3],[6,5],[-6,4],[-3,0],[-18,-6],[-6,-1],[-7,2],[-7,5],[0,2],[22,4],[6,4],[2,5],[-15,4],[-6,-1],[-7,1],[-12,11],[-4,-1],[-15,-15],[-6,1],[-7,3],[-6,1],[-6,-2],[8,-7],[1,-2],[-13,-9],[-5,1],[-4,5],[-3,1],[-7,-1],[-7,2],[-12,9],[-1,3],[2,6],[-1,3],[2,3],[5,4],[7,1],[6,-5],[7,-1],[-1,10],[1,3],[5,2],[7,-3],[6,-5],[7,-4],[3,3],[-6,5],[-1,3],[1,3],[5,1],[22,-4],[11,4],[-6,3],[-13,3],[-4,5],[9,4],[10,-1],[18,-4],[6,2],[5,6],[4,2],[12,-1],[10,3],[2,0],[11,-11],[2,2],[1,7],[-2,6],[-3,-1],[-9,3],[-10,1],[-7,2],[-7,4],[0,3],[3,7],[14,8],[7,3],[9,0],[3,3],[-7,4],[-5,4],[-11,1],[-6,-3],[-5,0],[-16,8],[-5,5],[0,10],[3,9],[1,7],[-1,6],[-2,3],[-4,2],[-3,4],[-2,5],[1,7],[3,5],[17,5],[27,5],[3,-2],[6,-8],[1,-13]],[[3314,1222],[-1,-1],[-5,2],[-4,3],[6,1],[3,-2],[1,-3]],[[3128,1280],[-5,-1],[-4,1],[0,5],[-2,1],[9,4],[5,0],[3,-3],[-6,-7]],[[9577,1293],[-2,-2],[-2,1],[-1,3],[1,6],[0,8],[4,-4],[3,-7],[-3,-5]],[[3128,1330],[-6,1],[2,7],[2,1],[3,-1],[2,-5],[-3,-3]],[[7383,1327],[-5,-2],[-1,2],[-7,6],[-1,7],[6,0],[7,-3],[4,-7],[-3,-3]],[[6347,1337],[-4,-2],[-3,2],[2,4],[8,0],[4,-1],[0,-3],[-7,0]],[[9535,1335],[-4,0],[-2,6],[4,0],[2,-6]],[[7403,1338],[-3,-2],[-3,0],[-3,4],[1,2],[3,1],[8,-3],[-3,-2]],[[3111,1297],[-3,-4],[-3,-1],[-4,2],[-3,-8],[-4,-4],[-2,1],[-2,-2],[-5,0],[-6,10],[0,7],[1,3],[8,10],[6,14],[7,11],[14,10],[3,-1],[1,-4],[-7,-8],[-1,-11],[3,-1],[1,-2],[4,-3],[-7,-7],[-8,-6],[6,-3],[1,-3]],[[7369,1347],[-5,-2],[-2,2],[1,5],[6,-5]],[[7744,1355],[-2,-1],[-3,2],[-1,4],[4,1],[5,-3],[-3,-3]],[[9516,1354],[-3,-2],[-6,7],[1,3],[8,-8]],[[7784,1369],[-4,0],[-1,2],[2,3],[4,1],[-1,-6]],[[3149,1370],[-6,-6],[-1,2],[2,2],[0,7],[4,3],[2,-1],[-1,-7]],[[7682,1380],[4,-2],[5,0],[2,-2],[1,-4],[-3,-2],[-15,-1],[-2,2],[2,6],[6,3]],[[7571,1393],[-4,-1],[-3,1],[-3,4],[2,2],[5,0],[4,-2],[1,-2],[-2,-2]],[[3170,1391],[-6,-2],[-3,0],[1,6],[2,2],[0,4],[2,2],[1,4],[3,2],[6,-1],[-1,-6],[-3,-1],[-2,-4],[0,-6]],[[7804,1400],[-12,-1],[-6,2],[-2,4],[4,8],[5,4],[8,1],[5,-2],[4,-4],[1,-5],[-7,-7]],[[7871,1414],[-2,-2],[-5,2],[-1,7],[-2,2],[-7,3],[-1,4],[1,2],[3,0],[7,-4],[1,-2],[0,-6],[6,-6]],[[3240,1447],[-6,-2],[2,6],[3,0],[4,4],[1,-1],[-4,-7]],[[3409,1464],[-5,2],[-1,5],[4,1],[8,5],[2,-2],[-1,-5],[-7,-6]],[[3244,1470],[-3,-6],[5,0],[5,3],[3,-3],[-6,-2],[-6,-6],[-3,-1],[-5,0],[-5,-6],[-2,2],[-6,2],[-2,2],[-5,2],[3,6],[8,5],[-1,3],[6,2],[0,4],[4,4],[6,1],[3,-4],[-1,-3],[2,-5]],[[3268,1473],[-2,-3],[-3,1],[-2,-4],[-6,2],[4,5],[5,11],[-4,5],[1,3],[3,3],[6,-1],[-1,-3],[6,-3],[-1,-6],[-2,-3],[0,-4],[-4,-3]],[[3392,1494],[2,-1],[5,6],[4,0],[-2,-3],[8,-5],[-1,-4],[2,-3],[-3,-1],[-3,-3],[4,-4],[-3,-1],[-5,2],[-3,-1],[-1,4],[-3,0],[-1,-6],[-3,0],[1,4],[-1,1],[-7,-3],[-2,3],[7,4],[-3,2],[0,6],[-3,0],[-3,-2],[-2,1],[0,3],[3,4],[1,5],[10,6],[3,0],[1,-3],[-2,-11]],[[3405,1508],[1,-1],[5,1],[2,-2],[-3,-2],[-11,1],[-2,3],[7,1],[1,-1]],[[3314,1505],[-5,-2],[1,3],[0,7],[3,3],[4,-1],[-3,-4],[-1,-3],[1,-3]],[[3447,1524],[-2,-3],[-6,4],[-2,3],[1,1],[10,2],[2,-1],[1,-4],[-4,-2]],[[0,325],[44,1],[19,-4],[20,0],[20,-1],[11,-5],[34,2],[82,-4],[84,-8],[17,-3],[16,-6],[16,1],[96,-5],[15,0],[58,-5],[112,-12],[9,1],[-5,6],[-9,5],[-13,4],[8,2],[19,0],[-4,3],[-47,3],[-146,15],[-15,4],[-23,1],[-5,3],[34,2],[4,2],[-26,9],[5,5],[14,3],[-2,4],[-25,8],[-16,3],[-10,-2],[-21,0],[-25,-1],[-14,4],[-8,6],[-23,11],[-56,11],[-10,3],[-70,17],[-4,7],[32,-8],[26,4],[9,0],[66,-14],[23,-6],[5,-2],[6,1],[55,1],[17,-1],[19,-4],[8,-7],[6,-3],[19,5],[18,3],[15,-5],[10,-6],[44,1],[19,0],[13,-3],[49,10],[7,2],[12,6],[-16,3],[-3,3],[19,3],[27,3],[16,3],[9,7],[37,11],[11,4],[11,8],[-24,16],[-23,14],[14,7],[7,6],[-15,8],[-12,3],[-59,11],[6,6],[8,3],[17,2],[108,6],[109,8],[3,3],[-15,5],[-17,2],[-1,7],[-26,5],[-11,6],[-1,3],[4,8],[6,4],[10,2],[30,0],[12,2],[0,4],[-3,4],[9,2],[1,3],[-3,4],[-6,3],[-18,4],[-40,7],[-24,8],[-8,5],[-12,4],[1,3],[-6,5],[-12,-2],[-23,1],[-28,4],[-19,5],[-25,13],[-10,6],[7,4],[8,3],[34,7],[5,2],[7,6],[-12,2],[-9,0],[-9,2],[-34,0],[-19,-1],[-16,7],[-12,7],[-4,4],[-2,6],[7,17],[1,19],[5,4],[5,1],[10,-9],[9,-1],[14,2],[12,6],[8,1],[16,-2],[15,0],[25,-6],[9,-5],[4,-6],[10,-1],[30,1],[8,0],[21,-9],[18,-9],[6,-2],[11,-2],[6,5],[10,4],[22,5],[5,6],[-11,5],[-5,1],[-3,4],[0,5],[2,4],[5,1],[11,-6],[13,-6],[4,-1],[10,3],[8,1],[15,-12],[9,-1],[11,0],[2,2],[-3,7],[-3,3],[8,5],[-6,5],[-6,2],[1,3],[8,4],[-1,9],[-2,3],[-12,5],[-17,9],[-15,4],[-35,-4],[-13,2],[-17,6],[11,3],[10,2],[8,6],[8,4],[13,-2],[29,-11],[6,-1],[20,-5],[12,1],[-5,5],[-6,3],[-15,10],[2,5],[9,7],[25,1],[10,2],[14,6],[18,10],[16,1],[19,3],[6,-2],[17,-9],[10,-4],[7,0],[-9,12],[14,3],[11,5],[17,11],[15,3],[43,5],[14,-4],[13,-1],[2,1],[9,18],[6,4],[18,4],[15,0],[10,-5],[10,-3],[9,-1],[9,0],[13,3],[18,1],[8,1],[10,-3],[23,-1],[19,-3],[11,0],[15,3],[9,1],[30,6],[23,1],[18,-3],[28,2],[29,-1],[12,-3],[65,2],[52,5],[7,2],[11,6],[6,6],[13,2],[15,-1],[20,-4],[18,1],[34,-2],[3,2],[3,10],[6,17],[4,5],[8,-2],[23,-9],[1,-4],[-6,-4],[-1,-8],[3,-2],[5,0],[3,-3],[-12,-10],[-4,-1],[-2,-12],[-3,-3],[0,-5],[5,0],[5,2],[18,4],[25,3],[9,2],[5,0],[3,3],[-5,5],[-1,5],[3,4],[-1,7],[-2,6],[4,6],[5,-2],[8,1],[4,-2],[14,-4],[6,-4],[2,-10],[-2,-10],[-6,-7],[-12,-7],[-14,-10],[3,-5],[7,1],[31,0],[20,1],[12,-1],[16,-3],[13,-4],[15,-1],[9,2],[9,-2],[34,8],[13,5],[8,-3],[13,2],[7,-1],[13,3],[9,0],[10,-1],[29,-1],[2,-5],[9,-9],[8,-3],[9,1],[7,3],[10,-1],[16,4],[21,-1],[3,2],[3,5],[-5,3],[-14,4],[-12,7],[-5,2],[-9,-1],[-9,4],[6,3],[7,9],[-3,8],[-3,2],[-8,0],[-10,-3],[-4,2],[-6,1],[-3,8],[-7,14],[-3,5],[-20,5],[-9,3],[-3,5],[2,8],[11,2],[10,-1],[20,-3],[5,-3],[4,-1],[8,0],[26,2],[6,4],[18,2],[-17,7],[-14,5],[-12,3],[-21,2],[-10,0],[-7,1],[-24,-1],[-6,2],[-5,6],[-6,14],[-2,7],[7,6],[7,0],[10,-1],[4,-2],[2,-4],[-5,-7],[2,-2],[10,0],[5,-2],[5,0],[10,2],[14,1],[15,-4],[13,3],[44,-2],[6,0],[10,-7],[5,1],[14,-4],[8,-4],[8,-2],[14,1],[10,3],[8,1],[18,-2],[9,-3],[8,1],[7,4],[25,3],[16,-1],[30,-7],[7,-1],[13,5],[5,7],[-1,8],[4,2],[3,-1],[6,6],[14,-2],[3,4],[2,7],[10,1],[7,-1],[9,-5],[0,-4],[-10,-15],[4,-7],[6,1],[8,-1],[14,3],[11,-10],[12,0],[17,9],[5,1],[6,-4],[9,-9],[8,-5],[11,-3],[10,-1],[18,-8],[15,0],[6,-2],[17,-7],[16,4],[9,3],[4,6],[-2,9],[-1,9],[2,4],[5,1],[19,-10],[-3,11],[-5,8],[1,6],[4,2],[8,-3],[9,-2],[8,-4],[16,-12],[5,-12],[10,-2],[8,0],[19,4],[9,-1],[7,2],[3,-6],[-8,-9],[-2,-5],[2,-2],[8,3],[13,-1],[10,4],[9,2],[9,4],[12,-1],[7,-4],[7,2],[10,-1],[29,15],[16,0],[10,4],[15,1],[12,5],[20,0],[10,3],[19,3],[12,4],[23,9],[10,6],[10,13],[6,13],[7,17],[-4,11],[-6,10],[-8,11],[-2,14],[1,13],[-5,22],[-6,15],[-14,23],[0,12],[-2,10],[-4,7],[-2,5],[6,3],[9,2],[22,-4],[2,6],[5,4],[4,5],[-2,7],[-4,3],[-6,7],[3,5],[4,0],[3,6],[-2,5],[2,8],[4,8],[3,4],[-5,5],[-5,7],[1,6],[5,13],[4,6],[3,2],[-1,2],[-6,2],[-5,0],[-10,-3],[-3,2],[0,4],[2,19],[6,2],[4,7],[3,0],[2,-2],[1,-9],[1,-2],[0,-5],[2,-1],[2,3],[4,1],[4,-2],[-1,11],[-1,4],[2,6],[-2,8],[1,3],[5,6],[4,0],[9,-4],[4,5],[1,10],[-3,3],[0,3],[2,2],[2,7],[9,0],[4,1],[-2,3],[-1,4],[8,3],[10,-4],[3,3],[-1,4],[-3,1],[0,7],[5,-2],[3,5],[-2,3],[6,1],[3,4],[2,1],[5,-1],[2,5],[-3,0],[-4,3],[-1,8],[1,6],[4,5],[4,3],[8,-2],[6,0],[2,-3],[4,-1],[0,4],[-2,8],[9,6],[3,-1],[4,1],[-1,4],[2,6],[3,1],[2,-5],[2,-1],[3,1],[7,6],[7,1],[4,4],[1,4],[8,6],[8,12],[-1,3],[1,2],[17,8],[8,1],[13,5],[8,6],[5,3],[5,7],[5,1],[13,5],[10,7],[13,6],[6,-1],[3,-2],[1,-6],[3,-8],[4,-3],[-2,-4],[-3,1],[-4,-1],[-1,4],[1,2],[-1,3],[-9,-2],[-11,-8],[-11,-6],[-8,-9],[-5,-9],[-3,-7],[-5,0],[-1,-3],[3,-2],[4,-1],[-3,-5],[3,-4],[0,-4],[-3,-1],[-4,5],[-5,0],[-7,6],[-2,-1],[-2,-4],[1,-6],[-2,-3],[-2,2],[-1,6],[-5,1],[-8,-7],[-3,0],[-1,-3],[-8,-7],[-7,-10],[-4,-5],[-7,-2],[-3,0],[-5,2],[-3,0],[-1,-3],[5,-8],[-3,-3],[-5,0],[-3,2],[-2,-2],[-3,-6],[2,-7],[8,-4],[1,-2],[-7,-2],[-9,-14],[1,-4],[3,-7],[5,-5],[10,1],[2,2],[6,0],[2,5],[7,-1],[1,3],[2,1],[8,0],[2,-3],[-5,-7],[-3,2],[-3,0],[-2,-3],[3,-4],[-3,-9],[-3,3],[0,5],[-8,3],[-3,-4],[-4,-2],[-2,-10],[-3,2],[-1,6],[-6,5],[-13,-1],[-3,-1],[-2,-4],[3,-3],[1,-4],[-1,-7],[3,-4],[0,-5],[-3,0],[-2,2],[-8,13],[-5,5],[-2,6],[-9,1],[-5,-2],[3,-6],[-3,-2],[-6,-10],[-3,-4],[8,-6],[1,-6],[-2,-3],[-6,-1],[-10,5],[-4,0],[-1,3],[-3,-1],[-1,-5],[-4,-7],[1,-5],[2,-1],[-7,-5],[5,-2],[1,-3],[-8,-2],[-7,1],[-3,-1],[-2,-6],[3,-13],[-5,-9],[0,-3],[4,-8],[-3,-2],[-2,-5],[2,-1],[10,1],[7,4],[3,-1],[-1,-5],[-14,-7],[-2,-3],[10,-2],[3,-2],[-2,-2],[-5,-8],[2,-2],[7,-3],[13,-4],[10,-2],[-2,5],[0,6],[6,5],[4,2],[16,2],[8,-1],[-1,-2],[-10,-1],[-10,-6],[-2,-2],[0,-4],[9,-3],[3,-3],[-4,-8],[1,-5],[4,-6],[6,-7],[2,-4],[5,-2],[7,-6],[3,-7],[2,-14],[5,-11],[7,-6],[1,-4],[-2,-5],[-6,3],[-3,-3],[-2,-5],[11,-7],[14,0],[0,-4],[-6,-7],[-8,-3],[-1,-4],[2,-5],[7,2],[11,-1],[2,-7],[8,-14],[-1,-5],[-4,-1],[-7,-6],[-4,-2],[-7,-8],[-5,-2],[11,-1],[10,6],[3,-1],[3,-4],[1,-5],[-2,-4],[-17,-3],[-8,-2],[-9,-7],[10,-3],[7,1],[9,-3],[6,1],[4,2],[7,-1],[0,-11],[1,-6],[-2,-3],[-9,-3],[-6,0],[0,-7],[9,-6],[6,3],[6,-2],[0,-9],[4,-10],[3,0],[3,4],[4,0],[2,-5],[-2,-9],[-3,-5],[-12,3],[-9,-6],[-6,0],[-9,8],[-16,2],[2,-4],[4,-2],[1,-7],[3,-7],[6,2],[10,-4],[5,-5],[3,-5],[-4,-10],[-8,-4],[-5,3],[-4,0],[-4,-2],[-2,-4],[-3,-2],[15,0],[4,-1],[4,-4],[-6,-5],[-9,1],[-4,-2],[-4,-4],[15,-2],[5,1],[10,4],[2,-4],[-4,-3],[-5,-7],[-17,-2],[-17,5],[1,-4],[9,-12],[1,-4],[-2,-5],[-12,-5],[-6,3],[-4,10],[-5,2],[-8,1],[2,-10],[-2,-3],[-5,1],[-5,-1],[-11,-6],[17,-2],[4,-4],[-1,-2],[-9,-1],[-9,-2],[-11,-5],[8,-3],[8,1],[11,-2],[1,-3],[-3,-3],[-19,-7],[-20,-9],[-15,-5],[-29,-11],[-32,-6],[-50,-13],[-17,-10],[-5,-8],[-13,-4],[-9,-1],[-25,-1],[-26,4],[-21,1],[-11,-1],[-39,6],[-15,-1],[-12,1],[-26,-2],[-3,-5],[4,-7],[9,-9],[16,-17],[9,-3],[5,-4],[10,-4],[23,0],[30,-4],[18,-3],[-1,-6],[-11,-11],[-6,-5],[-16,-8],[-21,-4],[-16,2],[-29,6],[-36,6],[-54,6],[-26,5],[-14,-5],[-13,-1],[4,-2],[54,-15],[45,-12],[6,-3],[6,-1],[0,-8],[-3,-5],[-9,-5],[-23,-1],[-30,-4],[-14,0],[-15,4],[-31,11],[-18,9],[-14,9],[-9,8],[-9,3],[2,-5],[5,-6],[7,-6],[-8,0],[-7,-6],[5,-9],[9,-9],[8,-2],[11,-6],[26,-11],[12,-11],[2,-6],[7,-6],[10,-1],[2,5],[-1,7],[10,3],[19,-3],[82,-1],[8,-3],[3,-5],[2,-9],[-8,-11],[-6,-5],[-19,-5],[-13,-1],[-28,1],[-27,0],[21,-6],[21,-4],[28,1],[11,1],[10,2],[11,-12],[8,-5],[6,-13],[7,-11],[12,-5],[8,3],[16,1],[16,-4],[10,-1],[13,3],[10,5],[22,5],[10,4],[13,-2],[5,-5],[4,-7],[13,-6],[16,-2],[17,2],[7,-2],[5,-8],[5,-1],[67,-18],[23,-3],[35,-2],[27,0],[9,-5],[-21,-3],[-36,2],[-13,0],[-9,-2],[-17,-2],[4,-3],[19,-1],[17,0],[2,-4],[-16,-1],[-34,-1],[-6,-3],[8,-2],[2,-3],[-4,-8],[6,-6],[8,0],[14,-5],[14,0],[18,4],[8,0],[23,2],[21,0],[29,4],[9,0],[-8,-5],[-36,-11],[-17,-3],[2,-6],[14,-11],[6,-9],[6,-2],[14,1],[0,-6],[-11,-14],[5,-3],[12,-2],[32,-1],[9,-1],[54,33],[6,3],[36,15],[7,6],[14,0],[19,9],[18,7],[11,1],[7,2],[15,-1],[10,1],[19,5],[15,2],[15,3],[17,0],[47,4],[13,-1],[15,-5],[22,1],[8,2],[4,-5],[2,-7],[-4,-6],[-7,-4],[-2,-7],[9,-3],[32,4],[16,4],[5,3],[6,-1],[11,4],[14,14],[17,15],[14,9],[9,11],[8,7],[15,7],[13,0],[19,8],[27,9],[21,-5],[23,-6],[11,5],[8,1],[15,4],[5,5],[7,3],[6,6],[55,6],[4,2],[4,-1],[10,1],[12,3],[17,1],[9,-1],[9,9],[16,1],[30,7],[142,6],[6,3],[12,2],[5,7],[-19,2],[-6,3],[-10,-1],[-147,11],[-3,0],[-4,6],[1,10],[-4,9],[-9,2],[-10,0],[-11,-1],[-32,-5],[-12,0],[-34,7],[-22,7],[-14,3],[-21,9],[0,9],[2,9],[19,24],[11,12],[8,1],[7,5],[8,12],[6,6],[13,6],[27,10],[15,-1],[11,7],[33,16],[8,6],[9,3],[26,13],[24,7],[12,2],[14,4],[30,11],[50,11],[30,3],[20,3],[14,-2],[15,1],[18,5],[8,6],[28,-3],[17,4],[8,1],[8,2],[-6,2],[-7,8],[4,8],[3,3],[8,5],[4,6],[4,10],[14,18],[4,3],[8,1],[7,-1],[9,0],[21,-4],[4,1],[12,13],[12,10],[2,3],[-1,5],[-18,-3],[-13,-3],[-14,2],[-1,3],[3,2],[5,1],[1,3],[-4,3],[-8,1],[-4,3],[3,12],[4,2],[13,14],[6,3],[16,3],[19,-4],[5,1],[4,6],[-5,9],[-3,3],[0,3],[10,-1],[9,-2],[11,0],[13,9],[18,8],[9,3],[8,1],[4,8],[6,14],[5,8],[0,4],[-2,4],[-9,-1],[-10,3],[-12,6],[-4,7],[-2,6],[4,4],[4,2],[4,0],[7,-2],[9,-7],[5,-2],[5,-4],[4,0],[5,6],[4,9],[8,5],[5,4],[-2,4],[-6,2],[-1,3],[3,3],[5,0],[5,-6],[8,-4],[6,-1],[5,-3],[7,-11],[9,-18],[4,0],[8,2],[8,0],[6,5],[1,13],[2,6],[-1,6],[-3,6],[-4,4],[1,3],[3,3],[10,3],[10,-3],[13,1],[9,4],[8,2],[7,-2],[3,-6],[-4,-6],[-10,-11],[-1,-10],[5,-1],[41,1],[6,-1],[7,0],[8,-2],[13,1],[12,2],[6,0],[9,-2],[7,-4],[14,1],[4,2],[4,5],[4,2],[5,-5],[2,-11],[2,-5],[6,-5],[6,4],[4,5],[9,9],[11,7],[8,4],[20,7],[10,5],[19,6],[25,3],[45,11],[15,1],[24,3],[12,3],[13,2],[7,8],[18,-6],[6,-1],[8,5],[9,12],[13,-5],[8,-8],[9,-6],[27,-13],[14,-2],[4,2],[6,7],[7,10],[4,4],[13,9],[-2,3],[-7,3],[1,3],[12,0],[6,-10],[15,-6],[19,2],[15,0],[14,-2],[7,1],[6,7],[10,3],[6,-3],[3,-11],[13,-4],[26,-5],[3,2],[4,5],[2,8],[5,1],[7,4],[4,-1],[5,-4],[-2,-12],[-3,-10],[4,-9],[3,-5],[11,-1],[13,1],[26,4],[3,9],[5,11],[10,14],[7,-3],[7,-7],[4,-3],[1,-5],[-4,-5],[1,-3],[4,-2],[15,-4],[5,1],[7,4],[7,8],[4,10],[6,0],[6,-2],[4,-6],[0,-9],[6,-7],[5,-4],[12,-5],[12,-1],[9,-2],[15,1],[7,3],[5,0],[8,3],[8,6],[5,2],[19,5],[15,6],[15,10],[15,6],[30,4],[9,0],[21,8],[8,4],[5,1],[5,6],[5,16],[0,6],[-2,8],[-5,7],[-4,11],[2,12],[3,4],[10,6],[10,1],[20,-2],[0,-5],[-9,-11],[-3,-2],[1,-5],[7,0],[15,1],[4,-5],[11,-18],[2,-9],[4,-2],[6,1],[12,0],[9,1],[7,0],[4,-1],[4,-4],[7,-5],[7,4],[5,2],[7,-1],[9,-5],[10,-14],[11,-6],[1,4],[-2,5],[5,5],[5,8],[8,10],[6,10],[1,15],[3,12],[5,6],[12,7],[10,1],[8,8],[7,4],[13,5],[16,4],[11,14],[10,3],[11,1],[22,5],[10,3],[8,8],[5,2],[11,0],[9,4],[7,0],[7,3],[1,4],[-3,4],[-1,4],[4,6],[3,2],[9,-1],[8,-4],[5,-1],[2,-2],[-5,-4],[-3,-6],[10,-9],[6,1],[7,3],[7,-2],[3,-5],[0,-8],[2,-4],[5,4],[2,7],[-1,10],[1,6],[11,10],[5,7],[-8,2],[-6,-1],[-3,2],[-4,8],[10,6],[12,0],[7,-6],[14,-8],[8,0],[7,-1],[2,3],[-3,12],[0,7],[-6,3],[-1,9],[2,9],[7,5],[10,3],[21,14],[5,3],[14,3],[16,1],[20,5],[35,-3],[16,-5],[13,-12],[10,-10],[14,-3],[4,-3],[5,-8],[-5,-5],[-5,0],[-8,3],[-6,3],[-5,-1],[5,-6],[4,-3],[1,-5],[-3,-6],[-16,-13],[10,-4],[6,3],[5,6],[9,3],[13,0],[8,2],[5,-1],[6,-4],[19,-7],[15,-15],[11,2],[6,3],[17,1],[15,-7],[8,-2],[24,-2],[14,-4],[9,5],[6,2],[13,1],[7,-1],[18,-6],[31,-5],[22,-3],[19,0],[25,-5],[7,-2],[16,2],[7,2],[7,4],[4,-1],[3,-6],[-2,-10],[5,-13],[4,-6],[2,-5],[-2,-4],[-11,-12],[1,-7],[2,-4],[-3,-5],[3,-8],[0,-4],[-2,-4],[-5,-2],[-9,0],[-4,-2],[-1,-6],[2,-4],[5,-2],[2,-5],[-1,-6],[-2,-6],[-5,-3],[-14,1],[-6,4],[-5,-4],[-12,-11],[-9,-10],[11,-3],[8,-6],[17,1],[13,5],[4,-1],[2,-5],[-1,-9],[0,-7],[-9,-19],[-3,-3],[-4,-6],[-5,-4],[-4,-2],[-7,-6],[-5,-11],[-5,-9],[-7,-15],[-6,-26],[-3,-11],[-6,-17],[-4,-3],[-7,-8],[2,-4],[12,-2],[9,-4],[12,8],[6,5],[1,9],[-1,10],[4,6],[8,8],[25,6],[7,2],[6,7],[5,7],[9,4],[8,7],[1,5],[4,1],[9,5],[6,7],[2,6],[1,12],[2,9],[8,20],[4,6],[10,3],[4,3],[10,12],[-1,9],[3,8],[6,5],[8,9],[9,1],[8,5],[8,-3],[9,-5],[16,2],[8,-2],[6,2],[5,7],[2,9],[6,5],[7,0],[11,8],[12,8],[10,2],[7,6],[6,10],[6,8],[7,8],[2,13],[5,7],[8,6],[7,3],[30,10],[23,6],[23,8],[7,0],[9,5],[20,0],[5,10],[11,8],[8,3],[9,8],[7,0],[10,-1],[9,-2],[8,0],[11,6],[17,1],[6,3],[4,3],[25,8],[9,-1],[13,1],[8,0],[17,-2],[17,3],[7,3],[13,7],[15,2],[14,4],[15,-7],[4,0],[9,3],[8,-1],[10,-3],[7,-3],[3,0],[7,3],[7,5],[7,3],[12,-4],[8,-4],[24,2],[19,6],[8,-5],[9,-1],[15,8],[13,-5],[4,-7],[14,1],[23,11],[11,2],[8,4],[12,15],[0,5],[4,4],[20,-1],[6,2],[8,4],[13,-3],[14,-5],[8,0],[10,-2],[10,-6],[9,-2],[39,-14],[22,-3],[11,-5],[6,-6],[5,-1],[5,2],[6,-7],[15,-6],[15,-3],[10,5],[17,12],[6,6],[-1,12],[8,13],[16,7],[30,7],[15,2],[8,-2],[4,-3],[5,-2],[7,-8],[11,-17],[8,-6],[12,-2],[7,-4],[9,-12],[-6,-10],[-4,-4],[-20,-5],[-8,-4],[-8,-2],[-2,-9],[3,-4],[8,2],[10,1],[14,4],[6,4],[14,3],[9,3],[8,2],[6,3],[6,0],[5,-3],[5,0],[12,-1],[6,2],[5,0],[5,-1],[6,-3],[5,-1],[7,2],[23,9],[11,1],[5,-1],[-11,-5],[-19,-7],[-10,-7],[6,-3],[35,8],[16,5],[14,3],[4,2],[11,9],[5,2],[28,7],[13,4],[8,4],[7,0],[4,-3],[7,-3],[6,1],[8,3],[8,12],[13,4],[6,-2],[9,-4],[7,-2],[6,-15],[14,-13],[4,-4],[12,2],[13,-6],[6,1],[5,2],[4,-1],[8,3],[14,33],[6,7],[4,3],[5,1],[8,4],[10,1],[8,-2],[17,-1],[13,4],[16,0],[7,4],[8,1],[11,-4],[10,-7],[3,-12],[3,0],[10,7],[6,2],[10,11],[6,-3],[13,-5],[5,-1],[10,-8],[5,1],[4,4],[13,0],[11,-4],[5,-3],[6,-5],[3,-1],[3,2],[24,-2],[11,-4],[8,-4],[28,-3],[10,-4],[7,2],[12,-1],[10,-8],[10,-4],[6,1],[8,3],[7,4],[8,0],[4,-3],[1,-9],[6,0],[6,4],[6,-1],[2,-6],[-3,-8],[-7,-11],[-3,-10],[-6,-9],[1,-4],[6,-2],[6,6],[13,5],[7,5],[12,2],[11,-2],[9,-7],[15,-12],[2,-9],[0,-4],[-3,-5],[9,-6],[7,-1],[6,1],[24,-5],[12,2],[11,0],[12,1],[10,-1],[8,0],[9,1],[7,3],[4,-2],[2,-21],[4,-3],[8,7],[19,-2],[8,0],[7,-3],[8,-5],[7,2],[4,4],[6,2],[2,5],[1,8],[-1,8],[4,2],[8,-5],[10,-13],[12,-12],[5,-3],[10,-7],[13,-3],[13,-7],[16,1],[12,-8],[8,6],[5,2],[6,-2],[7,-5],[6,-1],[21,-9],[11,-3],[4,-6],[5,-6],[0,-6],[3,-8],[12,-6],[11,-14],[11,-29],[5,-5],[8,0],[8,-7],[3,4],[-7,19],[-1,11],[6,6],[12,2],[10,-11],[9,-7],[6,-2],[12,1],[11,7],[9,-3],[14,0],[18,-5],[7,1],[14,-2],[17,-6],[9,-2],[2,-3],[5,-4],[4,-10],[6,-5],[6,-1],[11,-4],[24,-14],[9,-4],[5,-3],[3,4],[0,7],[5,2],[9,-19],[3,-7],[-5,-6],[-13,1],[-5,-9],[-3,-17],[5,0],[4,2],[1,-6],[-3,-5],[-4,-2],[-17,6],[-10,1],[-10,5],[-8,0],[11,-10],[12,-4],[16,-6],[0,-4],[-3,-4],[-5,-10],[-14,-9],[-8,6],[-10,2],[-5,-4],[-10,1],[-19,-2],[-8,8],[-12,4],[1,-3],[10,-13],[11,-3],[11,-4],[2,-3],[-5,-3],[-6,0],[-9,-6],[-15,1],[-8,0],[-4,-3],[-4,-1],[3,-2],[4,-6],[-6,-5],[-5,-2],[-5,1],[-5,-2],[-3,6],[0,12],[-4,11],[-8,-1],[-2,-10],[4,-16],[2,-5],[-2,-4],[-3,-2],[13,-23],[4,-3],[0,-4],[-3,-2],[-8,2],[-9,-1],[-7,2],[-7,1],[-7,-3],[-5,1],[-5,8],[-5,2],[-3,-3],[-3,-10],[-12,-7],[-4,-5],[-2,-20],[-3,-4],[-5,0],[-4,-2],[-11,3],[-22,-7],[4,-3],[24,-1],[8,-3],[1,-9],[3,-4],[11,-6],[2,-3],[-4,-12],[-6,-6],[1,-3],[7,-1],[2,-14],[-4,-6],[3,-10],[-8,-7],[-1,-5],[6,-3],[12,-2],[10,-13],[4,-7],[1,-11],[4,-7],[7,-4],[0,-5],[11,-2],[2,-4],[-2,-5],[-9,-6],[-4,-4],[9,-1],[10,-5],[11,6],[6,5],[4,5],[3,-1],[4,-14],[15,-8],[9,-3],[15,-1],[2,-5],[-2,-5],[-15,0],[-11,7],[-41,-2],[-10,-2],[-11,-5],[-11,-2],[-17,-5],[-7,-3],[-18,12],[-6,8],[-3,1],[-4,-2],[0,-6],[8,-14],[4,-3],[0,-4],[-6,-1],[-5,2],[-10,2],[-9,-4],[-11,-9],[6,-9],[-1,-4],[-12,-7],[-7,-2],[3,-2],[7,-1],[1,-3],[-3,-2],[-11,-3],[1,-4],[6,-2],[8,0],[4,-3],[1,-4],[-11,-5],[-39,-11],[-6,-4],[0,-4],[14,-1],[41,1],[3,-1],[-4,-8],[3,-3],[6,-2],[0,-4],[-16,-3],[1,-3],[12,-4],[0,-17],[-7,-4],[0,-4],[12,-3],[19,-12],[4,0],[19,-9],[5,-4],[6,-2],[5,-6],[17,-9],[2,-4],[-35,-7],[-35,-5],[4,-5],[37,0],[11,-3],[7,5],[41,6],[6,-2],[28,-14],[13,-5],[14,-3],[9,-6],[-1,-5],[10,-5],[14,4],[14,-5],[-10,-10],[-16,0],[5,-5],[7,-2],[48,-2],[14,-5],[13,3],[12,-3],[2,-4],[17,-5],[15,-2],[12,0],[14,-5],[7,0],[5,-3],[33,-2],[9,-6],[16,-1],[46,-6],[51,-8],[-9982,-8]],[[3457,1545],[1,-2],[9,0],[2,-7],[-2,-2],[-12,1],[-4,3],[-8,-3],[-2,-2],[-8,-4],[-2,2],[-1,5],[3,5],[9,5],[13,1],[2,-2]],[[3442,1550],[-6,-5],[-2,0],[-6,4],[-1,3],[3,4],[12,-2],[0,-4]],[[3318,1556],[-5,-1],[-1,3],[3,3],[3,-5]],[[3260,1551],[-1,2],[3,6],[6,3],[-2,-6],[-6,-5]],[[3315,1580],[1,-1],[13,2],[3,-4],[5,0],[-11,-8],[-3,4],[-1,4],[-9,-1],[-3,-2],[-7,-1],[-3,5],[5,0],[4,3],[1,4],[2,-1],[3,-4]],[[3349,1587],[-3,-1],[-3,3],[-1,3],[5,0],[2,-1],[0,-4]],[[3365,1595],[-6,-3],[-4,4],[4,2],[5,-1],[1,-2]],[[3389,1617],[3,-1],[3,1],[2,-1],[1,-5],[-5,1],[-4,-4],[-5,1],[-1,-7],[-4,3],[-4,-1],[-1,-5],[-2,-1],[-5,2],[-5,3],[6,7],[1,2],[8,4],[4,-1],[8,2]],[[3497,1653],[-1,-1],[-2,2],[0,2],[2,2],[2,-3],[-1,-2]],[[3467,1657],[-4,-2],[-2,6],[-2,3],[2,2],[20,-3],[-2,-1],[-9,-2],[-3,-3]],[[3729,1697],[6,-1],[3,-2],[1,-3],[4,0],[1,-2],[0,-4],[-6,5],[-9,0],[-2,4],[-4,-2],[0,5],[3,-1],[3,1]],[[6923,2358],[-1,-1],[-2,6],[0,5],[3,0],[3,-1],[0,-3],[-2,-5],[-1,-1]],[[6921,2355],[2,-1],[7,8],[2,1],[0,-6],[1,-3],[-5,0],[-1,-3],[4,-5],[3,0],[5,2],[4,4],[2,1],[4,0],[3,5],[5,-2],[2,-7],[-2,-7],[-3,-2],[1,-3],[-2,-1],[-3,4],[-2,1],[-7,0],[0,-2],[-3,-3],[-2,-1],[3,-5],[4,-3],[2,0],[0,4],[3,1],[4,-5],[-3,-2],[0,-2],[-2,-3],[-6,1],[-3,3],[0,2],[-2,0],[-4,-3],[-3,2],[-4,4],[-2,1],[-3,0],[-2,-7],[-3,-3],[-3,0],[-2,1],[-1,2],[1,3],[0,3],[2,6],[0,3],[-2,3],[1,4],[-1,5],[2,1],[-3,6],[2,8],[0,5],[2,4],[1,5],[3,2],[1,-2],[-1,-4],[2,-1],[0,-5],[-1,-4],[-2,-5],[1,-4],[4,-1]],[[6439,2508],[-4,1],[-1,3],[2,3],[3,-7]],[[3285,6165],[-1,-3],[-3,1],[-1,3],[0,2],[2,4],[4,-4],[0,-2],[-1,-1]],[[3284,6196],[0,-2],[-3,3],[0,7],[3,-3],[0,-5]],[[9412,2032],[-1,0],[1,12],[2,2],[0,-6],[-2,-8]],[[9092,2684],[-1,-6],[-3,1],[-2,-1],[-1,4],[2,1],[1,2],[0,3],[3,2],[0,-3],[1,-3]],[[9094,2693],[-2,0],[-1,3],[0,4],[1,2],[1,-2],[1,-7]],[[9113,2723],[-2,0],[0,3],[-1,1],[2,3],[2,-1],[0,-2],[-2,-2],[1,-2]],[[9028,2834],[3,0],[3,1],[4,-5],[3,0],[1,-3],[5,-3],[2,-4],[8,-5],[6,-3],[7,2],[4,3],[3,-2],[1,3],[2,3],[2,1],[3,0],[4,2],[2,0],[4,-2],[4,9],[7,-2],[3,5],[2,0],[5,-4],[2,-5],[0,-30],[0,-33],[1,-2],[0,-11],[-1,0],[-1,3],[1,2],[-1,4],[-2,2],[-2,-2],[-1,-4],[-2,-5],[0,-10],[-3,-13],[0,-9],[2,-8],[0,-11],[-1,-2],[-4,-2],[-3,6],[-1,5],[1,3],[2,-2],[1,2],[0,3],[-3,3],[-3,1],[-1,-1],[0,-7],[-3,-2],[-1,8],[-2,-4],[0,-3],[-2,-4],[0,-8],[-2,-2],[-5,6],[0,-4],[2,-3],[-2,-6],[-1,-7],[-3,-7],[-4,1],[-5,5],[-10,0],[-4,-2],[0,6],[-1,4],[3,1],[3,0],[0,2],[-7,3],[-2,-1],[-2,3],[-6,14],[-3,4],[-6,22],[-1,5],[-1,13],[5,-6],[2,-9],[2,6],[0,2],[-5,7],[-1,2],[-2,0],[1,5],[-1,5],[-5,11],[-4,11],[-4,13],[0,4],[-2,9],[-1,6],[0,6],[1,11],[1,7],[2,-3],[7,-4]],[[9116,2850],[-1,-5],[-2,4],[3,1]],[[9020,2850],[-2,1],[2,3],[1,0],[-1,-4]],[[9119,2862],[4,-8],[-2,-3],[-2,0],[0,3],[-3,-1],[-3,0],[-3,3],[1,3],[4,0],[4,3]],[[9110,2893],[5,-10],[3,-3],[0,-4],[-1,-2],[2,-3],[-3,-5],[-3,-2],[-3,5],[-3,10],[-1,6],[-2,0],[-1,2],[2,2],[3,6],[2,-2]],[[8997,2873],[-1,-1],[-1,4],[0,4],[-1,5],[1,4],[0,8],[2,2],[0,4],[2,1],[2,-4],[1,-8],[0,-5],[1,-5],[-1,-4],[-2,-3],[-3,-2]],[[9035,2966],[-1,-1],[-4,-1],[2,4],[3,-2]],[[9040,2974],[-4,-4],[-2,2],[0,3],[1,1],[3,0],[2,-2]],[[8821,3125],[6,-2],[3,3],[3,-2],[2,-6],[-1,-3],[-2,0],[-5,2],[-4,-1],[-2,-3],[0,-5],[-4,-3],[-2,4],[-5,2],[-2,-3],[-3,0],[-3,-1],[-5,1],[-6,8],[1,5],[2,3],[13,5],[6,4],[7,-1],[2,-2],[-1,-5]],[[9264,3603],[-3,-16],[-1,0],[0,12],[1,6],[3,-2]],[[9261,3610],[-1,-1],[-1,6],[0,10],[3,1],[-2,-9],[1,-7]],[[8143,3683],[-1,-3],[-5,18],[-2,13],[2,2],[3,-17],[1,-4],[0,-3],[2,-6]],[[9251,3700],[-1,-1],[-1,2],[-1,11],[2,11],[0,9],[4,7],[1,4],[0,5],[-1,5],[-1,1],[1,3],[2,2],[1,-11],[2,-3],[-8,-41],[0,-4]],[[9197,3830],[3,-2],[-1,-4],[2,-4],[0,-3],[-1,-3],[-2,2],[-4,12],[1,4],[2,-2]],[[9180,3898],[-2,0],[2,5],[0,-5]],[[9163,3905],[-1,-2],[0,9],[1,1],[0,-8]],[[8206,3986],[-2,-5],[-2,1],[0,3],[3,8],[1,-3],[0,-4]],[[9139,4015],[-2,-1],[-1,1],[1,7],[2,-7]],[[9062,4133],[0,-5],[2,-5],[-2,-4],[-3,7],[-2,4],[0,2],[2,0],[3,1]],[[8872,4198],[-1,1],[1,2],[1,4],[2,-3],[1,-3],[-4,-1]],[[8874,4229],[-2,-5],[-1,0],[-1,-2],[-2,-2],[-2,0],[-2,-1],[0,7],[2,5],[2,4],[4,1],[4,3],[1,-1],[2,-6],[-4,-1],[-1,-2]],[[8807,4275],[-1,-3],[-2,3],[0,3],[-1,0],[0,3],[1,1],[2,-1],[0,-4],[1,-2]],[[8793,4283],[-2,0],[-1,3],[1,2],[2,1],[0,-6]],[[8460,4296],[-2,-1],[0,2],[-1,3],[0,2],[1,2],[2,-5],[0,-3]],[[8476,4344],[-1,-4],[-2,3],[1,6],[1,2],[1,-1],[0,-6]],[[8796,4388],[1,-2],[2,0],[1,5],[1,0],[0,-2],[1,-2],[-2,-4],[-2,-3],[-1,-7],[0,-3],[1,-2],[3,-2],[1,1],[1,-1],[-2,-6],[-3,1],[-4,0],[-8,3],[0,1],[2,5],[0,15],[3,4],[2,4],[2,3],[1,-1],[0,-7]],[[8783,4387],[-1,-1],[-2,1],[0,4],[1,1],[1,4],[2,-2],[0,-5],[-1,-2]],[[8623,4511],[2,-2],[1,-2],[0,-2],[1,-2],[-3,-1],[-5,3],[-6,-3],[-1,0],[-1,2],[1,7],[2,-1],[1,2],[0,7],[-1,3],[3,7],[2,1],[1,-4],[0,-6],[2,-4],[1,-5]],[[8627,4528],[4,0],[4,4],[2,-2],[1,0],[3,5],[3,1],[1,3],[1,-4],[4,-3],[2,-7],[-2,-9],[-2,0],[-2,-7],[-10,-13],[-8,11],[-4,7],[-3,10],[0,8],[-1,5],[0,2],[2,0],[2,-5],[3,-6]],[[8793,4528],[-1,1],[2,9],[2,1],[0,2],[1,3],[0,4],[1,1],[-1,-10],[-4,-11]],[[8682,4532],[-1,-1],[-2,9],[1,3],[-1,5],[1,0],[1,4],[1,-2],[0,-6],[1,-4],[-1,-8]],[[8976,4495],[-2,-13],[0,-7],[2,-4],[2,-2],[1,-6],[3,-8],[0,-5],[2,-7],[1,-14],[1,-12],[1,-8],[-1,-17],[1,-7],[2,-6],[1,-12],[2,-10],[2,-3],[4,-4],[4,4],[2,6],[4,1],[4,3],[3,-8],[2,-7],[7,-11],[4,-7],[3,-3],[3,-5],[0,-5],[-1,-4],[1,-6],[1,-8],[-1,-8],[2,-13],[1,-10],[2,-11],[0,-10],[-1,-4],[0,-6],[2,-7],[2,-5],[5,-15],[3,-2],[2,0],[-1,-9],[5,-18],[2,-14],[-2,-20],[-1,-12],[0,-5],[5,-14],[3,-2],[0,-7],[-1,-10],[3,-8],[3,-6],[2,-3],[3,-3],[4,-3],[5,-1],[3,-4],[1,-4],[4,-1],[1,1],[3,1],[2,-5],[2,-9],[5,-8],[3,-2],[1,-4],[5,-2],[3,-3],[5,-8],[4,-1],[2,-2],[5,-8],[2,-5],[1,-6],[-2,-1],[-2,1],[-1,-6],[3,-9],[3,-6],[4,-7],[4,-9],[1,-8],[1,-3],[2,-10],[3,-6],[0,-10],[4,-29],[3,-10],[2,1],[1,2],[3,-7],[2,-1],[-1,12],[1,8],[2,1],[2,-6],[3,-6],[5,-6],[3,-5],[1,0],[0,10],[2,1],[1,-3],[2,-9],[1,-19],[0,-16],[2,-16],[4,-8],[4,-11],[3,-2],[7,-11],[2,-1],[3,0],[4,-5],[2,-5],[4,-17],[2,-5],[7,-8],[2,-4],[3,-16],[3,-7],[4,-4],[3,-10],[0,-14],[3,-11],[3,-3],[1,-2],[-2,-20],[2,-39],[-1,-12],[2,-12],[5,-21],[2,-16],[4,-11],[-1,-17],[2,-8],[-1,-11],[-4,-11],[-3,-14],[0,-12],[-2,-22],[-2,-16],[-5,-23],[0,-9],[1,-11],[-1,-10],[-1,-7],[-1,-13],[-4,-21],[-7,-14],[0,-12],[-2,-11],[-6,-10],[-1,-4],[-2,-4],[-5,-4],[-4,-5],[-4,-11],[-4,-12],[-2,-2],[0,-3],[-1,-7],[-4,-4],[1,-7],[-1,-8],[0,-5],[-1,-3],[-2,0],[1,-3],[-3,-7],[-4,-8],[-1,-5],[-2,-7],[-1,-14],[-1,-8],[1,-6],[-1,-2],[-1,1],[-2,-4],[1,-5],[-4,-3],[-5,-21],[-3,-6],[-2,-9],[-2,-16],[-1,-15],[-1,-10],[-2,-10],[-1,-7],[0,-13],[1,-11],[-1,-5],[0,-5],[-1,-5],[-3,-1],[-3,-4],[-4,-7],[-2,-2],[-5,-2],[-10,1],[-19,-3],[-4,-1],[-7,-5],[-7,-7],[-6,-9],[-15,-26],[-12,-2],[-4,0],[-2,-1],[0,-4],[2,-3],[1,-3],[3,4],[1,-1],[1,-8],[0,-5],[-1,-3],[-2,-1],[-1,1],[-5,15],[-3,2],[-1,-2],[-3,-2],[-4,13],[-2,1],[-3,0],[-6,7],[2,7],[2,1],[0,5],[-1,4],[-3,1],[-2,-1],[-2,-3],[-1,-6],[-7,-6],[-3,3],[-3,6],[5,0],[3,5],[3,9],[-2,5],[-2,3],[-3,3],[-9,-10],[-4,-3],[3,-2],[2,0],[2,-3],[-3,-4],[-3,-1],[-3,-3],[-7,-6],[-8,-14],[-3,-4],[-4,-3],[-6,4],[-3,1],[-4,5],[-7,4],[-6,8],[-4,3],[-3,1],[-5,-1],[-7,6],[-6,1],[-3,-7],[-5,2],[-6,11],[-5,5],[-11,3],[-7,8],[-5,14],[-9,17],[-4,12],[0,5],[1,9],[3,14],[-4,16],[-5,16],[-2,5],[-6,11],[-6,8],[-2,4],[0,2],[3,-1],[1,3],[2,1],[1,-4],[2,-1],[0,7],[1,4],[-1,3],[-3,1],[-3,-2],[-2,-3],[-3,-3],[-1,-3],[-4,0],[-6,-6],[-3,0],[-6,2],[2,7],[4,10],[3,17],[0,15],[-2,6],[-5,13],[-2,7],[-3,8],[-2,-9],[-2,-7],[-2,-16],[-5,-24],[-3,0],[-3,1],[-5,-3],[-4,-3],[-3,0],[-2,-1],[-2,1],[4,18],[10,0],[2,9],[1,10],[-1,6],[0,6],[1,7],[0,6],[4,17],[4,9],[4,7],[0,7],[-2,8],[0,7],[2,2],[2,4],[-2,19],[-4,11],[0,-14],[-3,-9],[-4,-7],[-3,-6],[-2,-13],[-3,-12],[-3,-4],[-3,-1],[-3,-2],[-8,-8],[-3,-5],[-3,-3],[-8,-23],[-4,-7],[-1,-4],[-2,-2],[2,-6],[1,-10],[0,-3],[-2,2],[-3,5],[-3,-2],[-1,-2],[-5,10],[-4,7],[-3,4],[-3,-1],[0,3],[3,3],[5,-7],[1,1],[-4,23],[0,3],[-2,10],[-1,3],[-8,16],[-2,11],[-1,7],[-2,4],[-3,4],[-9,1],[-3,11],[-2,13],[3,1],[1,4],[-1,7],[-8,7],[-4,9],[-3,3],[-4,2],[-4,-1],[-5,1],[-13,13],[-3,0],[-9,-4],[-3,1],[-13,18],[-10,8],[-3,2],[-3,1],[-4,-2],[-2,-2],[-5,-2],[-18,1],[-15,-2],[-11,-2],[-7,-3],[-11,-10],[-13,-11],[-11,-5],[-10,-6],[-6,-2],[-9,-1],[-18,3],[-6,-2],[-9,-12],[-3,-3],[-6,-3],[-14,-16],[-6,-3],[-5,-1],[-3,-3],[-3,-7],[-5,-18],[-3,-9],[-6,-14],[-4,-4],[-4,0],[-4,-4],[-4,5],[-3,1],[-5,-1],[-17,-6],[-3,7],[-3,1],[-6,0],[-9,2],[-16,-3],[-8,-2],[-3,-3],[-6,2],[-10,-3],[-4,-3],[-2,-4],[-5,-15],[-6,-5],[-10,-2],[-10,-15],[-11,-14],[-3,-1],[-4,-3],[-6,-1],[-2,-1],[-12,3],[-8,1],[-10,2],[-8,7],[-6,4],[-8,16],[-4,5],[-8,7],[-2,0],[-2,-2],[-4,5],[0,7],[-1,5],[0,14],[1,17],[3,-4],[2,-4],[5,1],[4,6],[3,9],[2,10],[0,11],[-2,20],[1,4],[2,1],[0,10],[1,30],[-1,11],[-7,22],[-5,20],[-3,9],[-3,14],[-3,30],[0,35],[-3,17],[-6,15],[-1,6],[0,6],[-2,7],[-5,15],[-5,12],[-1,6],[-1,25],[-2,11],[-9,29],[-10,25],[-3,10],[1,2],[2,-2],[0,9],[1,-1],[1,-6],[4,-13],[1,-7],[4,-3],[3,6],[0,10],[-2,4],[-2,2],[-3,7],[-2,12],[-3,10],[0,4],[1,3],[3,-2],[4,-12],[0,-15],[2,-3],[1,2],[1,6],[1,-1],[2,-13],[1,-4],[3,-4],[2,3],[1,3],[0,9],[1,10],[-1,6],[-6,18],[-5,22],[-4,11],[-4,22],[-3,9],[0,17],[2,15],[2,8],[6,18],[0,14],[1,9],[0,6],[-3,16],[3,18],[4,23],[2,3],[3,3],[0,-5],[-1,-15],[2,-8],[-1,-10],[5,4],[2,4],[1,5],[5,18],[3,7],[4,5],[9,6],[8,8],[4,8],[5,7],[3,7],[3,5],[17,18],[3,4],[3,0],[5,-1],[4,1],[4,-4],[3,0],[8,4],[4,4],[7,9],[3,3],[7,3],[8,3],[10,16],[7,-1],[6,-2],[6,5],[11,3],[7,3],[12,11],[4,3],[5,7],[4,9],[4,13],[3,11],[1,5],[5,17],[1,3],[5,5],[7,13],[2,3],[1,4],[-2,3],[-2,1],[-1,15],[-1,9],[0,14],[3,10],[2,5],[3,5],[2,1],[2,5],[4,4],[3,14],[2,7],[2,0],[2,-16],[2,-9],[4,-10],[3,-15],[3,-6],[1,-5],[1,4],[1,11],[0,13],[2,-1],[2,-5],[2,-1],[0,7],[2,5],[-1,3],[-2,0],[-1,4],[-2,4],[-2,3],[-2,8],[-1,2],[1,2],[1,0],[2,3],[0,4],[-1,7],[1,2],[3,0],[3,-11],[2,1],[1,4],[2,1],[3,0],[1,-3],[3,-4],[5,1],[2,-1],[7,0],[-3,3],[-3,1],[-3,-1],[-2,3],[0,5],[1,4],[0,2],[2,-1],[2,0],[0,6],[2,8],[0,4],[-1,-1],[-3,-9],[-1,7],[-2,6],[0,7],[1,8],[2,1],[2,-1],[2,4],[1,4],[0,5],[2,-1],[6,-7],[1,-4],[2,2],[0,8],[-1,-1],[-4,0],[0,4],[-2,5],[2,3],[2,0],[2,2],[1,2],[3,0],[3,-4],[2,-1],[0,2],[1,4],[-4,5],[0,4],[-2,4],[0,5],[2,4],[2,5],[3,0],[2,3],[2,1],[0,12],[1,1],[2,-2],[0,-11],[1,2],[3,-1],[0,-7],[2,-2],[1,6],[2,1],[0,8],[1,5],[0,3],[1,2],[1,4],[-1,3],[-1,5],[2,1],[2,-2],[1,-7],[1,-3],[1,2],[1,4],[2,3],[4,-8],[4,4],[2,7],[0,10],[4,3],[3,-2],[2,-5],[6,-4],[4,-6],[2,-4],[4,-5],[3,-6],[3,-11],[8,-13],[1,-2],[-4,-20],[0,-14],[1,1],[2,5],[1,-1],[1,2],[-2,6],[0,4],[1,3],[2,3],[2,2],[2,4],[1,3],[5,0],[12,-6],[3,-6],[0,-7],[1,-3],[1,5],[-1,10],[1,2],[4,-2],[2,-2],[3,-6],[0,-4],[2,-2],[0,3],[-1,5],[0,5],[1,4],[3,0],[0,3],[-3,4],[-1,5],[2,4],[0,1],[-2,0],[-4,4],[-3,5],[3,11],[4,10],[3,3],[0,3],[1,7],[1,5],[0,4],[1,5],[3,4],[4,1],[2,2],[3,8],[-4,9],[1,5],[0,6],[5,4],[2,11],[1,2],[4,0],[1,1],[0,12],[1,2],[2,-2],[1,-3],[3,-4],[1,2],[-1,4],[0,5],[2,1],[2,0],[0,8],[1,1],[5,1],[2,5],[1,-7],[3,-4],[8,0],[4,3],[2,-2],[3,-1],[5,5],[4,-3],[1,-3],[1,7],[1,2],[3,2],[3,-1],[-2,5],[0,18],[1,4],[-6,9],[-5,2],[-4,-2],[-2,1],[-3,8],[-4,2],[0,2],[4,5],[2,-1],[2,-4],[2,-2],[1,0],[1,4],[1,2],[2,-1],[6,-8],[3,-8],[2,2],[3,4],[3,-1],[2,-2],[2,-10],[2,-5],[5,-1],[5,-5],[3,0],[7,-1],[7,-6],[2,-4],[4,-1],[1,-2],[4,0],[5,4],[3,-4],[1,-3],[4,-5],[6,-2],[3,6],[6,4],[4,6],[4,3],[0,-3],[1,-2],[-5,-10],[0,-3],[1,-2],[2,1],[1,3],[3,1],[2,-2],[0,-8],[2,-5],[3,-1],[2,0],[2,8],[-1,6],[-2,1],[1,3],[5,10],[2,0],[2,-11],[3,-5],[4,0],[1,-1],[2,-6],[-12,-25],[0,-3],[1,-4],[1,-6],[-4,-12],[-1,-1],[-1,3],[-2,3],[-2,-2],[-2,-1],[-7,-7],[0,-18],[2,-11],[-3,-20],[-2,-5],[-2,-3],[-5,-17],[-2,-4],[-2,-6],[1,-5],[0,-4],[2,-5],[9,-9],[4,-6],[6,-8],[2,-5],[0,-5],[9,-7],[1,1],[2,0],[0,-4],[-1,-2],[1,-3],[2,-3],[4,0],[2,1],[3,-4],[2,-2],[3,-5],[12,-10],[6,-14],[4,-8],[5,-6],[7,-4],[3,1],[6,-5],[5,-2],[3,-7],[1,-5],[0,-4],[3,-9],[5,-3],[7,-9],[6,-4],[1,-3],[2,-2],[5,0],[9,4],[4,5],[5,7],[2,13],[1,10],[7,22],[2,10],[2,14],[2,9],[-1,9],[2,17],[3,24],[2,8],[-1,12],[-2,22],[1,7],[1,11],[-2,8],[-1,5],[-1,8],[2,14],[2,7],[1,10],[-1,18],[4,6],[1,3],[3,0],[1,-1],[0,4],[-1,3],[0,4],[-1,2],[-2,0],[-1,3],[-2,2],[0,8],[4,16],[1,6],[3,-5],[0,9],[2,15],[3,21],[1,19],[4,3],[2,5],[2,6],[2,0],[2,-3],[-2,-7],[5,-8],[2,-6],[0,-6],[1,-5],[1,-7],[0,-23],[2,-3],[2,-2],[5,-2]],[[8951,4567],[-3,-4],[-1,2],[0,5],[2,3],[2,-6]],[[8952,4596],[-1,-3],[-2,1],[-1,2],[1,3],[2,0],[1,-3]],[[8948,4598],[-1,-1],[-1,3],[1,4],[1,-2],[0,-4]],[[5475,7948],[-2,-6],[-1,-1],[0,-7],[1,-3],[-3,-1],[-3,1],[-3,-1],[-4,4],[-5,-5],[0,-1],[6,-3],[1,-4],[-1,-5],[-6,-4],[1,-7],[-1,-2],[1,-4],[1,0],[0,-5],[-2,-4],[-2,1],[-3,-2],[-4,-6]],[[5446,7883],[-3,-4],[0,-6],[-1,-1],[-5,2],[-4,-1],[-5,-4],[-6,1],[-6,-1],[-3,-1],[-2,-2],[-2,-4],[-5,-4],[-1,-2],[-3,1],[-9,2],[-5,3],[-5,0],[-1,1]],[[5380,7863],[-6,2],[-4,0],[-5,1],[-13,4],[-3,0],[-3,2],[-3,1],[-2,4],[-1,4],[-3,6],[-1,3],[2,4],[-1,1],[-6,-2],[-5,-3],[-7,0],[-2,-1],[-6,0],[-3,-2],[-3,-8],[-2,-2],[-3,0],[-4,5],[-6,0],[-1,1]],[[5289,7883],[-1,5],[-2,2],[-4,-8],[-2,0],[-7,5],[0,2],[-3,4],[-5,1]],[[5265,7894],[1,1],[0,3],[-2,3],[0,5]],[[5264,7906],[2,7],[0,4],[-2,4]],[[5264,7921],[3,0],[2,1],[1,2],[2,-2],[4,-2],[2,-2],[1,-3],[0,-3],[3,-1],[0,-5],[3,2],[3,6],[1,8],[6,0],[6,-2],[3,-7],[2,0],[4,2],[3,0],[2,3],[5,4],[4,2],[13,2],[1,2],[0,4],[6,-3],[3,-2],[4,2],[3,-2],[0,-4],[5,-5],[2,2],[0,4],[1,4],[-1,3],[-3,0],[1,6],[0,5],[-6,10],[0,2],[4,6],[5,4],[4,1],[3,2],[2,4],[2,10],[1,1],[5,-4],[3,4],[0,9],[1,1]],[[5383,7992],[5,-4],[1,-5],[4,-2],[5,0],[2,3],[3,-1],[4,0],[0,4],[4,6],[2,-1],[1,4],[1,10],[5,-2],[1,-1],[2,1],[4,-1],[5,-4],[3,-1],[4,0],[6,-7],[9,0],[3,3],[3,-1],[3,-3],[5,-1],[1,-5],[1,-1]],[[5470,7983],[0,-3],[-3,-7],[0,-3],[3,-11],[3,-6],[2,-5]],[[6280,7423],[-6,1],[-9,4],[-3,2],[-2,5],[-4,6],[-2,1],[-1,2],[-2,7],[-2,3],[-5,12],[0,1]],[[6244,7467],[-2,3]],[[6356,7397],[-6,-2],[-1,1],[-5,10],[-3,1],[-2,2],[-1,5],[-5,5],[-1,4],[2,3],[5,2],[1,1],[0,6],[-5,6],[0,5],[1,2],[3,2],[2,3],[-9,16],[-3,0],[-3,-2],[-5,-6],[-7,-7],[-8,-10],[-2,-4],[-4,-2],[-2,-3],[-6,-11],[-2,0]],[[6249,7562],[8,9],[4,-2],[8,-5],[-1,-3],[3,-3],[7,-4],[3,2],[3,-2],[5,-5],[2,1],[3,4],[1,5],[-1,6],[-3,3],[-4,3],[-2,3],[-1,6],[-2,0],[0,7],[3,1],[4,8]],[[6289,7596],[3,-1],[0,-3],[2,-1],[2,2],[4,-5],[3,-5],[3,-6],[2,-2],[2,-4],[2,-8],[1,-2],[8,-4],[5,-1],[2,1],[6,14],[6,5],[3,3],[1,4],[4,10]],[[6348,7593],[3,-3],[4,-9],[6,-15],[2,-4],[3,-16],[7,-13],[2,-5],[5,-6],[4,-2],[3,0],[4,-2],[4,-4],[3,-11],[-6,3],[-7,-1],[-3,-1],[-3,-2],[-4,-4],[-2,-6],[-1,-14],[-3,-13],[0,-6],[1,-6],[0,-3],[-3,-4],[-1,-12],[-1,-3],[-2,-1],[0,5],[-3,2],[-1,-3],[-1,-7],[-2,-7],[0,-23]],[[5816,4927],[-1,9],[-1,11],[-4,15],[0,9],[1,12],[-1,7],[0,4],[1,9],[0,4],[-2,6],[-3,6],[-1,3],[0,5]],[[5805,5027],[0,3],[1,3],[1,1],[3,-2],[3,-3],[1,-6],[1,-1],[9,0],[5,5],[0,3],[1,6],[0,13],[2,0],[3,-5],[1,0],[1,2],[2,2],[1,0],[4,2],[2,-4],[2,-1]],[[5848,5045],[-1,-1],[-2,-11],[-1,-2],[1,-3],[0,-4],[-1,-3],[0,-3],[3,-3],[7,-4],[0,-4],[1,-3],[0,-5],[-1,-4],[-3,-2],[-1,-3],[0,-4],[-3,-4],[-3,-5],[-1,-4],[0,-5],[-3,-6],[-3,-9],[-1,-5],[-5,-13],[-5,-6],[-2,-2],[-8,0]],[[5165,8106],[4,-4],[3,-4],[-2,-3],[1,-3],[3,-1],[1,-2],[0,-3],[1,-5],[-5,-4],[-2,-7]],[[5169,8070],[-1,2],[-3,1],[-3,-5],[-2,-7],[-2,-5],[0,-4],[4,-9],[-1,-5],[-1,-1]],[[5160,8037],[-2,0],[-6,-2],[-4,6],[-2,2],[0,2],[-2,0],[-3,2],[-1,2],[-4,2],[-2,0],[0,3],[-2,7],[2,10],[-1,1],[-3,-3],[-2,-6],[-3,-2],[-5,-1],[-5,1],[-1,1],[0,3],[1,1],[0,3],[-1,2],[1,6],[-4,5],[-2,1],[-6,0],[-2,-1],[-1,8],[-4,2],[-5,0],[-2,5],[0,4],[-4,7],[-7,-4],[-5,6],[-2,4],[0,6],[-2,4],[0,2]],[[5069,8126],[12,10],[11,7]],[[5092,8143],[2,-8],[4,2],[3,0],[4,-4],[2,0],[4,2],[4,4],[1,4]],[[5116,8143],[4,-2],[1,4],[3,3],[2,-3],[2,0],[3,4],[2,-2],[1,-3],[2,0],[3,4],[2,-7],[3,-4],[3,-1],[5,1],[3,-5],[4,-1],[2,-3],[0,-2],[-3,-9],[-2,-4],[0,-3],[1,-2]],[[5157,8108],[4,2],[2,-3],[2,-1]],[[5044,5541],[0,2],[4,3],[-1,7],[-2,9],[-2,2],[0,4],[1,3],[-1,2],[0,6],[-1,7],[2,0],[0,42],[0,32],[0,28],[-1,17],[0,5],[-4,8],[-2,5],[0,5],[-1,6],[0,25],[-4,6],[-6,8],[-5,7],[-1,2],[1,18],[1,3],[2,13]],[[5024,5816],[1,0],[1,2],[0,3],[3,-1],[0,6],[2,1],[0,4],[4,2],[1,1],[1,5],[1,1],[0,2],[1,1],[3,0],[1,-3],[8,2],[3,-1],[7,12],[2,4],[2,8],[0,4]],[[5065,5869],[1,5],[-1,11],[0,2],[3,3],[5,2],[2,3],[2,2],[2,-1],[7,-15],[4,-7],[1,-4],[1,-2],[3,-2],[2,-4],[2,-5]],[[5099,5857],[-3,-11],[0,-6],[4,-13],[2,-3],[0,-3],[1,-6],[0,-11],[3,-10],[-2,-10],[-1,-1],[-2,1],[-1,-1],[-2,-8],[2,-6],[-1,-9],[-1,-6],[-2,-3],[-2,-1],[-3,-3],[0,-7],[-2,-6],[-3,-6],[0,-8],[-2,-13],[-8,-3],[-1,-15],[0,-19],[-1,-5],[0,-31],[1,-6],[0,-10],[1,-4],[0,-3],[-1,-2],[0,-14],[1,-5],[-1,-2],[0,-15],[1,-3],[-1,-3],[0,-4],[-1,-9],[0,-4]],[[5074,5550],[-11,-2],[-14,-4],[-5,-3]],[[5024,5816],[-7,0],[-3,-2],[-1,0],[0,2],[-1,0],[-9,5],[-6,3]],[[4997,5824],[-6,2],[-2,-4],[-2,0],[-2,-5],[-4,-4],[-1,3],[-2,1],[-4,-1],[-2,1],[-7,0],[-9,1],[-1,-1],[-9,0],[-9,-1],[-14,0],[0,1],[-3,0],[0,-1],[-2,-15],[0,-8],[2,-8],[2,-3],[-1,-2],[0,-2],[1,-3],[0,-11],[1,-10],[0,-6],[-1,-3],[0,-5],[2,-8],[0,-3]],[[4924,5729],[0,-1],[-2,-2],[-1,0],[-2,5],[-1,1],[-2,9],[-2,2],[-1,2],[-2,6],[-2,2],[-1,-1],[-3,2],[-5,1],[-6,0],[-3,-2],[-2,-2],[-6,-4],[-3,-3],[-1,-5],[-2,0],[-4,4],[-2,0],[-3,2],[-3,5],[-2,2],[-2,3],[-1,7],[-1,5],[-2,6],[-2,3],[-2,2],[-3,-1],[-3,3],[-1,4]],[[4846,5784],[0,3],[1,5],[0,27],[1,3],[2,2],[2,5],[1,10],[1,8],[-1,3],[0,3],[-1,3],[0,9],[4,6],[1,2],[4,1],[5,2],[2,3],[4,4],[1,5],[2,3],[1,3],[0,14],[-1,3],[0,2],[7,7],[0,5],[-1,6],[-2,4],[0,4],[2,4],[1,4],[2,3],[2,4],[3,1],[3,-1],[8,-11],[3,0],[2,3],[2,2],[1,7],[0,10],[1,5],[1,1],[5,-2],[2,0],[1,2],[0,6],[1,10],[3,7],[5,9],[2,2],[2,0],[9,-6],[2,2],[2,15],[6,2],[3,2],[5,6],[8,8],[5,4],[3,6],[4,6],[2,1],[4,1],[2,-1],[2,-3],[4,3],[7,-5],[6,-4]],[[5005,6042],[0,-7],[-1,-8],[0,-9],[2,-5],[4,-9],[-1,-6],[0,-4],[2,-6],[3,-8],[2,-7],[4,-2],[2,-3],[3,-2],[1,-2],[1,-5],[3,-3],[2,-3],[0,-2],[-6,2],[0,-19],[1,0],[2,-2],[6,-9],[6,-10],[1,-2],[3,-1],[4,0],[4,5],[2,1],[2,0],[0,-1],[2,-4],[1,-6],[1,-4],[0,-2],[-1,-1],[-4,-2],[1,-4],[0,-2],[7,-19],[1,-2]],[[7553,6422],[-2,0],[-1,2],[1,2],[-1,8],[2,1],[1,-3],[0,-10]],[[7551,6441],[-1,-5],[-1,4],[1,4],[1,0],[0,-3]],[[7531,6461],[-3,-4],[1,23],[2,-8],[0,-11]],[[7542,6472],[-1,-1],[-2,1],[-1,6],[1,7],[1,-1],[2,-9],[0,-3]],[[7520,6456],[-4,-2],[-3,0],[5,15],[-1,7],[0,6],[-3,4],[0,3],[-1,5],[0,5],[2,1],[3,-4],[0,-4],[1,-5],[4,-9],[0,-5],[-1,-13],[-2,-4]],[[7517,6506],[-1,-1],[-2,2],[1,3],[2,-4]],[[7570,6449],[1,-21],[0,-8],[1,-7],[0,-3],[-2,-2],[-1,3],[-2,3],[-4,4],[-1,-1],[-3,-7],[1,-5],[0,-6],[2,-3],[0,-7],[1,-4],[0,-4]],[[7563,6381],[-2,5],[-1,6],[-4,11],[-1,20],[0,9],[-3,12],[-2,16],[-1,4],[0,4],[-2,6],[-1,6],[-5,11],[-1,5],[0,5],[-2,-5],[-3,-3],[-2,-6],[-2,-1],[-6,-1],[-3,7],[-5,18],[-1,3],[1,11],[-1,10],[0,8],[-2,-3],[1,-4],[-1,-3],[-8,2],[4,-5],[3,-1],[2,-5],[0,-7],[-3,-5],[0,-4],[2,-4],[-2,-2],[-1,-3],[0,-4],[2,-7],[-1,-3],[2,-2],[2,-11],[-1,-6],[-3,-4],[-3,-8],[-2,-8],[-2,-4],[-2,-1],[-2,4],[0,7],[2,7],[-6,-6],[-1,5],[0,11],[2,9],[-3,-4],[0,-17],[-1,-6],[-2,-4],[-4,-6],[-1,2],[-1,8],[-2,-10],[-3,-6],[-4,0],[-1,4],[-2,5],[-1,8],[-1,5]],[[7472,6456],[1,5],[-1,5],[-3,21],[0,3],[-1,9],[-1,6],[0,5],[2,9],[-6,4],[1,10],[-3,7],[-1,1],[-1,6],[1,9],[3,10],[0,10],[1,3],[-3,5],[-7,4],[-1,4],[-2,1],[-2,-1],[-4,5],[-1,5],[0,5],[3,11],[1,1],[3,-3],[1,0],[2,5],[2,13],[6,0],[4,-1],[2,1],[2,4],[-4,6],[-1,8],[-5,0],[-3,2],[-4,9],[-3,6],[-3,1],[-1,2],[0,6],[1,4],[0,4],[3,5],[2,5],[2,3],[2,5],[-3,5],[0,4],[2,1],[3,-3],[4,-10],[0,-3],[4,-3],[2,1],[2,-1],[0,5],[-1,2],[1,3],[3,-2],[1,-4],[0,-6],[2,-6],[5,-6],[3,-1],[2,1],[1,4],[0,7],[3,1],[1,-2],[3,-14],[-1,-5],[1,-16],[-1,-13],[1,-3],[1,0],[7,-4],[9,-4],[3,1],[5,-1],[9,1],[7,1],[5,-3],[8,2],[8,0],[4,-3],[5,-6],[3,-6],[-1,-3],[-2,0],[-4,2],[0,-7],[-4,-22],[-4,-2],[-2,-5],[0,-4],[-1,-1],[-2,2],[-3,-1],[-4,-6],[-4,0],[-1,-4],[-3,-6],[-1,-9],[-1,-6],[0,-4],[3,-12],[1,-16],[2,-2],[0,7],[2,1],[2,-10],[1,-2],[2,-1],[2,1],[2,6],[0,6],[-1,5],[1,4],[5,8],[-1,6],[0,5],[4,-1],[2,3],[1,0],[0,-3],[2,0],[1,-11],[2,-9],[0,-23],[1,-2],[2,-9],[1,-3],[0,-9],[1,-7],[1,-21],[0,-4]],[[5777,7601],[-4,1],[-2,-2],[-4,0],[-3,-2],[-2,1],[-5,8],[-1,1],[-2,-1],[-5,-1],[-3,-4],[-9,-3],[-1,-5],[-1,-2],[-4,-1],[-1,-2],[0,-3]],[[5730,7586],[-3,2],[-3,-1],[-1,-5],[1,-2],[1,-5],[0,-8],[-2,-2],[-4,-2],[-4,1],[-4,-1],[-7,-3],[-4,-1],[-3,4],[-4,3],[-4,2],[-2,-3],[-3,4],[-2,1],[-1,2],[-1,5],[-4,-2],[-9,0],[0,-3],[-1,-1],[-4,0],[-7,-4],[-5,1],[-2,-1],[-4,0],[-2,-4],[-3,1],[-4,0]],[[5635,7564],[1,1],[0,15],[2,6],[0,2],[-2,1],[-3,13],[-1,2],[-6,4],[-6,13]],[[5620,7621],[2,0],[0,2],[3,5],[0,3],[-2,3],[-1,5],[1,4],[0,3],[-1,2],[1,3],[2,2],[5,0],[2,6],[2,2],[3,7],[0,3],[-3,4],[-5,8],[-4,3],[-2,9],[-3,10],[0,5],[1,6],[1,2],[5,4],[0,7],[3,2]],[[5630,7731],[9,-9],[0,-2],[-4,-3],[-1,-2],[0,-5],[2,-2],[8,2],[9,-1],[11,-4],[8,-1],[6,2],[20,-6],[9,-1],[5,2],[4,3],[3,6],[8,8],[8,4],[10,4],[6,1],[10,-8],[4,0],[4,-3],[0,-1],[4,2],[5,-10],[9,-4],[6,0]],[[5793,7703],[-1,-14],[-2,-7],[-4,3],[-6,-2],[-2,-8],[-3,-4],[-1,-10],[0,-15],[-4,-3],[-8,-14],[5,-3],[2,-3],[3,-9],[4,-9],[1,-4]],[[6405,6674],[-1,-4],[-1,1],[-2,8],[0,5],[-1,8],[1,2],[3,1],[-1,-3],[2,-4],[0,-14]],[[2971,6404],[-1,-4],[-3,-8],[-7,-2],[-7,-1],[-1,4],[1,3],[0,3],[2,1],[2,4],[3,0],[3,-2],[2,0],[3,3],[2,6],[1,-1],[0,-6]],[[2974,6422],[-4,-3],[0,4],[2,2],[2,-3]],[[2970,6475],[6,-2],[2,-3],[-1,-3],[-2,4],[-3,1],[-5,0],[1,5],[2,-2]],[[2938,6463],[-2,-2],[0,3],[4,5],[2,5],[2,2],[2,5],[0,2],[-2,4],[0,3],[1,2],[3,1],[-1,-3],[1,-9],[-4,-10],[-3,-3],[-3,-5]],[[2942,6492],[-1,-3],[-4,3],[-1,-1],[-1,3],[0,5],[4,-5],[3,-2]],[[2920,6502],[-3,10],[-5,3],[-2,3],[2,2],[0,3],[-3,12],[-1,6],[-1,1],[0,5],[3,-7],[1,-7],[2,-6],[1,-10],[4,-4],[2,-5],[0,-6]],[[2897,6534],[-3,1],[-5,7],[-2,1],[1,4],[2,-2],[3,-6],[4,-5]],[[2932,6570],[-2,-7],[-2,1],[1,8],[2,1],[1,-3]],[[2842,6580],[0,-1],[-3,-4],[2,-3],[2,6],[2,-4],[1,-9],[-1,-2],[1,-1],[0,-4],[-2,-7],[-5,0],[0,7],[-1,1],[-1,9],[-2,3],[-2,7],[1,2],[3,0],[4,2],[1,-2]],[[2907,6577],[-1,-2],[-4,-1],[3,7],[-3,4],[-3,9],[-1,2],[0,4],[-3,3],[1,3],[2,-1],[3,-13],[0,-2],[6,-13]],[[2851,6624],[-3,-1],[-3,1],[1,3],[2,1],[3,0],[2,-2],[-2,-2]],[[2840,6606],[0,-14],[-3,-3],[-1,-2],[-3,-2],[-2,-3],[-1,5],[-1,2],[0,5],[-4,-1],[-3,4],[-2,5],[3,1],[1,-3],[2,3],[-2,6],[3,9],[1,7],[-1,9],[1,1],[4,-4],[1,-3],[0,-4],[2,-4],[2,-9],[3,-5]],[[2870,6651],[5,-6],[4,-3],[4,-8],[2,-3],[-1,-14],[-1,-8],[-1,-4],[-1,4],[-2,4],[3,0],[0,7],[2,5],[0,5],[-4,6],[-2,5],[-4,2],[-3,5],[-2,1],[-3,-1],[2,7],[2,-4]],[[2819,6723],[3,-2],[3,1],[5,0],[4,2],[1,-5],[-9,-1],[-8,-5],[-4,-3],[-4,1],[-5,10],[2,-1],[3,-6],[3,1],[2,4],[0,4],[1,4],[3,-4]],[[2854,6675],[-1,0],[-2,6],[-2,1],[3,4],[1,4],[0,8],[1,4],[0,3],[1,4],[-1,4],[-3,3],[-5,14],[-8,3],[0,2],[4,-2],[3,0],[3,-4],[2,-5],[3,-3],[0,-3],[3,-3],[2,-4],[1,-11],[-3,-5],[-1,-17],[-1,-3]],[[5527,7768],[6,2],[4,-3],[-2,-9],[-5,-13],[0,-8],[1,-2],[2,-1],[3,-3],[3,-4],[4,-7],[-1,-3],[-3,-1],[-5,1],[0,-3],[3,-5],[3,-8],[0,-7],[-1,-2],[-2,2],[-3,0],[-2,-3]],[[5532,7691],[-2,-1],[-4,1],[-1,-2],[3,-8],[-1,-4],[-1,-1],[-1,4],[-2,0],[-5,-7],[-2,-4],[0,-7],[-3,-1],[-2,-3],[1,-7],[0,-4],[2,-6],[0,-3],[-3,-3]],[[5511,7635],[-4,2],[-5,5],[-5,7],[-5,6],[-2,-1]],[[5490,7654],[-3,2]],[[5487,7656],[2,2],[0,4],[-7,9],[-3,7],[0,8],[-5,4],[-6,7],[-5,8],[0,2],[-3,6],[-3,5],[-3,3],[-5,9],[-2,15],[-2,4],[-5,8],[-4,5],[0,5],[2,20],[2,1],[4,-2],[4,-7],[4,-3],[2,3],[2,6],[2,3],[7,-1],[4,4],[6,-6],[2,-1],[3,1],[6,-3],[3,3],[5,-5],[1,0],[4,3],[4,-1],[4,1],[6,-3],[4,0],[3,-3],[1,-3],[0,-4],[1,-2],[3,-1],[2,1]],[[3252,6219],[3,-2],[0,-1],[1,-1],[-1,-2],[-1,0],[-1,2],[-1,4]],[[5881,8184],[-5,1],[-6,-1],[-4,-3],[-4,2],[-3,-2],[-3,-5],[-3,-4],[-2,-4],[-3,-8],[-1,-5],[2,-7],[0,-4],[1,-3],[-2,-2],[-1,-3],[-2,1],[-3,3],[-1,4],[-4,4],[-3,1],[-4,-2],[-6,-1],[-4,0],[-2,-2],[-4,-1],[-3,6],[-3,7],[-2,1],[-2,-3],[-4,-2],[-3,-6],[-2,1],[-2,5],[-8,2],[-3,2],[-3,-3],[-2,0],[-4,2],[-3,-6],[-2,-1],[0,6],[-7,2],[-2,-1],[-3,1],[-3,8],[-2,1],[-3,-1],[-5,1],[-9,3],[-2,1],[-17,5],[-6,0],[-8,1],[-6,-1],[-2,-1],[-8,-1],[-6,0],[-3,-1],[-3,-6],[-4,-6],[-4,-4],[-5,3],[-3,0],[-2,-2],[0,-5]],[[5655,8151],[-2,5],[0,6],[2,5],[0,4],[1,6],[0,4],[-5,7],[-4,2],[-4,3],[0,5],[6,10],[2,2],[10,7],[2,2],[0,12],[-1,7],[0,4],[-2,10],[-6,19],[-3,19]],[[5651,8290],[2,-1],[5,0],[4,1],[6,0],[3,1],[3,-4],[9,5],[4,0],[1,2],[1,6],[1,2],[5,-1],[3,5],[3,2],[3,0],[2,2],[2,-4],[-1,-2],[2,-2],[3,0],[3,2],[-1,5],[-5,3],[0,3],[3,9],[2,2],[-1,4],[0,5],[2,7],[2,5],[7,2],[2,2],[3,8],[9,0],[1,4],[3,2],[1,2],[-3,2],[-5,1],[-1,3],[2,4],[2,10],[0,3]],[[5738,8390],[5,1],[5,7],[2,1],[15,-2],[2,7],[7,9],[4,3],[3,1]],[[5781,8417],[4,-5],[3,2],[4,0],[4,-5],[1,-3],[2,-1],[4,4],[4,1],[8,-5],[1,-3],[-2,-6],[4,-5],[4,3],[1,2],[4,1],[4,3],[2,-1],[6,1],[6,-3],[0,-2],[4,-3],[3,-5],[5,-1],[0,-12],[-2,-4],[0,-3],[2,-3],[2,-5],[0,-5],[-4,-8],[-1,-7],[6,-5],[4,-4],[-2,-8],[3,-2],[2,-4],[1,-6],[3,-5],[6,-5],[5,-3],[1,-2],[0,-5],[-2,-7],[2,-1],[5,0],[5,-1],[7,-5],[0,-7],[7,-7],[1,-5],[-2,-2],[-5,-3],[-1,-4],[-5,-5],[-3,-2],[-8,1],[-2,2],[-1,3],[-2,1],[-8,-1],[-4,-10],[5,-9],[3,-4],[1,-3],[-2,-2],[3,-9],[-1,-1],[0,-13],[2,-2],[3,-8],[0,-2]],[[2559,6187],[0,4],[1,3],[1,-1],[-2,-6]],[[2556,6216],[0,4],[2,9],[1,-1],[-3,-12]],[[2530,6099],[-6,0],[-3,-1],[-1,1],[1,14],[0,38],[1,16],[0,28],[1,14]],[[2523,6209],[0,9],[3,2],[3,-3],[1,-2],[2,3],[2,6],[5,13],[1,9],[2,2],[2,0],[3,-1]],[[2547,6247],[-2,-6],[2,-1],[4,0],[1,-7],[0,-6],[-3,-16],[0,-5],[-2,-8],[2,-6],[-2,-7],[0,-11],[1,-14],[-2,-19],[-2,-8],[-2,-3],[-3,-8],[-4,-3],[-5,-13],[-1,-4],[1,-3]],[[3201,7043],[-1,1],[2,5],[1,-1],[-2,-5]],[[3133,3869],[-11,-4],[-6,0],[-3,6],[0,3],[1,6],[0,8],[-2,9],[0,7],[-1,9],[-3,4],[-1,7],[0,6],[-2,8],[0,18],[-3,10],[-4,11],[-3,1],[-1,4],[0,5],[3,7],[-1,2],[-5,7],[-2,4],[0,3],[2,2],[-1,6],[0,5],[-1,3],[1,1],[4,2],[1,4],[0,4],[-1,3],[-3,6],[0,1],[3,10],[3,6],[0,4],[-2,2],[-4,6],[-2,5],[-5,7],[-1,4],[0,9],[-1,9],[-1,6],[0,7],[-1,4],[0,4],[-1,5],[-1,3],[1,3],[1,1],[0,2],[-6,6],[-1,10],[-4,8],[-1,7]],[[3068,4175],[0,7],[-1,3],[-2,2],[0,6],[5,6],[7,18],[2,4],[2,2],[1,2],[-1,5],[1,4],[0,3],[3,2],[2,3],[0,2],[-2,3],[-4,2],[-2,0],[-2,2],[-1,2],[-4,24],[-1,5],[0,3],[4,15],[3,6],[-5,11],[-1,4],[0,5],[1,5],[2,3],[1,4],[0,5],[2,3],[1,4],[3,5],[0,7],[4,3],[0,6],[-3,7],[-1,12],[-2,5],[2,5],[1,6],[0,35],[1,4],[2,4],[2,1],[1,3],[0,4],[2,6],[-3,14],[-4,11],[-3,11],[-3,13],[-3,8],[-3,11],[-2,9],[-4,12]],[[3066,4552],[4,1],[6,-1],[6,-2],[5,-1],[2,-2],[0,-3],[1,-1],[3,0],[3,4],[6,4],[4,11],[2,5],[7,2],[1,-1],[2,0],[4,10],[4,7],[3,2],[1,2],[3,0],[13,20],[4,4],[3,1],[6,3],[9,3],[6,1],[2,-3],[2,1],[2,4],[1,1],[2,0],[2,-9],[0,-22],[-2,-8],[-2,-4],[0,-7],[1,-8],[2,-10],[1,-8],[-2,-5],[0,-10],[1,-1],[1,-3],[0,-5],[1,-4],[2,-4],[1,-4],[-1,-3],[0,-2],[2,-1],[1,1],[2,-5],[1,-5],[0,-3],[4,-4],[2,-1],[2,-5],[2,-4],[3,-2],[1,-5],[2,-6],[4,-3],[6,-1],[3,-1],[4,3],[3,0],[4,-4],[2,-4],[6,-6],[2,3],[2,1],[1,-1],[1,-5],[2,-6],[4,-6],[2,-2],[2,0],[4,-4],[5,-4],[3,-1],[2,1],[2,-2],[0,-4],[4,-10],[2,-4],[3,-3],[6,0],[2,-1],[2,1],[8,2],[2,0],[4,-4],[5,-6],[4,-4],[2,-3],[2,-4],[1,-5],[0,-9],[-2,-5],[2,-8],[1,-5],[1,-9],[1,-3],[1,-27],[-9,0],[2,-3],[4,-10],[4,-9],[0,-15],[1,-10],[0,-13],[1,-8],[9,-1],[11,0],[13,-1],[13,-1],[4,2],[1,-3],[-1,-4],[0,-5],[-3,-9],[0,-15],[1,-10],[1,-8],[1,-3],[4,-5],[6,-8],[3,-2],[2,2],[1,-4],[0,-6],[3,-15],[3,-11],[0,-3],[2,-2],[0,-1],[-2,-1],[0,-2],[-2,-11],[-2,-15],[-2,-10],[2,0],[0,-8],[-2,0],[0,-2],[-5,-20],[-5,-18],[8,-13],[-1,-3],[-4,-2],[-2,-5],[-1,-1]],[[3384,4022],[0,18],[-1,2],[-8,10],[-8,9],[-9,11],[-13,0],[-13,0],[-12,-5],[-12,-6],[-6,-2],[-11,-5],[-7,-2],[-5,-24],[-2,-8],[-3,-9],[-5,-12],[0,-29],[-3,-20],[-2,-17],[-5,-27],[0,-3]],[[3652,3584],[-2,-3],[1,14],[1,5],[2,5],[1,-3],[-1,-6],[-2,-9],[0,-3]],[[3650,3663],[-1,-1],[-2,7],[4,7],[1,-3],[-2,-10]],[[3742,3807],[-4,-2],[-1,2],[4,10],[2,-6],[-1,-4]],[[3773,3850],[0,-1],[-5,-3],[-1,3],[3,5],[1,0],[2,-4]],[[3918,4407],[0,-3],[-2,0],[0,3],[-1,2],[1,3],[2,-1],[0,-4]],[[3923,4429],[-1,2],[3,5],[1,3],[1,-4],[-4,-6]],[[3763,5014],[-3,-6],[1,7],[0,8],[2,3],[0,-12]],[[3752,5107],[-2,-4],[-1,1],[0,2],[1,4],[2,0],[0,-3]],[[3559,5101],[-3,-1],[4,14],[4,7],[0,13],[3,12],[4,5],[4,1],[3,-7],[-3,-21],[-1,0],[-4,-10],[-5,-8],[-6,-5]],[[3621,5170],[2,0],[4,1],[2,3],[6,0],[9,-3],[5,-1],[4,-2],[2,-2],[0,-3],[-2,-11],[-1,-7],[-1,-2],[-1,1],[1,-7],[0,-3],[-1,-2],[-4,-12],[0,-2],[-2,-2],[-2,-3],[1,-3],[0,-7],[-3,-5],[-3,-2],[-1,1],[-3,5],[0,-4],[-1,-4],[0,-3],[-4,0],[-1,3],[-3,2],[-1,-7],[-1,-4],[-2,-2],[-3,-1],[-1,-2],[-3,2],[-3,3],[-2,0],[-1,-2],[-6,-1],[-3,-2],[-2,0],[-3,9],[-1,7],[-2,8],[-1,8],[1,6],[2,0],[2,-1],[0,4],[-3,0],[-3,4],[0,6],[1,13],[0,2],[2,7],[-1,3],[2,12],[5,6],[6,3],[18,-7]],[[3592,5176],[-7,-12],[-3,4],[-1,2],[2,7],[4,3],[2,1],[3,-1],[0,-4]],[[3626,5177],[-8,-2],[-3,3],[3,6],[3,3],[3,1],[3,-1],[1,-4],[-2,-6]],[[3618,5199],[1,-3],[-4,-12],[-2,-2],[-3,0],[-3,3],[-5,0],[-1,1],[0,5],[2,6],[4,-1],[7,5],[4,-2]],[[3598,5191],[0,-8],[-5,3],[0,9],[3,3],[2,4],[0,13],[1,2],[2,0],[0,-19],[-3,-7]],[[3606,5206],[-3,-2],[-1,2],[0,7],[1,4],[4,1],[2,2],[0,-7],[-3,-7]],[[3602,5295],[-3,-3],[-1,1],[-2,7],[1,6],[2,2],[2,-1],[1,-10],[0,-2]],[[3430,5295],[1,0],[12,-6],[2,1],[1,2],[0,9],[-1,3],[-2,4],[-1,4],[-2,1],[0,3],[3,5],[1,7],[3,-1],[4,-5],[2,1],[8,1],[1,3],[1,0],[3,3],[3,0],[2,3],[1,0],[0,-3],[1,-3],[2,-3],[3,1],[1,-1],[1,-3],[0,-2],[1,-2],[1,0]],[[3482,5317],[1,0],[2,-4],[2,-3],[4,-3],[2,0],[3,-2],[1,2],[4,5],[3,5],[2,2],[1,-3],[1,-1],[5,-2],[5,5],[2,-6],[1,-2],[1,1],[5,-2],[1,0],[2,2],[1,3],[2,3],[2,2],[2,4],[2,6],[0,7],[3,12],[2,6],[1,5],[0,4],[2,7],[3,7],[1,5],[4,11],[0,4],[1,1],[2,6],[1,2],[2,7],[3,4]],[[3564,5417],[3,10],[0,5],[3,0],[3,-5],[3,-8],[4,-24],[1,-23],[2,-11],[4,-25],[1,-5],[0,-5],[2,-6],[1,-9],[0,-2],[-1,-3],[2,0],[1,-2],[1,-6],[1,-4],[3,-5],[4,-2],[3,-1],[4,-3],[2,-4],[3,-14],[-1,-9],[0,-6],[-1,-2],[-3,-4],[-7,-13],[-1,-4],[-4,-7],[-3,-12],[-5,-12],[-1,-3],[-3,0],[-2,-2],[-3,-10],[-5,-3],[-1,-5],[-3,-12],[-2,-7],[-2,-2],[-4,-13],[-1,-5],[0,-9],[-2,-6],[-3,-4],[0,-8],[-2,-2],[-1,-2],[-6,2],[-9,-9],[7,-3],[3,-4],[7,3],[9,11],[3,2],[6,8],[3,5],[5,6],[3,5],[2,-3],[0,-3],[-2,-4],[0,-3],[2,-3],[0,-5],[1,-4],[0,-7],[3,-8],[0,-7],[2,-3],[6,-12],[4,6],[2,1],[2,2],[3,2],[3,-2],[5,-4],[4,4],[7,8],[-2,-14],[-2,-13],[-1,-5],[-1,-14],[-2,-4],[1,-2],[3,7],[2,9],[5,25],[2,2],[4,3],[8,20],[3,0],[2,-5],[2,-3],[0,6],[3,2],[-3,3],[0,6],[1,5],[-1,5],[4,6],[0,5],[1,4],[2,4],[2,1],[1,4],[2,2],[2,-4],[2,4],[2,2],[2,-3],[2,0],[3,3],[3,-5],[1,2],[-1,2],[0,2],[2,1],[3,-1],[2,-2],[2,-4],[5,0],[2,-2],[2,0],[1,-3],[3,-4],[1,-4],[3,-1],[5,-3],[3,1],[0,-4],[2,-1],[3,1],[2,-5],[5,-4],[4,-5],[3,1],[2,-2],[3,-12],[1,-9],[1,2],[3,10],[3,3],[1,-3],[3,-4],[3,-5],[1,-3],[2,-1],[0,-3],[2,3],[1,-6],[2,-6],[0,-6],[-2,-6],[-1,-4],[-3,-2],[1,-3],[2,-3],[2,8],[1,2],[3,1],[1,-5],[0,-6],[-4,-2],[0,-5],[-1,-2],[0,-3],[-2,-11],[-2,-22],[0,-3],[3,4],[5,11],[1,12],[2,11],[3,4],[3,-1],[0,-6],[-3,-9],[1,-4],[5,10],[2,3],[2,0],[3,4],[8,1],[1,5],[1,2],[4,0],[8,-5],[3,-3],[5,-4],[2,-4],[10,-8],[6,0],[4,3],[4,-3],[2,-5],[5,-2],[4,-1],[4,3],[9,1],[11,4],[6,-1],[8,-3],[5,-7],[5,-4],[3,-4],[4,-4],[9,-11],[4,-6],[5,-9],[6,-4],[3,-9],[3,-4],[6,-16],[7,-10],[5,-11],[9,-7],[3,-12],[7,-1],[2,-2],[3,-5],[5,-2],[12,0],[5,2],[12,-4],[4,-7],[4,-18],[3,-21],[1,-15],[3,-12],[2,-23],[1,-7],[0,-5],[1,-1],[1,-16],[0,-6],[-1,-8],[0,-5],[-1,-4],[0,-3],[1,-7],[0,-6],[-1,-7],[-2,-18],[-6,-30],[-5,-17],[-7,-18],[-4,-10],[-2,-1],[-2,2],[1,-5],[-1,-4],[-4,-13],[-5,-9],[-5,-15],[-7,-6],[-3,-4],[-5,-9],[-4,-13],[-1,-2],[-2,1],[0,-7],[-3,-11],[-2,-2],[0,4],[1,2],[-1,3],[-2,-8],[1,-6],[-2,-9],[-6,-26],[-7,-21],[-2,-7],[-6,-15],[-5,-7],[-2,1],[-1,11],[-4,7],[-1,1],[-1,-7],[-1,-2],[-2,0],[2,-4],[0,-3],[-2,-7],[0,-7],[-3,-7],[-2,-6],[-2,-12],[2,1],[1,-1],[0,-5],[-1,-5],[0,-14],[-1,-3],[2,-3],[-2,-32],[1,-16],[2,-36],[2,-16],[0,-1],[-2,-19],[-3,-18],[-2,-15],[-1,-16],[-1,-8],[0,-8],[1,-19],[0,-3],[-3,-9],[-4,-4],[-2,-4],[-4,-15],[-3,-22],[0,-12],[1,-25],[-1,-10],[-1,-7],[-2,-4],[-4,-6],[-4,-13],[-2,-14],[-2,-5],[-1,-7],[-2,-8],[-6,-13],[-3,-3],[-2,-4],[-1,-7],[-4,-12],[-2,-15],[1,-6],[1,-18],[-1,-5],[-3,-5],[-13,-9],[-3,-4],[-8,-15],[0,-9],[1,-3],[-1,-4],[-2,-5],[-15,0],[-7,-2],[-3,0],[-4,4],[0,3],[1,5],[-1,2],[-4,-1],[0,-5],[1,-2],[0,-4],[-1,-3],[-4,0],[-4,-3],[-6,-1],[-4,-2],[-2,2],[2,2],[3,-1],[3,2],[-1,2],[-4,4],[-5,-2],[-3,-4],[-6,0],[-8,-3],[-1,-3],[0,-5],[3,-4],[-1,-3],[-2,-1],[-8,-2],[-7,-12],[-3,-1],[-3,-5],[0,-4],[-1,-3],[-2,0],[-3,2],[-5,1],[-4,-2],[-18,-18],[-7,-8],[-7,-14],[-13,-17],[-7,-10],[-1,-3],[-3,-2],[2,-2],[0,-5],[-3,-4],[-5,-11],[-1,1],[2,5],[-3,1],[-3,2],[-2,-3],[1,-5],[-1,-2],[-5,0],[-1,-3],[7,-3],[1,-3],[-4,-13],[-4,-1],[0,-2],[2,0],[1,-4],[-1,-14],[-3,-2],[-1,-3],[1,-4],[2,-4],[0,-6],[-1,-6],[0,-5],[2,-10],[0,-10],[1,-4],[0,-4],[-1,-4],[1,-6],[-2,-11],[1,-15],[0,-15],[-2,-13],[-3,-8],[0,-8],[-7,-7],[-7,-10],[-6,-11],[-7,-17],[-8,-25],[-7,-36],[-9,-27],[-4,-10],[-4,-11],[-7,-13],[-8,-13],[-10,-11],[-3,-5],[-3,-7],[-1,3],[1,4],[-1,4],[0,5],[2,1],[3,-3],[2,4],[4,1],[6,13],[5,4],[3,8],[0,13],[2,2],[3,-1],[1,3],[-1,2],[1,6],[5,5],[2,7],[-1,16],[1,1],[2,-3],[1,1],[1,7],[0,4],[-3,1],[-8,-8],[-2,0],[-1,6],[-4,3],[-1,5],[0,4],[-2,1],[0,-6],[1,-6],[3,-7],[-1,-2],[-3,-11],[0,-6],[-1,1],[-1,-9],[-2,-4],[-1,-4],[1,-4],[-7,-11],[-8,-8],[0,-6],[-1,-7],[-3,-5],[-2,-11],[0,-5],[2,-12],[-2,-3],[-4,-12],[-4,-25],[-4,-15],[-3,-8],[-17,-27]],[[3517,3240],[-1,0],[-4,5],[0,28],[2,6],[2,3],[2,5],[3,6],[2,5],[0,3],[-2,3],[-4,3],[-4,4],[-3,6],[-1,6],[-2,6],[-1,8],[-3,3],[-3,4],[-7,4],[-4,7],[-5,12],[-1,3],[-9,5],[-4,7],[-1,-2],[-5,5],[-1,5],[-4,10],[-3,5],[-2,1],[-1,-4],[-4,-6],[-4,-3],[-2,0],[0,5],[1,9],[-2,4],[-3,8],[-7,11],[-8,15],[-4,4],[-2,1],[-3,-1],[-3,-2],[-1,-7],[-1,-1],[-5,0],[-5,1],[-1,5]],[[3482,3710],[0,8],[4,13],[1,5],[0,4],[1,11],[2,20],[1,12],[-1,6],[0,5],[2,4],[-5,9],[-3,2],[-2,3],[-2,-1],[-1,-2],[-3,-2],[-3,-3],[-1,-2],[-6,-2],[-5,1],[-2,8],[0,10],[-2,3],[-1,3],[0,3],[1,4],[0,6],[-1,2],[0,10],[-2,7],[0,4],[-1,4],[0,4],[1,4],[0,4],[-2,5],[-2,11],[-2,5],[-2,0],[-2,2],[-6,0],[-4,6],[-1,5],[-2,1],[-2,-2],[-3,-7],[-2,0],[-2,-2],[-4,0],[-3,1],[-3,2],[-3,1],[-2,-1],[-2,1],[-5,1],[-2,3],[-3,1],[-2,-2],[-2,0],[-2,2],[-1,3],[2,8],[-1,4],[1,3],[0,17],[2,8],[-1,5],[2,8],[0,8],[-2,6],[0,8],[-1,4],[-1,1],[-1,4],[0,8],[-2,4],[0,3],[-2,6],[0,4]],[[3066,4552],[-2,0],[-5,2],[-3,0],[-7,-7],[-2,-1],[-3,0],[-2,2],[-2,5],[-2,-2],[-1,-2],[0,25],[0,43],[2,7],[-1,5],[0,5],[-1,3],[-1,-2],[-6,-9],[-2,-5],[-2,-3],[-2,-2],[-4,-7],[-2,-1],[-8,-1],[-16,0],[0,9],[-2,4],[0,5],[-2,8],[-1,3],[-3,1],[-4,2],[-5,2],[-11,0],[3,9],[3,8],[0,7],[-3,7],[-1,4],[-2,5],[-3,4],[-1,5],[0,3],[-2,3],[-2,4],[-2,3],[0,5],[-2,3],[0,7],[-3,5],[-1,3],[0,3],[2,3],[-1,3],[-2,3],[-2,4],[-3,4],[0,3],[1,2],[0,7],[3,2],[3,1],[0,4],[-1,5],[-1,2],[0,4],[1,6],[0,4],[2,4],[10,15],[3,0],[3,6],[0,7],[-2,11],[-1,3],[1,4],[1,6],[3,8],[2,9],[0,2],[1,6],[1,11],[0,8],[2,4],[4,1],[2,4],[4,6],[3,7],[3,2],[5,6],[3,4],[4,4],[8,2],[3,2],[3,0],[2,3],[3,0],[5,2],[1,3],[2,4],[2,3],[2,1],[2,-1],[3,0],[4,1],[2,-5],[2,-3],[3,0],[2,-2],[2,0],[1,2],[0,3]],[[3056,4939],[0,2],[1,12],[2,19],[1,18],[2,20],[4,40],[1,17],[1,14],[1,9],[2,22],[0,5],[-1,3],[0,6],[-1,2],[-2,2],[0,5],[-1,2],[0,2],[-1,3],[1,2],[0,7],[-2,5],[-2,1],[-2,4],[-3,4],[-3,7],[-1,3],[0,42],[4,0],[5,2],[2,3],[1,-1],[3,4],[3,-1],[1,-2],[2,-1],[1,-2],[3,1],[0,13],[-1,2],[-2,7],[-1,2],[-2,1],[-1,-2],[-3,1],[-1,1],[-2,0],[-2,-1],[-1,1],[-2,0],[-1,-1],[0,38],[3,1],[2,0],[2,2],[3,0],[5,-3],[11,0],[20,0],[-2,8],[1,3],[0,3],[1,2],[2,-2],[1,-6],[1,-4],[2,-2],[3,1],[1,1],[3,8],[3,7],[2,2],[1,2],[3,0],[1,-2],[4,-13],[3,-9],[1,-5],[0,-12],[-1,-11],[1,-2],[6,3]],[[3142,5254],[7,-14],[5,-9],[2,-4],[5,0],[5,3],[5,7],[3,3],[1,0],[3,-3],[1,-5],[-1,-6],[0,-3],[2,0],[2,6],[4,8],[3,5],[2,5],[5,7],[3,2],[2,-1],[2,3],[4,8],[1,1],[5,0],[3,4],[2,6],[2,8],[0,8],[1,2],[2,2],[3,0],[4,4],[3,4],[3,1],[1,1],[1,4],[1,7],[-1,4],[-5,1],[-4,0],[-8,3],[-1,1],[0,2],[1,3],[0,5],[-1,8],[-3,11],[-2,12],[0,22],[-1,4],[-8,14],[-3,6],[-1,5],[-3,8],[0,3],[2,-1],[2,-2],[1,-4],[1,-1],[9,0],[2,-1],[2,-3],[1,-6],[2,-2],[10,0],[4,-2],[4,2],[2,-1],[4,-9],[3,-4],[2,-6],[3,0],[3,5],[0,15],[1,5],[1,1],[2,0],[4,6],[2,1],[7,-4],[2,2],[7,4],[7,5],[2,7],[4,2],[2,4],[5,0],[2,1],[2,3],[1,6],[2,3],[3,2],[2,3],[2,7],[0,3],[-2,10],[-2,2]],[[3312,5483],[2,1],[2,-2],[4,0],[1,1],[2,0],[3,3],[1,-1],[2,0],[1,-3],[0,-2],[3,-4],[0,-5],[-1,-5],[0,-10],[-1,-4],[-2,-4],[0,-2],[-1,-2],[1,-1],[5,0],[1,-2],[2,0],[3,-3],[1,-2],[0,-2],[-1,-4],[0,-5],[1,-2],[2,-8],[2,-5],[-1,-3],[-2,-8],[-2,-5],[-3,-4],[0,-14],[-1,-4],[-3,-16],[0,-18],[3,-19],[3,-5],[1,-9],[-1,-9],[0,-3],[1,-2],[1,0],[1,-2],[0,-5],[3,-3],[5,-10],[1,-1],[0,-2],[3,-5],[7,-5],[3,-5],[1,-1],[3,3],[1,2],[5,0],[0,2],[1,2],[-1,5],[1,2],[2,1],[0,2],[2,4],[3,-2],[2,-2],[3,0],[1,1],[0,2],[1,4],[3,1],[2,2],[5,0],[2,2],[1,2],[2,8],[3,3],[4,1],[2,2],[2,-4],[5,-3],[2,0],[2,2],[2,0],[2,-1],[2,2]],[[3347,5937],[-1,-1],[-3,2],[-1,3],[0,9],[2,0],[4,-9],[-1,-4]],[[8194,5466],[3,0]],[[8197,5466],[1,-2],[1,-7],[2,-7],[0,-10],[1,-5],[-2,-1],[-4,2],[-1,11],[-1,7],[0,12]],[[8194,5466],[-2,-3],[-3,-3],[-3,-5],[0,-3],[1,-6],[0,-6],[2,-4],[-1,-2],[-1,-4],[1,-1],[-1,-6],[-2,-4],[-1,-3],[-2,-1],[-1,2],[-4,11],[-3,1],[-1,2],[0,7],[-1,3],[-2,3],[-2,2],[-1,2]],[[8167,5448],[3,0],[4,1],[6,6],[3,5],[6,8],[4,5],[1,-1],[0,-6]],[[7468,6757],[2,8],[2,3],[2,5],[1,6],[4,7],[5,14],[5,5],[3,2],[2,4],[4,3],[7,-2],[4,-3],[0,-3],[-1,-5],[4,-1],[4,1],[8,-3],[3,-4],[2,1],[2,3],[3,3],[3,-4],[7,-5],[0,-10]],[[7544,6782],[-1,-5],[0,-6],[4,-7],[3,0],[3,1],[1,-1],[2,-5],[1,-4],[-2,-4],[-1,-4],[0,-4],[2,-6],[0,-6],[-2,-1],[-4,0],[-3,-1],[-2,-2],[-4,0],[-2,4],[-1,0],[-4,-5],[-4,1],[-7,-1],[-4,-1],[-5,2],[-3,3],[-3,2],[-4,-2],[-2,-6],[-5,-1],[-5,-2],[-1,1],[-3,0],[0,3],[-2,2],[-4,1],[-2,2],[-5,-2],[-3,3],[-3,4],[-2,1],[-1,8],[-2,2],[0,5],[4,5],[0,1]],[[5815,3905],[-7,-1],[-3,-4],[-2,-7],[-3,-5],[-4,-3],[-4,-2],[-5,-1],[-4,-6],[-6,-10],[-2,-7],[-1,-5],[-3,-2],[-1,-2],[0,-3],[-3,-1],[-2,-2],[0,-4],[-2,-3],[-3,-1],[-2,-2],[-2,-4],[-3,-2],[-2,-3],[-3,-10],[-4,-28],[-6,-9],[-3,-7],[-1,-4],[-9,-5],[-6,-4],[-1,-2],[-1,-9],[-2,-12],[-2,-9],[-1,-8],[-2,-10],[-4,-6],[-7,-2],[-6,0],[-3,-4],[-4,0],[-5,2],[-6,3],[-4,6],[-6,0],[-13,16],[-3,4],[-4,1],[-7,-3],[-2,-3],[-2,-5],[-1,-8],[-3,-15],[-2,-12],[-1,-4],[-4,-5],[-7,-10],[-3,-11],[-3,-3],[-5,-2],[-1,-2],[-1,-6],[-1,-2],[-6,0],[-1,1],[-11,-1],[-5,2],[-4,-2],[-1,1],[-2,5],[0,17],[4,11],[1,5],[0,15],[-3,10],[-3,14],[-3,16],[-2,4],[-2,7],[-9,12],[-1,2]],[[5554,3756],[0,31],[0,33],[0,33],[0,33],[0,30],[14,0],[13,0],[1,2],[0,34],[0,24],[0,23],[0,24],[0,23],[0,24],[0,23],[0,35],[7,1],[8,2],[13,4],[13,5],[8,3],[13,4],[2,-2],[5,-12],[3,-13],[3,2],[6,11],[3,5],[3,4],[3,3],[4,3],[3,-3],[1,-2],[8,11],[3,3],[8,2],[2,-1]],[[5701,4158],[-1,-2],[0,-8],[1,-4],[2,-3],[3,-8],[1,-7],[2,-5],[6,-12],[0,-4],[1,-4],[3,-9],[1,-2],[0,-6],[3,-16],[3,-10],[2,-2],[6,-10],[6,-8],[7,-6],[4,-4],[3,-2],[1,-3],[1,-5],[1,-9],[0,-5],[5,0],[4,-1],[2,-1],[0,-35],[4,-8],[2,-6],[3,-11],[1,-1],[4,-1],[9,-4],[6,-3],[7,-4],[2,-2],[-1,-7],[0,-3],[2,-5],[4,0],[2,-5],[2,-2]],[[5670,5682],[1,0],[1,-3],[-1,-8],[0,-6],[3,-4],[2,-2],[2,-1],[8,-3],[3,-3],[5,-10],[5,-9],[1,-5],[0,-4],[-2,-5],[3,-8],[3,-5],[5,-6],[9,-10],[4,-6],[4,-10],[3,-5],[2,-4],[-1,-10],[0,-3],[1,-3],[2,-4],[2,-12],[3,-3],[3,-1],[2,-3],[8,-10],[2,-3],[2,-6],[0,-10],[1,-9],[2,-6],[2,-4]],[[5760,5478],[-8,5],[-3,-1],[-4,-6],[-1,-1],[-2,0],[-3,1],[-13,5],[-10,5],[-3,2],[-5,1],[-4,-3],[-3,-11],[-1,-2],[-5,-4],[-2,1],[-6,-3],[-9,5],[-4,-1],[-2,-2],[-7,-5],[-8,-6],[-5,-4],[-3,-2],[-2,0],[-6,4],[-3,1],[-4,-2],[-3,-4],[-4,-12],[-3,-13],[-2,-5],[-14,7],[-7,2],[-4,-2],[-5,4],[-2,0],[-1,-1],[-3,2],[-5,4],[-4,2],[-5,0],[-2,1],[-5,13],[-4,8],[-6,7],[-4,5],[-2,3],[-3,2],[-5,1],[-5,-4],[-7,-10],[-7,-21],[-4,-8],[-3,-2],[0,-5],[2,-18],[-1,-16],[0,-11]],[[5516,5384],[-2,1],[-1,6],[-1,1],[-4,-2],[-2,-3],[-2,-2],[-1,0],[-1,3],[-6,0],[-2,2],[-8,4],[-1,2],[-2,0],[-4,-4],[-8,-4],[-6,-1],[-3,0],[-2,-2],[-1,-2],[-1,-6],[-1,-9],[0,-6],[-1,-6],[0,-10],[-1,-7],[-3,-9],[-4,-16]],[[5448,5314],[-1,5],[-1,7],[0,12],[-1,5],[1,4],[-2,8],[-3,5],[0,2],[-2,0],[-2,1],[-3,6],[-2,6],[-4,7],[-2,7],[-4,8],[-3,7],[-2,7],[0,4],[2,0],[0,3],[-1,5],[-1,7],[-1,4],[-3,7],[-4,5],[-1,2],[0,4],[-2,23],[0,7],[-2,4],[-1,1],[1,5],[0,5],[1,3],[0,21],[-1,1],[0,2],[-2,0],[-2,7],[0,3],[3,6],[4,3],[2,4],[1,3],[2,11],[3,11],[2,2],[1,7],[3,13],[0,4],[1,4],[4,5],[3,10]],[[5429,5617],[6,-2],[4,-1],[3,2],[2,3],[5,3],[5,4],[1,5],[1,3],[2,2],[1,-1],[1,-6],[2,-5],[3,-6],[1,1],[2,4],[5,3],[1,1],[4,6],[5,5],[2,1],[4,4],[8,0],[9,2],[6,1],[3,1],[0,1],[2,6],[0,1],[3,3],[4,9],[3,8],[1,4],[2,3],[-1,3],[-5,7],[0,3],[4,6],[3,2],[7,-1],[7,1],[8,3],[4,3],[7,0],[6,9],[3,2],[0,2],[3,3],[3,7],[3,6],[1,5],[7,15],[2,0],[1,1],[3,10],[1,2],[3,2],[2,7],[0,12],[2,4],[5,6],[2,5],[3,0],[3,4],[3,3],[4,3],[3,-1],[3,-2],[3,-1],[1,-1]],[[5634,5812],[2,-7],[9,-19],[1,-4],[5,-13],[5,-20],[0,-12],[-1,-16],[-1,-4],[-3,-9],[0,-7],[2,-3],[0,-7],[1,-3],[3,-2],[6,-1],[4,-1],[3,-2]],[[3338,7714],[-3,-2],[-4,0],[-2,3],[5,-1],[2,1],[2,-1]],[[3145,7757],[-4,-3],[1,8],[2,2],[1,-1],[0,-6]],[[3306,7803],[-2,1],[-2,3],[2,1],[3,0],[-1,-5]],[[2952,7809],[-4,-1],[3,6],[5,1],[-4,-6]],[[2956,7802],[-2,-1],[-4,1],[-5,-1],[3,4],[4,3],[5,8],[1,0],[-2,-9],[0,-5]],[[3026,7883],[-2,0],[0,2],[6,5],[-1,-4],[-3,-3]],[[3302,7830],[1,-1],[3,3],[2,0],[0,-2],[-3,-2],[-1,-2],[2,-1],[0,-2],[-3,-2],[-1,-3],[1,-2],[4,2],[3,0],[3,2],[6,10],[-6,-1],[-1,1],[5,6],[-1,4],[2,5],[6,6],[2,-3],[0,-4],[4,1],[4,-1],[3,-3],[-1,-5],[-2,-2],[3,-3],[0,-2],[-5,-3],[-3,-4],[-2,-4],[-5,-5],[-8,-4],[-3,0],[-3,1],[-3,0],[-8,-2],[-5,8],[-1,13],[0,7],[2,7],[5,7],[7,20],[2,5],[1,4],[7,10],[4,2],[2,0],[0,-5],[2,-9],[-1,-9],[-3,-11],[-1,-7],[1,-2],[-1,-3],[-6,-7],[-3,-1],[-7,-7]],[[3227,7860],[2,0],[1,5],[4,-1],[2,-2],[3,0],[2,-3],[5,-2],[4,0],[8,2],[14,2],[3,-1],[1,-3],[-8,-8],[-6,-4],[0,-13],[-7,-1],[-2,2],[-1,4],[0,3],[-2,4],[-4,3],[-2,-1],[1,-2],[-2,-2],[-2,0],[-10,4],[-2,3],[-2,5],[1,2],[-7,0],[-3,1],[0,10],[-3,2],[-4,1],[-1,3],[4,8],[1,4],[2,3],[5,6],[-1,-5],[1,-4],[-3,-8],[5,-7],[1,-2],[0,-4],[-1,-2],[3,-2]],[[3279,7907],[4,-2],[-1,-2],[-4,0],[-1,1],[2,11],[3,2],[5,8],[5,3],[2,-1],[-2,-4],[-3,0],[-3,-4],[-2,-4],[-4,-5],[-1,-3]],[[3493,7916],[-2,-2],[-1,2],[2,3],[2,6],[1,-2],[-2,-7]],[[3207,7941],[0,-4],[-4,-4],[-1,1],[1,2],[0,4],[4,1]],[[1571,7991],[-2,-1],[-1,1],[-1,10],[3,-3],[-1,-1],[2,-3],[0,-3]],[[3135,7785],[-4,1],[-2,-2],[-1,1],[-3,6],[1,4],[-2,8],[3,5],[-2,3],[-3,0],[-2,1],[-2,3],[-2,1],[0,5],[1,1],[-1,3],[1,4],[-1,1],[0,22],[0,43],[-4,5],[-4,6],[-4,4],[-2,1],[-5,-4],[-5,-2],[-5,-3],[-5,2],[-1,2],[0,9],[-5,2],[-2,-3],[-1,-3],[-4,-7],[-6,-14],[-5,-9],[-3,-7],[-2,-16],[-3,-5],[-2,-6],[-2,-11],[0,-4],[1,-5],[-2,-2],[-2,-4],[0,-3],[-1,-2],[-4,-4],[-3,-5],[0,-3],[1,-4],[-3,-1],[-2,-3],[1,-3],[-2,-3],[-3,5],[-4,-5],[-2,0],[-3,2],[-3,-5],[-2,-11],[-12,0],[-23,0],[-23,0],[-12,-1],[-19,0]],[[2924,7775],[4,3],[8,8],[6,3],[8,9],[6,2],[1,2],[1,7],[3,10],[3,6],[3,8],[5,6],[7,4],[6,10],[4,3],[4,2],[1,4],[2,3],[6,4],[6,1],[7,4],[5,2],[3,4],[4,2],[13,10],[4,5],[5,10],[4,5],[1,6],[6,8],[6,12],[3,8],[5,5],[9,13],[5,5],[2,1],[5,4],[3,5],[6,5],[9,6],[9,7],[13,7],[14,9],[12,5],[8,1],[10,2],[4,0],[15,-4],[8,-5],[8,-11],[2,-7],[-5,2],[-1,-2],[5,-6],[-1,-8],[-2,-8],[-8,-3],[-2,-3],[-3,-7],[-4,-2],[-2,-3],[-7,-5],[-6,1],[-7,4],[-5,5],[-4,-5],[-5,1],[-2,-1],[-4,1],[1,-3],[2,0],[4,-5],[10,-4],[3,-3],[2,-9],[2,-2],[3,1],[4,5],[3,2],[7,2],[-2,-3],[5,0],[5,-4],[-2,-3],[-2,-6],[-2,-11],[-5,-8],[-6,-8],[1,-2],[2,-1],[4,3],[6,-2],[-2,-10],[3,-11],[2,-2],[1,-9],[2,-5],[-1,-4],[3,-2],[0,-4],[10,-1],[1,-2],[7,-2],[2,-3],[-6,-5],[5,-4],[5,-5],[5,1],[4,-4],[2,-3],[5,1],[6,0],[5,-2],[0,-3],[-1,-2],[5,0],[3,-2],[1,3],[6,3],[7,8],[1,-1],[0,-3],[1,-5],[3,-3],[3,-1],[5,3],[2,-2],[4,-10],[0,-2],[-3,-2],[-2,-3],[10,-1],[2,-3],[-2,-3],[-2,1],[-3,-1],[-3,-3],[-3,-2],[-2,0],[-13,-9],[-6,-3],[-7,-6],[-7,-3],[-8,-4],[-1,-1],[-2,1],[-4,-4],[-5,-1],[-2,1],[0,-6],[-2,-4],[-4,1],[-4,3],[0,3],[-3,3],[-1,-6],[-1,-3],[-2,5],[-4,-2],[-1,-6],[1,-1],[1,-5],[-2,-3],[-1,1],[-3,-7],[-3,-2],[-3,-7],[-4,-5],[-1,-4],[-6,-8],[-4,0],[-3,-3],[0,-7],[-1,1],[-2,-3],[-3,2],[-3,-1],[-2,1],[-4,14],[-3,1],[-1,-4],[-3,4],[-1,15],[-1,4],[3,13],[7,11],[-3,1],[-5,-8],[0,2],[3,5],[3,3],[4,2],[3,0],[4,5],[-5,0],[22,22],[5,4],[8,4],[1,3],[2,0],[-1,-4],[0,-3],[1,-3],[3,-1],[4,6],[9,5],[8,1],[3,2],[-7,2],[-8,-1],[-5,2],[-7,-1],[-7,1],[-3,-2],[-1,-3],[-3,1],[-2,2],[2,6],[8,8],[4,8],[2,1],[1,3],[-3,0],[-2,-1],[-1,3],[-3,3],[1,-6],[-5,-10],[-4,-1],[-4,-4],[-14,-12],[-9,-7],[-2,0],[-4,2],[-1,-2],[-3,-2],[-5,-5],[-2,2],[-6,-3],[-4,-1],[-2,5],[-4,0],[-1,1]],[[1497,8026],[1,-5],[-4,1],[-1,1],[1,4],[3,-1]],[[3484,8040],[-7,-6],[-1,1],[-1,5],[2,0],[2,-2],[3,3],[2,-1]],[[3497,8048],[3,-4],[-7,-4],[-2,0],[0,7],[3,-2],[1,4],[2,-1]],[[1551,8036],[0,-1],[-6,4],[-3,3],[-1,3],[-4,3],[1,2],[2,0],[3,-2],[3,-4],[5,-8]],[[1482,8041],[-2,-1],[-7,7],[1,3],[0,4],[2,2],[3,-2],[1,-2],[2,-7],[0,-4]],[[3282,8011],[-11,-1],[-9,4],[-7,1],[-7,4],[-15,10],[-1,3],[-4,8],[-3,4],[-16,9],[-1,4],[3,2],[4,1],[3,0],[10,-4],[13,-3],[6,-3],[12,-8],[14,-13],[3,-1],[6,-6],[3,-8],[-1,-2],[-2,-1]],[[1528,8065],[-1,-1],[-1,7],[1,2],[2,0],[1,-6],[-2,-2]],[[1522,8069],[-2,2],[-3,10],[2,6],[3,-1],[3,-7],[0,-3],[-3,-7]],[[1466,8100],[14,-7],[14,-4],[10,-4],[6,-1],[4,-3],[4,-12],[3,-5],[4,-10],[4,-6],[1,-3],[-1,-2],[3,-7],[5,-6],[13,-7],[5,-4],[5,-9],[2,-7],[3,-8],[4,-13],[1,1],[0,5],[2,-1],[3,-13],[-2,-3],[-3,2],[-2,-5],[-2,-1],[-9,3],[-13,8],[-8,4],[-9,7],[-3,3],[-1,3],[6,8],[2,4],[2,7],[-1,0],[-2,-7],[-1,-1],[-7,-1],[-5,1],[-3,-4],[-2,1],[-3,4],[-5,4],[4,3],[1,3],[-2,0],[-3,5],[-2,-2],[-2,2],[1,5],[-3,0],[-1,3],[-4,1],[-1,-3],[-1,0],[-4,4],[-2,-3],[-1,1],[0,10],[3,1],[3,3],[-6,4],[-5,10],[-5,2],[-2,-4],[-4,0],[-2,4],[0,3],[1,3],[-1,4],[-2,1],[0,-4],[-2,-1],[-3,7],[-6,0],[-3,-3],[-3,2],[2,3],[-1,6],[-3,1],[1,7],[2,1],[6,1],[2,-1],[1,4],[2,3],[-2,1],[-6,0],[0,-4],[-3,-2],[-6,0],[-2,1],[-4,5],[-2,5],[0,3],[1,3],[2,2],[4,2],[5,0],[6,-3],[14,-10]],[[3459,8152],[-2,-6],[-3,-4],[-3,-1],[-6,0],[-2,-1],[-1,-4],[2,-4],[4,1],[2,-5],[0,-2],[-3,-11],[-2,-4],[-4,-3],[-1,-3],[0,-4],[-7,-14],[-2,-2],[0,-2],[-2,-8],[-5,-8],[-1,-3],[0,-8],[-3,-5],[1,-4],[0,-6],[2,2],[4,8],[3,5],[2,1],[5,11],[2,1],[1,-2],[0,-3],[-1,-4],[7,4],[1,0],[3,-3],[3,0],[4,2],[0,-3],[-2,-3],[-4,-4],[-9,-7],[0,-2],[4,1],[1,-1],[0,-5],[-5,-7],[7,3],[4,-4],[5,1],[3,2],[1,-3],[0,-4],[2,2],[0,7],[2,-3],[0,-4],[-2,-8],[-2,-6],[0,-5],[3,4],[-1,2],[2,4],[4,3],[2,-2],[4,5],[3,2],[4,6],[3,2],[0,-11],[1,0],[2,5],[3,0],[8,1],[3,-1],[3,-2],[4,-4],[1,-3],[0,-7],[-7,-9],[0,-2],[-2,-4],[-1,-5],[1,-2],[-2,-1],[0,-2],[2,-2],[3,1],[2,-2],[-2,-5],[0,-3],[-3,-2],[-6,-5],[0,-1],[7,4],[2,0],[1,3],[3,0],[3,-1],[5,5],[2,-1],[2,1],[4,5],[1,0],[0,-8],[-3,-7],[-2,-2],[-3,0],[-2,-4],[-4,-4],[-2,-1],[2,-6],[-1,-1],[-4,-1],[2,-2],[0,-4],[-1,-3],[-5,-7],[1,-4],[2,-4],[4,1],[3,4],[6,15],[6,4],[4,4],[2,-1],[-3,-5],[-4,-13],[-2,-9],[0,-8],[2,-3],[4,5],[2,4],[3,9],[2,-2],[0,-3],[2,-8],[-1,-7],[-7,-19],[1,-3],[0,-4],[-2,-9],[-2,-6],[-2,-3],[-2,-1],[-3,4],[-3,0],[-4,-5],[-1,0],[-1,3],[0,12],[1,4],[-1,3],[1,5],[-1,3],[-5,-8],[-2,-4],[-4,-6],[-2,-1],[-2,1],[-1,5],[3,9],[3,11],[3,7],[0,4],[-1,3],[-1,8],[-3,9],[-4,3],[-1,-1],[0,-4],[-5,-13],[-2,-8],[-2,1],[-1,2],[-2,-3],[-3,-1],[-3,0],[-6,-13],[0,-4],[-2,-3],[-4,-8],[-3,0],[-2,1],[-1,-1],[-9,-2],[-3,3],[0,3],[3,6],[6,2],[4,3],[3,5],[5,11],[6,4],[3,3],[2,4],[0,2],[-4,-3],[-4,2],[-8,0],[-2,-10],[-4,-1],[-5,2],[-3,2],[-6,-2],[0,2],[6,4],[1,11],[-2,0],[-3,-2],[-3,2],[-1,-1],[-2,-6],[-6,-3],[-7,-1],[-2,-2],[-19,4],[-6,-1],[-6,2],[-1,1],[-11,0],[0,4],[-5,-5],[-3,-2],[-14,-3],[-3,2],[-3,8],[-1,9],[3,6],[8,9],[7,10],[3,5],[3,1],[5,5],[-5,0],[-3,1],[-3,0],[-6,-1],[-6,0],[0,2],[3,4],[4,4],[0,-3],[2,-2],[3,-1],[1,2],[1,7],[3,9],[1,6],[4,5],[1,-1],[4,-1],[2,1],[3,8],[-3,1],[-3,4],[0,5],[1,3],[2,3],[3,3],[4,-4],[2,2],[-3,5],[-1,6],[6,19],[3,10],[4,15],[3,7],[5,2],[-3,2],[0,4],[4,4],[4,8],[-1,4],[6,7],[2,9],[3,5],[12,7],[5,5],[3,-1],[1,-3],[5,-2],[1,2],[-1,3],[1,1],[5,1],[1,-3]],[[1446,8148],[-2,-1],[-3,3],[-1,9],[3,3],[3,-6],[0,-8]],[[3461,8172],[-1,3],[4,3],[-1,-4],[-2,-2]],[[2794,8176],[-1,-1],[-5,2],[-1,2],[8,5],[2,-1],[-1,-5],[-2,-2]],[[1360,8176],[-2,1],[-1,7],[1,3],[2,-3],[0,-8]],[[1434,8202],[-3,-1],[1,3],[0,15],[2,4],[3,1],[-1,-14],[-2,-8]],[[1418,8208],[-1,-3],[-4,6],[-4,9],[0,5],[2,-1],[5,-7],[2,-4],[0,-5]],[[1407,8236],[-2,1],[-3,6],[0,4],[2,-1],[3,-10]],[[2757,8221],[-8,1],[-10,5],[-13,7],[-5,3],[-1,2],[4,7],[2,1],[14,2],[5,-1],[11,-16],[1,-6],[0,-5]],[[1340,8247],[2,-5],[1,-5],[0,-5],[-5,-3],[-3,2],[-2,-2],[5,-3],[2,-4],[4,-1],[4,-2],[-4,-7],[5,-9],[1,-1],[3,1],[0,-2],[-2,-4],[2,-2],[4,0],[0,-4],[-3,-4],[-5,5],[-3,5],[-1,4],[-7,9],[-8,12],[-2,2],[-3,7],[1,2],[3,1],[0,2],[-9,4],[-2,4],[5,0],[9,2],[1,2],[4,1],[3,-2]],[[1428,8233],[2,-19],[0,-6],[-2,-4],[-3,-9],[-2,4],[0,23],[-1,0],[-1,-4],[-2,-1],[-4,5],[-2,8],[-2,4],[0,3],[3,7],[0,6],[1,2],[2,0],[6,-6],[3,-4],[2,-9]],[[1411,8243],[-3,-1],[-1,2],[0,4],[2,4],[2,1],[0,-10]],[[2779,8254],[0,-2],[-2,0],[-2,3],[1,2],[3,-3]],[[1392,8246],[-2,0],[-6,10],[-4,3],[-3,5],[-3,3],[2,5],[1,0],[6,-4],[7,-7],[5,-11],[-3,-4]],[[1382,8291],[-3,-5],[-2,-1],[-2,1],[-3,4],[-2,-1],[1,-3],[-2,0],[0,5],[1,2],[6,6],[4,-3],[2,-5]],[[1314,8301],[3,-3],[6,2],[4,-5],[1,-4],[0,-6],[-1,-2],[-10,-7],[0,-2],[11,1],[0,7],[2,4],[-1,10],[5,0],[4,2],[3,4],[1,0],[-1,-9],[-5,-16],[-1,-7],[0,-12],[-1,-4],[-2,-3],[-9,-4],[-5,0],[-4,4],[-2,3],[1,3],[5,0],[2,-2],[1,1],[-7,6],[-5,3],[-2,7],[-4,9],[-1,8],[0,5],[1,8],[1,1],[10,-2]],[[1362,8321],[0,4],[1,5],[4,-1],[-1,-4],[-4,-4]],[[1372,8338],[8,10],[2,5]],[[1382,8353],[1,-5],[-4,-7],[-6,-4],[-1,1]],[[3305,8411],[0,-1],[-6,2],[1,4],[2,1],[4,-3],[-1,-3]],[[2810,8417],[-3,-1],[0,2],[2,4],[1,4],[0,5],[2,3],[2,0],[0,-10],[-1,-3],[-3,-4]],[[2778,8421],[-3,0],[0,4],[6,5],[3,0],[2,2],[1,-1],[-1,-3],[-8,-7]],[[2807,8424],[-5,-11],[-2,-11],[-2,0],[-1,2],[4,13],[-1,4],[-7,-16],[-3,-4],[-2,1],[3,12],[-2,2],[-6,-11],[-3,-4],[-3,2],[0,2],[11,18],[2,5],[2,-1],[-1,-4],[-2,-3],[1,-1],[2,2],[2,4],[2,10],[1,8],[2,-3],[2,-1],[1,-3],[4,-3],[0,-4],[1,-1],[0,-4]],[[2781,8453],[-2,1],[1,5],[2,-3],[-1,-3]],[[3284,8498],[2,-1],[1,-7],[-4,1],[-5,4],[1,3],[2,2],[3,-2]],[[2785,8496],[-3,0],[1,5],[2,0],[0,-5]],[[3078,8584],[-2,-4],[-2,0],[0,6],[-1,3],[4,1],[1,-6]],[[2775,8626],[-3,0],[4,6],[4,-1],[-2,-3],[-3,-2]],[[3210,8660],[-1,-4],[-8,5],[-3,4],[0,3],[5,1],[5,-5],[2,-4]],[[3104,8653],[-4,1],[1,6],[3,5],[2,7],[2,1],[3,-1],[4,-5],[0,-5],[-5,-5],[-6,-4]],[[2818,8681],[-4,-1],[2,4],[5,2],[5,0],[-1,-2],[-7,-3]],[[3198,8718],[-1,-1],[-2,3],[-12,9],[-1,5],[2,1],[6,1],[5,0],[4,-1],[4,-4],[-1,-3],[0,-4],[-4,-6]],[[2415,8745],[-4,3],[-1,2],[4,1],[2,-3],[-1,-3]],[[3193,8747],[2,0],[0,-2],[3,-3],[-2,-3],[-7,4],[-2,4],[0,2],[2,2],[3,-1],[1,-3]],[[2790,8778],[2,-1],[3,-6],[2,-2],[-1,-13],[-2,-3],[-6,-15],[-3,-6],[-3,-1],[-8,9],[-3,2],[-2,4],[0,12],[1,5],[6,11],[5,4],[4,-1],[5,1]],[[3199,8787],[8,-1],[3,-4],[-2,-4],[-5,-2],[-7,3],[-1,2],[3,2],[1,4]],[[2944,8790],[-7,0],[-11,5],[2,2],[5,-3],[8,0],[2,-1],[1,-3]],[[3045,8786],[-5,0],[-4,1],[-3,2],[-2,3],[0,3],[-4,5],[-4,1],[-2,4],[11,-2],[10,-6],[5,-7],[0,-3],[-2,-1]],[[2721,8809],[2,-1],[-1,-9],[-1,-3],[-3,-4],[-12,-14],[-13,-12],[-3,0],[-3,2],[-4,0],[-9,-4],[-1,8],[-5,7],[0,2],[5,6],[10,20],[3,0],[5,-2],[4,0],[7,4],[7,-1],[6,3],[3,0],[3,-2]],[[2836,8839],[2,-2],[3,0],[5,-10],[0,-2],[-4,-4],[-4,-2],[-6,1],[-7,6],[-7,10],[0,2],[8,2],[8,0],[2,-1]],[[2869,8835],[-3,-1],[-4,1],[-12,11],[7,5],[10,-6],[3,-4],[-1,-6]],[[2842,8869],[-2,-3],[-5,1],[-1,3],[7,2],[1,-3]],[[2640,8942],[3,0],[1,3],[5,8],[3,1],[7,-6],[2,-3],[1,-4],[7,-3],[11,-3],[8,-10],[6,-3],[11,-9],[9,-2],[6,-4],[7,-13],[4,-15],[-2,-3],[-5,-5],[5,0],[11,3],[9,-3],[2,4],[3,0],[4,-4],[3,-5],[0,-2],[9,-6],[-1,-2],[-12,-10],[-6,-6],[-3,-1],[-4,1],[-5,3],[-22,9],[-6,1],[-1,1],[-2,11],[-2,2],[-13,4],[0,6],[-1,2],[-7,-1],[-8,-5],[0,-3],[-2,-8],[-2,-3],[-11,-12],[-5,-1],[-5,-12],[-8,-8],[-5,-3],[-7,-3],[-5,-1],[-3,1],[-2,8],[-4,22],[-2,3],[-14,-3],[-8,0],[-7,-5],[-6,0],[-3,1],[-1,5],[7,13],[18,11],[1,2],[0,6],[-2,8],[-1,8],[1,9],[3,13],[1,7],[2,23],[1,7],[3,10],[5,7],[3,3],[4,2],[3,-4],[5,-3],[4,-6],[0,-6],[-4,-4],[6,-5],[3,-10]],[[2647,8960],[-3,0],[-2,5],[-7,6],[-1,3],[-1,8],[1,4],[6,-1],[7,-12],[2,-8],[0,-3],[-2,-2]],[[2674,8973],[3,-2],[9,-2],[1,-2],[-4,-4],[-6,4],[-1,-2],[-5,1],[3,5],[-3,2],[-5,-3],[-3,2],[-1,8],[-2,3],[-4,2],[-3,4],[2,3],[8,-3],[9,-6],[2,-3],[0,-3],[-2,-2],[2,-2]],[[2690,9001],[6,-1],[-4,-4],[-2,5]],[[1997,9043],[3,-1],[5,0],[-1,-4],[-3,-4],[-3,5],[-1,4]],[[3258,9046],[-3,-2],[-2,2],[7,7],[6,0],[-8,-7]],[[2002,9066],[-1,-5],[-6,6],[0,6],[1,6],[2,2],[2,-3],[0,-6],[2,-3],[0,-3]],[[1967,9099],[5,0],[3,-5],[-1,-1],[-7,4],[0,2]],[[2954,9088],[-13,-1],[-8,1],[-5,2],[-5,9],[1,5],[9,1],[14,-4],[8,0],[3,-1],[2,-7],[0,-5],[-6,0]],[[2594,9085],[-8,4],[-1,3],[2,9],[-3,3],[0,3],[3,6],[4,5],[4,-1],[4,-6],[-1,-3],[2,-9],[0,-3],[-2,-7],[-4,-4]],[[2897,9119],[15,-6],[2,-3],[0,-7],[-2,-4],[1,-13],[0,-7],[-1,-6],[-5,-8],[-13,-6],[-7,-2],[-8,0],[-10,-1],[-5,0],[-4,2],[-2,3],[-4,11],[-2,10],[2,9],[3,6],[5,8],[7,10],[9,3],[8,0],[3,1],[8,0]],[[2805,9111],[-2,-1],[-3,4],[1,5],[5,1],[4,-5],[-5,-4]],[[2095,9123],[-4,1],[-7,4],[-3,3],[2,2],[8,0],[3,-1],[3,-3],[1,-4],[-3,-2]],[[2919,9120],[-2,0],[-3,3],[-7,4],[-2,3],[0,4],[3,6],[6,-1],[2,-2],[5,-9],[0,-5],[-2,-3]],[[2170,9134],[-13,5],[1,2],[4,2],[4,5],[7,-3],[1,-3],[-1,-4],[-3,-4]],[[2215,9146],[-4,-4],[-7,3],[1,13],[2,2],[3,-1],[3,-4],[4,-3],[-2,-6]],[[2222,9158],[-1,-3],[-5,2],[-1,5],[2,3],[4,-2],[1,-5]],[[2486,9170],[-3,0],[-3,4],[-2,0],[0,3],[5,2],[3,-7],[0,-2]],[[2799,9149],[-4,0],[-1,5],[4,6],[3,3],[7,2],[2,6],[4,2],[0,5],[6,2],[3,0],[3,-5],[-1,-2],[-5,-4],[-4,-7],[-7,-9],[-10,-4]],[[2494,9182],[0,-4],[-2,-5],[-2,-1],[-4,5],[0,2],[3,3],[5,0]],[[2860,9166],[-3,-1],[-3,1],[-3,3],[-1,4],[1,9],[6,1],[3,-2],[7,0],[2,-2],[0,-3],[-5,-5],[-1,-3],[-3,-2]],[[2189,9180],[-3,0],[0,3],[2,2],[-3,2],[0,4],[6,-2],[3,-5],[-2,0],[-3,-4]],[[2346,9191],[4,-4],[-2,-8],[-4,-2],[-4,1],[2,3],[-1,8],[-3,1],[0,-7],[-2,-5],[-3,2],[0,7],[1,3],[4,4],[3,0],[5,-3]],[[1137,9191],[-2,-2],[-5,3],[4,3],[2,0],[6,-3],[-5,-1]],[[3113,9189],[-1,-1],[-7,3],[-1,2],[7,4],[2,0],[4,-3],[-4,-5]],[[2832,9199],[1,-5],[-9,-5],[-7,-3],[-6,2],[5,6],[8,2],[3,4],[5,-1]],[[2793,9203],[2,-4],[-1,-2],[-5,-3],[-9,-1],[-2,-3],[0,-3],[-5,1],[-3,4],[-2,-1],[-3,4],[-10,2],[0,2],[4,2],[5,-1],[1,4],[4,-1],[2,1],[7,-4],[10,4],[5,-1]],[[2293,9195],[2,-1],[2,3],[5,-4],[3,-4],[8,-4],[11,-8],[7,-12],[3,-6],[3,-4],[7,-7],[4,3],[4,-1],[0,-4],[-5,-3],[-4,0],[-5,-3],[-2,-4],[-4,-1],[-7,-6],[-4,-2],[-5,0],[-11,4],[-7,-1],[-6,1],[-12,8],[-11,5],[-1,5],[-6,-3],[-4,0],[-4,2],[-1,5],[-3,1],[-3,-2],[0,-2],[-7,0],[-3,3],[-3,7],[3,5],[15,2],[5,3],[6,5],[2,3],[-3,4],[0,9],[4,-1],[5,-5],[2,2],[-4,7],[0,3],[2,6],[4,3],[8,1],[3,-1],[8,-7],[-2,-2],[1,-2]],[[2585,9222],[3,-1],[3,1],[4,-2],[0,-5],[-8,-1],[-4,2],[-2,-1],[-4,1],[-3,5],[6,3],[5,-2]],[[2213,9244],[-6,1],[-3,2],[-1,3],[1,4],[3,0],[7,-5],[-1,-5]],[[1388,8402],[0,8],[-2,5],[-4,-1],[-5,2],[-2,6],[-5,2],[-2,4],[-6,3],[-4,1],[-3,3],[-8,6],[-2,2],[-7,0],[-2,9],[0,2],[-2,2],[-4,2],[2,10],[-9,3],[3,7],[-6,12],[-3,5],[-7,16],[-5,10],[-3,7],[-5,9],[-4,6],[1,5],[-8,10],[-4,7],[-11,8],[-5,9],[-1,5],[-5,4],[-5,5],[-4,2],[-4,9],[1,3],[0,5],[-6,7],[-6,5],[-17,-9],[-6,-2],[2,-4],[-1,-3],[-5,-1],[0,-10],[-3,-8],[-7,0],[-13,-9],[-4,-5],[-3,1],[1,4],[-1,7],[-2,7],[-7,8],[-4,4],[-5,6],[-13,13],[-2,8],[-9,5],[-4,5],[1,5],[2,6],[0,4],[-4,0],[-7,-1],[-6,0],[-8,-8],[-13,6],[-2,-4],[-13,4],[0,34],[0,34],[0,17],[0,33],[0,34],[0,34],[0,33],[0,17],[0,34],[0,17],[0,33],[0,17],[0,34],[0,33],[0,34],[0,34],[0,33],[0,34]],[[1083,9195],[16,-3],[12,1],[22,-6],[14,-11],[11,-6],[4,-4],[25,-10],[5,-1],[10,-4],[6,1],[10,-1],[7,-3],[14,-8],[4,0],[-5,8],[-6,3],[-7,2],[-2,3],[2,2],[6,1],[-7,5],[6,12],[2,-2],[3,3],[6,-2],[2,7],[2,3],[8,1],[11,-1],[-1,6],[3,6],[4,-1],[3,-5],[7,-3],[-1,-6],[-2,-2],[-5,-8],[7,3],[7,4],[6,2],[5,0],[6,4],[4,9],[2,1],[11,0],[1,1],[-4,2],[2,2],[4,1],[3,-3],[2,0],[7,3],[9,7],[8,3],[2,-2],[3,1],[6,8],[7,5],[7,0],[6,-3],[4,1],[3,-1],[6,6],[3,-1],[2,-6],[-3,-4],[-22,-12],[-7,-6],[-7,-3],[-25,-5],[-3,-1],[-5,-7],[-5,-6],[-5,-2],[-5,0],[-4,-4],[-4,-6],[-12,-12],[2,-2],[17,-2],[4,2],[1,2],[-5,1],[-2,6],[2,4],[5,4],[5,1],[6,4],[6,3],[4,5],[-1,2],[5,3],[8,-1],[1,-2],[4,3],[3,0],[2,-6],[3,-2],[6,9],[8,10],[7,4],[15,6],[13,3],[3,3],[2,-3],[-6,-2],[0,-5],[3,-3],[9,6],[10,10],[2,7],[5,3],[9,4],[3,2],[-10,3],[1,3],[-5,3],[0,4],[4,5],[5,-1],[3,-2],[10,-9],[7,-7],[6,-10],[6,-17],[12,-13],[6,-5],[9,-5],[9,-1],[6,4],[0,3],[-2,5],[-3,4],[4,6],[1,5],[3,0],[9,10],[-6,1],[0,2],[6,2],[1,2],[4,2],[4,-2],[-1,-12],[3,-10],[6,-3],[0,-2],[-9,-11],[1,-5],[9,-1],[2,1],[12,0],[4,3],[3,4],[4,3],[2,5],[2,9],[3,2],[5,-1],[2,1],[9,-1],[9,1],[9,-1],[21,-8],[19,-14],[12,-5],[27,-5],[4,-1],[7,-5],[11,-6],[22,-6],[5,-2],[3,1],[13,-2],[3,0],[10,-3],[-5,8],[9,-1],[1,2],[7,-1],[6,-2],[5,-3],[7,-2],[10,-6],[6,-5],[6,-6],[4,-8],[3,-1],[-4,-8],[-5,-1],[-14,2],[-2,-5],[-8,-3],[-1,-7],[-7,-5],[0,-2],[4,-1],[4,-3],[8,-1],[16,-4],[3,0],[8,-2],[18,0],[4,-1],[18,0],[3,2],[6,1],[15,1],[11,4],[1,-2],[4,0],[5,2],[12,7],[5,0],[3,3],[2,-1],[3,-6],[4,-3],[2,-4],[2,-1],[11,-1],[4,-1],[3,-4],[0,-6],[4,-6],[1,1],[2,8],[3,1],[4,-7],[14,-13],[2,-5],[-2,-4],[-3,-2],[-4,-1],[-6,1],[6,-7],[3,-5],[10,-10],[1,-3],[4,-1],[-4,7],[0,5],[-1,8],[4,3],[3,-4],[3,0],[7,-3],[-6,10],[2,2],[-8,10],[-2,7],[0,7],[-6,7],[-3,6],[0,5],[6,5],[1,3],[-1,4],[9,1],[9,3],[8,1],[3,5],[8,0],[0,5],[4,5],[7,1],[5,4],[3,7],[-5,3],[-3,-1],[-12,-6],[-2,-3],[-2,-6],[-9,1],[-6,-4],[-4,-1],[-6,2],[-3,0],[-4,-3],[2,-4],[-1,-2],[-8,-1],[-3,1],[-4,-1],[-3,1],[-10,7],[2,5],[10,13],[15,2],[9,3],[17,7],[3,0],[11,5],[4,1],[10,-3],[4,-2],[4,-7],[4,-17],[8,-7],[4,1],[1,-4],[4,0],[4,-2],[0,-5],[8,-5],[12,0],[7,2],[5,3],[13,-10],[5,-5],[4,-3],[10,-4],[7,1],[5,-1],[9,-3],[13,4],[2,0],[8,3],[3,0],[5,2],[7,0],[20,-3],[5,-3],[4,-1],[6,0],[4,1],[3,2],[8,2],[-2,3],[-4,3],[-3,5],[1,4],[4,-1],[4,-4],[9,-12],[4,-4],[9,-4],[4,-1],[9,6],[0,4],[-2,4],[-4,2],[-5,4],[-6,1],[-10,-5],[-9,10],[1,3],[-1,5],[-2,1],[-4,6],[0,2],[5,1],[7,-4],[4,2],[8,2],[-3,4],[-1,4],[3,1],[8,-4],[1,2],[4,-1],[6,-6],[4,-7],[10,-1],[6,3],[-9,-13],[1,-2],[6,3],[1,4],[11,5],[2,0],[-5,-24],[-1,-6],[-5,-10],[0,-2],[5,-6],[1,-7],[4,-1],[8,3],[1,-1],[-2,-6],[6,1],[4,-4],[0,-8],[-3,-2],[-7,-1],[-5,3],[-7,-1],[-4,4],[-2,-2],[17,-19],[0,-5],[1,0],[1,5],[-1,2],[-7,8],[-1,3],[2,2],[10,-2],[4,0],[4,3],[0,10],[2,7],[-3,14],[-2,6],[-5,5],[-1,2],[7,18],[5,0],[3,2],[7,-3],[3,2],[8,7],[6,6],[4,6],[5,4],[13,7],[0,2],[-5,0],[-1,3],[1,9],[-3,8],[-4,1],[-1,-6],[-4,-6],[-11,-2],[-4,3],[2,6],[2,3],[7,5],[4,5],[-5,1],[-1,6],[1,4],[18,5],[-6,-9],[2,-1],[9,8],[-3,1],[0,5],[-3,2],[-4,-1],[-6,-3],[-4,0],[-5,2],[-8,10],[-3,0],[-3,-4],[-13,5],[-8,5],[-13,4],[-3,6],[-9,11],[-2,5],[0,7],[6,8],[1,3],[5,3],[4,1],[2,6],[-8,-3],[-4,2],[-6,8],[0,4],[3,11],[-2,3],[3,3],[-1,4],[1,2],[10,8],[9,-5],[5,0],[4,9],[-1,1],[-9,0],[-3,4],[7,6],[3,6],[9,7],[16,5],[4,-4],[0,-4],[5,-5],[3,-1],[3,1],[7,0],[2,-1],[-1,-4],[1,-2],[10,-7],[10,-11],[2,-4],[2,-8],[0,-12],[-3,-4],[6,-3],[6,-6],[6,-3],[4,-8],[5,-8],[-1,-3],[4,-1],[3,3],[3,-3],[4,-8],[-12,-1],[-4,2],[-4,4],[-7,-8],[2,-1],[9,0],[4,-3],[-2,-3],[-6,-5],[-17,-13],[2,-1],[9,2],[7,-2],[1,-3],[8,-4],[5,1],[10,6],[5,0],[1,-2],[-4,-2],[0,-2],[10,-2],[11,0],[4,-3],[-6,-1],[-4,-3],[-2,-6],[-2,-1],[-9,1],[14,-10],[4,-9],[3,-4],[-2,-4],[1,-12],[-2,-8],[7,-8],[2,-4],[2,1],[5,7],[4,7],[-1,6],[3,6],[2,12],[5,8],[5,9],[5,2],[3,0],[7,-8],[5,-4],[12,-8],[5,-6],[2,-6],[1,-8],[3,-7],[0,-9],[-2,-3],[-6,0],[-4,6],[-3,-3],[1,-7],[0,-13],[3,-11],[6,-8],[14,-15],[0,-2],[3,-8],[2,-1],[14,14],[2,0],[5,4],[1,10],[4,10],[12,14],[6,22],[-1,7],[2,6],[4,3],[1,3],[6,-2],[12,2],[0,1],[-7,3],[3,6],[2,0],[2,7],[-7,5],[-4,0],[-4,4],[-1,5],[1,5],[-1,5],[1,3],[-3,6],[2,6],[-2,5],[3,1],[6,-3],[5,0],[10,3],[11,-1],[9,-5],[7,-3],[19,-1],[7,1],[10,-3],[0,-3],[-3,-4],[-8,-2],[4,-2],[9,-3],[3,-6],[-1,-3],[8,1],[6,-1],[9,-3],[2,-5],[-17,-13],[7,0],[9,-2],[3,-4],[-1,-7],[-6,-6],[-9,-4],[-2,-2],[-6,3],[-8,-2],[-2,1],[-2,-2],[5,-7],[-2,-1],[2,-2],[4,-8],[6,2],[-2,-7],[0,-4],[3,-7],[8,-8],[8,-7],[4,-8],[-1,-6],[-5,-17],[-4,-3],[-7,-1],[-4,-4],[-3,-6],[-4,-5],[-3,-1],[-7,-7],[-9,-2],[-10,-10],[-3,-1],[-5,1],[-1,6],[-3,3],[-7,11],[-6,0],[-4,5],[2,1],[-7,7],[-4,3],[-5,1],[-5,-4],[-2,-4],[3,-1],[4,4],[3,0],[12,-13],[3,-2],[3,-9],[4,-6],[5,-10],[-2,-2],[-4,1],[-8,4],[-3,-2],[-2,-5],[-12,5],[-6,4],[-5,6],[-4,6],[-5,2],[-5,-3],[-25,0],[-1,-1],[1,-8],[3,-3],[13,-5],[3,-2],[1,-4],[-2,-6],[-25,-28],[-7,-9],[-7,-2],[-14,0],[-5,3],[-7,7],[-5,4],[-3,1],[-2,4],[-9,4],[-14,10],[-5,1],[-5,0],[2,-4],[-7,1],[-6,3],[-5,-1],[-14,3],[-8,0],[-3,-1],[9,-4],[3,2],[11,-2],[12,-4],[3,0],[7,-4],[5,-5],[10,-12],[8,-6],[21,-4],[8,0],[15,-1],[10,-3],[1,-6],[-6,-10],[-2,-6],[-17,-24],[-3,-9],[-3,-4],[-8,-5],[-7,-5],[-5,-1],[-4,1],[-3,2],[-2,-4],[-7,4],[-3,-2],[-3,1],[-4,4],[-2,5],[-7,-3],[4,-3],[2,-7],[-2,-1],[-6,3],[3,-6],[1,-5],[-4,-6],[-3,-3],[-3,-1],[-6,2],[-3,-4],[-3,-1],[-9,3],[-11,6],[-12,2],[1,3],[-3,0],[-2,-2],[-7,0],[-17,9],[-13,5],[-5,1],[-2,-6],[3,-4],[4,-2],[5,1],[-4,3],[0,3],[6,-3],[18,-8],[10,-4],[-1,-2],[-7,-5],[0,-1],[5,0],[9,7],[3,1],[4,-2],[6,-6],[4,-3],[7,-2],[10,-7],[1,-16],[-2,-6],[-7,-1],[-9,-7],[-3,-1],[-12,1],[-6,2],[-3,-2],[-4,0],[-1,-3],[2,-4],[5,-2],[5,-1],[0,-4],[-4,-2],[-3,2],[-5,-2],[-3,1],[-2,-1],[-1,-5],[-5,-5],[7,-10],[-3,0],[-6,6],[-8,4],[-1,-1],[7,-6],[1,-2],[-5,-4],[1,-3],[-1,-2],[-3,-2],[-5,0],[2,-4],[-2,-2],[-6,1],[1,-4],[6,-5],[-1,-3],[-2,-2],[-8,-5],[-5,-7],[-1,-3],[1,-5],[-1,-2],[-4,0],[1,-6],[-3,-11],[-4,-9],[-4,-8],[-2,-7],[-2,-4],[-3,0],[-2,-2],[3,-3],[0,-8],[-2,-12],[-2,-8],[1,-28],[-1,-12],[-1,-7],[-1,-3],[3,-4],[0,-3],[2,-6],[3,0],[5,-7],[3,-2],[-1,-21],[2,2],[1,14],[3,6],[2,2],[7,1],[8,-2],[4,0],[2,1],[3,-2],[1,-2],[0,-7],[1,-5],[5,-15],[6,-26],[6,-18],[2,-8],[-5,-16],[-2,-3],[1,-2],[5,5],[4,0],[2,-2],[6,3],[25,10],[6,1],[9,-2],[7,-4],[7,-6],[8,-4],[13,-3],[3,-2],[7,-2],[4,-2],[10,-12],[5,-4],[6,-4],[5,-8],[9,-16],[2,-2],[6,-3],[10,-3],[15,-8],[15,-7],[4,-3],[4,-4],[4,-6],[5,-5],[0,-7],[4,4],[4,0],[6,-2],[6,0],[8,2],[5,0],[3,1],[7,-3],[3,0],[10,-2],[6,1],[3,-5],[5,1],[3,-1],[6,-5],[2,-4],[2,-8],[0,-3],[-4,-19],[-1,-7],[0,-6],[1,-4],[4,-8],[3,-13],[-1,-4],[-1,-8],[0,-5],[1,-9],[0,-6],[-2,-3],[-2,-8],[1,-6],[7,-9],[4,-9],[4,-5],[4,-8],[0,-3],[-2,-5],[0,-3],[3,0],[4,-5],[3,-3],[5,-3],[4,-4],[9,-13],[2,-5],[2,-8],[2,-5],[0,-3],[-7,-7],[-5,-8],[2,0],[9,11],[3,1],[7,-3],[8,-6],[2,1],[1,3],[2,10],[3,4],[1,5],[4,3],[2,0],[0,-4],[4,-2],[3,-3],[1,-5],[2,-7],[1,0],[1,7],[3,6],[0,2],[-7,12],[0,2],[3,4],[0,4],[5,7],[3,6],[3,7],[-1,2],[0,6],[-1,6],[-5,8],[-1,7],[2,6],[-4,7],[-3,13],[-1,12],[-1,8],[-2,6],[0,3],[2,6],[2,1],[-2,3],[-1,4],[2,3],[-5,6],[1,3],[-4,3],[-4,7],[-5,15],[-2,3],[0,3],[21,10],[2,2],[15,9],[5,5],[7,5],[20,24],[2,6],[9,14],[3,6],[3,14],[0,9],[1,12],[0,10],[-2,17],[-2,11],[-4,13],[0,3],[-10,21],[-9,10],[-2,3],[-13,9],[-9,10],[-5,4],[1,7],[0,4],[2,4],[5,8],[3,6],[4,6],[4,3],[2,4],[0,2],[-3,4],[4,5],[0,7],[4,0],[5,-7],[2,1],[-2,2],[-2,4],[0,2],[4,4],[-1,8],[2,5],[0,2],[-7,1],[-1,2],[4,2],[0,1],[-6,12],[-1,4],[5,6],[0,2],[-6,0],[-2,4],[2,3],[2,6],[-6,-1],[-3,2],[-5,0],[0,2],[9,14],[3,7],[0,13],[6,7],[-5,4],[-7,8],[-4,9],[-1,11],[-1,5],[1,5],[2,4],[4,4],[9,6],[6,2],[5,-1],[9,-1],[7,-4],[22,-8],[4,-4],[-4,-3],[1,-1],[8,6],[4,1],[12,-4],[8,-7],[1,1],[-3,3],[2,2],[12,6],[4,3],[10,6],[8,-6],[10,-10],[5,-4],[5,0],[2,-6],[-1,-4],[-3,-7],[1,0],[6,5],[8,-5],[4,-6],[2,-7],[2,4],[2,0],[6,-4],[1,-2],[-4,-3],[-3,-5],[2,-1],[4,0],[-3,-5],[6,-7],[5,-4],[5,0],[4,-1],[9,-4],[5,-1],[7,2],[3,-2],[1,-3],[0,-4],[1,-2],[5,-1],[6,3],[1,2],[0,4],[1,2],[4,-1],[0,-2],[2,-5],[0,-4],[-2,-4],[-4,-5],[-3,-7],[0,-5],[-1,-2],[1,-3],[0,-4],[3,-6],[0,-6],[-1,-2],[-4,-3],[-4,-1],[-15,0],[-4,1],[1,-3],[8,0],[14,-2],[4,-4],[2,-9],[0,-6],[-2,-3],[-1,-4],[0,-6],[1,-3],[7,0],[2,-3],[-3,-6],[1,-6],[-2,-4],[0,-5],[-1,-3],[-3,-3],[-1,1],[-2,6],[-4,-5],[-3,-2],[-5,-2],[0,-1],[4,-1],[4,-3],[3,0],[3,2],[8,7],[6,3],[6,-1],[7,1],[4,-2],[5,-7],[1,-9],[3,-4],[0,-7],[-2,-10],[-5,-9],[0,-3],[4,4],[4,18],[2,4],[3,1],[1,-1],[2,-8],[2,-1],[2,5],[1,-1],[1,-8],[3,-2],[5,5],[7,4],[4,4],[3,2],[5,1],[3,4],[1,5],[6,9],[2,0],[3,-4],[4,-7],[0,-10],[1,0],[2,6],[0,4],[-4,10],[1,2],[5,2],[-2,3],[2,4],[4,0],[0,3],[5,-1],[0,2],[4,0],[0,1],[-6,3],[-2,2],[-1,5],[3,-1],[1,2],[0,4],[1,2],[3,-1],[-2,6],[0,2],[4,0],[2,-1],[6,-5],[1,1],[-4,4],[-5,3],[-2,2],[-2,4],[0,4],[2,6],[4,2],[6,-4],[1,1],[-4,3],[0,5],[7,20],[3,4],[3,1],[6,-4],[2,-6],[-3,-4],[-1,-3],[4,1],[4,0],[2,-5],[1,-11],[3,2],[2,-4],[1,-6],[3,-4],[2,-4],[-2,-4],[-4,-2],[1,-2],[4,-1],[1,-2],[6,1],[4,-8],[-3,-5],[-7,-3],[-6,0],[1,-2],[4,0],[6,1],[5,2],[4,0],[-1,-4],[2,-6],[-2,-2],[3,-1],[4,2],[5,-12],[-7,-8],[-3,-1],[0,-3],[2,0],[2,-3],[7,4],[6,1],[0,-2],[-2,-9],[-4,-6],[-7,-5],[-5,-6],[1,-1],[7,5],[4,2],[7,2],[2,0],[5,-11],[3,-1],[3,1],[4,-3],[2,-3],[-3,-5],[2,-6],[-1,-3],[-6,-5],[-2,0],[-2,-3],[-2,0],[0,-2],[6,1],[7,-2],[2,-3],[-3,-8],[5,-3],[2,1],[2,-1],[8,-10],[0,-5],[-1,-4],[0,-10],[-4,-1],[-15,2],[-8,4],[-1,-2],[8,-4],[3,-4],[5,-1],[2,-4],[-4,0],[-3,-3],[2,-2],[11,-2],[3,-1],[-2,-2],[-6,-3],[0,-3],[4,-1],[4,1],[2,-1],[1,-9],[-4,-2],[3,-3],[5,-1],[2,-5],[3,0],[4,5],[3,-1],[0,-3],[4,-4],[3,0],[4,-2],[-2,-7],[3,-6],[3,-4],[-5,-7],[-2,-7],[0,-2],[3,-1],[4,3],[7,1],[2,2],[3,1],[2,-2],[0,-4],[2,-2],[3,2],[2,-2],[-1,-2],[1,-5],[5,9],[5,-1],[2,-2],[2,-6],[1,-6],[3,-6],[11,-4],[5,2],[1,3],[6,1],[1,-6],[6,-6],[6,-2],[3,-2],[0,-2],[-3,-3],[-2,-4],[-4,-3],[-5,0],[-7,-2],[0,-2],[-2,-2],[-6,-3],[-3,-7],[-3,-4],[-8,0],[-2,-4],[-5,-2],[-9,-6],[-4,0],[-3,1],[-7,-5],[-2,-4],[0,-3],[-2,-3],[-3,1],[-3,3],[0,-3],[6,-4],[2,-3],[-6,-5],[0,-2],[2,-1],[-3,-3],[0,-2],[5,3],[5,5],[4,6],[6,2],[8,6],[6,6],[6,7],[7,6],[9,5],[7,2],[4,0],[0,1],[-4,1],[-7,-1],[-1,3],[1,2],[4,2],[16,-2],[5,-2],[6,-14],[2,-4],[0,-3],[-3,-5],[-7,-5],[2,-2],[3,-7],[3,3],[5,9],[5,4],[4,1],[7,0],[0,-3],[3,-5],[7,-2],[4,-7],[1,-4],[2,-3],[-1,-2],[2,-4],[0,-6],[-2,-8],[1,-10],[-1,-5],[2,-4],[-1,-3],[-13,-3],[2,-2],[5,0],[6,-1],[3,-2],[1,-3],[-2,-4],[-7,2],[0,-1],[7,-5],[3,-6],[-1,-3],[-9,-12],[-7,-7],[-8,-7],[-12,-13],[-3,-1],[-5,2],[-5,0],[-11,-4],[-5,-5],[-6,-1],[-7,0],[-2,-2],[-2,-5],[-11,-17],[-3,-6],[-6,-6],[-7,-10],[-5,-5],[-2,-6],[-6,-3],[-10,-1],[-4,-1],[-6,2],[-4,-3],[-6,-1],[-3,1],[-12,-6],[-3,6],[-3,2],[-7,0],[-5,2],[-10,2],[-3,0],[-3,-1],[-6,0],[-2,-3],[-10,1],[-4,3],[-8,0],[-4,-2],[-10,2],[-10,-2],[-8,1],[-3,2],[-14,-4],[-5,2],[-5,-5],[-3,1],[-3,-1],[-2,1],[-2,-1],[-1,-3],[-2,0],[-4,-5],[-5,-4],[-8,-23],[-1,-8],[-3,-6],[-5,-1],[-14,-5],[-7,-3],[2,-3],[-2,-2],[-7,-3],[-2,-3],[-1,-4],[-8,-6],[-8,-15],[-4,-11],[-5,-8],[-3,-3],[-3,0],[-2,1],[-4,4],[-3,0],[-8,5],[-15,3],[2,-3],[5,-1],[5,0],[10,-6],[5,-2],[5,-6],[-2,-9],[-2,-7],[-2,-5],[-9,-14],[-4,-4],[-7,-17],[-7,-7],[-4,-5],[-4,-7],[-10,-6],[-4,-1],[-3,0],[-9,-7],[-2,-4],[-12,-12],[-4,-1],[-4,-3],[-1,-5],[-4,-3],[-3,-10],[-6,-9],[-6,-2],[-3,-3],[-3,-5],[-3,-4],[1,-4],[0,-5],[-3,-1],[-7,-7],[-10,-12]],[[2924,7775],[-4,0],[-4,-1],[-5,-5],[-6,-7],[-11,-16],[-2,-4],[-4,-3],[-4,-4],[-1,-3],[-2,-2],[-6,-9],[-6,-16],[-4,-9],[-12,0],[-17,0],[-23,0],[-4,-2],[-4,-4],[-5,-3],[3,-11],[0,-11],[1,-1],[0,-4],[2,-2],[1,-3],[-1,-3],[-2,-3],[-12,-9],[-8,-7],[-14,-9],[-12,-4],[-10,-3],[-6,-3],[-14,-12],[-12,-12],[-7,-6],[-7,0],[-5,4],[-4,5],[-3,8],[0,10],[1,6],[1,3],[5,5],[9,13],[2,7],[2,16],[0,3],[3,11],[3,12],[2,6],[-2,14],[-2,22],[-2,11],[-4,40],[-2,15],[-17,17],[-12,10],[4,11],[-1,1],[-3,6],[-2,0],[-7,-3],[-3,4],[-2,5],[0,8],[-1,4],[0,6],[-7,-1],[-3,-4],[-2,0],[-3,5],[-3,6],[-2,15],[-6,4],[-5,5],[-6,4],[-10,10],[-6,4],[-5,5],[-12,10],[-7,6],[-8,6],[-15,13],[-5,4],[-2,1],[-5,4],[-6,4],[-6,-2],[-13,-10],[-6,-4],[-7,-1],[-7,1],[-3,-1],[-3,1],[-2,6],[-7,-1],[-8,1],[-3,-1],[-2,2],[-1,4],[-6,-1],[-5,-5],[-4,-3],[-4,0],[-4,3],[-5,5],[-4,6],[-5,3],[-4,-1],[-1,-3],[-2,0],[-2,9],[-2,2],[-8,6],[-6,3],[-9,0],[-2,-4],[-7,-2],[-4,5],[-5,3],[-16,5],[-2,2],[-3,13],[-1,6],[-1,9],[0,3],[-2,2],[-6,1],[0,-22],[-19,0],[-23,0],[-24,0],[-24,0],[-23,0],[-12,0],[-24,0],[-23,0],[-12,0],[-24,0],[-24,0],[-23,0],[-24,0],[-24,0],[-23,0],[-12,0],[-24,0],[-12,0],[-23,0],[-24,0],[-12,0],[-24,0],[-23,0],[-24,0],[-24,0],[-12,0],[-23,0],[-12,0],[-24,0],[-24,0],[-23,0],[-24,0],[-24,0],[-23,0],[-12,0],[-24,0],[-14,0]],[[1589,8005],[-4,5],[-3,-2],[-1,-3],[-1,0],[-1,4],[2,3],[-4,2],[0,4],[-1,3],[2,1],[3,0],[1,2],[-4,2],[-3,-1],[0,3],[1,3],[0,9],[-3,-3],[1,-2],[-1,-3],[-2,0],[-2,-3],[-1,0],[-9,4],[-3,3],[-2,4],[-1,4],[2,4],[2,-1],[3,-8],[6,4],[0,2],[-3,-2],[-3,2],[-2,3],[0,16],[-2,-1],[0,-6],[-3,-2],[-2,-4],[-4,-1],[-4,0],[-2,2],[-8,12],[0,3],[-4,11],[-1,6],[-2,0],[0,3],[3,7],[2,6],[0,13],[-2,-3],[0,-8],[-1,-5],[-3,-4],[-4,-2],[-8,1],[-5,-2],[-4,3],[-4,-2],[-12,3],[-1,1],[1,3],[5,1],[9,4],[-2,1],[-11,-2],[-4,0],[0,3],[3,5],[0,2],[-3,1],[1,6],[-2,0],[-2,-3],[-9,-1],[-3,-2],[-6,3],[-5,4],[-7,10],[0,11],[8,15],[2,2],[10,1],[-1,3],[-9,0],[-3,-2],[-5,-12],[-3,2],[0,2],[-2,4],[-2,9],[4,13],[-3,0],[0,5],[1,6],[10,10],[6,2],[2,-4],[4,-2],[2,-2],[1,-4],[5,-7],[1,0],[-6,9],[-1,5],[-6,5],[-1,4],[0,4],[6,7],[1,4],[0,4],[-2,3],[0,-9],[-2,-3],[-12,-16],[-5,-2],[-4,-4],[-1,-6],[-3,-11],[-3,-10],[-3,12],[-4,10],[9,9],[-1,8],[-6,-6],[0,4],[4,22],[2,6],[-1,0],[-7,-5],[-3,3],[-2,15],[-3,6],[-6,5],[-6,2],[-2,4],[-1,6],[2,6],[2,3],[5,1],[-1,-9],[2,0],[8,-8],[2,0],[3,2],[2,0],[4,-2],[1,2],[-3,2],[-4,0],[-4,-1],[-3,2],[-2,3],[-3,9],[2,6],[4,2],[-2,4],[-2,0],[-6,-6],[-4,-2],[-4,-8],[0,-4],[-1,-5],[0,-4],[-6,-4],[-3,-6],[-3,5],[-4,5],[-2,8],[-5,1],[-5,5],[-2,4],[3,8],[4,6],[0,8],[1,1],[7,2],[5,4],[-8,0],[-5,-3],[-6,5],[-3,5],[-1,4],[1,3],[0,4],[3,9],[2,2],[3,9],[5,11],[1,5],[7,15],[-1,0],[-3,7],[-1,-1],[0,-12],[-1,-4],[-3,-8],[-2,-3],[-1,2],[3,15],[-2,6],[-1,6],[0,11],[2,7]],[[2311,9384],[-5,0],[-4,4],[0,6],[2,3],[5,2],[3,-4],[3,-1],[1,-4],[-2,-4],[-3,-2]],[[1818,9365],[5,-1],[11,4],[7,1],[3,-1],[3,2],[0,8],[5,7],[6,3],[9,-1],[9,-3],[11,-2],[16,-8],[5,-3],[1,-2],[-3,-6],[-7,-8],[-6,-2],[-2,-2],[6,-3],[4,3],[6,6],[1,-5],[4,-1],[5,4],[5,6],[8,4],[2,2],[6,1],[0,6],[-2,2],[-8,4],[-3,5],[0,3],[16,0],[3,-1],[11,-6],[3,-4],[10,-5],[4,-3],[0,-4],[5,-2],[3,-4],[4,-10],[2,-11],[6,-13],[1,-9],[2,-3],[4,-1],[2,-2],[4,-1],[3,5],[10,7],[-2,2],[3,1],[-7,8],[-4,7],[-3,9],[-1,8],[-3,4],[0,4],[-2,4],[-6,26],[0,3],[3,3],[5,0],[-4,4],[1,4],[9,-1],[6,-2],[11,-6],[4,5],[4,-1],[9,-4],[12,-7],[7,-3],[5,-5],[6,-8],[0,-5],[3,-4],[0,-4],[2,-9],[10,-25],[3,-6],[7,-10],[4,-7],[1,-11],[-3,-5],[-3,-10],[1,-4],[10,-7],[6,-10],[2,-2],[8,-5],[11,-5],[3,-3],[2,1],[-2,6],[1,2],[8,-8],[11,-6],[12,-8],[5,1],[3,-2],[2,-7],[12,1],[3,-2],[3,-14],[0,-9],[-3,-3],[-9,2],[-3,8],[-1,0],[-4,-8],[-3,0],[-10,7],[-4,1],[-8,-5],[-2,-2],[2,-3],[0,-4],[-2,-3],[-9,1],[-12,7],[-3,-2],[10,-10],[2,0],[0,-6],[-2,-8],[1,-1],[5,7],[13,8],[8,1],[5,-4],[-3,-4],[0,-4],[2,-3],[5,-1],[1,-5],[-2,-6],[-18,-8],[-7,-1],[-4,-3],[-7,1],[-9,-1],[-16,3],[-8,3],[-3,0],[-3,-3],[-15,3],[-2,2],[4,7],[-7,1],[-7,2],[-13,1],[-4,1],[-6,4],[0,9],[-5,3],[-3,0],[-6,-5],[-5,-10],[-9,-9],[-2,-1],[-12,-3],[-14,-1],[-5,-2],[-11,-8],[-15,-5],[-13,-3],[-14,-1],[-11,-2],[-8,1],[-5,-3],[-27,-1],[-16,-3],[-7,1],[-6,6],[-8,14],[1,11],[-2,9],[-1,1],[-10,3],[-7,1],[-24,0],[-12,1],[-7,1],[-7,2],[-11,5],[-6,9],[-11,13],[-2,11],[0,3],[2,3],[16,4],[28,5],[26,3],[12,0],[7,-2],[7,0],[13,-1],[15,-2],[4,0],[9,3],[11,0],[4,2],[-2,2],[-11,6],[-29,10],[-7,2],[-10,2],[-16,-1],[-7,-2],[-7,-1],[-13,-1],[-21,-1],[-4,2],[-21,-1],[-17,1],[-19,15],[-3,5],[3,4],[9,6],[18,4],[24,7],[15,3],[-4,2],[0,2],[8,2],[11,-1],[0,2],[-6,2],[-34,-6],[-15,0],[-11,-3],[-6,0],[-7,3],[-1,2],[2,3],[8,2],[4,6],[-18,-1],[-6,0],[-8,2],[-3,5],[0,8],[1,5],[10,10],[6,2],[5,5],[-8,8],[3,6],[7,6],[24,16],[8,3],[11,5],[29,9],[25,9],[9,-2],[4,-3],[3,-12],[0,-9],[-1,-3],[-5,-7],[-7,-8]],[[2075,9383],[-4,1],[-4,3],[-14,12],[-1,4],[-12,9],[-11,4],[-1,1],[8,10],[2,1],[30,4],[11,-1],[8,-6],[3,0],[5,-6],[-1,-11],[-6,-10],[-5,-5],[0,-3],[-8,-7]],[[2790,9426],[5,-1],[30,1],[6,-1],[19,-6],[5,-2],[5,-9],[7,-2],[3,-3],[2,-6],[8,-4],[1,-7],[5,-5],[-3,-2],[-6,-1],[-17,1],[-23,3],[-20,-2],[-16,-5],[-10,-1],[-12,6],[-5,12],[-2,9],[-12,3],[-5,3],[-1,3],[1,6],[-2,6],[0,8],[3,2],[10,0],[8,-3],[16,-3]],[[2594,9273],[1,-1],[12,4],[13,6],[15,0],[3,-1],[-2,-4],[6,-4],[2,5],[2,15],[2,9],[0,5],[-5,4],[-6,-1],[-6,2],[-4,3],[-5,8],[-9,7],[1,2],[9,4],[4,7],[2,1],[9,-1],[11,-5],[-1,3],[-4,4],[-1,4],[6,3],[-10,2],[-5,-2],[-7,4],[-7,11],[0,8],[2,5],[3,4],[6,1],[28,-9],[-1,3],[-22,9],[-9,3],[-2,3],[13,13],[11,3],[5,4],[9,0],[9,-2],[-4,5],[5,4],[9,3],[21,6],[20,0],[9,-2],[6,-3],[5,-9],[2,-10],[4,-4],[9,-4],[3,-6],[-1,-4],[1,-4],[4,-7],[4,-2],[0,-2],[-4,-4],[-16,-14],[7,2],[4,-2],[-6,-10],[-3,-4],[7,-5],[-7,-1],[0,-10],[4,1],[2,4],[9,9],[8,4],[5,-3],[1,1],[-6,7],[1,4],[4,3],[4,1],[4,-6],[6,0],[3,3],[9,-7],[-1,-10],[1,-3],[6,-7],[4,1],[-4,5],[-2,4],[1,10],[3,5],[8,-5],[8,1],[11,-6],[6,0],[-1,2],[-4,1],[-16,7],[-5,4],[-1,5],[4,5],[10,5],[12,3],[8,0],[10,-1],[6,-2],[14,-7],[10,1],[15,-6],[5,-6],[2,-6],[-1,-3],[-9,-10],[-4,-2],[-3,-4],[1,-1],[13,8],[7,2],[5,0],[12,-3],[2,-4],[-1,-5],[-2,-3],[-16,-6],[-9,-1],[7,-3],[7,1],[0,-2],[-3,-4],[-1,-4],[0,-6],[-5,-10],[1,-1],[7,7],[1,8],[3,6],[5,6],[8,0],[4,4],[5,1],[3,-3],[-5,-7],[-9,-11],[4,1],[2,3],[8,7],[2,-4],[4,-3],[2,-6],[4,-3],[2,2],[-3,8],[3,4],[8,7],[9,-4],[13,-1],[13,-4],[11,-9],[2,-5],[-6,-8],[-5,-3],[-8,1],[-4,-2],[-8,-8],[-9,-6],[9,0],[8,11],[7,1],[11,-4],[5,1],[4,4],[7,3],[3,-3],[1,-3],[0,-8],[-3,-4],[-12,-10],[-6,-1],[-5,-2],[-4,-5],[-5,-3],[4,-2],[2,1],[3,5],[3,3],[3,0],[2,-3],[9,5],[3,3],[8,6],[6,3],[11,3],[4,-1],[3,-3],[9,1],[6,-2],[3,-2],[16,-7],[2,-2],[1,-5],[-3,-4],[-2,0],[-8,-6],[-17,-3],[-7,-4],[-10,-7],[4,-2],[3,1],[5,5],[11,3],[13,1],[1,-3],[-8,-10],[3,-2],[7,1],[2,4],[3,2],[5,1],[2,3],[-3,1],[1,4],[5,5],[7,-2],[4,-3],[10,-11],[5,-10],[0,-6],[-4,-2],[-13,3],[-6,0],[-5,-2],[-5,-5],[-8,0],[-5,-1],[-8,-3],[-3,-2],[0,-2],[4,0],[8,3],[8,1],[13,-6],[4,-1],[2,1],[13,0],[9,-3],[7,-5],[3,-3],[0,-5],[-3,-3],[-12,1],[-3,1],[-4,-1],[-8,2],[-5,3],[-7,-3],[-6,2],[-6,-2],[-12,-6],[2,-1],[16,5],[3,0],[15,-7],[0,-6],[-3,-9],[-13,4],[-6,0],[-5,-2],[-14,3],[-2,-1],[12,-5],[15,-2],[5,-3],[0,-4],[6,-5],[8,2],[5,-3],[7,-2],[10,0],[4,-1],[-1,-2],[-7,-2],[-1,-3],[6,-7],[0,-2],[-3,-6],[6,3],[3,-1],[-1,6],[3,2],[9,2],[-2,-9],[0,-5],[-4,-8],[-3,-3],[4,-1],[5,8],[6,6],[1,0],[0,-6],[3,-2],[4,3],[4,0],[4,-6],[3,4],[9,5],[2,0],[2,-3],[-5,-5],[-1,-4],[1,-2],[5,0],[6,3],[3,-2],[3,-4],[7,-7],[4,2],[5,-5],[-7,-4],[2,-9],[-8,1],[-2,-3],[0,-3],[5,0],[4,1],[6,0],[0,3],[4,1],[3,2],[7,-2],[8,-6],[-3,-4],[-4,-10],[-11,-10],[2,0],[13,6],[9,1],[3,1],[3,-2],[6,-1],[8,8],[4,-2],[4,-5],[8,-8],[5,-6],[1,-4],[-4,-3],[-2,0],[-5,5],[-5,2],[-3,0],[-3,-3],[13,-7],[2,-5],[0,-3],[-8,-3],[-8,1],[-6,4],[-4,1],[-1,-1],[4,-5],[-4,-5],[14,-9],[1,-2],[-4,-2],[-13,1],[6,-7],[0,-4],[-3,-1],[-3,-5],[-1,-5],[-5,0],[-4,-1],[-6,2],[-6,6],[-1,-3],[-6,-2],[0,-1],[9,-2],[-1,-5],[0,-18],[-1,-6],[-2,-6],[-4,-5],[-6,9],[-6,2],[-3,-3],[-5,6],[1,9],[-1,2],[-4,-6],[-2,-8],[-3,3],[-9,12],[-3,5],[-6,14],[-3,3],[1,4],[5,6],[5,3],[5,2],[2,3],[3,7],[6,7],[-2,1],[-7,-6],[-6,-9],[-9,-4],[-6,-1],[-8,1],[-2,1],[1,4],[-2,2],[-4,0],[-4,5],[-6,2],[-8,12],[-2,6],[-6,4],[1,-5],[-6,-1],[-3,3],[-1,-3],[4,-5],[0,-7],[-4,-1],[-6,6],[-9,5],[2,-7],[3,-6],[14,-13],[-2,-5],[-4,-2],[-4,0],[-8,3],[-4,3],[-5,6],[-8,7],[-2,0],[-2,-3],[3,-1],[7,-6],[1,-2],[-2,-3],[0,-3],[4,-6],[7,-3],[-2,-9],[-1,-2],[2,-1],[7,4],[2,0],[5,-3],[3,-6],[5,-2],[-1,-2],[-5,-3],[4,-3],[5,-8],[0,-4],[5,-2],[1,-3],[3,-2],[4,0],[9,-7],[0,-2],[-3,-3],[3,-3],[2,1],[1,3],[5,6],[4,-2],[7,-9],[3,1],[4,-5],[-2,-3],[-5,-3],[0,-1],[10,0],[2,-1],[1,-3],[-4,-8],[-4,1],[-7,0],[7,-5],[5,-8],[0,-4],[4,-1],[3,1],[7,0],[-1,-4],[-3,-2],[1,-1],[4,1],[1,-1],[5,-11],[-4,-2],[0,-6],[2,-6],[0,-6],[-1,-6],[-2,-1],[-3,1],[-5,17],[-3,5],[-4,3],[3,-15],[0,-8],[-1,-3],[5,-7],[4,-10],[2,-1],[-2,-3],[-4,0],[-7,4],[-1,-1],[3,-13],[-1,-5],[-2,2],[-6,8],[-10,8],[-3,-1],[-2,3],[-8,8],[0,-6],[-6,2],[-5,11],[-1,-8],[-2,-1],[-3,8],[-3,1],[-2,5],[-5,0],[-9,10],[-6,9],[-3,0],[3,-13],[-1,0],[-13,13],[-7,5],[-4,1],[-7,0],[-1,-3],[3,-6],[4,-4],[8,-10],[6,-10],[14,-6],[-2,-3],[10,-6],[11,-12],[1,-2],[6,-2],[2,-2],[5,-8],[5,-9],[7,-4],[1,-4],[-4,-4],[2,-7],[0,-4],[-5,-2],[-5,1],[-10,7],[-11,4],[-4,1],[-3,3],[-31,6],[-5,4],[-10,5],[-8,9],[-6,12],[-6,1],[-7,-2],[-5,0],[-9,6],[-7,3],[-5,4],[-3,1],[3,7],[-7,-5],[-7,5],[-10,13],[-4,4],[1,1],[8,0],[2,1],[6,6],[-4,2],[-2,4],[-3,3],[-3,1],[-11,-1],[-2,3],[3,6],[-1,1],[-6,-4],[-2,0],[-5,12],[-1,0],[-5,5],[-7,10],[-6,5],[-2,3],[5,8],[-10,2],[-3,-2],[-5,1],[-1,-7],[-2,-2],[-2,1],[-1,10],[-2,1],[-6,0],[-3,2],[-3,9],[-2,0],[-6,-3],[3,-3],[5,-9],[-2,-4],[-5,-2],[-5,0],[-7,2],[-5,3],[-6,-1],[-1,-8],[-8,0],[-10,-5],[-4,0],[-5,-3],[-4,-1],[-8,3],[-7,1],[-6,4],[-4,-1],[-8,8],[-4,10],[0,5],[2,3],[1,8],[1,2],[5,5],[12,5],[2,3],[-2,7],[0,3],[3,4],[2,1],[8,-3],[5,0],[20,-7],[7,-4],[5,-5],[4,-7],[-2,-4],[0,-4],[3,-2],[1,1],[0,5],[2,1],[-1,6],[-3,4],[-8,7],[2,3],[11,-2],[4,1],[5,5],[4,1],[5,-2],[3,0],[5,2],[4,5],[7,2],[3,0],[6,-2],[3,0],[0,3],[-2,7],[-3,6],[-8,7],[-10,12],[-1,3],[1,4],[12,8],[10,9],[9,10],[7,3],[1,6],[5,11],[9,4],[3,2],[4,7],[0,2],[-4,3],[-6,18],[-4,9],[-5,8],[-4,9],[-8,9],[1,6],[-8,-4],[-6,4],[-2,6],[3,6],[0,3],[-2,4],[-6,1],[-2,-1],[5,-7],[-1,-1],[-8,-1],[-4,2],[-8,11],[1,2],[-7,1],[5,4],[0,2],[-5,1],[0,3],[6,3],[-4,1],[-3,-2],[-4,-5],[-3,-2],[-4,3],[-5,0],[-2,-4],[-7,-3],[-10,-6],[-5,-2],[-5,0],[-1,2],[1,5],[0,9],[2,3],[4,2],[8,-2],[3,0],[6,5],[3,6],[-4,6],[-7,4],[-10,3],[-3,4],[0,5],[8,3],[0,1],[-8,1],[-7,-6],[-4,2],[-3,0],[-3,3],[3,1],[4,4],[-4,5],[-6,1],[-10,-1],[-2,7],[0,5],[-3,11],[-14,-1],[-10,8],[-4,5],[-2,1],[-4,7],[-2,1],[-8,-7],[-1,-5],[1,-1],[9,-3],[5,-5],[2,-8],[0,-3],[-3,-4],[-6,-3],[-6,-2],[-8,0],[-16,6],[-2,0],[-12,3],[-4,0],[-8,2],[-12,2],[-3,-1],[4,-3],[5,-1],[4,-3],[7,-7],[3,-5],[-3,-2],[-17,12],[-16,-6],[-10,1],[-18,9],[-11,-3],[-9,0],[-19,2],[-6,2],[-4,3],[-4,0],[-11,2],[-10,-5],[-11,4],[-5,4],[-4,10],[1,4],[-9,-1],[-9,1],[-1,-2],[3,-3],[-5,-1],[-11,1],[-6,-5],[-15,12],[-8,1],[-5,3],[-10,14],[-4,14],[0,4],[9,-2],[14,0],[6,-3],[8,-2],[14,0],[10,2],[1,1],[-7,3],[-14,9],[-5,1],[-15,1],[-13,2],[-10,4],[-10,6],[-3,8],[-1,9],[-2,11],[2,6],[8,6],[-5,3],[-1,3],[0,9],[1,3],[14,22],[0,6],[3,9],[7,9],[6,3],[1,5],[22,16],[12,5],[20,4],[10,1],[13,0],[23,-2],[4,-3],[0,-4],[-7,-5],[-13,-8],[-9,-9],[-13,-20],[-4,-5],[-1,-9],[2,-4],[6,-7],[1,-4],[0,-20],[3,-12],[5,-8],[14,-12],[13,-9],[1,-3],[-3,-3],[-7,-4],[-10,-2],[-5,-2],[-7,-4],[-8,-3],[-3,-2]],[[2221,9442],[24,-12],[18,4],[10,1],[9,4],[7,0],[10,-2],[6,-8],[0,-3],[-3,-3],[-15,-6],[2,-2],[6,1],[3,-4],[-1,-2],[-6,-2],[-8,-4],[-18,-15],[0,-4],[2,-1],[5,4],[7,2],[8,0],[5,-2],[5,-5],[-3,-3],[4,-1],[5,-5],[-3,-7],[3,0],[5,3],[10,1],[2,-9],[0,-4],[-2,-5],[-3,-3],[-5,-2],[6,-4],[0,-4],[-5,-7],[4,-4],[1,-8],[-12,-4],[-5,-5],[-7,-3],[-3,0],[-17,2],[-3,3],[-1,5],[-4,-2],[1,-3],[6,-9],[1,-7],[-6,-5],[-7,-3],[-4,1],[-5,3],[-7,1],[-5,10],[-5,5],[-4,6],[-11,9],[-6,6],[-7,8],[-6,3],[-5,0],[-6,7],[-8,-3],[-8,4],[-1,4],[-3,1],[-1,3],[-12,7],[-9,9],[2,9],[3,4],[6,5],[8,0],[6,-3],[2,-4],[4,-2],[5,-5],[2,-5],[7,-2],[6,1],[11,3],[3,12],[4,-5],[3,1],[1,3],[-5,9],[-5,0],[-3,2],[3,6],[6,0],[5,-3],[1,2],[-7,6],[-3,1],[-3,-3],[-7,-2],[-4,0],[-16,9],[-2,4],[6,4],[9,2],[4,-2],[5,-5],[4,1],[-2,4],[-5,2],[-5,5],[-1,4],[2,2],[12,3],[8,-3],[6,0],[2,3],[-7,0],[-2,2],[6,3]],[[2270,9438],[-12,-1],[-4,-2],[-4,0],[-9,3],[-3,2],[9,3],[7,4],[7,1],[14,4],[10,0],[2,-2],[-3,-4],[-11,-7],[-3,-1]],[[2411,9455],[11,-3],[8,-3],[5,-4],[3,-1],[16,3],[15,-1],[13,-3],[7,-5],[0,-3],[-5,-7],[-6,-7],[-6,-4],[-2,-5],[-5,-7],[-9,-3],[4,-3],[-1,-3],[-9,-13],[-4,-4],[-9,-7],[-4,0],[-27,5],[-6,-1],[-18,-2],[13,-5],[6,-8],[0,-6],[-9,-10],[-5,-13],[-3,-2],[-10,3],[-14,-2],[-5,1],[1,9],[-1,9],[-2,9],[-8,16],[-2,10],[1,10],[0,12],[-2,13],[0,7],[3,3],[5,1],[10,-4],[3,2],[-4,5],[-3,6],[0,3],[3,4],[9,4],[7,1],[15,1],[4,-1],[11,4],[6,-1]],[[1673,9452],[8,5],[7,0],[2,-2],[3,-7],[8,9],[5,3],[16,1],[13,-2],[9,-4],[13,-8],[21,-16],[13,-7],[3,-5],[-2,-6],[-15,-6],[-13,-4],[-16,-9],[-12,-4],[-14,-8],[-27,-12],[-5,-5],[-10,-17],[-8,-4],[-8,0],[-3,-1],[0,-5],[-4,-9],[-3,-20],[-2,-4],[-3,-3],[-9,-4],[-15,-3],[-4,4],[-4,-1],[-11,-10],[-11,-4],[-8,-6],[-7,0],[-8,7],[-8,16],[-8,9],[-1,2],[-21,9],[-15,8],[-15,-1],[2,6],[0,4],[4,3],[-1,3],[4,4],[3,7],[3,1],[3,4],[6,5],[-2,3],[1,9],[2,3],[10,4],[0,4],[-5,1],[-2,2],[1,4],[4,5],[6,12],[9,6],[2,7],[7,7],[-3,4],[-6,1],[-4,6],[-9,17],[-4,4],[1,2],[34,5],[23,1],[24,5],[7,0],[11,-3],[7,-4],[9,-4],[17,-6],[10,-1],[-5,-7]],[[2295,9476],[-8,-4],[-3,3],[9,7],[4,-3],[-2,-3]],[[2352,9475],[-1,-1],[-12,3],[-2,2],[5,3],[4,0],[7,-5],[-1,-2]],[[2107,9505],[-5,0],[-9,2],[-6,3],[-1,2],[5,10],[6,5],[11,1],[7,-3],[2,-7],[3,-3],[0,-4],[-4,-3],[-9,-3]],[[2401,9505],[2,-5],[0,-5],[-2,-10],[-1,-1],[-27,-2],[-7,2],[-14,7],[-4,1],[-12,1],[-6,6],[-5,0],[-3,4],[-6,0],[0,4],[6,8],[6,2],[1,7],[5,5],[8,5],[17,5],[11,0],[11,-4],[10,-7],[6,-9],[3,-3],[2,-5],[-1,-6]],[[2330,9533],[-2,-2],[-8,1],[-7,-7],[-6,0],[-3,5],[1,3],[16,5],[1,3],[7,-2],[5,-4],[-4,-2]],[[1636,9546],[-4,0],[0,2],[6,5],[2,-3],[-4,-4]],[[2374,9546],[-3,0],[-5,3],[-3,7],[10,5],[2,-2],[5,-10],[-1,-2],[-5,-1]],[[1712,9537],[-8,-4],[-5,0],[-8,3],[-6,1],[-2,2],[4,4],[17,12],[14,5],[10,7],[7,0],[-3,-8],[-7,-9],[-10,-12],[-3,-1]],[[2803,9557],[0,-4],[-8,-2],[-5,0],[-5,3],[4,4],[16,11],[4,-2],[-3,-5],[-3,-2],[0,-3]],[[2160,9562],[5,-5],[-8,-2],[-7,-7],[-10,-1],[-11,0],[2,4],[6,5],[-4,2],[-16,-3],[-6,2],[5,6],[-12,0],[-5,4],[2,4],[9,3],[12,2],[13,3],[15,-2],[2,-11],[2,0],[6,-4]],[[2110,9594],[8,1],[4,-3],[15,-5],[-4,-5],[-8,-2],[-25,0],[-6,12],[0,4],[11,3],[7,-1],[-2,-4]],[[2285,9588],[1,-3],[-2,-3],[1,-4],[4,-4],[1,-7],[-2,-3],[-1,-7],[1,-5],[-2,-3],[-6,-2],[1,-1],[12,-3],[1,-1],[-2,-12],[-5,2],[-7,-5],[1,-9],[4,-4],[1,-3],[-9,-1],[1,-3],[-4,-2],[-13,-1],[-16,0],[-7,2],[-6,-4],[-17,2],[-2,1],[-5,9],[1,2],[8,1],[-6,3],[-10,3],[1,4],[12,3],[8,6],[6,2],[0,2],[15,2],[1,1],[-20,-1],[-28,-3],[-8,-2],[-7,1],[-30,-5],[-5,1],[-2,4],[2,2],[9,4],[4,4],[-1,2],[4,4],[6,0],[9,-3],[5,-3],[5,0],[-5,4],[-2,4],[2,4],[-8,1],[-3,2],[-1,4],[9,6],[-1,1],[-10,0],[-6,3],[1,3],[9,7],[10,-2],[8,-4],[1,-5],[24,-15],[4,-3],[6,-2],[5,2],[-8,4],[-4,6],[3,1],[6,-1],[0,2],[-5,2],[-6,0],[-6,3],[12,4],[-5,2],[-14,3],[-6,3],[1,4],[13,5],[9,1],[11,0],[14,-10],[7,1],[-3,8],[8,5],[5,-2],[8,-5],[8,-3],[4,0],[3,-3]],[[2187,9594],[-7,0],[-3,2],[12,3],[8,5],[12,0],[5,-1],[-13,-5],[-14,-4]],[[1991,9564],[8,1],[6,-2],[2,-5],[-7,-6],[2,-3],[6,5],[4,1],[9,0],[5,-3],[2,-4],[8,2],[-4,3],[-1,5],[9,6],[4,0],[13,-3],[9,-4],[3,-11],[-1,-6],[-4,-8],[-5,-18],[-7,-6],[-13,-4],[-13,-5],[-12,1],[-10,3],[-11,-3],[-7,0],[-8,3],[3,2],[-5,2],[-18,-11],[-19,-2],[-10,-3],[-6,-6],[-5,-3],[-10,-3],[-12,-5],[-22,-4],[-14,-1],[-14,1],[-21,10],[-3,4],[2,3],[5,3],[22,6],[14,6],[5,1],[13,1],[6,-1],[8,1],[5,2],[12,8],[1,2],[-4,2],[-8,-4],[-9,-1],[-6,-2],[-7,0],[-6,4],[-5,0],[-4,-4],[-4,-2],[-11,0],[-10,-2],[-3,1],[-2,7],[3,7],[7,4],[-2,1],[-8,-2],[-5,1],[-3,-9],[-10,2],[5,-6],[-3,-5],[-11,-5],[-6,-1],[-6,7],[-4,1],[-3,-2],[-5,-7],[-12,5],[-9,7],[-15,-1],[-14,3],[-2,4],[2,5],[5,5],[12,2],[19,0],[4,1],[21,7],[6,4],[-1,1],[-25,-6],[-11,-1],[-16,1],[-4,1],[3,6],[7,3],[11,2],[16,2],[10,0],[-4,3],[-23,-1],[-6,3],[3,5],[-2,3],[4,4],[7,3],[13,-1],[23,-1],[-3,3],[-18,2],[-4,1],[1,6],[6,4],[22,4],[7,0],[9,-3],[2,-2],[2,-7],[4,-4],[3,-1],[18,3],[13,-4],[10,-7],[13,-8],[-6,-5],[1,-1],[14,0],[7,-13],[7,-3],[16,0],[38,-3],[4,2],[1,3],[-1,6],[-24,10],[-2,4],[12,5],[1,5],[-8,6],[-6,1],[-8,3],[-3,5],[1,3],[12,6],[9,10],[5,4],[7,3],[7,0],[8,-4],[1,-4],[-3,-3],[3,-11],[9,-6],[2,-6],[-8,-8],[3,-2]],[[2507,9590],[-9,-1],[-7,5],[-7,9],[1,3],[10,3],[6,0],[5,-3],[2,-4],[-3,-3],[-1,-4],[3,-5]],[[1845,9604],[-4,-2],[-29,2],[-3,3],[6,3],[6,1],[15,1],[8,-2],[3,-4],[-2,-2]],[[2380,9613],[10,1],[9,-3],[11,-6],[1,-5],[-4,-6],[-5,-5],[2,-1],[12,9],[8,-1],[11,0],[15,4],[13,0],[5,-1],[11,-5],[5,-4],[-2,-2],[-22,2],[2,-4],[14,0],[43,-8],[2,-2],[-5,-4],[-25,-2],[-15,1],[-12,3],[-4,-1],[4,-3],[7,-1],[6,-2],[2,-2],[13,-1],[6,-5],[4,0],[6,-7],[5,1],[8,-6],[-1,-4],[-3,-3],[-8,-4],[10,0],[10,-7],[3,3],[-1,7],[4,2],[4,-1],[10,-7],[13,3],[3,-1],[3,-4],[4,6],[3,2],[13,-8],[7,-1],[3,-2],[14,-2],[1,3],[-5,3],[3,2],[11,3],[6,-1],[10,4],[11,1],[19,9],[5,0],[14,-4],[25,5],[5,0],[14,-2],[14,-3],[-1,-4],[5,-2],[13,0],[11,-3],[1,-3],[-5,-3],[5,-1],[10,0],[5,-5],[2,-7],[-13,-8],[-12,-5],[7,-3],[13,2],[4,-1],[4,-5],[-3,-2],[-12,-2],[-8,3],[-3,-1],[4,-3],[-2,-14],[-27,-1],[-16,-5],[-7,0],[-10,3],[-9,0],[-7,3],[-4,7],[1,7],[-3,0],[-6,4],[-2,-3],[4,-2],[-1,-8],[-4,-5],[-9,-1],[-11,-3],[-12,1],[-7,2],[-8,-3],[-6,5],[-3,-4],[-7,-2],[-4,0],[-5,3],[-6,-2],[-9,3],[0,-4],[-9,-1],[-11,2],[-6,-2],[-11,1],[-12,0],[-4,3],[6,14],[-4,2],[-5,-1],[-3,-5],[-3,0],[-1,4],[-5,-3],[-3,0],[1,-6],[-7,-4],[-11,-1],[-15,4],[-5,0],[-7,5],[-9,2],[0,-5],[-6,1],[-6,-1],[-3,3],[-6,2],[-6,12],[-2,7],[3,3],[-4,4],[-4,2],[-2,4],[0,7],[9,11],[1,3],[-3,11],[-15,15],[-11,14],[-2,1],[-11,-3],[-2,-2],[-6,-1],[-24,2],[-8,-2],[-7,0],[-5,6],[-14,4],[-3,3],[5,4],[-21,8],[-7,2],[0,4],[6,-2],[6,0],[1,2],[-7,3],[-4,3],[2,4],[25,5],[6,0],[28,-6],[9,-3]],[[1790,9639],[1,-4],[-20,-6],[-3,-3],[1,-2],[12,-7],[-1,-4],[-8,1],[-1,-3],[8,-8],[-1,-3],[-7,-4],[-7,-2],[-15,-3],[0,-7],[-3,-5],[-6,-3],[-4,0],[-7,3],[-7,5],[-1,5],[3,9],[4,8],[-3,1],[-9,-2],[-5,-4],[-2,-9],[-8,-1],[-2,-4],[5,-2],[0,-5],[-6,-4],[-3,-6],[-6,-2],[-8,9],[-5,0],[0,-7],[-3,-2],[6,-4],[0,-4],[-2,0],[-4,-4],[-5,-3],[-12,-2],[-3,2],[-1,5],[-4,5],[-3,7],[-4,0],[-3,-8],[-9,-3],[-10,3],[-6,1],[-4,-1],[-7,-4],[-6,0],[-3,3],[2,4],[-1,5],[-9,-1],[11,12],[4,3],[21,2],[2,1],[12,12],[3,2],[15,5],[3,6],[4,2],[11,9],[20,13],[8,2],[22,2],[21,-4],[3,3],[10,-1],[3,2],[-10,3],[0,2],[6,4],[13,1],[23,-11]],[[2504,9634],[-7,-4],[-25,7],[-5,4],[-1,9],[2,4],[8,2],[12,-1],[6,-2],[10,-6],[3,-3],[1,-6],[-4,-4]],[[2095,9627],[-4,-1],[-14,3],[-5,4],[-9,12],[-1,4],[-9,11],[6,2],[7,-1],[4,-2],[11,-9],[3,-8],[5,0],[6,-4],[3,-5],[-1,-5],[-2,-1]],[[2347,9664],[7,-2],[7,1],[27,-1],[12,1],[8,-2],[4,-5],[-5,-1],[-6,-10],[-8,-1],[-16,2],[-44,0],[-8,7],[2,6],[2,1],[18,4]],[[2174,9658],[-10,0],[-9,2],[-2,3],[0,6],[6,1],[17,0],[9,-2],[9,-7],[-17,-1],[-3,-2]],[[1837,9662],[-7,-2],[-5,0],[-9,3],[-11,8],[-1,3],[19,6],[2,-4],[3,0],[7,-5],[5,-1],[3,-5],[-6,-3]],[[1931,9682],[22,-1],[0,-5],[-3,-2],[-12,-4],[-15,-2],[-3,-2],[4,-3],[12,1],[4,-2],[1,-8],[-3,-5],[-13,-5],[-6,-1],[-9,0],[-20,-5],[-12,1],[-8,5],[-8,2],[-6,3],[-1,4],[2,1],[-4,9],[0,5],[2,3],[5,0],[6,2],[14,3],[30,5],[9,0],[12,1]],[[2138,9684],[-7,0],[0,3],[4,3],[6,2],[3,-3],[-6,-5]],[[1949,9713],[5,-3],[4,0],[4,-8],[-1,-7],[-9,-2],[-9,2],[-7,-2],[-13,1],[-13,4],[-2,-3],[-6,-3],[-7,0],[-10,5],[-12,-1],[-17,-4],[-4,3],[4,4],[8,4],[18,5],[14,1],[6,2],[12,6],[13,3],[5,0],[17,-7]],[[2327,9707],[6,-2],[12,1],[15,-5],[4,-5],[-11,-5],[-2,-2],[10,-5],[1,-4],[-7,-6],[-7,0],[-16,-5],[-13,0],[-3,-2],[-11,-2],[-2,3],[1,3],[-11,4],[-6,6],[12,1],[7,2],[-10,4],[-14,1],[-6,6],[-1,3],[-7,5],[0,3],[7,2],[-6,8],[-1,5],[3,1],[17,0],[12,-2],[7,-3],[9,-1],[9,-6],[2,-3]],[[2126,9752],[7,-1],[8,-4],[7,-8],[-2,-7],[3,-4],[3,0],[3,6],[14,5],[5,-1],[11,-5],[5,-1],[3,-3],[-3,-7],[6,-1],[13,2],[12,-5],[12,-10],[-7,-7],[2,-2],[0,-6],[6,-1],[12,-9],[3,-7],[-3,-7],[-6,-2],[-9,-1],[-8,-2],[-9,2],[-9,4],[-5,5],[-1,6],[-4,2],[-3,4],[-7,0],[-14,4],[-13,1],[-9,-2],[-5,5],[2,2],[-27,-3],[-7,-3],[-11,0],[-12,5],[-6,7],[2,5],[5,1],[14,-2],[13,-1],[5,1],[3,3],[-3,2],[-12,1],[13,3],[5,2],[-4,2],[-14,0],[-5,1],[1,2],[8,5],[-7,5],[-8,-2],[-11,-9],[-5,2],[7,9],[0,2],[-5,2],[-11,-2],[-6,0],[-1,2],[1,11],[4,4],[15,-1],[24,3],[8,0],[7,-2]],[[2255,9790],[1,-7],[-2,-7],[-3,-1],[-8,2],[-3,5],[-5,3],[-13,-1],[-3,2],[-1,7],[2,4],[7,2],[10,-1],[12,0],[3,-2],[3,-6]],[[2447,9856],[17,-16],[18,-11],[-1,-4],[12,-2],[10,-3],[5,2],[10,0],[5,-4],[-2,-3],[2,-3],[-2,-4],[5,-5],[14,-4],[6,0],[2,2],[-10,5],[-2,5],[7,5],[8,0],[13,-3],[1,-11],[-7,-3],[1,-3],[18,-2],[6,-9],[-4,-13],[-5,-5],[2,-1],[10,2],[6,3],[12,-2],[8,-7],[5,6],[3,1],[4,-5],[9,-8],[4,-6],[-4,-3],[-35,-11],[-8,-4],[-5,1],[-3,-5],[-13,-11],[-4,-2],[-8,4],[-1,10],[4,7],[-2,0],[-8,-6],[0,-14],[-2,-2],[6,-2],[2,-4],[-2,-4],[-3,-1],[-12,8],[-5,-1],[4,-11],[-5,-12],[-9,1],[-15,13],[-10,10],[-2,-3],[16,-20],[-2,-2],[-11,5],[-1,2],[-8,2],[-10,-1],[8,-5],[0,-4],[-15,0],[-14,2],[-13,3],[-13,4],[-9,4],[-5,4],[4,2],[11,2],[12,1],[-1,1],[-22,3],[-15,0],[-4,2],[-7,6],[2,2],[10,-1],[-3,3],[-16,3],[-6,3],[-2,3],[7,4],[18,6],[17,2],[4,6],[33,4],[1,1],[-26,0],[-11,5],[-11,-2],[-14,-4],[-11,-4],[-5,2],[5,4],[-10,1],[-15,-4],[-7,-3],[-6,4],[-10,2],[-2,2],[2,6],[10,2],[22,6],[3,4],[-25,-5],[-15,1],[-17,10],[-4,4],[-1,7],[-4,6],[28,-4],[10,-1],[22,0],[1,5],[8,3],[-8,1],[-17,-4],[-6,0],[-7,5],[-10,0],[-10,4],[1,3],[6,2],[16,-1],[-17,11],[1,8],[6,2],[6,0],[5,-2],[8,0],[6,-3],[3,-4],[12,-1],[15,0],[-3,2],[-15,3],[-6,6],[-11,4],[-9,1],[0,2],[7,8],[8,3],[13,-1],[8,1],[11,3],[13,-1],[3,4],[-4,3],[-14,0],[-9,3],[0,4],[4,1],[13,0],[8,1],[8,-1],[23,-6],[9,-7]],[[3069,9965],[30,-1],[13,-3],[37,0],[5,-2],[-11,-6],[-43,-8],[18,-1],[9,1],[11,3],[11,1],[24,6],[10,-2],[7,5],[10,-1],[7,-6],[11,3],[13,-1],[5,-2],[-5,-4],[16,-8],[-5,-7],[22,4],[21,-1],[9,-3],[5,-6],[-2,-4],[-9,-5],[-10,-4],[-6,-4],[-9,-2],[-30,-10],[-28,-6],[-18,1],[-7,-5],[-14,-2],[-18,-1],[-6,-7],[-2,0],[-49,-11],[4,-3],[78,14],[14,1],[13,-1],[-2,-3],[-18,-9],[-23,-8],[-11,-6],[-29,-10],[-24,-11],[-9,-5],[-17,-12],[-5,-1],[-11,2],[-4,-9],[-23,-3],[-15,-3],[-8,0],[-4,-2],[13,-2],[20,3],[9,-1],[-5,-6],[-15,-5],[5,-4],[-8,-5],[-23,-4],[-6,1],[-28,7],[-10,1],[-9,2],[-7,0],[-8,-2],[17,-4],[12,0],[6,-2],[5,-5],[0,-6],[-7,-3],[-15,0],[-5,-2],[-17,0],[-19,-3],[-8,1],[-8,3],[-8,1],[-9,-1],[11,-4],[5,-5],[5,0],[9,-5],[7,0],[7,-2],[10,2],[7,0],[-1,-10],[-3,-1],[-17,0],[-7,1],[-4,2],[-7,1],[-7,-1],[-6,1],[-29,-3],[-16,1],[-17,0],[16,-7],[4,-1],[29,5],[9,0],[12,-2],[8,-6],[11,0],[8,-2],[19,-7],[-4,-6],[-9,-5],[-14,-1],[-27,0],[24,-7],[9,-4],[-10,-6],[-9,-12],[-6,-2],[-8,0],[-10,-3],[-20,1],[-16,0],[-2,-6],[1,-13],[-1,-6],[-5,-6],[-12,-4],[-12,-1],[-21,-1],[-11,0],[-16,3],[-18,9],[-4,-1],[4,-4],[7,-4],[-7,-3],[-15,-1],[8,-5],[18,4],[9,-1],[14,-6],[10,3],[12,0],[4,-3],[2,-4],[-1,-6],[9,-5],[6,0],[11,5],[3,0],[8,-7],[0,-6],[-4,-6],[-4,-4],[-18,-7],[-10,-6],[-19,-6],[-6,0],[-14,-4],[-8,0],[0,5],[4,6],[-4,6],[-6,2],[-15,-1],[-3,2],[-5,6],[-6,1],[-3,-1],[4,-7],[-1,-2],[-32,-2],[-14,1],[-3,2],[-8,-8],[-24,-3],[-15,3],[-12,5],[-5,3],[-3,5],[-4,-3],[-4,-9],[-8,3],[-10,2],[-4,-4],[-17,2],[-8,-1],[-12,3],[-15,1],[-6,1],[2,19],[20,10],[6,5],[12,3],[22,0],[8,2],[6,0],[-9,10],[-7,0],[-5,3],[-5,6],[-9,13],[2,4],[15,5],[13,1],[18,-5],[6,-4],[12,-13],[4,-3],[17,-5],[6,-1],[22,2],[7,1],[6,6],[7,4],[15,15],[2,5],[-2,2],[-20,-20],[-10,-5],[-11,-1],[-9,3],[-10,-4],[-6,1],[-6,3],[0,11],[-7,10],[26,15],[6,1],[-4,2],[-10,0],[-4,4],[-6,-7],[-9,-5],[-18,-1],[5,6],[-1,5],[-10,-5],[-13,-4],[-12,1],[-6,2],[2,6],[0,8],[15,14],[4,7],[31,4],[19,4],[6,-2],[24,-3],[18,-4],[8,5],[15,-1],[8,2],[11,5],[-3,1],[-10,-3],[-11,-1],[-12,2],[-20,0],[-10,1],[-8,2],[-4,5],[9,3],[12,-4],[7,0],[-18,10],[-17,15],[-7,7],[-5,3],[-22,3],[-3,1],[-7,6],[-2,10],[-4,6],[4,8],[5,4],[32,-3],[13,0],[17,-1],[10,-2],[10,-4],[10,-6],[9,-3],[8,-5],[14,-11],[11,-4],[12,-2],[16,-1],[10,4],[-5,1],[-12,-1],[-8,1],[-10,6],[-14,10],[-13,6],[-17,12],[-1,3],[13,3],[43,4],[26,5],[11,6],[35,8],[42,5],[-7,2],[-25,0],[-15,1],[-4,2],[2,5],[10,7],[20,9],[-12,1],[-10,-4],[-11,-7],[-13,-1],[-3,-2],[-8,-12],[-15,-7],[-32,-8],[-7,0],[-23,-4],[-14,1],[3,3],[12,6],[3,3],[-32,-4],[-7,-2],[-12,-7],[-4,-1],[-30,-1],[-12,4],[-15,-1],[-10,3],[10,10],[28,11],[16,3],[37,4],[2,2],[-70,-6],[-12,-5],[-24,-13],[-7,-3],[-10,-1],[-8,1],[-18,6],[-12,3],[-5,5],[2,1],[21,4],[29,-1],[13,1],[12,2],[19,5],[20,7],[4,2],[-8,1],[-18,-3],[-21,-7],[-18,-3],[-45,-1],[-14,-2],[-6,1],[-10,5],[1,3],[10,3],[9,1],[-11,3],[-1,2],[22,8],[8,2],[13,1],[14,-1],[1,1],[-14,2],[-24,-1],[-37,-8],[-9,2],[2,2],[20,8],[0,1],[-14,0],[-8,2],[-13,-4],[-9,-1],[-8,3],[1,3],[12,6],[21,5],[9,1],[14,0],[14,4],[16,6],[14,2],[12,-1],[17,-7],[5,4],[6,1],[13,-1],[14,-4],[17,1],[-4,3],[-39,9],[-1,2],[23,4],[14,7],[15,2],[11,-4],[15,-1],[6,-2],[12,-8],[11,-5],[3,3],[-2,3],[6,3],[26,-8],[40,-8],[0,3],[-37,9],[-14,5],[-13,7],[0,2],[12,4],[9,1],[-12,5],[0,2],[9,1],[26,-5],[2,1],[-11,9],[5,2],[10,0],[16,-4],[29,-2],[7,1],[-29,7],[-9,6],[7,1],[20,0],[18,-2],[15,1],[10,-1],[11,-3],[22,-10],[8,-7],[4,-1],[12,4],[-23,12],[-14,6],[-6,5],[38,3],[37,-2],[10,-4],[10,-6],[12,-4],[14,-1],[-19,8],[3,6],[15,5],[23,1],[15,-5],[16,5],[25,1],[13,-6]],[[5264,7906],[-2,-6],[0,-4],[1,-2],[2,0]],[[5289,7883],[-1,-8],[0,-4],[1,-3],[0,-3],[-2,-1],[-3,1],[-2,4],[-3,-2],[-1,-3],[0,-5],[2,-5],[0,-7],[-2,0],[-3,7],[-4,-1],[-4,-3],[-3,0],[-2,3],[-1,5],[0,3],[-4,0],[-1,-1],[0,-11],[-1,-4],[-4,-6],[-2,-5],[1,-5],[0,-5],[-2,-1],[-2,2],[0,3],[-3,5],[1,4],[-5,2],[-6,10],[1,7],[-1,3],[-4,-3],[-1,-4],[-4,-4],[1,-6],[-4,-8],[-6,-6],[-7,4],[-5,-4],[-6,-2],[-2,1],[-1,2]],[[5194,7829],[0,1],[-3,6],[-2,2],[-2,4],[1,7],[-1,2],[0,6],[-5,1],[-4,0],[-6,-6],[1,-5],[-2,-3],[-3,-3],[-3,1],[0,3],[2,2],[2,5],[0,3],[-2,2],[1,2],[2,9],[4,4],[3,4],[1,5],[0,6],[6,5],[4,8],[5,8],[0,3],[-2,0],[0,2],[2,4],[2,2],[2,0],[2,-4],[4,0],[2,2],[2,5],[4,3]],[[5211,7925],[2,-2],[6,0],[8,2],[3,0],[3,-1],[1,2],[3,0],[0,2],[-3,0],[-2,2],[1,3],[2,2],[3,0],[3,-4],[3,0],[2,-3],[8,1],[10,-8]],[[3122,1964],[-7,2],[0,2],[8,0],[1,-1],[-2,-3]],[[3130,1971],[-1,-1],[-2,2],[-5,3],[4,3],[2,3],[1,-5],[2,-3],[-1,-2]],[[3153,2002],[-2,-2],[-3,1],[0,2],[3,3],[3,-2],[-1,-2]],[[3136,2007],[-1,-3],[-4,-5],[-4,1],[-1,4],[-3,1],[-4,-4],[-2,-1],[-9,3],[-3,8],[-3,5],[5,3],[7,0],[12,-2],[5,0],[4,-5],[1,-5]],[[3063,2020],[22,-6],[7,4],[6,0],[1,-5],[-5,-5],[0,-3],[6,-1],[2,-3],[-1,-5],[7,-8],[1,-2],[0,-8],[-3,1],[-2,2],[-3,5],[-4,1],[-3,2],[-6,1],[-2,-1],[-2,6],[2,5],[-1,2],[-4,-1],[-3,4],[-4,1],[-1,-6],[1,-6],[4,-6],[-2,0],[-5,2],[-3,4],[-4,4],[0,5],[-4,-1],[-2,3],[-3,2],[2,5],[1,10],[5,-2]],[[3027,2023],[1,-4],[4,-2],[11,4],[4,-9],[-3,-6],[-2,-1],[-2,1],[0,2],[-2,3],[-4,-2],[-2,2],[-4,2],[0,2],[-7,7],[-2,0],[-3,-3],[-1,3],[1,3],[11,-2]],[[3016,2071],[6,-5],[4,1],[1,-8],[-4,-8],[-9,9],[-3,-1],[-5,1],[-2,-3],[-3,-1],[-1,5],[-3,5],[-4,4],[2,7],[4,3],[8,-3],[5,-1],[4,-5]],[[2974,2103],[0,-5],[6,0],[6,-1],[3,-6],[2,-2],[2,-5],[-2,-3],[-2,-5],[0,-2],[-5,-5],[-10,-3],[-1,3],[2,2],[2,5],[1,5],[-3,1],[-3,-1],[-2,2],[-1,-3],[0,-7],[-1,-1],[-5,4],[0,13],[-5,-1],[-3,5],[-1,5],[-6,1],[4,7],[7,1],[2,-4],[8,-2],[-1,5],[2,2],[4,-5]],[[2933,2135],[9,-2],[5,-3],[3,-3],[3,0],[3,-4],[3,-1],[4,-6],[4,-5],[-2,-1],[-5,2],[-5,1],[0,3],[-6,8],[-5,2],[-4,-1],[-4,1],[-4,5],[-4,4],[-4,9],[1,2],[3,-2],[2,-4],[2,-1],[1,-4]],[[3092,2024],[-4,0],[-1,-2],[-7,-1],[-11,3],[-3,2],[-4,6],[-1,-2],[-7,-4],[-3,0],[-3,2],[-1,2],[-6,-4],[-7,4],[-5,2],[-8,1],[-6,4],[-11,0],[-2,1],[-1,5],[4,5],[6,-4],[2,3],[4,3],[6,-3],[2,0],[3,2],[2,5],[5,-1],[1,-4],[-1,-4],[4,-1],[4,0],[3,-1],[0,2],[-4,6],[-2,5],[-6,3],[-3,8],[0,13],[6,3],[-2,6],[3,4],[2,1],[2,-15],[2,-5],[-2,-1],[-5,0],[3,-8],[4,-2],[4,-6],[0,-4],[2,-2],[5,0],[3,1],[2,3],[2,0],[3,-3],[6,-2],[3,-8],[1,-1],[4,6],[2,1],[0,2],[-4,3],[-22,14],[-3,5],[-1,7],[0,8],[1,2],[4,3],[7,4],[10,7],[0,4],[-1,2],[-4,2],[-6,0],[-4,-1],[-6,-4],[-6,3],[-3,4],[-1,6],[0,7],[4,5],[2,-1],[2,2],[1,3],[-5,6],[-2,4],[1,1],[4,0],[6,-5],[2,0],[4,5],[6,11],[2,3],[2,0],[7,-10],[2,-1],[8,6],[1,0],[4,-4]],[[2940,2192],[-6,2],[-2,3],[0,3],[-2,4],[4,-1],[2,-4],[4,-3],[0,-4]],[[2921,2209],[1,-11],[4,-2],[3,-7],[-4,-10],[-1,-7],[-4,1],[-2,6],[-3,7],[-2,14],[3,4],[2,-1],[0,5],[3,1]],[[2928,2230],[0,-5],[-1,-2],[-4,2],[-1,-3],[-4,-1],[-3,2],[-4,-10],[-3,-3],[0,4],[2,10],[2,6],[3,-3],[4,3],[4,4],[4,0],[1,-4]],[[2907,2264],[0,-5],[-3,0],[-1,7],[1,3],[0,7],[3,-1],[5,0],[1,-1],[-3,-4],[-2,-1],[-1,-5]],[[2914,2286],[-5,-4],[-2,2],[-4,0],[2,10],[1,3],[1,6],[3,-2],[6,-3],[3,-1],[1,-5],[-3,-2],[-3,-4]],[[2913,2370],[0,-4],[-4,-9],[-7,-9],[-2,0],[-2,2],[4,6],[0,4],[-1,2],[-3,2],[1,4],[2,2],[7,2],[1,2],[4,0],[0,-4]],[[2930,2352],[1,-8],[-1,-8],[-1,-13],[2,-1],[0,-6],[-1,-5],[-2,-7],[-4,-2],[-2,1],[-1,4],[0,7],[-2,5],[0,2],[2,5],[0,5],[-4,-1],[-1,-2],[0,-10],[-1,-5],[-1,-1],[-6,0],[-5,5],[-2,-2],[-1,6],[1,4],[6,0],[0,8],[-3,4],[-1,3],[1,2],[4,4],[2,-2],[3,1],[0,5],[-3,2],[1,4],[4,4],[2,3],[0,4],[-1,4],[3,5],[4,2],[3,-3],[2,0],[1,-3],[1,-20]],[[2902,2375],[-3,0],[-1,10],[4,20],[-2,9],[5,3],[3,-11],[4,-12],[-1,-11],[-1,-3],[-6,-3],[-2,-2]],[[2928,2384],[-1,-1],[-3,1],[-6,-2],[-2,6],[-2,8],[0,2],[-2,4],[-3,13],[1,5],[7,3],[2,5],[2,-1],[-1,-10],[1,-3],[3,-4],[0,-3],[1,-6],[2,-2],[0,-3],[-1,-2],[2,-10]],[[2913,2428],[-2,-1],[-2,5],[1,2],[3,2],[3,0],[2,-1],[0,-2],[-4,-3],[-1,-2]],[[2935,2552],[-2,-3],[-2,-1],[-3,2],[-3,-1],[-1,4],[4,8],[2,6],[0,8],[2,5],[3,1],[1,-6],[-1,-10],[2,-7],[0,-4],[-2,-2]],[[2915,2598],[-2,-1],[-1,2],[0,3],[2,1],[1,-1],[0,-4]],[[2954,2602],[-2,-1],[-1,2],[0,3],[-2,4],[0,4],[2,4],[3,-4],[0,-12]],[[2972,2604],[-7,-5],[-3,2],[-2,3],[0,3],[-1,5],[1,3],[3,3],[1,3],[0,8],[2,1],[5,-3],[5,-4],[2,-3],[0,-3],[-2,-5],[-4,-8]],[[2951,2626],[-1,-2],[-3,-1],[-3,-3],[0,-5],[2,-4],[2,-10],[1,-8],[2,-8],[0,-9],[-3,-1],[0,-3],[-5,-1],[-2,2],[0,7],[-3,3],[-2,5],[-2,9],[-2,2],[-2,7],[-4,6],[4,3],[0,7],[5,4],[3,-2],[2,1],[1,2],[0,11],[3,3],[2,0],[1,-3],[2,-3],[3,-2],[0,-3],[-1,-4]],[[2949,2659],[0,-3],[-3,0],[-1,-3],[-5,2],[0,4],[8,2],[1,-2]],[[2925,2672],[-4,-1],[-1,3],[3,2],[2,-4]],[[2950,2687],[-2,-2],[-4,1],[-4,0],[-3,2],[-3,3],[-1,2],[0,3],[3,6],[2,12],[1,16],[-1,6],[0,3],[1,3],[0,10],[3,6],[0,6],[1,6],[0,3],[-1,1],[1,2],[8,-5],[6,-1],[0,-5],[2,-10],[1,-2],[-1,-5],[-2,-2],[0,-4],[1,-5],[-4,-2],[-4,-5],[0,-2],[6,-8],[1,-5],[2,-5],[-3,-8],[-5,-5],[0,-7],[-1,-3]],[[2810,3245],[-5,-1],[1,3],[2,2],[3,-2],[-1,-2]],[[1964,3620],[-5,-2],[2,6],[4,-2],[-1,-2]],[[3098,2168],[-16,5],[-3,3],[-3,0],[-6,-3],[-3,-9],[-2,-3],[-4,-2],[-4,0],[-13,-9],[-5,-1],[-6,-5],[-2,-7],[1,-4],[-4,-15],[-1,-9],[0,-4],[1,-7],[-1,-12],[-2,-3],[-6,-3],[-4,2],[-7,2],[-5,5],[-7,3],[-2,2],[-5,9],[-1,7],[3,6],[6,0],[4,1],[2,-3],[1,-6],[-2,-6],[3,1],[1,14],[10,7],[6,11],[1,4],[-2,2],[-5,3],[-14,-14],[-6,-3],[-5,-4],[-5,-7],[0,-2],[-2,-5],[0,-5],[-5,2],[-8,8],[-1,3],[1,3],[3,4],[0,10],[2,7],[4,4],[2,-1],[0,-3],[5,0],[9,10],[4,0],[5,-2],[6,1],[2,3],[-4,3],[-5,1],[-11,1],[-3,-1],[-3,-5],[-2,4],[-4,2],[-3,-3],[0,-4],[-1,-4],[-4,-4],[-2,-6],[0,-8],[-3,-3],[-6,1],[-3,6],[-5,7],[11,7],[2,7],[2,3],[-1,3],[-2,0],[0,-4],[-1,-4],[-4,2],[-6,-5],[-3,1],[-6,-1],[-3,2],[0,4],[1,4],[-1,6],[-2,2],[-2,-1],[0,4],[-2,7],[-2,4],[1,1],[4,-3],[3,0],[5,-4],[4,2],[0,7],[1,0],[4,-5],[2,1],[5,-1],[4,2],[5,4],[4,6],[3,-2],[1,-7],[2,-2],[0,-6],[-4,-6],[1,-2],[2,1],[3,6],[0,5],[-3,8],[0,5],[3,3],[1,8],[-8,11],[-10,7],[0,-3],[9,-7],[4,-4],[2,-3],[0,-3],[-10,-4],[-12,-12],[-4,2],[-2,4],[-2,6],[-2,4],[-3,0],[-1,2],[-3,-1],[-6,6],[4,5],[4,-2],[1,17],[-2,3],[-5,5],[-2,-1],[-4,1],[-7,3],[-3,3],[-3,1],[-7,16],[-1,6],[7,0],[5,1],[1,3],[-2,5],[-2,3],[4,7],[7,-8],[1,-4],[4,-12],[1,-2],[9,-8],[1,0],[0,6],[2,8],[3,4],[-3,5],[-4,-14],[-3,-2],[-5,11],[-1,1],[0,7],[5,1],[-8,4],[-3,3],[-3,5],[-3,4],[6,8],[2,5],[9,-3],[2,2],[-2,3],[-1,-1],[-3,3],[-4,7],[0,3],[1,7],[1,2],[4,1],[4,-2],[2,-2],[1,1],[-1,5],[-3,2],[-3,3],[0,4],[2,7],[-1,3],[-2,-3],[-1,-4],[0,-5],[-1,-6],[-3,2],[-2,4],[1,3],[-1,17],[0,15],[1,11],[3,5],[2,1],[3,0],[1,1],[-4,3],[-5,-4],[-4,2],[0,6],[-2,5],[-1,6],[0,10],[6,-1],[4,-2],[11,0],[9,-9],[4,1],[0,2],[-3,2],[-2,5],[-2,2],[0,6],[-2,13],[-1,0],[-3,-12],[-3,-3],[-4,-2],[-4,-1],[-3,2],[-1,3],[0,3],[-1,2],[-4,2],[-3,4],[2,5],[2,2],[2,0],[4,-5],[2,-1],[3,5],[-2,1],[-8,8],[2,6],[6,7],[1,2],[-1,5],[1,7],[-1,5],[-3,5],[-4,2],[-1,-2],[1,-4],[-1,-1],[-6,1],[-3,4],[-5,3],[-2,7],[2,6],[-1,0],[-3,-5],[-5,-3],[-4,0],[-3,-4],[3,-1],[2,-7],[-1,-4],[-2,0],[-4,4],[-2,5],[0,4],[2,6],[6,7],[1,3],[4,3],[5,8],[4,5],[-2,3],[-2,6],[0,7],[8,3],[4,-1],[5,0],[2,2],[2,0],[4,2],[2,3],[0,7],[-1,6],[3,4],[3,1],[3,-2],[-2,-7],[-2,-16],[-1,-3],[-2,-3],[1,-6],[-2,-5],[-7,-4],[-1,-2],[5,0],[3,1],[4,4],[1,6],[1,12],[4,2],[1,-3],[0,-12],[-3,-18],[-4,-7],[0,-4],[3,0],[4,9],[1,7],[0,8],[1,10],[1,5],[0,7],[-5,4],[0,4],[1,9],[5,0],[5,5],[3,2],[2,0],[6,-6],[1,2],[-1,2],[-7,8],[-6,1],[2,15],[8,3],[10,11],[2,17],[-5,2],[-5,6],[-7,7],[1,6],[0,10],[5,2],[2,13],[-3,10],[0,8],[4,6],[2,10],[3,0],[0,8],[-2,6],[0,8],[2,9],[3,-1],[1,1],[-3,6],[-2,6],[1,2],[4,4],[2,-4],[3,-10],[1,3],[-2,10],[-1,13],[-3,-1],[-3,0],[-3,5],[1,4],[4,6],[5,1],[3,4],[1,9],[-1,-1],[-2,-7],[-3,-3],[-3,2],[-4,6],[-2,2],[-2,0],[-2,-2],[-4,-11],[-2,-2],[-8,-1],[-3,1],[-3,2],[0,3],[1,3],[2,3],[-2,1],[-3,3],[-1,4],[-3,19],[-1,8],[2,6],[4,23],[1,12],[2,11],[0,6],[5,7],[2,4],[4,21],[1,11],[-7,35],[-1,6],[0,8],[1,14],[1,5],[-2,8],[-4,12],[0,6],[2,7],[-2,8],[2,8],[6,-2],[3,1],[3,9],[0,10],[1,5],[0,6],[3,3],[1,6],[3,8],[3,24],[2,6],[3,7],[-1,10],[2,4],[3,10],[1,6],[5,8],[1,10],[4,17],[0,12],[1,7],[0,7],[2,9],[3,11],[5,10],[0,8],[-1,5],[0,8],[-2,11],[5,7],[3,18],[0,7],[1,9],[-2,10],[-1,23],[-1,18],[-2,19],[0,11],[-2,13],[0,7],[1,17],[8,11],[1,12],[1,17],[0,11],[-1,6],[-4,9],[0,19],[3,5],[2,6],[4,17],[1,18],[2,14],[1,5],[2,7],[1,1],[0,16],[3,21],[0,6],[3,14],[1,10],[1,6],[-1,6],[1,13],[-2,8],[0,4],[2,14],[2,3],[2,7],[1,7],[0,4],[-3,23],[0,8],[1,18],[1,11],[-1,10],[1,5],[0,6],[2,7],[1,5],[-3,5],[-3,6],[0,7],[1,5],[0,6],[3,2],[2,3],[2,7],[2,17],[0,21],[2,13],[0,6],[1,13],[2,16],[-1,6],[-3,31],[0,11],[2,17],[0,25],[-2,11],[0,7],[-2,13],[-2,25],[0,25],[-2,3]],[[3043,4127],[4,1],[3,0],[3,2],[4,5],[2,6],[1,6],[0,5],[-1,7],[0,5],[1,2],[4,1],[4,8]],[[8079,6335],[2,-6],[1,-7],[0,-7],[-2,-4],[-3,-1],[-5,-16],[-1,-4],[-1,-2],[0,-5],[-1,-7],[-1,-9],[-1,-4],[-3,-4],[-2,0],[-1,-1],[-2,-5],[-3,-4],[0,-3],[-1,-2],[-2,0],[-4,-1],[-3,-8],[-3,-2],[-2,0],[-3,3],[-6,3],[-5,2],[-3,3],[-6,7],[-1,12],[-1,7],[0,2],[1,21],[0,2],[4,7],[3,3],[4,8],[3,3],[2,5],[-2,1],[2,4],[1,3],[1,1],[3,-1],[3,1],[2,4],[9,-1],[5,2],[2,3],[5,-1],[1,2],[6,-5],[0,7],[2,2],[2,-4],[2,-3],[2,-1]],[[8065,6398],[1,-2],[3,2],[0,-4],[-1,-3],[-2,2],[-4,0],[1,4],[2,1]],[[8128,6430],[-3,-2],[-1,1],[1,3],[3,2],[0,-4]],[[8132,6428],[-1,-2],[-1,2],[0,5],[2,4],[0,-9]],[[8153,6497],[-3,1],[-1,2],[1,3],[2,-3],[1,-3]],[[8282,6594],[-1,-3],[-2,0],[0,6],[2,-1],[1,-2]],[[8327,6650],[-2,-3],[-1,1],[0,12],[2,1],[0,-2],[2,-2],[-1,-4],[0,-3]],[[8367,6801],[-4,-1],[0,4],[2,4],[2,-4],[0,-3]],[[8392,6893],[-3,3],[0,2],[2,1],[1,-6]],[[8399,6905],[-1,-2],[-1,6],[2,-1],[0,-3]],[[8396,6909],[-1,-1],[-3,3],[-4,1],[-1,3],[0,4],[4,0],[6,-6],[-1,-4]],[[8384,6997],[-3,-1],[-7,5],[-5,5],[-3,7],[0,2],[3,0],[4,-3],[0,-3],[2,-1],[1,-2],[6,-5],[2,-4]],[[8624,7633],[0,2],[-2,1],[-4,6],[-1,3],[0,8],[-3,2],[-2,4],[-2,-1],[-3,2],[-2,-6],[-1,-7],[-1,-4],[0,-6],[-1,-7],[-1,-2],[-2,0],[-1,-3],[-3,1],[-1,2],[-2,0],[-3,-5],[-1,-5],[-2,-6],[-2,-1],[-4,-6],[-5,0],[-3,-1],[-6,-1],[-3,1],[-8,-2],[0,-5],[2,-4],[2,-8],[2,-2],[1,-3],[0,-3],[-2,-7],[-2,-3],[-1,0],[-2,4],[-3,0],[-6,-1],[-4,1],[-1,2],[-3,0],[-4,2],[-3,0],[-1,2],[0,3],[-2,4],[-1,4],[-3,2],[-3,-4],[-2,0],[-4,-4],[0,-3],[-2,-11],[-1,-3],[-1,0],[-5,-12],[-5,-7],[0,-3],[-3,-4],[-3,0],[-2,-2],[-3,-1],[-1,-4],[-2,0],[-1,-2],[-4,-5],[-2,-1],[-7,-5],[-2,-3],[0,-2],[-3,0],[-5,-8],[-7,-8],[-2,-5],[-1,-6]],[[8453,7487],[-2,-4],[-5,-5],[-10,-1],[-3,3],[-2,-5],[-2,-1],[-4,0],[-2,-2],[-1,-3],[-6,-1],[-2,-3],[-3,-1],[-14,-13],[-3,-6],[-3,-7],[-2,-3],[-4,-3],[-1,-3],[-5,1],[-2,-3],[1,-5],[-4,-2],[-5,-1],[-5,-5],[-1,5],[0,6],[2,2],[2,0],[12,9],[-2,6],[1,3],[3,5],[1,3],[-8,-2],[-4,0],[-3,1],[1,4],[0,4],[-1,1],[6,6],[1,2],[-1,4],[1,5],[8,6],[2,6],[3,5],[6,13],[0,2],[2,6],[0,2],[-4,9],[-7,9],[-1,7],[-1,0],[-1,-5],[-1,-2],[-4,0],[-1,2],[-10,1],[-3,-3],[-2,-6],[-2,-3],[-3,-2],[-2,-4],[-8,-20],[-3,-2],[-14,-12],[-7,-5],[-6,-9],[-4,-11],[-1,-9],[-6,-13],[-2,-1],[-3,1],[-2,-1],[-3,1],[-4,-4],[-5,-3],[-4,8],[-3,2],[-5,-2],[-3,-4],[-4,-16],[-2,-9],[0,-4],[3,-12],[3,-6],[7,-7],[15,-5],[3,1],[4,0],[4,-5],[2,-7],[0,-8],[2,-4],[-3,-4],[-1,-8],[0,-9],[1,-4],[3,-4],[5,-4],[5,0],[8,1],[4,6],[0,6],[7,8],[5,7],[-2,4],[3,1],[11,7],[8,-6],[5,-7],[5,-1],[3,-4],[4,-3],[4,0],[5,-1],[2,5],[2,0],[1,-4],[5,-3],[4,0],[3,1],[2,-1],[-3,-5],[1,-8],[-4,-7],[2,-3],[0,-4],[-2,-1],[-3,-5],[-2,0],[-3,7],[-3,1],[-3,-1],[-15,-13],[-7,-4],[-3,-3],[-2,-1],[-3,2],[-2,-1],[3,-4],[0,-6],[-1,-1],[-2,2],[-2,-2],[-1,-5],[0,-9],[-1,-3],[-4,-1],[-3,-3],[-2,3],[1,5],[-1,2],[-4,-2],[-2,-4],[2,-6],[3,-2],[-2,-3],[-4,-4],[-1,-4],[-2,-3],[-1,-3],[-3,-4],[-3,-2],[-3,-7],[-2,-6],[-3,-3],[-2,-11],[-4,-6],[-1,-9],[1,-6],[4,0],[2,-2],[4,-8],[6,-5],[5,-3],[7,-7],[3,-9],[3,-17],[2,-9],[0,-4],[3,-9],[3,-14],[4,-13],[1,-10],[-1,-5],[0,-5],[3,-6],[9,-6],[3,-5],[0,-10],[2,-5],[6,-4],[2,-3],[2,-5],[1,-5],[0,-7],[-3,0],[-2,1],[-9,8],[-3,1],[-3,-2],[-5,2],[-5,9],[-4,3],[-4,2],[-9,-9],[-2,1],[-2,-2],[4,-2],[5,3],[4,4],[6,-2],[2,-10],[4,-4],[3,-2],[4,-5],[5,-8],[8,-10],[4,-9],[2,-14],[-3,-3],[-7,-1],[-3,-3],[-3,-5],[-8,-9],[-2,-5],[-1,-4],[-2,-2],[-6,2],[-5,0],[-5,-6],[0,-2],[3,-1],[4,4],[4,-10],[7,2],[7,8],[3,0],[2,-1],[3,-4],[7,-14],[7,-5],[4,-1],[-5,-5],[-6,-12],[-3,-2],[3,-2],[4,5],[1,2],[2,-1],[1,-7],[-2,-21],[-2,0],[-1,6],[-2,1],[-2,-1],[-3,0],[-2,-2],[-1,-4],[2,-1],[4,-6],[1,-3],[-1,-2],[0,-4],[-1,-5],[-1,-2],[-2,-1],[-1,-4],[2,-7],[1,-9],[1,-4],[-3,2],[-4,-6],[-3,0],[-1,7],[-2,-1],[-1,-2],[-4,-15],[-2,-2],[-4,1],[0,-2],[2,-3],[0,-2],[-4,-9],[-1,-3],[0,-3],[-2,-3],[1,-6],[0,-4],[-4,-9],[-2,-6],[-3,-3],[-4,-12],[-2,-12],[-1,-3],[-2,-2],[-2,1],[0,4],[-2,3],[0,7],[-1,-1],[0,-4],[-2,-2],[-2,1],[-1,-1],[1,-3],[0,-3],[2,-1],[2,-4],[1,-5],[2,-5],[0,-2],[-3,-2],[-3,-4],[-3,-6],[-3,-4],[-4,0],[-2,3],[-3,1],[4,-9],[1,-1],[3,0],[2,3],[3,0],[1,-5],[-1,-5],[-2,-14],[2,-9],[1,-2],[-1,-2],[-3,3],[-2,3],[-2,-1],[-2,1],[-3,-1],[-1,-2],[1,-3],[2,-3],[1,-4],[-1,-2],[-6,1],[-3,-5],[1,-7],[-1,-5],[-3,-1],[-3,-3],[-2,-1],[0,-2],[2,-1],[-1,-10],[-3,-2],[-4,1],[-3,-1],[-3,3],[-3,0],[-2,-4],[0,-5],[-5,0],[1,-5],[4,0],[1,-3],[0,-5],[-4,-8],[-2,-6],[-3,1],[-2,-5],[-1,-6],[-1,1],[-3,-1],[-1,-4],[1,-2],[-3,-8],[-1,3],[0,4],[-1,0],[-2,-4],[-4,-4],[-1,3],[-4,1],[-1,-11],[-5,-7],[0,-3],[-1,-3],[-2,0],[-1,-3],[-1,-10],[-1,-3],[-4,0],[-2,2],[-1,-4],[-4,-2],[-6,-4],[-3,1],[-3,2],[-2,-2],[-2,-6],[-3,0],[-3,3],[-2,3],[-3,-3],[-3,-4],[-2,-1],[-2,-4],[-3,1],[-1,6],[-2,1],[-3,-8],[1,-5],[-2,0],[-2,3],[-2,1],[-2,-3]],[[8173,6482],[-2,1],[-4,-1],[-1,-2]],[[8166,6480],[-3,1],[-2,4],[-2,8],[-3,4],[-1,3],[-1,6],[0,6],[1,3],[-3,-1],[-2,-3],[0,-6],[-3,-2],[0,-3],[3,-4],[0,-4],[3,-7],[0,-11],[1,-3],[0,-3],[-1,-5]],[[8153,6463],[-1,2],[-1,-3]],[[8151,6462],[-2,-1],[-4,-5],[-3,-1],[-2,7],[-2,-5],[-1,-10],[-2,-3],[-3,3],[-2,-2],[-4,-7],[-2,2],[-2,4],[0,4],[-2,1],[0,-3],[1,-7],[-1,-2],[-2,-1],[-3,1],[-2,2],[-5,3],[0,-4],[-2,-4],[-2,0],[-2,-3],[-1,-3],[-2,-3],[-6,-1],[-2,-3],[-6,0],[-3,1],[0,-4],[-3,-2],[-3,-1],[-4,-6],[-2,-4],[-3,1],[-1,6],[-1,-5],[0,-4],[-5,-8],[-1,-5],[0,-5],[5,-1],[1,-5],[-2,-2],[0,-3],[5,-9],[1,-3],[-2,-6],[-3,-4],[-6,-2],[-5,2],[-2,4],[1,2],[2,0],[-1,5],[-3,2],[-2,6],[1,5],[-2,8],[-2,2],[1,10],[-1,4],[3,6],[0,6],[4,3],[0,6],[-2,0],[-2,4],[-2,-2],[-3,9],[-2,1],[1,-9],[-3,-4],[-8,-3],[-2,1],[0,3],[1,3],[-1,3],[-2,2],[-7,0],[-1,1],[-4,10],[1,3],[-1,2],[-3,0],[0,-10],[1,-3],[0,-3],[-2,-1],[-3,5],[-2,-8],[-3,0],[-2,-2],[-3,-1]],[[7998,6422],[-5,8],[-1,1],[-3,-3],[-5,-1],[-1,3],[-2,-2],[-3,6],[-2,0],[-3,5],[-2,2],[0,3],[-4,4],[-4,2],[-1,-1],[-1,3],[0,15],[-2,3],[-1,3],[0,6],[1,4],[2,1],[2,3],[2,8],[-7,8],[-5,-3],[-3,1],[-2,4],[-3,2],[-2,0],[-1,-3],[-3,0],[-2,2],[-2,4],[-4,2],[-3,10],[-5,6],[-2,-4],[-6,-5],[-3,-3],[-1,-2],[-1,-5],[0,-6],[-3,-5],[-3,0],[-2,-1],[-4,-6],[-2,0],[-2,4],[0,2],[-2,0],[-3,-3],[-2,-10],[0,-2],[-2,-1],[-7,14],[-1,1],[-3,-10],[-1,-1],[-3,9],[-2,0],[-4,-9],[0,-3],[-2,-3],[-3,-3],[-3,5],[-1,3],[-3,4],[-3,3],[-4,3],[-2,-3],[-3,-9],[-1,-5],[-3,-5]],[[7836,6472],[-3,4],[-2,0],[-3,-3],[-3,6],[-2,-2],[-2,-8],[-2,-6],[1,-3],[0,-6],[1,-4],[3,-6],[1,-4],[0,-16],[-1,-8],[0,-5],[3,-5],[-3,-4],[-2,1],[-3,3],[-2,0],[-5,-3],[-1,1],[-1,5],[0,6],[-1,1],[1,7],[-2,3]],[[7808,6426],[0,10],[-2,0],[-6,-5],[-5,-9],[-4,-3],[-2,2],[-3,1],[-4,-2],[-2,2],[-1,3],[0,6],[-3,2],[-2,7],[1,5],[0,5],[-1,2],[-9,4],[-5,1],[-3,-1],[-3,2],[0,9],[1,5],[3,7],[0,11],[1,8],[4,8],[-1,5],[-4,3],[-3,0],[-5,2],[-5,3],[1,7],[-1,4],[0,3],[-2,5],[1,6],[-1,7],[-2,2],[-1,4],[0,7],[4,7],[0,2],[-7,-3],[0,1],[-6,2],[-4,-1],[-6,-3],[-5,-4],[-2,-3],[-3,-3],[-2,2],[0,4],[3,8],[1,6],[-1,5],[0,4],[-3,3],[-1,3],[0,8],[1,8],[4,4],[1,2],[-1,6],[0,3],[1,7],[2,6],[3,-1],[4,6],[1,4],[1,9],[1,1],[3,-1],[1,1],[2,5],[2,7],[2,2],[2,0],[1,2],[0,3],[-2,5],[0,6],[2,2],[1,3],[0,6],[1,8],[0,35],[-1,8],[0,14],[-1,8],[-1,2],[-3,3],[-3,-1],[0,-3],[-1,-3],[-2,1],[0,3],[-1,4],[-4,22],[0,5],[-5,10],[-1,3],[-3,0],[-2,3],[-2,5],[-1,1],[-2,-1],[-2,-4],[-1,-5],[-3,-7]],[[7702,6809],[-5,7],[-2,1],[-2,-1],[-6,1],[-3,5],[-2,1],[-5,-4],[-1,-2],[-2,1],[-1,3],[2,4],[-1,1],[2,5],[6,9],[-4,15],[0,2],[-3,-2],[-5,-7],[-1,1],[0,9],[1,2],[3,3],[2,3],[0,3],[-3,-1],[-1,1],[-2,7],[-1,2],[-2,1],[-9,-7],[-5,-6],[0,-4],[-1,0],[-2,-5],[-2,-1],[-2,1],[-3,3],[-11,4],[-2,7],[-2,1],[-4,-6],[-5,-4],[-3,-5],[-2,-5],[-3,-1],[0,-3],[-3,-6],[-6,-6],[-9,-2],[-3,-2],[-3,-8],[-1,-5],[-2,-4],[-4,-6],[-5,-4],[-2,-4],[1,-2],[0,-6],[-4,-4],[-1,-2],[-2,-1],[-4,0],[-1,1],[-2,-2],[-2,0],[-3,-4],[-2,-1],[-6,2],[-2,0]],[[7468,6757],[-2,2],[-2,4],[0,6],[2,14],[1,5],[-1,3],[0,5],[-6,5],[-1,0],[-2,-3],[-6,-4],[-4,-1],[-1,-1],[0,-3]],[[7446,6789],[-5,1],[-7,-4],[-1,-1],[-2,1],[-8,0],[-4,1],[-3,5],[-5,4],[-3,1],[0,3],[-1,2],[-4,-1],[-1,-7],[-3,-2],[-5,5],[-3,6],[-1,-2],[0,-5],[-1,-4],[-2,-1],[-2,4],[-2,9],[-2,5],[-2,3],[-8,0],[-8,2],[-1,3],[2,13],[-2,1],[-6,-3],[-2,0],[-2,2],[-2,4],[-5,5],[-1,3],[-3,4],[-3,3],[-2,14],[-1,3],[-5,4],[-4,-3],[-3,-3],[-2,0],[-4,7],[-3,8],[-3,7],[-2,3],[-4,0],[-5,4],[-10,15],[-7,7],[-3,5],[-2,10],[-11,4],[-7,-3],[-4,-14],[-2,-3],[-2,-1],[-2,4],[-1,4]],[[7249,6921],[-1,4],[-3,3],[-5,7],[-12,9],[-2,0],[1,7],[-2,6],[-2,-1],[-4,6],[0,1],[-4,4],[-3,0],[-3,-1],[-2,2]],[[7207,6968],[-4,7]],[[7203,6975],[-3,8],[-4,9],[-2,1],[-1,-5],[-3,0],[-1,-2],[-3,0],[1,8],[-1,2],[0,5],[2,3],[-2,3],[-1,4],[0,9],[1,6],[-2,2],[-5,11],[-1,5],[0,5],[-2,7],[1,3],[3,0],[5,2],[1,-2],[0,-4],[5,-8],[2,0],[2,2],[2,5],[2,1],[0,4],[1,8],[0,3],[-1,3],[0,8],[-3,4],[1,5],[0,4],[-3,7],[-5,8],[-1,4],[-1,9],[0,13],[-1,7],[0,5],[5,6],[2,4],[-2,5],[-2,2],[-2,4],[-3,3],[-4,3],[-5,3],[-2,2],[-1,7],[-4,21],[-2,7],[0,3],[1,10],[-4,-2],[-2,1],[-1,2]],[[7160,7228],[-6,-2],[-4,1],[-4,2],[-6,2],[-9,6]],[[7131,7237],[-4,4],[-1,3],[-1,6],[-1,0],[-3,-3],[-4,-1],[-3,1],[-1,7],[-1,2],[-4,2],[-1,4],[2,5],[0,16],[-2,8],[-2,3],[-1,3],[-3,3],[-3,1],[-4,-2],[-1,9],[-1,1],[-8,5],[-5,-2],[-3,3],[-5,2],[-2,-1]],[[7079,7328],[3,3],[2,3],[1,3],[0,3],[-3,5],[-3,4],[1,5],[0,7],[-1,1],[0,6],[-1,6],[-2,4],[0,10],[2,7],[-1,4],[-8,8],[-7,3],[-4,0],[-2,-3],[-1,-4],[-4,1],[-2,3],[-1,5],[-2,7],[0,4],[1,2],[2,1],[0,4],[-2,2],[-1,4],[-3,7],[1,4],[0,8]],[[7044,7455],[5,3],[2,2],[1,3],[-1,8],[-1,3],[0,3],[3,9],[1,4],[3,2],[4,1],[5,2],[5,8],[2,2],[4,1],[1,1],[-1,5],[1,4],[4,-3],[3,0],[4,2],[8,8],[1,-1],[1,-5],[1,-11],[1,-1],[5,0],[4,4],[2,1],[2,-1],[3,3],[2,-4],[4,5],[1,4],[2,4],[2,9],[0,2],[2,2],[3,10],[4,3],[6,-2],[3,1],[8,-2],[4,2],[2,2],[4,0],[5,1],[6,12],[0,3],[3,5],[3,2],[5,6],[11,9],[4,4],[2,0],[4,2],[8,5],[2,5],[1,1],[9,1],[1,1],[-1,5],[0,3]],[[7227,7613],[1,5],[-3,20],[3,10],[5,4],[3,1],[0,2],[-2,1],[-3,4],[1,3],[6,4],[4,-1],[1,3],[-2,7],[-2,4],[2,5],[-2,8],[-2,6],[-2,12],[-2,4],[-2,8],[0,13],[-1,7],[2,11],[0,3],[2,0],[0,4],[-3,1],[-3,2],[-7,0],[-2,1],[-2,4],[3,3],[3,4],[4,1],[12,6],[6,0],[5,2],[8,4],[10,6],[2,-2],[1,-5],[4,-4],[1,1],[4,1],[4,2],[2,-1],[4,-5],[2,2],[2,8],[0,8],[-1,1],[-4,1],[-3,3],[-1,3],[1,6],[5,19],[1,9],[4,13],[3,14],[5,19],[0,4],[1,9],[2,1],[3,-1],[7,-4],[5,-4],[5,-3],[6,-1],[5,1],[4,0],[5,-1],[4,0],[3,-8],[2,0],[7,7],[3,5],[4,0],[3,1],[2,2],[1,5],[2,4],[0,8],[-2,6],[0,4],[-2,20],[1,8],[2,9],[2,6],[2,4],[2,2],[6,0],[6,2],[3,2],[5,2],[3,7],[2,3],[1,10],[-1,4],[1,4],[3,5],[5,1],[5,0],[2,-1]],[[7424,8011],[3,-1],[4,3],[7,2]],[[7438,8015],[0,-5],[2,-4],[-2,-4],[-2,-1],[0,-2],[3,-5],[3,-2],[3,-3],[0,-2],[-3,-4],[1,-3],[9,-5],[3,-4],[3,-1],[1,-4],[0,-5],[7,-7],[3,-1],[3,-5],[4,-1],[4,2],[4,1],[3,-2],[3,-7],[3,-3],[3,1],[2,2],[2,0],[0,-2],[2,-6],[6,-5],[0,-3],[1,-3],[2,-3],[1,-5],[0,-5],[2,-6],[5,-12],[4,-3],[3,-12],[0,-5],[1,-4],[0,-4],[-1,-8],[-2,-4],[0,-3],[3,-13],[-2,-3],[-4,-8],[-3,-7],[-1,-7],[0,-5],[3,-6],[0,-2],[3,-10],[1,-1],[1,2],[3,0],[7,-6],[4,0],[4,-2],[4,-1],[8,0],[4,-2],[7,-1],[4,0],[6,1],[14,-3],[6,-2],[4,-2],[3,-4],[3,-7],[3,-2],[6,-2],[5,-7],[4,-3],[6,-7],[4,-3],[5,-2],[8,1],[1,-1],[-1,-4],[0,-9],[1,-2],[3,-1],[3,-8],[3,-11],[4,-16],[0,-6],[2,-4],[5,-6],[2,-5],[4,-5],[1,-5],[0,-6],[1,-1],[13,2],[10,2],[14,-3],[15,-3],[13,-3],[21,-4],[8,4],[6,2],[3,0],[19,-5],[9,-2],[6,-1],[7,0],[3,-2],[8,-16],[5,-3],[12,-4],[6,-3],[8,-2],[5,-4],[5,-5],[8,-6],[16,6],[5,1],[0,-12],[10,-1],[4,-3],[2,1],[4,7],[3,2],[6,5],[9,8],[19,13],[4,3],[6,2],[5,1],[6,2],[13,3],[8,1],[3,1],[5,0],[10,-2],[12,2],[6,0],[3,1],[11,8],[6,3],[9,7],[2,4],[5,8],[2,5],[4,7],[4,9],[5,3],[8,4],[5,5],[3,6],[3,1],[2,2],[0,6],[-3,7],[-4,6],[-5,9],[0,4],[-2,3],[-1,3],[0,3],[3,5],[0,3],[1,6],[2,9],[4,8],[4,6],[4,1],[2,-1],[8,0],[3,-3],[2,-6],[3,-1],[10,-5],[4,-1],[3,0],[8,-2],[2,1],[2,3],[5,5],[5,4],[2,4],[7,9],[2,4],[0,2],[2,5],[2,1],[3,0],[5,-2],[14,2],[3,2],[4,1],[7,9],[3,3],[2,1],[4,6],[-1,3],[1,7],[5,11],[2,3],[2,5],[3,1],[3,4],[10,-2],[3,0],[3,2],[0,3],[1,6],[1,3],[3,0],[3,-4],[4,1],[3,4],[4,3],[7,3],[3,-1],[9,0],[1,3],[2,1],[9,-7],[4,-2],[4,1],[4,-1],[3,0],[4,4],[1,3],[0,7],[-4,10],[0,4],[-1,3],[-5,6],[-4,7],[-2,2],[-1,4],[-3,3],[-2,5],[0,2],[-2,2],[-7,4],[-6,11],[-2,2],[-7,1],[-2,2],[-5,-2],[-4,0],[-2,-1],[-3,-4],[-3,-6],[-3,-4],[-2,-4],[-2,0],[-6,8],[-5,3],[-4,1],[-7,-2],[-4,0],[-1,1],[-3,0],[-4,-4],[-2,-5],[-3,-1],[-2,3],[-3,3],[-3,5],[-1,4],[-1,11],[3,3],[4,3],[0,12],[1,7],[4,7],[2,5],[0,3],[2,6],[1,6],[3,7],[4,14],[5,16],[3,8]],[[8240,8053],[6,-5],[9,-6],[7,-1],[6,-5],[5,-1],[9,11],[7,8],[8,7],[7,1],[4,2],[3,3],[2,5],[1,7],[-1,5],[-3,1],[-1,2],[2,4],[1,5],[2,4],[3,4],[1,4],[0,5],[2,5],[5,9],[0,4],[6,14],[3,10],[5,7],[7,8],[5,7],[2,7],[0,6],[-3,6],[0,5],[1,6],[-1,4],[-4,3],[-4,1],[-5,-2],[-3,2],[-1,5],[2,4],[3,3],[6,7],[8,12],[7,6],[12,2],[9,4],[10,4],[7,2],[5,-2],[6,1],[12,4],[4,1],[7,-2],[1,1],[4,-2],[7,-6],[4,-2],[4,-1],[2,-4],[3,-3],[5,-1],[7,-5],[0,3],[5,2],[4,-2],[6,-5],[6,-3],[1,-2],[0,-4],[1,-2],[4,-1],[2,-4],[3,-4],[0,-4],[-1,-3],[1,-3],[3,-1],[1,-4],[4,-7],[0,-3],[2,-5],[3,-17],[4,-8],[1,-5],[0,-8],[3,-3],[1,-5],[0,-9],[2,-5],[0,-4],[3,-7],[5,-9],[3,-7],[1,-5],[0,-4],[-1,-3],[0,-3],[1,-1],[0,-5],[1,-3],[6,-5],[-3,-13],[0,-6],[2,-4],[4,-5],[0,-3],[3,-3],[5,-3],[7,0],[8,2],[5,0],[2,-1],[0,-5],[1,-2],[6,-2],[2,-4],[2,2],[4,-2],[2,2],[3,0],[2,-6],[3,0],[3,-5],[7,-13],[4,-5],[5,-1],[5,0],[2,-5],[-2,-6],[0,-4],[3,-7],[2,-3],[2,-5],[0,-5],[-2,-8],[0,-6],[3,-5],[2,-5],[1,-5],[0,-3],[2,-1],[8,2],[4,0],[3,-2],[6,0],[10,2],[10,0],[2,3],[2,7],[2,3],[2,0],[3,2],[4,5],[3,2],[9,0],[3,2],[3,4],[4,4],[13,6],[1,-1],[7,-2],[3,-7],[-1,-5],[-2,-6],[0,-2],[3,-10],[2,-5],[-2,-6],[-3,-5],[-1,-3],[-2,-2],[-3,0],[-4,-5],[-2,-6],[1,-3],[0,-4],[-1,-4],[-2,-5],[-2,-15],[-1,-6],[-3,-6],[1,-4],[0,-6],[-1,-1],[0,-4],[-3,-3],[-1,-3],[0,-4],[-1,-4],[-2,-5],[-3,-2],[0,-4],[-1,-3],[0,-6],[-1,-3],[-3,-3],[-2,0],[-2,-3],[-2,-10],[0,-11],[-3,-3],[-2,-3],[-2,2],[-4,1],[-1,1],[-9,3],[-5,3],[-5,2],[-4,5],[-3,-5],[-2,-2],[-2,-7],[-4,-6],[-5,-2],[-1,-1],[-6,-2],[-1,-5],[1,-3],[2,-9],[1,-7],[4,-23],[-2,-4],[-1,-17],[1,-3],[0,-10],[2,-3],[0,-3],[-2,-7],[-1,-7],[-2,-6],[0,-4],[-1,-4],[-3,-3],[-4,1],[-6,-3],[-4,-3],[-1,-3],[3,-2],[2,-3],[0,-3],[-2,-2]],[[4913,5479],[0,-3]],[[4913,5476],[-4,2],[1,2],[3,-1]],[[4924,5729],[0,-10],[1,-1],[-1,-4],[-1,-6],[0,-4],[1,-1],[1,-4],[1,-7],[1,-3],[2,-33],[-1,-2],[-2,-1],[0,-2],[1,-2],[-2,-4],[-4,-7],[-1,-4],[0,-3],[-1,-5],[-2,-13],[-1,-11],[0,-4],[-1,-2],[0,-3],[-4,-10],[-2,-8],[0,-21],[4,-20],[2,-17],[1,-5],[0,-2],[1,-2],[4,-1],[1,-11],[0,-10],[-1,-4],[0,-2],[-2,0],[-2,-2],[-2,1]],[[4915,5479],[-4,4],[0,8],[-1,1],[-1,-1],[-2,-10],[-1,-2],[-15,5],[-3,4],[-3,1],[-7,0],[-5,-2],[-2,-2],[15,1],[1,-1],[-17,-4],[-7,-2],[-2,1],[-2,3],[-7,0],[1,-3],[4,1],[1,-2],[-14,-3],[-9,-4],[-4,-3],[-14,-11],[-8,-6],[-2,-2],[-4,-5],[-5,-3],[-5,-7],[-4,-1]],[[4789,5434],[0,13],[-1,14],[0,5],[1,6],[0,4],[2,3],[0,6],[2,5],[0,19],[-1,11],[-2,0],[-3,4],[-3,0],[-2,3],[0,4],[-1,2],[0,5],[-1,4],[-3,3],[-2,1],[-2,-1],[-4,2],[-2,2],[-1,4],[-2,3],[-1,-1],[-3,2],[0,1],[6,11],[2,6],[0,10],[1,6],[-4,19],[0,6],[-2,3]],[[4763,5619],[2,2],[2,0],[3,-2],[1,1],[3,10],[0,4],[-1,2],[2,7],[2,6],[-2,5],[-1,0],[-3,3],[-1,2],[0,11],[1,2],[4,1],[5,-2],[2,0],[2,-5],[1,0],[1,2],[-1,8],[0,5],[-2,5],[-5,3],[0,6],[1,6],[1,2],[3,3],[-2,4],[-2,3],[1,6],[0,7],[-2,-1],[-2,0],[-2,1],[-1,4],[0,22],[-1,6],[1,3],[2,2],[2,6]],[[4777,5769],[3,1],[2,3],[2,6],[2,5],[4,0],[1,1],[1,-4],[1,-2],[1,0],[0,-5],[6,-2],[2,-1],[1,-3],[2,0],[1,3],[-1,3],[0,3],[1,2],[3,1],[2,0],[2,-1],[1,3],[-1,7],[0,4],[1,4],[3,-4],[4,-2],[-1,6],[2,2],[3,2],[1,-7],[0,-7],[1,-6],[-1,-3],[0,-4],[3,-3],[2,0],[2,2],[2,4],[0,3],[2,2],[4,2],[4,1],[1,-1]],[[5448,5314],[0,-4],[-2,-5],[-1,-5],[2,-13],[0,-5],[-2,-2],[-2,5],[-3,3],[-4,6],[-4,2],[-5,0],[-2,-1],[-2,2],[-3,4],[-2,-2],[-5,0],[0,3],[-1,1],[-3,0],[-1,2],[-2,1],[-2,4],[-3,-3],[-5,1],[-14,0],[-14,0]],[[5368,5308],[0,3],[-2,2],[-15,0],[-4,2],[-5,1],[-5,-1],[-6,0],[-11,1],[-6,0],[0,-8]],[[5314,5308],[-15,0],[-14,0],[-9,0],[-4,4],[0,4],[-1,0]],[[5271,5316],[1,14],[1,11],[2,20],[-1,9],[-1,4],[-5,13],[2,5],[-3,-1],[-1,5],[-2,6],[1,1],[1,3],[4,-1],[-3,7],[0,2],[-1,1],[-2,0],[-1,-1],[-1,-4],[-1,-1],[-2,0],[-1,1],[-2,4],[-4,2],[-3,3],[-1,8],[-1,3],[0,4],[-1,5],[1,7],[-1,1],[-4,0],[-1,4],[-1,1],[0,-7],[-1,-2],[-2,1],[-1,3],[0,2],[1,8]],[[5237,5457],[0,5],[2,5],[2,7],[2,9],[2,15],[1,10],[1,8],[2,8],[2,5],[5,11],[3,7],[6,9],[2,4],[2,6],[2,7],[2,2],[8,11],[0,-2],[1,-4],[3,-1],[3,0],[2,1],[1,2],[1,7],[2,1],[3,-4],[6,-12],[2,-3],[0,-2],[2,-11],[0,-3],[2,-1],[5,3],[4,6],[1,4],[1,2],[0,9],[6,12],[2,3],[0,1],[-2,8],[2,8],[5,10],[0,8],[4,13],[2,16],[0,3],[2,8],[3,10],[4,2],[5,7],[2,8],[0,8],[1,9],[2,14],[3,4],[5,4],[0,5],[1,10],[0,8],[1,4],[4,8],[1,12],[2,13],[5,16],[5,15],[2,4],[2,2],[3,0],[1,1],[6,8],[3,3],[2,5],[0,3],[-1,8],[1,6],[1,9],[0,9],[-1,4],[-2,5],[-3,2],[-4,1],[-2,2],[0,8],[-1,5],[-2,27]],[[5390,5937],[5,0],[6,-4],[1,-2],[1,-9],[2,-5],[4,-5],[2,-9],[1,-13],[2,-8],[1,-1],[2,-12],[1,-3],[0,-12],[1,-6],[-2,-10],[0,-6],[-1,-9],[2,-15],[1,-11],[2,-10],[2,-7],[4,-8],[3,-8],[4,-4],[-3,-3],[-6,0],[-4,1],[-2,0],[-1,-1],[-7,-1],[-13,2],[-3,0],[-3,-4],[-5,-12],[1,-6],[2,-4],[6,-14],[1,-5],[6,-10],[6,-11],[3,-2],[3,-5],[4,-9],[4,-13],[2,-14],[3,-13],[1,-3],[2,-1],[0,-7],[-2,-8]],[[5856,5384],[1,-1],[0,-3],[-2,-8],[-1,-6],[-1,-8],[3,-6],[0,-5],[-2,-9],[-1,-9],[-1,-4],[3,-3],[4,0],[3,-7],[2,0],[1,-1],[0,-2],[2,-2],[1,-3],[-1,-3],[0,-3],[-9,-21],[-12,-25],[-5,-3],[-2,-5],[-2,-8],[-3,-6],[-4,-4],[0,-17],[-4,-19],[-1,-1],[-1,-3],[0,-9],[-1,-3],[-1,-19],[0,-6],[-1,-9],[0,-11],[-1,-5],[0,-8],[1,-14],[-1,-2]],[[5820,5103],[-3,-4],[-1,-3],[-2,0],[-4,-12],[-2,-5],[0,-10],[1,-8],[-1,-4],[-1,-2],[-5,-8],[-1,-2],[0,-9],[1,-4],[0,-3],[3,-2]],[[5816,4927],[0,-3],[-2,-19],[-1,-4],[3,-16],[2,-8],[0,-5],[2,-5],[1,-9],[0,-7],[-3,-11],[0,-4],[1,-8],[0,-8],[2,-5],[3,-13],[3,-4],[4,-7],[6,-9],[1,-4],[5,-17],[1,-7],[2,-10],[2,-9],[2,-11],[2,-8],[1,-5]],[[5853,4711],[-5,-1],[-7,-2],[-7,-3],[-8,-2],[-8,-3],[-8,-2],[-6,-2],[-2,-1],[1,-6],[-1,-7],[-1,-5],[-2,-6],[-3,-7],[-8,-12],[0,-3],[4,-13],[2,-19],[0,-33],[1,-8],[-1,-7],[-2,-8],[-1,-7],[-1,-11],[-3,-21],[0,-5],[1,-3],[2,-11],[3,-6],[5,-8],[6,-12],[2,-5],[4,-1],[4,-2],[2,-2],[2,1],[0,9],[2,3],[4,1],[1,2],[2,0],[0,-39],[0,-32],[-1,-3],[-1,-1],[-3,5],[0,4],[-1,3],[-3,-1],[-6,-6],[-2,-1],[-2,0],[-3,1],[-2,4],[-2,11],[-4,11],[-2,4],[-3,1],[-1,5],[-1,7],[-2,6],[-1,2],[-4,3],[-4,4],[-6,5],[-3,0],[-3,1],[-2,2],[-1,2],[-2,7],[-1,7],[-5,10],[-2,10],[-2,1],[-2,-2],[0,-3],[-2,-9],[0,-4],[-2,-3],[-5,-2],[-3,1],[-5,1],[-2,1],[-7,2],[-2,0],[-3,2],[-2,2],[-6,5],[-3,-1],[-5,8],[-1,4],[-1,8],[0,5],[1,5],[-1,1],[-2,-1],[-4,-1],[-5,-3],[-6,-3],[-4,-5],[-1,0],[-3,2],[-1,2],[2,7],[-1,7],[-2,4],[-3,2],[-2,0],[0,4],[-1,4],[-3,1]],[[5362,4845],[-2,2],[-4,-1],[-2,-1],[-3,-5],[-4,-3],[-3,1],[-3,6],[-3,8]],[[5362,4916],[1,2],[1,0],[2,-6],[5,-7],[1,0],[1,2],[2,2],[3,2],[1,2],[1,4],[0,10],[2,1],[3,-3],[1,0],[3,4],[3,1],[6,6],[2,-7],[0,-2],[-1,-3],[-1,-5],[1,-5],[0,-9],[2,-2],[2,1],[2,-2],[3,0],[5,10],[6,14],[4,9],[4,4],[2,4],[1,5],[2,3],[5,3],[3,3],[3,9],[4,18],[2,15],[0,42],[0,17],[6,12],[3,7],[3,8],[4,19],[3,9],[2,5],[4,4],[5,4],[7,13],[6,13],[-1,15],[2,13],[3,17],[1,17],[-1,19],[0,15],[3,17],[2,7],[0,27],[4,23],[3,14],[5,16],[1,9],[2,13],[0,10]],[[5760,5478],[1,-4],[2,-5],[4,-7],[2,-3],[1,-5],[2,-6],[4,-4],[1,-3],[5,-7],[2,0],[3,-2],[2,0],[5,8],[3,3],[6,-1],[6,-6],[2,0],[4,6],[3,7],[2,1],[3,-3],[3,-6],[3,-8],[1,-4],[3,-5],[5,-11],[6,-6],[2,-3],[2,-6],[0,-4],[1,-2],[1,1],[2,0],[1,-1],[3,-8]],[[5333,4895],[-1,1],[-3,7],[-2,6],[0,3],[-1,2],[0,6],[-3,8],[-8,13],[0,4],[-7,13]],[[5308,4958],[3,13],[2,3],[6,7],[0,-1],[5,-9],[1,-1],[1,1],[2,-1],[1,2],[0,2],[-1,3],[0,3],[1,3],[0,3],[1,4],[0,2],[-1,2],[-3,3],[-2,3],[0,7],[2,3],[0,1],[-2,3],[-2,5],[-3,1],[2,9],[0,19],[2,-1],[2,-2],[4,3],[2,0],[1,-2],[2,-2],[11,5],[0,5],[1,4],[0,4],[-2,7],[0,3],[1,2],[4,4],[1,0],[2,-2],[2,-4],[2,-8],[2,-6],[2,-8],[4,-3],[6,-2],[3,0],[7,12],[0,3],[2,-1],[1,-7],[2,-5],[-1,-4],[1,-2],[3,-1],[2,1],[1,3],[2,4],[0,3],[-1,2],[0,3],[1,2],[2,6],[0,4],[1,3],[3,3],[1,11],[-1,3],[0,4],[1,3],[1,7],[-1,10],[0,8],[-1,7],[2,21],[0,2],[-1,3],[-2,3],[-4,3],[-2,3],[-1,4],[-1,2],[-5,1],[-1,3],[0,6],[1,10],[0,12],[1,4],[3,4],[1,6],[4,1],[2,2],[1,2],[0,3],[3,8],[0,5],[-1,6],[-3,7],[-1,11],[-2,3],[-3,2],[-6,1],[-4,-2],[-5,-4],[-7,-4],[-2,0],[-1,2],[1,1],[1,4],[-2,10],[0,14],[1,8],[2,10],[0,4]],[[562,3959],[-3,2],[1,2],[2,-1],[0,-3]],[[2829,5330],[-2,1],[0,3],[1,2],[1,-1],[0,-5]],[[3018,5867],[-2,-3],[-4,-3],[-5,-2],[-7,-4],[-1,-3],[-7,-24],[-5,-5],[-2,-3],[-2,-4],[-3,-9],[-1,-6],[-4,-13],[-2,-17],[-1,-10],[-1,-14],[-1,-7],[-2,-6],[-3,-7],[-2,-7],[-1,-5],[-1,-2],[1,-2],[4,2],[4,4],[1,-1],[2,-7],[3,0],[1,-1],[2,-15],[2,-13],[7,-14],[0,-5],[1,-8],[0,-4],[-1,-2],[-1,-5],[-1,-9],[0,-16],[2,-7],[5,-2],[2,-7],[2,-9],[2,-4],[3,-2],[2,1],[6,1],[4,0],[7,-2],[6,0],[5,5],[2,1],[3,-1],[3,-2],[4,-4],[3,-2],[4,1],[1,-1],[5,-14],[5,-12],[8,-20],[1,-1],[3,1],[1,-2],[2,1],[3,4],[4,0],[6,-2],[7,0],[9,2],[6,3],[2,3],[4,-1],[4,-2],[3,-4],[0,-3],[1,-6],[-1,-5],[-3,-6],[-1,-7],[-1,-9],[-1,-6],[-3,-4],[-1,-6],[1,-8],[-1,-12],[-1,-15],[0,-9],[2,-7],[0,-11],[2,-6],[3,-19],[2,-2],[1,-2],[5,-16],[0,-4],[-1,-1],[-4,-8],[-10,-19],[0,-4],[3,2],[3,-1],[2,-2],[0,-5],[3,-2],[4,-10],[3,-5],[1,-3],[-1,-4],[1,-7],[2,-6],[-1,-3],[2,-3],[2,-15],[1,-5],[0,-2],[2,-11],[0,-4],[1,-4]],[[3056,4939],[-2,5],[-2,4],[-2,2],[-1,3],[-1,7],[-2,2],[-1,2],[-4,-4],[-6,5],[-1,0],[3,11],[6,18],[4,11],[4,13],[2,7],[0,3],[-1,2],[-2,1],[-2,2],[-1,3],[-4,4],[-3,2],[-1,2],[-2,1],[-2,3],[-6,8],[-1,0],[-4,-2],[-2,-4],[-3,-1],[-3,0],[-1,2],[-2,1],[-2,3],[-3,3],[-3,1],[-5,-10],[-2,0],[-3,-3],[-2,-1],[-2,0],[-3,-2],[-3,2],[-3,3],[-1,-1],[-4,-2],[-4,0],[-1,4],[-5,3],[0,7],[1,4],[-1,5],[-1,7],[0,3],[-2,3],[-2,0],[-3,2],[-2,6],[1,6],[-1,5],[-2,3],[-2,8],[-2,2],[-2,0],[-2,1],[-1,4],[-2,2],[-2,4],[-5,3],[-1,3],[-2,4],[1,3],[-1,2],[-1,4],[-1,7],[-1,3],[-2,3],[-2,6],[-3,2],[-1,2],[-2,6],[-4,0],[-1,2],[-4,6],[-2,1],[-2,-4]],[[2908,5177],[-5,4],[-4,6],[-5,1],[-3,4],[-2,6],[-3,5],[-5,6],[-2,0],[-2,-2],[0,-2],[-1,-4],[0,-3],[-2,-1],[-3,0],[-2,2],[-2,-2],[-4,2],[-3,1],[-3,4],[-1,-1],[-4,1],[-3,2],[0,2],[-2,12],[-5,5],[0,3],[-1,4],[-4,-1],[-5,4],[-4,4],[-4,5],[-6,8],[-2,3],[-2,2],[-2,5],[-2,4],[-1,1]],[[2809,5267],[-1,4],[-4,6],[2,7],[5,6],[6,-5],[0,9],[-2,8],[0,14],[1,3],[2,4],[2,3],[3,-1],[1,3],[5,-1],[2,1],[2,3],[2,8],[1,1],[2,0],[1,4],[3,5],[0,2],[-1,7],[4,2],[2,10],[2,6],[1,0],[1,7],[3,7],[4,19],[-2,-3],[-2,0],[-1,2],[0,9],[-3,-6],[-2,6],[0,4],[1,4],[0,3],[-3,-2],[0,2],[2,3],[1,3],[2,3],[0,4],[1,7],[0,11],[-1,3],[-1,14],[0,14],[-1,5],[-4,7],[6,8],[2,6],[-2,13],[-4,10],[0,6],[2,0],[1,13],[0,4],[-2,7],[-2,0],[-2,8],[-2,2],[-1,5],[-3,10],[-3,6]],[[2835,5600],[2,12],[2,2],[1,3],[-1,8],[0,2],[2,-1],[2,-7],[1,-1],[1,1],[6,8],[-1,3],[2,9],[2,1],[1,2],[-1,4],[-4,18],[-1,5],[-2,4],[2,8],[1,1]],[[2850,5682],[1,-1],[2,-8],[4,-6],[4,-8],[1,-6],[2,-4],[0,-1],[-2,-5],[2,-4],[2,1],[1,4],[0,18],[-2,9],[-2,6],[0,3],[3,1],[3,3],[11,17],[4,16],[3,6],[4,4],[4,-1],[3,2],[1,5],[-1,7],[-1,4],[1,6],[1,9],[0,8],[2,4],[-1,2],[-2,-4],[-1,2],[3,7],[2,12],[1,4],[5,7],[1,3],[3,5],[6,11],[2,3],[11,-7],[3,1],[0,-2],[-2,0],[-2,-2],[-1,-4],[2,-4],[2,-2],[1,3],[1,8],[3,9],[0,9],[2,3],[2,1],[4,-1],[3,-2],[4,0],[10,1],[16,24],[8,5],[5,5],[3,10],[0,7],[3,3],[2,0],[1,2],[0,2],[6,7],[6,0],[7,-5],[3,-10],[0,-7],[-4,-7],[-1,-3]],[[6215,4474],[-3,-2],[-1,4],[0,2],[2,-1],[2,-3]],[[6234,4487],[2,-8],[0,-6],[-1,-1],[-1,1],[-2,5],[-5,4],[2,1],[1,-1],[2,1],[0,2],[1,2],[1,0]],[[6206,4498],[0,-1],[-4,4],[-2,5],[0,19],[1,2],[2,1],[1,-2],[0,-12],[2,-8],[1,-6],[-1,-2]],[[4324,6039],[-2,-2],[-2,1],[-2,5],[1,3],[3,3],[1,-1],[1,-5],[0,-4]],[[4355,6055],[-1,0],[-1,3],[0,4],[1,4],[2,0],[1,-3],[0,-6],[-2,-2]],[[4348,6048],[-2,-6],[-4,1],[-4,9],[0,5],[1,4],[0,5],[2,0],[0,-3],[4,-8],[3,-7]],[[4362,6119],[3,-2],[2,1],[2,-3],[0,-4],[-1,-4],[-3,-3],[-2,0],[-2,3],[2,6],[-1,6]],[[4330,6141],[1,-3],[-1,-1],[-4,2],[-1,-1],[-2,-5],[-2,7],[0,3],[1,1],[3,-2],[5,-1]],[[4363,6143],[-1,-3],[-1,4],[-1,7],[2,2],[1,0],[0,-10]],[[4308,6152],[-4,-1],[-2,2],[1,2],[3,3],[2,-4],[0,-2]],[[4300,6159],[-3,-1],[-1,1],[0,4],[-1,3],[0,2],[6,6],[3,-1],[1,-5],[-1,-3],[-4,-6]],[[2706,5735],[0,-1],[-2,-2],[0,-1],[-3,2],[-2,3],[-1,-1],[0,-4],[-1,-2],[-2,-1],[0,-23],[2,0],[3,-4],[1,-2],[0,-3],[-4,-6],[-1,-3],[2,-6],[0,-11],[-5,-6],[0,-2],[2,-3],[2,-7],[0,-4]],[[2697,5648],[-2,7],[-2,6],[-3,3],[0,9],[-1,5],[-3,4],[-3,3],[-2,0],[1,-5],[4,-9],[0,-4],[-3,1],[-4,2],[-2,2],[-4,7],[3,7],[1,4],[0,9],[-1,5],[-7,14],[-6,6],[-3,4],[-8,4],[-2,2],[-3,8],[1,5],[-2,6],[-9,13],[-4,5],[-2,3],[1,-9],[2,-5],[7,-7],[0,-4],[-3,-7],[-2,-2],[0,-4],[-1,-1],[-6,13],[-8,6],[-2,3],[-3,10],[-1,9],[0,6],[4,10],[1,4],[-1,2],[1,4],[-2,3],[-3,3],[-2,3],[0,1],[4,4],[0,4]],[[2617,5820],[2,2],[1,4],[1,2],[1,0],[1,-2],[5,-3],[5,-4],[8,-5],[3,3],[2,3],[2,0],[4,-4],[3,-1],[1,1],[3,-5],[1,-3],[0,-3],[1,-1],[2,0],[5,-2],[3,0],[3,3],[1,2],[1,5]],[[2676,5812],[1,-2],[0,-4],[1,-4],[3,-16],[3,-9],[6,-15],[3,-3],[4,-13],[2,-2],[1,-4],[5,-3],[1,-2]],[[2706,6426],[-8,-8],[-3,0],[-3,2],[-2,3],[-1,4],[4,-2],[1,2],[-3,11],[3,9],[8,-3],[4,-15],[0,-3]],[[2842,6448],[-1,-2],[-4,4],[-2,3],[0,3],[8,-2],[-1,-6]],[[2836,6458],[-4,2],[-1,2],[2,2],[3,-1],[1,-4],[-1,-1]],[[2832,6467],[-1,-1],[-1,2],[-2,1],[-2,3],[-1,3],[2,1],[3,-3],[1,-5],[1,-1]],[[2815,6482],[4,-1],[1,1],[3,-1],[2,-4],[-2,-1],[-2,1],[-4,0],[-4,4],[2,1]],[[2795,6489],[0,-2],[-5,4],[-2,5],[1,1],[6,-8]],[[2726,6517],[7,-2],[6,1],[3,1],[0,-2],[2,-4],[5,2],[10,1],[3,-5],[5,-4],[3,-1],[2,1],[3,0],[3,-4],[4,1],[-1,-4],[5,-5],[4,-9],[2,-4],[5,-6],[3,-1],[9,0],[4,-2],[0,1],[16,-15],[4,-8],[3,-4],[9,-8],[2,1],[-3,5],[0,1],[3,-1],[5,-9],[4,-4],[-1,-3],[-5,1],[3,-4],[0,-3],[2,-1],[1,4],[2,3],[4,-8],[3,-3],[-1,-4],[4,2],[2,-5],[5,0],[6,-3],[5,-5],[5,-2],[5,0],[2,-3],[1,-3],[-2,-6],[2,-3],[-4,-2],[0,-4],[1,-2],[2,2],[3,-1],[5,-1],[4,0],[7,-2],[2,-1],[6,-8],[4,-8],[4,-3],[4,0],[2,-2],[1,-3],[-1,-4],[-2,-5],[-5,0],[-6,-1],[-9,-6],[-1,-2],[-3,-1],[-2,3],[-1,-2],[-2,-2],[-7,0],[-6,4],[-11,2],[-3,0],[-7,-2],[-8,-1],[-3,-1],[-3,-2],[-6,0],[-7,-2],[-7,0],[5,13],[9,13],[2,2],[2,6],[-3,7],[-1,4],[-3,2],[-4,1],[-3,0],[-7,1],[-4,0],[-4,3],[-5,10],[-3,2],[-2,5],[-1,14],[-1,7],[-2,6],[-5,6],[-10,-4],[-3,0],[-2,2],[-16,9],[-6,5],[-5,6],[-2,5],[-2,3],[-1,-1],[-13,0],[-3,2],[-3,6],[-1,-3],[-4,-3],[-2,5],[-10,1],[-5,5],[-3,6],[3,2],[6,2],[2,4],[0,4],[-1,2],[-5,3],[-23,0],[-3,-5],[-5,-5],[-3,-7],[-2,-2],[-5,-8],[-3,-2],[-3,1],[-1,-1],[-7,-1],[-2,-4],[-1,-7],[-1,-2],[-6,-2],[-6,-7],[-1,0],[0,8],[-2,1],[-2,-1],[-4,-5],[-3,1],[1,2],[10,9],[2,-1],[2,1],[1,2],[-2,10],[1,7],[2,6],[7,11],[22,17],[2,1],[14,4],[2,1],[7,5],[7,2],[7,-2]],[[3089,5878],[-1,-1],[-5,6],[-5,9],[0,4],[1,0],[1,-2],[2,-6],[5,-4],[2,-6]],[[2739,6298],[2,-1],[0,2],[5,-1],[0,-3],[-3,0],[-2,-2],[-3,1],[1,4]],[[2778,6318],[-2,0],[-2,-2],[0,2],[1,1],[3,0],[0,-1]],[[5943,7203],[-3,2],[-2,-3],[-4,-2],[-1,1],[-3,0],[-1,-2],[-1,1],[0,5],[-2,4],[-1,-1],[-3,0],[-1,1],[-3,-1],[-5,-4],[-1,0],[-4,4],[0,1]],[[5908,7209],[1,-1],[3,2],[2,5],[0,7],[5,-2],[5,-1],[4,0],[4,1],[13,7],[4,4],[6,4],[1,-2],[-14,-17],[-1,-5],[0,-4],[2,-4]],[[5943,7203],[2,-4],[-7,-2],[-3,1],[-5,-10],[-3,-3],[-3,-2],[-7,-2],[-1,-3],[0,-4],[-2,1],[-2,5],[-5,-1],[-5,3],[-3,4],[-2,11],[-1,7],[3,-2],[2,2],[2,4],[3,2],[2,-1]],[[5522,8035],[-2,-1],[-4,0],[-6,-6],[-1,-3],[-6,-5],[-1,-4],[0,-4],[-1,-3],[-4,-3],[-1,-2],[-4,-5],[-3,-2],[-4,-1],[-6,1],[-3,1],[-3,-5],[-3,-10]],[[5383,7992],[-4,7],[-4,4],[-3,0],[-1,3],[-3,5],[-2,1],[-2,3],[-3,6],[-3,4],[-3,0],[-4,4],[-3,10],[-2,3],[-2,5],[-1,1],[4,8],[-2,5],[-5,5],[-2,3],[-3,10],[1,2],[3,-4],[1,-3],[1,1],[1,4],[3,4],[3,3],[2,0],[4,2],[5,-1],[2,4],[4,2],[2,3],[3,2],[3,1],[3,5],[4,0],[11,7],[2,2],[5,2],[0,1],[-3,3],[1,4],[6,-2],[2,-5],[1,0],[0,-4],[4,-2],[1,3]],[[5410,8113],[3,0],[2,1],[0,8],[8,-4],[0,-4],[2,-4],[4,-1],[5,-3],[2,0],[4,-4],[2,0],[2,-4],[1,1],[6,2],[4,-4],[-1,-4],[-3,-2],[-2,-3],[2,-3],[6,-7],[3,-8],[2,-1],[2,1],[1,2],[3,3],[3,2],[-2,6],[-1,5],[7,-3],[8,-7],[4,0],[4,3],[1,-4],[-1,-3],[-3,-2],[6,-10],[4,1],[2,2],[5,-4],[2,-3],[2,1],[4,-1],[2,-2],[0,-7],[6,-8],[1,-6]],[[5394,8291],[-1,-2],[1,-3]],[[5394,8286],[-5,0],[-3,1],[-1,3],[1,3],[-3,4],[0,4],[6,-5],[5,-5]],[[5312,8318],[-4,0],[-2,2],[1,4],[4,-2],[1,-4]],[[5380,8316],[0,-6],[-3,3],[-4,0],[-1,-5],[-2,0],[-5,4],[-1,4],[1,9],[2,2],[0,3],[2,4],[3,0],[2,-5],[4,-2],[1,-3],[-3,-4],[1,-2],[3,-2]],[[5238,8335],[-2,-2],[-2,0],[-2,2],[2,2],[3,0],[1,-2]],[[5395,8278],[1,-6],[0,-4],[3,-16],[0,-5],[-1,-5],[-2,-4],[-3,-3],[-2,-6],[4,-6],[7,-7],[3,-7],[-2,-10],[2,-5],[2,-1],[0,-8],[2,-2],[-2,-7],[0,-3],[-2,-4],[0,-4],[3,-6],[0,-8],[5,-3],[3,-13],[-1,-9],[-5,-13]],[[5211,7925],[-2,0],[-1,4],[0,6],[2,8],[0,9],[1,5],[4,15],[1,8],[1,5],[8,13],[0,6],[-9,4],[-6,1],[-4,5],[-7,-2],[-2,1],[-3,0],[-1,3],[-3,2],[-3,-4],[-1,1],[-3,7],[-3,6],[-2,3],[-3,1]],[[5175,8032],[0,3],[1,5],[2,5],[1,1],[0,6],[-4,2],[-4,4],[-2,4],[0,8]],[[5165,8106],[2,9],[-1,3],[-4,3],[0,2],[2,0],[5,6],[-1,2],[0,3],[3,10],[0,5],[-3,6],[-1,4],[-3,6],[0,2],[6,5],[6,-3],[4,1],[6,3],[2,4],[-3,5],[8,8],[1,4],[0,6],[-1,4],[-4,0],[-3,1],[-1,2],[0,6],[1,2],[8,0],[0,1],[4,18],[1,2],[0,16]],[[5199,8252],[-1,3],[-3,3],[0,6],[1,4],[3,6],[2,1],[10,1],[10,0],[5,-9],[-2,-4],[3,-2],[2,4],[1,6],[4,-3],[2,0],[-1,7],[1,6],[2,5],[8,-2],[9,1],[3,-2],[7,-12],[2,0],[-9,14],[-3,2],[-7,2],[-2,5],[0,15],[-3,3],[-4,-1],[0,6],[5,1],[4,3],[0,4],[-2,3],[-6,11],[0,7]],[[5240,8346],[5,0],[1,-1],[8,-3],[2,-2],[2,0],[8,3],[4,-2]],[[5270,8341],[0,-1],[4,-1],[3,-7],[1,-5],[-5,-6],[8,1],[0,-2],[2,-3],[4,2],[10,-7],[6,3],[2,0],[1,-5],[-1,-6],[-6,-6],[1,-4],[2,-1],[5,1],[9,-4],[1,2],[7,8],[3,2],[8,1],[2,4],[4,3],[2,4],[5,7],[13,-4],[3,-7],[9,-8],[7,0],[3,-7],[1,-10],[2,-3],[3,-2],[6,-2]],[[5230,8339],[-1,7],[3,-1],[7,0],[-1,-2],[-7,-1],[-1,-3]],[[6191,5817],[-4,0],[-1,2],[-2,2],[-3,1],[-7,-5],[-7,-2],[-3,-2],[-2,1],[-2,2],[-1,12],[0,23],[1,5],[0,3],[4,7],[1,3],[5,13],[3,11],[3,8]],[[6176,5901],[2,4],[1,-1],[5,-8],[1,0],[2,3],[1,8],[2,3],[3,3],[4,2]],[[6197,5915],[0,-2],[5,-12],[3,-16],[-2,-9],[-2,-3],[-6,-8],[-7,-6],[-5,-10],[-3,1],[1,-4],[1,-1],[2,1],[3,3],[4,2],[4,0],[3,-2],[2,-3]],[[6200,5846],[-2,-8],[-3,-10],[-4,-11]],[[3297,6062],[-3,-2],[-1,10],[-2,8],[1,4],[0,2],[4,-3],[1,-3],[1,-9],[-1,-7]],[[5315,8345],[4,-4],[4,1],[3,-4],[0,-5],[-3,-2],[-2,1],[-4,-2],[-11,8],[0,10],[6,0],[3,-3]],[[5290,8342],[-4,1],[0,3],[5,-3],[-1,-1]],[[5348,8349],[-2,-1],[-4,1],[-5,-4],[-1,4],[3,3],[1,3],[7,-4],[1,-2]],[[5278,8345],[-2,-1],[-5,2],[-1,9],[2,0],[5,-5],[1,-5]],[[5297,8337],[-1,0],[-2,4],[0,2],[3,6],[4,5],[1,6],[1,0],[-1,-5],[-5,-18]],[[5418,8352],[-1,-1],[-5,2],[-5,4],[1,8],[1,3],[10,-8],[0,-4],[-1,-4]],[[5295,8386],[2,-9],[3,-7],[-1,-3],[0,-8],[-5,-5],[-5,0],[-5,2],[-8,5],[-3,11],[0,9],[4,1],[8,4],[2,0],[2,-3],[2,0],[3,4],[1,-1]],[[5351,8386],[-3,-3],[-1,4],[2,3],[2,-4]],[[5294,8396],[-3,0],[0,4],[1,3],[-1,3],[1,2],[3,-6],[-1,-6]],[[5348,8396],[0,-5],[-2,-3],[-5,-3],[-2,-3],[-1,-4],[2,-3],[3,-2],[1,-5],[-3,-3],[-6,-3],[-1,-7],[0,-14],[-6,-3],[-3,8],[0,4],[-1,3],[0,4],[-1,5],[-7,2],[-4,-1],[-3,7],[1,8],[-2,4],[0,4],[-3,2],[-1,5],[2,1],[5,-1],[2,2],[4,7],[1,4],[4,0],[2,-2],[-1,-5],[1,-6],[3,-2],[1,5],[2,3],[0,6],[-1,2],[4,5],[5,4],[3,0],[6,-2],[2,-3],[-2,-5],[1,-10]],[[5306,8481],[-1,-1],[-4,2],[2,2],[6,1],[-3,-4]],[[5240,8346],[0,4],[-3,9],[3,1],[-1,10],[-1,5],[-13,11],[1,17],[1,5],[-2,9],[0,10],[1,17],[3,0],[5,-3],[3,0],[1,-3],[2,-1],[2,8],[4,6],[5,4],[2,-3],[2,3],[1,12],[-4,2],[-3,-2],[-3,-7],[-3,-9],[-5,-1],[-4,-3],[-5,5],[0,6],[4,8],[5,7],[6,0],[4,2],[9,0],[4,1],[3,4],[8,14],[4,6],[8,2],[6,2],[-1,-5],[3,-7],[-1,-4],[0,-8],[-2,-4],[-4,-10],[0,-21],[2,-4],[3,-2],[10,0],[2,-5],[0,-5],[-1,-3],[-7,-6],[-2,0],[-3,5],[-3,-4],[-3,-12],[-1,-8],[-5,1],[-3,-2],[2,-2],[1,-4],[-6,-5],[-1,-3],[-5,-6],[3,-13],[-1,-4],[-4,-5],[-1,-5],[3,1],[2,-1],[2,-4],[1,-8]],[[3006,6222],[0,18],[-3,4],[-2,6],[-2,5],[4,0],[3,7],[1,4],[0,3],[-2,4],[0,4],[1,3],[3,5],[0,4],[-3,5],[0,2],[1,6],[0,4],[-1,11],[-1,2]],[[3005,6319],[2,1],[0,3],[1,4],[3,2],[4,0],[4,-3],[1,1],[8,3],[4,-1],[1,-2],[4,-5],[6,0],[3,-5],[3,-3],[2,0],[3,2],[2,0],[2,-4],[0,-7],[2,-6],[2,-4],[11,2],[3,-4],[-2,-4],[-8,1],[-1,-3],[0,-3],[3,0],[4,-1],[6,-4],[7,-2],[6,-5],[7,-11],[2,-2],[1,-4],[-3,-11],[-1,-2],[-2,-1],[-2,-3],[-1,-5],[-1,-1],[-2,3],[-1,5],[-4,4],[-3,-1],[-6,2],[-4,-1],[-3,0],[-7,2],[-3,-2],[-4,-2],[-3,-6],[-1,-1],[-9,-2],[-2,2],[-2,4],[-3,1],[-5,-3],[-3,-1],[-1,-2],[0,-7],[-5,-16],[-3,-9],[-2,-3],[-2,5],[-2,2],[-2,1],[0,7],[-2,6],[-1,2]],[[5263,6924],[-5,-6],[2,-7],[7,-21],[1,-4],[2,-11],[1,-11],[1,-4],[0,-32],[1,-29],[1,-15],[-2,-14],[-2,-12],[0,-7],[1,-10],[1,-7],[2,-4],[0,-13],[-1,-4],[-5,-7],[-5,-6],[-2,-5],[0,-10],[4,-10],[6,-16],[6,-17],[0,-4],[1,-12],[2,-15],[3,-6],[1,-5],[2,-4],[3,-3],[7,4],[12,-6],[11,-7],[0,-2],[3,-8],[7,-26],[2,-10]],[[5331,6538],[-14,-18],[-14,-17],[-15,-18],[-14,-17],[-15,-18],[-14,-18],[-14,-17],[-15,-18],[-9,-11],[-6,-11],[-8,-13],[-7,-12],[-13,-24],[-4,-6],[-8,-15],[-2,-2],[-11,-5],[-10,-4],[-9,-3],[-7,-3],[-6,-2]],[[5116,6286],[-8,-4],[-7,-2],[-6,-3],[-4,0],[-2,1],[-4,8],[1,4],[2,6],[0,2],[1,1],[0,6],[-1,5],[0,13],[-2,4],[-4,3],[-3,3],[-6,2],[-5,2],[-2,2],[-4,8],[-1,3],[-8,1],[-3,1],[-2,2],[-2,3],[-2,8],[0,2],[-9,9],[-4,6],[0,5],[1,5],[-1,4],[0,3],[-4,5],[-9,13],[-9,12],[-10,12],[-9,13],[-18,24],[-9,13],[-18,24],[-9,13],[-18,24],[-9,13],[-10,12],[-9,12],[-16,23],[-9,11]],[[4865,6623],[-6,8],[-7,8],[-6,9],[-5,5],[-5,6],[-5,7],[-5,6],[-6,6],[-5,7],[-5,6],[-5,7],[-5,6],[-6,6],[-5,7],[-10,12],[-11,13],[-5,7],[-5,6]],[[4758,6755],[0,21]],[[4758,6776],[0,27],[0,34],[3,3],[5,7],[1,3],[2,3],[8,8],[1,3],[9,11],[4,1],[2,2],[5,9],[4,3],[13,-4],[2,2],[1,4],[0,8],[1,1],[3,-1],[4,0],[2,1],[11,3],[9,5],[4,6],[3,6],[3,9],[3,8],[5,5],[7,4],[6,5],[5,6],[4,6],[8,2],[2,3],[0,4],[-1,2],[-3,3],[-1,0],[0,9],[1,3],[0,4],[-2,4],[0,7],[2,4],[5,-1],[4,1],[12,8],[1,2],[2,10],[1,2],[10,3],[8,-1],[4,0],[8,-1],[15,0],[1,1],[0,3],[-1,6],[1,4],[4,7],[-1,5],[-5,7],[-2,2],[-4,10],[-1,11],[-4,14],[2,15],[-3,12],[0,4],[1,8],[0,11],[-3,11],[2,7],[-3,7],[1,8],[-3,5],[-8,11],[-1,4]],[[4937,7205],[6,-1],[3,1],[7,5],[5,7],[4,3],[4,8],[3,5],[5,5],[13,11],[2,0],[5,-3],[4,1],[2,4],[3,9],[10,12],[8,5],[5,5],[8,5],[20,3],[10,2],[7,-1],[7,8],[4,3],[15,1],[7,5],[27,0],[3,-1],[4,-4],[5,-7],[3,-2],[4,2],[8,7],[9,4],[6,4],[2,6],[4,2],[3,-4],[9,-5],[6,1],[3,2],[-1,7],[6,-2],[5,-4],[5,-6],[4,-2],[6,3],[12,2]],[[5237,7311],[1,-3],[0,-3],[-4,-4],[-3,-8],[-3,-5],[-1,-3],[3,-2],[1,-5],[-2,-18],[-1,-11],[0,-4],[2,-8],[0,-15],[2,-11],[-2,-7],[-1,-6],[-1,-9],[0,-5],[-1,-5],[-2,-5],[-5,-5],[-3,-4],[-3,-9],[-5,-7],[-1,-3],[-1,-6],[0,-8],[1,-7],[3,-9],[3,-16],[1,-3],[8,-8],[4,-9],[3,-13],[0,-9],[6,-7],[4,-7],[5,-5],[5,-6],[0,-2],[2,-13],[1,-13],[2,-15],[2,-14],[3,-26],[2,-12],[1,-14]],[[2773,5012],[0,-2],[-3,0],[-1,1],[0,2],[1,8],[1,4],[2,3],[2,2],[2,-1],[3,-3],[-3,-5],[-3,-2],[-1,-7]],[[2487,5106],[-1,0],[-1,2],[1,5],[2,-2],[1,-2],[-2,-3]],[[2515,5131],[-3,-3],[-2,4],[2,4],[2,2],[1,4],[3,2],[2,-1],[0,-2],[-1,-3],[-2,-2],[-2,-5]],[[2490,5139],[-2,0],[-4,5],[0,6],[2,3],[6,2],[2,-3],[0,-7],[-2,-4],[-2,-1],[0,-1]],[[2460,5157],[-3,-1],[-2,2],[-2,7],[1,2],[5,2],[1,-4],[0,-8]],[[2483,5164],[-1,-2],[-5,2],[-2,4],[1,4],[2,2],[3,-2],[3,-5],[-1,-3]],[[2464,5185],[2,-4],[1,-11],[5,-11],[1,-6],[-1,-3],[1,-1],[2,-4],[2,-5],[-3,-11],[-6,-4],[-7,0],[-1,1],[-2,4],[0,4],[1,3],[3,6],[5,4],[1,4],[-2,4],[-1,7],[-4,5],[-1,15],[-2,1],[-2,-2],[-1,2],[3,6],[3,2],[2,-2],[1,-4]],[[2807,5255],[-1,0],[-1,3],[3,4],[-1,-7]],[[2908,5177],[-2,-2],[-3,-1],[-3,2],[-2,0],[0,-2],[2,-2],[2,-3],[2,-9],[3,-6],[2,-3],[0,-2],[-1,-3],[0,-3],[1,-15],[-3,0],[-1,1],[-1,-1],[-1,-6],[-1,-15],[-2,-12],[-2,-4],[-3,-7],[-4,-10],[-5,-14],[-5,-6],[-3,-5],[-4,-6],[-5,-7],[-5,-5],[-8,-5],[-6,-5],[-4,-2],[-4,-3],[-6,-4],[-2,-4],[-3,-9],[-2,-5],[-2,-4],[0,-3],[1,-1],[0,-2],[-2,-2],[0,3],[-1,3],[-2,0],[0,-2],[-2,-10],[0,-10],[-2,-4],[0,-3],[-2,-5],[0,-3],[-1,-7],[-2,-10],[0,-11],[-2,-4],[-5,-7],[0,-9],[-2,0],[0,-2],[-1,-4],[-1,-1],[-3,2],[-3,0],[-1,1],[-2,6],[-2,4],[-1,5],[-1,8],[-3,5],[-4,-2],[-5,5],[-3,4],[-2,2],[-1,-1],[-3,-6],[-3,-3],[-1,0],[-2,4],[2,4],[2,7],[-3,0],[-1,2],[0,9],[2,2],[2,-1],[2,0],[1,3],[2,2],[0,2],[-1,5],[0,10],[-1,2],[0,5],[-1,2],[0,3],[-1,1]],[[2768,4988],[5,4],[1,3],[2,2],[2,4],[1,4],[3,18],[3,12],[-1,5],[-2,8],[-1,10],[1,4],[-1,2],[-1,-4],[0,-16],[-1,-7],[-2,-2],[-1,1],[1,12],[-1,-2],[-3,-8],[-3,-6],[0,-2],[-1,-3],[-5,5],[-6,13],[-4,3],[-3,5],[0,2],[-1,2],[3,3],[3,4],[0,14],[-2,11],[1,15],[-1,5],[-2,12],[2,6],[6,5],[2,2],[1,10],[1,6],[2,0],[-2,8],[0,4],[4,12],[2,3],[3,6],[3,9],[0,15],[-1,10],[0,11],[1,3],[4,2],[3,3],[1,4],[4,-1],[4,5],[6,3],[10,6],[2,5],[-1,9]],[[5950,6981],[2,-12],[2,-10],[3,-13],[1,-6],[0,-3],[4,-15],[2,-12],[1,-10],[3,-14],[0,-5]],[[5968,6881],[-1,-2],[-3,-10],[-4,-29],[-4,-23],[-1,-15],[-1,-5],[-2,-7],[-3,-8],[-4,4],[-8,13],[-5,12],[-5,8],[-5,10],[-1,7],[0,5],[-3,17],[-6,12],[-4,14],[-2,16],[-2,10],[-3,-3],[0,-4],[-2,-6],[-1,-7],[1,-6],[4,-8],[3,-12],[-1,-11],[1,-4],[4,-8],[2,-9],[4,-10],[5,-14],[5,-9],[3,-4],[2,-5],[0,-17],[3,-10],[1,-5],[3,-4],[1,-5],[1,-8],[2,-23],[3,-5],[7,-31],[7,-19],[3,-14],[5,-18],[10,-38],[5,-12],[2,-6],[4,-6],[5,-7],[-4,1],[-3,-2],[-1,-4],[0,-4],[1,-19],[1,-10],[4,-19],[2,-6],[2,-3],[1,-3],[9,-6],[5,-14],[12,-17],[1,-6]],[[6023,6450],[-9,0],[-18,0],[-18,0],[-19,0],[-18,0],[-18,0],[-18,0],[-19,0],[-14,0],[2,9],[-1,2],[-2,1],[-1,-1],[-3,-10],[-1,-1],[-14,0],[-11,0],[-21,0],[-21,0],[-21,0],[-22,0],[-21,0],[-21,0],[-21,0]],[[5693,6450],[0,26],[0,26],[0,26],[0,26],[0,26],[0,25],[0,39],[0,26],[0,26],[0,39],[0,26],[0,38],[0,39],[0,29],[-2,8],[-1,11],[-2,14],[0,5],[-3,14],[0,4],[5,15],[1,5],[2,13],[-2,9],[-2,15],[0,8],[2,5],[3,5],[2,7],[2,2]],[[5698,7007],[2,-7],[4,-2],[14,7],[16,-7],[8,-2],[14,-5],[8,-10],[2,-1],[6,0],[4,-6],[15,-2],[8,-6],[7,-7],[3,0],[3,2],[9,9],[9,12],[4,2],[4,0],[3,5],[2,6],[5,1],[10,5],[-1,-2],[-9,-6],[4,-1],[8,4],[1,2],[0,5],[1,1],[3,-1],[10,-8],[2,0],[8,5],[2,-2],[5,-10],[-2,1],[-5,8],[-1,-4],[-3,-7],[4,-3],[3,-1],[2,-4],[1,-4],[3,2],[2,4],[-2,6],[3,-2],[6,-9],[2,-2],[2,0],[5,3],[1,-1],[6,4],[2,-5],[5,2],[8,0],[7,3],[8,8]],[[5949,6987],[1,-6]],[[6114,6087],[1,-3],[2,2],[0,2],[4,-4],[0,-3],[-3,0],[-3,1],[-2,-1],[-4,2],[0,4],[2,-2],[1,1],[-2,4],[-2,0],[0,3],[2,2],[-1,3],[2,0],[2,-2],[1,-3],[0,-6]],[[6112,6110],[1,-6],[-3,2],[1,4],[1,0]],[[6176,5901],[-4,12],[-3,6],[-2,3],[-3,3],[-2,9],[-3,9],[-4,7],[-7,11],[-7,13],[-5,15],[-3,7],[-2,2],[-6,5],[-5,6],[-4,6],[-2,1],[-2,0],[-5,-1],[-4,3],[-4,1],[-2,2],[-2,-2],[-5,-2],[-2,0],[-1,4],[-3,5],[-1,0],[-1,-3],[-5,-6],[-9,-3],[-2,0],[-1,3],[-4,10],[-2,2],[-3,1],[-3,6],[-2,3],[-5,-23],[-1,-8],[-2,-10],[-2,1],[-7,17],[-2,-1],[-2,-2],[-2,-7],[-1,-1],[-6,3],[-3,-1],[-4,-2],[-1,-1]],[[6013,6004],[0,17],[-2,23],[0,11],[2,7],[2,6],[3,21],[1,4],[2,12],[1,3],[2,14],[0,19],[2,10],[0,4],[1,9],[0,2],[4,-1],[3,1],[4,0],[1,3],[2,10],[1,2],[3,3],[3,5],[3,1],[2,2],[2,1],[2,0],[2,1],[0,1],[2,0],[0,1],[2,3],[2,5],[0,3],[1,3],[3,7],[2,3]],[[6071,6220],[9,-33],[6,-40],[2,-31],[3,-16],[3,-7],[2,-15],[2,-1],[2,-4],[2,-13],[2,-6],[1,5],[0,2],[-1,5],[1,5],[1,3],[5,-7],[1,-7],[0,-4],[4,-8],[2,-2],[4,-1],[6,-4],[4,-9],[11,-7],[8,-21],[5,-15],[16,-23],[3,-11],[2,-11],[3,1],[6,-12],[2,-9],[4,-3],[1,5],[3,-4],[1,-7]],[[4502,6785],[-3,-9],[-4,4],[0,2],[3,1],[3,4],[1,-2]],[[4571,6805],[0,-5],[1,-4],[0,-7],[-2,-4],[-3,-4],[-3,1],[-4,8],[0,6],[2,4],[1,5],[7,-1],[1,1]],[[4522,6797],[-3,1],[-1,5],[2,5],[1,0],[2,-3],[1,-4],[-2,-4]],[[4545,6818],[-2,-13],[-3,-7],[-4,-2],[-3,9],[-2,8],[-2,3],[2,2],[3,-1],[5,2],[7,9],[5,1],[0,-3],[-6,-8]],[[4605,6806],[-4,-7],[-4,2],[7,7],[2,11],[4,18],[1,2],[3,0],[1,-3],[0,-6],[-1,-10],[-2,-9],[-7,-5]],[[4504,6824],[-1,0],[-1,5],[-3,11],[2,5],[4,0],[2,-7],[-1,-2],[0,-7],[-2,-5]],[[4618,6849],[-2,-4],[-2,1],[1,8],[1,3],[4,4],[3,1],[1,4],[1,1],[1,-2],[-1,-3],[0,-8],[-2,-3],[-5,-2]],[[5043,7411],[-5,0],[0,4],[1,1],[4,-5]],[[5039,7425],[-1,-4],[-5,3],[1,4],[1,1],[1,5],[6,3],[2,-2],[0,-3],[-3,-6],[-2,-1]],[[5086,7475],[3,-2],[3,2],[3,-2],[0,-3],[-1,-4],[-4,-9],[-1,-5],[-2,-3],[-3,-2],[-4,4],[-4,2],[-1,6],[-1,2],[-2,1],[-1,-2],[-3,-3],[-1,3],[-2,3],[0,2],[11,14],[4,3],[7,4],[1,-1],[-1,-3],[1,-3],[-2,-4]],[[5118,7478],[0,-1],[-9,7],[-3,1],[0,6],[6,1],[4,-3],[3,-7],[-1,-4]],[[4949,7683],[0,-2],[2,-3],[3,-2],[2,0],[4,-2],[0,-3],[-2,-5],[0,-3],[3,-1],[0,2],[2,2],[0,-3],[10,-6],[5,0],[0,-2],[5,-7],[1,1],[2,-1],[5,2],[4,-4],[3,-4],[7,2],[1,-2],[3,1],[4,-1],[4,0],[0,7],[1,2],[2,0],[10,-6],[5,-2],[4,-6]],[[5046,7631],[5,-2],[2,-2],[1,-4],[1,0],[5,4],[5,-2],[5,-3],[3,0],[0,3],[4,2],[2,2],[2,0],[7,-2]],[[5088,7627],[3,-8],[-4,-2],[0,-7],[2,-1],[0,-10],[-3,-5],[-4,-5],[-19,-17],[-4,-9],[-2,-2],[-14,-5],[-15,-8],[-6,-9],[-3,-4],[2,-1],[3,-5],[-1,-2],[-4,-3],[-3,-1],[-7,-17],[-6,-13],[-3,-5],[-3,-8],[-7,-20],[0,-6],[3,-21],[2,-5],[3,-5],[5,-3],[2,-4],[-2,-4],[-5,-6],[-10,-9],[-3,-7],[-1,-6],[-3,-3],[-1,-9],[-2,-7],[0,-2],[-2,-4],[0,-4],[3,-4],[-1,-2],[-5,-2],[-11,0],[-9,-10],[-4,-9],[-4,-17],[-5,-9],[-2,-2],[-3,4],[-4,1],[-4,-2],[-2,-3],[-3,-2],[-4,2],[-6,1],[-4,-1],[-4,-2],[-4,1],[-7,1],[-15,-2],[-2,-1],[-2,-4],[-5,-7],[-7,0],[-7,-5],[-4,-11],[-1,-5]],[[4850,7265],[-2,1],[-1,-5],[-4,-3],[-5,4],[-5,5],[-2,1],[-5,13],[-1,6],[0,4],[-3,3],[-1,5],[2,7],[-2,-1],[-2,7],[-11,14],[-1,1],[-2,-1],[-5,0],[-7,-1]],[[4793,7325],[-1,14],[-1,6],[0,3],[1,8],[2,4],[2,7],[3,5],[5,3],[2,8],[-4,-1],[-7,16],[0,3],[2,8],[0,4],[1,3],[3,4],[2,4],[2,9],[-2,3],[-3,1],[-4,12],[-1,8],[-3,4],[-2,6],[2,2],[9,0],[3,2],[3,13],[0,7],[-3,4],[0,4],[4,6],[2,2],[-1,4],[0,12],[1,2],[-1,7],[0,6],[-2,7],[0,2],[4,4],[2,6],[4,5],[4,4],[5,9],[0,4],[-2,3],[-5,1],[-2,1],[0,11],[-2,4],[-6,1],[-1,-1],[-6,1],[-2,1],[-1,-1],[0,-4],[-6,-3],[-3,0],[-5,3],[-5,-1],[-1,1],[-5,-4],[-2,0],[-1,6],[2,5],[-2,7],[-3,-1],[-8,-4],[-5,-6]],[[4755,7599],[-2,-1],[-1,1],[0,9],[3,7],[3,3],[-1,1],[-3,0],[0,3],[3,4],[-2,1],[-1,3],[0,5],[1,2],[-1,2],[-5,-3],[-1,1],[0,4],[3,6],[0,1],[-3,1],[-3,3],[-3,7],[0,3],[2,8],[9,9],[5,-1],[4,1],[3,3],[5,3],[0,4],[-1,2],[1,2],[7,7],[4,1],[4,3],[3,-2],[3,1],[6,-9],[6,-2],[4,2],[8,0],[4,-1],[7,2],[4,-1],[7,3],[5,-3],[9,-2],[6,-3],[16,-5],[6,0],[8,3],[4,2],[3,-1],[5,2],[2,-1],[3,-3],[10,-5],[3,4],[2,1],[8,-2],[7,-5],[4,0],[6,1],[4,3],[1,0]],[[5627,8560],[2,-2],[4,2],[4,-1],[9,-7],[1,-2],[-6,-1],[-2,-4],[-2,0],[-2,-3],[-4,-3],[-1,-2],[-6,1],[-4,-1],[-2,-4],[-4,-11],[-2,-2],[-2,0],[-1,2],[6,11],[-2,1],[-6,5],[-1,2],[2,1],[2,4],[-4,7],[2,1],[4,-2],[3,2],[2,-1],[2,4],[6,3],[2,0]],[[5647,8556],[-2,-1],[-5,4],[2,4],[5,-2],[1,-4],[-1,-1]],[[5636,8572],[-3,-3],[-2,2],[-3,-6],[-3,-1],[-2,1],[0,2],[-2,7],[-2,2],[-4,0],[-3,2],[11,2],[3,6],[2,1],[2,-1],[0,-4],[5,-1],[2,-4],[1,-5],[-2,0]],[[5777,8609],[2,-1],[2,-5],[-3,-2],[-1,-2],[-3,-1],[-1,-5],[-3,-8],[-4,-7],[-3,-3],[-2,-6],[0,-3],[3,-17],[0,-3],[-2,-6],[3,-8],[3,-12],[3,-4],[-7,-4],[-1,-4],[-3,-3],[-1,-3],[0,-5]],[[5759,8497],[-5,0],[-6,4],[-4,-1],[-8,-3],[-7,4],[-2,4],[-5,7],[-1,3],[-6,1],[-2,3],[-4,2],[-6,5],[-2,1],[-1,-3],[-4,4],[-5,-4],[-4,-1],[-9,-4],[-2,-3],[-1,1]],[[5675,8517],[0,2],[3,11],[1,9],[2,3],[-1,2],[-5,2],[-1,-3],[-5,-4],[-3,3],[-7,3],[-2,4],[0,4],[-4,4],[-1,5],[1,3],[3,2],[1,2],[-5,0],[0,2],[-2,6],[2,5],[-1,1],[1,5],[0,5],[4,3],[4,1],[8,1],[-1,5],[3,0],[6,6],[6,-1],[8,4],[16,0],[2,2],[-1,2],[1,2],[7,0],[19,-4],[5,0],[6,-5],[3,-1],[10,0],[16,-3],[3,4]],[[6191,5817],[0,-2],[-1,-4],[-2,-3],[-4,-13],[0,-3],[2,-4],[2,-14],[1,-3],[2,-4],[3,-7],[1,-5],[3,-3],[1,-6],[3,-9],[2,-8],[5,-8],[2,0],[5,-11],[5,-8],[1,-1],[8,-5],[9,-7],[7,-5],[18,-12],[21,-14],[17,-12],[2,-2],[18,0],[10,0]],[[6332,5644],[-7,-14],[-8,-15],[-8,-17],[-5,-10],[-9,-17],[-7,-13],[-7,-16],[-6,-13],[-9,-19],[-5,-12],[-8,-20],[-6,-12],[-8,0],[-8,1],[-10,1],[-3,-1],[-10,-5],[-11,-11],[-3,-5],[-3,-7],[-1,-5],[-2,-3],[-13,-5],[-3,-1],[-6,-3],[-3,-7],[-1,-3]],[[6162,5412],[-11,0],[-3,-1],[-1,-1],[-3,0],[-2,2],[-2,1],[-6,12],[-3,4],[-6,-5],[-6,-6],[-9,-7],[-4,-6],[-2,-5],[-4,-11],[-3,-6],[-1,-1],[-8,2],[-2,1],[-5,1],[-6,2],[-4,3],[-4,0],[-6,1],[-4,1],[-4,6],[-10,14],[-6,7],[-6,8],[-7,9],[-2,1],[-8,1],[-8,0],[-5,1],[-3,3],[-1,6],[-2,5],[-3,6],[0,8],[1,9],[0,10],[-1,4],[-8,4],[-1,0],[-1,-2],[-2,-1],[-2,3],[0,3],[1,2]],[[5979,5500],[-1,1],[-2,4],[-3,5],[-2,11],[-1,10],[-2,7],[-1,8],[-4,21],[-2,3],[-2,4],[-2,7],[-6,6],[-6,12],[-1,5],[0,4],[-1,4],[-2,4],[-7,9],[-4,2],[-4,1],[-4,2],[-4,4],[-2,3],[0,4],[1,5],[3,13],[2,8],[1,2],[4,1],[4,0],[2,-1],[4,0],[5,1],[2,2],[2,6],[0,36],[-1,12],[1,2]],[[5946,5728],[0,3],[1,13],[1,7],[0,4],[4,15],[0,4],[-1,16],[2,7],[2,8],[2,3],[2,2],[6,-8],[3,4],[1,3],[0,6],[1,11],[0,7],[1,8],[2,12],[0,7],[1,4],[4,8],[3,11],[3,9],[4,13],[3,8],[3,1],[5,1],[3,1],[0,2],[1,3],[0,16],[2,11],[1,7],[1,4],[2,3],[1,6],[1,13],[0,8],[2,15]],[[5600,8645],[-3,0],[-1,3],[4,1],[0,-4]],[[5605,8647],[-2,-2],[-1,4],[2,2],[2,0],[-1,-4]],[[5615,8661],[3,-2],[2,1],[2,-3],[-3,-2],[1,-6],[-3,0],[-2,4],[-3,3],[3,5]],[[5610,8659],[-2,-1],[-3,3],[1,2],[4,-4]],[[5595,8670],[-1,-3],[-3,0],[-2,2],[-1,5],[2,2],[1,-2],[4,-4]],[[5588,8826],[2,-1],[2,2],[2,-1],[-3,-5],[-5,2],[-1,5],[4,0],[-1,-2]],[[5689,8927],[-4,-2],[-3,1],[0,4],[5,2],[3,-3],[-1,-2]],[[5804,9159],[-12,-6],[-4,-1],[1,-2],[7,0],[2,-2],[0,-4],[-8,-13],[0,-3],[2,-8],[4,-9],[18,-7],[5,-8],[8,-10],[5,-4],[-1,-8],[-11,-13],[-9,-13],[-4,-7],[-1,-5],[7,-11],[4,-10],[3,-5],[1,-5],[3,-7],[3,-3],[3,-5],[0,-4],[5,-14],[0,-6],[-10,-2],[-1,-1],[3,-3],[-2,-6],[-1,-7],[-2,-7],[5,-1],[0,-6],[-3,-1],[-3,-5],[1,-5],[4,-6],[8,-2],[2,-7],[-4,-5],[1,-7],[2,-4],[8,-5],[4,-5],[0,-7],[-3,-7],[-6,-9],[-6,-3],[0,-1],[12,-13],[6,-5],[15,-12],[4,-8],[5,-7],[1,-4],[-3,-6],[-1,-5],[-3,-7],[-3,-5],[-7,-9],[-10,-11],[-2,-4],[-5,-6],[-8,-12],[-3,-2],[-6,-10],[-6,-6],[-7,-9],[-7,-6],[-7,-7],[-2,-3],[-3,-2],[-4,-4],[-7,-9],[-10,-12]],[[5771,8670],[-3,-2],[-6,-2],[-7,5],[-4,-2],[-3,-3],[-7,-1],[-5,-2],[0,8],[2,3],[-1,1],[-2,-4],[-1,-5],[-2,-2],[-5,-1],[-5,4],[-2,0],[2,-6],[0,-2],[-2,0],[-6,-4],[-2,3],[-3,-1],[-3,-3],[-5,0],[-3,-4],[-6,-2],[-3,0],[-7,-2],[-2,-4],[-2,-2],[-3,2],[-9,-2],[-8,-3],[-4,0],[-3,1],[-4,-3],[-4,-5],[-6,-1],[1,3],[3,2],[2,4],[-1,4],[-2,0],[-5,9],[-1,-1],[-1,-5],[-2,-3],[-2,-1],[-6,0],[-1,2],[1,8],[3,0],[0,3],[-2,0],[2,6],[-1,1],[-8,1],[-9,6],[-2,0],[-1,5],[-3,0],[-3,-3],[-5,4],[0,5],[-1,4],[0,5],[-1,7],[1,5],[3,7],[1,6],[0,7],[-1,5],[2,0],[-2,4],[3,1],[-4,14],[-2,5],[-4,5],[2,7],[1,6],[-1,7],[-4,4],[-2,12],[1,7],[9,12],[0,5],[5,0],[-2,5],[-1,5],[8,2],[2,-2],[6,2],[6,4],[-2,7],[4,3],[4,5],[0,4],[6,2],[7,8],[7,5],[7,8],[2,0],[2,5],[6,7],[2,1],[2,7],[7,7],[5,10],[2,3],[1,4],[3,0],[2,3],[6,2],[9,-2],[-1,5],[4,4],[-1,5],[-3,2],[2,6],[0,7],[1,7],[-3,4],[-11,6],[-5,1],[-2,5],[1,4],[-1,2],[-5,-5],[-7,2]],[[5670,8974],[-3,10],[-4,9],[-4,3],[-2,3],[0,13],[5,6],[1,8],[2,7],[-3,6],[-5,7],[-2,7],[1,5],[3,2],[-1,7],[-2,1],[-5,0],[-1,1],[3,7],[-2,12],[1,5],[4,4],[-5,4],[-4,6],[-4,1],[-2,7],[-4,3],[-5,5],[-22,7],[-8,5],[-7,5],[-1,2],[-5,3],[-2,3],[-7,4],[-1,4],[-7,4]],[[5572,9160],[1,2],[6,0],[5,-2],[2,2],[-2,6],[2,4],[9,2],[5,-1],[5,-7],[16,-21],[0,-4],[3,0],[16,-2],[2,-2],[5,0],[10,4],[5,5],[4,0],[9,-5],[10,-3],[3,-3],[4,-1],[4,3],[2,7],[5,6],[6,1],[5,6],[1,5],[-1,9],[3,8],[4,16],[9,8],[7,8],[10,0],[5,-1],[7,3],[6,5],[9,1],[4,-5],[6,-6],[4,-3],[20,-9],[6,-11],[-3,-5],[-6,-6],[-5,-6],[1,-7],[3,-2]],[[9957,4090],[-1,-2],[-3,-2],[-2,3],[-2,-4],[-1,-1],[0,-2],[-1,0],[-3,-2],[-2,2],[2,3],[2,0],[3,6],[2,0],[1,2],[3,-1],[2,-2]],[[5,4092],[-1,-1],[0,-2],[-1,0],[0,3],[1,1],[1,-1]],[[9980,4141],[-2,4],[0,3],[1,2],[2,-7],[-1,-2]],[[28,4148],[-2,-1],[-1,3],[1,1],[2,-3]],[[48,4149],[-1,0],[-2,2],[1,3],[2,-3],[0,-2]],[[9966,4162],[-1,-1],[-1,4],[1,3],[1,0],[1,-3],[-1,-3]],[[9951,4183],[0,-3],[1,-1],[2,-5],[5,-7],[0,-6],[1,-5],[0,-6],[1,-8],[-1,-2],[-4,0],[0,-1],[-4,0],[-5,-7],[-2,0],[-3,-1],[-3,1],[-2,2],[-4,2],[-5,2],[-4,4],[-2,6],[0,3],[1,3],[2,3],[0,2],[2,2],[-1,4],[0,3],[6,10],[6,4],[3,-1],[5,4],[2,1],[2,-1],[1,-2]],[[9982,4183],[-1,6],[2,-1],[0,-2],[-1,-3]],[[28,4188],[0,4],[-1,2],[0,2],[2,-2],[0,-4],[-1,-2]],[[9922,4196],[-2,-1],[1,4],[1,2],[1,0],[0,-3],[-1,-2]],[[9999,4206],[-3,-2],[0,2],[1,5],[2,5],[-1,-4],[1,-6]],[[0,4216],[2,5],[1,1],[1,-4],[-1,-5],[-3,-5],[0,8]],[[0,4234],[2,3],[0,-3],[-1,-1],[-1,-2],[0,3]],[[9998,4252],[-4,-8],[-2,-8],[-4,-5],[-2,-6],[1,-6],[3,6],[4,6],[1,1],[1,-2],[0,-2],[-1,-5],[1,-4],[-5,0],[-4,-3],[-3,-1],[-2,0],[-2,2],[0,3],[-1,1],[-3,0],[-4,-6],[-1,-5],[-2,0],[-2,1],[-2,-4],[-2,-2],[-2,4],[0,4],[-1,3],[-3,0],[0,4],[2,3],[0,3],[3,-3],[2,2],[1,0],[2,6],[6,6],[4,1],[4,2],[3,5],[4,4],[3,1],[3,-1],[5,4],[-1,-1]],[[9919,4463],[-2,-1],[-1,2],[1,1],[2,-1],[0,-1]],[[3341,2175],[-2,-1],[-1,2],[0,4],[3,-2],[0,-3]],[[3376,2188],[0,-6],[-2,2],[-1,3],[3,1]],[[3304,2201],[4,-1],[-2,-9],[-2,0],[-3,6],[3,4]],[[3325,2219],[4,-1],[3,4],[5,1],[1,-3],[3,0],[9,5],[3,-4],[-1,-3],[-2,-2],[-2,-4],[-4,-5],[-4,-8],[-5,-9],[-2,-1],[-7,0],[-3,-9],[-3,-1],[-2,-2],[-5,0],[-7,8],[5,6],[5,0],[4,4],[3,2],[1,3],[2,1],[-1,4],[-6,-3],[-3,3],[9,3],[1,1],[-2,3],[-3,2],[-3,4],[0,7],[7,-6]],[[3329,2223],[-3,0],[-1,2],[0,5],[3,0],[3,-2],[-2,-5]],[[3364,2230],[5,-3],[5,1],[2,-1],[2,-3],[-1,-2],[-3,-1],[1,-5],[6,-3],[-1,6],[1,3],[8,2],[1,-1],[3,-7],[-3,-1],[-1,-3],[3,-1],[2,-2],[-1,-4],[-9,-3],[-2,-4],[-3,-2],[-10,-4],[1,-4],[0,-6],[-13,6],[-2,-1],[3,-9],[-2,-1],[-3,1],[-2,-1],[-2,-7],[-4,5],[-3,5],[0,4],[3,6],[-1,2],[8,9],[3,4],[4,1],[-1,2],[0,9],[5,8],[0,5],[1,0]],[[5262,7649],[0,-11],[2,-4],[0,-24],[-4,-12],[0,-11],[-2,-6],[-2,-10],[-2,-4],[-8,8],[-2,4],[0,2],[2,2],[0,2],[-5,4],[1,6],[0,3],[-4,0],[0,2],[3,5],[0,3],[-2,1],[-2,6],[3,4],[-1,3],[-2,1],[2,4],[2,7],[3,3],[5,3],[4,5],[4,-3],[1,2],[0,13],[1,4],[2,0],[1,-2],[0,-10]],[[4966,7827],[-1,-5],[-4,9],[2,2],[3,-6]],[[5160,8037],[1,-2],[2,-1],[3,-3],[2,1],[1,2],[3,0],[3,-2]],[[5194,7829],[-2,-4],[-4,-3],[0,-6],[2,-2],[4,-10],[4,-6],[-1,-3],[-1,-6],[-3,-1],[-4,-5],[-4,1],[-2,-2],[0,-3],[2,-2],[1,-3],[0,-3],[2,-3],[4,-1],[1,-2],[1,-8],[-2,0],[0,-3],[-3,-7],[1,-3],[0,-4],[1,-3],[2,-3],[5,-5],[6,-4],[7,2],[1,-3],[0,-4],[-4,-7],[-1,-3],[0,-6]],[[5207,7704],[-1,-1]],[[5206,7703],[-2,1],[0,-2]],[[5204,7702],[-6,-4],[-8,-13],[-4,-3],[-2,-7],[-3,-4],[-7,-3],[-5,-4],[-3,2],[-6,0],[-3,4],[-8,3],[-2,7],[-6,0],[-1,1],[0,5],[-5,-1],[-1,-2],[-2,-1],[-4,0],[-7,4],[-5,2],[-4,6],[-4,-2],[-4,-5],[-14,-16],[-3,-6],[-3,-10],[0,-4],[1,-15],[3,-7],[0,-2]],[[4949,7683],[5,2],[4,7],[4,27],[2,31],[2,6],[3,1],[-2,5],[-1,-3],[-2,-3],[2,29],[1,10],[2,11],[4,-4],[5,-9],[2,-12],[1,-1],[-2,17],[-4,9],[-9,10],[-1,4],[5,-2],[-1,4],[-1,7],[-1,16],[1,2],[-1,4],[-7,2],[-11,9],[-3,10],[-4,7],[-1,4],[0,3],[2,7],[-2,4],[-2,1],[-1,2],[2,6],[3,0],[1,2],[-10,-2],[-5,2],[0,4],[3,6],[-4,3],[-3,0],[-3,-1],[-1,1],[2,4],[-1,1],[-5,-1],[-3,1],[-3,4],[-3,0],[-1,2],[-4,-1],[-1,3],[-11,5],[-5,0],[-4,-2],[-3,1],[-2,3],[-1,5],[-7,4],[1,3],[7,2],[2,3],[-3,3],[-3,1],[-1,3],[5,0],[4,1],[-1,2],[-2,1],[-10,0],[-1,3],[1,7],[5,5],[13,5],[6,-1],[4,1],[5,3],[2,3],[6,1],[7,-2],[5,-11],[3,-4],[7,6],[10,0],[2,-3],[1,3],[2,3],[2,-1],[0,-3],[11,1],[-3,9],[-1,23],[-3,7],[-5,16],[0,5],[5,0],[3,-1],[6,2],[3,-1],[0,-5],[1,-6],[2,-6],[5,0],[6,-2],[7,0],[9,-3],[5,2],[4,4],[8,2],[0,2],[-4,-1],[-4,3],[-1,3],[1,2],[1,6],[12,9],[9,3],[9,5],[4,5],[4,9],[1,1],[-1,2],[1,26],[2,8],[7,6],[15,5],[2,1]],[[3482,5317],[0,1],[2,0],[2,4],[2,3],[4,15],[2,6],[0,20],[3,10],[2,6],[0,10],[-1,0],[-1,5],[-1,3],[-4,8],[-3,9],[1,5],[-2,3],[0,8],[-1,5],[0,16],[-1,3],[0,9],[1,3],[0,3],[3,10],[2,6],[3,4]],[[3495,5492],[2,3],[2,15],[2,6],[2,0],[11,-12],[5,-1],[11,-7],[3,-9],[9,-14],[5,-5],[0,-4],[-1,-6],[3,5],[4,-8],[3,-12],[-1,-5],[1,-1],[1,2],[0,5],[1,6],[1,0],[2,-3],[2,-17],[1,-3],[0,-10]],[[4813,8722],[-2,1],[-3,5],[-1,4],[4,-2],[2,-5],[0,-3]],[[4815,8743],[-1,-2],[-6,5],[0,3],[6,-3],[1,-3]],[[4799,8762],[4,-3],[-2,-2],[-4,0],[-3,2],[-1,3],[5,1],[1,-1]],[[4815,8768],[-1,-8],[-5,2],[4,-10],[-3,1],[-6,7],[-4,11],[6,2],[4,-3],[5,-2]],[[4821,8769],[-1,-4],[-3,1],[2,5],[2,-2]],[[9526,5490],[0,-3],[-2,2],[1,2],[1,-1]],[[9396,5576],[-1,-2],[-2,1],[-1,5],[-1,1],[0,2],[2,2],[3,-1],[1,-4],[-1,-2],[0,-2]],[[9211,5606],[-1,1],[0,2],[1,0],[0,-3]],[[9218,5611],[-1,0],[0,2],[1,0],[0,-2]],[[8836,5731],[0,4],[1,1],[1,-3],[-1,-2],[-1,0]],[[5265,5243],[2,1],[2,2],[1,-1],[1,-4],[3,-2],[1,0],[1,2],[10,0],[15,0],[13,0],[0,43],[0,24]],[[5308,4958],[-3,5],[-2,9],[-8,16],[-2,6],[-7,16],[-9,15],[-7,13],[0,3],[7,-7],[1,2],[-2,4],[-3,3],[-3,1],[-2,0],[-2,3],[-1,4],[0,4],[-1,4],[-4,8],[-2,7],[4,-4],[1,2],[-1,2],[-4,4],[-2,0],[0,6],[-3,11],[-3,9],[0,4],[8,-19],[2,0],[4,2],[-1,3],[-2,2],[-1,-1],[-2,0],[-1,1],[0,2],[2,9],[-1,0],[-2,-3],[-1,0],[-4,5],[-4,13],[-1,2],[0,5],[-1,2],[-4,18],[1,-1],[2,-6],[3,2],[2,3],[2,0],[2,3],[4,13],[1,17],[0,10],[-1,10],[2,1],[1,-4],[0,-2],[2,-3],[3,0],[6,-6],[1,5],[5,4],[-2,1],[-4,-2],[-7,6],[-2,4],[-2,7],[-2,4],[0,3],[5,4],[1,-1],[0,-3],[2,-2],[0,12],[-1,12],[0,3]],[[4969,8103],[-2,-2],[-1,-3],[-3,-1],[-6,5],[0,2],[4,1],[2,3],[4,-2],[2,-3]],[[4882,8255],[4,-4],[-4,-2],[-4,-5],[-3,2],[-2,5],[-1,7],[3,2],[4,0],[3,-5]],[[4826,8299],[-2,0],[-3,-2],[-7,0],[0,7],[-4,2],[-2,5],[0,2],[-4,4],[-1,0],[-4,-6],[1,-4],[-4,-4],[0,-2],[-3,1],[-4,-1],[-3,3],[-5,2],[-1,4],[-6,7],[-1,4],[10,6],[1,2],[-5,4],[1,2],[4,0],[4,2],[3,4],[1,3],[1,7],[1,2],[5,4]],[[4799,8357],[1,-3],[2,0],[2,2],[2,6],[7,0],[6,3],[10,-1],[2,-4],[2,-7],[3,-7],[4,-5],[0,-4],[-2,-5],[6,0],[3,-6],[0,-7],[-4,6],[-2,0],[1,-4],[0,-5],[3,-1],[-2,-6],[-6,-2],[-1,-4],[-2,-4],[-2,-2],[-3,0],[-3,2]],[[4857,8377],[-3,0],[-3,2],[-2,8],[2,5],[2,1],[3,-3],[1,-6],[0,-7]],[[4829,8405],[2,-14],[-1,-2],[-5,-3],[0,4],[-2,6],[-4,-5],[0,7],[4,4],[1,-1],[5,4]],[[4833,8398],[-2,0],[-1,5],[3,5],[1,3],[5,5],[1,0],[-2,-7],[-5,-11]],[[4839,8429],[-12,-4],[-3,1],[0,2],[3,1],[1,8],[-5,5],[1,2],[3,2],[2,0],[3,-2],[2,-4],[3,-1],[2,-2],[0,-8]],[[4793,8464],[-3,0],[0,3],[3,-1],[0,-2]],[[4825,8464],[-2,0],[-3,3],[3,2],[2,-1],[0,-4]],[[4798,8473],[-3,0],[-2,4],[0,11],[3,1],[1,-1],[1,-15]],[[4828,8495],[0,-8],[2,-4],[6,-1],[5,0],[1,-3],[-4,-4],[-3,-5],[-3,-1],[-1,9],[-3,-1],[-5,1],[-3,7],[-6,2],[-3,6],[2,2],[3,0],[-1,4],[7,2],[0,4],[2,0],[4,-5],[0,-5]],[[4799,8506],[3,-4],[-2,-5],[-4,0],[-6,4],[2,3],[4,1],[1,-1],[2,2]],[[4827,8545],[-4,-10],[-1,0],[-2,-6],[1,-4],[-8,-6],[-3,-5],[-1,0],[-3,-4],[-2,0],[-2,3],[4,3],[0,2],[2,2],[-5,4],[1,4],[-2,1],[0,5],[2,3],[2,0],[2,-2],[4,0],[-2,5],[2,3],[5,3],[7,6],[2,1],[1,-4],[0,-4]],[[4913,8554],[0,-6],[-3,-5],[-6,-5],[-10,-11],[-6,-5],[-1,-3],[0,-4],[5,-1],[-6,-9],[-2,-5],[4,0],[4,1],[6,4],[6,2],[3,0],[6,-2],[4,1],[20,0],[4,1],[4,-2],[2,-3],[3,-8],[-5,-7],[-3,-9],[0,-3],[-6,-16],[-4,-8],[-2,-6],[-5,-7],[-11,-3],[-1,-4],[6,1],[6,-5],[0,-4],[-3,-3],[-6,0],[-5,-7],[-5,-3],[8,-4],[1,0],[5,4],[7,0],[12,-7],[4,-5],[5,-8],[5,-6],[4,-18],[2,-13],[4,-15],[4,-7],[11,-6],[2,-2],[9,-13],[8,-10],[-4,-5],[1,-5],[5,-11],[1,-6],[-3,0],[-3,2],[-2,3],[-6,-1],[0,-1],[5,0],[12,-13],[4,-8],[2,-10],[-2,-4],[-7,-10],[7,-6],[3,1],[3,6],[2,2],[4,1],[6,-2],[3,1],[6,-2],[3,-2],[8,-8],[2,-5],[0,-5],[1,-7],[-2,-5],[-2,-12],[-2,-5],[-6,-7],[-3,1],[1,-7],[-2,-3],[-2,-1],[-4,1],[-6,-4],[4,-2],[1,-3],[-1,-4],[-3,-2],[-6,-1],[2,-7],[1,-1],[6,-1],[14,0],[0,-11],[-1,-1],[-9,-6],[-2,-5],[0,-2],[-6,0],[-2,-3],[-7,-4],[-6,-3],[-12,3],[-7,0],[-9,-3],[-6,3],[-3,2],[-5,1],[-1,-3],[-5,-4],[-2,-1],[-3,1],[-5,-2],[-4,1],[0,-3],[2,-3],[-3,-1],[-8,2],[-2,0],[-1,-2],[-3,1],[-3,3],[-3,2],[-4,1],[-2,-1],[-12,-4],[-2,-5],[-1,-7],[-4,-11],[-3,-1],[-3,4],[-6,3],[-2,3],[-3,-2],[-3,0],[-3,-1],[-9,-5],[-6,-7],[-2,-6],[-3,-1],[-3,4],[-3,1],[-3,-1],[-2,-2],[-1,2],[0,3],[2,4],[7,2],[5,8],[3,4],[1,3],[3,2],[1,3],[8,11],[0,3],[1,4],[0,5],[7,2],[3,10],[9,2],[7,0],[6,-2],[4,0],[3,1],[3,2],[6,13],[2,6],[-7,-2],[-8,-8],[0,-1],[-8,2],[-9,10],[-6,-2],[-4,1],[4,5],[-5,1],[-3,3],[-4,1],[-5,-4],[-5,-3],[-6,4],[-2,2],[0,7],[-2,2],[2,4],[8,5],[14,9],[5,4],[2,3],[2,9],[2,4],[-2,3],[1,6],[-2,7],[0,5],[-7,-1],[-6,-5],[-3,0],[1,5],[3,4],[4,3],[3,7],[5,5],[8,4],[1,1],[4,-1],[6,3],[3,0],[6,-5],[-2,8],[3,2],[0,9],[4,8],[-2,1],[-2,6],[1,3],[3,3],[2,10],[-1,3],[-8,-3],[-7,10],[-4,10],[-1,5],[4,12],[5,8],[-4,3],[-4,-1],[-4,-4],[-2,0],[-3,-4],[-7,-2],[-2,4],[-3,0],[-2,-3],[-3,-2],[-9,5],[-2,-4],[0,-5],[-4,4],[-4,9],[0,4],[2,2],[2,-1],[2,9],[5,12],[2,3],[1,5],[-1,6],[-5,5],[0,5],[2,9],[4,2],[-5,5],[-2,-2],[-4,-2],[-1,-2],[-4,-1],[0,4],[2,7],[-3,-2],[-3,-4],[-1,-3],[1,-1],[1,-7],[-1,-3],[-4,-22],[-2,-4],[-3,0],[-1,2],[0,5],[2,10],[2,6],[3,4],[-3,0],[0,15],[2,5],[0,6],[2,6],[2,9],[2,3],[0,3],[4,8],[-1,0],[-12,-13],[-6,2],[-2,3],[-1,5],[-4,1],[2,3],[5,1],[4,4],[-4,3],[4,3],[4,8],[1,8],[-3,6],[-4,2],[-1,4],[4,5],[-2,8],[4,12],[7,0],[2,2],[3,0],[-6,8],[1,5],[0,4],[1,2],[7,0],[2,1],[-2,5],[0,10],[2,3],[2,1],[5,-2],[1,-3],[6,4],[2,-3],[7,2],[9,1],[5,2],[11,2],[6,0],[-1,-7]],[[4911,8570],[-3,-1],[-3,3],[0,4],[3,0],[3,-6]],[[4914,8583],[0,-1],[7,-1],[1,-2],[-1,-4],[-2,0],[-3,3],[-5,-1],[-2,1],[0,4],[-3,-2],[0,5],[1,4],[2,1],[5,-3],[1,-2],[-1,-2]],[[4928,8595],[-3,0],[2,3],[5,1],[0,-2],[-4,-2]],[[4923,8592],[-3,0],[0,4],[-5,2],[-1,2],[2,2],[4,-4],[1,-3],[2,0],[0,-3]],[[4963,8670],[0,-4],[2,1],[2,-4],[2,-2],[-1,-10],[-1,-5],[-1,0],[0,-6],[-2,-2],[-1,-5],[-2,1],[3,12],[-2,4],[-4,-1],[-1,4],[-3,-1],[-1,3],[4,1],[4,2],[-2,8],[-4,2],[5,6],[3,0],[0,-4]],[[4970,8669],[-1,-1],[-2,6],[2,7],[2,-1],[-1,-3],[0,-8]],[[4977,8686],[-1,-7],[-3,0],[0,6],[4,1]],[[6206,7551],[-1,4],[-2,1],[-2,-1],[-2,1],[-2,4],[1,1],[-3,4],[-4,7],[-3,1],[-1,4],[-2,2],[-4,-2],[-1,-5],[-1,-2],[-8,3],[-8,0],[-2,-3],[-2,0],[-2,2],[-3,1],[-2,2]],[[6152,7575],[5,10],[2,7],[0,9],[-3,10],[-2,14],[-3,15],[-2,5],[-8,5],[-2,6],[-6,8],[-10,4],[-8,10],[-6,6]],[[6109,7684],[2,4],[1,4],[2,1],[10,-3],[4,1],[4,-3],[4,-4],[4,-2],[8,-3],[6,-6],[13,-2],[6,2],[4,0],[4,-4],[3,0],[3,1],[3,-2],[3,-3],[0,-2],[3,-4],[7,-5],[6,-3],[7,-7],[-2,-4],[0,-3],[2,-2],[4,0],[1,2],[3,1],[3,2],[3,3],[5,3],[4,-1],[4,-7],[2,7],[10,-5],[3,-7],[7,0],[4,-3],[-1,-7],[-2,-7],[1,-2],[7,-7],[1,-3],[6,-2],[2,0],[1,-2],[5,-4]],[[4929,8034],[-1,-4],[-2,2],[2,3],[1,-1]],[[4913,5479],[2,0]],[[4997,5824],[2,-4],[0,-9],[-2,-6],[-1,-5],[1,-2],[0,-2],[3,-4],[1,-3],[2,-4],[5,-8],[2,-1],[-1,-3],[0,-23],[-1,-2],[0,-8],[-2,0],[1,-5],[-1,-2],[0,-3],[-1,-2],[2,-1],[2,3],[1,0],[4,-5],[0,-3],[-1,-8],[-1,-6],[0,-8],[1,-4],[0,-3],[-1,-2],[-3,-3],[1,-2],[2,-9],[4,-5],[2,-7],[0,-3],[-2,-6],[-1,-4],[1,-24],[-3,-10],[0,-6],[1,-3],[1,0],[2,-2],[-1,-7],[0,-8],[-1,-5],[-1,-2],[0,-10],[2,-3],[2,-9],[1,-1],[0,-7],[5,-7],[2,-1],[2,-6],[1,-2],[3,-2],[0,-3]],[[5032,5534],[-2,-2],[-2,-3],[-1,-6],[-2,-5],[-5,-3],[-14,0],[-11,-11],[-6,-4],[-3,-6],[-6,-4],[-3,-6],[-8,-2],[-16,-12],[-3,-6],[-7,-6],[-2,0],[-5,6],[-4,3],[-9,5],[-6,2],[-4,2]],[[4763,5619],[-2,3],[0,3],[-1,1],[-2,0],[-1,-2],[0,-3],[-1,-3],[0,-3],[-1,-2],[-2,-8],[-1,-3],[-2,0],[0,-1],[-2,-2],[-2,0],[-2,4],[-2,5],[-3,2],[-1,-1],[-2,1],[0,2],[2,4],[0,3],[1,4],[0,4],[-2,9],[0,6],[-1,3],[0,8],[-1,1],[0,10],[-1,2],[-2,1],[-1,2],[0,2],[-1,1],[-1,-1],[-1,4],[-1,-1],[-8,-5],[0,4],[-2,1],[-2,-2],[-2,0]],[[4713,5672],[-2,1],[-1,-1],[-3,-7],[-1,-3],[-2,0],[-2,3],[0,2],[2,8],[3,7],[0,2],[-1,4],[-2,6],[0,11],[-3,1],[-1,3],[2,8],[0,3],[-2,4],[-3,7],[-2,9],[-3,7],[-2,3],[-2,5],[0,3],[-2,1],[-18,0],[0,-4],[-6,-3],[-4,3],[-4,-2],[-2,-2],[-2,-9],[-1,-2],[0,-2],[-1,-2],[0,-2],[-3,-11],[-2,-4],[-4,-2],[-1,-7],[-2,-4],[-2,-2],[-3,2],[-1,-1]],[[4630,5705],[0,9],[-3,6],[0,2],[-1,4],[-4,7],[-3,0],[1,5],[0,8],[-2,5],[1,4],[-1,0],[-1,-3],[-2,1],[-4,4],[-2,9],[0,1],[-4,0],[-7,7],[-5,17],[0,4],[1,8],[-3,-4],[0,3],[-2,7],[0,4],[-2,2],[-3,-1],[-1,-8],[-2,1],[0,6]],[[4581,5813],[3,8],[5,19],[1,5],[1,1],[2,0],[5,3],[3,4],[2,2],[4,-1],[4,1],[7,4],[0,13],[-1,3],[-3,5],[-2,5],[0,2],[2,3],[3,0],[1,1],[1,6],[0,5],[-1,7],[0,4]],[[4618,5913],[9,0],[1,-1],[4,-1],[4,0],[0,-8],[2,0],[2,2],[8,-8],[3,-1],[2,0],[2,-2],[3,-1],[3,3],[8,2],[2,-1],[7,2],[3,0],[2,-1]],[[4683,5898],[-1,-2],[-2,-7],[0,-5],[2,-4],[3,-5],[3,1],[5,10],[2,0],[2,-3],[2,-7],[2,-6],[1,-1],[2,2],[4,11],[3,3],[1,0],[2,2],[3,-2],[4,-4],[5,-4],[2,-1],[1,1],[2,6],[5,5],[3,1],[1,2],[0,5],[-2,4],[0,1],[3,2],[5,-3],[2,-2],[1,-4],[2,-13],[3,-11],[0,-14],[1,-2],[1,0],[1,-2],[1,-5],[6,-6],[2,-3],[0,-2],[-1,-2],[-3,-4],[-4,-11],[0,-2],[2,-1],[4,4],[2,-1],[2,-5],[0,-19],[1,-8],[1,-2],[7,-7],[0,-3],[1,-2],[-1,-4]],[[4539,5966],[16,0],[13,0],[3,8],[4,4],[4,1],[5,-2],[5,-6],[5,-3],[2,-4],[3,-3],[2,-1],[1,1],[3,1],[1,1],[5,0],[3,-3],[1,-4],[-1,-5],[-4,-2],[-7,-3],[-5,2],[-7,4],[-3,4],[-2,1],[-2,2],[-2,3],[-4,2],[-1,-1],[-1,-3],[0,-3],[-2,-2],[-10,-2],[-4,-2],[-1,-10],[-22,0],[-2,-2],[-2,-3]],[[4533,5936],[0,5],[-1,11],[2,5],[2,2],[2,-2],[0,-4],[1,-3],[4,-2],[4,1],[2,-1],[0,3],[1,3],[5,2],[5,1],[5,2],[4,-1],[1,2],[-3,1],[-8,-2],[-8,-1],[-6,-6],[-3,0],[-2,6],[-1,8]],[[4557,5822],[0,-2],[-1,0],[0,8],[1,-2],[0,-4]],[[4551,5820],[-2,-1],[-1,4],[2,1],[2,4],[1,0],[0,-6],[-2,-2]],[[4562,5829],[0,-2],[-1,0],[0,5],[1,2],[2,0],[0,-2],[-2,-3]],[[4557,5844],[-1,-2],[-2,2],[0,3],[2,4],[1,0],[0,-7]],[[4567,5848],[0,-2],[-2,2],[2,4],[2,1],[0,-3],[-2,-2]],[[4555,5868],[-1,-7],[-2,0],[-1,5],[3,2],[1,0]],[[4535,5895],[5,0],[5,2],[3,3],[3,1],[8,-1],[7,3],[6,5],[5,6],[13,0],[10,-1],[18,0]],[[4581,5813],[-1,5],[1,7],[-1,0],[-3,-6],[-1,0],[0,7],[-2,0],[-3,3],[0,7],[2,3],[0,1],[-2,0],[-1,-1],[-1,2],[1,5],[5,4],[3,0],[2,1],[-1,4],[-3,1],[-2,-1],[-3,-3],[-3,7],[0,3],[1,3],[2,2],[6,0],[3,3],[0,3],[-1,0],[-2,-3],[-7,1],[-2,-1],[-4,-6],[-4,-3],[-4,1],[1,8],[-1,2],[-5,-2],[-4,3],[-2,4],[1,6],[2,3],[0,2],[-2,0],[-4,-2],[-7,9]],[[5265,5243],[1,1],[-3,4],[-2,0],[-1,1],[1,9],[2,8],[2,6],[2,1],[0,3],[2,10],[2,8],[0,22]],[[5242,5400],[4,0],[2,-3],[-1,-5],[-4,-13],[-2,-10],[-2,0],[-5,2],[0,2],[-1,2],[1,5],[0,2],[3,2],[2,11],[1,3],[2,2]],[[5661,7230],[6,0],[1,3],[2,1],[1,-4],[-2,-1],[0,-2],[4,-1],[0,-5],[1,-1],[4,0],[5,3],[3,1],[7,-1],[3,-4],[6,0],[5,-2],[2,1],[5,1],[0,-12],[1,-1],[2,1],[1,3],[4,2],[4,0],[3,5],[0,-9],[-1,-3],[0,-3],[-2,-2],[-4,0],[-6,1],[-6,-1],[-11,-3],[-11,-2],[-2,1],[0,7],[-4,3],[-4,2],[-16,5],[-6,0],[-2,1],[-1,2],[0,7],[1,7],[3,-1],[1,2],[0,6],[1,-1],[1,-5],[1,-1]],[[5754,7226],[-1,-3],[-1,3],[0,3],[-1,5],[2,7],[0,4],[2,1],[0,-6],[-2,-5],[2,-4],[0,-4],[-1,-1]],[[5639,7268],[0,-3],[-3,2],[-1,3],[0,5],[1,3],[2,-2],[3,-5],[-2,-3]],[[5772,7253],[-2,-1],[-1,2],[1,7],[-1,6],[5,10],[9,5],[0,-4],[-2,-9],[-2,-5],[0,-3],[-3,-1],[-4,-7]],[[5707,7279],[-2,-3],[-1,2],[2,4],[1,-3]],[[5734,7291],[-4,-5],[-1,2],[0,3],[2,-1],[2,3],[1,-2]],[[5773,7289],[-1,-1],[-1,4],[2,2],[0,-5]],[[5680,7301],[1,-4],[-1,-1],[-5,-1],[0,3],[1,2],[1,-2],[1,2],[2,1]],[[5704,7296],[-1,-1],[-2,3],[0,3],[1,1],[3,-4],[-1,-2]],[[5748,7299],[0,2],[3,4],[4,4],[4,-2],[-6,-5],[-3,-1],[-2,-2]],[[5686,7310],[-2,2],[1,4],[2,-4],[-1,-2]],[[5749,7312],[-2,-1],[0,5],[1,1],[2,-4],[-1,-1]],[[5701,7318],[-2,-4],[-2,0],[-1,2],[1,5],[3,2],[1,-1],[0,-4]],[[5709,7313],[-3,-3],[-2,4],[-1,4],[5,8],[2,-3],[0,-6],[-1,-4]],[[5680,7322],[-1,-1],[-2,1],[2,5],[1,-1],[0,-4]],[[5678,7334],[-2,-1],[1,4],[-1,2],[2,1],[1,-2],[-1,-4]],[[5692,7343],[0,-6],[-2,1],[1,6],[1,-1]],[[5705,7339],[-3,-1],[0,5],[1,1],[3,-2],[-1,-3]],[[5722,7345],[-1,2],[3,4],[3,0],[0,-4],[-5,-2]],[[5700,7349],[-1,-4],[-6,8],[1,1],[2,-2],[4,-1],[0,-2]],[[5675,7348],[-1,-3],[-1,4],[1,4],[2,1],[1,-2],[-2,-4]],[[5744,7361],[3,-2],[3,0],[0,-4],[-2,0],[-3,-3],[-2,0],[-2,3],[-3,0],[-1,1],[2,3],[3,2],[2,0]],[[5579,7361],[1,-4],[-3,-4],[-3,4],[-2,5],[0,2],[2,4],[2,-4],[2,-1],[1,-2]],[[5693,7358],[-1,-4],[-2,5],[-2,3],[-1,3],[-2,1],[0,4],[3,1],[1,-4],[3,0],[0,-3],[1,-6]],[[5653,7368],[-2,-2],[-2,2],[2,3],[2,-1],[0,-2]],[[5572,7394],[0,-7],[2,-1],[2,-6],[0,-4],[-5,3],[-2,-1],[-1,3],[0,4],[-1,1],[-3,-4],[0,3],[3,8],[1,-3],[1,1],[1,4],[2,-1]],[[5576,7391],[-2,-1],[-2,6],[0,4],[2,-2],[0,-3],[2,-4]],[[5724,7385],[-3,-4],[-3,5],[0,2],[2,1],[1,3],[-1,4],[-3,5],[0,4],[4,2],[3,-4],[2,0],[-1,-4],[1,-10],[-2,-1],[0,-3]],[[5574,7407],[-3,0],[-1,3],[1,6],[1,3],[2,2],[0,-14]],[[5684,7419],[-3,-2],[0,3],[-3,3],[1,4],[2,-1],[3,-7]],[[5649,7427],[3,-8],[3,-3],[2,0],[5,-4],[6,-1],[3,-8],[0,-4],[2,-14],[3,-4],[2,-1],[3,1],[1,-2],[0,-6],[-2,-3],[-3,3],[-1,0],[-2,3],[-3,3],[0,5],[-3,6],[-1,1],[0,3],[-5,1],[-3,0],[-3,3],[-1,6],[-3,3],[-1,3],[-6,8],[-3,3],[-3,1],[-3,-2],[-2,2],[8,8],[5,2],[2,-5]],[[5659,7436],[-1,-2],[-2,1],[-2,7],[5,-6]],[[5662,7439],[0,4],[3,2],[-1,-4],[-2,-2]],[[5733,7449],[-1,-4],[4,-5],[2,-8],[-2,-3],[-4,-1],[-6,3],[-2,3],[4,5],[-2,2],[-3,-6],[-6,5],[2,6],[3,0],[4,3],[0,2],[5,1],[2,-3]],[[5557,7455],[0,-4],[-3,2],[-3,3],[-2,7],[-4,8],[0,3],[1,2],[4,1],[3,-4],[-3,-5],[2,-3],[0,-6],[3,-4],[2,0]],[[5706,7486],[-2,-2],[0,-3],[-1,-5],[-6,1],[-2,2],[0,8],[5,1],[1,-3],[2,1],[1,2],[2,1],[0,-3]],[[5712,7512],[-3,-2],[-3,5],[3,2],[2,-1],[1,-4]],[[5687,7523],[-3,-2],[-4,3],[0,3],[2,5],[1,1],[3,0],[1,-4],[0,-6]],[[5581,7536],[4,1],[6,0],[2,2],[2,0],[3,-2],[6,5],[4,9],[9,3],[4,-2],[3,0],[3,1],[3,2],[1,8],[1,1],[3,0]],[[5730,7586],[3,-1],[2,-4],[2,-2],[2,-11],[-1,-3],[-2,0],[-6,-6],[0,-10],[1,-4],[-3,-7],[-2,-3],[-2,-5],[-2,-1]],[[5722,7529],[-1,3],[-4,4],[-10,2],[-5,4],[-2,-1],[-4,4],[-8,-8],[-4,0],[-3,4],[-2,1],[-3,-2],[-4,-7],[-4,-4],[-4,1],[-5,0],[-1,-4],[1,-3],[3,-4],[-1,-4],[1,-4],[4,0],[6,-5],[2,-5],[1,-5],[-5,7],[-7,5],[-2,0],[-3,-2],[0,-2],[5,-8],[2,-2],[1,-5],[-2,-4],[-3,4],[-5,11],[-6,2],[-1,-2],[1,-6],[1,-3],[6,-6],[-2,-2],[-6,4],[-2,5],[-1,8],[-5,5],[-6,5],[-1,5],[2,6],[-3,0],[-2,-3],[-3,-2],[-1,-4],[1,-4],[-1,-5],[-1,-9],[0,-5],[7,-13],[4,-14],[4,-4],[3,-8],[2,-4],[1,-6],[-3,-4],[-2,-1],[-1,2],[2,5],[-1,2],[-4,5],[-5,-4],[3,-9],[1,-5],[-1,-4],[-4,-3],[-3,0],[0,-3],[3,-3],[6,-3],[4,-4],[3,-1],[3,-8],[6,-2],[3,-8],[4,-1],[4,-3],[1,-3],[0,-5],[1,-11],[0,-14],[-2,-2],[-3,6],[-4,6],[-4,8],[-2,1],[-3,-2],[-6,-2],[-4,-4],[3,-6],[0,-4],[1,-6],[6,-2],[0,-2],[2,-3],[0,-3],[-9,-6],[-1,1],[0,5],[-7,5],[-2,3],[-2,-2],[1,-9],[3,-6],[4,-16],[2,-9],[0,-5],[-1,-7],[2,-6],[-1,-3],[-3,2],[-4,9],[-1,6],[-2,1],[-3,-1],[-3,-12],[0,-7],[-4,3],[1,8],[-5,14],[-1,1],[-3,7],[-3,-2],[-1,-6],[0,-5],[-1,-4],[-4,8],[-5,12],[0,7],[4,6],[-1,5],[-3,9],[-4,5],[-3,2],[-1,6],[-4,5],[0,3],[5,7],[2,9],[2,1],[3,-2],[3,0],[2,6],[2,3],[4,0],[8,-8],[8,-4],[5,-4],[2,-4],[4,-1],[-1,5],[2,1],[4,0],[2,4],[-1,2],[-3,2],[-3,0],[-3,2],[-2,3],[-5,3],[-4,5],[-1,-3],[-5,-2],[-7,4],[-4,-3],[-7,-2],[-3,0],[-3,8],[-1,1],[0,-6],[-4,-2],[-2,2],[-1,7],[-2,9],[-3,7],[-3,2],[0,6],[3,1],[5,-3],[3,2],[-1,3],[0,3],[-3,0],[-3,1],[-4,-2],[-2,2],[0,2],[-4,4],[-2,6],[-5,4],[-3,13],[-3,6],[-2,3]],[[3285,5875],[-1,2],[0,4],[2,7],[2,-1],[-1,-9],[-2,-3]],[[3714,8684],[-3,-7],[-3,2],[-2,3],[-3,1],[-4,0],[0,1],[11,8],[6,2],[-2,-6],[0,-4]],[[3970,8958],[-4,0],[-1,4],[0,5],[5,2],[3,-4],[-1,-5],[-2,-2]],[[3582,9189],[-4,-2],[-2,2],[-3,11],[1,4],[-1,3],[7,4],[4,-1],[7,-4],[0,-1],[-6,-4],[-2,-5],[-1,-7]],[[3534,9212],[10,-5],[9,-3],[2,-4],[-1,-3],[3,-3],[0,-2],[-5,-6],[-19,-7],[-22,-7],[-6,1],[-7,4],[-4,4],[4,2],[11,1],[-5,5],[-3,-1],[-6,2],[-10,1],[-6,2],[-4,3],[-1,3],[2,11],[1,2],[4,1],[8,-2],[1,1],[-9,4],[-3,2],[-2,5],[1,5],[3,2],[9,3],[10,-1],[18,-4],[7,-5],[10,-11]],[[3564,9264],[-13,1],[1,6],[4,0],[9,-4],[-1,-3]],[[4293,9268],[1,-5],[-2,-3],[3,-5],[-2,-2],[-11,-3],[-7,-5],[-4,-4],[-2,0],[-2,4],[-7,2],[-14,-1],[-16,-3],[-6,-2],[-3,1],[-1,3],[3,6],[4,1],[2,4],[-1,5],[1,6],[3,1],[10,-3],[8,0],[10,1],[7,2],[15,7],[2,0],[4,-4],[5,-3]],[[3512,9275],[-3,0],[-7,3],[-2,2],[3,5],[4,4],[4,1],[4,-7],[0,-4],[-3,-4]],[[3471,9376],[-14,-13],[-7,3],[-3,3],[-5,-1],[-4,4],[6,3],[9,1],[4,-1],[8,3],[5,0],[1,-2]],[[4499,9527],[3,-12],[4,-4],[7,1],[3,-7],[-5,-2],[-22,1],[-9,-1],[-6,4],[1,7],[0,8],[6,4],[6,-4],[12,5]],[[4483,9563],[-3,-1],[-11,24],[1,15],[5,0],[4,-3],[2,-14],[2,-21]],[[3008,9637],[-9,0],[-10,2],[-4,2],[2,3],[13,1],[15,-4],[-1,-2],[-6,-2]],[[4500,9655],[-5,0],[-1,5],[8,8],[6,0],[1,-5],[-2,-4],[-7,-4]],[[4471,9674],[-6,5],[-2,8],[0,9],[5,4],[5,0],[0,-12],[2,-5],[-4,-9]],[[4510,9781],[-12,-6],[-17,0],[-11,3],[-3,5],[4,5],[13,4],[16,2],[14,-1],[2,-5],[-6,-7]],[[4481,9898],[-3,-2],[-8,0],[-15,10],[-1,5],[9,2],[6,-4],[12,-11]],[[3753,9911],[-6,-1],[-12,6],[-18,6],[-17,4],[-15,11],[1,7],[24,2],[28,-6],[13,-6],[5,-5],[-3,-18]],[[4167,9996],[27,-3],[14,-4],[22,-1],[18,-2],[30,-5],[5,-2],[-11,-2],[-39,-2],[-70,-2],[-40,-4],[-13,0],[-1,-6],[15,0],[31,6],[12,1],[22,0],[28,-2],[32,0],[24,2],[28,3],[8,-8],[10,-8],[9,1],[13,-4],[8,0],[24,-2],[24,-6],[4,-5],[-2,-3],[-11,-5],[-13,-4],[-18,-4],[-21,-2],[-159,-7],[-5,-2],[-3,-4],[2,-6],[7,-1],[18,3],[30,3],[22,0],[52,-3],[16,-6],[8,-11],[18,2],[4,2],[6,7],[3,6],[7,2],[38,3],[6,-1],[6,-7],[0,-14],[-3,-6],[-7,-9],[-6,-5],[-20,-12],[-18,-12],[-3,-5],[6,-1],[4,5],[20,6],[18,9],[9,3],[11,5],[20,14],[11,5],[11,0],[2,-8],[29,-2],[4,-2],[14,-2],[7,2],[26,18],[20,5],[9,-1],[27,0],[15,-2],[21,-4],[15,-2],[16,-6],[12,-6],[-3,-3],[-20,-6],[-6,-5],[-19,-8],[-9,-3],[-20,-1],[-8,-3],[5,-3],[1,-5],[-7,-4],[-19,-2],[-10,-4],[-12,-1],[-9,1],[-13,-5],[10,-5],[13,-3],[0,-2],[-6,-4],[-9,-4],[-14,-4],[-10,1],[-10,-2],[-10,0],[-17,2],[-14,3],[-7,0],[-12,-6],[-8,-8],[-1,-9],[6,-6],[16,0],[3,-4],[-4,-16],[1,-3],[7,-2],[5,-6],[-3,-4],[-18,-5],[-4,-9],[-5,-4],[-9,0],[-7,-2],[-14,-8],[5,-4],[0,-2],[-7,-10],[-2,-5],[-3,-13],[-4,-4],[-6,-12],[0,-5],[5,-3],[5,3],[7,8],[8,4],[8,-1],[23,-7],[7,-3],[5,-6],[0,-2],[-6,-1],[-12,6],[-6,1],[-14,-4],[6,-10],[6,-4],[12,-2],[14,-7],[5,1],[6,3],[9,0],[7,-4],[1,-12],[-1,-5],[-5,-8],[-7,-1],[-6,3],[-15,2],[-15,4],[-12,0],[-13,-2],[0,-3],[-18,-9],[-4,1],[-12,6],[-10,-4],[-2,-3],[9,-5],[11,-1],[4,-10],[7,-8],[9,0],[8,2],[12,-4],[10,-1],[6,-5],[-2,-7],[4,-6],[7,-6],[2,-6],[0,-5],[2,-6],[1,-12],[-4,-6],[-8,-2],[-6,6],[-5,3],[-8,0],[-12,-9],[-9,-1],[-5,-4],[-6,-2],[-6,0],[-1,-2],[5,-2],[7,2],[11,5],[4,-2],[4,-9],[-3,-9],[-4,-5],[5,-1],[7,6],[5,14],[6,2],[6,-2],[5,-7],[7,-13],[7,-5],[2,-4],[0,-4],[-2,-6],[-10,-3],[-11,2],[-6,0],[1,-5],[-12,-4],[-13,-1],[-12,3],[-11,5],[4,6],[2,7],[-5,5],[-2,0],[2,-7],[-1,-3],[-10,-5],[4,-6],[-4,-6],[1,-4],[8,-3],[19,-1],[8,-1],[18,-5],[1,-2],[-3,-9],[-2,-10],[-3,-1],[-19,-1],[-6,-1],[-10,-4],[-8,-5],[-5,-1],[-17,5],[-7,3],[-15,8],[-11,13],[-8,-8],[-6,-1],[-7,3],[0,-5],[4,-2],[-1,-2],[-6,-1],[-8,-3],[-12,-9],[-12,-1],[-6,3],[-10,2],[-14,5],[2,-3],[16,-6],[2,-2],[-5,-4],[-15,0],[-9,-2],[1,-2],[5,-2],[5,4],[12,-1],[9,3],[11,1],[18,5],[3,5],[6,2],[13,1],[13,0],[6,-1],[5,-5],[8,-3],[5,-4],[7,-1],[4,-5],[11,-6],[8,-1],[4,-3],[0,-11],[1,-5],[-2,-14],[-6,-3],[1,-7],[-1,-6],[-6,2],[-6,4],[-14,6],[-13,4],[-11,6],[-8,11],[-5,13],[-2,7],[-5,1],[-10,-4],[-2,-3],[-17,-5],[-6,-3],[-4,0],[-12,-4],[5,-3],[7,1],[3,2],[12,4],[9,1],[10,5],[5,0],[1,-2],[3,-16],[-1,-4],[-12,-5],[-2,-2],[2,-3],[8,3],[5,3],[3,-1],[4,-5],[17,-8],[6,-4],[8,-3],[9,-5],[13,-5],[4,-8],[3,-1],[8,0],[-1,-4],[-9,-7],[-5,-3],[1,-7],[3,-1],[3,5],[2,0],[6,3],[6,-2],[2,-15],[0,-20],[1,-3],[3,-17],[-3,-3],[-8,-1],[-4,1],[-9,0],[0,8],[-1,3],[0,12],[-3,-3],[0,-5],[-2,-13],[-2,-4],[-7,1],[-11,0],[-13,6],[-5,6],[-7,15],[-1,7],[-3,6],[-5,5],[-13,6],[-12,8],[-12,6],[-9,1],[-13,-1],[-9,3],[-4,-2],[1,-4],[18,-2],[11,0],[6,-1],[3,-2],[2,-10],[-2,-5],[-8,-5],[-15,-7],[-4,-1],[-17,0],[-16,3],[-11,0],[-3,-1],[3,-2],[9,-3],[-1,-8],[-4,-6],[-7,-5],[-17,-6],[2,-1],[11,2],[15,-5],[12,1],[23,4],[4,-1],[3,-4],[-2,-2],[-14,-5],[-4,-1],[-10,-8],[-1,-5],[6,-2],[3,2],[7,10],[8,2],[9,-1],[8,1],[17,7],[22,-4],[19,-6],[11,-3],[13,-1],[25,0],[2,-1],[-2,-4],[-4,-3],[-5,-1],[-12,-4],[-1,-1],[2,-4],[-6,-1],[-9,-3],[-9,0],[3,-3],[1,-6],[-6,-1],[-8,2],[-2,-1],[2,-3],[0,-3],[-2,-2],[-16,-9],[-9,-1],[3,-4],[0,-2],[-5,-4],[-9,-4],[0,-4],[-3,-4],[-7,-4],[-5,-2],[-6,-5],[-13,-2],[-7,-3],[-5,-1],[-17,-6],[-7,0],[-7,-2],[-13,-5],[-7,-2],[-4,-2],[-5,0],[-13,1],[-5,-2],[-4,-5],[-3,0],[-11,3],[3,-5],[0,-2],[-7,-3],[-9,1],[-7,2],[-9,6],[-11,9],[-5,3],[0,-3],[4,-5],[0,-2],[-5,-3],[6,-8],[0,-5],[-6,-6],[-2,0],[-13,-10],[-4,-1],[-2,-2],[-6,-12],[-5,-4],[1,-3],[-3,-9],[-8,-13],[-6,-12],[-5,-6],[-4,0],[-2,-2],[-2,-7],[-2,-2],[-15,-11],[-7,1],[-7,5],[-2,-2],[3,-10],[-5,-5],[-6,-4],[-9,-9],[-1,7],[-3,1],[-4,-10],[-8,-1],[-3,5],[-5,-4],[-2,0],[-3,-8],[-3,-2],[-4,1],[-3,-3],[-5,3],[-1,4],[4,6],[1,3],[-1,3],[1,4],[9,12],[6,6],[-1,1],[-14,4],[-7,1],[-3,-1],[5,-4],[6,-3],[-6,-7],[-2,-10],[-2,-4],[-8,5],[-1,-4],[7,-5],[0,-7],[-12,-5],[-13,-1],[-24,-3],[-6,0],[0,-2],[17,-10],[-2,-3],[-3,-2],[-5,-7],[-9,-5],[-12,3],[-5,-1],[-6,1],[0,-4],[3,-9],[4,0],[5,2],[4,-5],[2,-9],[4,-4],[3,-7],[-8,-8],[-6,0],[0,-4],[-3,-3],[-5,1],[-6,3],[-11,1],[11,-7],[4,-3],[6,2],[6,-2],[-1,-12],[2,-9],[1,-2],[-6,-6],[-1,-5],[-3,-2],[-4,1],[0,-6],[-3,-4],[1,-4],[-4,-8],[-4,-4],[-12,0],[-7,7],[-2,-2],[6,-6],[9,-5],[-1,-3],[-2,-1],[-5,-9],[-2,0],[-2,-3],[-10,2],[-9,-1],[-3,1],[0,-3],[10,-4],[9,-2],[0,-3],[-2,-3],[1,-4],[-1,-6],[-2,-8],[2,-5],[2,-3],[1,-9],[-3,-5],[-8,-1],[-2,-2],[7,-2],[0,-4],[-2,-4],[-2,-10],[-4,-18],[-2,-17],[-10,-14],[-4,-1],[-4,1],[-7,3],[-5,1],[-4,0],[3,-4],[4,-1],[4,-2],[6,-1],[3,-3],[1,-4],[0,-4],[1,-11],[-3,-4],[-2,-4],[-8,1],[-4,-2],[2,-3],[-7,-2],[-5,1],[1,5],[-6,-2],[-3,0],[-2,7],[8,13],[-1,2],[-4,-4],[-5,-10],[-2,-1],[-6,2],[-15,9],[0,10],[5,0],[6,5],[-3,2],[-6,-3],[-4,1],[-4,3],[-10,4],[-3,2],[-3,9],[4,11],[4,7],[1,5],[-1,2],[-2,0],[-2,-7],[-8,-4],[-8,-3],[-6,-6],[-2,-3],[-7,0],[-3,-2],[-4,1],[-2,3],[-4,0],[-6,-1],[2,-6],[-8,0],[-2,1],[-4,4],[1,2],[12,9],[-2,1],[-8,-1],[-2,1],[-5,-1],[0,8],[-1,3],[-2,2],[-12,3],[-2,8],[-1,6],[-5,1],[-2,3],[2,2],[1,3],[-4,4],[1,1],[-3,7],[2,3],[7,4],[1,2],[6,2],[-5,2],[-6,-1],[-4,-5],[-7,-1],[-1,1],[-1,8],[4,5],[-7,3],[-8,4],[-7,7],[2,6],[0,6],[-1,2],[6,10],[0,5],[-7,-9],[-2,1],[-3,6],[-8,8],[-2,5],[-4,5],[-5,10],[-8,12],[-1,7],[2,8],[-3,6],[8,3],[19,6],[7,0],[-4,3],[1,3],[-1,2],[-7,-5],[-23,-7],[-4,6],[5,7],[3,8],[5,6],[3,1],[8,-1],[-1,3],[1,2],[4,2],[6,1],[3,-1],[3,-4],[3,-7],[4,-3],[0,4],[-2,4],[-1,7],[-5,4],[-6,0],[-4,5],[-1,4],[-3,7],[-3,9],[-1,0],[1,-6],[2,-4],[3,-13],[-1,-3],[-6,-5],[-7,-2],[2,4],[1,5],[-4,-2],[-3,-3],[-1,-5],[-7,-14],[-5,-8],[-2,-1],[-2,2],[-3,10],[0,15],[-4,22],[0,5],[-6,3],[-2,7],[2,2],[8,5],[6,5],[6,8],[3,2],[10,2],[5,0],[0,2],[-8,0],[-10,-3],[-8,-9],[-9,-6],[-6,0],[-5,7],[-7,-1],[-6,1],[-1,11],[4,11],[-5,1],[-3,4],[10,7],[15,11],[12,8],[5,7],[6,3],[11,9],[-4,1],[-35,-29],[-4,-3],[-6,-6],[-3,-1],[-8,-1],[-3,-1],[-2,1],[-1,7],[1,4],[-1,4],[2,5],[3,4],[1,4],[9,6],[2,4],[12,2],[5,0],[1,2],[-5,1],[-9,0],[-9,1],[-6,0],[-4,1],[-3,3],[-6,8],[3,11],[0,5],[10,7],[6,3],[7,6],[8,4],[8,0],[13,-5],[7,-1],[6,1],[7,-2],[14,-7],[2,1],[-1,2],[-14,7],[0,3],[4,0],[4,3],[-3,1],[-9,-1],[-3,-2],[-10,-1],[-9,2],[-7,4],[-5,-2],[-13,-3],[-12,-11],[-5,-2],[-3,1],[3,10],[1,7],[6,7],[6,14],[3,1],[17,-5],[10,-4],[8,-1],[5,0],[4,4],[2,6],[5,6],[0,5],[-7,-1],[-5,-7],[-5,-2],[-11,-1],[-5,0],[-9,2],[-2,3],[-11,-1],[-6,0],[5,7],[5,11],[4,3],[8,3],[8,-1],[15,-8],[4,-1],[14,3],[5,5],[4,7],[-6,-2],[-6,-1],[2,11],[1,9],[1,2],[8,-1],[11,1],[3,3],[-5,1],[-2,3],[-8,-3],[-7,1],[5,11],[3,11],[0,4],[2,3],[11,4],[0,2],[-5,6],[1,2],[4,2],[0,2],[-3,0],[-10,-2],[-8,3],[-3,0],[-8,-4],[-3,1],[-18,4],[-3,1],[-6,5],[-13,8],[-9,3],[-18,3],[-4,3],[-10,11],[-1,2],[6,6],[5,1],[8,0],[10,-3],[11,0],[13,-2],[6,-2],[18,-11],[7,-4],[3,0],[13,-4],[7,2],[-1,2],[-6,1],[-10,8],[-1,6],[2,4],[0,5],[-4,3],[-9,5],[2,2],[4,0],[7,-3],[4,0],[3,2],[-4,2],[-6,5],[-19,0],[-5,1],[-5,3],[-10,-1],[-6,0],[-3,8],[0,2],[3,1],[3,5],[4,3],[22,5],[1,4],[-5,-2],[-3,0],[-13,3],[-7,-5],[-7,-3],[-3,0],[-4,2],[-1,4],[4,2],[5,5],[0,2],[-5,-1],[-1,2],[0,7],[-6,9],[-4,-1],[6,-6],[1,-7],[-7,-6],[-2,-4],[-3,-2],[-3,1],[3,-8],[-2,-4],[-10,-4],[-14,-1],[-6,2],[-8,1],[-7,8],[-2,4],[0,4],[3,4],[3,11],[4,9],[12,12],[1,3],[-2,1],[-12,-11],[-7,-1],[-2,2],[2,6],[6,-1],[2,3],[-4,4],[-4,1],[4,3],[9,0],[9,8],[2,4],[-1,5],[1,5],[-4,5],[-6,3],[-3,-5],[-3,0],[-10,4],[-1,6],[7,3],[4,6],[-1,8],[-3,4],[-8,-5],[-1,5],[-9,5],[0,4],[2,3],[1,5],[4,0],[-2,8],[-3,3],[-6,10],[-4,3],[-3,0],[-19,-4],[-2,1],[9,4],[6,1],[2,4],[-2,8],[1,2],[9,2],[3,2],[-8,5],[-8,3],[-7,10],[-8,6],[-13,5],[-4,4],[-4,6],[-4,4],[-9,4],[-1,2],[9,5],[1,2],[-7,11],[-10,2],[-6,2],[-10,6],[-8,2],[-12,5],[-20,6],[-9,4],[-12,1],[-13,4],[-11,1],[-7,-1],[-7,4],[-8,2],[-4,-1],[-11,-7],[-3,0],[-10,6],[-11,-6],[-6,-2],[-15,-3],[-3,1],[-9,6],[-2,0],[-11,-5],[-6,-1],[-8,4],[-6,-1],[6,-8],[5,-5],[-4,0],[-37,6],[-5,1],[-21,11],[-8,3],[-3,4],[2,2],[15,7],[6,2],[11,1],[4,2],[-3,2],[-15,-1],[-13,1],[-12,3],[-6,5],[0,3],[-9,-1],[-7,-3],[-8,2],[-1,5],[-10,6],[0,3],[5,4],[10,3],[26,2],[19,-2],[7,6],[4,2],[13,2],[19,1],[20,-3],[9,-3],[-2,6],[4,4],[0,6],[-10,7],[-4,0],[-9,-3],[-10,-5],[-13,-2],[-9,2],[-7,3],[-5,-1],[-3,-3],[-10,-4],[-4,0],[-18,5],[-4,2],[0,3],[-5,3],[-7,2],[13,6],[0,1],[-9,0],[-5,-3],[-11,0],[-11,2],[-3,3],[-16,3],[-20,13],[-1,2],[7,5],[-4,5],[1,2],[8,6],[11,3],[14,5],[17,0],[13,5],[12,3],[28,4],[2,2],[-3,3],[18,6],[14,1],[14,4],[22,1],[9,-2],[8,1],[11,8],[8,10],[8,17],[5,15],[5,3],[12,3],[-4,2],[-6,0],[-12,-3],[-11,0],[-5,-2],[-12,-1],[-13,3],[-14,0],[-7,8],[6,11],[11,7],[18,7],[9,2],[16,8],[10,8],[5,2],[17,3],[13,-2],[6,4],[0,3],[6,4],[9,0],[18,-2],[11,-4],[6,1],[7,9],[2,7],[-3,20],[10,6],[11,4],[15,1],[17,-3],[24,-11],[10,-4],[16,-5],[18,-9],[5,0],[-5,4],[-28,12],[-10,5],[-17,10],[-12,3],[0,2],[15,5],[28,4],[31,3],[11,0],[18,2],[2,2],[21,4],[5,0],[16,-5],[8,-6],[3,-6],[-1,-19],[5,-3],[11,11],[3,10],[-5,4],[0,8],[2,4],[7,0],[29,-14],[11,-3],[12,-8],[15,1],[20,-1],[3,2],[-4,3],[-20,8],[-9,7],[-6,8],[-1,5],[4,1],[22,0],[33,-4],[42,-14],[20,-4],[37,-15],[11,-3],[5,0],[5,4],[-3,10],[3,13],[6,3],[2,4],[-2,6],[-7,4],[-27,10],[5,3],[8,1],[67,-3],[12,-1],[7,-2],[17,1],[-2,4],[-78,5],[-22,1],[-7,-1],[-23,0],[-10,5],[9,7],[21,-3],[21,6],[12,1],[28,7],[12,0],[20,-3],[6,-4],[15,-2],[17,10],[9,3],[13,-2],[16,-5],[11,-2],[18,-10],[7,3],[1,8],[-18,5],[-3,5],[6,3],[9,-1],[13,6],[17,-2],[9,0],[5,4],[40,0],[14,2],[15,-3],[8,0],[24,5],[63,-1],[21,-2]],[[2548,6089],[-3,-6],[-5,-8],[-4,-7],[-8,-12],[0,-1],[-6,-5],[-1,-8],[0,-2],[1,-5],[1,-7],[-1,-3],[-3,-5],[-1,-4],[-1,-2]],[[2517,6014],[-2,1],[-2,-1],[-2,-2],[0,-2],[1,-4],[0,-2],[-4,-4],[-1,-2],[-1,-4],[-2,-1],[-3,-3],[-5,-10],[0,-3],[1,-3]],[[2497,5974],[-11,10],[-4,2],[-15,-1],[-6,4],[-7,7],[-5,7],[-12,18]],[[2437,6021],[2,5],[0,19],[2,4],[1,3],[-4,9],[0,2],[1,3],[2,10],[4,12],[4,13],[2,8],[21,0],[15,0],[-1,5],[2,11],[0,2],[-2,3],[-3,2],[-1,2],[0,3],[-2,9],[-3,4],[-5,5],[-4,6],[-5,13],[-3,3],[12,0],[0,32],[22,0],[13,0],[16,0]],[[2530,6099],[1,-2],[2,0],[2,-3],[3,-3],[2,5],[-2,5],[0,1],[10,-13]],[[9019,5947],[-1,0],[-1,2],[0,8],[4,5],[1,6],[2,-1],[1,-2],[-5,-9],[-1,-9]],[[3312,5483],[-6,13],[-12,28],[0,1],[2,7],[2,4],[3,5],[-1,10],[1,4],[-1,3],[-1,5],[2,6],[1,1],[4,1],[2,3],[2,0],[3,-1],[3,5],[6,5],[2,9],[-2,4],[-2,0],[-2,-1],[-2,0],[-1,4],[0,2],[1,4],[-1,2],[-2,8],[0,2],[1,4],[2,3],[1,7],[1,2],[4,1],[6,10],[4,3],[1,6],[0,2],[4,3],[0,4],[-5,14]],[[3332,5676],[1,-1],[4,-9],[2,-2],[1,0],[0,2],[2,-1],[5,-6],[8,-11],[11,-19],[3,-8],[2,-3],[3,-9],[1,-4],[0,-16],[-3,-12],[-1,-8],[1,-4],[2,6],[3,7],[3,2],[3,-3],[3,-1],[3,-2],[5,-11],[5,-8],[2,-7],[5,-3],[4,-6],[1,-5],[0,-12],[-1,-19]],[[3410,5503],[-1,-4],[0,-2],[-1,-4],[-1,-2],[1,-5],[2,-1],[0,-3],[-2,-2],[-1,-3],[0,-5],[-7,0],[-2,-1],[-2,0],[-1,-2],[-2,-2],[-1,0],[-2,-6],[1,-2],[1,-4],[0,-8],[-2,-7],[-2,-13],[-1,-3],[0,-10],[4,-9],[1,-4],[1,-6],[3,-5],[2,-4],[0,-7],[1,-2],[3,-1],[2,1],[0,1],[3,0],[1,-2],[0,-10],[1,-2],[0,-3],[1,-5],[0,-8],[2,-5],[1,-1],[1,-5],[1,-3],[1,-6],[1,-3],[2,-8],[2,-5],[1,-7],[2,-4],[2,-2],[2,0],[2,-4]],[[8172,6463],[-1,-1],[-2,4],[2,2],[1,-2],[0,-3]],[[8165,6463],[-4,0],[1,4],[3,-1],[0,-3]],[[8173,6482],[0,-5],[2,-4],[-2,-1],[0,-5],[-4,4],[-3,1],[-2,-1],[-2,4],[4,3],[0,2]],[[7046,2123],[-3,-3],[-4,0],[-3,9],[-2,3],[1,1],[2,-2],[6,-2],[6,-6],[-3,0]],[[2689,6047],[-7,1],[-3,-2],[-3,-6],[-1,1],[-2,-2],[-3,-4],[-3,-1],[-3,1],[-1,-1],[0,-2],[-2,-1],[-2,2],[-1,-4],[-3,1],[-2,-3],[-2,-1],[-3,2],[-2,3],[-2,4],[-2,1],[-3,-3],[-2,-4],[0,-4],[-1,-2],[-1,0],[-1,-3],[-1,-5],[0,-6],[-3,-3],[-2,-3],[-3,-7],[-3,-5],[-3,-2],[-1,-3],[0,-4],[-2,-1],[-5,7],[-2,5],[-3,-4],[-5,-13],[-8,1],[-3,-1],[-1,-1],[0,-6],[1,-13],[1,-6],[-1,-2],[-2,0],[-2,-1],[-1,-2],[0,-3],[-1,-3],[0,-4],[-3,-3],[-8,-1]],[[2573,5931],[0,6],[-2,2],[-2,9],[0,4],[-3,2],[-3,-1],[-3,2]],[[2560,5955],[2,3],[0,3],[-1,1],[0,4],[1,4],[1,9],[-1,2],[-2,2],[-2,1],[-3,-1],[-1,1],[-1,3],[-2,2],[-4,-3],[-5,-5],[-1,0],[0,7],[-2,2],[-3,1],[-2,3],[-3,3],[0,2],[-4,5],[-1,3],[-2,4],[-2,-1],[-5,4]],[[2548,6089],[3,-1],[2,3],[2,2],[2,4],[1,1],[5,2],[2,0],[2,-5],[2,-2],[3,2],[3,0],[10,-4],[4,2],[8,0],[3,-1],[5,6],[3,1],[4,3],[0,3],[4,0],[9,-6],[9,1],[3,3],[2,1],[9,-6],[2,-5],[2,0],[2,1],[0,1],[-2,1],[-1,2],[8,-3],[13,-23],[0,-1],[-5,6],[-3,0],[-1,-1],[0,-6],[2,0],[1,1],[2,-1],[5,-10],[1,0],[1,2],[2,1],[2,-3],[4,1],[3,-9],[3,-5]],[[2599,6127],[-5,-5],[1,4],[3,3],[1,-2]],[[2614,6131],[-2,-3],[-1,2],[1,3],[3,1],[-1,-3]],[[5461,7660],[6,-2],[3,1],[4,-1],[0,-3],[-3,1],[-4,-2],[-3,1],[-3,5]],[[5511,7635],[0,-2],[2,-6]],[[5513,7627],[-10,12],[-9,9],[-7,3],[-9,7],[-1,4],[14,-11],[-1,3]],[[5477,7667],[-15,0],[-3,1],[-5,4],[4,1],[4,-1],[1,-2],[14,-3]],[[5465,7676],[-4,-1],[-6,3],[1,4],[4,0],[7,-2],[1,-3],[-3,-1]],[[5421,7737],[-1,-2],[-2,3],[-2,5],[-3,3],[-1,3],[0,4],[1,0],[9,-15],[-1,-1]],[[5411,7761],[-4,1],[-1,2],[1,2],[2,-1],[2,-4]],[[5401,7756],[-1,0],[-3,13],[-1,3],[1,2],[-1,10],[2,1],[0,-5],[1,-3],[2,-3],[-1,-6],[1,-9],[0,-3]],[[5410,7774],[-3,-1],[-2,2],[0,2],[-3,0],[-2,3],[4,8],[3,-8],[1,-1],[2,-5]],[[5524,7829],[0,-4],[-2,-2],[2,-4],[1,-6],[-1,-3],[1,-3],[4,-2],[-2,-3],[0,-4],[2,-3],[5,-4],[2,0],[2,-4],[0,-2],[-6,0],[-4,-2],[2,-9],[-1,-3],[-2,-3]],[[5487,7656],[-1,2],[-6,9],[-5,5],[-7,11],[-8,4],[-6,4],[-3,0],[-4,-2],[-4,1],[-1,3],[0,5],[-4,4],[-4,5],[-5,5],[-10,20],[5,2],[2,0],[0,3],[-3,3],[-8,12],[-2,6],[-1,7],[1,9],[-1,6],[-7,8],[-2,4],[-4,3],[-2,0],[-2,-4],[-1,-7],[-4,-9],[-1,-4],[-2,-5],[-2,-1],[-1,1],[-3,9],[-3,6],[-1,4],[0,4],[-3,14],[2,2]],[[5376,7805],[1,-2],[7,-3],[2,1],[2,4],[2,-2],[8,0],[2,1],[2,6],[2,3],[2,-5],[2,-3],[3,-3],[3,2],[5,-3],[3,0],[3,1],[-1,4],[0,5],[1,2],[-2,4],[5,4],[5,2],[1,2],[0,11],[-2,3],[1,5],[4,2],[2,2],[4,2],[3,5],[4,-1],[0,7],[2,3],[6,-2]],[[5458,7862],[6,-5],[4,-5],[2,-5],[2,-3],[3,-3],[3,-4],[4,-7],[6,-2],[1,-3],[5,-4],[4,-1],[8,-1],[5,0],[4,3],[2,5],[2,0],[5,2]],[[2977,6265],[-1,-4],[-7,5],[-5,6],[0,3],[3,1],[3,-2],[4,-4],[3,-5]],[[3006,6222],[-3,5],[-2,4],[-3,2],[-13,0],[-3,-3],[-4,-1],[-3,0],[-8,3],[-3,2],[-3,1],[-7,-2],[-3,-2],[-2,-4],[-1,-4],[-1,-1],[-3,6],[-6,8],[-6,4],[-2,6],[3,10],[3,2],[5,-1],[6,-4],[5,0],[3,-3],[19,-4],[3,-1],[3,2],[2,5],[6,0],[1,1],[1,3],[0,3],[-4,4],[-5,9],[-4,10],[2,3],[-1,7],[2,11],[-10,10],[-7,1],[-3,2],[-1,3],[1,5],[5,5],[3,1],[7,1],[7,-1],[5,-5],[6,-4],[11,-3],[1,1]],[[2981,6337],[1,-1],[-1,-2],[-5,3],[-2,0],[-1,2],[4,2],[4,-4]],[[5634,7945],[0,-1],[-5,-8],[-3,-2],[-2,1],[-6,-3],[-1,-1],[-4,-8],[-3,-3],[0,-7],[-1,-2],[-2,-1],[-1,-2],[-2,-10],[-4,-7],[0,-3],[-1,-5],[-3,-5],[0,-5],[-2,-3],[-3,-2],[-1,-2],[-1,-5],[1,-4],[-2,-2],[-2,-6],[-3,-2],[-5,1],[-2,-1],[-1,-3],[-2,-3],[-4,1],[-7,-2],[-1,-1]],[[5561,7839],[-2,2],[-6,1],[-3,-1],[-6,2],[-3,-1],[-3,-6],[-5,-4],[-4,1],[-4,-4],[-1,0]],[[5458,7862],[-1,1],[-3,7],[0,3],[-1,1],[-1,4],[0,3],[-1,1],[-5,1]],[[5475,7948],[1,1],[3,-1],[6,-6],[4,-5],[3,-2],[6,0],[5,-1],[16,2],[2,4],[-1,2],[0,3],[1,3],[3,3],[10,1],[6,2],[2,6],[2,1],[2,-1],[3,-3],[4,-1],[5,5],[6,4],[4,12],[0,1],[4,2],[7,-1],[5,-2],[4,0],[5,3],[2,0],[1,-2],[2,-1],[2,-6],[2,-3],[2,-1],[9,4],[1,0]],[[5614,7971],[2,1],[2,-3],[0,-2],[2,-4],[4,-3],[2,-4],[3,-2],[3,0],[2,-4],[0,-5]],[[8414,4555],[-3,0],[-1,1],[0,5],[1,2],[6,4],[2,3],[4,7],[3,3],[0,-5],[1,-5],[-3,-3],[-3,-6],[-6,-4],[-1,-2]],[[8384,4573],[-4,1],[-1,1],[3,3],[2,4],[4,0],[-1,-5],[-3,-4]],[[8427,4590],[-3,-2],[0,4],[2,5],[2,2],[1,-3],[-2,-2],[0,-4]],[[8332,4643],[2,-2],[4,-5],[1,-2],[0,-4],[1,-2],[2,-1],[2,1],[2,-2],[1,-3],[3,-5],[1,-5],[3,-3],[1,-5],[-1,-4],[-3,-6],[-1,-1],[-2,0],[-4,-4],[-1,2],[-4,1],[-3,3],[-3,4],[-1,5],[-2,4],[-3,3],[-6,8],[-4,1],[-1,-1],[-2,0],[-7,4],[-2,2],[-1,3],[0,3],[-1,3],[2,5],[4,3],[3,1],[4,0],[5,1],[5,-2],[2,1],[2,4],[2,-5]],[[8444,4645],[2,-4],[5,-1],[1,1],[3,6],[0,7]],[[8455,4654],[4,2],[2,2],[2,3],[6,7]],[[8469,4668],[0,-6],[1,-1],[4,4],[1,-3],[0,-4],[-1,-4],[-4,0],[0,-6],[2,-5],[1,-8]],[[8473,4635],[-2,-3],[-1,-5],[-4,-6],[-3,-9],[-3,-4],[-3,-6],[-2,-3],[-7,-2],[-6,-7],[-3,-2],[-3,-1],[-3,2],[-1,3],[0,3],[3,8],[-3,3],[0,3],[2,15],[1,5],[7,14],[2,2]],[[8210,4678],[-1,-2],[-2,4],[-1,1],[2,3],[1,0],[1,-3],[0,-3]],[[8415,4691],[-1,-3],[-2,1],[1,3],[0,2],[3,3],[0,-3],[-1,-3]],[[8317,4680],[-1,-1],[-1,1],[0,9],[1,2],[0,5],[3,-1],[1,-2],[0,-2],[-3,-7],[0,-4]],[[8424,4702],[0,-2],[-8,0],[0,3],[2,4],[3,2],[4,-2],[-1,-5]],[[8239,4687],[-4,-12],[2,-4],[-6,-2],[-9,3],[-5,3],[0,5],[5,-2],[1,2],[0,17],[4,9],[2,3],[3,2],[7,-5],[2,-3],[0,-3],[-2,-13]],[[8451,4704],[-2,-4],[-1,-6],[-1,-2],[-2,-1],[-1,6],[-3,0],[1,5],[1,2],[2,0],[1,-2],[4,9],[2,-2],[-1,-5]],[[8441,4707],[-4,-2],[-2,-7],[-2,0],[-1,-3],[0,-3],[-1,-2],[-2,2],[-2,-3],[-3,3],[-2,0],[2,5],[4,5],[-2,4],[2,1],[2,0],[2,-1],[5,6],[3,-3],[1,-2]],[[8857,4700],[-2,-1],[-7,2],[0,4],[3,6],[2,2],[1,0],[3,-10],[0,-3]],[[8264,4701],[-2,1],[1,3],[-1,4],[0,3],[2,2],[3,0],[0,-2],[-3,-11]],[[8306,4709],[-1,0],[0,4],[2,1],[1,-3],[-2,-2]],[[8459,4714],[1,-3],[2,2],[7,0],[5,-2],[1,-7],[-1,-2],[-19,-5],[-2,3],[2,5],[-1,3],[1,4],[2,3],[2,-1]],[[8549,4717],[5,-3],[3,1],[1,-2],[-3,-5],[-6,4],[-1,4],[1,1]],[[8409,4687],[-4,-2],[-4,-4],[-2,-1],[-9,0],[-7,-7],[-5,-2],[-2,4],[-2,1],[-3,0],[-2,-6],[-4,1],[-3,-2],[-3,0],[-5,5],[-7,2],[-6,-1],[-6,3],[-3,-2],[-3,-3],[0,3],[-2,6],[0,8],[1,2],[0,3],[1,3],[2,-1],[4,4],[3,5],[4,2],[2,0],[1,-1],[4,2],[4,-5],[4,0],[6,-6],[4,-3],[3,-4],[2,-2],[3,0],[2,3],[2,1],[2,0],[3,1],[3,2],[2,-2],[6,-7],[2,-1],[3,2],[1,2],[0,3],[2,5],[5,4],[3,3],[2,5],[-4,2],[2,5],[2,-1],[2,-2],[0,-10],[-2,-3],[0,-2],[-3,-4],[1,-5],[-2,-3]],[[8634,4704],[-1,3],[5,10],[2,-2],[2,0],[-3,-5],[-4,-2],[-1,-4]],[[8283,4704],[2,-2],[1,0],[2,4],[2,1],[2,0],[3,-3],[1,-4],[1,3],[3,3],[2,-1],[2,-2],[1,-7],[0,-6],[3,-6],[-2,-4],[-2,-1],[-2,3],[-5,-2],[0,-2],[3,-2],[-1,-2],[-2,2],[-2,0],[-5,-3],[-2,0],[0,9],[-1,2],[-5,-10],[-2,-1],[-2,1],[-5,-5],[-2,1],[-2,0],[-6,-6],[-4,-1],[-4,0],[-2,-2],[-3,-2],[-2,2],[-3,1],[-3,5],[0,4],[1,5],[0,12],[1,4],[2,1],[4,4],[3,4],[2,0],[4,-3],[2,-1],[3,1],[2,-2],[1,-4],[0,-2],[1,-1],[3,-7],[2,0],[3,-1],[3,4],[3,0],[1,3],[-2,4],[-3,4],[-2,0],[-5,7],[-1,3],[-1,5],[1,3],[3,3],[1,0],[6,-2],[1,-1],[1,-7],[1,-3]],[[8206,4714],[2,-3],[4,-9],[1,-3],[-2,-2],[-2,-4],[-7,-6],[-1,-3],[-1,-5],[0,-2],[-1,-3],[-2,0],[-1,1],[1,3],[0,4],[-2,8],[-6,8],[-3,2],[-4,1],[-3,6],[0,3],[-1,3],[1,3],[4,-1],[5,-3],[5,0],[4,7],[1,0],[8,-5]],[[8605,4725],[-1,-5],[-2,0],[-4,7],[1,5],[0,2],[6,-1],[0,-8]],[[8521,4742],[0,-4],[-3,-1],[-3,-3],[-2,-4],[-1,-5],[-5,2],[-4,1],[-1,1],[-2,0],[-3,-1],[-4,-5],[0,6],[1,4],[4,9],[3,-2],[4,-1],[4,2],[3,4],[4,2],[3,-5],[2,0]],[[8538,4744],[-2,-1],[1,4],[0,4],[3,-1],[0,-3],[-2,-3]],[[8847,4707],[-7,-8],[-9,2],[-3,0],[-5,-2],[-1,1],[1,7],[4,19],[5,17],[2,4],[3,5],[3,3],[7,3],[6,0],[4,-7],[2,-5],[0,-6],[-2,-11],[-3,-10],[-5,-8],[-2,-4]],[[8647,4723],[-1,-1],[-3,1],[-2,0],[0,4],[-1,3],[1,5],[0,6],[2,0],[0,4],[2,8],[2,3],[2,5],[1,1],[1,4],[1,1],[0,4],[3,3],[2,-2],[1,-3],[-3,-4],[2,-10],[-2,-11],[-1,-3],[-3,-3],[0,-3],[-3,-5],[-1,-4],[0,-3]],[[8665,4768],[-1,-2],[-1,1],[-1,3],[-2,1],[3,3],[2,-6]],[[8177,4772],[-1,-2],[-1,1],[-1,4],[1,1],[1,-1],[1,-3]],[[8573,4770],[-1,-2],[-3,3],[1,4],[2,1],[1,-2],[0,-4]],[[8354,4773],[-4,0],[0,6],[4,-3],[0,-3]],[[8161,4774],[0,-1],[-5,1],[-3,-5],[-2,-1],[-9,0],[-1,-1],[-10,5],[-1,4],[1,4],[3,6],[5,1],[26,0],[2,-5],[1,-1],[-6,-4],[-1,-3]],[[8204,4782],[-3,-1],[-2,2],[0,3],[1,2],[3,1],[2,0],[3,-3],[0,-2],[-3,0],[-1,-2]],[[8740,4795],[-1,-1],[-1,1],[0,2],[2,5],[1,0],[0,-3],[-1,-4]],[[7922,4801],[-1,-1],[-2,1],[0,1],[2,4],[2,2],[0,-3],[-1,-4]],[[8741,4806],[-2,0],[-1,4],[2,1],[1,-2],[0,-3]],[[8736,4812],[-1,-4],[0,-4],[-3,-5],[-1,-8],[-1,-2],[-4,-4],[-3,5],[-1,3],[2,18],[0,16],[2,1],[1,-3],[5,-10],[4,-3]],[[7981,4837],[3,-6],[3,-4],[2,-2],[3,0],[3,-1],[4,-2],[5,-1],[2,1],[2,-1],[2,-5],[3,-5],[1,-3],[1,-12],[3,-4],[2,-1],[7,0],[8,-3],[3,0],[2,3],[3,-2],[6,-3],[3,-1],[4,1],[4,0],[1,-1],[4,-2],[1,0],[3,3],[1,5],[2,7],[1,7],[1,3],[2,4],[1,1],[4,0],[1,-2],[4,-12],[1,-1],[5,-1],[3,3],[2,0],[3,-3],[1,-2],[2,-2],[7,-2],[2,-5],[10,0],[3,-2],[2,-14],[1,-3],[3,-2],[1,-2],[0,-15],[6,-6],[6,-3],[7,-1],[11,3],[4,3],[1,0],[9,-8],[1,-2],[1,-5],[0,-7],[-2,-15],[0,-8],[2,-9],[4,-7],[0,-5],[-4,2],[-2,2],[-1,3],[-2,2],[-3,-1],[-6,4],[-7,5],[-12,11],[-4,0],[-6,-4],[-6,-3],[-3,0],[-6,3],[-7,2],[-17,1],[-5,2],[-14,4],[-6,3],[-16,15],[-5,3],[-16,8],[-8,0],[-4,2],[-3,0],[-4,-3],[-2,-1],[-2,-4],[-3,0],[-12,4],[-3,2],[-3,3],[-2,4],[-2,2],[-7,4],[-18,3],[-3,1],[-2,2],[-1,3],[0,4],[2,8],[1,3],[-9,7],[-7,4],[-3,1],[-3,0],[-4,-1],[-5,2],[-2,0],[-1,-1],[-2,1],[0,3],[1,3],[2,3],[1,0],[0,-5],[2,-2],[1,1],[3,6],[0,3],[2,9],[1,-2],[2,2],[2,20],[2,6],[3,4],[1,2],[3,-3],[5,-1],[3,-2],[6,-2],[4,-3],[2,0],[1,1],[2,4],[1,6],[3,-3],[5,-1],[1,-2]],[[8445,4839],[-1,-3],[-1,4],[-1,1],[0,4],[2,-2],[1,-4]],[[8347,4821],[-1,-10],[-1,3],[0,9],[-1,4],[1,5],[-1,13],[1,6],[2,-8],[0,-22]],[[8130,4849],[-1,-2],[-2,0],[-1,2],[2,4],[2,-1],[0,-3]],[[8688,4846],[-2,-5],[-1,2],[-1,0],[0,10],[-1,7],[2,0],[0,-2],[1,-1],[2,-7],[0,-4]],[[8742,4855],[-1,-3],[0,-4],[1,-4],[-1,-3],[1,-6],[0,-9],[-1,-5],[-2,-3],[0,-1],[-6,1],[-5,10],[-2,5],[-1,1],[0,3],[4,0],[0,2],[1,8],[-3,5],[0,3],[1,1],[2,-2],[4,9],[0,2],[1,5],[2,1],[1,-1],[1,-3],[0,-5],[1,-1],[2,-6]],[[8691,4843],[0,13],[2,4],[3,17],[1,0],[1,-2],[-2,-13],[-4,-9],[-1,-10]],[[7842,4868],[-2,-1],[-5,10],[1,2],[2,0],[4,-5],[1,-2],[-1,-4]],[[8433,4880],[0,-6],[-1,0],[-2,4],[0,2],[1,1],[2,-1]],[[8389,4870],[-2,-1],[-3,6],[-2,6],[2,5],[0,4],[1,1],[2,0],[1,-4],[1,-1],[0,-16]],[[8405,4880],[0,-4],[-2,-3],[-2,0],[-3,3],[0,-3],[-2,0],[-1,4],[2,10],[2,4],[-1,4],[-1,9],[1,5],[4,3],[5,5],[1,-3],[1,-15],[-4,-12],[0,-7]],[[8420,4921],[1,-12],[-2,1],[-2,0],[-1,-5],[0,-5],[-1,-3],[0,-12],[2,1],[2,-4],[2,-2],[0,-4],[-2,-3],[-2,-2],[-2,2],[-1,-1],[0,-2],[-1,-2],[0,-3],[-2,-6],[-1,-2],[-2,2],[-1,-2],[-2,0],[-1,7],[0,3],[1,4],[0,2],[1,3],[2,4],[1,3],[0,2],[1,7],[0,7],[1,6],[0,12],[3,10],[3,4],[0,-3],[3,-7]],[[8709,4939],[-2,-1],[-5,5],[0,4],[4,-6],[3,-2]],[[8422,4946],[-3,-7],[-2,1],[-2,4],[0,5],[-1,2],[2,3],[5,-1],[1,-2],[0,-5]],[[8570,4977],[-5,-3],[1,5],[1,2],[2,-2],[1,-2]],[[8562,4972],[-2,-4],[-1,2],[-2,1],[-3,-5],[-2,2],[0,3],[3,5],[3,1],[4,4],[1,0],[0,-3],[-1,-2],[0,-4]],[[8574,4979],[0,-3],[-3,1],[-1,4],[1,1],[2,-1],[1,-2]],[[8233,4984],[-1,-10],[-2,5],[2,7],[1,-2]],[[8543,4992],[-2,-1],[-1,3],[2,2],[1,-4]],[[8229,4960],[-6,-10],[0,13],[-2,7],[1,5],[1,9],[1,7],[4,5],[0,-8],[1,-3],[0,-16],[1,-2],[-1,-4],[0,-3]],[[8523,5005],[4,-4],[2,-6],[2,-4],[2,-3],[0,-14],[-4,-2],[-4,-6],[-2,-1],[-2,0],[-3,-2],[-4,3],[-4,4],[-6,7],[-1,3],[-3,6],[0,4],[-1,11],[2,3],[4,-2],[2,3],[7,2],[7,0],[2,-2]],[[8554,5014],[-2,-5],[-2,1],[2,3],[2,1]],[[7968,5010],[-1,-1],[-2,2],[-1,3],[1,2],[3,-2],[0,-4]],[[7984,5016],[-1,-1],[-1,1],[0,2],[1,2],[2,-1],[-1,-3]],[[8603,5018],[6,-6],[4,-1],[5,1],[2,-1],[6,-8],[1,-6],[1,-4],[0,-5],[3,-2],[2,-6],[1,-2],[-2,-17],[-6,6],[-6,7],[-3,3],[-7,6],[-2,5],[-3,4],[-9,0],[0,-6],[-1,-2],[-4,3],[-3,1],[-3,2],[-4,2],[0,5],[-3,0],[-2,-2],[-4,-9],[-3,-1],[-2,0],[-1,2],[-4,10],[-1,2],[-2,2],[-3,-1],[0,-3],[-1,-4],[0,-2],[-2,-6],[-1,-4],[-1,1],[1,6],[0,3],[-1,3],[0,4],[6,16],[3,4],[10,2],[6,-1],[3,0],[3,1],[2,0],[0,-3],[1,-3],[2,0],[3,3],[2,4],[2,2],[3,0],[2,-1],[4,-4]],[[7788,5000],[1,-8],[-3,5],[0,7],[-2,3],[-2,4],[-1,10],[1,2],[1,0],[7,-15],[-1,-4],[0,-2],[-1,-2]],[[8004,5011],[0,-6],[-1,-3],[-3,-5],[-2,1],[0,3],[-3,5],[-1,-1],[0,-4],[-5,-2],[0,4],[-2,4],[0,8],[1,3],[0,4],[1,4],[0,9],[5,3],[1,-2],[6,-2],[4,-6],[2,-8],[-3,-9]],[[7782,5025],[-2,-4],[-3,0],[-1,3],[0,14],[1,1],[5,-10],[0,-4]],[[8731,5061],[-1,2],[1,3],[1,0],[-1,-5]],[[7772,5048],[0,-1],[-4,5],[-2,1],[-2,6],[0,6],[1,2],[1,0],[2,-3],[1,-6],[2,-6],[1,-4]],[[8500,5042],[-2,2],[-1,9],[-1,2],[-1,9],[0,2],[2,4],[1,-1],[0,-11],[2,-11],[0,-5]],[[8439,5071],[0,-3],[-1,0],[-1,5],[2,-2]],[[8499,5080],[9,-2],[-1,-2],[-10,-3],[-3,1],[-10,-2],[-1,0],[0,3],[-1,2],[1,2],[2,1],[6,-1],[8,1]],[[8420,5079],[-2,-5],[-1,2],[1,4],[1,1],[1,-2]],[[8620,5086],[0,-3],[2,-4],[-1,-5],[-1,0],[1,-4],[-3,-2],[-1,-3],[-4,-1],[-1,2],[-5,3],[-4,5],[-1,2],[8,6],[3,2],[2,0],[4,2],[1,0]],[[8470,5085],[3,-2],[1,0],[0,2],[1,1],[1,-1],[0,-4],[2,0],[2,-2],[0,-4],[-5,-1],[-4,-3],[-5,3],[-5,-5],[-3,-1],[-3,0],[-3,8],[2,10],[1,2],[2,1],[5,0],[8,-4]],[[8762,5092],[11,-3],[3,0],[6,-1],[5,-4],[9,-1],[3,-1],[2,-2],[-5,-3],[-2,-2],[-5,-1],[-4,1],[-2,-1],[-1,2],[-4,2],[-5,4],[-11,5],[0,5]],[[8025,5090],[-3,-2],[-1,5],[2,2],[2,-2],[0,-3]],[[7944,5087],[1,-4],[2,-3],[1,-4],[1,-19],[4,-16],[13,-6],[-2,-2],[-2,-5],[-2,-11],[0,-3],[2,-8],[-2,0],[-2,1],[-2,4],[-2,1],[-4,5],[-3,2],[-4,2],[-2,4],[0,17],[-2,2],[-1,6],[-1,8],[-2,2],[-3,2],[-1,2],[-6,-3],[-3,3],[-3,2],[0,4],[2,3],[3,3],[2,3],[0,3],[-1,3],[2,6],[1,2],[4,2],[2,-8],[1,-3],[1,4],[-1,7],[3,2],[3,0],[2,-2],[1,-3],[0,-5]],[[8432,5085],[-2,0],[-1,1],[0,9],[1,2],[1,-1],[0,-4],[1,-2],[0,-5]],[[8558,5088],[-1,-3],[-5,1],[-5,0],[-5,-2],[-3,2],[-2,3],[0,3],[2,8],[4,5],[1,2],[3,-2],[5,-5],[3,-5],[3,-4],[0,-3]],[[8421,5116],[1,-4],[-1,-3],[1,-6],[3,8],[2,1],[2,-1],[2,-5],[-1,-6],[-2,-3],[-2,-1],[-2,4],[-1,1],[-1,-9],[-2,-2],[-1,2],[0,2],[1,3],[0,11],[-2,-2],[-3,-10],[-3,-4],[-1,2],[-1,7],[1,8],[2,6],[2,0],[5,2],[1,-1]],[[8046,5115],[-5,-6],[-2,1],[-1,2],[1,11],[1,4],[4,0],[2,-2],[2,-5],[-2,-5]],[[8748,5119],[-2,-1],[-1,1],[-2,5],[1,3],[2,2],[1,-2],[0,-3],[2,0],[-1,-5]],[[7753,5081],[-2,0],[-6,6],[-1,4],[0,4],[-6,16],[0,3],[2,13],[5,4],[2,-3],[0,-6],[4,-10],[1,-6],[0,-2],[1,-2],[-1,-2],[3,-7],[1,-3],[0,-7],[-3,-2]],[[8638,5108],[-1,-2],[-4,1],[-2,4],[-1,5],[0,4],[-2,7],[0,1],[7,4],[3,-2],[2,-2],[-1,-13],[-1,-7]],[[8635,5139],[-2,-5],[-12,-4],[1,2],[0,2],[1,1],[4,2],[3,-1],[2,0],[0,3],[3,0]],[[8759,5146],[6,-2],[2,0],[2,-3],[3,1],[1,-1],[5,-8],[3,-6],[3,-5],[3,-2],[-2,-4],[-4,-3],[-2,0],[-3,3],[-2,-1],[-2,4],[0,5],[-3,12],[-2,-4],[-4,6],[-1,0],[-3,5],[0,3]],[[8535,5138],[-1,-1],[-2,2],[-1,0],[1,9],[2,-1],[1,-7],[0,-2]],[[8627,5153],[-1,0],[-3,2],[1,2],[2,2],[2,-1],[1,-2],[-2,-3]],[[8384,5160],[1,-3],[-1,-3],[-1,1],[-3,0],[-1,-2],[-1,0],[0,3],[3,4],[1,-1],[2,1]],[[8915,5033],[0,-46]],[[8915,4987],[0,-24],[0,-23],[0,-24],[0,-23],[0,-35],[0,-40],[-1,-6],[-2,-10],[-1,-7],[2,-6],[2,-3],[0,-45],[0,-24],[0,-23],[0,-36]],[[8915,4658],[-2,2],[-4,6],[-3,8],[-2,7],[-3,6],[-11,18],[-4,12],[-8,-2],[-4,-2],[-4,-1],[-3,4],[0,8],[-2,-6],[-3,-4],[-4,-7],[-2,4],[0,3],[1,3],[0,3],[1,8],[2,4],[1,8],[1,3],[0,3],[-1,4],[-2,1],[-1,2],[-1,6],[-1,2],[-2,2],[-1,3],[1,2],[2,1],[-1,3],[-3,4],[-3,8],[0,1],[2,2],[5,1],[-4,8],[-1,6],[-1,3],[-4,7],[-2,6],[-2,13],[-2,10],[2,6],[-2,0],[-3,2],[2,5],[0,2],[-2,-2],[-3,0],[0,15],[-2,2],[-2,3],[-2,1],[-2,2],[-1,4],[-12,13],[-1,4],[-2,-2],[-2,2],[-1,2],[-2,-1],[-2,2],[-3,0],[-6,5],[-7,7],[-5,2],[-3,4],[-3,3],[-7,3],[-8,2],[-7,0],[-12,15],[-2,6],[0,8],[-2,-2],[-2,0],[-4,4],[-4,-2],[-2,3],[0,4],[-1,2],[-3,-2],[-2,0],[-2,6],[-2,4],[-3,4],[-1,6],[0,13],[3,6],[1,5],[-2,1],[-3,-8],[0,-10],[-1,-3],[-3,0],[1,-6],[-1,-6],[-3,-10],[1,-3],[-1,-3],[-4,-10],[-5,0],[-3,-2],[-1,3],[-2,2],[0,4],[-2,7],[-1,7],[3,9],[-1,8],[-2,7],[-5,9],[-6,9],[-3,2],[-5,1],[-2,4],[-1,4],[3,1],[5,5],[2,0],[7,-3],[2,-2],[2,-1],[5,7],[4,10],[2,2],[2,1],[2,-1],[5,-4],[3,-1],[2,0],[1,-3],[2,-2],[0,5],[1,5],[2,2],[1,0],[1,2],[0,5],[-3,0],[2,4],[2,5],[0,2],[-6,-5],[-6,-2],[-4,1],[-4,0],[-7,-4],[-3,1],[-6,1],[-4,2],[-2,-2],[-3,0],[-3,4],[-3,8],[-2,3],[-1,3],[-1,13],[-1,8],[-5,2],[-12,8],[-3,-3],[-2,-1],[-4,2],[1,3],[1,5],[1,2],[2,2],[1,3],[2,9],[0,9],[5,4],[10,5],[2,2],[2,5],[3,2],[2,5],[7,6],[7,0],[6,-4],[6,-5],[11,-13],[11,0],[5,-2],[2,-4],[-1,-3],[0,-6],[1,-6],[4,-12],[0,-3],[-1,-7],[0,-3],[-2,-5],[-1,-6],[0,-7],[1,-7],[0,-13],[1,-7],[5,-18],[3,-12],[0,15],[1,2],[2,2],[2,-5],[0,-7],[1,-13],[2,0],[2,2],[1,-4],[0,-14],[1,-2],[5,-6],[5,-1],[3,0],[3,2],[2,4],[2,5],[6,11],[2,5],[2,8],[1,2],[6,9],[1,3],[2,11],[1,3],[6,3],[7,2],[6,5],[3,5],[0,3],[-1,5],[0,2],[1,2],[12,14],[6,5],[2,0],[6,-8],[15,-10],[2,-3],[2,-4],[3,-3],[4,-1],[3,-3],[3,-4],[6,-6],[9,-8],[10,0],[2,-4],[2,0],[9,-2],[3,-3],[0,-6],[7,0]],[[7901,5164],[2,-6],[1,-2],[-2,-7],[-1,-1],[-2,2],[-1,-5],[-1,7],[-2,5],[1,4],[2,-1],[3,4]],[[8542,5165],[3,-9],[-2,-8],[2,-4],[4,-1],[1,-1],[0,-2],[1,-3],[-1,-3],[-2,-2],[-3,3],[-1,4],[-4,-2],[-1,0],[0,9],[-2,3],[-2,5],[0,3],[1,4],[-1,3],[2,0],[2,-4],[1,4],[1,2],[1,-1]],[[8533,5155],[-1,-2],[-2,0],[-1,6],[1,8],[2,2],[2,-2],[-1,-2],[1,-4],[-1,-6]],[[7880,5163],[-3,-2],[-4,2],[0,3],[2,4],[2,0],[3,-3],[1,-2],[-1,-2]],[[8632,5183],[5,-2],[1,0],[7,-6],[1,-3],[0,-3],[1,-2],[-2,-5],[-1,0],[-4,2],[-2,-1],[-2,1],[-1,4],[-3,2],[-3,9],[-2,-1],[0,-3],[2,-2],[2,-6],[2,-1],[2,-3],[0,-4],[-4,-1],[-2,3],[0,5],[-2,-2],[-1,-2],[-1,0],[-1,6],[-5,0],[-3,3],[2,3],[0,3],[2,2],[2,-1],[2,2],[1,-1],[1,2],[4,1],[2,1]],[[7734,5153],[-2,-3],[-2,3],[0,3],[3,14],[-3,13],[1,1],[1,-2],[2,-8],[2,-6],[-2,-15]],[[7909,5173],[1,-1],[1,3],[3,-6],[0,-2],[-1,-2],[-6,6],[-4,-2],[-3,3],[3,12],[2,-2],[1,-3],[3,-6]],[[8597,5173],[-1,-1],[-1,4],[-3,3],[-1,7],[6,-11],[0,-2]],[[8539,5183],[-2,1],[1,6],[1,-3],[0,-4]],[[7907,5187],[-1,0],[-2,2],[-3,8],[2,-1],[4,-9]],[[7868,5215],[-3,-1],[-1,1],[0,5],[1,4],[1,0],[2,-5],[0,-4]],[[8538,5220],[-1,0],[0,6],[2,0],[0,-3],[-1,-3]],[[8537,5229],[-1,-2],[-2,3],[1,2],[1,0],[1,-3]],[[7872,5222],[-3,6],[1,4],[1,1],[1,-2],[2,-6],[-2,-3]],[[7883,5229],[-3,2],[0,3],[1,1],[2,-6]],[[7894,5231],[-1,-1],[-3,5],[1,2],[1,-2],[2,-1],[0,-3]],[[7861,5226],[-1,-2],[-1,2],[-5,2],[-2,0],[-5,3],[-2,4],[0,3],[1,2],[0,6],[1,2],[3,-4],[2,-4],[2,-1],[6,-6],[1,-7]],[[7872,5244],[0,-3],[-2,0],[-1,4],[1,3],[1,-3],[1,-1]],[[7864,5233],[0,-1],[-2,0],[-3,6],[-2,3],[-3,2],[-2,0],[0,7],[2,0],[6,-5],[2,-3],[2,-9]],[[7888,5251],[2,-2],[1,1],[0,-4],[-2,-6],[-2,2],[-1,2],[0,5],[2,0],[0,2]],[[7904,5253],[0,-4],[2,-2],[0,-8],[-2,-6],[0,-2],[-2,1],[-1,2],[0,3],[-1,1],[0,6],[-4,-2],[-1,0],[-1,3],[1,2],[4,5],[2,-1],[3,2]],[[7844,5240],[-1,-1],[-2,2],[-2,8],[0,7],[-1,5],[1,3],[1,0],[2,-3],[2,-5],[0,-2],[1,-4],[-1,-5],[0,-5]],[[7707,5268],[6,-17],[2,-2],[3,-7],[1,-3],[-1,-5],[0,-15],[-2,-3],[-4,2],[0,2],[-2,11],[-4,7],[-2,0],[-1,6],[-2,8],[-6,13],[5,0],[3,6],[0,1],[4,-4]],[[7846,5267],[0,-7],[-2,2],[-2,3],[-2,2],[-3,1],[-3,2],[-1,3],[0,4],[12,-7],[1,-3]],[[8468,5241],[-6,-10],[-1,-5],[-2,-5],[-2,-6],[-2,-5],[-4,-4],[-2,-1],[-3,0],[-10,-4],[-3,-1],[-3,1],[-7,1],[-3,5],[-2,4],[-3,1],[-2,-1],[-18,0],[-6,-1],[-6,-2],[-3,1],[-3,2],[-3,1],[-2,0],[-12,-3],[-3,0],[-6,4],[-3,1],[-3,-1],[-3,-4],[-5,-10],[-1,-6],[-2,-7],[-1,-8],[-1,-6],[0,-6],[2,-15],[1,-5],[4,-13],[0,-1],[5,-4],[2,-5],[3,-12],[2,-7],[3,1],[3,-1],[4,-2],[3,4],[2,7],[1,6],[5,10],[2,5],[2,2],[3,-4],[1,-2],[3,-1],[4,1],[3,3],[2,5],[3,2],[7,0],[4,-1],[6,1],[0,2],[-1,3],[5,4],[4,1],[3,-1],[3,-3],[1,-3],[0,-5],[-1,-10],[0,-3],[-2,-1],[-2,2],[-2,5],[-3,2],[-6,-3],[-1,-2],[-4,-12],[-4,-10],[-5,-9],[-2,-3],[-3,-3],[-8,-5],[-3,-4],[-1,-6],[-2,-2],[-2,0],[-2,1],[-3,3],[-2,-7],[2,-1],[3,-4],[2,-7],[4,-3],[3,-7],[4,-12],[1,-7],[2,-5],[6,-9],[0,-8],[3,-9],[-3,-4],[0,-7],[-1,-8],[0,-5],[1,-3],[4,-4],[2,-7],[2,-1],[0,-6],[2,-2],[1,-4],[1,-1],[2,3],[2,-3],[0,-4],[1,-3],[-1,-7],[0,-3],[-2,0],[-2,3],[-1,-2],[1,-2],[-7,0],[-8,-5],[-2,-2],[-2,-5],[0,-3],[1,-7],[-1,-2],[-4,-1],[-4,2],[-5,3],[-2,5],[-1,5],[2,18],[0,2],[2,5],[0,4],[-2,4],[-4,2],[-3,4],[-11,20],[0,9],[4,12],[0,2],[1,9],[0,7],[-1,8],[-1,4],[-4,2],[-3,0],[-3,-1],[-9,-12],[-2,-5],[0,-6],[1,-5],[2,-6],[1,-6],[1,-20],[0,-3],[-1,-6],[-1,-13],[1,-19],[1,-12],[-1,-6],[-3,-21],[0,-3],[3,-14],[1,-6],[0,-6],[-3,3],[-2,0],[-1,-1],[-4,-1],[-3,0],[-2,-1],[-2,-4],[-3,-2],[-4,5],[-3,5],[-2,6],[-1,6],[2,14],[3,11],[0,15],[2,6],[0,6],[1,22],[-1,2],[-3,13],[0,13],[-2,4],[-2,1],[-3,-1],[-7,-3],[-2,3],[-2,11],[-1,7],[0,7],[1,7],[-2,9],[0,3],[2,4],[2,1],[1,2],[4,6],[1,6],[0,7],[1,7],[4,12],[1,6],[-1,10],[0,14],[1,10],[4,19],[4,10],[2,3],[4,-10],[0,5],[-1,5],[-3,34],[1,2],[1,0],[2,2],[0,4],[-1,8],[0,3],[3,12],[2,4],[1,3],[1,7],[4,10],[1,6],[2,1],[1,-6],[4,-4],[3,3],[0,2],[1,3],[2,2],[1,3],[1,6],[3,9],[3,2],[2,0],[4,-4],[2,-1],[2,1],[2,-3],[2,-6],[1,-2],[9,1],[7,-3],[9,-1],[3,-2],[3,-3],[3,-4],[3,-1],[2,4],[3,2],[6,-1],[16,-5],[2,0],[10,10],[4,10],[3,2],[2,9],[1,2],[3,1],[1,2],[4,12],[2,1],[3,-1],[1,-2],[2,-8],[0,-2],[-2,-4],[-1,-1],[-2,-12],[-4,-10]],[[7824,5303],[1,-5],[1,-3],[-1,-3],[-1,-6],[-3,-4],[-3,1],[-1,2],[-2,8],[1,7],[1,2],[2,0],[3,4],[2,-3]],[[8547,5232],[2,-1],[2,0],[1,3],[0,3],[1,6],[3,5],[1,0],[2,2],[-1,5],[2,9],[6,7],[3,2],[4,1],[1,-3],[-1,-3],[1,-6],[0,-15],[-1,-2],[-11,-11],[-1,-4],[0,-4],[4,-6],[6,-5],[1,-2],[1,-4],[0,-5],[2,-2],[2,-1],[2,-5],[-10,7],[-2,3],[-4,0],[-3,1],[-3,3],[-3,0],[-2,-1],[-1,-4],[0,-5],[1,-5],[0,-3],[-1,-6],[3,-17],[3,-14],[4,-14],[2,-5],[-1,-3],[-1,5],[-6,5],[0,2],[-4,14],[-4,7],[-1,3],[-1,5],[1,5],[-1,6],[0,7],[1,8],[-2,5],[-2,6],[-1,7],[0,5],[2,6],[0,3],[-2,5],[-3,12],[0,6],[3,13],[0,6],[1,3],[0,4],[2,8],[3,8],[4,9],[2,3],[2,1],[0,-5],[-3,-10],[-1,-2],[0,-4],[2,-3],[2,-5],[0,-21],[-1,-2],[-3,-8],[-6,-8],[-1,-2],[0,-3],[1,-3],[2,-2]],[[7702,5303],[-3,5],[-3,3],[2,1],[3,-2],[1,-3],[0,-4]],[[8567,5301],[-5,-1],[-1,3],[-1,13],[3,10],[4,5],[3,2],[1,0],[2,-7],[-1,-15],[-3,-7],[-2,-3]],[[8482,5336],[-1,6],[1,3],[1,-1],[0,-2],[-1,-3],[0,-3]],[[7678,5319],[-3,1],[-9,13],[-2,0],[-2,2],[-2,1],[-2,7],[0,3],[2,5],[3,-1],[2,-7],[4,-3],[1,-3],[7,-9],[1,-3],[0,-6]],[[8023,5351],[-1,-3],[-1,2],[2,1]],[[7936,5348],[-1,0],[0,12],[1,-3],[2,-2],[1,0],[-1,-4],[-2,-3]],[[7951,5365],[0,-4],[-2,2],[0,6],[2,0],[0,-4]],[[8267,5372],[0,-2],[-3,5],[0,6],[2,0],[2,-1],[-1,-8]],[[8489,5381],[-1,-2],[-3,4],[0,7],[-1,3],[0,5],[2,-3],[1,-6],[2,-5],[0,-3]],[[8522,5400],[-2,3],[0,2],[1,1],[1,-3],[0,-3]],[[8519,5406],[-2,4],[-1,6],[2,-2],[1,-5],[0,-3]],[[8267,5423],[2,0],[4,1]],[[8273,5424],[1,-5],[0,-2],[-5,-3],[-3,7],[1,2]],[[8007,5396],[-3,-2],[-3,3],[4,4],[0,2],[-4,2],[-1,2],[-1,6],[0,3],[5,9],[2,1],[0,-4],[4,-9],[0,-9],[-3,-8]],[[8044,5300],[-3,-7],[1,-3],[0,-3],[2,-1],[1,-10],[4,-10],[2,-2],[2,-4],[2,-6],[2,-2],[6,-11],[2,-4],[3,-4],[3,1],[9,8],[2,0],[3,2],[5,-1],[5,-2],[2,0],[2,1],[2,0],[2,-1],[5,6],[4,2],[3,17],[2,3],[2,2],[4,2],[13,1],[2,-5],[-1,-2],[2,-1],[2,-2],[7,-4],[2,-2],[2,1],[3,-5],[2,2],[2,3],[2,4],[2,3],[2,1],[4,0],[4,1],[3,2],[4,-3],[1,1],[0,3],[2,5],[1,4],[0,8],[1,2],[3,2],[0,8],[-1,1],[-1,7],[1,3],[0,2],[2,1],[3,5],[4,5],[2,5],[0,2],[-1,3],[-2,1],[0,5],[1,2],[0,8],[2,5],[2,3],[2,-2],[4,2],[1,5],[0,13],[1,1],[1,5],[0,3],[-1,8],[1,5],[0,12],[1,2],[2,13],[3,3],[1,5],[2,1],[3,-4],[4,4],[2,1],[3,-1],[2,-3],[3,4],[2,-2],[2,0],[1,1],[4,-1],[7,0],[5,-2],[5,-6],[4,-1]],[[8265,5424],[-3,-3],[0,-3],[2,-5],[0,-3],[5,-8],[0,-2],[1,-2],[0,-2],[-1,-3],[-3,0],[-2,2],[-1,3],[-1,-4],[-1,-2],[-4,1],[-4,0],[-1,-2],[1,-1],[5,-9],[1,-4],[-1,-7],[0,-3],[2,-1],[3,-4],[1,0],[2,-2],[0,-7],[2,-3],[-2,-4],[3,-3],[2,-1],[0,-5],[2,-7],[4,-10],[1,-3],[0,-6],[-3,-3],[-2,-4],[0,-2],[-2,-2],[2,-3],[1,-6],[5,-10],[11,-16],[4,-6],[6,-13],[3,-3],[1,-3],[-3,-6],[-4,-2],[-6,-2],[-6,2],[-3,2],[-3,3],[-2,6],[-3,4],[2,-8],[-2,-8],[-4,-4],[-1,-2],[-5,-22],[-1,-6],[-1,-25],[0,-7],[2,-14],[0,-7],[1,-3],[-2,-4],[-4,-4],[-4,-3],[-2,-5],[-2,-6],[-2,-4],[-3,-2],[-2,0],[-1,2],[-1,-1],[0,-7],[-1,-3],[-3,-3],[-2,-3],[0,-4],[-2,-5],[-4,-4],[-1,-2],[0,-3],[2,1],[2,-1],[0,-15],[-3,-5],[3,-3],[3,-1],[1,-5],[-1,-7],[0,-5],[-3,-2],[-2,1],[-1,-2],[1,-1],[0,-15],[-2,-7],[-2,-1],[-1,2],[-1,-3],[1,-2],[2,-6],[-2,-3],[-1,-3],[-3,-7],[-1,-4],[0,-6],[-1,-4],[-20,-18],[-15,-15],[-2,1],[0,2],[-1,24],[-2,12],[0,7],[-2,-6],[-2,0],[-2,4],[0,2],[-1,4],[-1,-3],[-2,0],[-2,4],[-4,-6],[-4,-4],[-3,0],[-2,2],[0,13],[-3,1],[-3,-3],[-1,1],[-1,-2],[-8,18],[-2,-14],[-6,-8],[-5,-5],[-4,2],[-4,3],[-5,-3],[-4,-9],[-3,-1],[-1,1],[0,30],[-2,4],[-2,3],[-2,-5],[-3,0],[-4,2],[-3,-1],[-6,-6],[-3,-1],[-2,2],[-1,3],[0,3],[-3,-5],[-1,1],[-3,7],[-5,-3],[-1,0],[-1,-3],[-2,1],[0,3],[-3,40],[-1,13],[-1,3],[-3,5],[0,7],[2,6],[0,14],[-1,7],[-1,5],[-2,5],[-3,5],[-3,4],[-6,4],[-3,0],[-2,2],[0,6],[1,3],[2,1],[0,2],[-3,3],[-3,5],[-1,3],[0,10],[1,5],[0,2],[1,8],[2,2],[-1,3],[-2,2],[0,3],[-2,5],[-4,6],[-1,10],[0,22],[1,13],[2,4],[2,1],[0,2],[-2,-1],[1,11],[3,10],[3,6],[1,6],[2,6],[7,6]],[[8521,5416],[-1,-2],[-2,1],[0,3],[2,5],[1,6],[-1,1],[-1,4],[0,4],[1,7],[1,0],[2,-4],[0,-6],[1,-5],[-2,-6],[-1,-8]],[[7679,5484],[3,0],[7,3],[3,0],[4,-2],[2,-2],[8,2],[2,-2],[5,-9],[5,-10],[2,-6],[1,-6],[7,-14],[1,-6],[-1,-7],[1,-6],[7,-5],[3,-4],[2,-6],[2,-4],[2,-3],[8,-7],[10,-16],[6,-7],[7,-17],[1,-6],[3,-8],[5,-11],[1,-3],[2,-4],[1,-5],[2,-4],[2,-3],[3,-1],[3,-7],[2,-2],[0,5],[-2,6],[0,3],[2,5],[1,0],[4,-2],[5,-9],[2,-5],[1,-7],[2,-7],[2,-4],[5,-2],[3,-2],[7,-11],[2,-4],[1,-6],[2,-7],[0,-7],[7,-14],[3,-2],[8,-1],[5,-8],[1,-5],[-2,-5],[-6,-7],[0,-3],[3,2],[3,3],[3,4],[6,7],[4,-2],[3,-5],[3,-6],[1,-7],[2,-7],[-3,-4],[-3,-3],[-4,-7],[-1,-3],[1,-1],[-1,-6],[3,-3],[0,-3],[-2,-3],[0,-3],[4,-13],[4,-5],[6,-5],[3,-3],[4,-1],[5,0],[0,-2],[1,-10],[1,-6],[1,-14],[1,-6],[0,-7],[1,-5],[3,-4],[4,-3],[1,-3],[0,-8],[-2,-3],[-3,-6],[0,-3],[-1,-6],[1,-3],[2,1],[5,11],[3,2],[7,0],[3,-2],[6,-6],[8,-23],[5,-16],[0,-3],[-1,-3],[-4,-8],[0,-2],[-1,-10],[0,-7],[2,-5],[0,-3],[-2,-14],[-1,-2],[2,-23],[0,-26],[-2,-39],[0,-2],[-2,-6],[-2,0],[-3,3],[0,3],[-1,3],[-5,7],[-1,-2],[-5,-8],[-1,-2],[-2,1],[-3,3],[-8,9],[0,-7],[1,-10],[1,-4],[-3,-1],[-3,6],[-3,7],[-6,12],[-3,5],[-6,18],[-2,2],[-10,13],[-5,8],[-2,5],[-6,7],[-11,18],[-5,11],[-5,17],[-1,4],[-9,13],[-5,7],[-2,5],[-4,15],[-2,6],[-1,4],[-3,4],[-2,4],[-5,14],[-2,6],[-1,6],[0,12],[-10,36],[-3,12],[-2,16],[0,1],[-6,14],[-2,5],[-2,4],[-2,5],[-4,16],[-2,5],[-2,3],[-7,6],[-3,4],[-2,5],[-3,19],[-3,20],[-4,26],[-3,12],[-3,10],[0,2],[-14,17],[-4,4],[-4,1],[-2,4],[-1,8],[-1,10],[-1,7],[0,3],[-6,8],[-4,12],[-2,5],[-6,17],[-2,5],[-2,3],[-8,3],[-2,3],[-6,15],[-7,11],[-11,23],[-3,6],[-1,6],[-2,6],[-5,18],[1,3],[0,13],[5,4],[9,-3],[3,-4],[5,-9],[3,-4],[3,-1],[7,-3]],[[7648,5518],[-1,-2],[-2,1],[-1,6],[4,-1],[0,-4]],[[4876,8304],[-5,-7],[-4,3],[1,7],[3,2],[3,6],[2,2],[1,-1],[2,-7],[-2,-2],[-1,-3]],[[7607,5577],[-2,-5],[-3,15],[-2,0],[0,7],[1,3],[4,3],[1,-2],[2,-13],[-1,-8]],[[7602,5607],[-2,-5],[-1,3],[0,2],[2,3],[1,-3]],[[7594,5637],[-2,0],[0,2],[-1,3],[0,2],[2,1],[2,-7],[-1,-1]],[[7597,5647],[-1,-2],[-1,0],[0,9],[1,3],[1,-1],[-1,-3],[1,-6]],[[7586,5658],[-1,-1],[-1,3],[0,3],[1,1],[1,-6]],[[7576,5710],[-1,-1],[-1,2],[0,2],[2,3],[1,-4],[-1,-2]],[[7568,5791],[-1,-2],[-2,2],[0,6],[-1,6],[4,8],[2,-6],[0,-5],[-2,-9]],[[7583,5877],[1,-8],[-2,3],[-1,3],[2,2]],[[7574,5924],[-1,5],[1,1],[1,-1],[-1,-5]],[[7574,5848],[-1,0],[-3,10],[0,7],[-1,2],[3,8],[0,6],[1,5],[1,1],[2,0],[0,5],[-2,3],[0,11],[1,4],[0,12],[2,3],[0,9],[1,11],[0,8],[2,7],[3,3],[1,0],[0,-8],[-1,-4],[1,-4],[0,-2],[-2,-8],[-1,-1],[-1,-5],[-1,-2],[2,-6],[1,-18],[-2,-4],[-2,-1],[1,-12],[-3,-9],[0,-3],[-1,-2],[1,-3],[0,-17],[-2,-6]],[[7203,6975],[0,-2],[1,0],[3,-5]],[[7249,6921],[-1,1],[-2,-1],[-6,-10],[-2,-2],[-6,-13],[-4,-18],[0,-6],[-1,-7],[-1,-4],[-3,-8],[-1,-7],[5,-8],[3,-4],[3,-3],[1,0],[1,3],[2,-1],[3,-3],[1,-2],[8,-8],[6,-7],[0,-3],[2,-4],[9,-11],[4,-4],[2,-3],[4,3],[4,-3],[9,-11],[5,1],[1,-1],[2,-9],[5,-3],[4,-1],[4,-2],[2,-2],[3,2],[0,2],[2,1],[3,0],[5,-4],[2,-1],[2,4],[4,1],[2,2],[3,-4],[7,-4],[4,-3],[1,-3],[0,-9],[1,-3],[7,-7],[2,-3],[4,-1],[1,-5],[3,-1],[8,5],[2,0],[2,-7],[0,-4],[4,-3],[4,3],[3,-2],[7,-2],[5,-5],[4,-3],[2,0],[7,7],[2,-7],[5,-4],[4,3],[3,-1],[3,0],[3,2],[3,0],[4,-3],[2,3],[1,9],[2,8],[0,4],[-2,7],[-3,9],[0,3],[1,16],[1,9],[1,4],[1,7],[0,5],[-1,2]],[[7702,6809],[0,-8],[1,-3],[0,-3],[-1,-4],[-3,-1],[-1,-3],[-3,-5],[-3,-3],[-2,-3],[0,-12],[6,-16],[0,-3],[-2,-1],[-4,5],[-2,7],[-2,2],[-2,0],[-11,-4],[-2,0],[-4,-3],[-4,-10],[-5,-5],[-7,-12],[-8,-6],[-2,-3],[-2,-7],[0,-7],[1,-9],[1,-6],[0,-3],[-2,-6],[-1,-1],[-1,-8],[-3,-10],[-2,-5],[-4,-3],[-1,-3],[-2,-10],[1,-3],[3,-3],[1,-5],[-2,-7],[-4,-17],[-4,-9],[-2,-9],[-2,-12],[-1,-8],[-2,-5],[-1,-1],[-2,2],[-4,2],[-5,4],[-5,-2],[-4,6],[-1,-3],[1,-14],[2,-6],[-1,-9],[0,-10],[-1,-12],[0,-3],[-1,-3],[-2,-1],[-2,1],[-1,-2],[1,-5],[-2,-6],[-1,-5],[1,-5],[0,-5],[2,-11],[0,-4],[-2,-5],[-1,1],[-3,-12],[-1,-1],[-2,1],[-2,5],[-2,2],[-1,-1],[-1,-6],[-2,-2]],[[7472,6456],[0,-9],[-2,0],[2,-6],[0,-10],[-4,-1],[-1,6],[-1,-5],[-2,-4],[-2,4],[0,4],[2,16],[-2,3],[-1,3],[-2,-16],[1,-7],[-1,-3],[-3,-3],[-5,9],[0,-4],[-1,-4],[-3,0],[-2,4],[4,25],[-3,5],[-3,3],[-1,-1],[1,-2],[3,-2],[2,-4],[-3,-6],[-3,-11],[-4,-5],[-4,-4],[-13,-7],[-3,-2],[-4,-8],[-2,-8],[-1,-7],[2,-8],[1,-13],[1,-2],[-4,-10],[-2,-7],[0,-3],[-1,-3],[-6,-8],[-2,-5],[-2,-4],[-2,2],[0,-6],[-2,-3],[-18,-11],[-2,0],[0,2],[1,1],[0,7],[-2,1],[-6,-8],[-3,-8],[2,-1],[4,5],[2,-1],[0,-2],[-6,-7],[-12,-22],[-1,-4],[-4,-10],[-4,-11],[-8,-17],[-2,-6],[-13,-13],[-2,-4],[-5,-12],[-5,-10],[-6,-9],[-11,-11],[-6,-10],[-2,-7],[-1,-2],[1,-4],[2,-5],[-1,-4],[0,-3],[-2,-6],[-4,-4],[-10,-9],[-1,0],[-9,2],[-3,-2],[-2,-4],[-3,-17],[-2,-5],[-2,-7],[-2,0],[-1,1],[-1,-1],[-1,6],[-4,2],[-7,-6],[-3,-5],[-5,-22],[-2,-14],[2,-16],[2,-13],[0,-13],[-2,-8],[1,-9],[3,-16],[0,-5],[2,-12],[-2,2],[-1,5],[-2,6],[-2,-6],[1,-4],[5,-6],[2,-4],[-4,-39],[-2,-13],[-3,-9],[-2,-4],[-3,-14],[-2,-17],[-1,-7],[1,-7],[-1,-5],[1,-2],[2,-8],[0,-24],[0,-26],[-3,-1],[-4,0],[-2,1],[-4,-1],[-2,-3],[-2,-5],[0,-8],[-7,-20],[-2,-13],[1,-4],[2,-3],[-1,-4],[-16,-9],[-4,-7],[-2,-6],[-2,-13],[0,-8],[-2,-8],[-8,-11],[-5,-3],[-2,-3],[-6,3],[-6,10],[-3,6],[-10,25],[-2,3],[-2,11],[0,4],[-2,4],[-2,13],[-2,27],[1,-1],[1,-5],[1,-7],[0,-9],[2,-1],[1,1],[-3,22],[-3,5],[-1,1],[-1,3],[0,7],[-2,7],[0,4],[-5,22],[-2,16],[-4,18],[-2,6],[-3,13],[-3,7],[-3,8],[-3,6],[-7,29],[-3,16],[-1,8],[-1,6],[-3,24],[0,10],[-2,10],[-3,11],[-1,7],[0,3],[-2,11],[0,5],[-1,5],[-2,4],[-1,4],[-4,11],[-2,2],[-2,8],[-2,13],[-2,5],[3,0],[-4,10],[2,5],[-3,0],[-2,3],[-2,9],[-3,11],[-4,23],[-3,43],[-2,19],[0,5],[-5,28],[0,9],[-1,6],[-1,12],[-1,4],[0,2],[1,6],[2,8],[1,6],[-1,7],[-2,-7],[-2,-3],[-1,6],[0,17],[-1,2],[0,3],[1,4],[-2,3],[-1,10],[0,3],[-1,2],[1,14],[5,28],[1,6],[-2,16],[0,8],[-4,5],[-2,11],[3,6],[-3,-1],[5,10],[1,3],[-8,1],[1,10],[1,5],[-3,1],[1,11],[2,2],[2,0],[3,2],[-3,2],[-3,0],[-4,-1],[-3,1],[-2,-1],[1,-4],[-1,-5],[0,-4],[-3,-2],[-2,-4],[0,-3],[-1,-3],[4,-3],[2,-6],[0,-8],[-5,-17],[-2,-4],[-12,-11],[-5,-6],[-10,-7],[-4,-2],[-5,2],[-6,6],[-10,14],[-3,5],[-8,19],[-5,10],[-10,18],[-5,12],[-1,5],[0,6],[2,3],[2,-2],[3,-6],[1,-1],[8,7],[3,0],[2,3],[2,-1],[5,6],[3,0],[2,1],[4,14],[3,9],[3,2],[-1,2],[0,3],[-2,-1],[-2,-5],[0,-2],[-4,1],[-10,-6],[-3,-5],[-2,-1],[-12,5],[-12,12],[-5,8],[-3,10],[-3,12],[1,3],[5,7],[1,4],[-6,-6],[-3,-5],[-3,-2],[-2,15]],[[6892,6557],[4,5],[5,2],[7,0],[0,18],[2,1],[1,-2],[2,2],[2,-2],[2,1],[2,-1],[3,0],[6,1],[3,-1],[4,-5],[3,-1],[6,2],[2,5],[5,4],[6,3],[1,1],[1,-2],[0,-6],[4,-3],[3,2],[3,6],[2,-1],[1,3],[-2,5],[0,7],[2,4],[0,4],[-2,8],[-2,10],[-3,8],[-4,13],[1,11],[-1,3],[-2,2],[-2,-1],[-5,0],[-1,1],[-5,12],[-1,4],[0,5],[2,8],[0,8],[1,7],[-3,6],[-4,1],[-5,2],[-4,4],[-3,4],[0,11],[1,10],[1,3],[3,5],[2,2],[9,22],[2,9],[5,8],[2,2],[3,0],[4,-5],[0,-5],[1,-4],[3,-4],[3,1],[11,8],[7,1],[5,2],[4,3],[2,12],[7,14],[1,9],[3,10],[8,9],[8,7],[1,4],[5,16],[4,14],[1,9],[2,9],[3,3],[5,3],[4,4],[4,7],[-1,3],[-1,7],[4,7],[5,15],[4,7],[1,0],[4,4],[3,4],[-1,4],[-2,1],[0,8],[2,12],[0,3],[-2,11],[0,3],[3,7],[12,12],[2,0],[3,3],[2,4],[0,6],[-2,3],[-7,5],[-6,0],[-3,2],[-1,6],[1,9],[-5,1],[-4,0],[-1,2],[1,3],[-1,4],[0,4],[-1,0],[-4,4],[-4,7],[0,3],[2,3],[2,5],[0,4],[1,3],[-3,5],[-2,2],[0,9],[6,6],[1,4],[-1,3],[-3,0],[-4,1],[-1,1],[0,4],[2,5],[0,2],[-2,3],[-3,2],[0,6],[4,13],[10,7],[18,-7],[6,-1],[2,-2],[10,-5],[3,0],[4,3],[2,3],[3,3],[4,0],[8,5],[3,-1],[3,3],[2,3],[0,2],[7,7],[1,4],[0,3]],[[7139,7206],[7,7],[3,4],[5,4],[3,4],[3,3]],[[7689,4482],[-1,1],[0,2],[1,0],[0,-3]],[[7936,4579],[-1,-4],[-3,3],[0,3],[2,0],[1,2],[1,-4]],[[7012,4758],[0,-2],[-1,-1],[-1,6],[2,3],[1,-1],[-1,-5]],[[4723,8289],[-2,0],[-1,2],[-6,1],[2,3],[1,-1],[4,0],[2,-5]],[[4826,8299],[2,-4],[-5,-2],[0,-6],[2,-3],[2,-11],[2,-8],[-1,-2],[1,-4],[-1,-2],[1,-4],[2,-12],[1,-9],[-2,-4],[-3,-11],[-1,-7],[-3,-8],[-4,-4],[4,-5],[-3,-3],[-3,-1],[-4,2],[-2,0],[-4,-3],[-1,5],[-2,-5],[-2,-2],[-3,1],[-9,-3],[-2,-5],[-2,-2],[-6,-2],[-2,-4],[-3,-3],[-2,0],[-4,4],[-2,-2],[0,-7],[-3,-1],[-4,-4],[-4,-1],[-2,-2],[-13,-5],[-1,-1],[-2,2],[-4,0],[-5,-3],[-3,1],[3,7],[5,3],[-1,2],[-9,-3],[-6,-3],[1,4],[9,9],[-9,-3],[-4,1],[0,2],[-3,-1],[-1,4],[6,9],[6,3],[1,2],[-2,1],[-12,0],[1,4],[4,4],[3,1],[5,-3],[5,1],[-2,2],[-2,7],[4,3],[3,5],[2,1],[7,1],[7,2],[8,4],[-4,1],[-2,3],[-3,-5],[-2,-2],[-6,-1],[-5,2],[-1,-2],[-4,-2],[0,4],[7,7],[3,7],[-2,3],[5,9],[4,1],[2,2],[2,0],[2,3],[-3,2],[-13,0],[-2,2],[-1,3],[-6,-1],[-1,2],[2,3],[-6,0],[-2,1],[1,4],[-2,1],[0,3],[3,0],[4,2],[-1,4],[0,4],[4,3],[5,1],[0,5],[-5,0],[-4,-1],[0,4],[1,4],[0,5],[-2,-1],[0,4],[-1,2],[-3,-1],[0,3],[2,4],[5,-1],[3,2],[11,0],[5,-5],[3,4],[8,-1],[4,-2],[2,1],[-3,6],[2,3],[9,6],[1,4],[2,4],[-9,-2],[-8,4],[1,3],[5,3],[4,6],[-1,4],[1,3],[2,2],[1,6],[4,0],[4,2],[5,1],[1,3],[3,0],[3,-5],[0,-3],[-2,-4],[1,-3],[3,3],[0,6],[-1,5],[2,2],[4,1],[-2,4],[4,0],[2,-3],[6,-4],[-3,-4],[-3,-2],[-1,-2]],[[6560,6734],[-3,-7],[-4,-6],[-3,2],[-5,-3],[-3,-4],[-4,-2],[-3,1],[1,3],[5,4],[7,6],[-1,6],[1,1],[4,-2],[4,4],[4,2],[2,-3],[-2,-2]],[[6356,7397],[1,-17],[3,-21],[2,-6],[3,-4],[5,-5],[3,-1],[7,-1],[7,-2],[4,-2],[3,-4],[3,-11],[6,-8],[11,-11],[5,-4],[18,-8],[12,1],[32,14],[11,3],[2,-2],[-4,-2],[2,-2],[6,0],[2,5],[-1,3],[-1,13],[-2,9]],[[6496,7334],[8,0],[3,1],[8,5],[2,0],[1,2],[2,1],[2,13],[7,10],[4,5],[4,4],[6,3],[7,-1],[9,0],[2,-1],[2,1],[0,6],[4,3],[3,0],[3,1],[7,-3],[8,0],[3,-4],[0,-3],[1,-3],[0,-4],[5,-2],[5,-1],[5,-3],[2,-2],[4,-2],[4,-7],[5,-2],[3,3],[4,-2],[4,2],[3,-2],[8,-8],[1,1],[2,-3],[1,-8],[2,-5],[3,-4],[11,-8],[3,-5],[3,-7],[4,-11],[23,0],[1,-4],[0,-16],[1,-6],[0,-5],[-1,-3],[0,-5],[1,-1],[1,-5],[0,-12],[1,-2]],[[6689,6903],[5,-11],[4,-7],[5,-12],[0,-4],[6,-23],[5,-11],[4,-7],[4,-4],[3,0],[6,-4],[6,-10],[5,1],[0,-15],[1,-11],[1,-18],[-2,-8],[0,-6],[4,-2],[8,2],[2,-3],[1,-4],[-2,-8],[1,-7],[-2,-2],[-1,-11],[-2,-1],[-9,1],[-3,-3],[-6,-2],[-3,-4],[-2,-4],[0,-4],[-3,1],[-1,-3],[-7,-4],[-1,-5],[-2,-19],[-2,-3],[0,-5],[-1,-6],[-1,-17],[0,-5]],[[6710,6635],[-2,0],[-1,-3],[-2,-3],[-5,2],[-4,3],[-12,6],[-1,2],[-1,5],[-2,1],[-3,-7],[-11,4],[-3,-1],[-3,2],[-5,0],[-5,5],[-6,-3],[-5,-1],[-7,8],[-7,2],[-9,0],[-5,3],[-3,3],[-4,-2],[-1,4],[-12,4],[-2,7],[-1,7],[0,7],[-3,12],[-1,18],[-2,13],[-2,5],[-3,6],[-2,2],[-11,4],[-6,-3],[-5,-6],[-8,-4],[-2,-2],[-2,-6],[-3,-4],[-3,1],[-4,-3],[-7,-10],[-4,-3],[-3,0],[-4,5],[-7,6],[-5,2],[-7,-1],[-3,1],[-6,7],[-1,5],[-3,4],[-10,8],[-8,10],[-2,4],[-1,6],[-3,7],[-8,6],[-5,6],[-5,1],[-5,0],[-2,1],[-2,3],[-7,13],[0,5],[-4,12],[-1,5],[-1,12],[-1,3],[-4,5],[-1,3],[1,5],[0,3],[-2,3],[-3,2],[-1,4],[0,12],[-3,7],[-5,8],[-4,11],[-2,3],[-2,16],[-3,0],[-12,-10],[-3,6],[-11,10],[-1,4],[3,2],[2,-2],[2,2],[-1,3],[-2,3],[-4,-1],[1,-3],[-3,-3],[-1,-4],[0,-5],[1,-7],[-3,-5],[-4,0],[-2,-3],[-2,-1]],[[6347,6909],[-3,4],[-1,5],[0,7],[-3,4],[-2,1],[-2,5],[-2,3],[-1,0],[0,21],[-1,9],[-4,1],[-5,0],[0,23],[4,23],[-3,8],[-3,9],[-2,3],[-3,11],[-1,5],[-1,2],[-2,1],[-4,-1],[-9,13],[-7,8],[-5,6],[-2,1],[-5,1],[-1,1],[0,6],[2,5],[0,3],[-5,14],[-3,1],[1,3],[0,3],[-1,2],[-4,-1],[-1,5],[-6,13],[-2,2],[1,5],[3,6],[0,8],[-3,8],[2,6],[0,3],[4,0],[0,10],[1,3],[6,13],[4,3],[2,3],[1,4],[-1,2],[0,5],[-3,6],[-1,5],[2,9],[4,2],[2,2],[0,2],[-3,3],[-12,0],[-2,6],[-3,3],[-4,1],[-1,3],[-3,17],[-1,3],[-3,0],[-2,4],[0,11],[-4,8],[-4,20]],[[6242,7323],[0,4],[1,4],[-2,4],[-4,5],[0,9],[-1,2],[1,6],[-5,5],[-2,3],[-3,0],[0,5],[2,4],[2,6],[0,4],[1,3],[2,3],[-1,3],[-4,1],[0,15],[-1,3],[1,8],[-3,6],[-1,3],[1,2],[0,7],[-3,4],[0,6],[-1,4],[3,1],[5,-1],[2,2],[2,14],[1,4],[2,2],[4,-5],[3,-2]],[[6332,6910],[-7,6],[-2,1],[-4,0],[-5,-1],[-3,-2],[-4,-6],[-1,-7],[-2,-9],[-2,-7],[-6,-16],[-5,-10]],[[6291,6859],[-4,-2],[-24,4],[-13,2],[-10,2],[-9,14],[-7,10],[-9,14],[-9,13],[-10,14],[-7,10],[-8,13],[-7,11],[-6,9],[-8,9],[-22,22],[-6,7],[-12,12],[-18,6],[-10,3],[-6,2]],[[6086,7034],[4,6],[-1,7],[-3,-1],[-3,-2],[-1,10],[2,1],[-2,12],[-4,26],[-2,12]],[[6076,7105],[8,9],[14,14],[8,9],[16,16],[7,8],[7,3],[1,2],[4,11],[2,9],[0,15],[1,15],[2,15],[2,5],[0,10],[-2,7],[-1,8],[0,12],[1,6],[3,7],[11,5],[5,9],[3,4],[8,16],[0,1]],[[6176,7321],[2,1],[5,7],[3,6],[1,1],[5,-3],[4,3],[2,-2],[4,-1],[7,-5],[3,0],[5,-1],[4,5],[3,0],[1,-1],[2,-5],[0,-11],[2,-2],[3,5],[3,3],[3,4],[4,-2]],[[6347,6909],[-2,-1],[-3,1],[-6,5],[-2,0],[-2,-2],[0,-2]],[[4567,8998],[3,0],[8,3],[5,5],[3,1],[5,-1],[-6,-5],[-3,-6],[-3,-4],[3,-3],[3,-1],[5,1],[2,-6],[-5,-11],[11,2],[2,-1],[0,-4],[2,-5],[4,1],[6,-1],[3,-2],[1,-3],[3,1],[2,-4],[-2,-5],[-3,-2],[2,-4],[2,0],[0,-3],[-3,-3],[5,-3],[0,-4],[-2,-3],[-6,-1],[1,-5],[-1,-3],[-5,-7],[-7,-1],[-5,-5],[2,-3],[-4,-8],[-13,-8],[-7,0],[-6,-3],[-10,-4],[-11,-8],[-6,-7],[-8,-4],[-10,-2],[-15,-4],[-5,-2],[0,-2],[-3,-2],[1,-3],[-1,-3],[-4,-2],[-5,1],[1,-3],[-12,-4],[-17,2],[-6,3],[-8,3],[-5,1],[-7,0],[-6,5],[-2,3],[0,3],[-5,-1],[-2,4],[-4,0],[-4,2],[-6,6],[-6,-5],[-25,0],[-8,-1],[-1,2],[-2,9],[1,3],[2,0],[2,-4],[2,-1],[9,3],[5,3],[5,6],[1,5],[3,4],[2,1],[-1,2],[-9,-5],[-2,0],[2,4],[-1,1],[1,6],[7,5],[3,1],[-2,2],[-7,-5],[-5,-2],[-5,3],[-1,4],[2,4],[-6,4],[-7,0],[-17,2],[-4,-1],[-6,-3],[-4,-1],[-3,2],[-2,7],[4,2],[5,-1],[6,2],[3,0],[4,3],[3,-2],[8,3],[1,2],[3,-1],[5,0],[5,1],[12,0],[2,2],[2,5],[-1,1],[-7,-4],[-10,2],[-3,3],[5,5],[5,3],[7,3],[1,3],[-4,3],[-9,-1],[-2,3],[-7,2],[-5,-1],[-2,2],[-6,-3],[-14,-4],[-8,-3],[-3,2],[-6,2],[-6,1],[-1,1],[4,5],[2,1],[8,-4],[-1,8],[-3,4],[1,1],[5,-1],[8,-5],[4,1],[4,4],[-7,0],[-3,1],[-4,4],[3,2],[6,0],[-7,7],[1,4],[7,-3],[0,2],[-3,2],[1,3],[5,2],[8,-5],[2,-3],[0,-3],[5,0],[3,3],[3,-2],[2,-6],[3,1],[0,9],[-12,6],[-2,3],[8,4],[-1,2],[-4,-1],[-8,1],[1,3],[4,3],[14,0],[7,-8],[6,-2],[0,-1],[9,-9],[7,-5],[-4,-2],[4,-2],[2,-3],[-2,-8],[-2,-3],[0,-3],[3,-4],[-2,-6],[3,0],[2,-3],[2,-6],[2,-1],[1,8],[2,1],[1,7],[4,4],[4,1],[3,-4],[3,-1],[3,9],[0,6],[-1,7],[2,8],[3,1],[5,-3],[4,-7],[6,-8],[5,-2],[1,2],[0,14],[2,2],[5,1],[5,4],[6,1],[6,-6],[3,-6],[5,-5],[3,-7],[2,-1],[0,5],[-1,4],[-5,11],[1,4],[11,-1],[9,-10],[4,3],[9,11],[5,-4],[5,-1],[3,3],[4,1],[2,5],[-3,10],[1,2],[7,2],[6,0],[5,-5],[4,-5],[0,-4],[4,-3]],[[5986,7049],[-4,3],[0,3],[-6,2],[-3,-4],[-2,-7],[0,-3],[-1,-7],[0,-5],[1,-5],[0,-7],[-1,-3],[3,1],[4,-3],[0,-2],[-2,-1],[-3,-3],[-2,-4],[-1,-4],[-1,-10],[1,-1],[5,1],[5,3],[3,4],[2,-1]],[[5984,6996],[-2,-14],[1,-1],[0,-5],[-1,-8],[-3,-11],[-1,-7],[-2,-9],[-1,-6],[0,-16],[-2,-9],[0,-5],[-3,-19]],[[5970,6886],[-2,-5]],[[5950,6981],[3,5],[0,4],[5,9],[-1,4]],[[5957,7003],[5,17],[4,18],[3,24],[2,12],[2,8],[1,7]],[[5974,7089],[6,0],[3,-1],[2,3],[1,7],[1,2],[1,-2],[1,2],[3,3],[2,5],[1,1]],[[5995,7109],[0,-4],[-1,-2],[0,-3],[2,-5],[0,-3],[-1,-3],[0,-3],[1,-2],[0,-3],[-1,-5],[-2,-4],[0,-3]],[[5993,7069],[-5,-3],[-1,-4],[-1,-13]],[[5334,7300],[-2,0],[-1,2],[0,3],[2,-1],[1,-4]],[[5432,7385],[-2,-7],[-8,-18],[-1,-4],[0,-4],[-3,-11],[1,-7],[3,-5],[-2,-3],[2,-4],[2,-2],[0,-5],[-3,-4],[-2,-6],[0,-9],[-3,1],[-3,2],[-4,-1],[-7,5],[-4,10],[-3,4],[-3,3],[-3,1],[-4,-1],[-3,2],[-6,7],[-9,9],[-2,4],[-4,2],[-3,3],[-2,1],[-4,-1],[-5,6],[-3,9],[4,13],[1,2],[2,1],[2,5],[4,-9],[2,0],[2,3],[1,3],[3,3],[3,0],[2,-1],[2,-4],[2,0],[6,-7],[2,0],[7,3],[7,-1],[6,2],[4,2],[2,4],[2,1],[5,0],[4,-1],[2,1],[2,3],[2,0],[4,4],[2,0],[2,-2],[-1,-2]],[[5235,7434],[-2,-6],[-2,4],[0,4],[4,-2]],[[5386,7528],[-2,0],[0,3],[3,-1],[-1,-2]],[[5229,7547],[-1,-3],[-1,3],[3,5],[1,-1],[-2,-4]],[[5267,7538],[1,-4],[3,-15],[0,-6],[-4,-10],[0,-7],[2,-8],[-1,-5],[-2,-33],[-1,-6],[0,-5],[-3,-1],[-6,4],[-3,-1],[-2,2],[-1,-11],[-4,-7],[-3,-1],[-4,1],[-2,6],[-4,10],[0,5],[-1,11],[2,5],[1,9],[1,1],[0,6],[-1,3],[-2,1],[-1,4],[2,6],[0,12],[-2,9],[-1,3],[-2,3],[-1,3],[-2,3],[0,7],[1,5],[0,3],[4,-4],[3,-1],[3,1],[4,3],[3,3],[5,9],[5,4],[0,4],[1,1],[2,-4],[2,0],[3,-3],[2,-5],[2,-2],[-2,-5],[3,-3]],[[5288,7652],[1,-4],[-1,-1],[0,-3],[-2,2],[-3,-1],[-3,0],[0,4],[4,0],[3,1],[1,2]],[[5380,7863],[-1,-4],[-1,0],[-5,-5],[-2,-3],[0,-5],[2,0],[2,-2],[3,-1],[-1,-3],[-2,-2],[-2,-5],[1,-2],[3,1],[-1,-10],[3,-1],[4,-7],[1,-5],[-4,0]],[[5380,7809],[2,2],[-4,9],[-2,0],[-3,-4],[-7,4],[-2,-2],[-1,-3],[-2,-3],[-4,-2],[-11,-8],[-2,0],[-2,2],[-2,-3],[-1,-5],[0,-7],[1,-2],[3,-9],[4,-5],[-2,-7],[-2,-2],[-3,2],[-1,-7],[2,-17],[2,-11],[3,-6],[5,-8],[6,-4],[11,-13],[8,-7],[3,-11],[3,-12],[6,-28],[5,-10],[10,-16],[9,-11],[8,-6],[7,-2],[15,2],[3,-1],[3,-2],[1,-4],[-1,-3],[-4,-4],[-3,-4],[0,-7],[3,-4],[15,-12],[15,-10],[5,-5],[5,-7],[14,-11],[2,-5],[8,-11],[4,-9],[0,-7],[-1,-7],[-1,-4],[-2,-5],[-3,2],[-4,5],[-6,19],[-11,2],[-6,5],[0,2],[-2,4],[-4,1],[-3,-3],[-7,-19],[-4,-16],[0,-6],[2,-7],[6,-3],[5,-6],[3,-5],[1,-15],[1,-7],[-2,-5],[-4,1],[-6,-3],[-3,-5],[-2,-5],[0,-17],[-8,-10],[-4,-9],[-2,-8],[-9,0],[-2,5],[-1,8],[2,5],[3,2],[3,11],[-1,7],[1,4],[2,2],[6,3],[0,10],[-3,5],[-1,7],[-1,12],[-5,16],[-2,14],[-2,7],[-3,3],[-6,0],[-2,1],[-10,10],[0,4],[1,4],[-2,10],[-2,5],[-2,2],[-6,-3],[-2,1],[-4,-2],[4,7],[-1,2],[-4,3],[-5,1],[-1,-2],[-1,1],[0,3],[-5,15],[-5,7],[-4,-1],[-5,3],[-5,0],[-2,-2],[-2,1],[0,2],[-5,6],[-6,4],[-12,20],[-4,7],[-7,8],[-5,12],[-4,4],[-5,4],[-3,-2],[-3,1],[1,2],[2,1],[-1,4],[-6,12],[-4,4],[-4,9],[-2,-1],[-2,1],[0,6],[1,4],[-3,13],[-3,9],[-2,19],[-2,6],[-4,4],[-9,4],[-12,13],[-3,0],[-7,5],[-5,1],[-5,-4],[-8,-13],[-6,-12],[-2,-2],[-7,-5],[-7,-2]],[[5343,7714],[1,-2],[2,0],[1,3],[-2,2],[-2,-3]],[[2853,6246],[3,-2],[4,-1],[3,0],[3,-5],[3,-3],[9,-6],[4,-11],[0,-3],[-2,-2],[-3,-1],[-3,0],[-3,2],[-1,2],[-3,1],[-1,2],[-2,0],[-2,-8],[-3,1],[-1,2],[-2,-3],[-1,-7],[-2,3],[-3,3],[-3,2],[-5,0],[-3,1],[-2,6],[-1,2],[-2,2],[-3,7],[0,1],[-7,2],[-1,4],[0,3],[3,5],[1,1],[3,0],[3,1],[3,3],[12,-3],[2,0],[3,-1]],[[4943,8019],[0,-3],[-6,0],[0,5],[6,-2]],[[5984,6996],[0,5],[1,7],[2,5],[-1,13],[0,6],[1,8],[-1,9]],[[5993,7069],[3,-1],[2,-3],[3,-8],[4,-2],[2,-2],[2,-4],[3,-2],[10,-2],[13,15],[8,9],[5,5],[8,10],[6,6],[7,8],[7,7]],[[6086,7034],[-4,-7],[-6,-4],[-11,-5],[-7,-4],[-18,-9],[-14,-8],[10,-20],[9,-18],[4,-9],[5,-10],[-9,-9],[-1,-2],[-4,-18],[-8,-3],[-7,-3],[-5,-1],[-2,-2],[-6,-20],[-5,-8],[-6,-9],[-2,0],[-11,3],[-7,3],[-5,1],[-6,2]],[[5970,6874],[1,8],[-1,4]],[[8440,6582],[-2,-1],[-4,1],[0,2],[2,2],[1,4],[4,-3],[0,-3],[-1,-2]],[[8451,6595],[-1,-9],[-2,-1],[-1,1],[-2,5],[1,2],[3,-1],[2,7],[1,-1],[-1,-3]],[[8483,6608],[-2,-1],[-3,1],[1,8],[1,-1],[0,-3],[3,-4]],[[8948,6716],[-2,6],[2,0],[1,-4],[-1,-2]],[[8561,6718],[-2,-2],[-1,-3],[-3,-1],[-2,-5],[-2,-1],[0,-3],[1,-3],[-2,-1],[-2,-3],[0,-3],[1,-3],[-2,-4],[-2,0],[-1,4],[1,2],[2,7],[0,7],[2,2],[4,7],[-2,2],[0,3],[1,1],[2,-1],[1,-2],[2,1],[3,8],[1,5],[2,-4],[0,-6],[-2,-4]],[[8582,6780],[-1,-1],[-2,1],[0,10],[2,1],[1,-6],[0,-5]],[[8591,6802],[0,-1],[-3,1],[-1,5],[2,-1],[2,-4]],[[8595,6808],[-3,-5],[-2,5],[-3,2],[2,2],[0,2],[2,3],[5,2],[2,2],[3,5],[1,-5],[-2,-1],[-4,-7],[-2,-2],[1,-3]],[[8627,6926],[-3,-1],[-2,1],[-1,8],[3,4],[4,-4],[-1,-8]],[[8636,6934],[-2,-1],[0,4],[2,7],[0,6],[2,7],[2,0],[-1,-9],[-2,-6],[-1,-8]],[[8620,7051],[-3,0],[-1,2],[4,4],[3,-1],[-3,-5]],[[8612,7040],[-2,-2],[0,7],[-1,1],[1,7],[0,3],[4,2],[1,-3],[0,-9],[-3,-6]],[[8573,7072],[1,-2],[3,1],[2,-5],[0,-2],[-3,-1],[-1,-3],[-2,1],[-1,2],[1,9]],[[8883,7087],[-2,2],[0,2],[3,-2],[-1,-2]],[[8584,7075],[-1,-1],[0,5],[-1,2],[1,1],[2,6],[1,-4],[0,-3],[-1,-1],[-1,-5]],[[8596,7097],[-2,-3],[0,5],[1,4],[1,-3],[0,-3]],[[8604,7127],[-2,-2],[-1,2],[0,5],[1,1],[2,-1],[0,-5]],[[8642,7119],[4,-2],[2,0],[3,3],[3,2],[3,-3],[1,-3],[-3,-9],[-3,-7],[5,-1],[5,0],[-1,-4],[0,-4],[3,-4],[-1,-4],[3,-4],[-1,-4],[-7,-14],[-4,-16],[-2,-12],[0,-6],[-2,-7],[1,-6],[-1,-7],[-3,-15],[-3,0],[-3,2],[-2,0],[0,-3],[1,-7],[-5,-9],[-6,-5],[0,4],[2,4],[1,6],[-1,7],[-2,8],[0,3],[2,1],[1,2],[0,3],[-1,2],[-3,0],[-3,-9],[-1,-6],[1,-3],[0,-3],[3,-5],[-2,-5],[-11,7],[-1,6],[4,3],[1,8],[-2,6],[-2,4],[1,5],[-1,6],[0,8],[4,3],[4,9],[2,9],[3,9],[-4,2],[2,5],[-1,5],[-3,7],[-2,8],[-2,4],[-2,1],[-3,-4],[2,-5],[-1,-5],[1,-5],[4,1],[1,-3],[0,-3],[-2,-5],[-3,2],[-1,3],[-3,1],[-3,-3],[-2,-6],[-3,-3],[2,9],[-1,3],[-3,6],[0,3],[-1,4],[1,3],[3,-4],[1,-5],[2,-2],[3,-1],[-2,8],[-10,15],[1,6],[2,1],[4,-2],[1,3],[-1,3],[3,3],[5,3],[1,4],[3,-1],[3,3],[2,5],[0,3],[1,3],[5,5],[5,0],[3,-3],[2,-5],[1,-6],[3,-4]],[[8673,7138],[1,-2],[3,1],[0,-2],[-2,-2],[-4,1],[0,5],[2,-1]],[[8681,7148],[0,-2],[-3,1],[2,4],[1,-3]],[[8590,7149],[-2,-3],[-1,4],[1,10],[3,-2],[0,-3],[-1,-6]],[[8731,7156],[4,-2],[4,1],[-1,-11],[2,-7],[0,-4],[1,-2],[-5,-5],[-5,-7],[-2,-5],[-3,-16],[-2,3],[-4,9],[-3,2],[-5,2],[-11,-9],[-1,-7],[-4,-12],[-2,-1],[0,-2],[-2,-8],[-3,-5],[-4,1],[-2,-1],[2,8],[-3,1],[-3,0],[0,5],[-2,3],[2,4],[0,5],[1,5],[-3,2],[0,6],[-4,-1],[-5,-4],[0,3],[5,4],[2,3],[8,10],[2,6],[0,3],[2,8],[2,2],[2,4],[2,0],[1,-6],[3,-4],[4,3],[5,0],[3,3],[2,6],[0,6],[2,0],[3,4],[3,3],[4,0],[4,-2],[4,-4]],[[8731,7169],[-1,0],[-2,-3],[-2,4],[0,2],[5,0],[0,-3]],[[8747,7158],[-3,-5],[-3,1],[-2,5],[3,4],[2,6],[2,3],[3,1],[-3,-8],[1,-7]],[[8593,7162],[-1,-3],[-3,4],[2,9],[0,5],[4,4],[0,-8],[-2,-7],[0,-4]],[[8872,7183],[-1,-2],[-1,2],[0,3],[2,0],[0,-3]],[[8703,7269],[-1,-3],[-2,1],[-2,3],[1,4],[2,2],[3,-5],[-1,-2]],[[8842,7362],[-2,2],[1,8],[-2,0],[0,5],[1,4],[5,8],[1,-2],[-1,-8],[0,-3],[3,0],[-2,-9],[-4,-5]],[[8922,7566],[1,-1],[5,3],[-2,-18],[1,-14],[0,-7],[1,-7],[2,-4],[3,-3],[4,-11],[3,-13],[2,-13],[1,-3],[0,-3],[-1,-4],[1,-3],[-2,-23],[-1,-6],[-2,-4],[-4,-4],[-1,-3],[0,-3],[-2,-3],[-1,-3],[0,-8],[-2,-13],[-2,-1],[-4,0],[-5,-4],[-3,-9],[-1,-6],[0,-6],[2,-14],[1,-14],[-1,-20],[-1,-6],[-3,-7],[-2,-2],[-1,-7],[-3,-13],[0,-7],[-2,-9],[2,-10],[4,-12],[1,-4],[2,-3],[-7,-4],[-1,-1],[-4,-7],[-1,-7],[0,-7],[-3,-7],[-4,-3],[-3,-4],[-3,-5],[-1,-3],[-2,1],[-1,3],[1,3],[0,16],[2,3],[1,5],[4,6],[0,3],[-1,3],[-2,2],[-4,-1],[-2,-6],[0,-3],[-3,-5],[0,-5],[2,-6],[-3,-5],[-2,6],[-2,3],[-3,0],[-3,-1],[-3,-4],[-1,-3],[0,-11],[-1,-7],[-2,-6],[-3,-6],[-2,-1],[-2,5],[1,10],[0,6],[3,3],[-2,4],[-3,1],[-4,-2],[-2,-6],[-7,-14],[-2,-8],[-6,3],[-6,0],[-6,1],[-6,-2],[-7,-3],[0,2],[6,5],[0,4],[-5,-1],[-2,1],[-2,4],[-1,-1],[1,-6],[-1,-1],[-1,2],[0,4],[-1,6],[0,4],[1,3],[-1,2],[-3,-2],[-5,-14],[-1,-6],[3,-5],[7,-9],[0,-3],[-1,-4],[-8,-4],[-6,-4],[-2,-5],[-6,-18],[-4,-13],[-6,-4],[-7,4],[-3,10],[-5,10],[-1,6],[0,10],[-1,6],[1,2],[4,4],[3,6],[1,3],[0,4],[-2,2],[-4,0],[-4,-1],[-3,2],[-4,5],[-2,1],[-4,0],[-3,-1],[-3,-2],[-3,0],[-8,-11],[-3,-2],[-5,0],[-6,-4],[-1,1],[-8,-8],[-3,2],[-7,-5],[-3,0],[-4,2],[-3,4],[-3,-2],[-2,-5],[-1,-12],[-2,-11],[-11,13],[-7,-2],[-7,-4],[-2,1],[-2,3],[-3,-1],[-2,-2],[-1,17],[2,5],[2,2],[3,1],[4,-1],[2,1],[3,4],[4,8],[4,3],[3,3],[6,10],[6,8],[9,16],[4,8],[5,4],[6,2],[3,0],[4,-5],[3,2],[3,1],[4,-1],[6,0],[7,2],[3,3],[4,2],[11,2],[8,5],[3,-1],[0,-4],[-1,-4],[1,-2],[2,-1],[7,-1],[3,-1],[6,6],[5,9],[-2,7],[0,6],[1,8],[3,6],[3,3],[2,5],[6,12],[4,10],[1,12],[-1,14],[4,10],[13,9],[1,-5],[-6,-9],[-3,-4],[-3,-3],[-1,-3],[3,-5],[1,-4],[0,-7],[3,-4],[3,-1],[3,1],[4,9],[0,2],[12,6],[5,5],[3,1],[3,3],[9,15],[2,5],[1,6],[2,6],[2,4],[10,10],[4,7],[2,15],[1,6],[4,11],[3,5],[4,26],[4,10],[0,20],[-3,8],[-4,-1],[-2,3],[1,2],[2,0],[2,3],[2,7],[1,7],[0,3],[-1,6],[-2,7],[0,4],[3,7],[4,2],[3,3],[0,2],[2,6],[0,3],[-1,9],[2,4],[2,-1],[3,0],[2,-1],[1,-17],[2,-4],[2,0],[2,6],[1,0],[6,-3],[3,6],[1,7],[-1,6],[-1,2],[-4,-3],[-7,-3],[0,6],[1,10],[1,3],[2,2],[3,-2],[5,-6]],[[8873,7607],[-1,0],[-1,5],[2,4],[2,0],[-1,-8],[-1,-1]],[[8923,7782],[-4,2],[0,3],[3,2],[2,-3],[-1,-4]],[[8917,7794],[-1,-3],[-2,11],[3,-1],[0,-7]],[[8994,7724],[5,0],[2,-1],[11,-8],[6,-2],[3,1],[8,13],[7,10],[1,-3],[-4,-12],[-3,-12],[-1,-6],[1,-6],[4,-11],[2,-10],[4,-1],[3,3],[2,3],[2,1],[0,-3],[-3,-3],[-3,-6],[-1,-1],[-4,0],[-3,-2],[-6,-6],[-3,-2],[-3,0],[-5,-3],[-3,0],[-6,2],[-3,0],[-6,-6],[-6,-7],[-5,-9],[-4,-10],[-2,-6],[-1,-6],[0,-8],[-3,-5],[-3,2],[-6,5],[-11,8],[-12,13],[-6,6],[-12,-2],[-12,-12],[-1,1],[-7,11],[-2,1],[-4,0],[-3,-5],[-2,-6],[0,-2],[3,-8],[3,-4],[2,-1],[3,1],[1,-1],[5,-8],[5,-7],[1,-3],[-4,-4],[-5,2],[-4,3],[-5,-8],[-3,-9],[-3,-4],[-3,-2],[-2,1],[-3,8],[1,7],[2,6],[1,6],[-2,9],[-4,7],[-2,5],[0,10],[1,8],[0,4],[4,2],[6,6],[3,4],[3,5],[1,6],[-3,11],[0,3],[3,3],[3,-2],[5,-6],[5,0],[5,-2],[5,2],[2,4],[1,6],[-1,8],[0,7],[2,6],[4,10],[1,6],[1,14],[2,12],[1,14],[-2,13],[-4,12],[2,11],[0,2],[4,2],[4,6],[2,-2],[1,-3],[4,-6],[7,-12],[8,-17],[5,-9],[5,-8],[6,-8],[10,-10],[3,-5],[2,-1]],[[6393,7767],[-1,-2],[-2,0],[-2,7],[1,0],[1,-4],[3,-1]],[[6396,7774],[-1,3],[1,3],[1,0],[0,-5],[-1,-1]],[[6462,7799],[-2,1],[-1,3],[1,3],[2,-1],[1,-3],[-1,-3]],[[7227,7613],[-4,7],[-4,6],[-3,2],[-6,1],[-3,0],[-2,1],[-6,11],[-1,5],[-1,1],[-2,-1],[-5,1],[-7,3],[-3,2],[-4,1],[-2,-1],[-8,0],[-6,2],[-8,0],[-2,1],[-6,0],[-7,4],[-1,-1],[-12,-3],[-8,1],[-12,0],[-3,-6],[-1,-1],[-8,2],[-9,4],[-6,4],[-5,4],[-8,7],[-4,4],[0,-2],[-2,-1],[-5,0],[-2,-3],[-7,-5],[-2,-3],[-4,-23],[2,-11],[-5,3],[-3,4],[-9,2],[-3,4],[-6,2],[-8,5],[-3,0],[-9,4],[-3,0],[-3,-3],[-3,0],[-2,1],[-5,-3],[-4,-9],[-2,-3],[-1,-4],[-3,-7],[0,-3],[2,-2]],[[6970,7617],[-3,-3],[-3,0],[-2,-5],[-2,-3],[-2,-1],[-1,2],[-2,0],[-3,-3],[-2,-5],[-4,-7],[-4,-4],[-5,-3],[-3,-1],[-3,-3],[-4,-5],[-1,-3],[-4,-2],[-5,-5],[0,-6],[-6,-8],[-5,-9],[-3,-8],[0,-4],[1,-3],[0,-5],[-3,-1],[-5,3],[-4,4],[-3,5],[0,3],[1,6],[1,3],[-2,2],[-2,4],[-1,4],[-4,-2],[-2,2],[-5,-1],[-5,0],[-4,-1],[-5,0],[-6,-1],[-3,2],[-2,10],[-4,31],[0,6],[-8,0],[-6,1],[0,5],[1,6],[0,7],[1,9],[0,17],[1,6],[0,6],[-6,-4],[-2,-2],[-2,5],[-7,20],[-6,6],[-3,4],[-2,5],[-3,4],[-2,4],[-3,-1],[-3,-2],[-3,-3],[-4,-3],[-4,0],[-3,1],[-5,0],[-9,2],[-7,0],[-6,1],[-10,-2],[-6,-2],[-5,-1],[-6,-2],[-7,-1],[-8,13],[-2,5],[-7,11],[-6,10],[-2,5],[-1,6],[-5,6],[-4,4],[-4,3],[-4,4],[-3,4],[-8,8],[-4,3],[-8,8],[-3,4],[-4,4],[-4,3],[-15,15],[-4,3],[-7,-2],[-5,-2],[-12,-6],[-6,-2],[-14,-7],[-5,-2],[-5,-3],[-14,-6],[-3,-2],[0,-27],[0,-26],[0,-26],[0,-27],[0,-26],[0,-27],[0,-26],[0,-27]],[[6554,7563],[-4,0],[-8,-3],[-3,2],[-2,3],[-1,3],[-2,3],[-3,6],[-6,14],[0,4],[-2,5],[-5,7],[-13,13],[-3,2],[-3,0],[-2,-1],[-7,-1],[-5,-3],[-7,-3],[-7,-4],[-4,-4],[-4,-7],[-6,-9]],[[6457,7590],[-1,6],[0,12],[2,8],[2,11],[1,7],[-1,12],[-1,3],[-2,1],[-5,-1],[-1,-1],[-3,4],[-3,1],[-3,-2],[-2,2],[-2,4],[-3,9],[-2,3],[-3,1],[-6,0],[0,18],[-2,5],[-3,4],[-2,6],[-3,12],[-3,14],[-4,4],[-10,3],[-2,2],[0,10],[1,3],[3,3],[13,0],[5,-6],[3,-1],[6,2],[5,-1],[-2,3],[-5,2],[-2,5],[-5,6],[-1,3],[0,4],[1,3],[3,4],[2,4],[3,9],[2,5],[4,-1],[5,3],[9,0],[10,1],[10,-4],[8,-2],[4,1],[-4,5],[-6,5],[-2,4],[3,12],[4,11],[3,13],[-1,13],[-1,3],[0,4],[3,7],[-1,5],[-2,6],[-4,6],[-7,0],[-5,2],[-2,-2],[-2,-4],[-4,-3],[-3,0],[-2,4],[-2,-1],[-6,3],[-3,5],[-9,4],[-4,1],[-7,-4],[-9,-9],[-2,-1],[-1,1],[-2,-1],[-11,-14],[-3,-2],[-4,-1],[-3,0],[-2,-2],[-4,0],[-2,-1],[0,-7],[-2,2],[-2,-3],[0,-3]],[[6366,7852],[-12,10],[-5,3],[-3,5],[0,3],[3,4],[2,-2],[6,-2],[2,2],[0,2],[-7,19],[-4,13],[-4,8],[-4,7],[-3,7],[-2,2],[-14,3],[-3,1],[-5,-4],[-3,3],[-2,5],[-1,4],[1,4],[0,6],[-3,9],[-5,3],[-5,5],[-1,9],[2,13],[4,10],[5,7],[0,6],[-2,3],[-3,3],[-1,4],[1,8],[1,11],[3,9],[4,5],[3,3],[2,4],[0,12],[3,5],[2,2],[3,1],[3,-2],[4,-6],[6,-10],[4,-10],[6,-6],[5,3],[6,5],[1,3],[-1,5],[-2,7],[-1,8],[-1,11],[-1,4],[5,-1],[3,2],[4,5],[7,7],[2,5],[1,5],[2,4],[9,2],[3,4],[9,5],[3,5],[4,8],[4,5],[3,5],[1,3],[10,-5],[3,-3],[1,-6],[3,-1],[5,1],[5,4],[6,7],[6,2],[3,-2],[3,-5],[2,-5],[4,-2],[5,1],[2,-1],[4,0],[8,1],[6,-5],[4,-9],[8,-5],[5,-7],[4,-7],[4,-8],[0,-6],[2,-8],[1,0],[3,3],[0,11],[-1,6],[-2,4],[1,2],[4,1],[8,-8],[5,-7],[10,-8],[4,-1],[3,1],[7,6],[2,8],[10,10],[4,-2],[4,3],[2,0],[5,2],[4,-2],[7,-9],[4,1],[4,5],[1,4],[2,2],[6,-1],[4,0],[0,1],[5,-2],[5,-5],[3,-6],[5,-7],[1,-3],[3,-1],[3,0],[2,-1],[8,-2],[2,-2],[0,-5],[7,3],[1,2],[4,12],[2,3],[3,-1],[5,-7],[3,-2],[3,0],[3,-1],[9,2],[8,5],[4,5],[2,7],[2,9],[2,5],[-1,6],[-4,5],[-11,4],[-1,3],[-15,6],[-2,7],[-3,4],[-6,3],[-1,3],[1,2],[5,3],[5,6],[2,1],[5,0],[8,8],[1,6],[-5,10],[-1,6],[3,9],[2,2],[1,4],[2,2],[9,2],[14,-3],[4,1],[1,5],[-2,3],[-6,4],[-3,3],[-7,1],[-6,3],[-1,2],[0,4],[2,3],[2,1],[2,-1],[4,3],[0,3],[-3,2],[-5,-2],[-7,4],[0,2],[3,5],[0,8],[1,5],[3,3],[3,1],[7,-3],[9,-2],[2,0],[1,3],[13,0],[4,4],[12,2],[1,2],[5,1],[8,3],[3,2],[4,-1],[5,2],[1,2],[4,3],[7,2],[2,-2],[4,0],[7,2],[5,-3],[2,2],[2,8],[4,3],[3,4],[6,-1],[6,5],[1,-2],[7,0],[10,3],[5,1],[10,3],[4,2],[6,2],[6,1],[4,4],[3,1],[4,0],[4,2],[0,7],[-1,2],[3,2],[4,0],[2,1],[9,9],[4,2],[14,-2],[7,-3],[4,-4],[6,-4],[2,0],[6,2],[1,3],[9,3],[1,-3],[4,-7],[2,-11],[4,-13],[1,-7],[-1,-3],[0,-10],[-3,-6],[2,-3],[6,-3],[10,1],[6,2],[3,-1],[2,2],[1,4],[2,1],[2,-3],[2,-5],[2,-3],[-1,-4],[2,-7],[4,3],[0,4],[-1,2],[1,2],[4,0],[5,-1],[6,-7],[3,-2],[4,0],[7,6],[2,-1],[-1,-6],[-3,-4],[-4,-3],[-3,-6],[0,-7],[2,-5],[0,-3],[3,1],[4,6],[6,3],[6,-1],[4,-2],[4,-5],[2,1],[0,6],[1,2],[11,11],[4,-1],[6,4],[5,5],[0,6],[1,1],[7,1],[6,3],[10,9],[7,1],[7,6],[2,0],[-1,-7],[-4,-10],[-6,0],[1,-7],[3,-5],[15,-15],[10,-10],[11,-13],[4,-11],[5,-9],[8,-17],[6,-16],[8,-18],[4,-10],[9,-22],[3,-6],[4,-13],[4,-12],[4,-10],[2,-1],[0,5],[2,1],[2,3],[4,0],[2,2],[1,3],[-1,5],[0,5],[5,3],[1,3],[2,1],[4,-1],[2,-2],[1,-3],[4,0],[1,-3],[-2,-7],[0,-3],[1,-1],[6,1],[2,-1],[1,-5],[0,-5],[1,-2],[4,0],[4,1],[5,0],[4,-3],[7,2],[4,-1],[4,3],[4,7],[7,0],[2,4],[5,2],[2,0],[10,-7],[4,-4],[3,-2],[1,-6],[3,-4],[2,-5],[1,-5],[1,-8],[2,-3],[2,0],[6,-2],[6,-7],[3,0],[2,-1],[0,-3],[-1,-4],[1,-3],[4,-8],[2,-5],[0,-3],[2,-1],[2,2],[4,-2],[10,-2],[2,-1],[1,-3],[1,1],[5,-1],[1,3],[5,5],[6,8],[3,-1],[0,-3],[-3,-5],[0,-3],[2,0],[3,-4],[4,-10],[3,-4],[5,-2],[2,-4],[0,-3]],[[6138,5059],[-1,-1],[0,4],[3,4],[2,-2],[0,-1],[-4,-4]],[[6162,5412],[-3,-10],[-4,-12],[-8,-22],[-5,-12],[-5,-9],[0,-36],[0,-48],[0,-49],[0,-48],[0,-33],[8,-20],[5,-13],[3,-10],[0,-4]],[[6153,5086],[-4,-10],[-4,-5],[-4,-2],[-3,2],[-1,-2],[-1,-4],[-1,1],[0,-6],[1,-3],[-1,-4],[-2,-4],[0,-4],[-5,-8],[-7,-1],[-3,-4],[-2,-4],[-1,-7],[0,-12],[-1,-8],[-1,-5],[-3,-6],[-2,-5],[-1,-5],[-1,-3],[-1,-12],[-2,-7],[0,-5],[-2,-4],[0,-3],[-1,-2],[-4,-19],[-3,-8],[-3,1],[-2,-5]],[[6088,4913],[0,1],[-3,3],[-4,6],[-4,7],[-4,6],[-5,6],[-4,7],[-4,6],[-4,7],[-5,6],[-3,6],[-1,4],[-2,3],[-1,0],[0,6],[2,6],[0,3],[-1,4],[0,8],[-3,3],[-12,14],[-12,14],[-6,6],[-12,14],[-12,14],[-5,7],[-6,7],[-6,6],[-12,14],[-12,14],[-2,2],[-2,3],[-2,0]],[[5941,5126],[0,34],[0,22],[1,11],[2,7],[2,5],[0,7],[2,6],[3,5],[0,2],[4,8],[2,10],[1,4],[3,5],[3,1],[2,2],[0,2],[-1,6],[1,2],[2,8],[2,5],[0,4],[1,3],[0,6],[-3,32],[1,3],[-2,6],[-1,2],[-2,12],[-1,1],[-3,5],[-2,11],[-2,3],[-1,11],[-1,3],[2,11],[0,3],[-2,2],[-3,2],[-3,5],[0,2],[-1,2],[-4,19]],[[5943,5426],[5,12],[6,11],[7,15],[7,14],[5,11],[6,11]],[[7044,7455],[-1,1],[-3,0],[-3,-1],[-1,-2],[-3,-2],[-3,-1],[-7,0],[-6,2],[-8,-3],[-3,-7],[-1,0],[-4,6],[-2,2],[-6,-4],[-2,1],[0,7],[-1,1],[-4,1],[-1,1],[0,6],[-3,1],[-3,-4],[-5,-1],[-1,-1],[-2,-5],[-6,-1],[-3,5],[-2,5],[-1,1],[-5,0],[-4,-2],[-1,2],[-2,-1],[-5,-1],[-10,2],[-4,-3],[-4,0],[-1,8],[-1,5],[0,4],[2,8],[2,-1],[1,-2],[2,1],[0,4],[-1,1],[2,5],[7,3],[5,3],[12,-8],[2,-1],[2,-6],[3,3],[0,5],[3,3],[6,3],[0,3]],[[6970,7501],[1,1],[8,2],[5,-3],[1,-2],[4,1],[1,-4],[5,5],[3,1],[1,5],[3,5],[3,1],[4,-3],[1,2],[-1,5],[0,3],[1,1],[5,-4],[3,2],[2,3],[0,3],[10,8],[0,2],[-4,2],[-3,-1],[-1,1],[-5,0],[-1,1],[-3,6],[-4,3],[-5,-1],[0,6],[-2,4],[-2,-2],[-2,2],[-3,0],[0,7],[-2,6],[-3,2],[0,5],[-2,-2],[0,-8],[-1,-2],[-2,-1],[-2,2],[-1,-13],[-3,2],[-2,-1],[-3,1],[-2,2],[-2,0],[-5,4],[-1,8],[-2,3],[-6,-2],[-1,2],[-6,3],[-1,4],[8,9],[3,6],[4,4],[3,1],[1,6],[5,3],[5,5],[0,2],[-2,3],[-3,2],[-2,-2]],[[6963,7477],[-1,2],[-5,1],[2,-5],[4,2]],[[6993,7484],[0,3],[-3,-2],[1,-3],[2,2]],[[6977,7481],[-1,5],[1,4],[-4,2],[-1,4],[-2,-1],[0,-6],[2,-2],[-1,-6],[6,0]],[[7861,5833],[-1,0],[0,6],[1,0],[0,-6]],[[7858,5858],[0,1],[-5,21],[-1,9],[1,8],[0,2],[-1,4],[-2,4],[-4,6],[0,9],[-1,11],[-1,4],[-2,6],[-1,6],[0,15],[6,2],[1,2],[-1,2],[2,3],[3,8],[3,7],[2,10],[4,6],[4,5],[7,2],[3,3],[2,0],[3,-3],[5,0],[2,-1],[2,1],[5,1],[5,-1],[5,1],[5,2],[3,-1],[3,-2],[0,-7],[2,-1],[2,3],[1,4]],[[7920,6010],[1,-2],[0,-3],[1,-4],[3,-5],[1,0],[4,3],[6,-4],[2,-7],[2,-3],[5,0],[2,8],[-1,4],[-3,8],[0,5],[5,1],[1,6],[2,0],[2,-1],[3,3],[1,4],[3,-6],[2,-2],[2,-3],[1,-3],[1,-1],[3,1],[3,5],[2,0],[3,4],[1,5],[1,1],[2,-2],[1,0],[2,6],[1,2]],[[7985,6030],[1,-3],[-1,-6],[-4,-10],[0,-4],[-1,-10],[0,-3],[2,-5],[2,-10],[2,-9],[1,-8],[1,-5],[-2,-12],[-2,-11],[0,-6],[1,-5],[1,-8],[0,-16],[-1,-4],[-2,-3],[-1,-3],[-2,4],[-3,-1],[-2,-2],[-3,-5],[-3,-6],[-5,-2],[-1,-4],[-2,0],[-4,-1],[-2,0],[0,-15],[-2,-1],[-3,2],[-4,2],[-3,1],[-1,-5],[-1,-2],[-2,-1],[0,-19],[1,-3],[6,-10],[2,-2],[-1,-7],[1,-7],[-2,0],[-5,5],[-2,-1],[-1,4],[-3,4],[-4,-2],[-5,-2],[-2,-5],[-4,3],[-3,1],[-1,-2],[0,-4],[1,-4],[0,-2],[-2,-3],[-2,-4],[-3,-4],[-7,0],[-2,-5],[-2,-1]],[[7899,5783],[-4,7],[-9,3],[-1,3],[-1,1],[-1,-4],[-5,-4],[-2,2],[-1,3],[0,4],[1,3],[3,2],[1,8],[-2,9],[-3,5],[-2,-3],[-2,-6],[-1,-4],[-6,0],[-2,17],[1,9],[0,5],[-3,8],[0,7],[-2,3],[0,-3]],[[783,4524],[-1,1],[0,2],[1,0],[0,-3]],[[670,4859],[-2,0],[0,1],[2,0],[0,-1]],[[9846,5137],[-1,2],[-1,7],[1,0],[1,-5],[0,-4]],[[9805,5242],[1,-3],[0,-3],[-2,-5],[-1,1],[2,4],[1,3],[-1,3]],[[9805,5261],[0,1],[4,1],[0,-2],[-4,0]],[[629,5290],[4,-6],[-2,-1],[-4,3],[-5,7],[2,1],[0,-2],[2,-2],[1,4],[2,3],[0,-7]],[[573,5409],[3,-5],[-1,-2],[-1,0],[0,4],[-2,1],[1,2]],[[3262,6169],[-1,-1],[-1,2],[0,4],[1,0],[1,-2],[0,-3]],[[3259,6176],[-2,3],[-2,1],[-1,2],[0,3],[1,1],[2,-3],[1,-4],[1,-1],[0,-2]],[[8508,7097],[-2,-1],[-1,1],[-2,5],[1,3],[4,6],[10,5],[2,0],[4,-2],[1,-4],[-2,-6],[-8,-6],[-7,-1]],[[8520,7161],[0,-2],[-2,0],[-1,3],[1,2],[2,-3]],[[8505,7163],[-2,-1],[-1,2],[0,3],[4,7],[2,-1],[1,-3],[-1,-4],[-3,-3]],[[8549,7177],[-1,-2],[-1,3],[1,3],[1,-4]],[[8503,7184],[-1,-1],[-2,7],[-1,2],[2,2],[2,-5],[0,-5]],[[8556,7188],[0,-6],[-2,0],[-1,4],[-2,-2],[-1,4],[0,4],[2,3],[1,-2],[2,-1],[1,-4]],[[8575,7188],[-3,-4],[-4,7],[5,9],[1,0],[1,-12]],[[8510,7285],[0,-4],[-2,3],[-1,8],[2,-2],[1,-5]],[[8635,7342],[-1,-2],[-2,2],[0,2],[3,2],[1,-1],[-1,-3]],[[8513,7357],[0,-8],[-3,1],[-1,9],[1,3],[2,-2],[1,-3]],[[8516,7359],[1,2],[0,6],[3,4],[3,7],[4,8],[4,4],[17,0],[4,-1],[5,2],[2,2],[3,9],[2,5],[1,1]],[[8565,7408],[6,-26],[7,-16],[5,-13],[8,-23],[3,-12],[0,-8],[1,-10],[-1,-6],[0,-15],[-1,-4],[0,-15],[2,-3],[1,2],[2,1],[0,-6],[-3,-15],[-1,-11],[-3,-10],[-3,-8],[-4,-4],[-3,-1],[-5,0],[-4,1],[-4,-1],[-2,-5],[1,-5],[0,-3],[-2,0],[-3,2],[-4,0],[-1,1],[-2,6],[-4,-4],[-5,0],[-2,-4],[1,-3],[2,-3],[-1,-4],[-2,-2],[-2,5],[-1,4],[-3,-1],[-1,-5],[1,-3],[2,-3],[-3,-8],[-2,-2],[-4,5],[3,7],[0,3],[-1,2],[-6,-8],[-3,-10],[-2,1],[-2,3],[-4,-6],[-1,-5],[-2,0],[0,6],[-1,4],[-4,6],[-2,4],[1,3],[3,-1],[3,0],[0,2],[2,5],[-1,1],[-2,-2],[-2,1],[0,6],[-2,7],[-1,6],[2,4],[1,5],[1,8],[1,3],[3,2],[1,2],[-4,2],[0,3],[2,1],[1,2],[4,4],[1,5],[-1,2],[-2,1],[0,3],[1,4],[-3,4],[-1,3],[0,18],[-2,13],[-3,-3],[-4,3],[-1,0],[-1,4],[2,6],[3,5],[3,1],[1,2],[3,1],[3,-4],[2,-1],[2,-5],[1,0],[3,5],[-3,2],[-3,11],[-1,2],[2,5],[-4,9],[0,6],[-3,10],[2,3]],[[5556,7634],[1,5],[-2,6],[1,1],[4,0],[0,2],[4,2]],[[5564,7650],[4,2],[-1,4],[5,6],[1,4],[-2,4],[5,5],[1,0],[0,-3],[1,-2],[3,-3],[5,-4],[3,-8],[4,-5],[0,-4],[10,-5],[0,-4],[-4,-10],[0,-2],[-2,-2],[0,-4],[1,-2]],[[5598,7617],[-5,-2],[-2,-2],[0,-3],[-2,-2],[-3,5],[-10,-6],[-1,-4],[0,-8],[-1,-1],[-4,1]],[[6340,6890],[-2,-2],[-2,4],[-2,8],[2,5],[1,5],[2,-2],[3,-9],[0,-5],[-2,-4]],[[6344,6827],[-21,0],[-2,5],[-2,12],[-3,9],[-12,3],[-7,2],[-6,1]],[[6332,6910],[-1,-2],[1,-6],[4,-13],[0,-2],[-5,2],[-4,-7],[-3,-6],[4,-1],[4,1],[2,-2],[1,-4],[0,-4],[2,-14],[2,-4],[3,-8],[1,-4],[0,-4],[1,-5]],[[7920,6010],[2,1],[3,3],[4,6],[0,8],[1,10],[1,5],[-1,7],[-1,5],[0,11],[2,5],[1,4],[1,6],[0,7],[-2,2],[-3,2],[-2,3],[0,7],[1,2],[-2,3],[-5,3],[-3,4],[-1,5],[-2,5],[-4,8],[-2,10],[0,14],[1,11],[1,13],[-2,9],[-2,5],[-7,9],[-2,6],[-4,10],[-4,14],[-3,5],[-1,-1],[-3,1],[-5,4],[-4,2],[-5,0],[-1,-2],[0,-2],[1,-2],[-1,-2],[-2,-1],[-3,-7],[-1,-6],[-1,-3],[-3,0],[-3,-2],[-3,-5],[0,-2],[-2,0],[0,6],[-2,2],[-2,1],[-3,4],[-6,9],[-1,0],[-2,-2],[-2,-5],[-2,-2],[-2,1],[-1,-2],[-1,-5],[-5,-7],[0,-1],[-4,-5],[-3,-6],[-4,-7],[-2,-1],[-1,2],[-3,2],[-1,2],[2,12],[3,14],[1,6],[0,9],[-2,7],[0,4],[3,8],[1,10],[2,10],[0,7],[-2,14],[0,12],[-1,2],[-7,2],[-2,-2],[-1,-2],[-2,-2],[-3,-1],[-3,4],[-3,5],[0,6],[1,8],[2,6],[1,5],[-1,3],[0,3],[-1,0],[-2,3],[-1,6],[-3,2],[-4,-8],[0,5]],[[7780,6354],[0,3],[2,12],[1,8],[5,6],[2,-1],[2,1],[0,3],[-1,2],[0,4],[1,3],[2,1],[1,4],[1,7],[2,4],[1,0],[3,3],[5,6],[1,6]],[[7836,6472],[1,-5],[3,-6],[4,-9],[4,-7],[2,-8],[0,-5],[1,-1],[2,1],[1,7],[1,0],[1,-5],[2,0],[1,-5],[-2,-7],[0,-4],[-1,-6],[0,-4],[7,-21],[3,-3],[7,-4],[4,-5],[3,2],[2,5],[2,3],[6,5],[3,-2],[4,-5],[5,-8],[2,-2],[0,-3],[-3,-4],[-3,-5],[0,-1],[7,-3],[1,-3],[0,-6],[1,-1],[3,1],[2,-3],[1,-5],[0,-4],[-3,-6],[0,-4],[-2,-5],[-4,-8],[-1,0],[-8,4],[-7,0],[0,-2],[1,-5],[0,-5],[-1,-3],[-3,-5],[0,-4],[6,-4],[9,-12],[2,-3],[6,-8],[7,-4],[4,-3],[0,-6],[-1,-4],[0,-3],[2,-6],[3,-6],[2,-3],[3,-2],[2,-4],[2,-6],[0,-4],[1,-4],[2,-6],[7,-17],[1,-2],[8,-11],[1,-4],[3,-8],[2,-3],[1,-5],[0,-13],[2,-3],[1,-3],[0,-3],[1,-2],[2,0],[2,4],[1,0],[1,-7],[1,-3],[4,-4],[4,-8],[2,-3],[2,-1],[1,-2],[0,-5],[-1,-2],[-5,-4],[0,-6],[1,-4],[2,-3],[1,-3],[4,-6],[3,-4],[1,-5],[1,-3],[0,-4],[-2,-4],[-3,-8],[1,-4],[0,-12]],[[5998,7178],[8,0],[1,3],[3,-1],[1,-3],[-1,-3],[-2,-3],[5,-4],[2,-13],[-1,-5],[-2,-4],[-1,0],[-4,-6],[0,-3],[2,-4],[-8,0],[-2,-3],[-2,-7],[3,-4],[0,-2],[-2,-1],[-1,-4],[-2,-2]],[[5974,7089],[3,10],[1,8],[2,6],[5,22],[3,8],[1,13],[4,11],[4,3],[1,3],[0,5]],[[4679,5581],[2,3],[2,8],[3,8],[3,5],[4,8],[4,4],[5,12],[1,1],[1,8],[1,10],[2,3],[3,2],[1,2],[2,7],[0,10]],[[4789,5434],[-3,1],[-9,8],[-7,5],[-25,26],[-6,11],[-8,16],[-17,32],[-4,6],[-5,2],[-6,6],[-1,9],[-13,13],[-6,12]],[[5693,6450],[0,-28],[0,-29],[0,-29],[0,-29],[-14,0],[-14,0],[0,-29]],[[5665,6306],[-13,14],[-14,14],[-13,13],[-13,14],[-13,13],[-14,14],[-13,14],[-13,13],[-14,14],[-13,14],[-13,13],[-14,14],[-13,13],[-13,14],[-14,14],[-13,13],[-9,10],[-10,-9],[-8,-8],[-10,-9]],[[5415,6508],[-12,-12],[-9,-10],[-1,0],[-9,16],[-7,13],[-4,3],[-13,7],[-14,6],[-15,7]],[[5263,6924],[4,4],[4,3],[3,3],[1,2],[3,9],[2,5],[3,6],[1,5],[0,10],[-4,25],[1,4],[3,8],[1,1],[5,2],[2,4],[1,5],[1,2],[6,9],[5,5],[4,5],[5,5],[5,4],[0,7],[-2,6],[0,15],[1,4],[0,11],[1,2]],[[5319,7095],[4,-4],[4,-2],[13,-13],[4,-2],[9,-1],[11,5],[4,1],[10,-7],[5,0],[11,-6],[6,-8],[2,-2],[19,-7],[5,-13],[0,-11],[1,-8],[2,-10],[3,-8],[3,-6],[12,-9],[9,-2],[9,-1],[16,-7],[13,-9],[4,-5],[6,-4],[14,-21],[7,-7],[5,-1],[5,1],[8,7],[4,4],[8,18],[3,10],[1,6],[-2,13],[-2,6],[-2,9],[-1,15],[2,10],[1,7],[3,6],[7,12],[7,9],[12,11],[7,0],[3,1],[6,8],[2,1],[4,-2],[9,0],[5,-2],[5,-5],[6,-3],[5,-3],[4,-4],[1,-10],[0,-6],[5,-7],[14,-3],[3,-2],[6,-7],[10,-1],[6,1],[5,-1],[2,-2],[2,-4],[4,-13]],[[3308,5979],[-2,-6],[-3,4],[0,8],[2,5],[1,4],[1,1],[1,-5],[0,-11]],[[7218,5705],[0,-5],[-2,3],[-1,3],[3,-1]],[[7220,5738],[-2,-1],[-1,4],[0,4],[1,-1],[2,-6]],[[7221,5748],[7,0],[3,-9],[10,-16],[5,-16],[0,-4],[1,-3],[2,-2],[6,-19],[0,-6],[3,-2],[1,-2],[2,-13],[0,-5],[7,-22],[0,-3],[3,-13],[1,-2],[1,-8],[0,-22],[-1,-9],[-2,-8],[-1,-6],[-3,-5],[-7,-10],[-2,-2],[-9,-7],[-7,-6],[-6,-2],[-7,3],[-4,9],[-3,12],[-1,13],[-3,14],[-2,43],[-1,12],[-1,16],[2,-3],[1,2],[0,15],[1,6],[2,16],[0,12],[4,11],[1,7],[0,14],[-1,7],[3,-2],[2,-3],[2,-2],[1,1],[2,0],[-1,4],[-4,4],[-6,2],[-2,3],[0,5],[1,1]],[[5769,3516],[7,4]],[[5776,3520],[3,6],[4,4],[7,5],[4,2],[5,-10],[1,-1],[3,-6],[3,-4],[3,-5],[3,-3],[1,0],[2,-8],[0,-5],[-2,-15],[-3,-5],[-2,-2],[0,-6],[-1,-7],[-3,-5],[-7,-6],[-2,-1],[-4,0],[-3,-1],[-3,-4],[-5,-18],[-2,-6],[-1,-1],[-7,3],[-3,3],[-2,4],[-2,6],[-3,3],[-1,2],[0,7],[-5,13],[-1,6],[-2,5],[-1,5],[1,2],[6,6],[4,9],[1,4],[2,3],[1,6],[4,11]],[[5581,8367],[-2,1]],[[5579,8368],[4,6],[1,5],[1,0],[-2,-8],[-2,-4]],[[5651,8290],[0,8],[-1,4],[-2,3],[-5,5],[-4,1],[-1,3],[-3,2],[-2,0],[-2,-2]],[[5631,8314],[-2,8],[0,4],[4,16],[0,2],[-2,3],[-4,3],[-1,5],[-14,0],[-5,2],[-9,5],[-5,5],[-4,-1]],[[5589,8366],[-1,5],[1,6],[-2,10],[-3,11],[0,15]],[[5584,8413],[7,7],[9,7],[3,1],[8,4],[15,-2],[6,1],[2,1],[3,-1],[2,-4],[4,3],[12,-2],[5,0],[6,-2],[3,-2],[10,1],[6,6],[2,1],[4,0],[1,-4],[3,-8],[15,-4],[2,-1],[6,-7],[6,-5],[5,-9],[7,-4],[2,0]],[[5584,8413],[-1,11],[0,21],[1,11],[8,11],[2,7],[0,6],[1,5],[8,14],[5,2],[8,4],[9,3],[3,-7],[11,-12],[3,-4],[4,-13],[10,-7],[8,2],[9,9],[3,5],[1,4],[-1,19],[-2,8],[1,5]],[[5759,8497],[4,-1],[1,-5],[7,-6],[1,-2],[0,-7],[-2,-2],[-1,-4],[0,-5],[-2,-8],[4,2],[2,-3],[1,-5],[3,-8],[3,-3],[1,-9],[1,-4],[0,-7],[-1,-3]],[[8153,6463],[-2,-1]],[[3249,6224],[-3,0]],[[3246,6224],[1,3],[2,-1],[0,-2]],[[4758,6776],[-4,0],[1,-7],[0,-16],[1,-6],[-1,-2],[-3,-1],[-14,0],[-3,-3],[-5,-8],[-1,-3],[-5,0],[-2,2],[-3,1],[-3,-3],[-2,0],[-8,8],[-3,0],[-3,2],[-4,-1],[-4,-2],[-6,-4],[-3,-1],[0,-5],[2,-3],[0,-4],[-1,-3],[-4,-6],[-2,-7],[-4,-11],[0,-6],[-1,-1],[-4,-1],[-4,-2],[-2,-7],[0,-5],[-2,-11],[-2,-13],[-1,-9],[-2,-16],[-1,-6],[-3,-6],[-2,-2],[-4,-6],[-6,-6],[-4,-7],[-1,-6],[-2,-5],[-1,-7],[-3,-6],[-2,-3],[-2,-1],[-5,-5],[-3,-2],[-4,-6],[-1,-4],[-2,-12],[-1,-4],[-2,-14],[0,-8],[-2,-12],[0,-18],[-1,-4],[0,-4],[-2,-7],[-2,-4],[-2,-2],[-5,-13],[0,-6],[-1,-4],[0,-5],[-5,-8],[-4,-1],[-5,0],[-4,1],[-4,0],[-5,1],[-8,2],[-4,0],[-4,-1],[-11,0],[-10,-3],[-1,-1]],[[4527,6417],[2,28],[4,15],[3,6],[4,4],[5,15],[1,14],[3,6],[1,5],[-1,4],[2,7],[4,12],[1,7],[4,11],[-1,3],[-2,-4],[-1,1],[1,6],[9,13],[11,23],[4,4],[4,10],[1,9],[1,20],[1,11],[3,8],[2,15],[3,7],[1,13],[2,5],[6,10],[6,4],[8,9],[3,5],[2,8],[3,16],[4,16],[2,13],[4,7],[2,8],[5,4],[9,2],[13,6],[12,11],[4,4],[3,8],[6,11],[12,13],[5,7],[8,19],[5,15],[4,9],[3,9],[2,9],[2,14],[-1,5],[-3,9],[-3,2],[0,5],[1,7],[0,13],[1,20],[3,17],[9,21],[2,9],[1,14],[0,5],[12,20],[6,16],[8,11],[21,15],[12,11],[6,8],[4,9],[12,37],[11,52],[0,6],[5,2],[4,1],[3,2],[3,4],[3,-2],[-1,-2],[0,-7],[2,-7],[4,-9],[8,-11],[5,-4],[9,-2],[9,4],[6,0],[2,2],[3,-3],[6,-1],[5,2],[4,5],[2,5],[1,-3],[0,-3],[1,-1],[1,-7],[1,-2],[3,0],[3,-1],[6,0],[5,-1]],[[5206,7703],[-2,-1]],[[5738,7963],[1,2],[6,5],[1,-1],[9,0],[3,4],[2,-1],[4,4],[1,-1],[4,-1],[3,-2],[4,-5],[2,0],[1,-4],[2,-1],[4,0],[2,-5],[3,-4],[1,4],[2,-1],[5,-1],[4,-10],[2,-1],[2,1],[1,2],[1,-1],[2,-5],[0,-13],[-2,-7],[1,-4],[5,-5],[1,-3],[2,-2],[2,0],[1,-2],[0,-4],[-1,-5],[1,-3],[0,-5],[4,-4],[5,-3],[2,-6],[-1,-6],[0,-5],[6,-7],[-2,-2],[-5,-1],[-1,-1],[-4,6],[-2,-3],[-2,0],[-3,3],[-3,-1],[-2,-3],[-2,0],[0,8],[-1,0],[-6,-4],[-1,-2],[1,-3],[0,-5],[2,-6],[-2,-7],[-3,-4],[-3,-3],[0,-5],[-2,-3],[-3,-3],[-2,-4],[1,-3],[0,-6],[-1,-1],[-5,0],[-2,-3]],[[5783,7801],[-4,9],[2,2],[0,4],[-1,5],[0,5],[-1,5],[1,10],[3,18],[0,11],[-2,8],[-2,11],[-8,11],[-1,4],[-4,6],[-4,11],[-4,6],[-5,19],[-2,5],[-2,3],[-1,3],[-2,3],[-3,3],[-5,0]],[[6386,4210],[-2,-2],[3,13],[1,1],[-2,-12]],[[6342,4414],[0,-3],[-4,1],[0,8],[1,0],[1,3],[1,0],[1,-6],[0,-3]],[[6375,4467],[1,-6],[2,-6],[4,-14],[2,-5],[2,-6],[1,-11],[3,-18],[3,-26],[0,-28],[1,-12],[2,-12],[4,-12],[1,-14],[-2,-14],[-3,-13],[-2,-6],[-1,0],[-3,4],[-2,5],[-3,20],[-1,1],[-3,-1],[-3,-4],[0,-2],[1,-8],[0,-6],[1,-7],[0,-9],[2,-4],[1,-6],[0,-20],[-3,-6],[0,-3],[1,-3],[0,-2],[-3,-3],[-1,-2],[-2,-6],[-3,-12],[0,-6],[2,-18],[-1,-14],[-3,-25],[-2,-12],[-2,-14],[-4,-19],[-4,-24],[-4,-24],[-2,-15],[-3,-14],[-4,-26],[-3,-25],[-5,-29],[-7,-32],[0,-4],[-2,-16],[-1,-14],[-2,-14],[-4,-23],[0,-7],[-1,-7],[-4,-14],[-2,-11],[-2,-15],[-3,-12],[-4,-11],[-2,-4],[-6,-6],[-3,-1],[-7,-1],[-6,-3],[-7,-6],[-8,-11],[-3,-2],[-8,-1],[-3,2],[-8,12],[-4,2],[-6,2],[-3,2],[-3,7],[-5,5],[-2,5],[0,4],[-1,5],[-1,8],[-2,6],[-5,10],[0,22],[-1,14],[2,12],[0,6],[-2,7],[-2,13],[-5,11],[-2,11],[-1,18],[-1,6],[1,13],[0,7],[2,5],[0,3],[2,6],[0,2],[2,17],[3,4],[3,2],[3,4],[3,18],[4,13],[1,6],[4,9],[3,14],[1,6],[0,7],[1,14],[1,7],[0,7],[-6,21],[0,19],[-4,14],[-2,12],[-1,20],[0,14],[-1,7],[1,11],[12,39],[0,27],[3,2],[10,2],[2,1],[2,3],[5,9],[1,-1],[1,-3],[1,-1],[4,3],[2,0],[1,-1],[2,6],[0,3],[1,1],[9,2],[4,3],[1,-1],[3,-9],[1,-1],[2,0],[1,2],[-3,4],[0,6],[1,7],[3,5],[5,7],[6,9],[2,1],[1,-2],[1,-10],[0,-2],[2,1],[1,4],[0,4],[-1,3],[0,6],[3,6],[2,6],[1,7],[1,3],[3,3],[1,-3],[0,-6],[-2,-7],[2,-1],[1,1],[4,14],[1,4],[2,2],[3,0],[-2,6],[-1,10],[5,17],[0,4],[1,2],[-3,6],[0,7],[2,4],[1,3],[1,1],[2,-1],[2,-5],[2,-1],[3,5],[1,6],[3,4],[3,2],[5,9],[4,25],[-2,13],[-2,8],[1,2],[2,-1],[1,1],[3,7],[5,14],[3,-3],[0,-4],[4,-9],[2,-5]],[[7038,5369],[-1,1],[0,2],[1,1],[1,-1],[0,-2],[-1,-1]],[[7041,5423],[-1,0],[0,3],[1,1],[0,-4]],[[2452,6259],[-3,-1],[0,1],[3,0]],[[1918,6263],[-1,-1],[-3,3],[2,5],[2,-4],[0,-3]],[[2584,6353],[-1,-2],[-1,6],[1,6],[2,4],[2,0],[2,2],[-1,-7],[-4,-9]],[[2041,6428],[-1,-5],[-2,2],[-1,3],[0,5],[1,1],[2,-2],[1,-4]],[[1897,6588],[-1,-2],[-8,10],[4,1],[5,-9]],[[1928,6623],[1,-6],[-2,1],[-2,3],[-1,7],[3,-2],[1,-3]],[[1887,6597],[-1,-1],[-2,7],[-1,5],[-1,2],[-2,1],[2,9],[2,20],[1,-4],[-2,-19],[0,-3],[2,-6],[0,-5],[2,-6]],[[1913,6682],[1,-2],[-1,-1],[-2,4],[2,2],[0,-3]],[[1800,6800],[0,-2],[-5,4],[3,7],[-1,7],[1,1],[1,-2],[2,-9],[-1,-6]],[[1715,6850],[-1,-2],[-4,12],[0,3],[3,1],[0,-3],[2,-5],[0,-6]],[[1883,6854],[-3,-14],[-2,1],[-4,4],[-1,3],[2,15],[1,2],[4,2],[1,-1],[0,-5],[2,-7]],[[1856,6857],[-3,2],[-9,18],[0,10],[2,-1],[3,-4],[1,-4],[0,-5],[5,-2],[0,-10],[1,-4]],[[1813,7009],[-1,0],[-1,3],[0,3],[3,-4],[-1,-2]],[[2437,6021],[-1,1],[-7,16],[-8,17],[-3,6],[-3,4],[-4,8],[-10,17],[-5,8],[-6,10],[-4,5],[-5,4],[-1,2],[-2,2],[-1,0],[-2,-5],[-5,0],[-1,2],[3,5],[-1,2],[-1,0],[-4,-4],[0,5],[-2,3],[-1,0],[-3,-6],[0,-2],[5,-2],[1,-2],[-4,0],[-5,-2],[-10,-12],[-8,-5],[-12,-11],[-6,0],[-3,-2],[-8,4],[-10,11],[-16,3],[-11,14],[-10,5],[-7,14],[-4,0],[-3,2],[-9,5],[-10,3],[-9,12],[-6,4],[-5,4],[-12,8],[-4,4],[-4,7],[-7,7],[-3,6],[-3,2],[-4,11],[-3,5],[-2,2],[-8,0],[-9,4],[-4,2],[-9,7],[-12,8],[-4,9],[-3,9],[-6,11],[-4,5],[-6,5],[-4,5],[-5,3],[-10,9],[-3,8],[-1,7],[-5,8],[-6,16],[-1,6],[-1,8],[-1,5],[-2,4],[1,3],[3,4],[4,1],[3,4],[1,5],[-2,5],[-5,1],[-1,2],[2,2],[4,10],[2,6],[0,15],[1,6],[-6,7],[-3,12],[-3,10],[0,19],[-4,18],[-7,11],[-6,14],[-4,7],[-5,15],[-4,9],[-6,16],[-4,8],[-19,26],[1,0],[5,-7],[1,1],[0,7],[-1,1],[-2,-1],[-3,2],[-3,1],[-3,4],[-2,5],[0,5],[-5,11],[1,2],[3,1],[-1,4],[-8,5],[-3,5],[-6,6],[-2,3],[-1,6],[-1,1],[-5,-4],[-1,4],[2,2],[3,6],[0,3],[-4,-6],[-5,-3],[-2,1],[-3,7],[-1,18],[4,12],[2,3],[-1,6],[0,3],[-1,5],[-6,10],[-7,-1],[-2,4],[-2,7],[-1,5],[0,3],[-1,3],[-9,5],[-3,4],[-3,5],[-2,7],[-1,6],[0,6],[1,8],[1,4],[-6,3],[-3,0],[-2,-1],[-5,4],[-5,9],[-5,15],[-6,5],[-2,6],[-2,4],[-3,9],[0,1],[-3,5],[-3,7],[-1,5],[-1,9],[-4,5],[-1,4],[0,7],[-5,10],[-2,9],[-2,6],[-1,8],[-2,11],[-3,12],[-3,8],[-2,8],[1,8],[0,7],[1,2],[0,5],[-1,2],[-3,1],[-1,2],[-7,2],[-4,3],[0,7],[-2,3],[-7,6],[-1,-2],[0,-4],[-4,-1],[-4,3],[-8,10],[-1,2],[-3,1],[-6,7],[2,-6],[2,-9],[-2,-6],[-1,-22],[1,-5],[3,-7],[1,-11],[2,-15],[0,-20],[2,-7],[4,-8],[1,-4],[6,-5],[3,-7],[6,-10],[2,-4],[6,-15],[0,-5],[2,-6],[3,2],[1,-7],[4,-2],[3,-16],[1,-3],[3,-1],[2,-2],[0,-7],[2,-5],[0,-7],[1,-5],[0,-6],[1,-4],[5,-10],[6,-7],[1,-11],[3,-9],[5,-6],[0,-6],[3,-8],[1,-9],[3,-6],[2,0],[-3,6],[-1,4],[0,7],[1,1],[6,-10],[1,-8],[2,-4],[0,-6],[4,-16],[0,-11],[1,-8],[4,-13],[3,-2],[1,-7],[3,-15],[4,-9],[2,-7],[0,-5],[-1,-7],[-1,-4],[2,-15],[4,-7],[4,-3],[-1,-2],[2,-2],[2,6],[-1,4],[0,4],[1,1],[7,-10],[1,-4],[3,-4],[3,-10],[2,-4],[1,-8],[4,-4],[3,-6],[0,-5],[-1,-11],[-1,-3],[-4,-4],[-3,-6],[-2,-3],[-3,-3],[-2,1],[-3,6],[-2,20],[-2,4],[-1,6],[-2,5],[-8,8],[-3,8],[-4,5],[-4,8],[-11,13],[-4,6],[-3,7],[-3,-1],[-1,2],[0,3],[-7,12],[-1,5],[0,7],[1,16],[1,9],[-2,9],[0,7],[-2,9],[-5,17],[-4,4],[-4,2],[-10,15],[-3,8],[-2,8],[-2,-4],[-4,1],[-5,-5],[-3,4],[-4,11],[-4,1],[-3,7],[-3,2],[-4,1],[-3,3],[-1,4],[0,5],[-1,3],[-9,13],[-4,5],[-1,3],[0,3],[6,-1],[7,-2],[3,0],[4,5],[1,-2],[-1,-4],[2,-3],[3,-3],[0,3],[-1,6],[0,5],[-3,1],[3,5],[2,12],[1,12],[-2,10],[-5,7],[-10,21],[-6,11],[-1,4],[-2,2],[-5,2],[-4,6],[-10,13],[-2,11],[-2,1],[1,7],[-1,13],[-1,3],[-4,3],[-1,9],[0,8],[-1,6],[-6,9],[0,5],[-1,4],[0,5],[-4,9],[-4,8],[-1,3],[0,10],[1,2],[0,5],[-6,8],[-2,12],[-4,6],[0,2],[-2,11]],[[1746,7057],[8,1],[8,2],[24,3],[7,2],[16,2],[4,1],[-2,-9],[-2,-3],[14,-9],[13,-8],[13,-9],[13,-8],[13,-9],[13,-8],[14,-9],[13,-8],[10,0],[19,0],[20,0],[10,0],[19,0],[0,26],[19,0],[6,-1],[25,0],[5,-13],[3,-5],[3,-3],[6,-9],[8,-15],[7,-10],[5,-5],[5,-8],[2,-8],[4,-18],[0,-8],[2,-8],[3,-10],[3,-6],[3,-2],[5,-9],[4,-4],[9,-6],[6,-8],[5,-4],[3,0],[2,2],[2,5],[1,4],[2,1],[1,3],[0,3],[1,7],[3,12],[3,6],[4,1],[2,2],[1,3],[2,1],[3,-3],[5,-2],[11,0],[2,1],[1,-2],[3,-2],[2,-6],[8,-10],[0,-3],[8,-13],[2,-6],[1,-6],[2,-9],[6,-18],[0,-4],[1,-6],[2,-5],[3,-4],[3,-7],[7,-19],[5,-5],[2,-5],[1,-5],[0,-4],[-1,-3],[0,-3],[2,-3],[0,-11],[4,-9],[2,-7],[1,-12],[2,-6],[3,-3],[4,-1],[3,-3],[4,-5],[4,-1],[3,-3],[2,-4],[6,-2],[8,-2],[6,-3],[6,-7],[0,3],[6,3]],[[2301,6679],[-2,-22],[-6,-20],[-2,-13],[-5,-36],[-1,-23],[0,-12],[-1,-1],[1,-2],[-1,-24],[0,-25],[-2,-6],[-1,-9],[0,-6],[2,-13],[1,-10],[5,-18],[2,-6],[4,-5],[1,-3],[-1,-7],[-1,-4],[-1,6],[1,3],[0,3],[-2,2],[-4,9],[-1,-9],[2,-6],[2,-2],[0,-4],[4,-17],[4,-18],[2,-10],[12,-25],[7,-18],[2,-18],[2,-5],[1,-8],[4,-8],[2,-5],[2,-3],[2,-9],[0,-5],[3,-3],[2,0],[1,1],[4,-4],[10,-1],[5,-7],[6,-3],[3,-10],[4,-10],[4,0],[6,1],[9,7],[3,3],[6,4],[9,1],[2,-2],[7,3],[3,3],[2,5],[6,3],[1,1],[7,1],[3,1],[3,0],[3,-4],[0,-2],[-2,-2],[1,-2],[3,-4],[6,-1],[2,0],[2,5],[5,5],[0,6],[-1,3],[-2,1],[1,6],[-3,-4],[0,3],[9,9],[2,3],[3,3],[6,12],[1,22],[1,4],[4,6],[1,2],[0,35],[1,9],[0,3],[2,14],[5,7],[8,7],[2,2],[26,8],[4,2],[5,5],[3,2],[8,0],[0,2],[5,0],[8,-4],[6,-4],[8,-1],[1,3],[-1,2],[-3,-1],[-2,3],[5,0],[2,3],[3,-2],[3,-7],[2,-3],[1,-13],[1,-2],[-1,-9],[-2,-7],[-1,-5],[-4,-9],[-5,-8],[-5,-15],[-1,-8],[0,-6],[1,-6],[-1,-2],[0,-2],[-2,0],[-2,-2],[-3,-9],[0,-2],[2,-2],[1,1],[5,0],[0,-4],[-2,-4],[-2,-1],[-2,-2],[-1,-2],[0,-5],[1,-1],[2,4],[1,0],[1,-2],[-3,-14],[-2,-14],[-2,-8],[-1,-12],[-2,-10],[-1,0],[-2,9],[-3,5],[1,12],[0,6],[-1,0],[-4,-6],[0,-5],[-2,-7],[0,-3]],[[9711,5519],[-1,2],[1,5],[1,-1],[-1,-6]],[[9751,5594],[4,-3],[4,2],[0,-1],[-3,-2],[-1,0],[-4,3],[0,1]],[[5598,7617],[1,-1],[4,2],[4,3],[4,-1],[7,3],[2,-2]],[[4683,5898],[0,4],[-2,3],[0,6],[1,8],[0,3],[1,7],[-2,3],[0,2],[-3,8],[0,4],[-2,7],[-1,1],[-3,1],[0,-2],[-2,-3],[-1,3],[0,5],[-2,4],[-3,7],[0,5],[2,3],[1,3],[0,2],[-1,4],[-1,2],[0,14],[-2,6],[-2,3],[-2,5],[1,7],[1,4],[-3,9]],[[4658,6036],[5,-3],[0,1],[2,2],[2,5],[2,6],[1,8],[0,6],[2,11],[5,8],[3,4],[1,-1],[2,-5],[6,-10],[6,-12],[1,0],[3,7],[2,7],[1,2],[3,0],[3,1],[2,-1],[4,-1],[4,-2],[5,0],[5,1],[5,2],[4,2],[0,9],[1,3],[1,0],[1,-8],[1,-2],[20,0],[17,0],[17,0],[17,0],[22,0],[12,0],[1,17],[2,15],[1,13],[-4,9],[-3,8],[-1,13],[-2,29],[0,14],[-1,15],[-2,28],[-1,15],[0,14],[-2,29],[-2,28],[0,15],[-2,28],[-2,29],[0,14],[-1,15],[-2,28],[-1,15],[0,14],[-3,43],[0,14],[-1,15],[-2,28],[-1,15],[0,14],[-1,13],[17,0],[22,0],[10,0]],[[5116,6286],[0,-42],[1,-16],[0,-18],[0,-48],[-1,-2],[-1,-9],[0,-13],[-2,-13],[-4,-18],[0,-5],[-2,-6],[0,-5],[-2,-5],[-3,-2],[-5,-9],[-1,-7],[-12,4],[-1,-1],[-1,-4],[-8,-1],[-8,0],[-9,-1],[-6,0],[-16,-2],[-5,-8],[-4,-8],[-1,-1],[-6,-1],[-8,1],[-4,0],[-2,-1],[0,-3]],[[5404,7248],[-1,-2],[-3,1],[-2,2],[0,7],[5,-6],[1,-2]],[[7726,5755],[-1,-3],[-1,0],[1,6],[2,4],[2,0],[0,-2],[-3,-5]],[[7727,5814],[2,-10],[-1,-2],[-1,6],[-2,3],[0,4],[1,1],[1,-2]],[[7736,5815],[-2,1],[2,6],[0,-7]],[[7727,5844],[-1,0],[1,6],[1,4],[1,-3],[-2,-7]],[[7736,5860],[0,-12],[-2,2],[-1,0],[-1,6],[0,2],[-1,4],[4,1],[1,-3]],[[7735,5869],[-1,0],[0,10],[2,-4],[2,-3],[-1,-2],[-2,-1]],[[7725,5883],[-2,1],[-1,4],[1,3],[2,-1],[-1,-3],[0,-2],[1,-2]],[[7723,5897],[0,-2],[-2,-4],[-2,3],[2,3],[2,0]],[[7732,5909],[1,-2],[1,0],[0,-5],[-2,-7],[-2,-1],[0,10],[-1,6],[1,4],[2,-2],[0,-3]],[[7730,5938],[0,-10],[-2,5],[0,10],[2,-5]],[[7623,6102],[-2,-6],[0,9],[3,4],[1,5],[2,3],[0,-4],[-1,-7],[-3,-4]],[[7709,6119],[-1,0],[-1,3],[-1,9],[2,2],[1,0],[1,-2],[0,-3],[-1,-9]],[[7601,6259],[-3,5],[-2,6],[3,1],[4,-1],[0,-3],[-1,-6],[-1,-2]],[[7602,6310],[3,-5],[1,0],[2,-3],[0,-3],[-1,-2],[-2,-2],[-2,1],[-1,6],[-2,2],[0,2],[1,3],[1,1]],[[7596,6329],[0,-8],[-2,3],[0,8],[2,-3]],[[7582,6331],[-1,-3],[-1,7],[1,3],[1,-7]],[[7780,6354],[-5,5],[-2,1],[-1,-3],[-3,-3],[-3,0],[-5,2],[1,-6],[1,-4],[-2,-4],[-1,-1],[-3,-1],[-3,2],[-2,0],[-3,-4],[-1,-11],[0,-3],[-2,-2],[-2,1],[-9,-5],[-4,-1],[-3,0],[-4,5],[-2,0],[-1,-1],[0,-6],[-2,-3],[-3,-8],[-1,-11],[1,-8],[-3,-8],[0,-3],[1,-18],[0,-2],[-2,-2],[-3,-1],[-2,-2],[-3,1],[0,-1],[2,-8],[2,-4],[2,1],[1,-1],[-1,-2],[1,-5],[2,-8],[1,-6],[-1,-6],[0,-3],[2,-5],[8,-18],[5,-13],[5,-10],[1,-5],[0,-9],[1,-5],[2,-4],[0,-3],[2,-11],[1,-2],[4,7],[1,-1],[1,-3],[0,-3],[-2,-7],[-7,-7],[0,-7],[-1,-9],[0,-12],[1,-9],[-1,-4],[-2,1],[-4,-5],[-1,0],[-2,-2],[-1,-2],[0,-3],[2,-19],[2,-7],[2,-6],[3,-7],[2,-7],[4,-7],[6,-10],[2,-6],[2,-8],[2,-6],[0,-12],[1,-16],[-2,-7],[0,-4],[2,-4],[0,-5],[1,-8],[2,-5],[2,-3],[1,-3],[0,-9],[1,-5],[1,-7],[1,-5],[3,-18],[0,-2],[-1,-4],[-3,-4],[-1,-3],[-2,-10],[-5,-16],[-5,-11],[-3,-7],[-3,-5],[-1,-3],[0,-18],[-2,-9]],[[7740,5770],[-1,0],[-2,-9],[-2,4],[0,15],[-1,18],[1,3],[1,1],[4,14],[0,9],[2,6],[-1,5],[0,6],[1,5],[0,4],[1,4],[2,3],[-1,1],[-1,3],[-3,-4],[-1,1],[-1,4],[1,4],[0,2],[1,3],[0,5],[-1,5],[1,5],[-2,0],[0,5],[2,3],[-2,5],[1,6],[0,17],[-2,8],[0,10],[-3,8],[-1,11],[-5,14],[0,12],[-1,3],[-2,-20],[-1,4],[0,11],[-1,5],[1,10],[-3,10],[-1,7],[-2,11],[1,3],[0,4],[-2,-2],[-1,7],[-1,19],[-1,7],[1,7],[-2,26],[-4,8],[2,13],[0,12],[1,4],[0,2],[-5,-2],[-3,0],[-2,9],[-3,12],[-1,10],[1,2],[-3,4],[-4,9],[-1,-1],[-2,-6],[2,-10],[-2,-6],[-1,-8],[-1,-4],[-4,-9],[-4,-3],[-2,0],[-4,5],[0,4],[-1,6],[-1,0],[1,-8],[0,-3],[2,-8],[0,-2],[-7,-4],[-1,-3],[0,-2],[-7,-4],[-2,-6],[-1,-5],[-3,-8],[-5,-7],[-1,0],[-1,2],[0,7],[2,6],[-1,3],[-4,-12],[-3,1],[-4,-2],[-1,10],[0,3],[-1,3],[-2,-7],[-4,-4],[0,10],[1,4],[0,6],[1,9],[-1,1],[-1,-6],[-2,-1],[-4,-12],[-4,-5],[-2,1],[0,6],[1,23],[2,3],[1,4],[1,13],[1,5],[1,10],[1,2],[2,8],[0,15],[-2,15],[-2,22],[-5,17],[0,6],[-2,7],[2,1],[-5,6],[0,3],[-1,14],[0,8],[-1,-1],[0,-5],[-2,-2],[1,-9],[0,-2],[-1,-3],[-4,3],[-2,4],[-6,20],[1,2],[1,0],[4,-8],[3,-2],[2,2],[2,4],[1,6],[-1,2],[-2,2],[-2,1],[-2,5],[0,5],[-4,4],[1,5],[2,3],[-4,0],[-6,9],[-3,0],[-3,-1],[2,-9],[-1,-2],[-1,0],[-4,13],[1,3],[-1,3],[1,9],[-4,-11],[-2,1],[-1,2],[2,5],[1,1],[-1,6],[-2,3],[-1,6],[-1,0],[1,-7],[-1,-9],[-3,10],[-6,15],[-2,4]],[[5536,7595],[-4,4],[-2,7],[-6,11],[-8,8],[1,3],[-4,-1]],[[5532,7691],[0,-3],[1,-2],[5,-6],[4,-8],[6,-6],[3,0],[2,-1],[6,-7],[5,-4],[0,-4]],[[7438,8015],[3,0],[2,1],[3,4],[1,3],[0,5],[2,4],[4,1],[5,0],[3,1],[1,-2],[4,-1],[1,2],[0,3],[1,1],[2,-4],[4,1],[2,2],[2,6],[1,-1],[3,0],[2,3],[5,3],[1,2],[-1,4],[0,5],[3,2],[6,2],[1,5],[1,2],[5,1],[8,6],[4,0],[2,2],[1,3],[2,1],[6,6],[5,1],[2,1],[3,0],[1,3],[2,3],[2,0],[1,3],[2,3],[3,1],[8,0],[3,1],[2,4],[0,2],[2,3],[2,-4],[6,-6],[3,1],[1,4],[2,1],[2,-1],[2,-7],[3,-3],[3,0],[2,1],[3,-1],[3,0],[8,-2],[8,0],[5,-1],[1,-2],[1,-6],[0,-6],[1,-5],[1,-2],[2,-1],[3,-5],[1,-3],[3,1],[6,0],[2,-2],[1,-3],[2,-2],[1,1],[6,0],[2,-2],[2,0],[1,2],[4,1],[3,3],[3,-1],[1,-2],[2,2],[6,-2],[2,-3],[2,-1],[3,2],[1,-2],[2,-1],[3,2],[8,-2],[3,-4],[1,-3],[2,-1],[4,0],[5,6],[2,4],[3,2],[4,0],[2,3],[2,1],[3,4],[0,1],[3,7],[2,12],[0,6],[-4,2],[-3,4],[-2,8],[0,4],[-4,8],[0,4],[3,9],[0,8],[2,2],[1,4],[2,2],[3,1],[2,7],[0,3],[2,2],[8,5],[3,6],[4,12],[2,-1],[2,-4],[1,0],[9,-6],[9,-3],[5,-7],[3,-1],[13,0],[6,-4],[11,-6],[3,-3],[5,-3],[5,1],[7,-3],[8,-4],[1,-2],[0,-12],[2,-8],[0,-8],[3,-6],[-1,-3],[0,-5],[1,-2],[4,-2],[2,-3],[6,-6],[3,-2],[8,-2],[4,-5],[4,-1],[5,-3],[5,2],[4,-1],[4,0],[3,1],[4,6],[4,2],[3,0],[3,2],[11,3],[5,4],[3,1],[9,-4],[5,0],[5,-5],[4,-1],[4,1],[6,0],[4,-1],[4,-3],[2,-3],[3,-7],[5,-5],[4,-1],[7,0],[8,-2],[1,-1],[0,-14],[2,-2],[2,-5],[4,-2],[5,-8],[3,-3],[3,-1],[3,1],[14,0],[6,-2],[2,-2],[19,-6],[3,3],[3,0],[6,-4],[5,1],[11,8],[3,3],[3,-1],[8,4],[3,0],[3,1],[4,0],[8,5],[4,1],[5,-1],[3,1],[7,5],[1,5],[2,6],[12,12],[4,3],[4,2],[5,6],[7,4],[2,-1],[5,-1],[5,0],[4,-3],[3,-3],[8,-11],[4,-3],[4,0],[4,-1],[2,2],[4,2],[6,4],[2,0],[9,-5],[4,-6]],[[9034,5999],[-2,-3],[-1,1],[0,2],[2,2],[1,-2]],[[9045,6046],[-1,-3],[-1,4],[0,2],[1,2],[1,-5]],[[9047,6055],[0,-2],[-2,1],[1,6],[2,0],[0,-3],[-1,-2]],[[9046,6124],[-2,1],[0,2],[2,0],[0,-3]],[[9048,6225],[0,4],[1,1],[1,-2],[-2,-3]],[[9046,6264],[-1,-2],[-1,1],[0,4],[2,-1],[0,-2]],[[5891,3637],[0,19],[-2,10],[0,7],[1,6],[-1,6],[-3,3]],[[5886,3688],[0,11],[1,8],[0,32],[0,40],[-2,8],[-1,12],[-2,8],[-3,9],[0,4],[-2,7],[-2,4],[0,11],[-2,16],[-1,11],[-2,12],[-2,8],[0,4]],[[5868,3893],[4,6],[9,18],[4,9],[3,8],[11,22],[1,1],[-2,9],[3,11],[0,16],[2,3],[3,6],[3,9],[3,8],[3,13],[1,3],[0,4],[-1,4],[-4,14],[-2,10],[2,8],[0,11],[-3,3],[-1,3],[0,5],[1,2],[4,4],[0,2],[1,2],[0,3],[2,16],[0,9],[-1,7],[0,18],[1,19],[0,11],[-3,12],[0,9],[2,6],[0,4],[-1,0],[-5,2],[-3,5],[-10,8],[-9,1],[-7,12],[-5,2],[-2,2],[-5,7],[-17,2],[-6,0],[-1,11],[0,9]],[[5843,4282],[0,8],[-1,9],[-1,4],[-2,6],[-1,6],[0,4],[7,6],[2,2],[4,3],[7,4],[6,3],[5,3],[6,4],[2,2],[10,7],[2,2],[6,3],[8,6],[18,12]],[[5921,4376],[1,-2],[4,-14],[4,-8],[3,-8],[2,2],[2,1],[6,2],[2,0],[1,2],[3,2],[4,0],[1,-1],[3,-10],[1,-7],[1,-11],[0,-13],[-1,-9],[-3,-10],[0,-5],[-2,-8],[-2,-4],[-1,-3],[0,-4],[1,-3],[3,-5],[1,-3],[-1,-3],[0,-4],[2,-4],[2,-3],[2,-6],[4,-8],[5,-11],[4,-4],[1,-4],[0,-4],[-2,-3],[2,-5],[1,-1],[4,0],[0,18],[-1,10],[-2,4],[0,4],[2,7],[1,7],[1,4],[1,1],[7,2],[3,2],[1,2],[1,6],[1,16],[0,15],[-1,9],[1,13],[2,9],[-1,1],[0,11],[-5,12],[-8,24],[-4,9],[-6,14],[-3,6],[-2,2],[-5,1],[-2,3],[-1,5],[0,8],[-1,6],[0,11],[-1,15],[-1,4],[-1,11],[-2,11],[0,3],[1,2],[2,8],[3,9],[1,8],[1,4],[1,2],[4,1],[4,-1]],[[5970,4516],[6,1],[8,-1],[1,-1],[2,0],[2,1],[2,3],[2,5],[3,0],[5,-5],[3,-4],[0,-4],[3,-2],[6,-1],[5,2],[2,5],[3,2],[3,0],[2,-1],[2,-4],[3,-2],[4,-1],[5,2],[5,5],[3,6],[0,6],[2,5],[3,0],[4,1],[4,-2],[5,-6],[3,4],[6,7],[5,3],[5,0],[4,3],[3,5],[4,3],[4,1],[8,8],[10,16],[3,5]],[[6123,4581],[1,-6],[3,-6],[-2,-3],[-1,-3],[3,-4],[-3,-5],[0,-4],[1,-2],[0,-2],[-1,-7],[-3,-8],[2,-7],[-1,-12],[2,-11],[0,-5],[1,-4],[-1,-7],[0,-11],[1,-5],[-1,-5],[1,-2],[1,-6],[0,-8],[-1,-3],[-3,-5],[0,-5],[4,0],[0,-13],[-1,-4],[1,-5],[-1,-5],[1,-4],[0,-18],[1,-16],[0,-3],[1,-2],[2,0],[0,-5],[-2,-6],[0,-8],[2,7],[2,0],[1,-3],[0,-19],[-1,-3],[-3,-5],[0,-7],[-2,-3],[1,-5],[0,-4],[-2,-12],[-7,-17],[-6,-12],[0,-5],[-3,-9],[-4,-2],[-2,-2],[2,-8],[-3,-2],[-3,-7],[-11,-12],[-2,-3],[-2,-7],[-4,-2],[-2,-2],[-4,-1],[-2,0],[-8,-7],[-7,-4],[-2,-4],[-6,-5],[-17,-19],[-6,-12],[-2,-3],[-1,-5],[0,-3],[-4,-10],[-6,-12],[-1,-4],[-3,-6],[0,-5],[-2,-1],[-2,4],[-1,-8],[-1,-1],[-2,2],[-4,-4],[-9,-15],[-8,-19],[-11,-18],[-3,0],[-4,6],[0,-3],[1,-3],[0,-16],[-1,-18],[0,-4],[2,-5],[3,-6],[3,-8],[3,-23],[1,-11],[4,-15],[0,-6],[1,-16],[0,-21],[2,-3],[0,8],[1,8],[1,3],[1,0],[0,-4],[1,-3],[0,-8],[-1,-16],[0,-6],[2,-11],[-2,-13],[-3,-30],[-1,-5],[1,-3],[2,0],[1,3],[1,0],[-1,-16],[-7,-21],[-3,-6],[-4,-7],[-11,-9],[-21,-15],[-14,-11],[-11,-13],[-4,-9],[-2,-10],[-4,-10],[3,-9],[4,-7],[2,8],[0,3],[1,0],[0,-10],[-2,-34]],[[5912,3637],[-3,0],[-5,-1],[-6,0],[-5,2],[-2,-1]],[[5961,4491],[0,2],[-1,1],[-2,-3],[1,-3],[2,0],[0,3]],[[5963,4486],[1,1],[0,4],[-2,1],[0,-7],[1,1]],[[4544,6318],[-2,-3],[-1,4],[3,8],[1,1],[-1,-10]],[[4658,6036],[-4,5],[-1,5],[-2,4],[-4,2],[-2,3],[-2,5],[-1,1],[0,6],[-2,6],[-2,3],[-1,0],[-2,2],[0,2],[-1,2],[-2,1],[-1,5],[-1,8],[-2,7],[-1,5],[-2,2],[-1,0],[0,3],[-2,0],[-1,-1],[-2,0],[-1,3],[-1,0],[-2,-2],[-1,0],[-2,4],[-1,3],[0,3],[-3,6],[-6,9],[-7,5],[-7,-1],[-4,1],[-1,1],[-1,-2],[-2,1],[-1,-1],[0,-2],[-2,-2],[-5,0],[-4,-1],[-3,-3],[-4,-1],[-5,0],[-3,1],[-2,2],[-3,-1],[-2,-4],[-1,-8],[-2,-5],[-1,-1],[-1,-7],[0,-10],[-1,-4]],[[4540,6096],[0,25],[2,19],[3,18],[4,16],[3,20],[2,20],[-1,19],[-1,17],[-2,11],[-1,17],[-3,9],[-5,7],[-1,5],[1,1],[3,1],[2,6],[-4,-2],[5,18],[1,12],[0,8],[1,5],[-4,11],[-2,14],[-3,3],[0,-3],[-1,-3],[-2,2],[-3,10],[-4,16],[-1,1],[-2,-4],[-2,-13]],[[4525,6382],[0,5],[2,14],[1,11],[22,0],[20,0],[19,0],[12,0],[13,0],[23,0],[0,30],[-1,8],[0,23],[-1,6],[0,4],[-1,7],[-1,4],[4,14],[4,5],[4,6],[3,5],[2,1],[5,1],[4,4],[6,5],[0,37],[0,31],[0,24],[0,23],[0,31],[10,0],[15,0],[16,0],[10,0],[16,0],[10,0],[16,0],[0,29],[0,45]],[[3273,6148],[0,-4],[-2,1],[0,3],[1,3],[1,-3]],[[6600,4003],[-3,-1],[-4,0],[-2,3],[1,3],[0,4],[1,6],[1,3],[2,2],[0,5],[2,3],[2,1],[3,-6],[1,-7],[0,-7],[-2,-2],[0,-4],[-2,-3]],[[5921,4376],[-1,4],[-2,-1],[-1,-3],[-2,0],[0,2],[-3,9],[-2,2],[-1,2],[1,1],[0,3],[-1,2],[-3,2],[0,2],[3,2],[2,5],[2,6],[1,6],[1,2],[0,13],[1,5],[-1,2],[-1,4],[1,6],[1,4],[6,4],[5,4],[1,2],[2,6],[-1,1],[-3,0],[-1,1],[-2,12],[1,13],[0,16],[-1,1],[-1,3],[0,7],[1,0],[2,9],[1,6],[-1,4],[-2,11],[2,5],[2,0],[1,1],[6,11],[0,2],[-1,4],[-2,6],[0,2],[-1,7],[-3,6],[-3,5],[1,5],[0,5],[-2,6],[-2,5],[0,3],[-1,1],[-2,0],[0,-2],[-3,1],[0,6],[-2,5],[0,1]],[[5913,4641],[2,1],[4,-6],[3,0],[3,-1],[2,-5],[2,-1],[1,1],[7,0],[3,-4],[2,0],[0,8],[1,2],[3,-2],[6,-11],[0,-2],[5,-11],[1,-4],[0,-3],[1,-10],[0,-10],[1,-4],[0,-2],[2,-11],[0,-4],[-1,-5],[-1,-7],[0,-5],[2,-6],[2,-3],[0,-4],[1,-2],[2,-1],[1,-2],[2,-9],[0,-2]],[[8093,5322],[-1,0],[-1,2],[-1,17],[1,2],[1,0],[1,-4],[-1,-7],[1,-7],[0,-3]],[[7894,5341],[-2,-1],[-1,3],[1,5],[1,1],[1,-6],[0,-2]],[[8267,5423],[0,5],[1,1],[2,-1],[3,-4]],[[7785,5488],[-1,-1],[-2,1],[0,9],[1,1],[2,-1],[1,-2],[-1,-7]],[[7772,5556],[2,-6],[-1,-3],[-1,0],[-3,-3],[-1,4],[-1,2],[0,3],[1,1],[2,-2],[2,3],[0,1]],[[7780,5554],[0,3],[1,9],[0,2],[3,0],[2,-7],[6,-5],[2,-1],[2,2],[1,-2],[2,-2],[0,-5],[2,-5],[3,1],[2,-1],[0,-5],[1,-7],[-1,-5],[-2,-6],[0,-4],[1,-3],[2,-3],[0,-2],[1,0],[2,2],[1,4],[0,3],[5,3],[4,4],[1,-2],[1,-5],[1,-1],[3,0],[3,3],[1,5],[0,4],[4,6],[0,6],[1,3]],[[7835,5543],[5,-2],[1,-2],[6,-18],[7,-13],[3,-4],[2,-2],[4,-7],[2,-9],[6,-23],[1,-11],[1,-16],[-1,-24],[-2,-12],[0,-5],[2,-9],[0,-34],[1,-5],[2,-4],[7,-11],[1,-4],[4,-14],[7,-31],[2,-14],[-1,-4],[0,-2],[-3,-1],[-2,5],[0,4],[-2,3],[-1,-7],[-2,0],[-2,1],[-4,-1],[-4,-7],[-2,0],[-1,6],[-1,4],[-1,2],[-13,15],[-5,3],[-5,11],[-11,12],[-7,11],[-3,8],[-7,6],[-3,7],[-4,4],[2,8],[-1,7],[0,7],[-6,12],[-2,9],[-5,9],[-2,5],[-2,6],[3,3],[-1,4],[-3,8],[-1,8],[0,16],[-4,23],[-4,31],[1,11],[-1,12],[-2,11],[-3,9],[-1,6]],[[8044,5300],[2,-8],[0,-2],[4,-5],[4,-3],[3,-1],[6,0],[1,1],[9,-10],[3,-1],[3,1],[1,-1],[5,-7],[1,-1],[2,1],[-3,3],[-1,2],[-1,4],[0,4],[2,3],[1,3],[1,10],[2,9],[0,5],[-1,3],[-1,6],[2,8],[1,-3],[2,-2],[2,1],[1,3],[-1,4],[0,8],[2,6],[3,5],[3,2],[11,3],[17,9],[5,4],[2,1],[2,3],[2,8],[5,12],[4,11],[7,15],[6,14],[1,2],[1,8],[0,7],[2,3]],[[8197,5466],[7,1],[1,3],[3,4],[1,3],[0,5],[-3,4],[-1,4],[0,5],[4,9],[3,-2],[3,0],[2,5],[2,6],[4,9],[2,14],[10,23],[1,3],[6,23],[2,-1],[1,-7],[-2,-8],[0,-5],[3,3],[3,8],[3,10],[4,-3],[-1,-5],[1,-3],[1,-6],[2,-4],[4,-2],[3,-4],[1,-2],[0,-3],[1,-4],[0,-4],[-2,-5],[1,-7],[0,-4],[-1,-4],[5,0],[3,2],[3,5],[3,-11],[-2,-2],[-4,-3],[2,-4],[1,0],[3,3],[3,4],[2,0],[6,-6],[1,-2],[1,-6],[3,-2],[8,-8],[2,0],[3,1],[1,-1],[2,-6],[0,-4],[-2,-5],[-2,-3],[-6,-4],[-7,-4],[-3,0],[-5,3],[-2,0],[-1,-1],[-2,-10],[3,-9],[7,-9],[1,-3],[0,-3],[-1,-1],[-5,-3],[-4,-1],[-6,-4],[-3,1],[-5,4],[-1,0],[-1,-2],[-2,-6],[0,-1]],[[8253,5596],[-2,-3],[-1,4],[0,4],[3,5],[3,1],[0,-8],[-1,-2],[-2,-1]],[[5554,3756],[0,-24],[0,-26],[0,-25],[0,-26],[0,-25],[0,-26],[0,-26],[0,-33],[-3,0],[-6,-3],[-3,-5],[-2,-5],[-2,-3],[-3,-1],[-1,-2],[1,-4],[-1,-3],[-3,-3],[-4,1],[-5,3],[-6,1],[-8,-2],[-6,1],[-4,4],[-3,2],[-4,0],[-7,4],[-1,5],[-2,7],[0,3],[1,2],[0,3],[-1,5],[-1,2],[-2,0],[-1,2],[-2,7],[-2,3],[-4,-2],[-2,-9],[-2,-7],[0,-3],[-1,-4],[-1,0],[-6,-6],[-1,-3]],[[5456,3535],[-3,5],[-9,17],[-4,5],[-4,11],[-11,33],[-1,6],[-2,16],[-3,12],[0,7],[1,4],[-2,10],[-3,6],[-1,21],[-3,14],[1,11],[-1,10],[0,18],[-2,15],[-4,13],[-3,20],[-1,9],[1,24],[-1,9],[0,11],[-1,12],[-1,6],[1,5],[2,-2],[0,13],[-1,14],[-4,15],[-10,25],[-2,9],[-2,7],[-10,33],[-5,22],[-3,20],[-4,9],[-16,63],[-4,10],[-8,16],[-2,12],[-5,15],[-1,15],[0,29]],[[5648,4167],[6,3],[6,2],[7,2],[5,2],[1,0],[13,-2],[5,-1],[5,-5],[5,-10]],[[9653,3880],[-2,-2],[-2,3],[1,4],[2,-2],[1,-3]],[[9666,3949],[3,-1],[0,-10],[-5,-1],[0,2],[-2,1],[0,4],[-2,7],[3,1],[2,2],[0,-4],[1,-1]],[[9649,3964],[-2,0],[-2,4],[-4,2],[-2,4],[-1,4],[3,1],[2,6],[-4,3],[0,2],[4,3],[3,-4],[0,-9],[3,-9],[0,-7]],[[9625,3991],[-2,0],[2,5],[0,3],[1,6],[0,3],[2,-3],[-2,-4],[0,-3],[1,-1],[-2,-6]],[[9560,4017],[3,-3],[3,1],[4,-6],[11,-17],[4,-4],[2,-1],[2,-3],[1,-4],[3,-5],[1,-6],[4,-6],[2,-5],[3,-2],[5,-8],[3,-2],[7,-9],[5,-8],[3,-6],[6,-8],[4,-4],[2,-10],[-1,-3],[-2,-2],[-2,0],[-2,-2],[-7,8],[-1,-1],[-2,4],[-3,2],[-3,4],[-3,8],[-4,2],[-3,4],[-2,4],[-4,3],[-5,6],[-3,2],[-2,3],[-7,12],[-2,2],[-2,5],[-6,12],[-2,5],[-3,5],[-4,11],[-4,9],[-1,3],[0,7],[-2,1],[-1,3],[0,3],[1,2],[4,-6]],[[5377,5973],[-5,-1],[-3,-1],[-4,-6],[-4,-2],[-4,-5],[-7,-7],[-4,-8],[-1,-6],[-4,-1],[-5,1],[-4,6],[-8,6],[-6,3],[-2,0],[-13,1],[-13,-2],[-7,-3],[-1,0],[-4,-4],[-3,-4],[-9,-19],[-11,1],[-7,2],[-6,3],[-8,9],[-10,13],[-4,2],[-5,1],[-12,-14],[-2,1],[-3,-2],[-3,-5],[-3,1],[-2,2],[-2,3],[-6,18],[-2,4],[-4,7],[-3,4],[-2,-1],[-10,6],[-9,6],[-3,0],[-1,-2],[-3,-4],[-4,-1],[-5,0],[-3,1],[-4,-2],[-7,-5],[-5,-8],[-2,-1],[-1,-2],[-1,-23],[-2,-7],[-2,-9],[-5,-9],[-4,-5],[0,-35],[-1,-2],[1,-3],[0,-2],[1,-2],[-2,-4]],[[5415,6508],[3,-33],[2,-29],[1,-18],[0,-5],[1,-3],[2,-3],[8,-27],[-1,-4],[1,-8],[2,-4],[7,-16],[1,-5],[-6,-23],[-1,-24],[-1,-16],[-1,-23],[-1,-28],[-1,-23],[-1,-30],[-1,-29],[-7,-16],[-13,-28],[-11,-23],[-5,-15],[-11,-30],[-4,-19],[-4,-10],[-1,-4],[1,-15],[3,-24]],[[9664,3512],[1,-3],[-2,0],[0,3],[1,0]],[[5202,5438],[-3,-2],[-2,0],[3,8],[1,-2],[2,0],[-1,-4]],[[5377,5973],[4,-13],[5,-13],[4,-10]],[[5237,5457],[-1,0],[-1,-2],[-2,2],[-1,4],[-1,0],[-3,5],[2,-15],[-1,-5],[-7,0],[-6,-2],[-5,0],[-2,2],[-1,2],[-2,-2],[-5,-1],[-5,10],[0,-2],[2,-4],[0,-6],[-4,-6],[-3,-1],[-1,3],[-1,5],[0,7],[-1,4],[-1,0],[0,-4],[1,-3],[0,-7],[2,-6],[-3,-2],[-4,0],[0,2],[-1,5],[-1,-7],[-3,0],[-4,-2],[-1,1],[-1,4],[-1,-5],[-1,-1],[-2,0],[-3,3],[-5,7],[-6,11],[-2,11],[-2,6],[-1,11],[0,2],[-1,2],[0,8],[4,2],[1,3],[0,3],[-4,-5],[-5,5],[-1,3],[1,2],[2,1],[3,-1],[-1,3],[-2,1],[-3,-2],[-2,2],[0,5],[-2,4],[-5,13],[-6,11],[-6,8],[-8,4],[-18,-1],[-1,1],[2,3],[-1,3],[-2,0],[-2,-7],[-16,-1],[-2,-1]],[[2617,5820],[0,2],[-2,6],[-4,8],[-14,23],[-5,14],[-3,10],[-2,6],[-8,10],[-2,5],[-7,14],[-6,9],[0,3],[2,5],[1,-1],[4,-6],[2,1],[0,2]],[[2689,6047],[0,-2],[-1,-2],[-2,-7],[-1,0],[0,5],[-1,1],[-2,-5],[1,-3],[2,-1],[3,-24],[0,-4],[-4,-12],[-2,-4],[-2,-14],[-2,-24],[1,-22],[0,-31],[-2,-1],[-1,4],[0,3],[2,9],[-1,3],[-1,-6],[-1,-3],[-1,-1],[-1,-3],[1,-5],[2,-7],[-1,-3],[0,-12],[-1,0],[0,2],[-2,0],[0,-7],[-1,-2],[0,-3],[2,-2],[1,0],[2,-10],[-3,-4],[-2,-8],[-1,-5],[0,-3],[1,-10],[1,-7],[2,-4],[2,-1]],[[283,4084],[-3,-3],[-1,4],[1,4],[1,2],[1,0],[1,-5],[0,-2]],[[5092,8143],[7,1],[3,-2],[5,-1],[3,3],[3,-2],[3,1]],[[5109,8163],[3,-5],[-3,-1],[-4,4],[-2,-1],[-1,3],[2,1],[5,-1]],[[5135,8240],[-3,-4],[-2,1],[1,4],[4,6],[0,-7]],[[5165,8106],[-6,1],[-2,1]],[[5116,8143],[-6,3],[-5,-2],[-3,3],[-3,0],[-4,5],[3,3],[5,0],[4,-1],[7,-7],[4,1],[-1,2],[-5,3],[-2,2],[4,2],[0,3],[-5,8],[1,2],[2,8],[2,1],[7,11],[3,6],[2,8],[3,21],[2,8],[4,-2],[5,3],[8,8],[2,6],[3,3],[9,7],[5,1],[14,2],[7,0],[7,-8],[4,-1]],[[5147,8258],[6,4],[1,-1],[-7,-3]],[[5164,8262],[-8,0],[0,1],[8,0],[0,-1]],[[5140,8657],[0,-7],[-2,1],[-2,4],[1,4],[-1,4],[2,2],[2,-8]],[[5137,8702],[-3,-1],[-2,1],[1,5],[3,1],[1,-6]],[[5224,8831],[-6,1],[-2,4],[3,2],[4,1],[2,-2],[-1,-6]],[[5234,8850],[-3,0],[-2,2],[12,5],[3,-1],[-1,-3],[-9,-3]],[[5311,8919],[-2,-1],[-3,1],[-6,-1],[-3,2],[2,3],[6,3],[3,0],[3,-4],[0,-3]],[[5331,8963],[-5,-1],[1,5],[5,1],[-1,-5]],[[5346,8979],[-2,2],[4,4],[5,0],[1,-1],[-8,-5]],[[5344,8987],[-3,0],[6,10],[3,-2],[0,-3],[-2,-3],[-4,-2]],[[5359,9093],[-2,2],[2,6],[4,2],[0,-6],[-4,-4]],[[5384,9115],[2,-1],[4,1],[1,-2],[-2,-2],[-4,-1],[-3,-4],[-4,0],[-7,-5],[-5,-1],[0,5],[2,4],[4,0],[3,5],[4,2],[5,-1]],[[5421,9154],[4,-5],[2,-4],[-2,-6],[-3,-4],[-9,0],[-5,4],[-6,-3],[-3,2],[-1,3],[4,3],[1,3],[7,-1],[2,7],[5,-2],[0,7],[4,-1],[0,-3]],[[5437,9132],[4,5],[4,2],[2,4],[1,6],[5,1],[4,-4],[2,-5],[-1,-5],[-9,-5],[-4,-4],[-2,-4],[-2,-1],[-4,2],[-2,-4],[-7,-2],[-3,1],[0,3],[-2,0],[-2,-4],[-4,-2],[-3,2],[-9,-7],[-7,-1],[-3,1],[0,4],[9,8],[14,2],[9,10],[2,11],[2,4],[-1,3],[-2,0],[1,7],[7,7],[4,7],[5,1],[2,-2],[0,-3],[-4,-6],[-5,-5],[3,-7],[0,-10],[-3,-6],[-1,-4]],[[5485,9192],[3,-3],[5,1],[4,-3],[2,0],[2,-7],[-4,-3],[1,-8],[-5,-2],[-6,0],[-2,2],[-5,-4],[-4,-6],[-6,3],[-4,0],[4,4],[1,3],[-1,5],[3,7],[8,-1],[1,3],[-4,2],[0,2],[6,1],[1,4]],[[5831,9203],[-5,-1],[-1,1],[3,7],[2,0],[4,-4],[-3,-3]],[[5576,9220],[-4,-2],[-5,2],[-1,4],[2,3],[8,1],[1,-1],[-1,-7]],[[5534,9219],[2,-3],[5,2],[3,-2],[-1,-3],[-4,-3],[-3,-5],[-6,-1],[-6,-6],[-3,-4],[0,-3],[-14,-3],[-4,2],[-2,4],[4,0],[0,3],[3,2],[2,4],[3,-1],[2,2],[3,-1],[0,6],[4,4],[1,3],[6,4],[-1,5],[2,4],[3,0],[1,-4],[0,-6]],[[5548,9228],[4,-1],[2,-3],[3,-1],[0,-2],[-5,-2],[-4,1],[-5,11],[3,0],[2,-3]],[[5655,9247],[1,-5],[-9,-8],[-5,-3],[-1,5],[-5,1],[0,4],[6,4],[3,-1],[8,7],[2,-4]],[[5666,9248],[-5,-2],[-5,4],[1,7],[2,1],[2,-2],[7,-3],[-2,-5]],[[5650,9262],[0,-2],[-4,-3],[-6,-8],[-7,-3],[-5,1],[-2,-2],[-6,0],[-5,3],[-5,5],[10,0],[2,3],[4,-1],[8,2],[3,-1],[7,6],[5,2],[1,-2]],[[5856,9203],[2,-8],[0,-3],[-4,-4],[-5,0],[-6,3],[-4,3],[-3,-10],[-4,-4],[-4,-2],[-13,-3],[-5,-12],[-2,-3],[-4,-1]],[[5572,9160],[-14,-1],[6,-7],[-1,-9],[-4,-8],[-5,-4],[7,-4],[-5,-5],[-5,-1],[-17,6],[-11,2],[-3,0],[-11,3],[-6,-2],[0,-12],[1,-6],[-3,-7],[-4,-7],[-17,8],[-4,-4],[-11,-8],[-5,-15],[-4,-5],[-7,-3],[-2,-4],[6,-10],[2,-6],[0,-5],[-5,-5],[-10,-12],[-9,-12],[-4,-4],[2,-11],[-3,-3],[-9,-5],[-4,0],[-10,-2],[2,-11],[0,-8],[-2,-9],[-2,-19],[-3,-8],[-12,-22],[-8,-12],[6,-4],[6,-3],[2,-11],[0,-5],[-2,-5],[-3,-5],[-8,2],[-11,2],[-8,-1],[-6,-3],[-7,-9],[-6,-10],[-4,-5],[1,-6],[-6,-11],[4,-12],[2,-5],[-3,-5],[1,-5],[0,-10],[-1,-4],[6,-17],[-2,-18],[-2,-15],[3,-4],[9,-6],[4,-6],[4,-5],[-4,-14],[-2,-4],[-6,0],[-5,-2],[1,-6],[4,-12],[3,-8],[1,-6],[-2,-8],[0,-4],[-1,-8],[-3,-3],[-3,-5],[-3,-3],[-5,-1],[-2,-2],[-2,-9],[-5,-6],[1,-2],[1,-8],[2,-8],[-2,-7],[-1,-8],[-2,-6],[-2,-2],[-2,1],[-3,8]],[[5315,8584],[0,4],[-15,4],[-6,14],[0,15],[-2,1],[1,-7],[-5,-3],[0,-4],[1,-1],[0,-9],[-5,-13],[-2,-1],[0,-2],[-3,1],[-3,-3],[-4,-1],[-1,4],[-4,5],[-1,-2],[2,-4],[-2,-4],[-2,0],[-6,-5],[2,-3],[-2,-3],[-2,0],[-2,-2],[0,-2],[-7,-6],[-11,-16],[-6,-4],[-4,-5],[-4,0],[-4,-3],[-12,-4],[-7,2],[-5,-2],[-3,3],[-1,5],[-3,-1],[-1,-4],[-5,3],[3,6],[0,2],[-8,0],[-9,7],[-2,3],[-7,5],[-4,6],[-2,6],[0,5],[1,9],[2,2],[7,-3],[6,-5],[1,0],[3,4],[4,4],[-1,1],[-7,-4],[-5,6],[0,2],[2,5],[-1,3],[0,4],[3,4],[4,4],[-1,3],[-4,-5],[-5,-3],[-3,-1],[-4,-3],[-3,-5],[-3,-2],[-5,0],[-1,4],[1,13],[2,6],[1,5],[3,0],[2,4],[2,0],[1,-2],[5,-1],[3,4],[3,0],[7,5],[0,1],[-5,-1],[-6,-2],[-2,1],[-1,3],[2,3],[6,7],[2,3],[2,9],[5,7],[5,3],[2,-3],[2,0],[4,5],[0,3],[-13,-5],[-5,-4],[-7,-11],[-1,-5],[-2,-2],[-3,-1],[-4,-6],[-1,-5],[-8,-8],[-2,-3],[-1,2],[0,10],[2,4],[1,4],[-1,4],[1,2],[4,-1],[4,0],[5,3],[-1,2],[-7,0],[-3,3],[-3,6],[-1,8],[1,2],[10,8],[-3,0],[-5,-3],[-4,4],[-2,4],[-1,9],[1,4],[-1,6],[3,2],[2,-1],[9,0],[13,4],[9,-3],[9,4],[4,0],[4,-2],[2,-3],[0,-4],[1,-2],[2,1],[-1,3],[0,4],[14,5],[1,2],[-5,1],[-2,4],[-2,-1],[1,-4],[-1,-2],[-3,-1],[-6,0],[-4,2],[-4,1],[-2,4],[-3,-7],[-3,-1],[-8,1],[-12,-1],[-6,-2],[-3,0],[-9,8],[0,11],[7,1],[2,2],[-4,3],[-2,5],[-3,1],[-2,4],[-1,5],[2,6],[4,-1],[10,0],[9,-4],[6,-2],[13,1],[7,4],[-1,1],[-8,-2],[-8,0],[-13,4],[-5,1],[-6,0],[-3,1],[-1,4],[1,8],[3,1],[3,-2],[5,9],[5,4],[7,2],[3,-3],[3,0],[11,3],[-4,2],[-5,-2],[-4,0],[0,2],[3,4],[1,4],[2,2],[8,0],[3,1],[15,-2],[6,-3],[6,2],[-5,2],[0,3],[8,3],[8,1],[-2,2],[-17,-4],[-5,3],[-3,0],[-3,-2],[-7,-1],[-1,1],[1,4],[7,10],[10,3],[5,5],[8,0],[7,-1],[3,-5],[4,2],[-3,3],[-2,4],[0,5],[3,3],[8,1],[2,2],[-1,5],[-3,-1],[-3,2],[-1,3],[1,2],[5,4],[8,2],[8,-3],[-2,-7],[2,-1],[5,7],[5,1],[5,2],[4,-6],[3,-2],[1,-5],[3,2],[7,2],[7,-1],[5,1],[-3,5],[3,6],[5,2],[5,1],[3,3],[4,2],[-2,4],[-4,2],[8,6],[-4,2],[-3,-1],[-8,-6],[4,-4],[-3,-5],[-17,-11],[-8,-3],[-3,0],[-1,3],[-4,7],[-5,-1],[1,7],[3,4],[4,3],[4,9],[6,6],[9,14],[8,4],[3,5],[4,2],[4,4],[3,0],[5,3],[3,4],[-2,1],[-7,-4],[1,9],[4,4],[19,11],[2,-1],[2,-4],[5,1],[7,7],[-1,3],[-5,-5],[-5,0],[0,3],[-4,0],[-2,2],[0,5],[4,12],[10,14],[1,5],[4,3],[5,-1],[1,1],[-2,4],[-5,3],[0,2],[17,4],[8,0],[2,3],[5,1],[3,3],[-2,1],[-8,-2],[-9,-3],[-7,0],[-1,12],[1,6],[2,0],[1,6],[3,3],[4,1],[4,5],[5,-1],[4,2],[-6,2],[-2,3],[2,2],[5,1],[3,7],[3,2],[3,0],[3,3],[4,-1],[8,3],[18,0],[1,3],[-17,1],[-7,0],[-3,-1],[-1,3],[3,2],[1,3],[5,6],[6,4],[4,-1],[5,-4],[3,0],[2,-2],[3,0],[3,4],[-1,2],[-5,-2],[-4,2],[-3,6],[3,5],[-1,1],[-7,-4],[-7,-1],[1,5],[-1,3],[7,8],[6,1],[4,-3],[6,2],[-1,2],[-6,1],[-2,4],[5,2],[5,3],[5,1],[5,3],[1,-1],[2,-10],[4,-9],[1,0],[-1,7],[3,4],[-3,4],[-3,8],[1,2],[5,4],[7,1],[6,-3],[7,1],[13,5],[-4,2],[-6,-2],[-17,1],[-2,1],[0,3],[4,5],[6,3],[7,1],[7,6],[3,5],[1,7],[5,5],[11,4],[-1,9],[3,7],[3,2],[5,-6],[5,-3],[6,0],[1,1],[-4,2],[-4,4],[0,3],[2,2],[5,0],[4,3],[0,3],[5,7],[14,3],[1,-1],[-1,-10],[-2,-6],[3,0],[6,18],[3,3],[8,4],[1,-4],[-1,-15],[-2,-5],[-6,-10],[4,1],[8,10],[7,-1],[-5,6],[-1,3],[1,10],[2,3],[9,0],[6,-1],[2,6],[5,1],[15,-10],[-2,9],[-2,4],[-6,2],[-6,4],[-1,4],[5,1],[7,-2],[6,4],[2,-1],[4,2],[3,-3],[2,1],[1,4],[7,2],[5,-2],[2,-2],[3,-12],[6,-6],[3,-1],[1,2],[-3,3],[1,8],[1,2],[8,9],[7,5],[4,0],[7,10],[3,3],[0,2],[-4,2],[0,3],[5,4],[6,6],[3,0],[8,-4],[3,-4],[4,-1],[3,4],[4,-1],[2,-2],[4,-1],[0,-2],[-3,-2],[-6,-6],[-5,-7],[-2,-4],[-2,-9],[-4,-6],[0,-5],[2,-2],[4,2],[6,6],[1,6],[15,16],[7,9],[7,8],[5,1],[2,-5],[-2,-6],[-3,-4],[2,-2],[0,-5],[-2,-8],[3,0],[9,6],[4,9],[1,4],[4,3],[6,0],[0,2],[-8,5],[-1,2],[3,3],[8,5],[6,-2],[9,-1],[7,-4],[-1,-6],[-3,-4],[-9,-4],[-1,-3],[3,-1],[6,3],[1,-2],[-2,-6],[0,-7],[3,0],[4,3],[1,7],[4,8],[4,5],[2,1],[7,0],[4,-2],[2,-4],[3,-2],[6,-1],[5,-4],[7,4],[5,-5],[-1,-5],[6,1],[5,-2],[9,-7],[1,-3],[-1,-4],[-13,-4],[-5,-5],[-10,-1],[-32,3],[1,-3],[22,-7],[1,-2],[0,-9],[2,-3],[8,0],[3,-1],[2,2],[0,5],[5,0],[1,-6],[3,3],[10,0]],[[5710,9281],[7,-2],[3,0],[5,-6],[-4,-2],[-11,0],[-3,3],[-5,2],[8,5]],[[9635,5154],[1,1],[1,-1],[0,-2],[-1,0],[-1,0],[0,1],[0,1]],[[9698,2160],[1,-3],[-2,-2],[-3,3],[4,2]],[[9616,2260],[0,-5],[-4,1],[-2,3],[-1,-3],[-2,0],[0,3],[5,5],[1,6],[-1,2],[4,1],[1,-3],[-2,-2],[1,-5],[-1,-1],[1,-2]],[[9669,2484],[0,-2],[-3,1],[0,-3],[3,-1],[1,-2],[2,0],[0,-5],[-2,-2],[-4,-1],[-3,-3],[-4,0],[-3,-4],[-4,-1],[0,4],[3,3],[0,3],[1,3],[2,1],[0,4],[2,3],[-1,6],[0,5],[5,1],[5,-10]],[[9630,2554],[0,-5],[-4,2],[-2,0],[1,3],[4,2],[1,-2]],[[9637,2581],[1,-7],[-2,1],[-2,3],[2,3],[1,0]],[[106,2630],[-2,0],[1,3],[-1,2],[2,1],[1,-2],[-1,-4]],[[106,2664],[-1,-2],[-2,1],[-3,-2],[-1,2],[-2,-6],[1,-5],[2,0],[1,-6],[-3,-1],[-2,-3],[-2,1],[-1,6],[2,3],[1,3],[-3,4],[-5,-1],[-1,1],[2,4],[3,-1],[3,3],[11,-1]],[[9829,2830],[-3,-4],[0,3],[1,5],[1,2],[3,2],[0,-4],[-2,-4]],[[9807,2806],[3,-1],[3,5],[3,3],[4,3],[5,6],[5,4],[2,0],[-1,-3],[-2,-2],[0,-3],[-1,-3],[0,-4],[1,-3],[1,3],[-1,2],[4,5],[-1,4],[3,-1],[3,2],[0,-3],[2,1],[-2,-6],[-3,-6],[1,-2],[4,5],[2,-1],[-4,-7],[-3,-3],[-1,-4],[0,-4],[2,-4],[-2,-6],[3,1],[3,-5],[-1,-4],[-10,-18],[0,-5],[-2,-3],[-7,-12],[-1,-3],[-5,-18],[-4,-8],[-2,-3],[-7,-6],[-2,-4],[-3,-3],[-2,-1],[0,-2],[3,-3],[-3,-4],[3,-2],[0,-3],[2,-6],[7,-3],[1,-2],[0,-8],[-1,-2],[-4,-1],[-3,1],[-2,4],[-5,-1],[1,3],[-3,3],[-2,-1],[-1,-2],[0,-3],[-1,-2],[-4,2],[-2,0],[1,-4],[-2,-3],[-3,-2],[-3,-1],[-6,-7],[-4,0],[-2,-1],[-2,-7],[-2,-2],[-2,-13],[-1,-5],[0,-9],[-1,-9],[-1,-3],[0,-4],[-4,-6],[-5,-22],[-3,-9],[0,-2],[3,-4],[0,-3],[-2,-2],[-9,-4],[-2,-3],[-4,-9],[-8,-10],[-6,-13],[-10,-4],[-6,-1],[-4,1],[-6,3],[-5,-2],[-3,1],[-2,-1],[-2,3],[1,4],[-3,6],[-2,1],[-9,0],[-5,10],[-5,2],[-3,-5],[-8,-1],[-10,3],[-1,4],[1,5],[-2,0],[2,5],[0,4],[-3,-4],[-4,0],[0,7],[1,2],[9,2],[3,1],[2,2],[-6,1],[0,3],[2,6],[-4,0],[0,4],[1,4],[4,0],[-1,2],[0,3],[1,1],[4,-5],[3,-1],[-1,3],[0,5],[-3,3],[0,5],[3,4],[2,1],[-1,3],[7,9],[1,-7],[1,2],[0,3],[-1,4],[1,2],[2,1],[6,9],[2,0],[0,5],[10,16],[4,8],[3,3],[5,4],[5,-2],[7,8],[3,-3],[-1,5],[1,3],[9,9],[4,2],[3,3],[2,0],[0,4],[1,2],[4,4],[4,6],[2,5],[4,6],[2,1],[3,-1],[-1,3],[6,5],[3,4],[4,8],[1,1],[6,13],[2,1],[-1,3],[1,6],[0,6],[2,7],[3,16],[1,2],[6,2],[3,4],[5,12],[2,14],[1,15],[4,11],[5,8],[5,6],[2,1],[3,0],[-2,-3],[-1,-4],[0,-3],[2,-6],[2,-3],[4,-1],[2,-14],[0,-6],[1,-5]],[[9875,3094],[0,-3],[-2,1],[-1,2],[-3,3],[0,5],[2,4],[1,-3],[2,-3],[1,-6]],[[9812,3171],[0,-3],[2,2],[1,3],[2,-3],[6,-3],[3,-4],[2,3],[7,-7],[0,-7],[2,-2],[3,3],[1,0],[2,-7],[0,-2],[2,-3],[2,-7],[0,-3],[-1,-2],[2,-7],[-5,1],[0,-2],[2,-5],[2,-7],[2,-4],[5,-13],[-1,-5],[0,-6],[2,-7],[-2,-2],[0,-7],[-1,-1],[0,-3],[2,0],[3,-4],[0,3],[1,1],[3,-4],[7,-4],[1,-3],[0,-7],[1,-3],[5,1],[0,8],[-2,11],[0,3],[1,4],[-3,9],[-1,2],[2,4],[2,-6],[5,-9],[2,0],[0,-4],[2,-4],[1,-4],[1,-15],[2,-13],[4,-6],[0,-3],[-2,2],[-1,-2],[2,-3],[6,-2],[8,-9],[5,-3],[11,-6],[5,0],[3,2],[3,3],[4,12],[3,2],[2,3],[3,3],[8,0],[2,-3],[5,-5],[-3,-9],[-1,-6],[-2,-28],[-4,-11],[-3,-3],[-3,-2],[-2,-17],[2,-4],[0,-3],[-2,-6],[-1,1],[-1,5],[-1,2],[-7,2],[-4,-1],[-3,-2],[-6,-6],[-3,-8],[-1,-7],[0,-4],[1,-3],[4,-4],[-4,-14],[-3,-14],[-4,-8],[-3,-8],[-3,-7],[-3,-6],[-9,-27],[-2,-5],[-4,-6],[-4,-5],[-7,-7],[-2,-3],[-2,-1],[-3,4],[0,5],[-1,2],[-3,1],[-5,-2],[0,9],[-3,-3],[-3,0],[-1,2],[6,13],[5,13],[4,13],[3,19],[-2,5],[-1,5],[-4,9],[-6,5],[-3,1],[-3,2],[-4,5],[-2,5],[-12,8],[-3,4],[-2,7],[0,3],[1,5],[8,8],[7,4],[2,0],[2,2],[3,5],[0,3],[2,21],[2,12],[3,11],[-1,8],[2,4],[2,1],[-3,7],[-2,10],[-1,3],[1,3],[0,4],[-2,0],[0,3],[-3,11],[2,0],[2,-7],[2,6],[4,1],[-4,8],[-2,0],[-3,-2],[-4,3],[-1,3],[-1,7],[-1,2],[-5,13],[2,1],[4,-7],[1,2],[0,7],[-2,4],[0,3],[1,5],[-3,4],[-1,0],[1,-4],[-1,-1],[-6,8],[-1,-2],[4,-8],[0,-5],[-1,-1],[-2,2],[-1,7],[-2,4],[-14,36],[1,5],[4,6],[0,2],[-2,-1],[-4,-8],[-3,4],[0,4],[-2,0],[-1,5],[-2,3],[2,4],[0,6],[-4,13],[-5,10],[-4,10],[5,1],[4,0],[-2,-6],[1,-3],[2,-3],[3,-10],[0,-2],[3,-5]],[[6630,6348],[-2,-1],[0,8],[4,9],[3,10],[1,-9],[-3,-5],[-2,-9],[-1,-3]],[[6473,6142],[-1,8],[-2,7],[-2,8],[-1,8],[-1,5],[-2,2],[-2,5],[-3,18],[-2,5],[-3,18],[-1,5],[-2,6],[-2,12],[-1,5],[-2,6],[-3,17]],[[6443,6277],[8,6],[5,4],[10,6],[4,4],[10,6],[5,4],[5,3],[4,3],[5,3],[5,4],[5,3],[9,7],[8,5],[1,8],[2,12],[3,20],[2,12],[3,19],[3,20],[2,12],[2,13],[-1,5],[-3,8],[-4,15],[-2,5],[-2,7]],[[6565,6622],[3,-15],[4,-14],[4,-8],[4,-11],[6,-9],[2,-4],[11,-7],[14,-5],[6,-5],[7,1],[5,-7],[2,-7],[2,-4],[4,-11],[4,-10],[3,-10],[7,-12],[8,-4],[0,-12],[-1,-5],[-3,-9],[-1,-6],[-4,-10],[-4,-16],[-2,-4],[-6,-8],[-5,-11],[-6,-17],[-4,-18],[-2,-5],[-3,-1],[-3,0],[-1,2],[0,4],[1,6],[-4,-2],[-5,-13],[-2,-6],[0,-7],[-2,-9],[-1,-9],[-1,-7],[0,-4],[1,-10],[0,-11],[2,-13],[-2,-3],[-2,-1],[-7,-1],[-7,-2],[-6,-4],[-4,-5],[-4,-9],[-3,-24],[-5,-11],[-3,-2],[-8,-1],[-10,-2],[-4,-3],[-6,-15],[-1,-4],[2,-8],[-4,-12],[-3,-7],[-8,-5],[-3,3],[-2,1],[-6,0],[-8,-1],[-3,-5],[-5,-4],[-5,-5],[-9,-2],[-6,-5]],[[6557,6684],[2,9],[1,1],[3,0],[1,5],[2,2],[0,-14],[-1,-17],[-2,-6],[0,-3]],[[6892,6557],[0,-3],[-1,-3],[-2,6],[-3,-1],[-2,4],[-1,-4],[-5,-1],[0,6],[-2,-2],[-2,3],[-1,6],[-3,3],[-2,10],[0,6],[-3,22],[-2,2],[-11,4],[-1,4],[1,11],[0,6],[-4,9],[-1,6],[-3,5],[-3,2],[-3,-1],[-2,-5],[6,0],[-1,-2],[-2,0],[-10,-3],[-6,-3],[-7,1],[-10,-4],[-8,0],[-3,-7],[-2,1],[-1,2],[-11,5],[-1,3],[-2,1],[-2,-3],[-7,2],[-5,-1],[-2,-9],[-5,1],[-3,2],[-5,-2],[-9,3],[-3,-1],[-4,-3],[-1,-3],[-2,-1],[-3,5],[-2,-1],[-1,-3],[-6,-1],[-4,0],[-5,3],[1,1]],[[7131,7237],[3,-13],[2,-5],[1,-6],[1,-2],[1,-5]],[[2732,5606],[-1,-1],[-3,3],[-2,5],[-1,1],[0,2],[2,5],[2,1],[2,-5],[-2,-3],[1,-3],[2,-3],[0,-2]],[[2803,5659],[-1,-3],[-1,3],[1,2],[1,-2]],[[2808,5660],[-1,-3],[-1,6],[0,6],[2,2],[1,-1],[0,-8],[-1,-2]],[[2835,5600],[0,1],[-7,17],[-6,20],[-1,10],[3,0],[1,1],[0,9],[3,5],[1,3],[2,-6],[3,-3],[3,-4],[0,4],[-5,6],[-1,4],[-1,6],[-3,-5],[-1,0],[-1,2],[-2,1],[-1,-1],[0,-5],[-1,0],[-1,2],[0,3],[-2,10],[-4,7],[-1,0],[-2,4],[-2,2],[-3,5],[-4,4],[-4,1],[-5,-1],[-2,-2],[-2,-3],[0,-1],[-3,-3],[-2,-4],[0,-4],[-2,-4],[2,-3],[-10,-14],[-3,-2],[-4,-1],[-3,-5],[0,-7],[3,-5],[3,-8],[5,-11],[1,-4],[1,-6],[-2,-2],[-1,-2],[-5,0],[-2,-2],[0,-4],[-2,-3],[-7,-3],[-4,0],[-2,3],[0,10],[-4,15],[-1,10],[-2,-1],[-1,-3],[0,-8],[-1,-3],[-8,6],[-5,17],[0,3],[-1,4],[-4,2],[-3,2],[-3,1],[-2,-2],[-2,2],[0,5],[-4,-2],[-4,1],[-4,2],[-3,-1],[-3,-4],[1,-8],[-1,-2]],[[2706,5735],[2,-3],[3,-6],[0,-5],[1,-7],[2,-1],[2,1],[0,-3],[-1,-1],[0,-7],[3,-2],[1,-3],[5,1],[2,-1],[2,1],[-2,5],[-2,4],[0,2],[2,-1],[1,-3],[2,-3],[5,-11],[5,-3],[5,0],[3,2],[7,4],[4,8],[15,11],[5,7],[3,2],[4,6],[2,5],[2,2],[6,-2],[4,-2],[3,1],[2,-2],[1,-3],[2,-2],[6,1],[6,-2],[11,-10],[7,-9],[4,-11],[9,-13]],[[1436,3778],[-1,0],[-1,3],[1,1],[1,-4]],[[3043,4127],[-2,4],[-9,12],[-3,7],[-4,4],[-7,11],[-1,3],[-1,12],[-1,3],[-3,4],[-7,6],[-2,2],[-3,5],[-4,4],[-4,7],[-3,6],[-3,4],[-9,5],[-4,6],[-9,7],[-4,5],[-9,6],[-11,17],[-7,4],[-5,8],[-15,17],[-5,13],[-3,5],[-4,11],[-6,7],[-5,8],[-2,8],[-4,10],[-1,6],[-3,5],[0,11],[-2,5],[1,2],[2,1],[2,17],[-1,8],[-6,15],[-2,7],[-1,10],[-3,5],[-3,12],[-2,10],[-5,7],[-1,3],[0,4],[-3,3],[0,8],[-2,15],[-2,7],[-9,14],[0,6],[-1,9],[-2,11],[-13,43],[-2,16],[-2,9],[-3,17],[-4,12],[-2,11],[-3,20],[-4,12],[-3,11],[-4,10],[-4,7],[-2,5],[-6,24],[0,7],[-4,13],[-4,10],[-6,14],[-20,21],[-6,9],[-3,4],[-1,7],[1,4],[2,4],[2,-3],[2,1],[1,5],[1,7],[-2,9],[-6,18],[0,3],[1,5],[-2,8],[-3,7],[-1,5],[1,20],[2,5],[9,21],[3,8],[4,6],[4,8],[5,6]],[[8339,5486],[-2,-5],[-1,1],[-1,-1],[-3,-1],[-1,-4],[-2,-1],[-2,0],[0,4],[7,7],[4,5],[0,-3],[1,-2]],[[8364,5533],[2,-4],[2,1],[3,-1],[0,-4],[-3,-4],[-2,5],[-4,-3],[-2,1],[-2,-1],[-2,3],[1,3],[4,5],[3,-1]],[[8390,5554],[-4,-1],[-2,6],[0,2],[-2,3],[1,3],[2,1],[4,4],[7,-6],[1,-2],[-2,-2],[-2,-5],[-3,-3]],[[8493,5584],[-1,-3],[-1,8],[-1,2],[1,6],[2,-3],[0,-10]],[[8414,5610],[0,-3],[-3,-2],[-1,0],[0,6],[2,-2],[1,2],[1,-1]],[[8251,5637],[-2,-4],[-1,5],[0,9],[3,1],[0,-11]],[[8259,5656],[-2,-1],[-1,4],[0,3],[2,0],[1,-6]],[[8466,5710],[-1,-4],[-3,3],[-1,3],[0,3],[3,1],[2,-6]],[[8435,5715],[0,-6],[-3,-1],[-2,1],[-1,4],[5,5],[1,-3]],[[8498,5736],[-1,-2],[-1,3],[1,7],[1,1],[0,-9]],[[8499,5720],[2,-3],[3,1],[0,-12],[3,-7],[1,-6],[-3,-9],[-2,-4],[0,-4],[3,-1],[3,-3],[0,-9],[2,-7],[0,-3],[-1,-13],[1,-6],[1,-4],[2,-2],[0,-3],[1,-7],[0,-17],[-1,-4],[-3,-10],[-4,-7],[-2,0],[-1,-2],[1,-7],[0,-14],[-1,-10],[-2,10],[-1,14],[-1,6],[-2,6],[0,5],[-2,5],[-2,13],[-2,-1],[-2,-3],[-1,-3],[0,-6],[-3,-6],[-4,-12],[-1,-6],[3,-7],[3,-4],[0,-2],[3,-14],[-1,-14],[-1,-7],[-4,-11],[-4,-4],[-1,2],[-1,7],[-1,3],[1,7],[0,6],[-1,2],[-1,-1],[-3,-9],[-1,-2],[-2,0],[-9,8],[-7,7],[-5,6],[-4,10],[-1,8],[0,7],[-1,12],[0,7],[1,7],[3,6],[2,7],[0,3],[-4,11],[-3,5],[-5,4],[-3,5],[-3,0],[-2,-1],[0,-8],[-3,-15],[-3,3],[-3,4],[0,3],[-1,3],[0,2],[-1,2],[-1,-5],[-2,-4],[-2,-1],[-2,0],[-1,2],[0,9],[-3,3],[-2,-1],[-4,-5],[0,-2],[-1,-4],[-4,-13],[-1,-10],[-3,-9],[0,-3],[-2,-2],[-2,0],[-3,9],[0,7],[2,5],[2,4],[2,17],[0,9],[3,8],[3,5],[1,1],[6,2],[2,3],[4,0],[3,1],[2,4],[0,8],[2,4],[2,5],[4,1],[2,2],[1,3],[1,5],[4,-4],[3,-1],[3,-4],[2,-7],[0,-3],[1,-11],[-1,-3],[-3,-5],[2,0],[3,4],[2,2],[5,3],[1,1],[0,3],[2,6],[1,7],[2,6],[2,0],[4,-5],[3,3],[1,7],[1,10],[0,3],[2,3],[2,-1],[3,-4],[3,-1],[1,3],[1,6],[1,0],[3,-2],[4,2],[1,7],[-1,8],[-3,22],[2,5],[1,0],[4,-6],[6,-8],[2,-5],[2,-6]],[[8500,5746],[-2,4],[1,5],[2,8],[1,-7],[0,-4],[1,-4],[-1,-2],[-2,0]],[[8479,5758],[0,-3],[-4,8],[0,5],[1,0],[1,-2],[2,-8]],[[8460,5747],[-1,-2],[-3,0],[-2,-6],[-1,-1],[-6,-2],[-6,2],[-3,8],[0,3],[1,3],[2,3],[4,4],[1,4],[2,4],[4,1],[2,-1],[3,-4],[2,-2],[0,-12],[1,-2]],[[8490,5754],[-3,5],[-1,5],[-1,2],[0,11],[3,4],[1,3],[1,-2],[-1,-9],[1,-10],[0,-9]],[[8330,5787],[-4,-1],[-1,5],[3,5],[3,-2],[1,-2],[-2,-5]],[[8452,5794],[-1,0],[1,6],[2,-2],[0,-2],[-2,-2]],[[8406,5787],[-2,-1],[-1,-2],[-1,4],[0,6],[5,8],[1,-2],[0,-3],[-2,-9],[0,-1]],[[8419,5705],[-4,0],[-1,3],[-2,12],[-3,3],[-3,2],[-1,2],[-2,2],[-4,13],[0,11],[2,4],[1,1],[4,0],[5,6],[1,2],[0,10],[-2,12],[1,3],[2,3],[1,6],[0,7],[2,5],[6,5],[8,-5],[1,-6],[0,-2],[-1,-7],[-3,-11],[-2,-8],[-1,-12],[-1,-3],[-3,-12],[0,-8],[-1,-3],[0,-3],[5,-15],[0,-5],[-1,-3],[-1,-5],[-1,-2],[-2,-2]],[[8426,5728],[-1,-2],[-1,4],[0,5],[3,18],[-1,4],[4,10],[2,10],[3,10],[6,28],[0,4],[1,2],[0,7],[2,5],[1,-4],[-1,-6],[0,-3],[1,-1],[0,-6],[-1,-9],[1,-11],[-2,-11],[-1,-4],[-2,-4],[-3,-2],[-2,-5],[-2,-7],[0,-5],[-4,-19],[-3,-8]],[[8436,5833],[2,-7],[-2,0],[-1,5],[1,2]],[[8257,5669],[-2,-4],[0,5],[3,15],[2,3],[3,8],[2,4],[4,7],[4,9],[3,0],[1,1],[3,5],[6,14],[5,11],[6,14],[3,6],[5,13],[1,2],[2,1],[2,4],[2,5],[1,7],[-2,9],[3,11],[3,15],[1,3],[2,-2],[0,-3],[-1,-6],[0,-3],[1,-4],[-1,-5],[2,-14],[2,-9],[0,-3],[-2,-5],[-2,-2],[-3,-1],[-2,-2],[-2,-4],[-1,-6],[-1,-3],[0,-2],[-7,-4],[-5,-5],[-1,-3],[1,-5],[-6,-20],[-2,-5],[-1,-5],[-3,-3],[-3,-2],[-3,-3],[-2,-7],[-2,-6],[-3,-5],[-5,-7],[-3,-2],[-2,-6],[-3,-2],[-3,-4]],[[8328,5847],[1,-3],[-1,-4],[-1,-1],[-1,1],[-1,4],[2,3],[1,0]],[[8459,5837],[2,-2],[2,0],[3,5],[3,-2],[3,-9],[0,-15],[-1,-9],[3,-6],[2,-6],[0,-7],[2,-7],[0,-5],[-3,1],[-1,-3],[-2,6],[-1,2],[0,-9],[1,-5],[0,-5],[-3,4],[-3,2],[-1,2],[0,9],[-1,7],[1,14],[0,5],[-1,6],[-2,5],[-2,0],[-3,-4],[-2,1],[0,14],[-2,12],[-1,3],[0,7],[1,-1],[2,-4],[3,-3],[1,-3]],[[8460,5845],[-3,0],[-2,3],[-2,7],[2,2],[2,-1],[2,-2],[1,-5],[0,-4]],[[8467,5851],[-1,-2],[-1,1],[-1,5],[1,1],[2,-5]],[[8401,5852],[4,-3],[3,3],[3,-1],[2,-4],[0,-2],[5,3],[2,0],[0,-6],[-1,-4],[0,-5],[-2,-5],[-1,-4],[-2,-4],[-3,-2],[-2,-5],[1,-3],[-1,-3],[-3,-2],[-4,-6],[-9,-4],[-6,-9],[-1,2],[1,8],[0,4],[-1,3],[3,19],[0,14],[1,18],[0,2],[-1,3],[-4,3],[0,4],[2,3],[3,-3],[6,-5],[3,-4],[2,-5]],[[8333,5857],[-2,-2],[-1,2],[0,4],[-2,11],[2,1],[3,-3],[1,-4],[0,-4],[-1,-5]],[[8335,5884],[1,-1],[1,1],[1,3],[1,-4],[2,-4],[0,-4],[-2,0],[-2,1],[-2,-2],[-3,1],[-3,10],[-1,1],[0,3],[1,1],[0,3],[1,0],[1,-3],[3,-4],[1,-2]],[[8406,5892],[-2,-1],[-5,10],[2,2],[3,0],[2,-4],[1,-3],[-1,-4]],[[8478,5905],[1,-5],[1,-3],[0,-4],[1,-2],[1,0],[2,-2],[2,-3],[-1,-4],[0,-4],[-1,-6],[0,-11],[1,-3],[0,-10],[3,-13],[-1,-2],[0,-2],[1,-1],[2,-4],[2,-5],[-1,-1],[-1,4],[-2,0],[-5,-1],[-3,2],[-3,0],[-2,7],[-2,1],[-1,4],[-3,7],[0,5],[1,5],[1,3],[0,4],[-2,-1],[-3,6],[-4,10],[-4,3],[-3,4],[-1,6],[-2,9],[-1,9],[8,-2],[7,0],[9,2],[3,-2]],[[8435,5891],[6,-7],[3,-11],[1,-9],[-1,-4],[-1,4],[-4,5],[-4,3],[1,3],[-2,2],[0,1],[-2,2],[-2,6],[-2,1],[-1,-1],[-7,-16],[0,3],[1,8],[1,12],[1,4],[-1,6],[0,5],[3,-2],[6,-6],[0,-2],[4,-7]],[[8396,5905],[-1,-2],[-1,4],[1,2],[1,-1],[0,-3]],[[8390,5895],[-2,-14],[-2,5],[1,3],[-2,5],[2,6],[1,9],[2,3],[1,-2],[0,-5],[-1,-10]],[[8437,5901],[0,-5],[-1,1],[-3,10],[-1,4],[1,2],[2,-3],[2,-9]],[[8423,5924],[0,-3],[-3,4],[-3,7],[-3,3],[0,3],[3,1],[4,-12],[2,-3]],[[8352,5960],[1,-1],[4,2],[2,-1],[1,-3],[2,-1],[1,-2],[2,3],[3,-3],[2,-7],[2,-4],[2,-3],[1,-3],[-2,-4],[0,-10],[2,-12],[-1,-3],[-2,-4],[-1,-5],[0,-7],[-1,1],[-4,-6],[-3,2],[0,3],[-2,3],[-2,5],[-1,4],[0,4],[-2,7],[-2,3],[0,2],[-1,3],[0,7],[-2,10],[-1,2],[-2,2],[-2,3],[-1,3],[0,5],[-2,0],[-2,1],[2,6],[2,0],[5,-1],[2,-1]],[[8385,5963],[2,0],[4,-4],[0,-6],[-2,-5],[0,-2],[-1,-2],[-4,4],[-1,3],[-1,6],[2,8],[1,-2]],[[8340,5975],[0,-4],[-5,6],[0,4],[3,-2],[2,-4]],[[8453,5968],[-1,-3],[-2,1],[-2,-3],[-3,4],[-1,3],[3,8],[0,13],[2,3],[3,-7],[0,-1],[3,-4],[-1,-7],[0,-4],[-1,-3]],[[8392,5992],[0,-2],[-6,9],[0,4],[6,-11]],[[8388,6048],[0,-3],[-1,-4],[1,-8],[-1,-5],[-1,-1],[-1,1],[0,3],[1,1],[-1,4],[-1,2],[0,5],[-1,2],[0,4],[4,1],[1,-2]],[[8363,6256],[4,-3],[9,-11],[7,-5],[3,-1],[3,3],[1,2],[2,7],[2,1],[2,-6],[0,-9],[-2,-5],[-1,-5],[-1,-18],[0,-10],[2,-8],[1,-3],[3,-3],[0,-6],[1,-3],[3,-3],[-1,-4],[0,-4],[-2,-10],[-5,-22],[-3,-14],[-4,-2],[-8,-8],[-3,-5],[-1,-6],[2,-6],[0,-3],[-1,-3],[-3,-6],[-1,-6],[-1,-2],[0,-6],[1,-3],[3,-13],[3,-12],[1,-1],[0,-2],[-2,-3],[0,-6],[1,-6],[3,-14],[0,-4],[2,-6],[2,-2],[5,-4],[3,-1],[1,2],[2,1],[-1,3],[-2,4],[0,2],[5,7],[3,3],[4,0],[4,-2],[2,-2],[2,-3],[3,-7],[1,-7],[0,-9],[1,-3],[4,0],[2,5],[0,6],[-1,2],[0,3],[1,2],[2,-2],[1,-3],[6,-4],[1,0],[4,-4],[1,-2],[-1,-4],[-6,-1],[-1,-4],[1,-7],[3,-5],[2,-5],[1,-4],[0,-5],[-1,-5],[3,1],[2,-1],[3,-4],[2,0],[0,-14],[-2,-13],[-3,2],[-2,5],[0,7],[2,6],[-1,2],[-5,-3],[-3,1],[-6,7],[-3,1],[-1,3],[1,6],[-3,8],[0,3],[-1,3],[-8,8],[0,2],[-3,7],[-5,9],[-3,2],[0,-7],[1,-3],[-1,-3],[3,-9],[0,-2],[2,-7],[0,-8],[-2,-4],[-2,4],[0,3],[-3,10],[-1,2],[-5,7],[-3,8],[-10,10],[-6,-6],[-2,-3],[0,-5],[-3,-4],[-4,0],[-3,2],[-2,5],[-2,0],[-3,7],[-3,1],[-2,-6],[-1,11],[0,12],[2,5],[7,12],[0,9],[-1,4],[-5,3],[-4,6],[-1,-6],[1,-10],[0,-7],[-1,-2],[-3,1],[-1,2],[-1,7],[-2,4],[-1,6],[-1,1],[-2,0],[-2,3],[-1,7],[0,8],[-2,13],[-1,5],[-1,24],[0,2],[-1,1],[-3,9],[1,12],[0,2],[1,2],[3,-5],[3,-3],[2,-7],[1,-1],[4,0],[2,3],[1,3],[0,4],[-2,10],[-1,7],[0,7],[1,7],[2,11],[1,8],[-1,10],[1,6],[0,4],[-2,5],[0,6],[4,30],[2,12],[1,8],[6,6],[3,-1],[5,2]],[[8385,6272],[-1,-5],[-1,2],[1,4],[0,4],[2,1],[1,-3],[-2,-3]],[[8367,6282],[0,-3],[-2,2],[0,5],[1,2],[1,-2],[0,-4]],[[8374,6299],[1,-6],[-2,0],[-3,4],[0,3],[1,1],[3,-2]],[[8386,6356],[-1,0],[1,5],[1,2],[1,-1],[-2,-6]],[[8384,6380],[-1,-4],[-1,0],[1,8],[1,0],[0,-4]],[[8737,5608],[-1,-1],[-1,5],[0,5],[1,4],[2,1],[0,-7],[-1,-3],[0,-4]],[[9263,4522],[5,-3],[2,-3],[-2,-2],[-4,-1],[-1,2],[-4,2],[-1,4],[0,2],[-3,3],[-1,3],[0,2],[3,-2],[6,-7]],[[9284,4529],[-1,-2],[-3,-2],[-2,1],[-1,2],[0,2],[3,-1],[-1,3],[4,-2],[1,-1]],[[9190,4575],[0,-5],[-3,3],[0,2],[2,1],[1,-1]],[[9195,4606],[1,0],[2,4],[2,2],[1,-2],[-2,-14],[-1,2],[-6,4],[0,5],[-2,2],[-1,5],[-2,6],[0,4],[1,-1],[1,-4],[5,-8],[0,-3],[1,-2]],[[9180,4645],[4,-5],[2,2],[1,-1],[3,-6],[0,-9],[-1,1],[-5,0],[-3,2],[-4,0],[2,4],[0,1],[-2,6],[0,4],[3,1]],[[9175,4636],[-1,-1],[-1,1],[-5,8],[1,6],[2,3],[3,-3],[1,-5],[0,-9]],[[9238,4667],[2,-1],[3,1],[1,-4],[2,-1],[2,-3],[0,-3],[-3,-4],[-3,3],[-1,0],[-2,7],[-4,2],[2,3],[1,0]],[[8987,4686],[-3,1],[-4,6],[3,0],[4,-7]],[[9196,4680],[-2,1],[1,5],[0,4],[-2,2],[1,5],[2,1],[0,-6],[1,-2],[-1,-10]],[[8987,4695],[-1,0],[-5,3],[-1,3],[5,0],[2,-1],[0,-5]],[[9110,4848],[-1,2],[-3,2],[-2,7],[0,8],[1,0],[6,-7],[1,-2],[-1,-7],[-1,-3]],[[9331,4798],[-1,-5],[-1,1],[-3,-2],[-2,-4],[-3,0],[-5,5],[-2,3],[-3,6],[-1,5],[1,7],[-1,6],[-5,4],[-1,2],[-2,6],[-4,7],[-1,3],[-1,6],[0,4],[1,12],[0,6],[2,-3],[2,-2],[3,-1],[3,-4],[2,-9],[1,-3],[0,-3],[3,-3],[4,-13],[3,-3],[2,-1],[3,-4],[4,-10],[2,-13]],[[9087,4870],[-2,0],[-2,6],[-1,2],[0,2],[4,4],[2,-3],[0,-8],[-1,-3]],[[9294,4870],[-2,13],[0,4],[-1,2],[3,6],[1,-3],[0,-5],[2,-4],[-1,-10],[-2,-3]],[[9055,4911],[-2,-2],[-2,2],[0,7],[3,4],[1,-2],[1,-4],[-1,-5]],[[9218,4936],[2,-1],[4,6],[2,-5],[3,-2],[3,-1],[-1,-8],[0,-4],[1,-4],[0,-6],[-1,-5],[-3,-8],[-3,-2],[-4,-1],[-1,-4],[1,-4],[4,-12],[-2,-6],[-3,-4],[-3,-2],[-5,1],[-5,-1],[-1,-2],[0,-6],[-1,-3],[-6,-10],[-3,-4],[-5,-2],[-3,-2],[-3,-5],[-3,-2],[-5,-5],[-6,-1],[-10,0],[-3,-1],[-2,1],[-2,2],[-3,8],[-3,2],[-3,0],[-4,-3],[-1,1],[-8,12],[-2,2],[-9,6],[-2,6],[0,7],[3,4],[3,-2],[2,0],[1,1],[2,0],[1,-1],[6,1],[4,-2],[3,-3],[7,0],[4,4],[1,-1],[5,0],[3,5],[2,17],[1,6],[1,2],[1,-1],[1,-3],[-2,-4],[0,-2],[-1,-8],[1,-6],[2,-6],[4,-1],[2,4],[4,1],[3,-4],[3,1],[1,2],[5,3],[2,6],[1,7],[2,5],[5,9],[2,1],[5,0],[3,3],[0,7],[-1,7],[-3,17],[0,3],[1,3],[0,2],[4,0],[3,-1],[2,-4]],[[9267,4947],[-2,0],[1,3],[1,1],[0,-4]],[[9239,5003],[0,-5],[-2,3],[-1,4],[1,2],[2,1],[0,-5]],[[9224,5014],[-1,-3],[-1,0],[-2,5],[0,3],[4,-5]],[[9220,5020],[-1,0],[0,7],[2,-1],[0,-5],[-1,-1]],[[8915,4987],[0,35],[0,11]],[[8915,5033],[3,0],[2,-1],[14,-13],[6,-6],[3,0],[6,-7],[9,-7],[10,-7],[6,-2],[7,-2],[4,-2],[5,-9],[3,-2],[2,-5],[5,-6],[2,0],[3,-1],[4,1],[3,-1],[1,-2],[3,-8],[3,-2],[3,-4],[3,-5],[2,-5],[2,-4],[3,-2],[4,0],[12,-26],[0,-20],[-1,-13],[3,-4],[4,-1],[6,-3],[5,-4],[18,-18],[2,-1],[4,-1],[3,1],[2,-1],[2,-4],[2,-2],[2,-5],[2,-6],[2,-3],[1,-4],[1,-10],[-1,-6],[-1,-3],[-2,-1],[-10,-1],[-7,1],[-4,-6],[0,-6],[4,-14],[2,-12],[2,-5],[6,-8],[2,-6],[5,-9],[3,-4],[3,-2],[5,-7],[1,-4],[1,-10],[1,-7],[0,-3],[5,-9],[1,-1],[2,-15],[2,-6],[3,-2],[3,0],[8,4],[3,-1],[1,-2],[1,-7],[-2,-6],[0,-7],[2,-5],[4,-4],[2,-1],[7,-1],[4,-1],[3,-2],[1,-2],[-1,-3],[-2,-1],[-2,0],[-2,-3],[0,-3],[1,-4],[3,-6],[1,-1],[4,-2],[3,-2],[4,-4],[5,-1],[4,-2],[-1,-5],[-5,2],[-1,-2],[2,-5],[3,-4],[1,-2],[-1,-2],[-3,-4],[-2,-1],[-3,0],[-5,2],[-3,2],[-2,6],[-3,4],[-3,3],[-2,1],[-3,0],[-6,3],[-11,2],[-3,1],[-3,4],[-2,0],[-2,-1],[-4,-1],[-2,1],[-3,3],[-3,1],[-1,-1],[-2,0],[-4,2],[-4,1],[-2,4],[-2,3],[-2,2],[-1,7],[-3,7],[-3,6],[-6,8],[-2,3],[-2,8],[0,9],[-2,0],[-5,3],[-1,5],[-3,11],[-2,6],[-5,11],[-1,7],[-3,7],[-2,6],[-1,2],[-6,5],[-2,2],[-5,1],[-3,1],[-5,3],[-2,2],[-3,0],[-5,3],[-1,3],[0,6],[-3,-1],[-7,4],[-2,-1],[0,-5],[-3,1],[0,-1],[-2,-2],[-1,-3],[-2,0],[-5,3],[-2,2],[-2,4],[-2,3],[-1,0],[6,-22],[-1,-1],[-2,1],[1,-5],[-3,0],[-3,2],[-3,0],[0,-2],[2,-10],[-5,-2],[-4,-2],[-6,-2],[-5,-1],[-2,2],[-3,1],[-3,-1],[-2,-2],[-3,0],[-1,4],[0,3],[-1,2],[-1,-2],[2,-7],[2,-3],[3,2],[6,0],[6,-6],[3,-2],[3,-5],[2,-6],[3,-8],[0,-6],[-1,-3],[-4,-4],[-4,-3],[-12,-14],[-3,1],[-3,4],[-4,3],[-2,1],[-7,-2],[-9,0],[-3,1],[-3,2],[-4,-1],[-2,-2],[-2,-1],[-4,6]],[[9248,4909],[-2,-4],[-2,4],[-1,4],[-2,3],[-1,8],[0,13],[-1,8],[-2,8],[-6,19],[-2,5],[-4,5],[-4,2],[-1,0],[-3,3],[-2,4],[-6,11],[-3,3],[-2,3],[-9,12],[-3,3],[-3,0],[-3,3],[2,1],[1,4],[4,-3],[5,-5],[1,-5],[3,0],[4,-4],[6,-8],[3,-5],[7,-5],[4,-9],[4,-7],[1,-3],[18,-30],[3,-9],[0,-8],[-2,-5],[0,-5],[-2,-11]],[[9177,5030],[-5,-1],[-2,1],[-2,3],[-2,6],[-2,2],[4,4],[4,1],[5,-5],[1,-2],[0,-7],[-1,-2]],[[9106,5052],[-1,-3],[-1,1],[0,3],[1,1],[1,-2]],[[9084,5070],[9,-3],[1,0],[0,-2],[-1,-1],[-2,0],[-1,-1],[-2,-5],[-2,1],[-2,-2],[-4,0],[-5,3],[-1,-2],[-2,0],[-2,-2],[-1,0],[0,5],[2,1],[0,5],[1,3],[3,-1],[3,2],[6,-1]],[[9159,5094],[0,-2],[-3,1],[-3,6],[0,3],[1,3],[1,0],[3,-4],[1,-7]],[[5655,8151],[2,-7],[-1,-5],[2,-3],[4,-8],[3,-11],[4,-5],[-4,-4],[2,-3],[1,-6],[0,-5],[-1,-1],[-2,-6],[-7,-2],[-6,-9],[-3,-3],[-4,-6],[-6,-10],[-3,-4],[-1,-3],[-7,-13],[0,-4],[2,-7],[0,-11],[1,-2],[3,-3],[-1,-3],[-8,3]],[[5625,8010],[-2,0],[-7,4],[-5,4],[-2,5],[-2,2],[-7,4],[-8,1],[-8,0],[-2,-5],[-3,-1],[-4,3],[-3,1],[-7,0],[-6,-4],[-2,-3],[-1,-5],[-4,2],[-1,-1],[-3,0],[1,4],[0,3],[-2,4],[-2,0],[-2,3],[-1,4],[-3,5],[-5,-5],[-3,-6],[-5,-1],[0,3],[-1,3],[-3,1]],[[5395,8278],[6,-3],[3,4],[-1,4],[-9,3]],[[5394,8291],[5,-2],[9,6],[16,7],[17,6],[8,2],[1,3],[2,1],[2,5],[5,7],[9,2],[3,3],[7,5],[17,5],[6,1],[7,0],[6,-4],[6,-5],[-2,-1],[-7,5],[4,-14],[3,-5],[4,-3],[4,-1],[12,2],[6,4]],[[5544,8320],[1,-1],[7,0],[8,-1],[26,-2],[29,-2],[16,0]],[[3114,6224],[-2,1],[0,2],[2,0],[0,-3]],[[3182,6226],[-4,0],[0,2],[2,2],[5,-2],[-3,-2]],[[3162,6246],[2,-1],[0,2],[5,-1],[4,-3],[3,-1],[0,-8],[-2,-3],[-4,-8],[-3,-4],[-5,-2],[-4,0],[-1,1],[-2,-1],[-3,2],[-8,0],[-1,-2],[-4,0],[-1,1],[-4,0],[-1,2],[0,13],[-2,6],[0,2],[2,4],[1,4],[2,1],[7,-2],[18,-1],[1,-1]],[[8624,7633],[1,-3],[3,-6],[0,-3],[1,-1]],[[8629,7620],[-2,-2],[-1,1],[-4,1],[-6,-7],[-1,-5],[-3,-3],[-2,-3],[-4,-11],[-3,-5],[-2,-7],[0,-6],[2,-6],[0,-5],[-1,-10],[1,-11],[-1,-4],[-11,-8],[-6,-13],[-5,-4],[-2,-4],[-4,-2],[-3,-7],[-3,-4],[-3,-3],[-2,-3],[-6,0],[-4,-2],[-2,-6],[-9,-6],[-1,-5],[1,-8],[0,-6],[-1,-5],[-2,2],[-2,-6],[0,-5],[6,-4],[3,-1],[2,-3],[5,-10],[5,-5],[3,-4],[4,-7]],[[8516,7359],[-7,6],[-5,-3],[-1,-4],[-1,-1],[-2,8],[-3,0],[-5,6],[-2,-1],[0,-3],[-3,-6],[-4,-5],[-2,0],[-1,7],[-6,2],[-2,3],[4,6],[2,1],[-1,2],[-6,0],[-3,2],[-3,-1],[-3,1],[5,6],[1,4],[0,3],[2,8],[3,4],[6,6],[3,1],[3,0],[1,1],[-3,3],[-4,0],[-3,3],[-1,4],[7,24],[-1,8],[0,6],[-7,4],[-7,6],[-2,3],[-1,-1],[-1,-6],[-2,-1],[-2,10],[-5,4],[-1,3],[1,5],[-1,0]],[[4522,7076],[3,-3],[4,2],[4,-4],[2,-1],[-4,-6],[-5,1],[-4,3],[-2,5],[2,3]],[[4304,7312],[0,-1],[-4,0],[-1,3],[1,2],[2,0],[2,-4]],[[4287,7363],[1,-1],[9,1],[3,0],[-1,-5],[-1,-1],[-6,-1],[-8,2],[-3,4],[0,4],[2,1],[4,-4]],[[4217,7398],[-2,-4],[-3,2],[-3,0],[-2,3],[-1,3],[1,2],[3,0],[7,-6]],[[4203,7402],[-2,0],[-3,5],[4,2],[2,-3],[-1,-4]],[[4247,7409],[-6,1],[-2,2],[-1,4],[4,2],[4,0],[2,-3],[0,-4],[-1,-2]],[[4134,7453],[-1,-3],[-3,2],[1,6],[1,2],[2,-3],[0,-4]],[[4793,7325],[-2,-1],[-10,-9],[-3,0],[-5,4],[-10,1],[-3,1],[-4,-2],[-3,0],[-2,-4],[-2,1],[2,8],[3,15],[0,10],[1,8],[-1,8],[-2,5],[3,13],[-1,6],[-2,9],[6,-2],[-3,6],[-2,-1],[-2,1],[-5,-4],[-2,-1],[-1,1],[0,5],[-1,7],[2,2],[2,0],[4,6],[-1,6],[2,6],[-1,1],[-4,-11],[-1,-5],[-3,-2],[-3,-1],[-3,2],[0,7],[1,6],[2,17],[0,5],[1,3],[2,2],[3,7],[4,16],[5,17],[-2,4],[1,4],[2,20],[3,9],[0,9],[1,7],[-1,3],[0,4],[-2,7],[-2,16],[0,5],[2,3],[-3,0],[-1,4],[0,4],[3,6]],[[5949,6987],[8,16]],[[1213,4115],[-2,2],[-2,1],[0,2],[3,-3],[1,-2]],[[852,4164],[4,-2],[0,-5],[-1,-3],[-2,1],[-1,2],[-1,5],[-4,-1],[-3,1],[-1,7],[0,3],[1,2],[2,2],[4,-2],[1,-4],[1,-6]],[[838,4173],[-1,-2],[-2,3],[0,3],[3,0],[1,-1],[-1,-3]],[[794,4211],[-2,0],[-1,1],[1,7],[2,-2],[1,-5],[-1,-1]],[[792,4224],[-1,0],[0,5],[2,-3],[-1,-2]],[[1148,4578],[-1,-1],[0,6],[2,-2],[-1,-3]],[[1137,4611],[-2,-4],[0,5],[2,-1]],[[1138,4625],[4,-3],[0,-3],[-4,-1],[-2,-2],[-1,1],[-1,4],[4,4]],[[1108,4640],[-1,3],[2,3],[1,-1],[-2,-5]],[[1123,4668],[-2,0],[0,4],[1,1],[2,-2],[-1,-3]],[[1108,4670],[-2,-1],[-2,0],[-1,5],[1,3],[5,-1],[0,-4],[-1,-2]],[[6423,6601],[-5,-3],[-2,0],[-2,2],[-4,11]],[[6410,6611],[1,6],[-2,16],[0,16],[3,10],[1,6],[3,15],[3,5],[4,5],[3,-9],[5,-6],[0,-7],[-1,-5],[-1,-10],[1,-4],[0,-3],[2,-14],[0,-11],[-2,-4],[-3,-13],[0,-1],[-4,-2]],[[5630,7731],[-1,1],[-1,4],[-2,1],[-2,6],[0,3],[1,3],[2,1],[3,0],[0,3],[-6,5],[-4,-1],[-4,-7],[-3,-1],[-2,4],[-3,3],[-5,1],[-3,2],[-3,4],[-5,2],[1,3],[4,0],[0,3],[-2,1],[-3,3],[2,2],[0,3],[2,2],[0,2],[-3,3],[-4,2],[-3,3],[-1,0],[-4,4],[-2,4],[-3,3],[0,16],[-2,-1],[-3,7],[-4,4],[-3,2],[-1,5],[-2,3]],[[5634,7945],[5,3],[1,3],[3,2],[6,-6],[7,1],[10,-4],[1,1],[4,-2],[2,0],[6,2],[3,-1],[7,-10],[1,-2],[3,0],[2,1],[3,5],[8,5],[7,1],[13,4],[2,4],[2,8],[7,2],[1,1]],[[5783,7801],[3,-6],[3,-3],[9,-3],[0,4],[4,-1],[9,6],[5,1],[4,-2],[3,-4],[1,-3]],[[5824,7790],[0,-4],[-1,-2],[-1,-10],[-2,-8],[-14,-5],[1,3],[-1,4],[0,3],[1,3],[-3,1],[-3,-4],[1,-7],[-2,-5],[0,-5],[1,-3],[-1,-4],[-4,-8],[-1,-4],[0,-18],[-2,-11],[0,-3]],[[9074,7703],[-1,-2],[-2,2],[0,4],[6,3],[2,-2],[0,-2],[-5,-3]],[[9060,7746],[4,-4],[6,1],[-2,-4],[-2,0],[-4,-5],[-5,-2],[-5,-8],[-1,-4],[-3,-6],[-5,-5],[-1,-11],[-3,4],[-1,5],[1,3],[6,8],[7,15],[5,13],[3,0]],[[9126,7794],[-5,-5],[-4,-1],[-10,-13],[-3,-2],[-4,1],[-1,-2],[0,-3],[-1,-3],[-7,-9],[-3,-7],[-3,-2],[-6,-7],[1,6],[1,3],[5,6],[0,6],[3,5],[5,5],[3,7],[3,2],[3,5],[4,2],[-1,5],[2,4],[1,0],[2,-7],[8,1],[8,12],[4,3],[2,-3],[-1,-4],[1,-3],[-1,-2],[-6,0]],[[6332,7803],[-1,-1],[-1,6],[0,3],[1,1],[1,-5],[0,-4]],[[9157,7812],[-5,-3],[-2,0],[6,15],[4,2],[4,8],[11,11],[6,0],[-9,-11],[-1,-5],[-4,-5],[-3,-1],[-7,-11]],[[9221,7884],[-5,-6],[-2,0],[-1,4],[4,1],[5,8],[3,6],[2,2],[2,0],[-8,-15]],[[9251,7934],[-1,-3],[-2,1],[2,4],[1,-2]],[[9279,7994],[-1,-3],[-2,2],[3,3],[1,4],[3,-1],[-1,-2],[-3,-3]],[[9299,8024],[-3,-3],[-3,2],[0,5],[6,15],[2,-1],[0,-4],[-2,-5],[0,-9]],[[9330,8081],[-4,-6],[-8,-3],[-1,-4],[-2,-2],[-3,1],[-1,2],[0,6],[-1,5],[3,0],[3,4],[7,2],[3,5],[3,12],[3,4],[3,1],[0,-13],[-5,-14]],[[9343,8101],[-2,-1],[-4,4],[1,4],[4,5],[3,0],[0,-7],[-2,-5]],[[9322,8111],[-3,-1],[-1,1],[-1,5],[3,1],[2,-1],[0,-5]],[[8964,8316],[6,-14],[0,-7],[-2,-8],[5,-23],[4,-11],[2,-9],[1,-10],[0,-20],[-2,-8],[-2,-2],[0,-5],[-1,-16],[1,-8],[2,-5],[1,-6],[0,-7],[3,-6],[2,-7],[0,-7],[2,-2],[5,-43],[2,-13],[7,-22],[3,-13],[3,-20],[2,-8],[3,-7],[4,-7],[3,-4],[-2,-3],[-3,4],[-3,6],[-4,5],[-4,8],[-4,4],[-7,2],[-14,-3],[-3,-4],[-2,-5],[-2,-11],[-9,-39],[-2,-10],[-1,-11],[1,-8],[0,-3],[3,-9],[3,-7],[2,-1],[2,-4],[2,-6],[2,-13],[3,-9],[1,-2],[5,0],[2,-3],[2,-10],[1,-12],[-3,-11],[-2,3],[-1,7],[0,7],[-2,5],[-7,2],[-6,1],[-4,6],[-3,-1],[-3,-3],[-2,-5],[-1,-6],[-2,-6],[-2,-15],[-4,-10],[-2,3],[-2,7],[0,5],[-3,16],[1,14],[4,19],[1,7],[0,6],[-1,5],[-1,12],[1,9],[4,11],[1,7],[-1,16],[-3,10],[-4,11],[-1,5],[3,13],[2,6],[1,14],[2,14],[0,43],[-2,12],[0,7],[2,14],[2,7],[0,13],[-3,12],[-3,5],[-3,6],[-5,6],[3,3],[-3,4],[-1,5],[0,24],[4,11],[2,28],[-1,6],[-1,12],[4,6],[5,3],[5,-6],[6,3],[1,5],[-2,3],[1,4],[4,1],[-1,3],[2,10],[-1,4],[-6,10],[-4,8],[6,0],[2,1],[4,5]],[[9666,8326],[1,-3],[-16,16],[-1,4],[2,0],[2,-3],[3,-2],[5,-5],[4,-7]],[[8809,8357],[-3,-10],[-3,0],[-2,2],[-3,-1],[-2,1],[2,3],[6,5],[2,-1],[3,1]],[[8830,8357],[3,-3],[4,1],[1,-2],[-3,-2],[-3,-6],[0,-4],[-1,-2],[-3,-2],[-5,-6],[-4,10],[-2,3],[-5,-5],[-1,0],[1,6],[4,7],[4,11],[9,-5],[1,-1]],[[5544,8320],[4,5],[3,5],[2,7],[0,4],[1,6],[3,2],[9,-1],[3,3],[9,14],[1,3]],[[5581,8367],[-10,-17],[5,-2],[3,-2],[9,1],[0,10],[1,9]],[[9628,8342],[0,-8],[-4,4],[-1,3],[-4,2],[-6,10],[-2,6],[-2,3],[-6,6],[5,3],[8,-1],[1,-1],[-1,-4],[1,-4],[6,-13],[3,-2],[2,-4]],[[9182,8583],[-3,-1],[-1,3],[4,2],[3,0],[-3,-4]],[[9544,8559],[-5,-6],[-1,4],[4,4],[5,9],[1,8],[-1,4],[13,5],[8,8],[2,-1],[2,-6],[0,-8],[-1,-5],[-9,-3],[-9,-5],[-9,-8]],[[5994,8938],[1,-6],[-1,-3],[1,-2],[-2,-1],[-3,5],[-2,0],[-2,5],[2,0],[3,3],[3,-1]],[[6944,9014],[-5,-1],[-5,4],[-5,9],[0,2],[4,-1],[5,0],[7,-2],[0,-6],[1,-1],[-2,-4]],[[6185,9025],[-1,-1],[-5,3],[-1,2],[3,2],[4,-4],[0,-2]],[[6395,9168],[1,-5],[-2,-3],[-2,0],[0,3],[-2,2],[-4,-4],[-3,-5],[-6,-6],[-12,-5],[-14,-3],[-7,4],[-4,11],[0,11],[1,5],[3,4],[6,6],[9,4],[7,0],[22,-12],[4,-3],[3,-4]],[[6870,9188],[-3,-5],[-4,0],[-2,2],[5,6],[3,0],[1,-3]],[[9484,9152],[0,5],[-3,3],[-5,2],[-2,7],[1,8],[-2,4],[1,4],[6,4],[5,5],[3,-2],[0,-6],[-2,-3],[-5,-2],[0,-12],[1,-5],[3,-5],[0,-6],[-1,-1]],[[9699,9191],[-8,-1],[-16,6],[-6,3],[-10,7],[1,2],[7,6],[4,2],[4,0],[28,-8],[2,-1],[0,-5],[-3,0],[-1,-2],[-1,-8],[-1,-1]],[[6678,9211],[1,-2],[0,-6],[-1,-4],[-3,0],[-4,-2],[-5,2],[-8,-1],[-4,2],[0,3],[-2,4],[-4,2],[-3,0],[-3,2],[-4,-3],[-2,1],[-7,9],[-6,13],[1,3],[5,2],[3,4],[7,2],[1,-2],[10,-7],[5,-6],[21,-14],[2,-2]],[[9463,9263],[-6,-1],[-2,2],[0,5],[4,-1],[4,-5]],[[6468,9294],[5,-8],[2,1],[2,-5],[-5,-7],[2,-3],[-2,-1],[-2,5],[-5,3],[-1,4],[-6,4],[-7,1],[-1,4],[8,3],[7,1],[3,-2]],[[8831,9302],[-7,-5],[-7,4],[-5,-2],[-6,3],[0,2],[6,2],[15,1],[4,-5]],[[0,9304],[8,2],[8,-1],[8,2],[7,-1],[12,-2],[8,-4],[9,-8],[7,-3],[2,-4],[-1,-3],[-8,-5],[-7,-2],[-13,-1],[-17,-5],[-10,-1],[-6,3],[-7,1],[9995,-1],[-6,-4],[-14,-1],[-8,-3],[-2,0],[-5,13],[8,10],[9,5],[9,8],[5,1],[4,3],[-9995,1]],[[7155,9347],[-13,0],[-7,1],[0,3],[10,7],[3,5],[6,4],[4,0],[15,-5],[3,-4],[-6,-4],[-4,-1],[-7,-5],[-4,-1]],[[7207,9372],[-2,-1],[-15,3],[-7,5],[1,3],[14,11],[5,-3],[5,-7],[0,-8],[-1,-3]],[[7073,9381],[-7,2],[-9,6],[3,5],[11,1],[10,-3],[-6,-2],[-3,-4],[2,-3],[-1,-2]],[[8339,9393],[-7,-2],[-6,0],[-4,4],[3,2],[6,1],[8,-4],[0,-1]],[[6536,9406],[12,-3],[10,0],[8,-3],[-1,-4],[-5,-6],[-1,-3],[1,-4],[-3,-7],[-8,0],[-5,-11],[-5,-1],[-2,-7],[1,-9],[3,-5],[-3,-6],[-1,-6],[-2,-4],[5,-4],[4,-10],[5,-11],[18,-23],[12,-10],[5,-3],[12,-5],[4,-4],[-5,-4],[-6,-1],[0,-2],[-3,-1],[-14,3],[-3,5],[-7,-1],[8,-7],[-4,-1],[-8,5],[-1,-2],[-4,2],[-1,-2],[-6,1],[0,3],[-13,-1],[-10,0],[-6,4],[-1,-4],[-8,4],[-17,4],[-9,3],[2,2],[4,1],[-1,8],[3,2],[5,-1],[-1,3],[3,1],[4,-2],[2,1],[-7,4],[-9,6],[1,2],[-3,1],[-3,-1],[-2,4],[0,4],[3,3],[-2,1],[-12,-3],[-7,1],[-7,2],[-7,-3],[-6,-1],[-4,1],[-6,5],[-2,4],[-3,10],[1,7],[4,7],[6,5],[7,-1],[8,1],[3,6],[4,2],[2,3],[1,6],[4,6],[-1,2],[3,5],[-7,1],[-4,3],[1,3],[7,5],[6,2],[6,-1],[3,1],[-3,3],[-2,8],[2,5],[3,2],[8,2],[3,2],[9,-1],[7,1],[13,5],[9,-1],[6,-3]],[[6962,9393],[-8,-2],[-7,0],[-3,-1],[-3,3],[3,8],[-1,8],[4,5],[22,4],[6,-2],[6,-7],[2,-1],[6,-7],[-1,-3],[-20,-3],[-6,-2]],[[7131,9414],[-3,-1],[-12,2],[-4,3],[5,2],[14,-6]],[[7096,9414],[-3,1],[5,4],[10,2],[3,-1],[-6,-6],[-9,0]],[[8948,9440],[13,-6],[19,-13],[4,-7],[0,-12],[-1,-1],[-7,0],[-17,2],[-6,0],[-21,3],[-24,8],[-10,-1],[-13,-5],[-3,0],[-3,5],[6,1],[7,0],[6,2],[6,4],[3,4],[5,9],[6,5],[6,0],[17,3],[7,-1]],[[8458,9437],[-5,1],[-1,3],[6,1],[3,-3],[-3,-2]],[[7320,9450],[-4,-2],[-7,2],[-10,1],[3,2],[6,1],[11,-1],[1,-3]],[[7296,9451],[-2,-2],[-7,2],[-1,2],[5,2],[3,-1],[2,-3]],[[8782,9441],[-2,-2],[-12,10],[-2,4],[-5,3],[-2,4],[7,-2],[11,-7],[7,-6],[-2,-4]],[[8916,9446],[-14,-5],[-3,0],[-6,5],[-3,10],[3,3],[6,2],[15,0],[2,-1],[2,-5],[-2,-9]],[[7353,9472],[-1,-3],[-8,1],[-1,2],[8,3],[5,0],[-3,-3]],[[8148,9469],[-3,-8],[-2,-2],[-6,-2],[-5,-6],[-17,3],[-15,7],[-4,5],[2,1],[8,0],[2,1],[4,9],[34,-6],[2,-2]],[[7406,9502],[2,-1],[7,2],[4,-3],[-3,-5],[-3,-2],[-15,2],[-3,2],[2,3],[9,2]],[[7281,9527],[2,-4],[-5,0],[-10,-4],[-5,5],[6,5],[6,-2],[-1,5],[7,1],[0,-6]],[[9076,9525],[8,-1],[12,5],[26,-2],[2,-2],[-1,-6],[3,-2],[8,-1],[6,2],[28,-2],[12,-7],[6,4],[2,-1],[-5,-12],[-9,-4],[-13,-5],[-7,-1],[-15,0],[-21,2],[-6,1],[-13,8],[-13,2],[-12,7],[-16,5],[3,11],[5,9],[3,2],[6,-4],[1,-8]],[[8775,9527],[-6,-2],[-8,1],[4,10],[-1,4],[4,12],[3,-3],[1,-4],[9,-7],[-6,-7],[2,-3],[-2,-1]],[[9245,9568],[-2,-2],[-7,3],[7,3],[2,-4]],[[8889,9551],[6,0],[3,-2],[3,-6],[3,-3],[6,0],[4,4],[-1,5],[1,8],[2,3],[8,4],[5,5],[7,-2],[20,-12],[13,-4],[7,-1],[10,3],[4,0],[43,-16],[3,-3],[-9,-3],[-6,-4],[-2,-3],[4,-5],[-13,-10],[-11,-3],[-11,2],[-6,0],[-6,2],[-7,6],[-6,7],[-1,6],[1,6],[4,1],[4,5],[-2,3],[-11,1],[-13,-4],[2,-11],[3,-7],[12,-14],[7,-2],[5,-6],[-9,-5],[-11,-3],[-6,4],[-5,6],[-7,-1],[-6,-2],[-35,-6],[-7,3],[-7,4],[-6,-3],[-3,-9],[-3,-4],[-7,-2],[-6,3],[-24,7],[-9,11],[-6,2],[-7,4],[-7,9],[1,5],[8,-1],[-2,12],[2,11],[2,2],[10,-1],[-6,9],[4,4],[4,2],[5,0],[7,5],[6,1],[11,4],[2,0],[9,-7],[8,-3],[15,-11]],[[7680,9577],[2,-3],[-7,-1],[-1,-5],[-6,2],[-7,0],[-5,2],[-10,1],[2,4],[6,-2],[5,3],[11,-2],[3,2],[7,-1]],[[7689,9572],[-3,0],[0,4],[3,5],[4,0],[2,-3],[-6,-6]],[[8123,9597],[5,-7],[-3,-3],[-7,5],[-4,0],[-5,5],[9,-1],[5,1]],[[7710,9595],[-5,0],[-3,5],[2,1],[6,-6]],[[9142,9599],[-21,-1],[1,2],[8,4],[15,0],[-3,-5]],[[6881,9574],[-24,-9],[-35,-10],[-25,-6],[-13,-4],[-14,-3],[-3,0],[-9,-4],[-8,-2],[-27,-8],[-13,-6],[-7,-1],[-6,-5],[-6,-3],[-7,-7],[-4,1],[-7,-3],[-1,-3],[6,-1],[0,-4],[-4,-2],[-2,-3],[-7,-3],[-7,1],[1,-7],[-5,-1],[-10,4],[-2,-4],[-1,-6],[-5,-3],[-11,2],[3,-10],[-1,-5],[-5,-6],[-19,-7],[3,-6],[0,-6],[-6,-2],[-5,4],[-5,-1],[5,-4],[2,-5],[-2,-3],[-9,-6],[-5,-8],[-9,-3],[-6,-1],[-11,3],[-13,1],[-8,2],[-7,3],[-7,0],[-13,-6],[-4,8],[2,3],[-11,9],[-2,4],[18,10],[7,1],[2,5],[8,8],[9,14],[2,1],[19,2],[1,1],[-5,3],[-8,1],[-2,4],[2,1],[7,8],[8,6],[8,4],[-4,3],[-10,-1],[-5,7],[6,4],[7,-1],[6,-4],[2,0],[9,8],[-2,5],[5,3],[9,0],[8,-2],[5,9],[9,5],[-1,4],[10,4],[12,7],[33,8],[2,5],[4,1],[13,1],[2,-2],[4,0],[3,3],[-1,6],[4,3],[17,1],[19,-4],[9,1],[5,-1],[15,5],[26,4],[7,2],[7,4],[7,1],[18,6],[6,8],[21,10],[12,2],[8,3],[13,-1],[13,-3],[6,-4],[6,-6],[1,-3],[-2,-3],[1,-5],[-10,-7],[-11,-10],[-11,-3]],[[7673,9620],[-12,-3],[-4,3],[-12,-1],[4,3],[12,2],[19,6],[1,-4],[-8,-6]],[[7485,9629],[-6,0],[-4,2],[4,5],[9,0],[2,-1],[-5,-6]],[[7982,9632],[-3,0],[-1,3],[3,3],[7,-1],[2,-3],[-8,-2]],[[6366,7852],[1,-2],[-4,-1],[0,-3],[-1,-2],[-7,-5],[-4,-1],[0,-4],[2,-6],[-2,-2],[-2,3],[-3,0],[-7,-9],[-2,-2],[-3,-1],[-7,-4],[-3,2],[-2,-2],[0,-4],[-4,6],[-1,-1],[2,-4],[0,-7],[-3,-4],[-1,-7],[-4,-15],[-3,-7],[-1,-5],[-2,3],[-2,-5],[-3,-4],[-2,-4],[-2,-8],[2,-5],[4,-2],[3,-3],[6,-8],[2,-5],[3,-19],[1,-13],[3,16],[2,3],[0,-5],[-2,-7],[-1,-10],[-1,-7],[1,-6],[0,-3],[-2,-11],[2,-4],[3,-4],[2,-5],[1,-7],[9,-19],[5,-10],[4,-13],[1,-2],[4,-5]],[[6109,7684],[-3,3],[-15,25],[-17,22],[-2,2],[-9,3],[-4,3],[-9,16],[-4,-2],[-3,0],[-3,2],[-4,5],[-1,7],[-3,4],[-7,5],[-8,4],[-1,3],[7,4],[2,2],[-6,5],[4,3],[7,-7],[3,-2],[1,2],[11,4],[0,6],[-1,0],[0,5],[1,5],[5,8],[3,12],[2,3],[3,-3],[2,5],[3,0],[3,-1],[2,1],[-5,9],[-6,9],[-3,-1],[-2,1],[-3,7],[-1,6],[3,0],[3,-1],[5,5],[2,0],[7,-2],[0,4],[-1,5],[5,3],[5,2],[9,7],[4,1],[0,4],[-2,9],[-5,0],[-3,-5],[-7,-2],[-3,0],[2,4],[-2,1],[-2,-3],[-8,-5]],[[6060,7896],[0,5],[2,3],[0,2],[-2,2],[0,2],[2,4],[0,9],[3,3],[4,0],[3,3],[2,3],[3,7],[2,1],[5,-1],[3,0],[6,-1],[10,1],[1,3],[0,4],[3,12],[2,4],[0,2],[-3,1],[1,4],[0,3],[-2,7],[-2,2],[-3,1],[2,9],[2,4],[3,-1],[3,1],[0,2],[-7,4],[-2,5],[2,2],[4,1],[2,4],[3,4],[2,6],[0,4],[-2,3],[0,4],[1,3],[-2,3],[-2,0],[-2,-2],[-3,1],[-9,9],[-4,0],[-4,7],[-4,-2],[-3,0],[-8,8],[-5,0],[-5,5],[-3,-1],[0,-5],[-3,-1],[-3,2],[-7,8],[-3,7],[0,4],[-5,7],[-2,0],[-6,-4],[-4,0],[-6,-3],[-4,-5],[-3,4],[-4,1],[-2,-1],[-5,8],[-3,0],[-3,1],[-3,-1],[-3,-4],[-2,1],[-2,5],[-3,5],[-1,4],[1,2],[0,7],[-1,2],[-1,6],[-1,3],[0,5],[-1,1],[-2,-1],[-3,5],[0,3],[-1,2],[-2,-1],[-4,0],[-4,-1],[-6,3],[-7,1],[-1,1],[2,3],[-2,6],[0,8],[-2,3],[0,4],[7,2],[1,2],[-1,2],[-8,11],[-2,10],[-3,6],[-3,4],[-2,1],[-8,0],[-4,1],[-4,-1],[-7,-5],[-7,1],[-4,2],[-2,0],[-2,-2],[-2,-9],[-5,-4],[-4,0],[-6,3]],[[5777,8609],[1,5],[0,5],[-1,4],[1,4],[2,0],[3,-4],[3,-2],[2,3],[1,5],[2,2],[2,-2],[4,-1],[4,0],[2,1],[2,5],[4,5],[14,-2],[13,-5],[1,5],[-5,4],[-3,5],[-4,4],[-5,1],[-5,-2],[-9,1],[-7,8],[-4,3],[-4,6],[3,1],[1,6],[-2,3],[-2,1],[-9,-6],[-11,-2]],[[5856,9203],[5,-1],[12,-5],[6,2],[3,6],[2,1],[4,-2],[1,2],[-2,4],[0,3],[12,-5],[5,-4],[10,-3],[2,-2],[0,-3],[-3,-4],[-4,0],[-16,4],[-3,-2],[2,-2],[5,-2],[1,-5],[7,1],[7,-2],[4,1],[-2,-5],[1,-1],[11,4],[2,-1],[-1,-9],[-2,-7],[3,-1],[5,9],[2,1],[15,1],[21,-6],[5,1],[3,2],[16,-4],[21,-11],[31,-18],[17,-16],[2,-4],[7,-1],[5,0],[20,-15],[7,-1],[-2,6],[2,0],[6,-8],[5,-4],[5,-7],[10,-5],[6,-2],[2,-15],[2,-3],[0,-7],[4,-3],[3,-1],[0,-5],[-3,-12],[-2,-5],[-19,-21],[-11,-9],[-23,-10],[-17,-3],[-8,0],[-13,1],[-8,2],[-9,6],[-9,2],[-6,2],[-11,0],[-28,7],[-15,11],[-9,-4],[-3,4],[2,2],[-9,3],[-7,0],[-3,3],[-5,2],[-3,-1],[-9,4],[-4,4],[-5,7],[3,3],[-15,4],[-14,1],[2,-2],[6,-1],[9,-6],[-1,-5],[11,-10],[2,-3],[7,-1],[1,-4],[-1,-2],[1,-3],[12,-5],[-2,-3],[-1,-4],[15,-5],[8,-6],[9,-10],[2,-5],[0,-6],[-5,-14],[-2,-4],[-3,-3],[3,-7],[4,-6],[4,-11],[0,-10],[4,-3],[-3,-3],[1,-8],[4,-7],[7,-5],[10,1],[4,-2],[10,-9],[4,-8],[2,-2],[10,-4],[7,-2],[11,-5],[2,0],[5,4],[10,4],[2,4],[0,4],[-2,7],[-1,6],[-3,3],[-3,1],[-12,-1],[-3,2],[-4,5],[-8,11],[-4,4],[-2,5],[0,6],[3,-1],[4,3],[2,11],[8,1],[10,-5],[14,-13],[3,-1],[8,0],[3,-4],[2,0],[13,-4],[14,-9],[5,1],[3,6],[6,5],[4,1],[5,-2],[1,1],[-4,13],[-4,4],[-10,16],[-1,6],[2,9],[14,8],[5,6],[5,7],[11,3],[11,6],[8,8],[9,12],[3,3],[7,-2],[4,-4],[6,-1],[5,1],[7,0],[9,-6],[2,-4],[-3,-7],[6,2],[3,-1],[5,-5],[3,1],[-1,9],[3,10],[3,5],[5,10],[-2,8],[0,8],[-1,4],[-3,5],[-6,4],[-6,1],[-2,4],[0,4],[2,7],[5,13],[6,23],[-1,2],[0,9],[-1,4],[-21,16],[-2,4],[3,0],[16,-7],[4,-1],[25,2],[12,-2],[11,-3],[7,-11],[15,-19],[0,-7],[-7,-1],[-8,0],[-17,-4],[-5,-4],[-12,-12],[-1,-4],[1,-3],[6,-4],[11,-6],[9,-17],[6,-3],[6,0],[5,-2],[6,1],[22,6],[5,3],[1,4],[2,13],[4,11],[-1,7],[11,4],[10,2],[5,0],[2,3],[-4,5],[3,2],[8,1],[22,11],[8,6],[13,8],[4,2],[7,1],[7,2],[8,4],[10,4],[4,0],[4,-5],[-3,-4],[2,-2],[4,0],[2,2],[6,3],[1,3],[-2,1],[-2,5],[-6,1],[9,7],[21,11],[10,4],[11,1],[5,-2],[-14,-3],[-2,-2],[5,-2],[-2,-3],[-4,-9],[5,-6],[0,-6],[-3,-3],[-4,1],[-3,-2],[-6,-1],[-3,-5],[7,0],[11,-2],[6,2],[3,0],[7,2],[7,-6],[4,1],[1,10],[7,6],[7,5],[7,0],[7,4],[10,-1],[10,0],[8,-3],[6,-1],[9,5],[20,14],[2,-3],[3,5],[15,5],[4,0],[2,-6],[3,-3],[4,-6],[-4,-3],[-3,-5],[-1,-9],[6,-3],[9,-3],[3,0],[5,4],[1,5],[-2,6],[1,6],[7,-1],[9,2],[4,3],[8,12],[-2,9],[-5,-2],[-9,20],[-5,8],[3,3],[8,2],[7,8],[6,2],[21,-5],[24,-2],[20,-4],[23,-8],[11,-5],[9,-7],[-1,-4],[4,1],[8,-4],[6,-1],[6,-3],[2,-3],[8,-2],[7,-5],[2,0],[9,-4],[7,-1],[4,-7],[14,-10],[2,-3],[12,-7],[6,-5],[4,2],[9,13],[8,22],[-6,0],[-4,-2],[-3,0],[-8,8],[-7,10],[-1,11],[-2,3],[-7,3],[-4,3],[-15,7],[-3,-3],[-5,1],[1,10],[3,10],[6,1],[3,4],[-3,7],[0,4],[3,12],[1,14],[-4,5],[-9,-2],[-3,1],[-1,5],[5,9],[-5,-1],[-1,2],[8,12],[10,4],[19,11],[8,8],[6,10],[4,9],[6,22],[6,16],[9,16],[9,2],[-2,-5],[7,-1],[8,1],[13,0],[24,1],[12,-5],[5,0],[9,-2],[10,-6],[0,-12],[-1,-8],[-5,-19],[-6,-11],[-2,-7],[-5,-5],[-6,-4],[-1,-5],[6,-9],[14,-9],[3,-10],[1,-8],[-1,-21],[-1,-4],[-3,-3],[-2,-4],[2,-6],[1,-22],[1,-18],[-2,-6],[-1,-17],[2,-6],[3,-6],[3,-3],[11,-6],[10,-8],[1,-5],[-4,-3],[-9,-15],[1,-12],[0,-6],[-6,-10],[-10,-6],[-20,-33],[-5,-4],[-9,1],[5,-11],[0,-5],[-5,0],[-8,-4],[-4,-4],[-6,-1],[-4,1],[-5,3],[1,3],[7,6],[-3,0],[-3,-3],[-5,-1],[-5,4],[-4,5],[-6,-1],[-14,1],[-4,-1],[-1,-3],[2,-7],[2,-4],[6,-4],[8,-1],[8,-5],[10,-3],[22,1],[12,-2],[9,-5],[5,0],[7,5],[1,10],[1,3],[26,14],[5,3],[8,8],[2,5],[3,14],[2,5],[17,16],[3,5],[0,12],[-1,5],[-3,9],[-3,4],[-4,7],[3,14],[2,5],[16,7],[12,2],[15,4],[6,1],[4,-1],[4,-4],[3,-7],[11,-11],[3,-7],[1,-9],[0,-21],[-2,-10],[4,-2],[7,-6],[2,-3],[3,-1],[6,0],[17,1],[9,0],[-2,3],[-8,0],[-11,2],[-16,5],[-2,9],[4,16],[3,2],[6,2],[-2,13],[-4,8],[-3,16],[-5,0],[-4,3],[-19,9],[-18,7],[-12,1],[-4,-1],[-10,-7],[-7,-1],[-13,3],[-10,-2],[-4,2],[-2,3],[3,13],[-1,5],[-5,6],[-3,5],[1,6],[7,21],[3,6],[7,10],[4,8],[-1,4],[-16,24],[-6,11],[-10,7],[-2,3],[16,23],[8,4],[15,5],[9,5],[5,4],[3,7],[0,9],[-1,7],[-8,15],[5,3],[5,-1],[6,-3],[7,-12],[0,-7],[1,-5],[3,-5],[-6,-7],[-4,-11],[-3,-1],[-1,-8],[7,-10],[-2,-9],[-4,-3],[1,-6],[22,-7],[18,-1],[5,-4],[2,3],[16,-1],[13,-10],[7,-3],[6,-1],[12,1],[4,4],[-6,0],[-2,-2],[-6,1],[-3,2],[-3,4],[-5,10],[-8,3],[-6,-1],[-6,1],[-17,8],[-12,6],[-3,2],[-3,5],[-5,13],[11,6],[12,1],[5,-1],[14,-10],[6,0],[12,4],[1,3],[-6,8],[-7,1],[-8,-2],[-2,2],[2,4],[4,1],[10,7],[7,3],[7,1],[26,-1],[15,-9],[14,-4],[10,-5],[1,-5],[18,-13],[4,-2],[12,-1],[19,4],[6,-1],[7,-5],[-7,-12],[-2,-2],[-16,-9],[-3,-15],[3,-11],[-2,-6],[-3,-6],[1,-5],[2,1],[5,9],[4,11],[4,3],[4,1],[4,-3],[1,-5],[0,-7],[-1,-6],[-3,-10],[-5,-7],[-1,-4],[4,-7],[3,-1],[4,1],[1,3],[-2,7],[6,3],[6,1],[5,4],[2,8],[-11,25],[-5,7],[3,10],[5,11],[3,4],[0,6],[-6,10],[-4,3],[-16,3],[-10,10],[-2,8],[-3,2],[-14,5],[-8,0],[-5,2],[-9,7],[-2,8],[-2,3],[5,14],[-2,4],[-7,4],[-2,8],[-1,8],[6,6],[-1,6],[25,4],[9,1],[48,0],[4,2],[21,2],[9,2],[9,-3],[3,1],[7,0],[5,5],[10,2],[17,2],[8,0],[4,-4],[-9,-6],[-9,-5],[-8,-3],[-7,-5],[-1,-7],[1,-2],[7,-3],[6,-5],[10,-5],[2,1],[-23,15],[1,4],[4,4],[8,3],[21,2],[7,9],[5,3],[-10,4],[-14,18],[-3,3],[-11,2],[-5,2],[5,6],[6,2],[4,-1],[10,-7],[9,3],[-10,4],[-5,5],[-16,6],[-9,1],[2,5],[7,1],[2,4],[13,-8],[6,2],[5,3],[10,10],[1,4],[-9,3],[-5,0],[-1,3],[3,3],[4,1],[14,-3],[23,9],[7,4],[16,6],[8,0],[16,7],[23,4],[13,0],[10,4],[16,1],[5,2],[26,4],[4,4],[-3,2],[-5,-3],[-8,3],[-3,-3],[-3,1],[-1,4],[3,5],[4,-3],[4,4],[3,1],[8,-3],[5,3],[8,1],[11,-1],[2,3],[13,-3],[9,2],[6,0],[9,-2],[4,-2],[-2,-4],[-9,-6],[2,-2],[6,4],[16,4],[2,-1],[-3,-5],[11,2],[9,5],[4,1],[4,-3],[4,2],[1,3],[7,1],[7,4],[13,5],[9,-2],[18,-7],[6,3],[-6,6],[-15,8],[-3,3],[-5,2],[2,2],[20,-2],[10,1],[10,-1],[15,3],[6,-3],[7,0],[8,-2],[2,3],[-13,3],[-6,-1],[-2,2],[5,8],[-2,5],[-3,2],[0,5],[2,5],[5,2],[3,4],[7,6],[30,18],[14,6],[12,1],[13,5],[5,0],[17,-4],[4,-3],[10,-3],[11,-1],[5,-2],[5,-6],[-9,-2],[-10,-7],[-13,-4],[-16,-2],[-4,-2],[40,0],[2,-6],[3,0],[9,3],[6,0],[10,-2],[6,1],[10,-2],[4,-4],[-14,-11],[-8,-9],[-7,1],[1,-5],[7,0],[4,-2],[9,3],[13,-1],[8,4],[3,8],[5,1],[12,-1],[21,2],[17,-2],[13,2],[18,-2],[8,-2],[6,-3],[5,-1],[8,-8],[-2,-3],[8,1],[3,-2],[6,-1],[2,-10],[3,-5],[-2,-3],[3,-1],[6,3],[3,4],[-5,4],[3,1],[5,-1],[3,-4],[5,-16],[8,1],[1,-4],[-7,-15],[-4,4],[-10,2],[-14,8],[-5,0],[8,-5],[6,-10],[6,3],[5,-5],[6,-2],[5,-3],[-3,-9],[-20,-16],[-20,-9],[-9,-7],[-16,-4],[-11,-7],[-14,-5],[-4,-5],[-11,-3],[2,-3],[-3,-6],[-8,-4],[-12,-4],[-25,-19],[-12,-4],[-14,0],[-16,-17],[-14,-1],[-14,-20],[-8,-7],[1,-3],[8,3],[10,6],[4,6],[7,5],[18,2],[7,-1],[11,1],[7,4],[8,1],[1,3],[7,0],[14,4],[7,6],[8,-2],[6,1],[16,9],[10,4],[2,2],[-4,3],[-9,-3],[-8,-1],[-10,1],[-2,4],[6,8],[11,5],[22,-5],[2,7],[11,-2],[-9,-3],[2,-5],[3,-3],[11,-5],[10,-2],[7,0],[11,2],[4,5],[-3,7],[5,-2],[5,-5],[6,-11],[-1,-3],[-6,-8],[3,-3],[6,-3],[0,-17],[-3,-6],[-4,-3],[-3,-4],[2,-6],[3,-4],[10,-1],[1,1],[-9,3],[-4,6],[5,7],[4,7],[1,5],[-1,5],[2,3],[7,4],[-5,2],[-4,3],[-1,4],[9,2],[6,3],[21,1],[15,5],[32,-1],[22,-5],[32,0],[12,-3],[1,-3],[-5,-1],[-8,0],[-2,-6],[1,-7],[15,-7],[13,-3],[9,-5],[5,-1],[19,1],[11,-3],[10,2],[14,0],[4,-4],[7,-1],[7,0],[5,1],[1,2],[-7,2],[1,3],[3,1],[10,-4],[5,-1],[4,3],[4,8],[5,3],[-4,4],[-5,10],[0,6],[3,6],[2,1],[8,-2],[4,4],[13,3],[4,0],[7,-2],[23,-11],[-1,-4],[6,1],[3,2],[6,1],[4,2],[2,-3],[-2,-5],[8,-5],[8,6],[5,7],[20,-4],[6,-2],[2,-4],[7,-3],[-1,-4],[10,0],[8,-4],[-1,-3],[2,-2],[5,0],[-7,-8],[-7,-4],[2,-1],[9,0],[6,-6],[1,-4],[-12,-7],[-5,-2],[-6,-1],[3,-2],[16,-1],[5,-2],[3,-7],[0,-9],[-3,-4],[-10,-1],[-13,10],[-7,3],[-11,7],[-2,-1],[3,-6],[5,-3],[9,-10],[16,-19],[5,4],[5,2],[5,-7],[-7,1],[-7,-2],[-3,-3],[2,-4],[6,0],[2,-5],[5,-6],[10,-16],[7,-3],[8,-7],[10,-4],[3,5],[2,-2],[2,-8],[3,-3],[7,1],[5,4],[3,4],[6,12],[7,8],[-1,6],[9,22],[9,11],[5,-9],[9,-9],[8,-7],[7,-3],[12,-3],[16,0],[3,4],[6,3],[10,2],[5,4],[9,1],[15,-3],[19,-9],[19,-15],[4,-2],[2,1],[-4,5],[4,2],[3,5],[-5,2],[0,3],[2,1],[1,4],[5,4],[3,1],[6,-3],[4,4],[3,0],[6,-4],[6,-7],[3,0],[8,3],[10,0],[-1,4],[-7,8],[1,11],[-10,4],[8,2],[5,9],[8,3],[-14,1],[-5,-3],[-7,0],[-1,9],[12,10],[24,0],[7,1],[10,4],[-2,3],[0,5],[-9,7],[1,3],[17,-2],[6,-4],[15,-4],[40,-1],[5,-2],[17,-2],[25,-4],[8,-1],[6,-3],[10,-1],[5,-2],[0,-5],[-22,0],[-7,2],[-8,0],[-4,-1],[-5,-4],[-12,-3],[4,-4],[5,-1],[15,5],[44,3],[6,-1],[0,-3],[-6,-7],[-6,-5],[-8,-5],[-3,0],[7,11],[-5,1],[-7,4],[-3,-2],[-1,-7],[2,-2],[0,-5],[-9,-3],[-4,0],[-6,2],[1,-4],[-3,-6],[2,-2],[4,-1],[17,3],[7,3],[8,7],[15,16],[6,5],[9,3],[27,-2],[15,-3],[15,-5],[8,-4],[5,-6],[2,-6],[-4,-3],[-17,-1],[-6,-1],[-4,-5],[2,-1],[14,-2],[12,-5],[4,-4],[15,1],[2,-4],[-12,-11],[16,6],[4,1],[5,-1],[12,-5],[5,-4],[9,-11],[-9,-2],[21,-9],[8,0],[18,3],[10,0],[17,5],[17,4],[16,0],[8,3],[22,0],[21,-1],[16,-2],[19,-6],[18,-8],[13,-11],[3,-6],[2,-11],[0,-5],[-5,-8],[1,-5],[-4,-7],[3,-5],[8,-3],[18,-5],[4,-2],[1,-9],[3,-21],[7,-6],[1,-5],[-6,-14],[-7,-7],[7,1],[7,15],[4,2],[1,3],[0,9],[-2,8],[0,6],[2,4],[11,10],[6,4],[6,2],[16,2],[7,2],[8,-1],[6,0],[7,2],[6,-1],[9,-6],[35,-2],[6,-2],[23,-3],[2,0],[5,4],[16,10],[6,0],[3,-2],[5,-7],[3,-8],[2,-10],[3,-2],[5,0],[20,-9],[2,-9],[6,-8],[13,1],[13,2],[12,12],[0,5],[-3,8],[-4,7],[-4,11],[-12,3],[1,3],[5,4],[4,6],[-1,14],[11,0],[10,-1],[20,-5],[17,-2],[8,-2],[6,-4],[6,-2],[2,6],[2,1],[8,-3],[6,-1],[11,0],[13,-1],[14,0],[12,3],[10,-3],[9,-5],[14,-7],[13,-2],[15,-7],[14,-2],[12,-4],[2,-5],[9,-2],[17,-15],[-9995,-1],[5,-3],[6,-2],[3,1],[3,-4],[14,-6],[5,-4],[-2,-1],[2,-7],[12,-4],[6,-5],[1,-3],[-2,-4],[4,1],[4,3],[-2,3],[-12,8],[1,1],[16,-10],[4,-4],[-3,-3],[7,0],[3,-1],[3,-3],[7,-3],[44,-26],[3,-9],[0,-4],[-4,-5],[6,0],[4,5],[3,-2],[2,-4],[-3,-8],[0,-6],[4,-10],[1,-8],[-3,-3],[-2,-6],[2,-1],[5,0],[5,-4],[3,-11],[1,0],[4,6],[4,1],[2,-5],[-2,-9],[2,1],[5,7],[1,4],[-1,3],[-3,2],[-5,1],[-3,5],[4,4],[2,5],[-2,9],[-2,2],[-4,1],[-1,3],[-5,0],[-1,3],[18,1],[6,2],[5,-3],[10,-2],[-5,-6],[-1,-6],[3,-1],[2,2],[-1,6],[2,1],[5,-3],[11,-1],[0,3],[-12,3],[0,2],[10,-2],[10,-4],[7,1],[6,-3],[7,-6],[5,-8],[6,-5],[7,-4],[12,-12],[0,-2],[5,1],[3,-6],[11,-3],[2,-5],[-3,-3],[-5,2],[-11,-6],[-4,-4],[0,-12],[-3,-2],[-7,1],[-6,3],[-8,7],[0,-4],[8,-7],[2,-4],[-1,-2],[-4,-1],[-4,2],[-11,-1],[-5,-1],[0,2],[-5,2],[-3,0],[-5,6],[-8,1],[-2,-1],[6,-4],[6,-6],[-2,-3],[5,0],[1,-1],[-3,-9],[-10,-1],[3,-2],[5,0],[3,-1],[2,-9],[-5,-5],[-11,-5],[-3,1],[-3,-1],[0,-2],[5,-3],[0,-2],[-3,-3],[2,-5],[7,-2],[5,-4],[1,-6],[-10,0],[-1,5],[-3,2],[-2,-1],[1,-8],[-2,-4],[-8,-1],[-3,4],[0,3],[2,2],[-2,2],[-2,-3],[-6,-4],[-9,5],[-6,8],[-3,3],[-7,5],[-13,5],[-6,-1],[-4,1],[-3,4],[-6,4],[-3,4],[0,13],[-2,6],[-5,7],[-13,5],[-14,4],[-3,-1],[-9,-6],[-6,-1],[-17,0],[-5,3],[-1,3],[1,9],[-5,3],[-3,4],[-4,10],[5,-1],[2,6],[3,4],[1,7],[-2,2],[-4,-7],[-4,-3],[-6,3],[-2,5],[-4,-2],[0,-7],[-8,-2],[-2,3],[-2,-9],[-1,-7],[2,-6],[8,-6],[2,-3],[1,-4],[-5,-11],[-3,-8],[-2,-3],[-8,-7],[9994,-2],[-5,-6],[-6,-6],[-8,-2],[-13,-9],[-5,-2],[-6,4],[-15,3],[-5,3],[-6,9],[-3,2],[-2,3],[-8,4],[-7,-3],[0,-1],[9,0],[5,-4],[2,-5],[-4,-4],[-7,4],[-7,-1],[-4,1],[-10,6],[-8,-7],[-10,-3],[-9,-1],[0,-1],[7,0],[9,2],[5,2],[6,5],[3,-1],[4,-6],[1,-5],[4,-1],[7,-3],[3,0],[6,5],[9,3],[2,-2],[-1,-9],[0,-8],[7,-8],[8,-5],[5,1],[2,8],[5,-6],[2,-8],[-1,-7],[3,-2],[3,0],[2,-18],[-8,-3],[1,-2],[5,-1],[2,-2],[-1,-7],[3,2],[-1,4],[1,2],[4,-11],[3,-4],[8,-5],[2,-3],[0,-4],[-4,-4],[3,-7],[4,-1],[2,-5],[0,-5],[-8,-10],[-3,-3],[-2,-4],[0,-4],[-4,2],[-27,11],[-9,2],[-9,0],[-2,1],[0,3],[2,5],[-5,1],[-2,2],[-2,-1],[-2,-5],[1,-4],[5,-2],[0,-1],[-7,-2],[-6,-1],[-7,-6],[-3,-4],[-20,-9],[-5,-3],[-5,-2],[-2,-4],[-11,-5],[-2,0],[-6,-7],[-6,0],[-4,-1],[-9,-7],[-6,2],[-6,-9],[-7,-9],[-2,0],[-6,4],[-1,-2],[1,-4],[2,-3],[-2,-1],[-3,1],[-2,-1],[1,-3],[-3,-3],[-3,0],[-3,-2],[-1,-2],[1,-4],[-5,-3],[-4,-5],[-2,-1],[-4,-4],[-3,1],[-7,-7],[-15,-12],[-4,-1],[-5,-4],[-1,-5],[-2,-5],[-2,-12],[-3,-5],[-5,1],[-5,5],[-2,5],[0,4],[-2,2],[-6,10],[-9,7],[-2,3],[-12,-2],[-9,1],[-9,-1],[-11,-3],[-3,-3],[-11,-3],[-8,-6],[-14,-21],[-3,-4],[-4,-1],[-2,7],[1,6],[2,5],[2,10],[0,4],[1,4],[-4,0],[-7,-7],[-10,-7],[-5,-2],[-3,-4],[-6,-2],[0,-9],[-2,-5],[-4,-1],[-2,2],[-3,7],[-4,4],[-4,0],[-7,-5],[-3,2],[-7,2],[-6,-8],[-2,-1],[-4,-6],[-1,-5],[-1,-10],[0,-13],[-5,-10],[-2,1],[-2,-2],[1,-5],[-1,-3],[-3,-2],[-6,-8],[-5,-5],[-9,-15],[-2,-10],[-3,-12],[4,-11],[3,-3],[6,-3],[2,0],[1,7],[4,3],[2,0],[11,-6],[3,-3],[-1,-9],[-7,-9],[-5,-7],[0,-7],[1,-8],[0,-16],[1,-4],[2,-2],[4,2],[3,-1],[2,-3],[0,-7],[3,-19],[-4,-5],[-4,-6],[-2,0],[-4,2],[-6,9],[2,6],[8,7],[-9,2],[-5,-5],[1,-8],[-2,-2],[-8,-6],[-2,-2],[-9,-25],[-1,-9],[0,-8],[3,-13],[7,-14],[0,-8],[-10,-13],[-3,-1],[-9,1],[-5,4],[-5,-1],[-5,-2],[-7,-7],[-6,-8],[-6,-5],[-2,-4],[-2,-7],[-2,-13],[0,-6],[2,-3],[1,-4],[-2,-6],[0,-4],[3,-6],[1,-9],[-2,0],[-5,6],[-6,1],[-12,-7],[-5,-4],[-6,-8],[-2,1],[-1,5],[-2,2],[-2,-1],[-2,-4],[4,-2],[1,-3],[-2,-11],[-1,-3],[0,-15],[-4,-16],[-7,-17],[-7,-11],[-6,-4],[-3,-4],[-1,-4],[-8,-11],[-10,-12],[-2,-2],[-1,5],[0,4],[-1,6],[-4,5],[-1,4],[0,30],[-4,27],[0,8],[-4,6],[-2,7],[-1,7],[0,8],[-4,43],[-2,10],[-5,35],[-3,19],[-1,20],[0,8],[2,26],[2,16],[7,36],[3,5],[13,14],[5,7],[7,18],[0,6],[-2,6],[-3,4],[2,4],[3,1],[7,-3],[6,1],[6,13],[9,-2],[6,2],[2,0],[1,4],[11,11],[9,8],[5,6],[3,5],[4,5],[4,6],[7,19],[14,15],[5,9],[9,5],[10,12],[6,11],[9,7],[2,5],[5,10],[1,3],[6,4],[12,7],[8,7],[10,1],[3,3],[7,4],[-4,6],[1,4],[8,9],[3,6],[-1,4],[-4,2],[2,11],[4,4],[1,9],[0,10],[4,14],[2,3],[9,8],[2,0],[6,-3],[6,-1],[3,-2],[0,4],[2,1],[3,-1],[0,3],[-10,1],[-7,3],[-6,6],[-4,2],[-5,0],[-25,-9],[-3,-5],[2,-5],[-2,-2],[-2,-5],[-1,-6],[0,-6],[-3,-9],[0,-6],[5,-3],[1,-2],[-1,-3],[-4,-5],[-2,-1],[-2,3],[-2,6],[-3,1],[-1,-4],[-9,1],[-5,-7],[-32,-33],[-4,-4],[-4,-8],[-8,-1],[-8,-6],[1,5],[0,6],[5,11],[-6,2],[-5,-3],[-3,-3],[-3,0],[1,4],[4,6],[-2,10],[1,1],[7,13],[2,6],[2,8],[0,6],[-4,1],[-13,-9],[-4,-2],[-2,4],[-2,1],[-4,6],[-6,1],[-7,-4],[-7,-2],[-6,0],[-5,-3],[-3,-1],[-7,3],[-9,0],[-3,-3],[-8,-4],[-5,-7],[-6,-5],[-2,-12],[-8,-6],[-8,-9],[-5,-13],[-4,-5],[-8,-8],[-13,-10],[-11,-16],[-3,-12],[-5,-3],[0,-10],[-2,-4],[-1,-4],[1,-3],[4,0],[7,4],[10,-6],[6,-5],[-1,-5],[1,-4],[-4,0],[-6,-1],[-3,-2],[-7,4],[-6,-6],[-6,-2],[-4,2],[-5,7],[-9,-1],[-3,-7],[-5,-1],[-7,-9],[-7,2],[-5,4],[-2,0],[-5,-2],[-2,-5],[-10,-2],[-11,0],[-6,12],[11,5],[6,-1],[8,1],[7,3],[-2,4],[-7,0],[-4,2],[-8,12],[-4,2],[-5,1],[-5,0],[-5,-7],[-8,4],[4,2],[-6,2],[-23,10],[-9,-2],[-7,-6],[4,-8],[-2,-1],[-6,0],[-3,3],[-3,-5],[1,-4],[4,2],[2,-2],[-1,-5],[-5,-2],[-7,1],[-6,8],[-11,-1],[-5,-6],[-5,-1],[-13,6],[-7,0],[-7,5],[-3,-2],[-4,-12],[-6,-3],[-4,2],[-3,8],[-2,2],[-5,2],[-30,-2],[-10,2],[-7,0],[-10,-4],[-9,2],[-17,-8],[-7,-5],[-8,-8],[-8,-15],[-4,-6],[-7,-7],[-10,-6],[-6,-7],[-2,-5],[-7,-23],[-12,-7],[-4,-8],[-2,-2],[-5,-3],[-3,-6],[-2,-2],[-7,-4],[-6,-10],[-9,-7],[-12,-19],[-2,-7],[-2,-4],[-11,-17],[-3,-2],[-5,-8],[-6,-4],[-4,-6],[-7,-6],[-9,-7],[-3,-3],[-5,-10],[-12,-11],[-5,-2],[-8,-10],[-1,-2],[0,-4],[1,-6],[2,-2],[3,-1],[11,-6],[11,2],[10,0],[3,1],[3,-1],[0,-9],[-1,-6],[-1,-17],[-2,-7],[1,-8],[3,-1],[2,3],[4,1],[3,-2],[3,12],[-2,2],[-2,4],[1,3],[7,6],[8,0],[-6,-9],[-2,0],[-1,-2],[3,-4],[4,-3],[6,-1],[-1,-3],[-4,-2],[-3,-9],[-9,-8],[1,-2],[14,1],[6,3],[8,7],[3,10],[4,3],[2,0],[0,-8],[-8,-13],[-1,-4],[5,1],[2,2],[4,10],[2,17],[0,10],[-2,5],[1,1],[12,-6],[6,-1],[10,5],[3,-2],[2,-3],[8,-8],[2,-3],[3,-11],[10,-13],[8,-6],[6,-9],[5,-2],[0,-6],[-2,-5],[-4,-5],[-8,4],[0,-3],[6,-8],[4,-3],[1,-11],[-1,-6],[-3,-6],[1,-4],[4,-6],[3,-2],[2,-3],[-3,-7],[-1,-8],[-3,-4],[-3,-7],[-6,-6],[-2,-12],[-4,-11],[-1,-10],[-4,-15],[-1,-14],[1,-24],[1,-2],[2,-1],[-1,-3],[-4,-7],[0,-5],[2,-4],[0,-9],[-3,-15],[0,-3],[-2,-7],[-1,-6],[1,-4],[1,-1],[-4,-11],[-2,-15],[-1,-6],[-4,-5],[-6,-9],[-2,-5],[-9,-11],[-6,-15],[-4,-15],[-12,-18],[-2,-10],[-3,-8],[-2,-12],[-3,-5],[-3,-12],[-9,-18],[-3,-7],[-7,-10],[-8,-14],[-9,-13],[-2,-5],[-4,-6],[-4,-9],[-6,-9],[-1,-6],[-2,-4],[-4,-3],[-3,-4],[-10,-23],[-1,-4],[0,-4],[-6,-9],[-4,-9],[-6,-5],[-6,-8],[-15,-15],[-4,-5],[-8,-7],[-4,0],[-7,-4],[-4,-3],[-3,1],[-2,5],[-4,-1],[-4,5],[-4,0],[-2,2],[-5,-2],[1,21],[-1,4],[-2,-4],[-6,-7],[-4,-1],[0,4],[4,6],[-2,1],[-4,-2],[-2,-3],[-6,-12],[-4,-10],[-2,-3],[-4,-9],[-4,2],[-2,-1],[-5,2],[-2,-1],[4,-7],[-3,-12],[-1,-1]],[[7990,9684],[-6,-5],[-4,3],[-9,-1],[-16,3],[4,2],[28,1],[3,-3]],[[7951,9688],[-4,-1],[-2,4],[8,1],[3,4],[5,-1],[2,-4],[-6,0],[-6,-3]],[[7857,9748],[-4,-8],[-9,-14],[4,0],[10,11],[4,0],[10,4],[10,1],[4,-1],[4,-7],[9,-2],[1,-5],[5,-3],[11,1],[5,-4],[4,-11],[-1,-5],[-13,-9],[-9,0],[-22,-5],[-20,0],[-6,-4],[-5,2],[-25,-2],[-14,0],[-5,-3],[-13,-5],[-20,-6],[-9,2],[-6,3],[4,3],[3,5],[13,9],[5,12],[2,2],[0,6],[4,4],[6,3],[7,1],[-1,5],[5,7],[1,6],[7,6],[6,1],[2,6],[6,1],[5,-6],[7,-1],[-2,4],[1,5],[5,2],[11,-3],[9,-5],[-6,-3]],[[7117,9771],[6,0],[25,-5],[6,-4],[-26,0],[0,3],[-14,2],[-3,4],[6,0]],[[7780,9769],[-6,-1],[1,5],[3,1],[7,-2],[-5,-3]],[[7573,9773],[-6,-1],[-8,1],[-13,6],[-9,3],[-7,4],[-2,4],[10,4],[21,0],[12,-3],[24,-3],[9,-2],[-5,-5],[-19,-7],[-7,-1]],[[6427,9788],[1,-1],[-28,0],[-10,3],[17,4],[7,3],[9,-3],[-1,-3],[5,-3]],[[6657,9789],[-10,-2],[-12,3],[3,4],[15,4],[7,-2],[3,-5],[-6,-2]],[[7712,9800],[6,-3],[3,-5],[-3,-1],[-4,-6],[3,-2],[6,2],[6,-1],[6,4],[1,6],[9,0],[12,-2],[2,-2],[10,-3],[9,-9],[-4,-2],[-4,-6],[0,-7],[-2,-3],[0,-8],[-4,-3],[-11,2],[-3,-1],[8,-3],[5,-6],[7,-1],[5,-9],[-14,-7],[-17,-1],[-12,-2],[-3,1],[-20,2],[-9,2],[-9,4],[-3,3],[-11,1],[-20,0],[-5,5],[-11,-3],[-9,3],[-5,3],[0,3],[-4,1],[-7,11],[-13,3],[-13,0],[-6,2],[9,8],[13,4],[11,7],[2,7],[11,4],[7,5],[8,-4],[6,4],[10,1],[16,-1],[20,3],[12,1],[3,-1]],[[6389,9795],[-14,5],[10,4],[10,0],[2,-3],[-8,-6]],[[6540,9807],[-8,-3],[-6,2],[7,4],[7,-3]],[[6584,9811],[2,-2],[-2,-12],[-2,-2],[-33,1],[-2,1],[8,6],[0,8],[18,-1],[1,2],[10,-1]],[[6486,9802],[-25,-1],[-2,2],[-6,0],[-4,3],[10,2],[8,6],[9,1],[9,-5],[10,-3],[-2,-3],[-7,-2]],[[6609,9798],[-5,-1],[-11,2],[-3,3],[-3,12],[-5,4],[2,2],[13,-1],[26,-1],[18,-4],[4,-3],[-24,-1],[-3,-2],[-1,-5],[-8,-5]],[[6510,9818],[-3,-3],[-13,4],[2,2],[-1,5],[15,-4],[0,-4]],[[6317,9840],[12,-2],[10,1],[6,-1],[6,-5],[-1,-6],[-17,3],[-7,5],[-5,-1],[-5,-4],[-11,-6],[-10,-1],[-8,-6],[-6,0],[-5,7],[-9,-2],[-7,1],[-7,3],[-1,3],[34,5],[13,1],[6,3],[12,2]],[[6726,9839],[0,-6],[-3,-6],[-11,-2],[-2,-3],[-9,-2],[-6,-5],[-9,1],[-13,4],[-17,-4],[-10,5],[0,6],[2,5],[6,6],[14,2],[5,-3],[6,0],[23,4],[8,2],[14,-2],[2,-2]],[[6395,9845],[15,-1],[18,-10],[4,0],[3,-3],[-15,-5],[-6,-4],[-18,0],[-13,-2],[-1,-4],[-6,-3],[-21,-1],[-4,-4],[7,-1],[1,-6],[-5,-1],[-6,2],[-5,-5],[-6,2],[-6,-3],[-6,0],[-3,2],[10,5],[-3,2],[-12,-1],[-3,-2],[-10,0],[-9,6],[28,12],[6,2],[9,0],[5,2],[7,-4],[12,1],[3,2],[-1,9],[3,6],[7,3],[21,4]],[[7222,9840],[-26,-2],[-3,1],[6,7],[17,1],[17,-2],[-2,-4],[-9,-1]],[[6697,9846],[-9,-1],[-14,1],[-7,2],[15,6],[24,1],[3,-3],[-3,-3],[-9,-3]],[[6519,9855],[21,-5],[19,0],[9,-1],[12,-5],[21,-7],[-3,-2],[-21,-6],[-26,-2],[-5,1],[-4,4],[-12,2],[-13,0],[-16,4],[-1,3],[9,2],[1,5],[6,7],[3,0]],[[6627,9851],[8,-8],[-1,-7],[-16,-1],[-10,2],[-5,5],[-10,2],[-5,6],[12,1],[11,5],[4,-2],[12,-3]],[[6409,9851],[-7,0],[-4,4],[6,4],[4,0],[6,-4],[-5,-4]],[[6759,9831],[-10,1],[-13,7],[16,8],[21,1],[6,1],[6,10],[14,1],[6,-1],[10,-7],[-1,-3],[3,-4],[-13,-7],[-12,-3],[-33,-4]],[[7542,9857],[-9,-5],[-35,3],[-2,4],[5,2],[29,-1],[10,-1],[2,-2]],[[7680,9853],[6,-7],[19,-6],[8,-1],[4,-4],[0,-4],[-18,-2],[-5,-7],[6,-10],[5,-2],[-7,-5],[-37,-4],[-24,-1],[-11,-2],[-20,-6],[-6,0],[-18,5],[-22,4],[-3,3],[-13,3],[-3,5],[10,7],[19,3],[7,5],[12,10],[-13,-2],[-5,1],[5,7],[4,1],[4,4],[8,3],[15,1],[13,3],[7,0],[12,5],[3,4],[18,1],[5,-4],[6,-2],[9,-6]],[[6646,9866],[-16,1],[-2,3],[12,2],[6,-2],[0,-4]],[[6605,9880],[5,-3],[12,-1],[4,-3],[-6,-2],[-14,-1],[4,-7],[-2,-3],[-13,-3],[-18,5],[-12,-3],[-5,3],[-13,-2],[-4,2],[-3,5],[8,1],[11,-2],[7,5],[8,2],[11,7],[20,0]],[[6767,9884],[-3,-1],[-27,2],[-8,4],[14,1],[26,-2],[-2,-4]],[[6618,9890],[-11,0],[3,5],[4,1],[31,2],[4,-2],[-1,-4],[-30,-2]],[[5820,5103],[1,0],[6,3],[1,-1],[1,-6],[3,1],[3,4],[1,3],[4,8],[1,4],[1,2],[2,1],[2,0]],[[5846,5122],[-1,-4],[1,-4],[4,-9],[2,-2],[1,-4],[2,-6],[0,-23],[1,-4],[1,-6],[-1,-7],[-1,-4],[-1,-2],[-4,0],[-1,-2],[-1,0]],[[4525,6382],[-1,3],[3,30],[0,2]],[[6165,6146],[2,5],[3,-5],[0,-8],[-1,1],[-1,3],[0,2],[-3,-1],[-2,1],[-3,6],[-1,4],[1,0],[2,2],[0,7],[1,-1],[1,-3],[0,-8],[1,-1],[-1,-2],[1,-2]],[[6024,6645],[-1,0],[-4,9],[-5,4],[0,2],[6,-5],[5,-7],[-1,-3]],[[6344,6827],[2,-5],[1,-6],[3,-12],[4,-10],[1,-4],[0,-7],[-1,-3],[3,-5],[5,-5],[5,-3],[-2,-3],[3,-8],[3,-7],[4,-2],[5,-11],[7,-7],[5,-10],[-4,2],[0,-5],[1,-5],[4,-7],[1,-5],[-2,-12],[-3,1],[2,-16],[2,-5],[1,-8],[2,-3],[4,-8],[2,-7],[1,-13],[7,-17]],[[6423,6601],[2,-3],[2,1],[0,-3],[-3,-11],[7,-3]],[[6443,6277],[-7,-1],[-6,-2],[-7,-2],[-9,-3],[-7,-1],[-18,-6],[-8,-2],[-9,-2],[-7,-2],[-4,-2],[-5,-5],[-7,-8],[-12,-12],[-4,-10],[-2,-6],[-7,-16],[-3,-9],[-2,-7],[-2,-12],[-2,-3],[-7,-7],[-4,1],[-3,7],[-4,11],[-12,-2],[-6,1],[-8,2],[-7,1],[-4,1],[-6,6],[-12,0],[-6,-1],[-5,0],[-6,-1],[-2,-1],[-2,0],[-2,-3],[-2,2],[-1,-1],[-3,2],[-2,3],[-1,3],[-4,2],[-1,0],[-3,-3],[-3,-6],[0,-2],[1,-3],[-2,-4],[-1,-5],[0,-15],[2,-5],[-1,-4],[-2,-2],[-1,-4],[-2,-5],[-5,-8]],[[6188,6126],[-1,5],[-1,7],[0,5],[-2,8],[-3,4],[0,5],[-2,5],[-3,5],[-1,7],[-1,11],[-7,13],[-8,12],[-3,8],[-4,14],[-2,11],[-6,13],[0,5],[-2,13],[-1,5],[-7,28],[-2,5],[0,4],[-1,2],[-4,4],[-4,10],[-11,16],[-5,1],[-5,6],[-3,7],[-3,13],[-6,13],[-5,20],[1,7],[0,5],[-1,8],[-2,7],[-1,6],[1,8],[0,10],[2,11],[-1,12],[-2,6],[0,4],[-3,6],[2,0],[-3,6],[-3,12],[-1,7],[-4,14],[-3,9],[-5,12],[-5,8],[-5,7],[-3,0],[-3,5],[-4,1],[-3,10],[-7,21],[2,8],[-1,6],[0,5],[-2,8],[-8,23],[-3,4],[-2,8],[0,8],[-5,4],[-7,28],[-4,10],[-2,7],[-5,11],[-3,10],[-5,10],[-4,18],[-7,17],[-3,3],[-7,1],[-3,2],[-2,-4],[-1,5],[2,6],[3,14],[1,13],[4,36]],[[5946,5728],[-6,0],[0,15],[2,7],[0,13],[-1,7],[-1,1],[-12,20],[-2,5],[0,1],[-7,5],[0,2],[1,2],[0,2],[-2,43],[0,3],[1,1],[0,16],[2,11],[0,5],[-13,0],[0,-12],[-18,0],[7,-17],[0,-2],[1,-6],[-1,-9],[0,-6],[3,-12],[-1,-1],[0,-2],[-13,-23],[0,-1],[-2,-9],[-2,-6],[-1,-1],[-3,-8],[-12,-24],[-2,-2],[-6,-1],[-4,0],[-1,-1],[-8,14],[-13,17],[-8,-9],[-3,-3],[0,-8],[-1,-4],[-2,-5],[-7,-3],[-3,-2],[-4,-4],[-1,-4],[-3,-5],[0,-8],[-22,1],[-1,2],[-3,13],[-3,0],[-20,1],[-3,-1],[-6,-6],[-3,0],[-3,2],[-10,25],[-2,3],[-3,6],[-3,5],[0,8],[-1,4],[-1,0],[-15,-5],[-2,0],[-3,-1],[-1,-1],[-1,-3],[0,-7],[-2,-7],[-4,-9],[-1,-4],[1,-9],[-1,-5],[0,-2],[-3,-6],[0,-12],[-3,-7],[0,-8],[-1,-2],[-6,-4],[-2,-3],[-2,-4],[0,-2]],[[5634,5812],[1,7],[1,9],[0,9],[-2,3],[-2,0],[-6,10],[0,26],[-3,2],[0,4],[-2,19],[1,5],[-2,7],[-3,2],[-7,-2],[-2,1],[-2,3],[-1,3],[1,4],[1,8],[3,7],[4,5],[2,4],[0,3],[1,4],[-1,4],[0,4],[-2,5],[-1,6],[0,4],[2,7],[3,4],[1,2],[2,2],[3,4],[1,2],[0,2],[-1,2],[-2,6],[0,6],[-1,4],[0,2],[2,5],[2,2],[3,1],[1,2],[0,8],[1,2],[1,6],[1,3],[2,3],[2,4],[1,4],[0,4],[-1,13],[2,5],[3,5],[4,-1],[6,1],[4,2],[2,0],[7,-2],[1,0],[0,38],[0,26],[0,26],[0,26],[0,25],[0,26],[0,26],[0,25]],[[6023,6450],[0,-13],[2,-10],[4,-15],[4,-8],[1,-5],[-1,-2],[-2,2],[0,-22],[2,-10],[-1,-9],[0,-16],[2,-19],[0,-12],[3,-28],[3,-16],[1,-4],[2,-2],[4,-1],[10,-16],[1,-5],[2,-5],[2,3],[2,-4],[6,-9],[1,-4]],[[5943,5426],[-7,-13],[-5,-10],[0,-2],[-2,-1],[-4,0],[-5,1],[-5,6],[-4,-5],[-3,-1],[-1,-1],[-4,-1],[-6,-2],[-4,-6],[-1,-4],[-3,1],[-3,3],[-1,6],[-3,5],[-5,-6],[-2,-1],[-2,0],[-3,4],[-4,2],[-2,0],[-3,-3],[-3,-5],[-2,-6],[0,-3]],[[4535,5895],[-1,2],[-1,5],[0,3],[6,4],[3,-1],[0,2],[-3,3],[-1,3],[-1,-2],[-1,-4],[-2,-2],[-1,3],[0,2],[1,2],[-1,10],[1,6],[-1,5]],[[4539,5966],[-1,6],[-1,4],[-3,4],[-1,4],[1,3],[3,3],[0,2],[-1,0],[-2,-2],[-1,0],[-1,5],[-2,7],[-2,11],[-3,4],[-3,10],[-2,3],[-3,2],[-2,-1],[-1,-4],[-2,6],[3,2],[8,8],[8,21],[8,26],[1,6]],[[7887,5260],[-4,-4],[-5,4],[1,5],[4,2],[4,-4],[0,-3]],[[4270,1818],[0,-4],[-5,3],[-1,2],[2,2],[2,0],[2,-3]],[[3968,2069],[3,-3],[2,2],[7,-1],[2,-5],[-1,-4],[3,1],[3,-4],[3,4],[3,-7],[3,-5],[1,-6],[1,-1],[4,1],[-1,-5],[1,-4],[3,-3],[-4,-4],[-4,-2],[-5,5],[-5,12],[-2,4],[-3,0],[-3,2],[-5,7],[-3,0],[-4,4],[-9,7],[-4,-1],[-2,2],[0,4],[4,4],[5,1],[0,-2],[4,-3],[3,0]],[[4841,4262],[-3,-1],[2,6],[2,0],[0,-4],[-1,-1]],[[4600,4724],[-1,0],[0,5],[2,-1],[1,-2],[-2,-2]],[[9635,4511],[-2,-1],[-1,1],[-2,5],[2,1],[1,-1],[2,-5]],[[9459,4504],[-2,-2],[-3,2],[-1,5],[-2,2],[-4,2],[-1,2],[-3,1],[-1,3],[1,2],[0,2],[2,-2],[10,-11],[3,-4],[1,-2]],[[9613,4564],[-3,-1],[-1,-1],[-2,-4],[-2,1],[-1,3],[1,1],[1,4],[1,1],[3,1],[3,-1],[1,-1],[-1,-3]],[[9491,4585],[3,-3],[2,0],[3,-2],[2,1],[2,-3],[4,-12],[0,-3],[2,-3],[-2,-1],[-3,2],[-2,-1],[-2,2],[-4,1],[-3,3],[-7,9],[0,4],[-1,2],[-1,5],[-2,2],[-3,1],[0,7],[5,-2],[5,-7],[2,-2]],[[9486,4629],[0,-8],[-2,4],[-1,-2],[-1,3],[0,18],[4,-15]],[[9436,4649],[6,-9],[3,1],[8,0],[7,-10],[2,-6],[2,-1],[1,-3],[1,-6],[-3,-3],[-2,-1],[-5,2],[-4,5],[-9,0],[-4,1],[-1,2],[-2,2],[-2,5],[-2,6],[0,11],[2,4],[2,0]],[[9448,4665],[2,-1],[2,-3],[2,-4],[-1,-3],[-2,2],[-1,0],[0,2],[-2,2],[-2,0],[0,3],[2,2]],[[9420,4658],[-3,1],[-1,2],[1,2],[2,2],[3,-2],[0,-3],[-2,-2]],[[9378,4679],[0,-2],[-2,0],[-4,3],[0,2],[4,0],[2,-3]],[[9393,4675],[-1,0],[0,2],[1,6],[1,-5],[-1,-3]],[[9390,4683],[-2,-4],[-2,1],[-2,4],[1,6],[2,1],[0,2],[3,-1],[1,-2],[-1,-3],[0,-4]],[[9370,4681],[-1,1],[-3,8],[0,3],[3,5],[1,0],[1,-3],[-1,-4],[-1,-2],[0,-4],[1,-4]],[[9434,4693],[-1,-1],[-3,5],[1,3],[1,1],[1,-2],[0,-2],[1,-4]],[[9464,4704],[7,-17],[-1,-3],[0,-2],[-1,-6],[1,-2],[2,-1],[3,-6],[1,-7],[2,-6],[0,-7],[3,-10],[0,-7],[-1,1],[-4,11],[-4,5],[-5,9],[-3,11],[-3,20],[2,4],[-4,10],[1,3],[2,-1],[2,1]],[[9381,4709],[2,-5],[2,-11],[-1,-3],[-1,0],[-1,-3],[-2,5],[-2,2],[-2,3],[-1,6],[0,4],[-1,1],[-5,-1],[-1,-4],[-2,1],[0,6],[3,3],[0,4],[3,6],[1,1],[3,-2],[1,-9],[1,-3],[3,-1]],[[9349,4713],[-1,-2],[-1,7],[0,6],[1,1],[1,-8],[0,-4]],[[9364,4716],[0,-1],[-3,1],[-2,6],[0,4],[1,4],[3,1],[2,-5],[0,-8],[-1,-2]],[[9351,4727],[-2,3],[0,4],[-3,5],[0,4],[1,4],[3,-2],[2,-5],[2,-2],[0,-3],[-3,-8]],[[9440,4692],[0,-2],[-4,5],[-3,6],[-8,7],[-2,3],[-1,0],[-4,6],[-4,3],[-3,5],[0,2],[-2,1],[-2,5],[-3,3],[-1,7],[-3,6],[8,-4],[3,-7],[3,-3],[2,-3],[2,-4],[3,0],[2,-4],[2,-1],[2,-2],[12,-17],[-2,-5],[2,-3],[1,-4]],[[9327,4775],[-2,-2],[-2,2],[2,7],[3,-4],[-1,-3]],[[9373,4761],[1,-2],[-2,-3],[-3,1],[-1,3],[-2,0],[-4,1],[-5,9],[-6,15],[-5,9],[-2,7],[1,2],[4,-2],[4,-7],[8,-8],[2,-3],[1,-9],[1,-3],[4,-7],[2,-2],[2,-1]],[[4651,5612],[-2,2],[-10,5],[3,3],[7,1],[2,-2],[1,-4],[-1,-5]],[[4679,5581],[-6,11],[-5,5],[-16,12],[0,3],[2,6],[-2,7],[0,5],[-2,-3],[-4,1],[-2,4],[-2,2],[-1,2],[-1,11],[-1,5],[-2,4],[-3,0],[-2,7],[-2,6],[1,3],[1,0],[2,-2],[2,-1],[2,5],[3,6],[0,2],[-2,-2],[-4,0],[0,-2],[-2,-1],[-1,7],[0,9],[4,0],[0,2],[-2,1],[-4,5],[0,4]],[[2560,5955],[-1,-1],[1,-6],[-2,-3],[-1,-3],[-7,0],[-7,2],[-2,-1],[-10,5],[-12,12],[-7,1],[-7,3],[-5,7],[-3,3]],[[6200,5846],[6,-9],[5,-18],[6,-15],[8,-13],[4,-5],[3,-2],[15,0],[11,13],[10,9],[4,1],[5,-2],[7,-1],[5,-2],[3,0],[12,11],[7,10],[5,4],[2,0],[6,-4],[9,2],[11,9],[4,1],[3,0],[6,-3],[1,0]],[[6358,5832],[0,-32],[0,-42],[0,-30],[-4,-13],[-5,-15],[-5,-17],[-12,-39]],[[6358,5832],[4,0],[9,5],[7,6],[13,4],[10,12],[1,5],[3,7],[5,3],[11,-9],[2,0],[-1,-5],[0,-5],[-3,-9],[-1,-10],[1,-15],[0,-27],[-1,-4],[0,-3],[3,0],[0,4],[3,-3],[2,-1],[0,-5],[-3,0],[-2,2],[-7,-5],[-1,-5],[-1,-19],[-1,-12],[0,-17],[-4,-10],[-2,-8],[-5,-15],[-3,-13],[-1,-7],[-5,-17],[-7,-14],[-3,-18],[-2,-10],[-3,-10],[-6,-18],[-3,-12],[-4,-22],[-2,-13],[-11,-39],[-11,-31],[-7,-27],[-13,-30],[-18,-39],[-23,-47],[-6,-10],[-25,-28],[-17,-25],[-8,-16],[-9,-14],[-7,-14],[-21,-46],[-4,-8],[-4,-11],[-5,-13],[-3,-7],[-4,-7],[-1,-5],[-3,-8],[-3,-13],[-5,-15]],[[3436,7881],[-2,-2],[-1,1],[1,6],[-1,10],[3,-1],[0,-3],[-1,-4],[2,-6],[-1,-1]],[[5184,5190],[-3,-4],[-1,1],[-1,3],[0,9],[1,4],[3,3],[2,1],[1,-5],[0,-5],[-2,-7]],[[5205,5274],[-1,-2],[-1,1],[0,3],[1,4],[1,1],[1,-1],[0,-3],[-1,-3]],[[3410,5503],[1,-1],[1,6],[0,6],[2,11],[3,3],[14,-3],[6,-3],[8,-5],[1,-5],[1,5],[-1,6],[2,4],[5,1],[8,-2],[6,3],[9,-1],[13,-4],[6,-3],[3,-3],[0,-12],[-1,-6],[-2,-8]],[[5625,8010],[0,-3],[-2,-2],[-5,-17],[-4,-7],[0,-10]],[[5376,7805],[2,1],[2,3]],[[5458,8426],[-1,-3],[-2,0],[0,4],[-1,10],[1,5],[6,17],[3,2],[4,15],[3,9],[2,-2],[0,-5],[-5,-12],[-1,-9],[-2,-2],[-7,-29]],[[5529,8515],[-2,-2],[-2,-4],[-3,-2],[-1,-13],[3,-5],[-2,0],[-4,-9],[-4,-2],[-2,-2],[-4,-11],[-2,-3],[-3,0],[4,9],[-2,3],[-1,5],[-2,3],[1,4],[0,12],[2,4],[2,2],[3,6],[4,4],[5,2],[2,-2],[1,4],[2,1],[5,-4]],[[5531,8520],[0,-4],[-2,0],[-1,3],[2,4],[5,0],[1,-1],[-5,-2]],[[5511,8583],[-2,0],[0,3],[3,2],[-1,-5]],[[5515,8609],[-1,1],[2,3],[2,-1],[-3,-3]],[[5670,8974],[-7,-2],[-6,3],[-3,-1],[-5,0],[-8,-4],[-5,2],[-5,5],[-6,-4],[-2,3],[-3,0],[-2,-6],[-1,-8],[-5,0],[2,-3],[-6,-1],[-1,-2],[2,-2],[-1,-2],[-7,-2],[-3,1],[-1,-5],[-2,0],[-1,-3],[2,-2],[2,-7],[-4,-6],[-4,-4],[-4,-8],[4,-5],[1,-5],[2,-5],[4,-5],[-2,-5],[-6,-4],[-6,-7],[-7,-18],[-9,-5],[-2,-3],[-5,-4],[-8,-3],[-4,-4],[-1,-4],[-2,-1],[-4,3],[-1,-2],[-3,0],[-2,-2],[-2,-5],[-5,-6],[-6,1],[0,-4],[-6,-1],[-2,-6],[-6,-4],[4,-2],[0,-4],[-6,-3],[-2,-3],[-3,0],[1,3],[-6,-1],[2,-6],[-2,-4],[4,-3],[-3,-1],[-3,-5],[-3,0],[-2,-3],[-2,0],[-4,4],[-1,-5],[1,-5],[3,-4],[1,-3],[-2,-3],[-1,-8],[-2,-9],[0,-5],[2,-6],[-4,1],[-3,2],[0,-4],[-2,-5],[0,-4],[1,-3],[-1,-4],[2,-4],[-1,-2],[0,-8],[1,-11],[2,-8],[-1,-6],[3,-4],[6,0],[3,-6],[2,0],[3,3],[3,0],[1,-4],[4,-6],[3,-3],[4,-1],[4,-5],[0,-6],[2,-2],[5,-2],[2,-3],[2,-5],[1,-7],[0,-4],[-2,-1],[-5,-5],[-4,-5],[-8,-7],[-4,-1],[-5,-4],[0,-1],[5,-1],[3,3],[4,0],[3,2],[2,-1],[1,-4],[-3,-2],[-3,0],[-1,-6],[-2,-4],[-5,-3],[-8,-6],[-2,1],[-2,-3],[-6,-4],[-3,-4],[-7,-4],[-3,-3],[-19,0],[2,-3],[8,0],[3,-1],[4,-6],[-3,-2],[-4,-1],[1,-8],[2,-5],[-2,-3],[0,-14],[-3,0],[-1,-6],[1,-3],[0,-11],[2,-4],[-1,-4],[-4,-9],[0,-7],[1,-5],[-2,-8],[-1,-7],[-2,-5],[-4,-7],[-1,-5],[-5,-16],[-2,-4],[-2,-2],[-6,3],[-3,0],[-5,-2],[-8,2],[-7,-1],[-2,-1],[1,-6],[-3,-1],[-3,2],[-8,-10],[-2,-9],[3,-5],[1,-6],[-4,-8],[-3,0],[-8,2],[-13,-5],[-12,4],[2,11],[0,8],[-1,4],[-3,4],[-6,15],[-3,9],[6,-4],[3,2],[-2,5],[-2,2],[0,3],[5,1],[2,4],[-1,5],[-5,3],[-4,9],[-4,5],[-7,18],[-3,13],[-3,-1],[-2,11],[0,4],[-4,2],[-1,14],[-4,2],[-3,7],[0,13],[-3,2],[-3,-1],[1,6],[-2,23],[-1,3],[0,7],[1,2],[3,1],[2,-3]],[[5891,3637],[-3,2],[-1,-9],[-1,-12],[1,-7],[-6,-1],[-8,1],[-5,3],[-6,8],[-4,11],[-1,7],[-3,2],[0,18],[1,2],[4,11],[2,7],[1,7],[4,8],[3,5],[2,1],[7,-8],[6,-6],[2,1]],[[3249,6224],[0,-3],[-2,1],[-1,2]],[[6542,4913],[0,-5],[-2,1],[0,4],[-2,2],[-1,3],[2,3],[3,-8]],[[5998,7178],[-2,13],[0,12],[1,9],[0,7],[-1,4],[-4,9],[2,16],[2,4]],[[5996,7252],[2,0],[4,-5],[1,0],[3,8],[3,2],[0,10],[3,3],[5,0],[0,2],[-3,11],[0,3],[1,11],[1,5],[1,1],[8,-2],[1,-4],[3,-3],[3,1],[4,-1],[3,0],[2,2],[11,7],[8,6],[5,-2],[2,0],[7,-9],[2,-1],[4,0],[5,-1],[7,0],[4,1],[5,2],[9,5],[13,11],[7,5],[3,1],[4,0],[4,-2],[4,-1],[2,1],[5,1],[10,3],[5,3],[4,6],[3,-4],[2,-7]],[[2990,6442],[4,-4],[0,-1],[-3,-1],[-1,1],[0,5]],[[3003,6441],[2,1],[3,-1],[1,-4],[-1,-1],[-1,2],[-3,0],[-1,3]],[[3003,6441],[-3,2],[-1,5],[2,0],[1,-5],[1,-2]],[[5044,5541],[-9,-4],[-3,-3]],[[7767,5559],[-1,4],[1,7],[1,-8],[-1,-3]],[[7751,5621],[1,-7],[-1,1],[-1,3],[1,3]],[[7737,5640],[-1,10],[2,-3],[-1,-7]],[[7732,5638],[0,-4],[-1,0],[-2,-3],[-1,9],[1,12],[1,2],[1,-4],[2,-1],[-1,-7],[0,-4]],[[7729,5705],[-1,2],[1,2],[1,-3],[-1,-1]],[[7778,5735],[1,-3],[-1,-4],[-3,-2],[0,9],[3,0]],[[7779,5742],[-1,-1],[-2,4],[0,2],[2,0],[1,-2],[0,-3]],[[7849,5856],[-1,-6],[-1,2],[0,3],[1,2],[1,-1]],[[7844,5874],[-1,-1],[-3,0],[0,10],[1,0],[2,-4],[0,-3],[1,-2]],[[7858,5858],[-1,-1],[0,4],[-3,7],[-1,7],[-4,11],[-2,-5],[-3,4],[-5,10],[-1,-1],[-2,6],[-3,5],[-9,9],[-7,-4],[-10,3],[-4,-3],[-2,2],[-1,4],[1,6],[1,12],[1,9],[-1,7],[1,3],[0,4],[-1,2],[-7,3],[-2,3],[-2,-3],[-8,-2],[-3,-3],[-3,-5],[-1,-6],[2,-4],[1,-7],[-4,-21],[2,-19],[-1,-11],[-1,-7],[-3,-6],[-1,-11],[-2,-5],[-3,-11],[-2,-15],[-1,-6],[-1,-12],[-5,-19],[-2,-10],[-2,-4],[1,-3],[0,-6],[-1,-14],[0,-11],[1,-6],[3,-12],[-1,-4],[0,-5],[2,-2],[2,-1],[9,6],[3,-2],[2,-10],[1,-25],[1,-5],[2,-4],[2,-5],[1,1],[2,-1],[1,-9],[5,-48],[1,-6],[-1,-3],[-1,10],[-1,5],[-3,0],[0,2],[2,4],[-2,7],[-3,-3],[0,-7],[1,-6],[5,-12],[1,-6],[2,-1],[3,1],[3,-6],[3,-5],[6,-8],[4,1],[4,2],[2,0],[3,-2],[3,-7],[5,-16],[9,-13]],[[7780,5554],[-7,18],[-5,7],[1,14],[-2,2],[-2,0],[-1,4],[1,8],[-2,-2],[-2,1],[-2,2],[-2,11],[-3,9],[-3,0],[-1,3],[0,7],[-2,4],[-3,3],[-2,3],[-3,11],[-1,3],[-2,2],[-2,-2],[-2,-8],[-2,1],[-2,2],[-1,11],[-1,7],[1,13],[2,12],[1,18],[2,12],[2,4],[2,16],[3,20]],[[6961,7541],[-2,3],[1,1],[1,-4]],[[6881,7324],[1,5],[1,13],[1,5],[4,9],[2,7],[3,5],[3,6],[2,8],[-1,4],[-5,8],[-2,5],[-1,7],[0,5],[3,12],[-1,4],[-2,2],[-10,0],[-1,7],[-1,2],[-6,3],[-1,3],[2,12],[1,1],[2,5],[5,3],[5,-1],[5,-2],[9,-2],[3,2],[2,4],[1,6],[0,6],[3,0],[1,1],[0,3],[2,-1],[1,1],[-2,6],[0,2],[4,1],[1,3],[-2,1],[-8,0],[1,3],[8,2],[8,-2],[1,1],[-1,5],[2,0],[0,2],[-3,14],[2,1],[1,3],[0,5],[3,4],[6,-7],[2,-1],[8,7],[4,2],[5,6],[2,6],[2,0],[3,-6],[3,-4],[-1,-4],[3,-2],[-1,-5],[-5,-5],[-4,-7],[0,-5],[4,-2],[2,-6],[1,-1],[7,2],[2,0]],[[6474,7418],[-2,6],[0,9],[1,-1],[1,-14]],[[6496,7334],[0,4],[-2,30],[0,7],[1,13],[0,7],[-1,7],[1,6],[0,7],[1,7],[-2,9],[-3,5],[0,6],[-3,0],[-4,5],[-4,2],[-2,0],[-3,-4],[0,10],[3,10],[2,-3],[5,-2],[3,1],[-2,6],[-2,1],[0,10],[1,4],[-1,2],[-2,1],[-3,0],[-8,2],[-1,-6],[-2,1],[-2,8],[-2,10],[0,10],[1,9],[2,8],[1,10],[2,10],[1,-4],[2,-5],[3,-4],[4,-2],[3,1],[3,2],[2,-1],[4,-8],[3,-1],[6,3],[3,1],[3,-2],[2,0],[-1,4],[0,4],[1,2],[5,-2],[5,4],[0,7],[-1,3],[0,3],[-14,18],[-3,5],[-3,20],[-3,13],[-3,2],[-4,0],[-9,-3],[-3,1],[-6,-7],[-2,-5],[-2,-10],[2,-4],[0,-2],[-2,-15],[-2,1],[-4,9],[-3,15]],[[6554,7563],[7,0],[22,-3],[2,4],[-2,7],[-2,23],[2,4],[2,2],[4,7],[1,3],[3,1],[8,1],[4,1],[3,9],[0,5],[3,4],[7,-4],[3,-8],[2,0],[0,3],[-1,4],[-6,10],[-2,1],[0,2],[3,3],[3,-1],[3,0],[2,1],[1,5],[8,-12],[5,-2],[2,0],[2,-3],[2,-7],[5,-3],[9,0],[3,-1],[4,-6],[-1,-3],[0,-6],[-1,-4],[4,-3],[3,-4],[0,-2],[-3,-2],[0,-4],[1,-3],[0,-3],[-2,-7],[0,-3],[11,-11],[2,-1],[6,2],[4,0],[1,-1],[6,-1],[1,-1],[4,0],[4,5],[5,-2],[7,-9],[2,-3],[2,-8],[2,-12],[2,-9],[3,-4],[2,-8],[2,-17],[1,-3],[2,-2],[3,-5],[7,-8],[4,-5],[13,-15],[6,-11],[6,-7],[6,-6],[4,1],[6,-9],[3,-3],[1,-2],[4,-3],[8,-8],[8,-11],[6,-6],[4,-1],[3,3],[7,-4],[2,-2],[4,-6],[7,-3],[2,-3],[0,-2],[-3,-8],[-1,-11],[0,-8],[1,-6]],[[8444,4645],[5,5],[6,4]],[[8469,4668],[3,5],[2,9],[2,3],[5,4],[12,5],[10,0],[10,1],[3,1],[3,2],[6,6],[3,-2],[4,-1],[2,-1],[1,-2],[-5,-9],[-6,-8],[-3,-2],[-4,-2],[-3,-2],[-2,-5],[-3,-3],[-6,-2],[-2,-3],[-5,-5],[-2,0],[-3,-1],[-9,-7],[-5,-7],[-4,-7]],[[8489,4714],[-2,-9],[-2,2],[3,7],[1,0]],[[141,3956],[0,-8],[-2,4],[0,2],[2,2]],[[134,3964],[1,2],[1,-2],[-2,-5],[-1,2],[-4,4],[1,2],[2,0],[2,-3]],[[167,4110],[-1,-4],[-2,4],[2,4],[2,-1],[0,-2],[-1,-1]],[[3304,5767],[-4,-3],[-12,-1],[-5,1],[3,6],[1,3],[3,1],[1,1],[1,15],[-1,4],[0,2],[-1,2],[-3,2],[1,2],[4,1],[2,2],[6,1],[7,2],[-3,-10],[0,-16],[2,-4],[-1,-4],[0,-5],[-1,-2]],[[3311,5827],[-1,0],[0,2],[3,4],[4,3],[1,0],[-1,-4],[-6,-5]],[[5303,7126],[-2,-2],[-3,1],[-1,2],[0,8],[5,0],[4,-6],[-3,-3]],[[5312,7185],[-4,-4],[1,4],[3,4],[0,-4]],[[5237,7311],[7,3],[7,9],[2,3],[15,8],[4,-2],[0,-3],[-1,-2],[1,-5],[2,3],[-1,4],[6,0],[3,-3],[0,-10],[4,-9],[-1,-5],[3,-3],[3,3],[2,5],[5,3],[5,8],[3,1],[2,-12],[-2,-2],[-2,-5],[-5,-15],[-4,-4],[-4,-6],[-1,-3],[0,-5],[1,-8],[2,-9],[3,-5],[3,-1],[6,-8],[0,-11],[1,-6],[2,-6],[-5,-12],[-2,-8],[-5,-12],[-4,-8],[-10,-11],[-2,-4],[-2,-8],[0,-5],[3,-12],[4,-7],[4,-4],[8,2],[-1,-5],[1,-5],[3,0],[2,1],[1,5],[4,-4],[2,-11],[3,-3],[-2,-4],[4,-2],[2,1],[3,-2]],[[5720,7495],[-6,-2],[-2,2],[2,4],[5,2],[2,-4],[-1,-2]],[[5996,7252],[2,5],[-4,18],[2,5],[4,7],[4,8],[0,8],[-1,3],[-3,3],[-4,-3],[-3,-4],[-4,-3],[0,-5],[-3,-3],[-4,-1],[-6,3],[-10,10],[-3,1],[-3,-2],[-8,-10],[-8,-16],[-9,-9],[-5,-2],[-2,1],[-14,-4],[-4,-3],[-7,4],[-5,4],[-2,5],[-5,11],[-3,5],[-6,4],[-12,11],[-11,3],[-9,1],[-2,-4],[0,-16],[-2,-4],[0,-8],[-1,-3],[-2,-1],[-3,2],[-1,2],[-4,-4],[-11,-5],[-10,6],[-6,8],[0,7],[-2,4],[0,6],[-2,1],[-2,-2],[-3,0],[-2,1],[-7,6],[-5,1],[-3,-8],[-2,-2],[-3,-1],[0,2],[2,5],[-8,-1],[-4,-3],[-3,0],[-2,2],[0,2],[4,2],[9,1],[2,2],[2,5],[4,4],[0,2],[-3,0],[-13,-1],[-8,1],[-1,-3],[-2,0],[0,6],[1,3],[2,-1],[5,3],[-1,5],[-3,3],[-1,2],[-4,3],[0,6],[-2,6],[-2,3],[0,2],[4,2],[1,9],[-1,6],[-2,0],[-6,5],[-1,-1],[-2,5],[-4,3],[-4,-2],[-3,3],[-3,2],[-1,2],[2,5],[2,0],[0,4],[-2,7],[1,4],[1,1],[2,-1],[2,-4],[1,-4],[0,-4],[1,-4],[2,4],[2,-2],[2,0],[7,2],[1,2],[-5,0],[-2,2],[-2,4],[-2,9],[4,4],[3,6],[-2,3],[-2,-1],[-1,2],[0,3],[1,3],[0,3],[-4,9],[-1,1],[1,3],[3,5],[2,5],[0,2],[-2,1],[-9,-2],[-4,-2],[-7,-1],[0,5],[1,5],[0,13],[1,7],[4,2],[4,10],[8,11],[7,0],[3,3],[5,0],[1,-4],[4,-3],[7,0],[2,1],[1,2],[-3,6],[1,2],[3,0],[4,-3],[-2,-5],[10,1],[9,-1],[3,1],[8,0],[1,2],[-2,2],[-4,2],[-1,2],[4,6],[3,1],[22,5],[-1,1],[-12,3],[-3,2],[-4,5],[-2,4],[0,6],[1,4],[2,3],[4,0],[17,-4],[12,2],[13,-6],[12,1],[3,3],[3,9],[17,16],[6,8],[7,4],[11,5],[9,7],[3,0],[23,-3],[15,0],[7,6],[4,-2],[-1,-4],[1,-4],[4,-9],[8,-6],[10,5],[3,-2],[4,-15],[3,-5],[3,-3],[3,-1],[2,4],[6,2],[5,-5],[3,-6],[10,-4],[9,-2],[4,-4],[13,-5],[5,1],[8,5],[16,5],[11,-7],[3,-1],[2,1],[4,-2],[3,1],[12,8],[4,5],[4,1],[12,12],[3,6]],[[5777,7601],[-1,-7],[2,-7],[4,-10],[4,-5],[17,-13],[3,-1],[-2,-10],[-1,-3],[-5,-2],[-13,6],[-4,0],[-2,-1],[-4,-4],[-5,2],[-7,-3],[-2,-7],[-5,-9],[-8,-7],[-5,-4],[-9,-14],[-4,-8],[-3,-2],[0,3],[1,4],[0,6],[3,5],[3,3],[7,6],[2,4],[-6,0],[-6,-1],[-4,1],[-3,-1],[-1,5],[-1,2]],[[8288,6596],[1,-4],[-1,-2],[-3,1],[3,5]],[[8360,6486],[-2,-7],[-2,-13],[0,-14],[-1,-6],[-2,2],[-2,4],[0,8],[-3,11],[-3,5],[-2,2],[-2,4],[-1,5],[-2,5],[-2,15],[-2,6],[0,7],[2,11],[-1,7],[1,8],[0,3],[13,44],[4,10],[2,4],[6,18],[1,2],[8,5],[2,6],[4,1],[2,-2],[2,-5],[5,-5],[1,-5],[-2,-5],[-2,-8],[1,-6],[0,-7],[-3,-14],[-3,-13],[-1,-11],[-2,-11],[-1,-15],[-3,-20],[-2,-6],[-4,-11],[-4,-9]],[[6102,4724],[-2,-1],[-1,3],[2,2],[1,4],[4,6],[1,0],[-2,-10],[-2,0],[-1,-4]],[[6096,4828],[2,-13],[0,-2],[-2,-1],[-1,2],[-1,4],[-1,-1],[-2,5],[-2,0],[-2,6],[1,5],[0,9],[2,4],[1,8],[1,-5],[0,-8],[2,-10],[2,-3]],[[6106,4901],[0,-20],[-2,-8],[-1,-3],[-2,2],[-1,2],[2,15],[-1,11],[3,-2],[2,3]],[[6088,4913],[0,-5],[-2,-12],[0,-4],[-1,-6],[-1,-4],[-2,-17],[-2,-6],[-3,-14],[0,-11],[2,-15],[3,-8],[2,-2],[2,-3],[3,-8],[1,-7],[5,-4],[2,-8],[0,-6],[-3,-5],[-2,-8],[-2,-10],[0,-15],[1,2],[3,-4],[0,-11],[-3,-20],[0,-5],[2,-16],[3,-8],[0,-3],[-1,-2],[5,-14],[0,-13],[2,-9],[0,-9],[2,-6],[0,-5],[-2,-5],[4,-1],[4,-8],[2,0],[2,-2],[2,-3],[5,-6],[2,-5],[0,-1]],[[5913,4641],[-1,2],[-3,3],[-4,3],[-4,4],[-1,3],[-6,2],[-3,3],[-2,0],[-3,1],[0,6],[-3,3],[-2,-1],[-2,0],[-4,6],[0,5],[-2,4],[-3,3],[-8,-1],[-3,4],[-2,4],[-2,5],[-1,7],[-1,4]],[[5846,5122],[3,0],[2,1],[2,2],[2,1],[18,0],[10,0],[15,0],[10,0],[15,0],[18,0]],[[5888,7845],[0,-3],[-9,3],[-3,3],[0,2],[12,-5]],[[6060,7896],[-1,-1],[-9,1],[-8,-1],[-6,-9],[-3,0],[-5,-3],[-3,-3],[-4,-6],[-3,3],[-4,0],[-3,-2],[-4,-4],[-3,-1],[-4,1],[-6,-2],[-12,-14],[-4,-10],[-3,-5],[-3,-1],[7,10],[0,5],[-1,4],[-5,-10],[-3,-1],[-3,-3],[0,-12],[5,-16],[6,-15],[6,-8],[3,0],[5,5],[7,-1],[2,3],[6,2],[8,-4],[-4,-9],[0,-5],[-1,-5],[-5,-2],[-5,0],[-5,-1],[-5,5],[-3,1],[-3,-1],[-3,-7],[-6,-5],[-1,-5],[-6,1],[-5,-1],[-7,-5],[-5,-10],[-6,-7],[-4,-2],[-4,1],[-3,2],[-6,7],[1,3],[4,17],[-1,4],[-1,7],[-5,5],[-3,-1],[-2,1],[-8,9],[-4,1],[-4,-2],[-2,1],[-1,3],[9,11],[9,9],[3,1],[6,4],[5,7],[-2,8],[-4,-2],[-5,4],[-2,3],[-7,-3],[-4,0],[-9,-2],[-4,2],[-8,8],[-3,1],[-3,0],[-1,3],[6,2],[0,4],[-8,2],[-3,2],[-2,3],[5,0],[4,-2],[7,-1],[7,-2],[1,3],[-1,2],[-7,2],[-4,7],[-1,4],[1,4],[-2,4],[0,-12],[-1,-4],[-2,-1],[-7,2],[-1,4],[-3,-6],[-2,-1],[-5,1],[-10,-4],[0,-5],[-3,-10],[-5,-11],[0,-1],[-8,-13],[-6,-4],[-5,-4],[-3,2],[-3,-4],[0,-5],[2,-4],[2,-11],[-1,-5]],[[3517,3240],[-2,-2],[-3,-14],[-6,-13],[-1,-8],[-6,-8],[-5,-9],[-2,1],[-3,-4],[-15,-12],[-5,2],[-4,0],[-4,5],[-8,2],[-6,-2],[-7,-5],[-3,0],[-4,2],[-2,5],[-11,6],[-9,13],[-10,0],[-8,-2],[-4,10],[-7,12],[-5,11],[-1,11],[1,12],[1,15],[0,4],[2,3],[2,0],[2,4],[2,10],[-2,8],[0,11],[-2,5]],[[678,6278],[-2,-2],[-1,0],[-6,6],[0,18],[-2,12],[-2,9],[1,5],[3,3],[2,7],[-2,9],[1,5],[1,1],[6,-6],[11,-10],[3,-7],[1,-7],[2,-1],[1,-5],[4,-7],[-1,-4],[-6,-8],[-7,-3],[-6,-9],[-1,-6]],[[643,6380],[-2,-2],[-2,1],[0,4],[-2,5],[3,1],[3,-3],[1,-3],[-1,-3]],[[653,6389],[0,-1],[5,2],[4,-4],[1,-2],[3,-3],[0,-5],[-3,-4],[-6,-2],[-3,1],[0,5],[-1,5],[-2,0],[-2,2],[-2,4],[0,3],[1,4],[2,1],[1,-3],[2,-3]],[[632,6405],[6,-1],[3,-1],[5,-1],[-1,-3],[-3,-3],[-4,2],[-8,1],[1,3],[0,4],[1,-1]],[[616,6419],[2,0],[2,-7],[-1,-3],[-3,-1],[-3,4],[-2,-1],[-4,0],[0,4],[-3,6],[0,3],[-1,3],[4,0],[3,6],[2,0],[3,-8],[0,-5],[1,-1]],[[550,6441],[-2,-2],[1,6],[3,6],[2,0],[-1,-3],[0,-3],[-3,-4]],[[572,6447],[-2,-4],[-1,2],[-3,0],[-1,3],[-3,2],[-1,3],[2,6],[4,4],[6,0],[1,-4],[0,-6],[-2,-6]],[[2766,6631],[-5,-10],[0,2],[3,6],[0,3],[2,2],[1,3],[0,3],[2,3],[1,0],[-4,-12]],[[2300,6690],[-3,10],[-3,28],[1,-1],[4,-29],[1,-8]],[[2295,6756],[-1,1],[3,12],[1,1],[-3,-14]],[[2304,6790],[1,7],[3,6],[1,-2],[-5,-11]],[[2359,6862],[5,8],[1,3],[2,0],[-3,-5],[-5,-6]],[[2449,6882],[-1,0],[-4,5],[0,2],[3,2],[2,-3],[1,-3],[-1,-3]],[[2521,6916],[-3,-1],[1,3],[2,1],[0,-3]],[[1712,7074],[-4,1],[-1,5],[-2,5],[1,1],[1,-4],[4,-7],[1,-1]],[[1682,7097],[-2,-1],[-2,4],[2,0],[1,-3],[1,0]],[[1712,7106],[1,-4],[-2,1],[-2,-1],[0,3],[-1,3],[-2,1],[0,3],[5,-4],[1,-2]],[[1665,7137],[-2,-1],[-2,1],[-2,5],[5,1],[2,-2],[-1,-4]],[[1669,7146],[6,-3],[3,2],[1,-2],[-1,-1],[-7,-2],[-2,1],[0,5]],[[2901,7213],[-4,-2],[0,1],[4,3],[1,12],[1,5],[-1,10],[1,-1],[0,-16],[-1,-10],[-1,-2]],[[2938,7517],[-1,0],[1,6],[4,2],[0,-2],[-2,-5],[-2,-1]],[[2985,7544],[-2,-4],[2,0],[6,6],[4,2],[1,-2],[-6,-7],[-3,-1],[-3,-3],[-6,-3],[-12,-7],[-2,0],[-10,-3],[-5,1],[0,2],[-2,0],[-1,-3],[-3,-1],[0,3],[1,3],[3,6],[5,4],[1,-1],[2,4],[3,0],[3,2],[3,-2],[6,3],[6,0],[6,1],[2,2],[1,-2]],[[3055,7560],[-2,-1],[-5,2],[4,2],[2,3],[1,-6]],[[3041,7567],[-8,-3],[3,7],[2,0],[3,-4]],[[3017,7573],[-1,-1],[0,6],[1,0],[0,-5]],[[3020,7573],[-1,-1],[-1,2],[0,3],[1,4],[2,2],[-1,-10]],[[3093,7729],[-2,-1],[0,4],[1,0],[1,-3]],[[3105,7737],[-3,-1],[0,-4],[-3,3],[0,4],[3,5],[2,-1],[1,-6]],[[1600,7913],[-3,0],[-1,2],[2,1],[2,-3]],[[1597,7925],[-1,-1],[-2,2],[2,4],[1,-5]],[[1595,7957],[1,-4],[4,-6],[0,-3],[-2,0],[0,2],[-3,2],[-1,2],[0,5],[-1,2],[-2,1],[-1,3],[0,3],[3,6],[1,0],[2,-3],[-1,-2],[-4,-3],[0,-1],[3,-1],[1,-3]],[[1588,7973],[-1,-1],[-2,2],[0,5],[1,1],[2,-7]],[[1582,7977],[-2,-1],[-2,2],[0,5],[2,0],[2,-4],[0,-2]],[[1589,7987],[-1,-3],[-2,-2],[-3,2],[0,3],[2,2],[4,-2]],[[3135,7785],[-1,-2],[2,-8],[-1,-3],[0,-3],[3,-1],[0,-3],[-5,-8],[-5,1],[-3,-3],[-2,0],[-2,-4],[-3,-1],[-3,1],[-2,-7],[-2,0],[0,-2],[-2,-2],[-2,6],[-1,1],[-3,0],[-3,-4],[-2,4],[-2,-7],[0,-7],[-2,0],[-1,3],[-5,1],[0,3],[1,3],[-1,1],[1,3],[-1,2],[-1,-3],[-3,-3],[0,-5],[-3,-10],[0,-5],[-2,-3],[-3,-3],[-3,1],[-3,-3],[-1,-3],[-4,-1],[0,4],[-1,2],[-1,-2],[-1,-6],[-2,-4],[-2,2],[-3,-2],[0,2],[-2,1],[-3,-4],[-3,-5],[2,-3],[-4,-8],[-5,-8],[-3,-12],[-3,-4],[-2,-14],[1,-3],[0,-3],[1,-3],[3,0],[1,-3],[-2,0],[-2,-3],[-2,-1],[-1,-3],[-5,-10],[1,-1],[5,-2],[2,-2],[4,-11],[-1,-3],[3,-3],[0,-8],[3,-3],[4,-1],[4,2],[4,3],[0,3],[-3,6],[0,3],[-2,2],[-1,-2],[-1,4],[4,-1],[3,-7],[1,-9],[1,-5],[-1,-2],[-3,0],[-9,-3],[-3,-3],[-5,-2],[1,4],[-1,6],[-1,0],[-7,-10],[-3,0],[-3,-3],[-1,9],[2,6],[-1,0],[-3,-4],[-1,2],[0,3],[-2,2],[1,-6],[-2,-4],[0,-10],[-3,-4],[-6,-3],[-9,0],[-5,-2],[-3,1],[-3,-2],[-10,-1],[-2,1],[-3,-4],[-5,-2],[-11,-9],[-7,-11],[-2,-1],[-1,2],[-3,-7],[-4,-4],[-2,-7],[1,-4],[5,-2],[2,1],[0,-3],[1,-4],[-1,-4],[0,-5],[-2,-10],[-2,-3],[-1,-13],[-2,-6],[-5,-9],[0,-4],[-2,-3],[-1,1],[-2,-4],[-1,-4],[-4,-12],[-4,-4],[-1,1],[2,11],[-5,4],[-2,0],[-3,4],[-3,3],[-5,9],[0,6],[3,11],[2,2],[6,3],[-1,1],[-6,-3],[-2,-3],[-1,-4],[-2,-4],[0,-10],[1,-4],[3,-7],[1,-11],[2,-7],[4,-9],[2,-2],[1,-3],[-2,-6],[2,-3],[1,-4],[0,-4],[-3,-3],[0,-5],[-2,-3],[-2,-7],[-2,-3],[-7,-25],[1,-4],[-4,-3],[-3,-5],[-1,-7],[-2,-9],[-2,7],[3,20],[3,8],[2,4],[2,7],[-3,2],[-3,-1],[2,7],[-4,5],[2,5],[0,6],[-1,0],[-1,-3],[-3,-2],[-5,5],[-2,8],[1,6],[2,1],[2,-1],[2,1],[-4,5],[-1,3],[-2,1],[3,4],[0,4],[-2,1],[-2,-2],[0,6],[4,-1],[1,5],[-2,-1],[0,8],[2,7],[4,5],[1,3],[0,3],[-1,3],[-2,0],[0,-5],[-2,-4],[-2,-1],[-2,-4],[-1,3],[-2,-4],[0,-3],[-1,-1],[-4,2],[0,-1],[4,-7],[0,-3],[-2,-4],[0,-13],[-1,-2],[1,-12],[1,-4],[2,-3],[0,-3],[-1,0],[1,-6],[2,-7],[0,-3],[-4,5],[-3,3],[-5,2],[-3,4],[-1,-2],[-3,9],[-4,-3],[-2,1],[0,7],[5,10],[1,4],[-1,0],[-1,-4],[-5,-6],[-1,-4],[0,-8],[1,-3],[6,1],[4,-10],[7,-3],[3,-3],[2,-4],[3,-3],[3,-4],[0,-3],[-1,-3],[0,-4],[-1,-3],[-3,0],[-2,1],[-8,14],[-4,10],[-4,4],[-1,0],[8,-13],[3,-8],[3,-3],[2,-5],[7,-6],[-2,-2],[3,-2],[0,-8],[-4,2],[0,-5],[-2,-2],[-2,2],[-6,12],[0,-2],[4,-9],[3,-4],[3,-2],[3,-6],[0,-4],[-1,-2],[-2,-1],[-2,2],[-1,3],[-3,4],[0,4],[-2,0],[-9,6],[0,-3],[2,-3],[7,-3],[1,-7],[4,-5],[1,-3],[2,-1],[4,4],[3,-2],[4,-1],[2,-8],[5,-31],[-2,2],[-2,17],[-1,4],[-1,-3],[-1,-6],[1,-2],[3,-10],[-1,-5],[-4,3],[-3,3],[0,-8],[-2,1],[0,-2],[-5,1],[-2,-7],[-2,0],[-4,3],[-1,-7],[10,0],[4,2],[4,-1],[0,-16],[2,2],[1,10],[3,4],[1,-1],[2,-6],[0,-5],[-1,-6],[-5,-8],[-4,-8],[-2,-1],[-3,0],[-4,3],[-1,-1],[-1,2],[-1,5],[-2,1],[-1,-5],[-2,-1],[6,-9],[-2,-3],[-1,-4],[0,-5],[-5,-4],[-2,1],[-1,-2],[4,-2],[8,3],[3,-3],[-2,-6],[-2,-4],[-3,0],[-3,-1],[0,-3],[-11,0],[-5,-6],[-2,1],[0,5],[-1,2],[0,-10],[1,-2],[-4,-4],[-7,-10],[-3,-8],[0,-5],[-1,-7],[-1,3],[-1,0],[-1,-4],[-11,0],[-4,-3],[-8,-8],[-2,-4],[-6,-15],[-2,-9],[-1,4],[-1,0],[1,-7],[-1,-3],[-4,-6],[-2,0],[-3,-2],[0,-5],[-6,-7],[-3,1],[1,-5],[-1,-3],[-5,-5],[-2,1],[-2,-4],[-3,-2],[-6,2],[1,-3],[2,-3],[0,-4],[-1,-2],[-3,-2],[-1,6],[-3,-5],[2,-3],[0,-2],[-2,-4],[-3,-2],[0,-5],[-2,-5],[-3,-3],[-2,-1],[1,-2],[0,-3],[-2,-2],[-1,-5],[1,-3],[-3,-2],[0,-2],[2,-1],[-2,-5],[-1,-4],[-2,-1],[2,-5],[-2,-5],[-2,1],[-1,-4],[1,-2],[-2,-10],[0,-11],[2,-5],[2,-21],[1,-8],[2,-20],[4,-19],[6,-23],[9,-29],[1,-4],[-1,-3],[0,-15],[-1,0],[0,20],[-1,0],[0,-8],[-1,-2],[-1,7],[0,3],[1,5],[-2,1],[-1,3],[1,3],[-2,2],[0,-7],[1,-5],[1,-10],[2,-6],[1,-6],[12,-56],[3,-7],[1,-5],[1,-11],[0,-13],[-2,-26],[-1,-14],[-4,-15],[-1,-11],[-1,-6],[-3,-6],[-2,1],[-5,-5],[-4,1],[-4,-2],[-3,0],[-1,5],[0,5],[2,1],[3,-6],[1,2],[-1,3],[-4,3],[-3,13],[-3,8],[-1,6],[-6,4],[-4,5],[-2,9],[-2,17],[-2,2],[1,7],[-3,-3],[-1,1],[-1,8],[1,11],[1,4],[-5,-1],[1,-4],[-1,-2],[-3,2],[-1,4],[-3,7],[-5,20],[-2,6],[2,1],[3,9],[2,5],[1,4],[-1,3],[-1,-2],[-1,1],[-2,5],[-2,0],[1,-4],[1,-1],[-1,-8],[-2,0],[-1,-2],[-2,4],[-1,4],[3,23],[2,14],[0,16],[1,3],[-4,14],[-14,23],[-12,27],[-9,10],[-8,-2],[-2,-5],[1,-3],[-1,-1],[-4,-1],[-7,-7],[-3,0],[-4,-3],[-8,-2],[-1,1],[2,6],[-2,4],[-9,14],[2,0],[-1,4],[0,3],[-1,2],[-3,-6],[-2,3],[-9,6],[-7,4],[6,2],[3,-1],[0,2],[-4,3],[-3,-1],[-2,1],[-4,-4],[-3,-2],[-8,-1],[0,3],[1,4],[-1,4],[-2,-4],[-3,2],[-1,-5],[-2,-6],[-6,-3],[1,6],[-2,-2],[-3,-6],[-4,2],[-2,7],[-2,2],[0,7],[-1,3],[-2,3],[-1,-6],[-1,-9],[-1,-3],[-3,0],[-3,1],[-9,-1],[-4,3],[-2,0],[-4,-3],[-5,-2],[-3,1],[-3,-7],[-4,-3],[-10,6],[-5,6],[-3,0],[-3,-6],[-2,-8],[3,-4],[3,-2],[5,2],[3,3],[4,1],[1,2],[2,-3],[-4,-4],[-1,-2],[2,-5],[5,-1],[0,5],[2,4],[3,-1],[0,-4],[1,-3],[0,-6],[-5,-3],[-2,-6],[-2,1],[-1,-4],[1,-4],[3,-3],[2,-4],[7,-5],[2,0],[3,-7],[2,-1],[-1,-3],[-2,-3],[-1,-3],[-3,2],[-3,-5],[0,5],[-1,2],[-1,5],[-2,3],[-2,1],[-1,2],[-5,2],[0,3],[-2,4],[-8,5],[0,-4],[3,-3],[0,-5],[-1,-2],[0,-4],[-2,-6],[-2,-1],[-1,1],[-1,7],[-2,3],[-4,0],[-2,-2],[-3,-7],[-2,-1],[-7,4],[-8,5],[2,3],[2,-1],[0,2],[-3,9],[0,3],[-2,-3],[-5,3],[-4,11],[-4,0],[-2,5],[-4,-2],[-2,-3],[-1,-3],[2,-5],[-1,-1],[-5,-2],[-11,2],[-3,2],[-5,5],[-6,4],[-3,0],[-3,-1],[-8,0],[-4,-3],[-2,5],[2,3],[2,5],[-2,2],[-3,-9],[1,-8],[-6,-1],[-13,-10],[-5,-6],[0,2],[7,7],[-3,1],[-3,-2],[-1,1],[1,6],[0,6],[-3,0],[-2,-4],[-2,2],[-1,-1],[1,-10],[2,-9],[-6,-12],[-1,-5],[-3,-6],[-3,-4],[-8,-9],[-5,-6],[-5,-3],[0,2],[-3,0],[-4,2],[-3,0],[0,-2],[-2,-2],[-3,5],[0,2],[-2,0],[3,-13],[3,-2],[-4,-5],[-3,-1],[-3,4],[0,-5],[-1,-6],[-2,-4],[-1,2],[-3,-2],[-4,-1],[1,-4],[3,1],[-1,-6],[-3,-6],[-2,-1],[-4,1],[-1,-2],[4,-10],[-3,-14],[-1,-6],[-3,0],[-4,4],[0,-6],[5,-3],[1,-4],[0,-3],[-2,-3],[-1,-5],[1,-4],[1,-8],[1,-4],[1,-12],[1,-5],[5,-19],[2,0],[0,-6]],[[1746,7057],[0,7],[-2,2],[-1,-1],[-1,8],[0,8],[-2,9],[-4,11],[-9,14],[-4,5],[-4,6],[-5,2],[-1,-3],[-3,2],[1,6],[-4,10],[-2,1],[-7,-1],[-8,5],[-3,3],[-1,5],[-4,5],[-5,5],[-3,-1],[-4,0],[-5,4],[-4,0],[-6,-1],[-2,1],[-5,6],[1,5],[-1,5],[1,3],[-1,8],[0,10],[-6,5],[-1,4],[1,5],[-1,4],[-3,3],[-4,7],[-4,4],[-1,7],[-3,4],[-1,4],[-5,13],[-6,10],[-1,6],[0,8],[2,5],[1,4],[0,7],[-2,5],[-8,3],[-7,12],[0,10],[-2,10],[0,6],[-1,7],[4,1],[0,-8],[4,-5],[2,-4],[2,-1],[-2,9],[-2,6],[-2,3],[-1,6],[-1,1],[0,3],[4,4],[4,1],[10,-1],[1,2],[-2,1],[-3,-1],[-4,3],[-4,-3],[-1,0],[-4,4],[-4,-2],[0,-15],[-1,-1],[-2,3],[-2,1],[-3,3],[-4,6],[-1,3],[-1,7],[0,3],[-2,2],[-2,8],[-4,5],[-4,8],[-8,13],[0,12],[-3,15],[1,8],[0,6],[-1,9],[-8,19],[-6,9],[-1,7],[0,7],[2,12],[2,-1],[0,8],[2,8],[0,11],[2,13],[0,4],[-1,10],[-4,9],[1,6],[0,6],[-4,8],[-1,10],[-1,4],[1,12],[-1,5],[-3,8],[5,31],[2,1],[2,3],[-1,1],[0,6],[2,7],[1,2],[0,21],[1,16],[2,5],[-1,6],[1,7],[-1,7],[3,36],[0,5],[1,5],[-1,16],[0,19],[-1,2],[1,1],[1,-3],[7,0],[4,3],[2,-1],[2,-3],[2,1],[-3,3],[-1,2],[-5,0],[-1,2],[-6,-2],[-2,2],[-3,-1],[1,5],[2,4],[2,13],[-2,3],[-3,2],[-1,7],[7,5],[-4,2],[-1,2],[-4,-1],[0,4],[-1,7],[-3,12],[-2,14],[-2,8],[-4,6],[-2,5],[-1,10],[1,7],[-1,6],[2,0],[6,-5],[7,-3],[2,-2],[4,-2],[18,-3],[2,0],[3,2],[4,-5],[4,1],[2,-1],[3,-8],[0,-3],[-3,-8],[-1,0],[0,3],[-7,-14],[-2,-6],[0,-5],[1,-1],[2,1],[-1,2],[0,5],[2,5],[5,5],[1,3],[5,8],[0,5],[2,-1],[0,-8],[-3,-4],[0,-6],[2,-8],[0,-3],[-1,-8],[-2,1],[-1,2],[-1,-1],[-3,2],[-3,-5],[-1,-5],[2,-2],[3,1],[3,-2],[3,3],[1,6],[4,2],[2,4],[-1,9],[0,6],[-1,1],[1,4],[-1,4],[2,6],[3,7],[-1,1],[-3,8],[-1,0],[1,-5],[-1,0],[-3,4],[0,4],[1,2],[2,1],[-2,6],[-3,3],[-2,1],[1,3],[2,-1],[2,1],[-1,3],[0,7],[-1,5],[-3,0],[-2,5],[-1,8]],[[9983,8142],[-5,0],[-9,10],[-5,3],[-3,3],[1,1],[6,-3],[11,-11],[3,-1],[1,-2]],[[103,8166],[-2,-3],[-2,6],[1,1],[3,-4]],[[110,8168],[-2,-2],[-3,3],[0,3],[5,-4]],[[58,8158],[-1,-2],[-4,4],[3,3],[-2,4],[-3,3],[-1,3],[2,1],[4,0],[3,-4],[2,-1],[-1,-9],[-2,-2]],[[79,8162],[-1,-1],[-11,0],[-2,-1],[-1,2],[12,5],[2,6],[3,0],[0,-2],[-2,-2],[0,-7]],[[94,8171],[0,-2],[4,-1],[0,-5],[-2,1],[-1,-2],[-6,-5],[-2,3],[-1,6],[4,3],[1,9],[3,-1],[1,-3],[-1,-3]],[[9959,8174],[-2,-1],[-1,2],[1,3],[3,-2],[-1,-2]],[[9991,8173],[-5,-1],[-1,5],[3,3],[4,-3],[-1,-4]],[[110,8179],[-1,-2],[-4,5],[1,2],[4,-1],[1,-3],[-1,-1]],[[9927,8172],[-3,-3],[-2,4],[4,4],[4,2],[1,6],[3,-1],[-2,-6],[0,-3],[-5,-3]],[[179,8186],[5,-2],[9,0],[0,-1],[-9,-2],[-9,1],[-4,-1],[-5,3],[0,2],[6,-1],[4,2],[3,-1]],[[209,8194],[-2,-1],[-3,1],[3,5],[2,2],[2,-1],[2,-3],[-4,-3]],[[147,8180],[-15,-2],[0,3],[3,0],[6,3],[7,2],[5,3],[5,2],[1,3],[-4,1],[-1,2],[2,1],[5,5],[4,-3],[1,-2],[-1,-5],[-4,-3],[2,-4],[-6,-3],[-10,-3]],[[9824,8199],[-2,0],[-1,2],[-6,1],[1,2],[2,0],[4,3],[4,0],[-2,-8]],[[257,8212],[-2,-1],[-1,2],[4,6],[3,-2],[0,-2],[-4,-3]],[[286,8227],[-1,-3],[-7,1],[0,2],[4,2],[2,0],[2,-2]],[[9799,8237],[5,-2],[3,1],[4,-3],[5,-6],[-1,-1],[-9,-1],[-4,-3],[-4,2],[-2,5],[-6,3],[5,4],[4,1]],[[334,8256],[-9,-6],[-2,-5],[-3,-4],[-1,-3],[-3,-1],[-4,-3],[-9,-8],[0,2],[5,5],[3,6],[0,6],[4,6],[6,0],[2,2],[-1,2],[0,5],[3,5],[2,2],[6,1],[5,-3],[-1,-7],[-3,-2]],[[383,8278],[-2,1],[2,4],[1,-2],[-1,-3]],[[371,8288],[1,-3],[3,2],[3,7],[1,-2],[3,-2],[-9,-12],[0,-2],[5,2],[2,-2],[-4,-2],[-2,-3],[-5,-4],[-2,-4],[-5,-1],[-6,-2],[-4,-4],[-2,0],[-4,-4],[-4,-1],[-3,2],[-1,2],[5,3],[3,1],[11,7],[1,7],[2,3],[4,0],[1,-3],[3,4],[-4,3],[-4,0],[-3,5],[1,3],[3,3],[4,1],[3,2],[3,-1],[0,-5]],[[393,8298],[-2,-2],[-1,1],[-3,-1],[-2,4],[0,2],[2,3],[4,1],[4,-4],[2,-1],[-1,-3],[-3,0]],[[401,8301],[-2,0],[-1,7],[2,2],[3,-4],[0,-2],[-2,-3]],[[484,8317],[-2,-2],[-5,4],[0,3],[5,-2],[2,-3]],[[491,8342],[-4,5],[4,3],[2,-1],[0,-2],[-2,-5]],[[458,8350],[4,-11],[4,-2],[2,-2],[1,-3],[-7,4],[-5,-6],[-15,-1],[-5,-2],[-4,-8],[-6,-2],[-4,0],[-3,3],[-1,5],[0,4],[5,4],[5,11],[2,2],[5,-1],[4,4],[8,4],[1,1],[6,0],[3,-4]],[[573,8350],[-2,0],[-1,5],[2,-1],[1,-4]],[[1351,8356],[3,-8],[0,-2],[-3,-1],[-3,1],[0,5],[-4,5],[1,3],[-1,7],[2,0],[3,-3],[2,-7]],[[559,8359],[-5,-5],[-4,-6],[0,4],[1,1],[-1,5],[2,1],[2,3],[2,1],[1,4],[2,-1],[-1,-2],[1,-5]],[[1309,8345],[2,2],[2,0],[3,-2],[-1,-3],[0,-5],[-2,-4],[-3,1],[-5,9],[-6,13],[-1,5],[-5,2],[-1,3],[1,3],[4,1],[5,-6],[3,-6],[0,-5],[4,-8]],[[546,8371],[-1,-5],[-4,4],[0,2],[4,0],[1,-1]],[[536,8369],[3,4],[1,-1],[-1,-3],[1,-4],[2,-2],[-4,-3],[-6,1],[-1,8],[2,4],[2,2],[1,-1],[0,-5]],[[1296,8383],[1,-3],[-4,-4],[-3,-7],[-3,-2],[0,8],[-3,5],[3,2],[5,-1],[4,2]],[[678,8399],[-1,-2],[-3,0],[-1,2],[4,5],[1,0],[0,-5]],[[1361,8379],[-1,-6],[-2,-6],[-3,-4],[-2,1],[-1,3],[-3,0],[-1,2],[1,3],[-1,3],[-2,-4],[-6,-7],[-2,0],[-1,11],[2,5],[3,5],[1,14],[10,7],[1,0],[3,-5],[4,-8],[0,-14]],[[1289,8428],[5,-1],[5,0],[2,-2],[2,-5],[0,-4],[-1,-2],[10,-5],[6,-9],[3,-9],[4,-8],[2,-2],[0,-2],[-3,1],[-6,5],[-2,-7],[5,1],[4,-5],[2,-1],[1,-5],[-1,-4],[6,0],[0,-24],[-1,-5],[-5,1],[-2,4],[-2,6],[-3,2],[-3,0],[-1,6],[-2,6],[-1,-1],[1,-4],[-1,-2],[-2,1],[-4,8],[-4,7],[-1,3],[4,1],[-3,7],[1,5],[-2,1],[-5,0],[-2,3],[0,2],[-5,0],[-3,3],[-1,4],[4,1],[3,-2],[3,3],[0,2],[2,2],[-1,6],[-2,1],[-5,-2],[-4,-3],[-2,1],[0,2],[6,8],[0,2],[-2,2],[0,6],[1,1]],[[1311,8423],[-3,1],[-4,4],[0,3],[4,4],[5,0],[2,-1],[0,-7],[-1,-2],[-3,-2]],[[1330,8415],[-1,-9],[-4,-1],[-4,1],[0,4],[-1,2],[-6,1],[-1,3],[0,4],[3,3],[3,5],[3,10],[2,-1],[7,-14],[-1,-8]],[[703,8434],[-3,-1],[1,5],[6,5],[2,-1],[-6,-8]],[[716,8438],[-2,0],[-2,2],[1,2],[3,2],[3,0],[0,-3],[-3,-3]],[[284,8445],[4,-1],[2,1],[2,-2],[-3,-3],[-2,0],[-3,5]],[[1312,8439],[0,-1],[-4,0],[-2,3],[3,8],[0,6],[7,-10],[1,-3],[-5,-3]],[[1277,8457],[2,-4],[3,1],[2,-8],[0,-3],[-2,1],[-2,-7],[1,-6],[-2,-11],[0,-4],[-2,-1],[-2,1],[-1,-3],[-2,0],[-2,8],[2,12],[3,2],[-2,3],[-4,4],[0,2],[-3,7],[1,6],[3,5],[3,1],[3,-2],[1,-4]],[[1295,8467],[2,-2],[1,2],[5,-2],[3,-5],[0,-14],[-2,-1],[-3,3],[-3,7],[-2,-1],[3,-5],[2,-5],[0,-7],[-1,-1],[-6,0],[-3,-1],[-4,2],[0,6],[-1,7],[0,5],[-4,7],[-3,3],[-1,4],[3,1],[4,0],[10,-3]],[[749,8474],[-4,-2],[-2,-4],[-2,-2],[-2,3],[1,5],[2,3],[9,-1],[-2,-2]],[[273,8477],[-3,-3],[-3,1],[0,3],[7,2],[-1,-3]],[[1250,8487],[3,-7],[1,-5],[2,-5],[2,-13],[2,-4],[0,-11],[-1,-3],[1,-5],[0,-8],[-2,-5],[-2,2],[-2,4],[-3,8],[-1,4],[0,4],[3,4],[-4,0],[-4,4],[0,5],[-4,-1],[-1,1],[0,4],[4,8],[-4,3],[-1,6],[-2,4],[-2,-1],[-4,-12],[-4,-1],[1,3],[-1,10],[1,5],[4,2],[4,9],[4,1],[6,-6],[2,-1],[2,-3]],[[743,8515],[-2,-1],[-1,2],[-5,5],[1,1],[4,-2],[3,-5]],[[752,8514],[0,-3],[2,0],[6,4],[3,0],[3,-2],[0,-2],[-2,-2],[0,-2],[2,-3],[5,-2],[0,-2],[-3,-6],[-2,-1],[-12,2],[-2,1],[-3,-3],[6,0],[3,-5],[-1,-3],[-4,0],[-3,-2],[-2,-3],[-6,-1],[-5,-3],[-2,-2],[0,-2],[-6,-3],[3,-2],[0,-3],[-4,-6],[-6,-5],[-2,1],[0,2],[7,10],[-5,3],[-3,-1],[0,2],[2,3],[-3,2],[-3,0],[-1,-3],[2,-2],[1,-3],[-3,-6],[-2,1],[-4,7],[-2,9],[-4,8],[1,6],[4,7],[4,1],[3,3],[4,1],[3,-1],[1,-3],[-1,-2],[2,-1],[4,-10],[1,1],[-1,4],[0,12],[3,-1],[0,2],[-5,5],[-1,4],[3,3],[3,0],[4,-7],[3,-1],[3,4],[3,-1],[2,5],[0,5],[6,-2],[3,-2],[-2,-4]],[[1229,8538],[4,-6],[-1,-5],[1,-3],[6,7],[6,-1],[6,-5],[0,-4],[-1,-8],[-3,-1],[-4,1],[-3,-2],[2,-2],[8,-1],[2,-4],[1,-4],[-2,-6],[-4,2],[-11,9],[-4,-1],[0,-10],[-2,-3],[-6,1],[-5,13],[-8,10],[-2,2],[-3,5],[1,8],[2,0],[2,2],[2,5],[2,-4],[3,0],[1,2],[3,0],[3,3],[3,1],[1,-1]],[[1268,8537],[0,-1],[-4,0],[-3,2],[-2,4],[4,1],[3,-2],[2,-4]],[[1258,8533],[7,-1],[5,0],[5,-8],[5,-12],[2,-9],[-3,2],[-3,9],[-2,3],[-2,6],[0,2],[-3,2],[0,-5],[1,-5],[5,-10],[4,-7],[0,-5],[-1,-3],[2,-4],[-1,-2],[-5,-2],[-4,-9],[-5,-5],[-2,-1],[-3,5],[0,4],[1,2],[3,11],[0,3],[-5,9],[-3,21],[-5,19],[1,1],[2,-2],[3,-5],[1,-4]],[[766,8545],[2,3],[4,-3],[2,1],[1,-4],[3,0],[0,-4],[-4,-5],[-4,5],[-2,-2],[1,-4],[-7,-2],[-1,3],[-3,-5],[-3,-3],[-5,-1],[-11,5],[7,9],[4,3],[6,-1],[0,4],[-2,4],[4,2],[4,-1],[4,-4]],[[764,8552],[-3,1],[-1,4],[4,3],[3,-1],[0,-2],[-3,-5]],[[529,8557],[-2,-1],[-2,1],[-1,5],[4,4],[6,3],[-5,-12]],[[984,8629],[0,3],[6,7],[2,-1],[-4,-3],[-4,-6]],[[888,8643],[-2,-2],[-5,1],[1,4],[4,2],[5,-3],[-3,-2]],[[896,8628],[-4,1],[1,5],[6,7],[4,4],[4,5],[4,10],[2,0],[3,-2],[1,-2],[-1,-2],[-9,-10],[-1,-5],[-2,-2],[-2,-4],[-4,-2],[0,-2],[-2,-1]],[[385,8661],[2,-3],[7,1],[3,-4],[-1,-6],[0,-6],[3,-2],[1,-7],[-5,-1],[-5,0],[-4,-2],[-1,-5],[-2,0],[-2,3],[-2,1],[-8,1],[-10,7],[-4,2],[-5,5],[-4,6],[6,2],[11,-1],[2,4],[8,5],[3,-1],[3,2],[4,-1]],[[968,8659],[-1,-2],[-3,2],[4,3],[0,-3]],[[933,8665],[1,-1],[6,0],[1,-1],[-3,-3],[-6,-2],[-5,-3],[-1,4],[-2,4],[4,4],[5,-2]],[[898,8665],[-1,-3],[1,-2],[-2,-5],[0,-3],[-2,-3],[-2,3],[-1,4],[2,3],[1,7],[4,-1]],[[777,8660],[1,8],[2,-2],[-3,-6]],[[201,8666],[6,-4],[4,0],[3,-3],[-3,-1],[-7,0],[-9,8],[-3,2],[1,4],[3,2],[2,-6],[3,-2]],[[890,8687],[-3,-1],[-2,1],[2,5],[3,-2],[0,-3]],[[237,8849],[12,-3],[4,0],[6,5],[3,1],[7,-1],[5,-3],[3,-8],[11,-3],[2,-3],[3,-2],[4,1],[2,-1],[6,0],[8,-2],[-1,-6],[-3,-2],[-7,1],[-7,-1],[-6,-7],[-1,-5],[-2,-1],[-4,10],[-4,3],[-6,1],[-2,2],[0,3],[-7,6],[-9,4],[-6,0],[-7,-5],[-6,-2],[-3,1],[-4,4],[-1,3],[0,6],[2,7],[3,2],[5,-5]],[[1388,8402],[-2,-3],[-2,-6],[0,-8],[3,-10],[0,-7],[-4,-9],[-1,-6]],[[1372,8338],[-1,1],[-6,1],[-3,8],[-1,7],[-2,5],[0,2],[2,3],[6,3],[0,2],[-2,0],[-1,2],[0,14],[-1,8],[-6,13],[0,2],[3,5],[-8,-4],[-9,-5],[-4,-3],[-1,-2],[0,-5],[-1,-1],[-1,-6],[-3,-6],[-4,2],[-3,9],[7,12],[4,13],[3,0],[5,3],[-8,1],[-1,1],[-4,8],[-4,2],[-2,4],[-3,4],[0,4],[-4,1],[0,7],[-6,3],[-3,4],[-1,4],[1,6],[-3,-1],[-15,7],[1,10],[-3,12],[-3,5],[1,3],[2,0],[5,-3],[6,-5],[1,1],[-9,9],[-3,6],[1,3],[8,-1],[1,1],[-9,3],[-2,0],[-1,-4],[-3,-1],[-1,1],[-4,8],[-4,4],[-1,8],[1,5],[-5,-4],[-3,4],[-4,4],[-5,1],[-3,4],[-5,11],[-1,7],[-3,2],[-1,3],[-3,13],[-3,9],[-1,5],[-3,-1],[2,-3],[0,-2],[-3,-1],[4,-6],[1,-11],[4,-13],[0,-5],[4,-14],[0,-4],[-3,-3],[-4,2],[-2,2],[-2,5],[-4,2],[-9,-1],[0,4],[1,9],[-5,9],[1,5],[-1,1],[-1,7],[-2,-3],[1,-4],[0,-6],[-3,-1],[-2,1],[-2,3],[-3,2],[-2,4],[-7,3],[-5,3],[1,-4],[0,-5],[2,0],[8,-4],[1,-4],[4,-3],[-2,-4],[5,0],[2,-1],[4,-6],[1,-3],[0,-4],[-2,-2],[-9,-1],[-4,-5],[-3,1],[-4,4],[-6,4],[-13,10],[-1,3],[-3,2],[-5,7],[-5,9],[-9,9],[-5,1],[1,3],[-6,1],[-5,3],[-12,8],[-11,8],[-2,2],[4,2],[4,7],[-2,8],[0,4],[2,3],[2,0],[4,-7],[-1,-6],[1,-7],[1,0],[0,10],[2,3],[4,-1],[2,1],[-7,3],[-6,7],[-2,0],[-3,-2],[-6,-9],[-11,-6],[-12,0],[-5,2],[-13,7],[-3,2],[4,4],[-1,6],[-3,2],[0,-4],[-1,-2],[-6,-3],[-12,4],[-12,3],[-11,1],[-16,-3],[-8,-2],[-10,0],[0,2],[2,2],[-3,4],[-4,2],[-8,2],[-1,2],[-5,2],[-2,3],[1,7],[2,4],[2,7],[-4,-3],[-6,-9],[-4,-4],[-4,1],[-5,3],[-4,1],[-4,0],[-1,1],[4,5],[2,5],[-13,0],[-1,5],[-5,0],[-4,-2],[-2,1],[5,5],[-6,3],[-1,2],[0,5],[1,4],[9,3],[-3,2],[-5,-1],[-4,-3],[-4,-4],[-3,-1],[-2,1],[-4,0],[-2,-1],[-3,-4],[-2,2],[-4,2],[-2,-4],[-4,-2],[-3,0],[-3,5],[1,8],[-5,-2],[-3,1],[-3,-3],[5,0],[-3,-6],[-1,-5],[-2,-1],[-4,0],[0,-2],[4,-4],[4,-1],[-1,-10],[5,2],[2,0],[2,-3],[0,-4],[-6,-3],[-1,-7],[1,-6],[-3,-1],[-4,-9],[-2,0],[-2,-2],[-7,-1],[-5,2],[-3,3],[-4,-2],[-3,6],[-1,0],[0,-6],[-4,-6],[-3,0],[-1,2],[-3,-4],[1,-6],[-1,-1],[-4,3],[-2,-1],[2,-3],[0,-2],[-7,-7],[-4,1],[-4,-3],[-3,2],[-2,-8],[-5,-5],[-2,-5],[-7,3],[-1,-1],[1,-3],[-5,1],[-3,-1],[-4,-3],[-4,0],[-4,5],[-2,1],[2,6],[6,4],[5,1],[3,2],[4,4],[2,3],[4,8],[-2,1],[-8,-7],[-3,-1],[-9,4],[-1,4],[2,8],[5,10],[4,6],[2,4],[2,11],[0,5],[-1,6],[0,4],[1,1],[10,6],[5,4],[9,6],[3,0],[4,-4],[6,-1],[4,2],[6,-1],[13,-4],[3,0],[-2,3],[-13,3],[-10,8],[-3,3],[5,3],[1,5],[7,6],[7,4],[-3,1],[-7,-2],[-3,-3],[-4,-7],[-4,-2],[-10,0],[-2,2],[-2,0],[-10,-6],[-5,-6],[-4,-3],[-5,-1],[-4,-2],[-5,-7],[1,-6],[-7,-5],[-7,-8],[-1,-5],[1,-2],[-1,-2],[-7,-7],[-3,-1],[-4,0],[-3,3],[-3,0],[10,-10],[1,-4],[-1,-3],[-3,-4],[-3,-2],[-7,-1],[-2,-2],[5,-3],[-2,-5],[-4,-2],[-4,0],[0,4],[-3,-1],[-5,-4],[1,-3],[-3,-5],[-2,-2],[-8,-6],[1,-2],[-3,-10],[1,-2],[6,-3],[4,0],[10,-7],[2,-3],[0,-3],[-3,-6],[-7,-7],[-5,-2],[-4,-6],[-2,-7],[-5,-3],[2,-1],[-1,-3],[0,-5],[-1,-1],[-4,0],[-5,-2],[0,-3],[-11,-2],[-4,-8],[-8,-6],[-5,-2],[-1,-4],[-4,-6],[-6,-1],[-1,-1],[0,-5],[-3,1],[-3,-1],[-5,-5],[-1,-3],[2,-4],[0,-2],[-2,-6],[-3,-2],[-1,-3],[-5,0],[-2,-4],[-2,0],[-1,-2],[-5,-5],[-3,-1],[-2,1],[-4,-3],[-1,-5],[-2,-3],[-8,1],[-6,-5],[3,-1],[0,-2],[-4,0],[-2,-2],[-6,-2],[-3,-6],[4,-2],[3,-6],[-4,-5],[-3,-2],[-1,6],[-2,-1],[-2,-7],[-2,-3],[-18,-8],[-3,-2],[0,-4],[-2,-5],[-2,-2],[0,12],[-3,1],[-3,-3],[-2,0],[-8,-8],[-3,-1],[-3,-5],[-2,-1],[-2,1],[-2,-1],[-2,-3],[-4,2],[-3,-4],[-5,-3],[-8,-1],[0,5],[1,3],[2,2],[4,0],[-1,2],[-7,2],[-4,-3],[-1,-2],[-1,-8],[-7,-11],[-3,-4],[-2,0],[-3,-4],[-3,-1],[-2,2],[1,4],[-4,5],[-2,0],[0,-12],[-1,-2],[-4,-3],[-2,1],[-3,5],[-4,1],[1,-5],[-1,-4],[-2,-3],[-4,-1],[0,2],[2,8],[-1,5],[5,5],[6,0],[2,4],[5,5],[4,6],[10,16],[6,6],[20,11],[1,-4],[9,1],[-1,-2],[-3,-1],[0,-2],[4,-6],[3,-1],[0,5],[4,2],[3,-3],[4,-2],[2,1],[-1,3],[-6,6],[2,10],[5,10],[4,5],[3,2],[7,7],[14,7],[3,5],[7,7],[1,-4],[5,-2],[1,1],[0,14],[5,9],[7,8],[5,4],[4,6],[5,2],[2,-3],[3,-1],[2,2],[-3,2],[-1,3],[-2,2],[0,6],[2,9],[0,9],[2,5],[3,2],[7,1],[-4,3],[-4,1],[-1,5],[0,4],[2,5],[6,8],[7,5],[-2,3],[3,11],[-1,1],[-5,-6],[-24,-14],[-5,-2],[-3,2],[-2,6],[-2,2],[-1,4],[0,5],[2,4],[3,0],[2,2],[-5,3],[-3,-1],[-2,-5],[-2,-3],[-3,1],[0,-3],[-2,-6],[0,-5],[2,-11],[0,-5],[-5,-2],[-4,4],[-7,15],[-3,4],[-6,6],[-2,0],[-2,-4],[-3,-1],[-6,5],[-6,9],[-8,-6],[-5,-5],[-3,0],[-8,-4],[-3,-3],[-1,-4],[-11,-4],[-11,2],[8,4],[4,5],[-2,9],[0,4],[4,5],[-4,0],[-3,-2],[-2,4],[-1,8],[3,5],[2,8],[0,5],[-2,7],[-6,15],[-3,11],[-5,7],[3,10],[5,9],[5,4],[-5,0],[-4,-6],[-9,-17],[2,-5],[1,-5],[-2,-7],[-5,0],[-4,-4],[-9,-5],[-13,-2],[-7,0],[-6,5],[0,6],[-9,9],[-5,9],[-4,0],[-4,2],[-4,4],[1,5],[-2,2],[-3,-1],[-4,1],[10,12],[3,7],[3,2],[8,-5],[4,-1],[3,-4],[-3,-8],[10,10],[3,-1],[4,-9],[6,4],[3,6],[-6,4],[-8,1],[2,2],[5,0],[2,1],[-4,4],[-7,-6],[-12,0],[-9,4],[-9,-1],[-3,3],[9,7],[0,1],[-6,-1],[-4,4],[-4,1],[0,-4],[-3,-1],[-3,1],[-3,11],[-5,2],[-1,4],[3,5],[-1,3],[-4,1],[-3,-3],[-2,2],[0,6],[2,0],[7,2],[1,1],[-6,3],[-2,3],[3,2],[4,0],[6,2],[-2,3],[-2,5],[1,5],[15,22],[5,3],[6,-1],[-2,4],[2,2],[-1,3],[-1,8],[3,9],[2,3],[8,1],[-4,5],[2,4],[10,4],[4,-1],[6,-3],[4,-4],[3,-1],[4,-3],[8,2],[3,2],[4,5],[5,3],[7,11],[3,4],[4,1],[2,-4],[2,-1],[13,1],[7,2],[4,3],[8,10],[1,5],[-1,7],[-2,5],[-2,13],[-7,8],[-4,3],[-3,0],[2,5],[6,-1],[4,1],[3,3],[3,6],[-2,6],[-6,8],[-2,0],[-8,-8],[-4,0],[-4,2],[-3,-5],[-8,-3],[-5,-4],[-8,-9],[-2,-5],[-3,0],[-2,8],[-9,8],[-3,-3],[4,-4],[3,0],[-2,-6],[-10,7],[-6,2],[-17,0],[-10,-4],[-4,0],[-2,-3],[-7,0],[-8,3],[-20,4],[-5,3],[-4,6],[0,4],[2,1],[0,6],[-4,1],[-8,9],[2,2],[7,1],[2,5],[5,2],[2,2],[-12,3],[-1,-1],[-21,5],[-16,8],[-3,5],[3,4],[2,-3],[9,5],[5,6],[10,1],[5,4],[4,6],[9,5],[5,2],[5,-3],[9,-1],[5,3],[-8,5],[2,4],[9,5],[7,2],[3,0],[11,7],[6,2],[11,1],[5,-2],[3,-3],[0,-2],[-3,-6],[0,-6],[-4,-4],[9,-7],[15,-1],[8,2],[4,-3],[14,1],[8,-2],[4,1],[7,11],[3,2],[7,-4],[3,5],[-1,2],[-12,4],[-8,-2],[-2,3],[1,4],[-9,12],[-3,2],[-5,0],[-2,4],[-1,5],[6,3],[3,-1],[4,-7],[3,-1],[-1,-7],[4,-6],[9,-6],[7,2],[5,0],[3,-1],[7,-5],[4,-1],[12,3],[0,5],[-1,4],[-3,2],[-8,0],[-6,3],[-5,-1],[-10,-5],[-5,2],[-3,3],[-5,3],[0,6],[4,7],[3,3],[-3,3],[-7,1],[-11,-1],[-1,4],[-5,-5],[-5,1],[-6,0],[-15,4],[-8,10],[-4,12],[-5,7],[-35,26],[-16,6],[-7,7],[-5,2],[-5,0],[-5,3],[3,1],[3,-1],[5,3],[5,22],[0,5],[19,-1],[13,1],[4,1],[17,2],[4,1],[8,5],[9,7],[10,13],[2,13],[4,8],[17,20],[7,7],[3,4],[3,2],[6,-5],[18,4],[10,6],[0,2],[15,8],[4,-1],[-4,-6],[3,-1],[-3,-7],[6,0],[2,10],[2,2],[-6,6],[-3,0],[11,9],[10,5],[2,0],[2,-3],[-5,-3],[3,-2],[7,3],[10,0],[4,3],[14,0],[11,5],[11,9],[6,8],[5,5],[6,1],[3,-2],[18,-6],[5,-1],[2,-3],[-2,-4],[-4,-3],[-10,-4],[5,-5],[3,-1],[8,4],[7,7],[2,4],[8,0],[4,-2],[4,-4],[-3,-5],[5,-3],[6,-1],[5,-2],[8,5],[6,1],[6,0],[7,2],[12,-3],[9,0],[5,-2],[2,-2],[-6,-5],[-1,-4],[2,-2],[4,0],[0,-3],[2,-1],[12,0],[-5,-6],[20,-2],[2,2],[5,1],[8,3],[11,-5],[4,1],[7,4],[9,0],[4,-2],[4,1],[16,-5],[6,-6],[3,0],[3,3],[3,0],[3,-3],[5,0],[2,-4],[2,-1],[18,-3],[9,1],[13,0],[6,-2],[7,0],[10,-6],[7,-2],[16,-2],[6,3],[10,1],[8,3],[11,-1],[4,2],[14,-5],[8,-5],[4,-4],[16,-6],[5,-3],[3,-4],[9,1],[3,-1]],[[3300,5941],[-1,-1],[-2,4],[0,5],[2,2],[1,2],[1,0],[0,-9],[-1,-3]],[[3305,5694],[-2,-1],[0,7],[3,5],[1,1],[2,-5],[0,-2],[-2,-3],[-2,-2]],[[3310,5710],[-4,-2],[1,4],[4,2],[0,-2],[-1,-2]],[[3188,5811],[-2,-1],[-3,1],[-1,2],[1,2],[2,0],[2,-2],[1,-2]],[[3226,5824],[0,-9],[-2,-5],[-4,0],[-1,1],[-2,4],[-2,-1],[-4,1],[-1,1],[2,4],[2,2],[1,0],[1,-3],[2,-2],[3,0],[0,4],[3,6],[2,-3]],[[3018,5867],[-1,-3],[-2,-4],[-2,-2],[-10,-5],[-3,-3],[0,-5],[4,-17],[1,-3],[4,-7],[-2,-1],[1,-10],[2,-6],[0,-4],[-1,-12],[-4,-8],[-3,-8],[-2,-3],[-4,-17],[3,-10],[1,-5],[3,-8],[2,-2],[1,-3],[-1,-5],[1,-7],[2,-3],[2,-2],[2,0],[7,5],[2,5],[4,8],[0,9],[1,11],[-1,8],[-4,10],[-1,8],[-4,6],[-2,12],[-1,4],[0,5],[-1,9],[2,3],[0,8],[6,2],[12,12],[8,3],[8,6],[2,4],[2,5],[1,0],[5,-5],[2,2],[1,4],[-1,8],[-3,0],[-8,-3],[0,6],[-2,9],[1,7],[1,5],[2,2],[4,3],[2,-4],[2,-3],[0,-4],[2,-18],[2,-7],[2,-4],[2,0],[1,1],[8,1],[5,-4],[6,-1],[6,-7],[6,-9],[2,-6],[0,-6],[2,-4],[-2,-4],[1,-7],[2,-7],[2,-4],[8,-2],[8,3],[12,3],[4,2],[21,2],[4,-4],[0,-5],[7,-13],[5,-2],[5,-4],[5,-2],[5,-3],[5,2],[3,0],[18,21],[10,-1],[2,1],[1,2],[-4,3],[-8,2],[-2,-2],[-2,5],[3,0],[9,2],[10,-2],[9,4],[4,1],[3,-1],[6,2],[13,-2],[10,2],[-1,-3],[-3,-3],[-6,0],[-4,-5],[-8,1],[-6,-2],[2,-2],[0,-6],[1,0],[3,-6],[1,-5],[-1,-6],[1,-2],[1,3],[0,6],[2,-1],[1,-2],[3,-14],[2,-8],[1,0],[1,2],[1,4],[1,-1],[1,6],[2,0],[1,-1],[3,-5],[3,-8],[0,-2],[2,-1],[0,4],[-1,4],[4,0],[1,4],[2,-3],[6,-12],[2,-2],[6,-2],[4,-6],[2,-6],[-1,-5],[-3,-3],[-2,-3],[-1,-4],[0,-3],[-1,-4],[0,-2],[-1,-5],[-1,-7],[-2,-7],[-10,-1],[2,-2],[2,-3],[4,-5],[3,4],[5,0],[4,5],[2,1],[9,-2],[2,3],[2,1],[5,0],[4,-4]],[[3205,6243],[-2,0],[-1,1],[1,2],[3,0],[-1,-3]],[[3200,6208],[2,-2],[0,-3],[-5,0],[0,4],[3,1]],[[3203,6240],[-2,-1],[0,2],[2,-1]],[[3198,6239],[-2,0],[-1,3],[2,0],[1,-3]],[[7960,5683],[-1,1],[2,4],[0,-4],[-1,-1]],[[7889,5782],[1,-3],[0,-7],[-1,-6],[0,-3],[-1,-2],[-2,12],[-2,6],[3,5],[1,0],[1,-2]],[[7976,5782],[-3,-3],[0,3],[2,1],[1,-1]],[[7972,6378],[-1,0],[-3,5],[2,2],[3,-3],[-1,-4]],[[7967,6382],[-2,2],[0,5],[2,-4],[0,-3]],[[7985,6389],[-1,1],[1,4],[1,-2],[-1,-3]],[[7988,6405],[-4,-7],[-2,0],[1,8],[1,2],[4,-3]],[[7998,6422],[-5,-1],[-2,-5],[-2,-2],[-7,-5],[-1,-5],[0,-8],[-5,-6],[-2,1],[-1,2],[-5,-3],[-2,0],[-3,3],[-1,-2],[2,-9],[0,-4],[-6,-12],[1,-8],[-1,-6],[-4,-5],[-6,-12],[-3,0],[-2,-3],[-5,-20],[0,-7],[-1,-6],[0,-4],[-2,-10],[-2,-4],[0,-5],[3,-11],[0,-2],[2,-6],[2,-8],[5,-11],[2,-3],[3,-2],[5,-10],[2,-6],[-1,-4],[0,-9],[-3,3],[0,-2],[5,-4],[6,-17],[10,-18],[2,-9],[5,-6],[5,-9],[0,-2],[1,-2],[4,-5],[2,-5],[1,-5],[3,1],[3,0],[1,-5],[2,-5],[2,-4],[1,0],[0,-3],[1,-3],[3,-6],[1,-7],[4,-10],[2,-6],[2,-3],[3,-3],[2,-11],[1,-11],[2,-11],[2,-5],[0,-9],[1,-10],[2,-7],[0,-6],[1,-4],[0,-2],[2,-12],[-1,-5],[-1,-10],[1,-8],[0,-10],[1,-3],[2,-11],[1,-4],[0,-14],[-1,-3],[-1,5],[-2,-3],[-1,-3],[2,-15],[-3,1],[0,-19],[2,-5],[0,-2],[-2,1],[-1,-4],[0,-4],[1,-4],[0,-2],[-2,-8],[-2,0],[-2,-15],[-5,-1],[-3,-7],[-4,-2],[-4,-7],[-4,-6],[-5,-2],[-2,-10],[-5,-1],[-10,-13],[-2,-1],[-4,-4],[-1,1],[-1,3],[-3,2],[-1,3],[0,5],[-1,1],[-1,-2],[0,-10],[-1,-3],[-1,-1],[-2,3],[-3,6],[-3,-4],[3,0],[1,-1],[1,-4],[0,-2],[-1,-3],[-3,0],[-4,1],[-1,-1],[4,-3],[5,-5],[0,-2],[-2,-3],[-2,-4],[0,-5],[-1,-3],[-4,5],[-9,16],[1,-5],[9,-18],[2,-6],[0,-4],[-2,-5],[-3,0],[-5,7],[-8,16],[-3,2],[8,-19],[2,-4],[1,-5],[-1,-4],[0,-2],[-19,-18],[-5,-17],[-3,-5],[-2,-5],[-7,-2],[-3,1],[3,8],[-2,3],[0,22],[1,25],[2,12],[2,3],[3,2],[0,5],[-2,4],[-2,2],[-2,1],[-2,5],[-2,0],[-2,-2],[-1,2],[-1,4],[-2,4],[-3,4]],[[9718,4021],[-1,-4],[-2,0],[-2,3],[1,2],[3,1],[1,-2]],[[9707,4058],[-2,-6],[-2,1],[-3,5],[-1,3],[1,8],[2,1],[1,-7],[4,-5]],[[9702,4092],[-1,-2],[-1,0],[-7,6],[0,13],[2,2],[2,-1],[1,-5],[2,-2],[-1,-2],[2,-4],[1,-5]],[[9678,4173],[2,-8],[1,-1],[-1,-6],[-4,0],[-4,6],[-2,-1],[1,4],[2,5],[1,1],[1,-1],[3,1]],[[9678,4217],[0,-3],[-4,2],[-4,-1],[-1,3],[0,7],[2,3],[2,-5],[0,-1],[2,-4],[3,-1]],[[9673,4242],[-3,0],[-4,2],[-2,2],[-1,3],[4,2],[3,6],[1,-2],[1,-7],[1,-2],[0,-4]],[[9649,4256],[2,-1],[0,-3],[4,-5],[1,0],[1,-3],[2,-2],[0,-3],[2,-3],[-2,-4],[-5,1],[-2,-4],[-2,1],[0,3],[-1,6],[-1,9],[-1,5],[-1,2],[-2,-2],[-1,0],[-1,4],[1,9],[0,2],[1,1],[3,-2],[2,-11]],[[9644,4278],[-1,-2],[-3,4],[1,3],[3,-1],[0,-4]],[[9671,4263],[-1,3],[-1,14],[1,10],[3,-22],[-1,-4],[-1,-1]],[[9663,4294],[-2,-2],[-4,0],[-1,1],[4,8],[5,2],[-2,-9]],[[9670,4300],[-1,1],[-1,17],[0,2],[1,0],[1,-12],[0,-8]],[[9630,4329],[2,-19],[2,0],[1,1],[2,5],[0,7],[1,1],[2,-1],[-1,-2],[0,-6],[1,-3],[1,0],[1,-15],[1,-3],[0,-3],[-3,-5],[-4,0],[-3,-3],[-2,0],[0,4],[-2,3],[-2,6],[1,11],[-4,21],[0,5],[1,7],[2,0],[1,-5],[2,-6]],[[9654,4362],[-1,-3],[-4,1],[0,6],[2,3],[3,-3],[0,-4]],[[9651,4382],[-1,0],[-2,7],[3,5],[2,-4],[0,-6],[-2,0],[0,-2]],[[54,4359],[-2,-1],[-1,1],[1,2],[2,-2]],[[106,4415],[-1,2],[1,4],[1,-2],[-1,-4]],[[237,4374],[-8,0],[-4,3],[-1,0],[-3,5],[-1,3],[2,2],[4,1],[7,-4],[1,-4],[1,0],[2,-2],[0,-4]],[[212,4408],[4,-6],[1,-7],[-2,-7],[-2,2],[-5,-2],[-1,1],[-6,12],[-1,4],[3,-1],[5,3],[4,1]],[[6492,5911],[2,-1],[3,2],[7,1],[9,-7],[-2,-1],[-1,-3],[-4,-2],[-4,-5],[-11,-2],[-3,1],[-3,5],[-5,6],[2,4],[0,2],[1,2],[3,3],[3,-1],[3,-4]],[[6187,5988],[-2,2],[2,4],[1,-4],[-1,-2]],[[6182,6065],[-1,-2],[0,8],[1,1],[1,-4],[0,-2],[-1,-1]],[[6473,6142],[-14,-10],[-3,-5],[-4,-5],[-2,-7],[-2,-13],[1,-11],[0,-6],[-3,-4],[-4,-3],[-3,-4],[-3,-1],[-2,-4],[-2,-2],[-8,-7],[-8,-5],[-14,-6],[-5,-6],[-5,-4],[-7,-2],[-10,-6],[-5,-5],[-7,-8],[-2,-2],[-1,-6],[-2,-5],[-4,-8],[-3,-4],[-6,-3],[-5,0],[-8,2],[-2,-2],[-2,-3],[-6,-5],[-6,-12],[-5,-3],[-7,-3],[-5,-5],[-4,-2],[-4,-1],[-9,0],[-8,-1],[-7,-3],[-3,-6],[-4,-10],[-7,-4],[-1,-3],[-2,-8],[-4,-1],[-4,-2],[-4,4],[-7,-9],[-7,-2],[-3,-2],[-2,1],[-2,3],[-6,4],[-4,-2],[0,8],[-7,24],[1,22],[0,3],[-1,10],[-4,8],[0,11],[-1,8],[-2,8],[1,3],[0,2],[-2,12],[-1,3],[0,2],[1,2],[0,3],[-2,4],[-1,7],[-5,6],[1,5],[2,-3],[1,3],[0,3],[-3,16],[4,22],[-1,19]],[[6050,2479],[-1,-1],[-5,1],[-1,2],[3,5],[3,0],[2,-3],[-1,-4]],[[5912,3637],[-1,-13],[-4,-21],[-1,-10],[-3,-34],[-7,-24],[-7,-13],[-4,-4],[-3,-1],[-13,-26],[-4,-12],[-4,-18],[-4,-10],[-6,-21],[-6,-16],[-5,-15],[-9,-20],[-3,-6],[-3,-2],[-7,-12],[-10,-19],[-8,-17],[-11,-19],[-6,-8],[-10,-17],[-3,-2],[-11,-15],[-8,-9],[-13,-11],[-5,-3],[-12,3],[-5,-2],[-5,-6],[0,-10],[-4,-1],[-9,4],[-5,-1],[-2,-4],[-2,-7],[-7,0],[-11,6],[-17,5],[-6,-5],[-3,-1],[-9,1],[-6,3],[-5,0],[-3,-2],[-5,-1],[-13,-18],[-6,0],[-6,-2],[-8,3],[-5,-1],[-3,-3],[-7,-2],[-2,-2],[-12,-16],[-3,0],[-2,1],[-6,1],[-6,8],[-2,2],[0,5],[-2,4],[-3,0],[-2,4],[-4,0],[-3,-1],[0,10],[-1,5],[-2,2],[-5,-1],[-1,-1],[-1,-4],[0,-10],[-2,3],[-2,13],[1,7],[3,3],[0,6],[-4,16],[-2,5],[-3,4],[-2,9],[-2,3],[-1,6],[-2,5],[-1,7],[1,5],[2,2],[2,-3],[2,1],[4,6],[2,8],[0,22],[-3,22],[-8,21],[-7,21],[-9,33],[-5,20],[-6,40],[-6,22],[-7,22],[-1,1]],[[5815,3905],[8,3],[7,-2],[8,-7],[7,-2],[7,2],[6,0],[4,-1],[4,-2],[2,-3]],[[5776,3520],[-4,-2],[-3,-2]],[[5843,4282],[-18,0],[-7,-3],[-6,-4],[-6,-8],[-2,-2],[-3,-5],[-1,-6],[0,-17],[-2,-6],[-10,-7],[-7,-7],[-6,-7],[-5,-9],[-3,-12],[-6,-14],[-6,-13],[-5,-13],[-7,-5],[-6,1],[-7,6],[-5,1],[-4,-4],[-4,1],[-3,6],[-3,2],[-2,-2],[-3,0],[-5,3]],[[4750,9264],[-4,0],[4,4],[12,7],[5,6],[10,2],[0,-8],[-18,-6],[-9,-5]],[[5533,9468],[-4,-2],[-5,3],[-3,5],[2,1],[9,0],[2,-2],[-1,-5]],[[5599,9710],[12,-1],[5,-10],[2,-10],[5,-1],[7,2],[11,0],[9,-5],[-8,-4],[-1,-6],[6,-1],[10,-5],[5,-1],[10,2],[19,-8],[-22,-6],[-2,-1],[-6,-8],[-9,-6],[-4,-1],[-7,1],[-9,-7],[-7,0],[-3,9],[7,4],[1,2],[-9,2],[-9,-4],[-6,0],[-22,-3],[-4,1],[-1,6],[9,3],[1,5],[11,13],[-12,4],[-5,3],[-7,11],[-7,5],[1,5],[-5,0],[-4,3],[4,3],[34,4]],[[5745,9713],[-4,0],[-7,4],[-2,4],[5,2],[6,-5],[6,-2],[-4,-3]],[[5311,9711],[1,-4],[4,1],[6,-5],[7,-3],[5,-6],[2,-5],[-5,0],[-5,6],[-11,6],[-5,0],[-10,12],[-1,3],[-5,3],[-2,9],[11,-3],[6,-7],[-2,-3],[4,-4]],[[5806,9729],[8,-1],[8,1],[2,-1],[-11,-3],[-12,2],[-11,0],[-12,-3],[-4,1],[6,3],[7,1],[4,3],[9,0],[6,-3]],[[5465,9786],[5,3],[7,-1],[10,-3],[7,-5],[4,-6],[-8,-10],[5,-5],[13,10],[7,-3],[5,-4],[2,-9],[-2,-4],[9,-6],[11,1],[8,-2],[4,-5],[6,1],[1,4],[12,-2],[5,-3],[-8,-5],[7,-4],[10,-3],[6,-3],[2,-3],[-8,-4],[-10,0],[-10,-2],[-17,-1],[-4,-4],[-7,-4],[-9,-10],[-2,-5],[1,-8],[-5,-3],[-7,1],[-4,-2],[-2,-19],[-4,-10],[-10,-1],[-7,-6],[-7,-14],[-6,-6],[3,-4],[-7,-9],[2,-9],[-4,-3],[-6,-2],[-7,2],[-12,9],[-13,7],[-12,11],[-11,5],[-7,2],[-9,8],[-4,6],[2,7],[8,1],[6,-3],[3,0],[6,9],[36,5],[12,1],[11,0],[-5,7],[-22,-4],[-20,1],[-14,-5],[-21,0],[-8,5],[-2,3],[-1,7],[4,3],[12,-1],[20,5],[10,4],[10,0],[-1,4],[6,3],[25,0],[6,1],[0,2],[-7,0],[-6,3],[-2,3],[9,9],[-7,0],[-10,-7],[-6,-3],[-15,-1],[-4,5],[0,3],[-12,3],[-1,3],[-6,0],[-3,-2],[1,-6],[-2,-5],[6,-4],[-8,-3],[-7,-5],[-13,-2],[-14,0],[-6,3],[-14,11],[-5,6],[-8,3],[-5,4],[-1,3],[3,4],[-7,3],[-6,4],[5,2],[20,-5],[3,4],[-8,0],[-5,6],[-1,4],[6,7],[-3,1],[-11,0],[1,-5],[-8,-5],[-4,1],[-2,6],[-6,7],[-5,10],[2,6],[-3,6],[3,4],[11,-5],[1,4],[13,2],[11,-5],[5,5],[9,-3],[4,0],[10,3],[16,2],[6,-2],[1,-4],[-4,-2],[-21,-2],[-13,-7],[21,1],[2,-6],[6,-1],[6,-5],[6,-2],[-1,8],[1,6],[4,2],[11,11],[7,-2],[12,-13],[11,-18],[16,-7],[-6,13],[-4,10],[-2,10],[4,9],[4,3],[0,7],[4,2],[8,-2],[7,-6]],[[5902,9798],[-26,-2],[-3,1],[43,7],[10,1],[5,-2],[-29,-5]],[[5520,9809],[-6,-4],[-11,3],[4,4],[13,-3]],[[5579,9806],[3,-1],[16,0],[4,-5],[5,-1],[11,-5],[3,2],[1,16],[3,3],[4,0],[6,3],[12,-2],[-6,-14],[7,-1],[9,2],[7,6],[6,-1],[4,4],[3,0],[4,-4],[5,1],[5,-2],[15,-2],[11,-4],[16,0],[12,-1],[8,-5],[1,-9],[-3,-3],[-24,-10],[-9,-7],[-4,-7],[-3,-2],[-11,-4],[-14,2],[-10,-4],[-7,-5],[-10,-1],[-24,2],[-6,6],[5,4],[-26,-1],[-30,0],[-2,3],[-10,1],[-14,4],[-7,4],[5,2],[18,0],[8,7],[-18,1],[-6,-2],[-14,-1],[-19,2],[-11,6],[-2,4],[9,2],[8,4],[-14,2],[-12,4],[4,2],[20,1],[15,-4],[6,3],[-5,1],[-5,4],[2,5],[14,-7],[1,6],[-5,8],[3,1],[21,-6],[6,-5],[5,-2]],[[3105,5883],[-2,-7],[-1,3],[0,7],[-2,3],[0,3],[4,-4],[1,-5]],[[3251,6191],[-1,-1],[-1,1],[0,2],[2,-2]],[[3243,6198],[-1,0],[0,2],[1,0],[0,-2]],[[null,null,[45.05776636713733,-12.965686400215588],[45.05776636713733,-12.791192985990051],[45.02288856056384,-12.70474670738291],[45.05776636713733,-12.653519283023115],[45.13042846416545,-12.722356134506583],[45.20309056119359,-12.75757498875393],[45.20309056119359,-12.86163069448476],[45.16530627073897,-12.930467545968227],[45.16530627073897,-12.983295827339262]],[null,null],[null,null],[null,null],[null,null],[null,null]],[[null,null,[-60.9010100031487,14.46499848744078],[-61.08121200377843,14.46499848744078],[-61.11608981035194,14.517826768811815],[-61.04342771332382,14.586663620295283],[-61.11608981035194,14.604273047418957],[-61.15096761692543,14.639491901666318],[-61.22362971395356,14.796375888768168],[-61.22362971395356,14.847603313127962],[-61.15096761692543,14.86521274025165],[-61.04342771332382,14.812384458880615],[-60.970765616295694,14.743547607397147],[-60.9358878097222,14.743547607397147],[-60.9358878097222,14.67471075591368],[-60.9010100031487,14.639491901666318],[-60.9010100031487,14.604273047418957],[-60.828347906120584,14.482607914564454]],[null,null],[null,null],[null,null],[null,null],[null,null]],[[6549,3954],[-4,-2],[-3,1],[-5,5],[-2,3],[-2,9],[2,9],[4,2],[4,0],[2,-2],[2,-7],[3,-6],[-1,-8],[0,-4]],[[5345,7597],[0,1],[1,0],[0,-1],[-1,0]],[[226,4659],[2,1],[0,-3],[1,-4],[-1,-1],[-1,1],[-1,2],[0,4]],[[244,4647],[1,-2],[-1,-5],[-2,4],[2,3]],[[208,4692],[1,-1],[0,-1],[-1,-1],[0,3]],[[9952,4721],[2,6],[2,-2],[-2,-7],[-2,3]],[[9962,4754],[1,-1],[-1,-1],[0,2]],[[9975,4699],[1,-1],[1,-5],[-3,-4],[0,-2],[-1,-1],[0,3],[-1,4],[2,5],[1,1]],[[9995,4645],[0,-1],[1,-1],[-1,-3],[0,1],[-1,3],[0,1],[1,0]],[[9915,4466],[5,-1],[0,-3],[-4,1],[-1,3]],[[9920,4766],[-1,4],[1,-1],[0,-3]],[[9925,4832],[1,0],[-1,0],[0,0]],[[9897,4823],[0,-1],[0,-1],[0,1],[0,1]],[[9890,4859],[1,-1],[1,-3],[-1,2],[-2,2],[1,0]],[[5091,2051],[2,0],[2,-1],[0,-2],[-4,-1],[-1,1],[1,3]],[[4850,7265],[0,1],[1,0],[0,-2],[-1,1]],[[3298,6099],[-1,-1],[-1,1],[0,3],[1,3],[1,0],[1,-2],[0,-3],[-1,-1]],[[3288,6105],[-2,-2],[-1,0],[-1,5],[-1,14],[0,2],[1,1],[3,-1],[2,-4],[0,-12],[-1,-3]],[[3296,6118],[-6,0],[0,4],[1,4],[-1,4],[2,4],[1,-2],[2,-6],[5,-6],[-4,-2]],[[9627,6297],[1,-1],[0,-2],[-1,0],[0,1],[0,2]]],"transform":{"scale":[0.036003600360036005,0.01736158967459246],"translate":[-180,-89.99892578124998]},"bbox":[-180,-89.99892578124998,180,83.59960937500004]}
;
  Datamap.prototype.abwTopo = '__ABW__';
  Datamap.prototype.afgTopo = '__AFG__';
  Datamap.prototype.agoTopo = '__AGO__';
  Datamap.prototype.aiaTopo = '__AIA__';
  Datamap.prototype.albTopo = '__ALB__';
  Datamap.prototype.aldTopo = '__ALD__';
  Datamap.prototype.andTopo = '__AND__';
  Datamap.prototype.areTopo = '__ARE__';
  Datamap.prototype.argTopo = '__ARG__';
  Datamap.prototype.armTopo = '__ARM__';
  Datamap.prototype.asmTopo = '__ASM__';
  Datamap.prototype.ataTopo = '__ATA__';
  Datamap.prototype.atcTopo = '__ATC__';
  Datamap.prototype.atfTopo = '__ATF__';
  Datamap.prototype.atgTopo = '__ATG__';
  Datamap.prototype.ausTopo = '__AUS__';
  Datamap.prototype.autTopo = '__AUT__';
  Datamap.prototype.azeTopo = '__AZE__';
  Datamap.prototype.bdiTopo = '__BDI__';
  Datamap.prototype.belTopo = '__BEL__';
  Datamap.prototype.benTopo = '__BEN__';
  Datamap.prototype.bfaTopo = '__BFA__';
  Datamap.prototype.bgdTopo = '__BGD__';
  Datamap.prototype.bgrTopo = '__BGR__';
  Datamap.prototype.bhrTopo = '__BHR__';
  Datamap.prototype.bhsTopo = '__BHS__';
  Datamap.prototype.bihTopo = '__BIH__';
  Datamap.prototype.bjnTopo = '__BJN__';
  Datamap.prototype.blmTopo = '__BLM__';
  Datamap.prototype.blrTopo = '__BLR__';
  Datamap.prototype.blzTopo = '__BLZ__';
  Datamap.prototype.bmuTopo = '__BMU__';
  Datamap.prototype.bolTopo = '__BOL__';
  Datamap.prototype.braTopo = '__BRA__';
  Datamap.prototype.brbTopo = '__BRB__';
  Datamap.prototype.brnTopo = '__BRN__';
  Datamap.prototype.btnTopo = '__BTN__';
  Datamap.prototype.norTopo = '__NOR__';
  Datamap.prototype.bwaTopo = '__BWA__';
  Datamap.prototype.cafTopo = '__CAF__';
  Datamap.prototype.canTopo = '__CAN__';
  Datamap.prototype.cheTopo = '__CHE__';
  Datamap.prototype.chlTopo = '__CHL__';
  Datamap.prototype.chnTopo = '__CHN__';
  Datamap.prototype.civTopo = '__CIV__';
  Datamap.prototype.clpTopo = '__CLP__';
  Datamap.prototype.cmrTopo = '__CMR__';
  Datamap.prototype.codTopo = '__COD__';
  Datamap.prototype.cogTopo = '__COG__';
  Datamap.prototype.cokTopo = '__COK__';
  Datamap.prototype.colTopo = '__COL__';
  Datamap.prototype.comTopo = '__COM__';
  Datamap.prototype.cpvTopo = '__CPV__';
  Datamap.prototype.criTopo = '__CRI__';
  Datamap.prototype.csiTopo = '__CSI__';
  Datamap.prototype.cubTopo = '__CUB__';
  Datamap.prototype.cuwTopo = '__CUW__';
  Datamap.prototype.cymTopo = '__CYM__';
  Datamap.prototype.cynTopo = '__CYN__';
  Datamap.prototype.cypTopo = '__CYP__';
  Datamap.prototype.czeTopo = '__CZE__';
  Datamap.prototype.deuTopo = '__DEU__';
  Datamap.prototype.djiTopo = '__DJI__';
  Datamap.prototype.dmaTopo = '__DMA__';
  Datamap.prototype.dnkTopo = '__DNK__';
  Datamap.prototype.domTopo = '__DOM__';
  Datamap.prototype.dzaTopo = '__DZA__';
  Datamap.prototype.ecuTopo = '__ECU__';
  Datamap.prototype.egyTopo = '__EGY__';
  Datamap.prototype.eriTopo = '__ERI__';
  Datamap.prototype.esbTopo = '__ESB__';
  Datamap.prototype.espTopo = '__ESP__';
  Datamap.prototype.estTopo = '__EST__';
  Datamap.prototype.ethTopo = '__ETH__';
  Datamap.prototype.finTopo = '__FIN__';
  Datamap.prototype.fjiTopo = '__FJI__';
  Datamap.prototype.flkTopo = '__FLK__';
  Datamap.prototype.fraTopo = '__FRA__';
  Datamap.prototype.froTopo = '__FRO__';
  Datamap.prototype.fsmTopo = '__FSM__';
  Datamap.prototype.gabTopo = '__GAB__';
  Datamap.prototype.psxTopo = '__PSX__';
  Datamap.prototype.gbrTopo = '__GBR__';
  Datamap.prototype.geoTopo = '__GEO__';
  Datamap.prototype.ggyTopo = '__GGY__';
  Datamap.prototype.ghaTopo = '__GHA__';
  Datamap.prototype.gibTopo = '__GIB__';
  Datamap.prototype.ginTopo = '__GIN__';
  Datamap.prototype.gmbTopo = '__GMB__';
  Datamap.prototype.gnbTopo = '__GNB__';
  Datamap.prototype.gnqTopo = '__GNQ__';
  Datamap.prototype.grcTopo = '__GRC__';
  Datamap.prototype.grdTopo = '__GRD__';
  Datamap.prototype.grlTopo = '__GRL__';
  Datamap.prototype.gtmTopo = '__GTM__';
  Datamap.prototype.gumTopo = '__GUM__';
  Datamap.prototype.guyTopo = '__GUY__';
  Datamap.prototype.hkgTopo = '__HKG__';
  Datamap.prototype.hmdTopo = '__HMD__';
  Datamap.prototype.hndTopo = '__HND__';
  Datamap.prototype.hrvTopo = '__HRV__';
  Datamap.prototype.htiTopo = '__HTI__';
  Datamap.prototype.hunTopo = '__HUN__';
  Datamap.prototype.idnTopo = '__IDN__';
  Datamap.prototype.imnTopo = '__IMN__';
  Datamap.prototype.indTopo = '__IND__';
  Datamap.prototype.ioaTopo = '__IOA__';
  Datamap.prototype.iotTopo = '__IOT__';
  Datamap.prototype.irlTopo = '__IRL__';
  Datamap.prototype.irnTopo = '__IRN__';
  Datamap.prototype.irqTopo = '__IRQ__';
  Datamap.prototype.islTopo = '__ISL__';
  Datamap.prototype.isrTopo = '__ISR__';
  Datamap.prototype.itaTopo = '__ITA__';
  Datamap.prototype.jamTopo = '__JAM__';
  Datamap.prototype.jeyTopo = '__JEY__';
  Datamap.prototype.jorTopo = '__JOR__';
  Datamap.prototype.jpnTopo = '__JPN__';
  Datamap.prototype.kabTopo = '__KAB__';
  Datamap.prototype.kasTopo = '__KAS__';
  Datamap.prototype.kazTopo = '__KAZ__';
  Datamap.prototype.kenTopo = '__KEN__';
  Datamap.prototype.kgzTopo = '__KGZ__';
  Datamap.prototype.khmTopo = '__KHM__';
  Datamap.prototype.kirTopo = '__KIR__';
  Datamap.prototype.knaTopo = '__KNA__';
  Datamap.prototype.korTopo = '__KOR__';
  Datamap.prototype.kosTopo = '__KOS__';
  Datamap.prototype.kwtTopo = '__KWT__';
  Datamap.prototype.laoTopo = '__LAO__';
  Datamap.prototype.lbnTopo = '__LBN__';
  Datamap.prototype.lbrTopo = '__LBR__';
  Datamap.prototype.lbyTopo = '__LBY__';
  Datamap.prototype.lcaTopo = '__LCA__';
  Datamap.prototype.lieTopo = '__LIE__';
  Datamap.prototype.lkaTopo = '__LKA__';
  Datamap.prototype.lsoTopo = '__LSO__';
  Datamap.prototype.ltuTopo = '__LTU__';
  Datamap.prototype.luxTopo = '__LUX__';
  Datamap.prototype.lvaTopo = '__LVA__';
  Datamap.prototype.macTopo = '__MAC__';
  Datamap.prototype.mafTopo = '__MAF__';
  Datamap.prototype.marTopo = '__MAR__';
  Datamap.prototype.mcoTopo = '__MCO__';
  Datamap.prototype.mdaTopo = '__MDA__';
  Datamap.prototype.mdgTopo = '__MDG__';
  Datamap.prototype.mdvTopo = '__MDV__';
  Datamap.prototype.mexTopo = '__MEX__';
  Datamap.prototype.mhlTopo = '__MHL__';
  Datamap.prototype.mkdTopo = '__MKD__';
  Datamap.prototype.mliTopo = '__MLI__';
  Datamap.prototype.mltTopo = '__MLT__';
  Datamap.prototype.mmrTopo = '__MMR__';
  Datamap.prototype.mneTopo = '__MNE__';
  Datamap.prototype.mngTopo = '__MNG__';
  Datamap.prototype.mnpTopo = '__MNP__';
  Datamap.prototype.mozTopo = '__MOZ__';
  Datamap.prototype.mrtTopo = '__MRT__';
  Datamap.prototype.msrTopo = '__MSR__';
  Datamap.prototype.musTopo = '__MUS__';
  Datamap.prototype.mwiTopo = '__MWI__';
  Datamap.prototype.mysTopo = '__MYS__';
  Datamap.prototype.namTopo = '__NAM__';
  Datamap.prototype.nclTopo = '__NCL__';
  Datamap.prototype.nerTopo = '__NER__';
  Datamap.prototype.nfkTopo = '__NFK__';
  Datamap.prototype.ngaTopo = '__NGA__';
  Datamap.prototype.nicTopo = '__NIC__';
  Datamap.prototype.niuTopo = '__NIU__';
  Datamap.prototype.nldTopo = '__NLD__';
  Datamap.prototype.nplTopo = '__NPL__';
  Datamap.prototype.nruTopo = '__NRU__';
  Datamap.prototype.nulTopo = '__NUL__';
  Datamap.prototype.nzlTopo = '__NZL__';
  Datamap.prototype.omnTopo = '__OMN__';
  Datamap.prototype.pakTopo = '__PAK__';
  Datamap.prototype.panTopo = '__PAN__';
  Datamap.prototype.pcnTopo = '__PCN__';
  Datamap.prototype.perTopo = '__PER__';
  Datamap.prototype.pgaTopo = '__PGA__';
  Datamap.prototype.phlTopo = '__PHL__';
  Datamap.prototype.plwTopo = '__PLW__';
  Datamap.prototype.pngTopo = '__PNG__';
  Datamap.prototype.polTopo = '__POL__';
  Datamap.prototype.priTopo = '__PRI__';
  Datamap.prototype.prkTopo = '__PRK__';
  Datamap.prototype.prtTopo = '__PRT__';
  Datamap.prototype.pryTopo = '__PRY__';
  Datamap.prototype.pyfTopo = '__PYF__';
  Datamap.prototype.qatTopo = '__QAT__';
  Datamap.prototype.rouTopo = '__ROU__';
  Datamap.prototype.rusTopo = '__RUS__';
  Datamap.prototype.rwaTopo = '__RWA__';
  Datamap.prototype.sahTopo = '__SAH__';
  Datamap.prototype.sauTopo = '__SAU__';
  Datamap.prototype.scrTopo = '__SCR__';
  Datamap.prototype.sdnTopo = '__SDN__';
  Datamap.prototype.sdsTopo = '__SDS__';
  Datamap.prototype.senTopo = '__SEN__';
  Datamap.prototype.serTopo = '__SER__';
  Datamap.prototype.sgpTopo = '__SGP__';
  Datamap.prototype.sgsTopo = '__SGS__';
  Datamap.prototype.shnTopo = '__SHN__';
  Datamap.prototype.slbTopo = '__SLB__';
  Datamap.prototype.sleTopo = '__SLE__';
  Datamap.prototype.slvTopo = '__SLV__';
  Datamap.prototype.smrTopo = '__SMR__';
  Datamap.prototype.solTopo = '__SOL__';
  Datamap.prototype.somTopo = '__SOM__';
  Datamap.prototype.spmTopo = '__SPM__';
  Datamap.prototype.srbTopo = '__SRB__';
  Datamap.prototype.stpTopo = '__STP__';
  Datamap.prototype.surTopo = '__SUR__';
  Datamap.prototype.svkTopo = '__SVK__';
  Datamap.prototype.svnTopo = '__SVN__';
  Datamap.prototype.sweTopo = '__SWE__';
  Datamap.prototype.swzTopo = '__SWZ__';
  Datamap.prototype.sxmTopo = '__SXM__';
  Datamap.prototype.sycTopo = '__SYC__';
  Datamap.prototype.syrTopo = '__SYR__';
  Datamap.prototype.tcaTopo = '__TCA__';
  Datamap.prototype.tcdTopo = '__TCD__';
  Datamap.prototype.tgoTopo = '__TGO__';
  Datamap.prototype.thaTopo = '__THA__';
  Datamap.prototype.tjkTopo = '__TJK__';
  Datamap.prototype.tkmTopo = '__TKM__';
  Datamap.prototype.tlsTopo = '__TLS__';
  Datamap.prototype.tonTopo = '__TON__';
  Datamap.prototype.ttoTopo = '__TTO__';
  Datamap.prototype.tunTopo = '__TUN__';
  Datamap.prototype.turTopo = '__TUR__';
  Datamap.prototype.tuvTopo = '__TUV__';
  Datamap.prototype.twnTopo = '__TWN__';
  Datamap.prototype.tzaTopo = '__TZA__';
  Datamap.prototype.ugaTopo = '__UGA__';
  Datamap.prototype.ukrTopo = '__UKR__';
  Datamap.prototype.umiTopo = '__UMI__';
  Datamap.prototype.uryTopo = '__URY__';
  Datamap.prototype.usaTopo = {
    type: 'Topology',
    transform: {
      scale: [0.03514630243024302, 0.005240860686068607],
      translate: [-178.123152, 18.948267],
    },
    objects: {
      usa: {
        type: 'GeometryCollection',
        geometries: [
          {
            type: 'Polygon',
            id: 'AL',
            arcs: [[0, 1, 2, 3, 4]],
            properties: { name: 'Alabama' },
          },
          {
            type: 'MultiPolygon',
            id: 'AK',
            arcs: [
              [[5]],
              [[6]],
              [[7]],
              [[8]],
              [[9]],
              [[10]],
              [[11]],
              [[12]],
              [[13]],
              [[14]],
              [[15]],
              [[16]],
              [[17]],
              [[18]],
              [[19]],
              [[20]],
              [[21]],
              [[22]],
              [[23]],
              [[24]],
              [[25]],
              [[26]],
              [[27]],
              [[28]],
              [[29]],
              [[30]],
              [[31]],
              [[32]],
              [[33]],
              [[34]],
              [[35]],
              [[36]],
              [[37]],
              [[38]],
              [[39]],
              [[40]],
              [[41]],
              [[42]],
              [[43]],
            ],
            properties: { name: 'Alaska' },
          },
          {
            type: 'Polygon',
            id: 'AZ',
            arcs: [[44, 45, 46, 47, 48]],
            properties: { name: 'Arizona' },
          },
          {
            type: 'Polygon',
            id: 'AR',
            arcs: [[49, 50, 51, 52, 53, 54]],
            properties: { name: 'Arkansas' },
          },
          {
            type: 'Polygon',
            id: 'CA',
            arcs: [[55, -47, 56, 57]],
            properties: { name: 'California' },
          },
          {
            type: 'Polygon',
            id: 'CO',
            arcs: [[58, 59, 60, 61, 62, 63]],
            properties: { name: 'Colorado' },
          },
          {
            type: 'Polygon',
            id: 'CT',
            arcs: [[64, 65, 66, 67]],
            properties: { name: 'Connecticut' },
          },
          {
            type: 'Polygon',
            id: 'DE',
            arcs: [[68, 69, 70, 71]],
            properties: { name: 'Delaware' },
          },
          {
            type: 'Polygon',
            id: 'DC',
            arcs: [[72, 73]],
            properties: { name: 'District of Columbia' },
          },
          {
            type: 'Polygon',
            id: 'FL',
            arcs: [[74, 75, -2]],
            properties: { name: 'Florida' },
          },
          {
            type: 'Polygon',
            id: 'GA',
            arcs: [[76, 77, -75, -1, 78, 79]],
            properties: { name: 'Georgia' },
          },
          {
            type: 'MultiPolygon',
            id: 'HI',
            arcs: [[[80]], [[81]], [[82]], [[83]], [[84]]],
            properties: { name: 'Hawaii' },
          },
          {
            type: 'Polygon',
            id: 'ID',
            arcs: [[85, 86, 87, 88, 89, 90, 91]],
            properties: { name: 'Idaho' },
          },
          {
            type: 'Polygon',
            id: 'IL',
            arcs: [[92, 93, 94, 95, 96, 97]],
            properties: { name: 'Illinois' },
          },
          {
            type: 'Polygon',
            id: 'IN',
            arcs: [[98, 99, -95, 100, 101]],
            properties: { name: 'Indiana' },
          },
          {
            type: 'Polygon',
            id: 'IA',
            arcs: [[102, -98, 103, 104, 105, 106]],
            properties: { name: 'Iowa' },
          },
          {
            type: 'Polygon',
            id: 'KS',
            arcs: [[107, 108, -60, 109]],
            properties: { name: 'Kansas' },
          },
          {
            type: 'Polygon',
            id: 'KY',
            arcs: [[110, 111, 112, 113, -96, -100, 114]],
            properties: { name: 'Kentucky' },
          },
          {
            type: 'Polygon',
            id: 'LA',
            arcs: [[115, 116, 117, -52]],
            properties: { name: 'Louisiana' },
          },
          {
            type: 'Polygon',
            id: 'ME',
            arcs: [[118, 119]],
            properties: { name: 'Maine' },
          },
          {
            type: 'MultiPolygon',
            id: 'MD',
            arcs: [[[120]], [[-71, 121, 122, 123, 124, -74, 125, 126, 127]]],
            properties: { name: 'Maryland' },
          },
          {
            type: 'Polygon',
            id: 'MA',
            arcs: [[128, 129, 130, 131, -68, 132, 133, 134]],
            properties: { name: 'Massachusetts' },
          },
          {
            type: 'MultiPolygon',
            id: 'MI',
            arcs: [[[-102, 135, 136]], [[137]], [[138, 139]], [[140]]],
            properties: { name: 'Michigan' },
          },
          {
            type: 'Polygon',
            id: 'MN',
            arcs: [[-107, 141, 142, 143, 144]],
            properties: { name: 'Minnesota' },
          },
          {
            type: 'Polygon',
            id: 'MS',
            arcs: [[-4, 145, -116, -51, 146]],
            properties: { name: 'Mississippi' },
          },
          {
            type: 'Polygon',
            id: 'MO',
            arcs: [[-97, -114, 147, -55, 148, -108, 149, -104]],
            properties: { name: 'Missouri' },
          },
          {
            type: 'Polygon',
            id: 'MT',
            arcs: [[150, 151, -92, 152, 153]],
            properties: { name: 'Montana' },
          },
          {
            type: 'Polygon',
            id: 'NE',
            arcs: [[-105, -150, -110, -59, 154, 155]],
            properties: { name: 'Nebraska' },
          },
          {
            type: 'Polygon',
            id: 'NV',
            arcs: [[156, -48, -56, 157, -88]],
            properties: { name: 'Nevada' },
          },
          {
            type: 'Polygon',
            id: 'NH',
            arcs: [[-135, 158, 159, -120, 160]],
            properties: { name: 'New Hampshire' },
          },
          {
            type: 'Polygon',
            id: 'NJ',
            arcs: [[161, -69, 162, 163]],
            properties: { name: 'New Jersey' },
          },
          {
            type: 'Polygon',
            id: 'NM',
            arcs: [[164, 165, 166, -45, -62]],
            properties: { name: 'New Mexico' },
          },
          {
            type: 'Polygon',
            id: 'NY',
            arcs: [[-133, -67, 167, -164, 168, 169, 170]],
            properties: { name: 'New York' },
          },
          {
            type: 'Polygon',
            id: 'NC',
            arcs: [[171, 172, -80, 173, 174]],
            properties: { name: 'North Carolina' },
          },
          {
            type: 'Polygon',
            id: 'ND',
            arcs: [[175, -154, 176, -143]],
            properties: { name: 'North Dakota' },
          },
          {
            type: 'Polygon',
            id: 'OH',
            arcs: [[177, -115, -99, -137, 178, 179]],
            properties: { name: 'Ohio' },
          },
          {
            type: 'Polygon',
            id: 'OK',
            arcs: [[-149, -54, 180, -165, -61, -109]],
            properties: { name: 'Oklahoma' },
          },
          {
            type: 'Polygon',
            id: 'OR',
            arcs: [[-89, -158, -58, 181, 182]],
            properties: { name: 'Oregon' },
          },
          {
            type: 'Polygon',
            id: 'PA',
            arcs: [[-163, -72, -128, 183, -180, 184, -169]],
            properties: { name: 'Pennsylvania' },
          },
          {
            type: 'MultiPolygon',
            id: 'RI',
            arcs: [[[185, -130]], [[186, -65, -132]]],
            properties: { name: 'Rhode Island' },
          },
          {
            type: 'Polygon',
            id: 'SC',
            arcs: [[187, -77, -173]],
            properties: { name: 'South Carolina' },
          },
          {
            type: 'Polygon',
            id: 'SD',
            arcs: [[-142, -106, -156, 188, -151, -176]],
            properties: { name: 'South Dakota' },
          },
          {
            type: 'Polygon',
            id: 'TN',
            arcs: [[189, -174, -79, -5, -147, -50, -148, -113]],
            properties: { name: 'Tennessee' },
          },
          {
            type: 'Polygon',
            id: 'TX',
            arcs: [[-53, -118, 190, -166, -181]],
            properties: { name: 'Texas' },
          },
          {
            type: 'Polygon',
            id: 'UT',
            arcs: [[191, -63, -49, -157, -87]],
            properties: { name: 'Utah' },
          },
          {
            type: 'Polygon',
            id: 'VT',
            arcs: [[-134, -171, 192, -159]],
            properties: { name: 'Vermont' },
          },
          {
            type: 'MultiPolygon',
            id: 'VA',
            arcs: [
              [[193, -123]],
              [[120]],
              [[-126, -73, -125, 194, -175, -190, -112, 195]],
            ],
            properties: { name: 'Virginia' },
          },
          {
            type: 'MultiPolygon',
            id: 'WA',
            arcs: [[[-183, 196, -90]], [[197]], [[198]]],
            properties: { name: 'Washington' },
          },
          {
            type: 'Polygon',
            id: 'WV',
            arcs: [[-184, -127, -196, -111, -178]],
            properties: { name: 'West Virginia' },
          },
          {
            type: 'Polygon',
            id: 'WI',
            arcs: [[199, -93, -103, -145, 200, -140]],
            properties: { name: 'Wisconsin' },
          },
          {
            type: 'Polygon',
            id: 'WY',
            arcs: [[-189, -155, -64, -192, -86, -152]],
            properties: { name: 'Wyoming' },
          },
        ],
      },
    },
    arcs: [
      [
        [2632, 3060],
        [5, -164],
        [7, -242],
        [4, -53],
        [3, -30],
        [-2, -19],
        [4, -11],
        [-5, -25],
        [0, -24],
        [-2, -32],
        [2, -57],
        [-2, -51],
        [3, -52],
      ],
      [
        [2649, 2300],
        [-14, -1],
        [-59, 0],
        [-1, -25],
        [6, -37],
        [-1, -31],
        [2, -16],
        [-4, -28],
      ],
      [
        [2578, 2162],
        [-4, -6],
        [-7, 31],
        [-1, 47],
        [-2, 6],
        [-3, -36],
        [-1, -34],
        [-7, 9],
      ],
      [
        [2553, 2179],
        [-2, 291],
        [6, 363],
        [4, 209],
        [-3, 20],
      ],
      [
        [2558, 3062],
        [24, 1],
        [50, -3],
      ],
      [
        [1324, 6901],
        [1, 32],
        [6, -19],
        [-1, -32],
        [-8, 4],
        [2, 15],
      ],
      [
        [1317, 6960],
        [5, -23],
        [-3, -33],
        [-2, 11],
        [0, 45],
      ],
      [
        [1285, 7153],
        [6, 5],
        [3, -8],
        [-1, -28],
        [-6, -6],
        [-5, 17],
        [3, 20],
      ],
      [
        [1267, 7137],
        [12, -7],
        [3, -36],
        [13, -41],
        [4, -25],
        [0, -21],
        [3, -4],
        [1, -27],
        [5, -27],
        [0, -25],
        [3, 8],
        [2, -19],
        [1, -74],
        [-3, -17],
        [-7, 3],
        [-3, 38],
        [-2, -3],
        [-6, 28],
        [-2, -10],
        [-5, 10],
        [1, -28],
        [5, 7],
        [3, -10],
        [-2, -39],
        [-5, 4],
        [-9, 49],
        [-2, 25],
        [1, 26],
        [-7, -2],
        [0, 20],
        [5, 2],
        [5, 18],
        [-2, 31],
        [-6, 7],
        [-1, 50],
        [-2, 25],
        [-4, -18],
        [-2, 28],
        [4, 14],
        [-3, 32],
        [2, 8],
      ],
      [
        [1263, 6985],
        [5, -12],
        [4, 15],
        [4, -7],
        [-4, -28],
        [-6, 8],
        [-3, 24],
      ],
      [
        [1258, 7247],
        [-4, 19],
        [5, 13],
        [15, -18],
        [7, 1],
        [5, -36],
        [9, -29],
        [-1, -22],
        [-5, -11],
        [-6, 5],
        [-5, -14],
        [-6, 9],
        [-7, -9],
        [-1, 45],
        [0, 30],
        [-5, 1],
        [-1, 16],
      ],
      [
        [1252, 7162],
        [-4, 14],
        [-4, 32],
        [0, 24],
        [3, 11],
        [4, -11],
        [0, 20],
        [12, -35],
        [1, -33],
        [-4, -5],
        [-3, -37],
        [3, -11],
        [-3, -43],
        [-5, 9],
        [0, -27],
        [-3, 13],
        [-2, 54],
        [5, 25],
      ],
      [
        [1207, 7331],
        [8, 38],
        [3, -16],
        [7, -13],
        [6, -2],
        [0, -30],
        [6, -99],
        [0, -85],
        [-1, -22],
        [-4, 13],
        [-10, 84],
        [-7, 25],
        [3, 20],
        [-3, 48],
        [-8, 39],
      ],
      [
        [1235, 7494],
        [10, -15],
        [5, 2],
        [0, -14],
        [8, -52],
        [-5, 8],
        [-2, -18],
        [6, -27],
        [2, -48],
        [-6, -13],
        [-2, -16],
        [-10, -35],
        [-3, 1],
        [-1, 37],
        [2, 22],
        [-1, 32],
        [-3, 40],
        [0, 21],
        [-2, 51],
        [-4, 22],
        [-1, 38],
        [7, -36],
      ],
      [
        [1203, 7324],
        [4, 0],
        [4, -35],
        [-2, -24],
        [-6, -5],
        [0, 38],
        [0, 26],
      ],
      [
        [1207, 7331],
        [-5, 7],
        [-3, 26],
        [-6, 18],
        [-5, 37],
        [-6, 17],
        [1, 30],
        [4, 10],
        [1, 26],
        [3, -11],
        [8, -1],
        [6, 17],
        [8, -23],
        [-5, -26],
        [2, -9],
        [4, 28],
        [10, -9],
        [5, -21],
        [-3, -38],
        [3, -3],
        [3, -50],
        [-7, -7],
        [-14, 41],
        [0, -42],
        [-4, -17],
      ],
      [
        [883, 7871],
        [-12, -48],
        [-1, -19],
        [-9, -12],
        [2, 29],
        [10, 30],
        [7, 34],
        [3, -14],
      ],
      [
        [870, 7943],
        [-2, -39],
        [-4, -41],
        [-6, 14],
        [5, 47],
        [7, 19],
      ],
      [
        [863, 9788],
        [3, -8],
        [15, -9],
        [8, 5],
        [10, 0],
        [12, -7],
        [7, 4],
        [7, -15],
        [12, -18],
        [16, -4],
        [5, 10],
        [11, 6],
        [4, 14],
        [12, 2],
        [0, -9],
        [7, 5],
        [15, -15],
        [9, -24],
        [10, -11],
        [2, -11],
        [8, -2],
        [8, -18],
        [1, -11],
        [5, 9],
        [6, -7],
        [0, -1783],
        [13, -16],
        [2, 17],
        [14, -24],
        [8, 30],
        [18, 4],
        [-3, -52],
        [4, -17],
        [10, -17],
        [2, -27],
        [29, -101],
        [4, -63],
        [6, 17],
        [12, 31],
        [7, 1],
        [3, 23],
        [0, 34],
        [5, 0],
        [1, 31],
        [9, 7],
        [13, 26],
        [13, -45],
        [-1, -27],
        [3, -27],
        [7, -7],
        [10, -40],
        [-1, -12],
        [4, -22],
        [12, -25],
        [19, -110],
        [3, -29],
        [6, -29],
        [8, -65],
        [9, -55],
        [-3, -23],
        [9, -9],
        [-2, -33],
        [7, -14],
        [1, -38],
        [7, 2],
        [14, -40],
        [9, -7],
        [5, -19],
        [4, -5],
        [1, -19],
        [9, -5],
        [3, -23],
        [-4, -43],
        [1, -36],
        [4, -58],
        [-4, -15],
        [-6, -53],
        [-10, -39],
        [-3, 20],
        [-4, -6],
        [-3, 39],
        [1, 17],
        [-3, 20],
        [7, 21],
        [-2, 7],
        [-7, -26],
        [-3, 17],
        [-4, -10],
        [-12, 42],
        [4, 46],
        [-8, -15],
        [0, -23],
        [-6, 17],
        [-1, 22],
        [4, 24],
        [-1, 24],
        [-6, -19],
        [-6, 42],
        [-3, -8],
        [-2, 36],
        [5, 23],
        [6, 0],
        [-2, 28],
        [3, 36],
        [-5, -1],
        [-9, 32],
        [-6, 37],
        [-15, 27],
        [0, 77],
        [-4, 9],
        [1, 31],
        [-5, 9],
        [-8, 42],
        [-2, 22],
        [-12, 7],
        [-14, 56],
        [-6, 132],
        [-3, -30],
        [1, -27],
        [6, -53],
        [-1, -8],
        [3, -43],
        [0, -28],
        [-6, 6],
        [-4, 31],
        [-6, 6],
        [-8, -9],
        [0, 45],
        [-5, 38],
        [-5, -12],
        [-17, 40],
        [-2, -11],
        [10, -13],
        [7, -31],
        [3, -1],
        [1, -25],
        [4, -30],
        [-10, -16],
        [-5, 10],
        [0, -26],
        [-8, 20],
        [-2, 14],
        [-5, 0],
        [-13, 38],
        [-10, 33],
        [-1, 20],
        [-5, 30],
        [-14, 21],
        [-9, 21],
        [-14, 26],
        [-9, 24],
        [1, 26],
        [2, -9],
        [3, 17],
        [-3, 38],
        [4, 21],
        [-2, 9],
        [-7, -40],
        [-14, -26],
        [-18, 10],
        [-14, 24],
        [-1, 18],
        [-7, -4],
        [-7, 14],
        [-17, 12],
        [-9, 1],
        [-21, -10],
        [-8, -7],
        [-10, 27],
        [-12, 12],
        [-3, 17],
        [-2, 28],
        [-8, -2],
        [-3, -25],
        [-15, 34],
        [-2, 14],
        [-15, -27],
        [-7, -32],
        [-3, 30],
        [3, 17],
        [4, -5],
        [14, 22],
        [-2, 17],
        [-6, -8],
        [-3, 22],
        [-6, 3],
        [-6, 55],
        [-3, -13],
        [-8, -8],
        [-3, 8],
        [-3, -18],
        [-11, 6],
        [-1, -20],
        [-7, -5],
        [-3, 7],
        [2, 36],
        [-3, -1],
        [-5, -38],
        [7, -12],
        [1, -27],
        [4, -30],
        [-3, -31],
        [-5, 10],
        [-2, -15],
        [6, -7],
        [3, -41],
        [-8, -9],
        [-4, 9],
        [-7, -12],
        [-3, 10],
        [-9, -2],
        [0, 16],
        [-4, -10],
        [-3, -20],
        [-3, 18],
        [-5, -25],
        [2, -12],
        [-6, -15],
        [-6, -2],
        [-3, -20],
        [-6, -17],
        [-4, 6],
        [-5, -21],
        [-4, 1],
        [-8, -43],
        [-9, -3],
        [-3, 14],
        [-5, -23],
        [-11, 17],
        [2, 33],
        [8, 11],
        [4, -2],
        [2, 13],
        [8, 25],
        [0, 21],
        [-11, -28],
        [-9, 16],
        [-1, 12],
        [5, 48],
        [8, 34],
        [1, 29],
        [2, 5],
        [1, 30],
        [-4, 34],
        [10, 12],
        [19, 48],
        [4, -19],
        [6, -5],
        [9, 20],
        [-10, 26],
        [-4, 20],
        [-7, -2],
        [-5, 9],
        [-2, -8],
        [-9, -14],
        [-4, -26],
        [-9, -6],
        [-9, -30],
        [-1, -20],
        [-7, -11],
        [-2, -22],
        [-5, -13],
        [-2, -39],
        [-10, -25],
        [5, -20],
        [-4, -29],
        [-9, -5],
        [-1, -38],
        [-8, -13],
        [-3, 15],
        [-4, -29],
        [-5, -1],
        [1, -21],
        [-11, -13],
        [-2, -57],
        [12, -3],
        [10, -16],
        [3, -19],
        [-4, -30],
        [-7, -19],
        [-6, -1],
        [0, -17],
        [-4, -6],
        [1, -21],
        [-4, -31],
        [-9, -29],
        [-5, 0],
        [-5, -11],
        [-5, 2],
        [-4, -11],
        [2, -16],
        [-7, -8],
        [-2, -23],
        [-5, 14],
        [-5, -45],
        [-9, 4],
        [1, -24],
        [-6, 6],
        [-3, -11],
        [0, -32],
        [-6, -50],
        [-10, -6],
        [-7, -23],
        [-2, -13],
        [-5, 18],
        [-8, -48],
        [-2, 13],
        [-5, -4],
        [-1, -27],
        [-5, -10],
        [-6, 4],
        [-4, -27],
        [8, -9],
        [-9, -60],
        [-25, -20],
        [-6, -54],
        [-2, 12],
        [1, 33],
        [-5, 6],
        [-6, -13],
        [-1, -14],
        [-10, -22],
        [-4, -25],
        [-1, 18],
        [-2, -21],
        [-6, 14],
        [-10, -33],
        [-8, 2],
        [1, 25],
        [-4, 24],
        [-3, -20],
        [1, -21],
        [-11, -64],
        [-3, 16],
        [-1, -24],
        [-8, 4],
        [-1, 38],
        [-4, 8],
        [-2, -14],
        [4, -16],
        [-2, -27],
        [-5, -13],
        [-5, 29],
        [-5, 2],
        [-1, -11],
        [5, -17],
        [-9, -27],
        [6, -7],
        [0, -13],
        [-5, 9],
        [-7, -25],
        [-15, 1],
        [-7, -16],
        [0, -13],
        [-8, -15],
        [-6, 6],
        [-2, 35],
        [6, 12],
        [4, 43],
        [6, 1],
        [13, 28],
        [10, 1],
        [4, -27],
        [3, 20],
        [-1, 23],
        [6, 10],
        [7, 0],
        [8, 50],
        [10, 45],
        [12, 40],
        [15, 18],
        [6, -9],
        [6, 12],
        [1, -17],
        [-3, -19],
        [4, -14],
        [1, 23],
        [7, 2],
        [2, -15],
        [5, -5],
        [0, 18],
        [-8, 15],
        [0, 11],
        [5, 49],
        [6, 28],
        [9, 27],
        [15, 24],
        [10, 35],
        [5, -13],
        [4, 5],
        [-1, 22],
        [1, 21],
        [8, 44],
        [11, 28],
        [8, 38],
        [0, 21],
        [7, 148],
        [11, 40],
        [-1, 31],
        [-27, -45],
        [-8, 6],
        [-2, 18],
        [-5, 9],
        [-1, 21],
        [-4, -10],
        [-3, -32],
        [5, -41],
        [-6, -18],
        [-5, 7],
        [-9, 64],
        [-6, 33],
        [-4, 0],
        [-2, -24],
        [-3, -4],
        [-4, 19],
        [-5, 4],
        [-2, 32],
        [-16, -37],
        [-13, -26],
        [-1, -14],
        [-11, -22],
        [-6, 20],
        [5, 23],
        [-1, 54],
        [-4, 57],
        [7, 24],
        [-6, 49],
        [-5, 27],
        [-4, 39],
        [-6, 17],
        [-2, -34],
        [-7, -8],
        [-12, -22],
        [-14, -9],
        [-7, 2],
        [-7, 12],
        [-1, 30],
        [-5, 9],
        [-9, 42],
        [-8, 8],
        [-8, 46],
        [6, 21],
        [1, 39],
        [-5, -8],
        [0, 24],
        [2, 19],
        [-6, 18],
        [0, -19],
        [-7, 8],
        [-1, 32],
        [-6, 4],
        [-3, 22],
        [0, 27],
        [-5, -12],
        [-1, 26],
        [7, 6],
        [-6, 30],
        [10, 2],
        [0, 35],
        [2, 24],
        [18, 77],
        [4, 23],
        [3, -5],
        [-2, 33],
        [7, 55],
        [6, 22],
        [11, 9],
        [8, -9],
        [12, -33],
        [8, 4],
        [11, 32],
        [11, 49],
        [6, 6],
        [1, -13],
        [13, 0],
        [12, 10],
        [11, 52],
        [0, 12],
        [-5, 48],
        [-1, 28],
        [-8, 31],
        [-3, 26],
        [8, -7],
        [8, 22],
        [0, 20],
        [-10, 39],
        [-8, -30],
        [-7, 5],
        [-6, -17],
        [-8, -4],
        [-2, -11],
        [-9, -17],
        [-2, -28],
        [-5, -12],
        [-2, 34],
        [-5, 7],
        [-4, -26],
        [-2, 12],
        [-10, 19],
        [-20, -1],
        [-14, -21],
        [-6, -3],
        [-11, 13],
        [-22, 14],
        [-6, 12],
        [-3, 19],
        [2, 26],
        [-8, 22],
        [2, 24],
        [5, 12],
        [-2, 31],
        [-8, 0],
        [-6, 8],
        [-13, 6],
        [-7, 16],
        [-10, 16],
        [-1, 19],
        [16, 27],
        [20, 43],
        [15, 27],
        [8, -15],
        [8, -3],
        [2, 21],
        [-5, 3],
        [-1, 18],
        [20, 29],
        [22, 22],
        [12, 2],
        [7, -7],
        [-4, -32],
        [2, -22],
        [-3, -15],
        [4, -26],
        [8, 5],
        [10, -5],
        [11, 6],
        [4, -10],
        [7, -2],
        [7, 10],
        [8, -11],
        [9, 42],
        [5, 2],
        [5, -8],
        [2, 24],
        [-12, 11],
        [-11, -9],
        [1, 31],
        [-8, 34],
        [-10, 10],
        [-2, 30],
        [7, 8],
        [9, -31],
        [-1, -24],
        [4, -18],
        [10, -22],
        [2, 23],
        [-11, 30],
        [5, 54],
        [-4, 10],
        [-11, -12],
        [-11, 3],
        [-2, 10],
        [-6, -10],
        [-24, 23],
        [0, 24],
        [-7, 54],
        [-6, 19],
        [-9, 17],
        [-19, 46],
        [-9, 18],
        [-8, 4],
        [-13, 31],
        [-12, 18],
        [-1, 6],
        [9, 10],
        [4, 29],
        [1, 59],
        [25, -4],
        [31, 13],
        [8, 11],
        [12, 29],
        [12, 45],
        [3, 45],
        [5, 38],
        [10, 33],
        [5, 24],
        [13, 38],
        [2, -10],
        [11, -3],
        [16, 20],
        [10, 21],
        [24, 64],
        [9, 4],
        [1, -10],
        [9, 7],
        [9, -2],
        [18, 9],
        [17, 28],
        [17, 58],
        [7, 13],
        [2, -10],
        [26, -24],
        [2, -17],
        [-9, -22],
        [-4, -1],
        [0, -29],
        [14, 9],
        [0, 16],
        [6, 14],
        [2, -8],
        [5, 33],
        [13, -30],
        [-2, -23],
        [8, -6],
        [5, -14],
        [7, 22],
        [13, 1],
        [7, 7],
        [18, -7],
        [10, -8],
        [-5, -45],
        [17, -12],
        [2, -11],
        [16, -20],
        [1, 9],
        [12, 13],
        [11, -1],
        [0, -11],
        [7, -1],
        [7, 15],
        [11, 2],
        [9, -6],
        [11, -16],
        [5, 3],
        [7, -22],
        [4, 9],
        [7, -7],
        [5, -13],
      ],
      [
        [717, 7456],
        [-1, -8],
        [-9, 13],
        [7, 49],
        [6, 4],
        [4, 45],
        [5, -40],
        [4, 14],
        [8, -22],
        [0, -31],
        [-11, -4],
        [-5, -13],
        [-8, -7],
      ],
      [
        [688, 7363],
        [8, 25],
        [-8, 6],
        [0, 22],
        [6, 14],
        [5, -10],
        [0, -22],
        [3, 15],
        [0, 32],
        [5, -15],
        [1, 21],
        [5, -12],
        [5, 0],
        [5, 11],
        [7, -20],
        [0, -55],
        [9, 4],
        [-6, -37],
        [-11, 15],
        [4, -24],
        [-3, -20],
        [-6, 10],
        [0, -38],
        [-8, -10],
        [-3, -16],
        [-5, 15],
        [-6, -40],
        [-4, -4],
        [-5, -18],
        [-2, 43],
        [-6, -23],
        [-1, 13],
        [-6, 14],
        [0, 39],
        [-6, 15],
        [4, 45],
        [11, 28],
        [7, -2],
        [1, -21],
      ],
      [
        [671, 7185],
        [-6, -39],
        [-2, 6],
        [8, 33],
      ],
      [
        [640, 7055],
        [4, -2],
        [-1, -40],
        [-8, 6],
        [-1, 13],
        [6, 23],
      ],
      [
        [519, 6933],
        [-2, -41],
        [-9, -33],
        [5, 51],
        [2, -5],
        [4, 28],
      ],
      [
        [501, 6947],
        [5, 0],
        [0, -20],
        [-5, -23],
        [-5, 15],
        [-3, -14],
        [-2, 35],
        [2, 12],
        [8, -5],
      ],
      [
        [451, 6875],
        [1, -16],
        [-3, -11],
        [-3, 18],
        [5, 9],
      ],
      [
        [447, 8527],
        [-4, -19],
        [-2, 16],
        [6, 3],
      ],
      [
        [436, 6781],
        [6, -7],
        [-1, -16],
        [-5, 1],
        [0, 22],
      ],
      [
        [358, 6745],
        [2, -22],
        [-5, -10],
        [-1, 23],
        [4, 9],
      ],
      [
        [352, 6718],
        [-8, -21],
        [-2, 14],
        [3, 19],
        [7, -12],
      ],
      [
        [335, 7902],
        [6, 7],
        [2, -14],
        [5, 3],
        [6, -12],
        [1, -54],
        [-3, -18],
        [-7, -11],
        [-2, -18],
        [-11, 20],
        [-5, -1],
        [-10, 28],
        [-4, 0],
        [-6, 15],
        [-3, 25],
        [4, 7],
        [10, -7],
        [5, 20],
        [5, 2],
        [3, 14],
        [4, -6],
      ],
      [
        [334, 6690],
        [5, -14],
        [-10, -36],
        [1, -6],
        [12, 26],
        [0, -15],
        [-5, -17],
        [-8, -12],
        [-1, -18],
        [-8, -18],
        [-7, -1],
        [-5, -18],
        [-9, -16],
        [-5, 17],
        [9, 20],
        [3, -3],
        [8, 16],
        [-2, 19],
        [4, 20],
        [6, -9],
        [1, 12],
        [-7, 4],
        [-4, 14],
        [4, 23],
        [11, 13],
        [2, -26],
        [5, 25],
      ],
      [
        [266, 6527],
        [10, 37],
        [1, 16],
        [4, 17],
        [7, 9],
        [3, -10],
        [1, -25],
        [-12, -27],
        [-6, -40],
        [-6, -13],
        [-2, 36],
      ],
      [
        [238, 6477],
        [2, -19],
        [-8, -1],
        [-1, 13],
        [7, 7],
      ],
      [
        [227, 7303],
        [-4, -18],
        [-1, 18],
        [5, 0],
      ],
      [
        [212, 6440],
        [2, -18],
        [-5, -13],
        [-1, 19],
        [4, 12],
      ],
      [
        [182, 8542],
        [22, -28],
        [13, 24],
        [6, -2],
        [5, -14],
        [2, -23],
        [11, -12],
        [4, -12],
        [15, -5],
        [8, -8],
        [-4, -28],
        [-7, 6],
        [-8, -5],
        [-4, -13],
        [-4, -28],
        [-5, 26],
        [-6, 18],
        [-6, 2],
        [-3, 20],
        [-15, 25],
        [-6, 1],
        [-11, -22],
        [-7, 11],
        [-4, 23],
        [4, 44],
      ],
      [
        [162, 6381],
        [0, -22],
        [-5, -4],
        [1, 19],
        [4, 7],
      ],
      [
        [128, 6335],
        [4, -8],
        [10, 1],
        [1, -7],
        [-13, -9],
        [-2, 23],
      ],
      [
        [108, 6360],
        [0, 19],
        [4, 7],
        [6, -19],
        [-2, -17],
        [-4, 1],
        [1, -20],
        [-5, -2],
        [-12, -21],
        [-6, 6],
        [2, 15],
        [7, -2],
        [9, 33],
      ],
      [
        [47, 6279],
        [5, 3],
        [0, -24],
        [-6, 3],
        [-8, -28],
        [-4, 37],
        [4, 1],
        [0, 29],
        [5, 1],
        [0, -21],
        [4, -1],
      ],
      [
        [28, 6296],
        [3, -9],
        [-2, -32],
        [-5, -10],
        [0, 20],
        [4, 31],
      ],
      [
        [0, 6291],
        [5, -1],
        [4, -23],
        [-4, -27],
        [-5, 51],
      ],
      [
        [9993, 6496],
        [6, -13],
        [0, -19],
        [-11, -12],
        [-8, 31],
        [0, 15],
        [13, -2],
      ],
      [
        [1966, 3444],
        [-1, -1081],
      ],
      [
        [1965, 2363],
        [-57, 0],
        [-34, 71],
        [-73, 150],
        [3, 43],
      ],
      [
        [1804, 2627],
        [6, 8],
        [1, 16],
        [-1, 36],
        [-4, 1],
        [-2, 71],
        [6, 27],
        [0, 28],
        [-1, 45],
        [4, 34],
        [4, 12],
        [4, 25],
        [-6, 27],
        [-4, 51],
        [-5, 31],
        [0, 24],
      ],
      [
        [1806, 3063],
        [2, 26],
        [0, 36],
        [-3, 36],
        [-2, 112],
        [11, 7],
        [3, -23],
        [3, 1],
        [3, 33],
        [0, 153],
      ],
      [
        [1823, 3444],
        [101, 2],
        [42, -2],
      ],
      [
        [2515, 3253],
        [-1, -35],
        [-4, -11],
        [-1, -29],
        [-5, -31],
        [0, -46],
        [-3, -34],
        [-3, -5],
      ],
      [
        [2498, 3062],
        [2, -17],
        [-4, -14],
        [-2, -33],
        [-3, -8],
        [0, -38],
        [-5, -10],
        [0, -13],
        [-6, -31],
        [2, -21],
        [-5, -30],
        [-5, -59],
        [5, -25],
        [-2, -16],
        [1, -39],
        [-2, -26],
      ],
      [
        [2474, 2682],
        [-69, 3],
        [-13, 0],
      ],
      [
        [2392, 2685],
        [0, 101],
        [-4, 8],
        [-5, -9],
        [-3, 18],
      ],
      [
        [2380, 2803],
        [1, 335],
        [-5, 211],
      ],
      [
        [2376, 3349],
        [4, 0],
        [123, -1],
        [2, -36],
        [-4, -23],
        [-4, -36],
        [18, 0],
      ],
      [
        [1654, 4398],
        [0, -331],
        [0, -241],
        [36, -171],
        [35, -169],
        [27, -137],
        [20, -101],
        [34, -185],
      ],
      [
        [1804, 2627],
        [-38, -18],
        [-30, -16],
        [-4, 25],
        [0, 40],
        [-2, 47],
        [-4, 33],
        [-9, 46],
        [-12, 43],
        [-2, -12],
        [-4, 8],
        [1, 18],
        [-5, 39],
        [-7, -8],
        [-12, 28],
        [-2, 23],
        [-8, 28],
        [-9, -1],
        [-7, 13],
        [-10, -6],
        [-5, 26],
        [1, 53],
        [-1, 8],
        [1, 38],
        [-8, 28],
        [0, 39],
        [-3, 2],
        [-4, 33],
        [-4, 8],
        [-1, 20],
        [-11, 79],
        [-5, 23],
        [-1, 61],
        [2, -5],
        [2, 37],
        [-4, 33],
        [-5, -4],
        [-7, 30],
        [-2, 24],
        [0, 23],
        [-3, 31],
        [0, 50],
        [5, 0],
        [-2, 70],
        [-2, -7],
        [-1, -35],
        [-5, -7],
        [-7, 26],
        [-1, 45],
        [-4, 35],
        [-6, 22],
        [-3, 25],
        [-9, 50],
        [2, 14],
        [-4, 64],
        [2, 35],
        [-3, 54],
        [-7, 52],
        [-7, 29],
        [-2, 35],
        [7, 83],
        [2, 29],
        [-2, 22],
        [3, 57],
        [-2, 52],
        [-3, 13],
        [1, 42],
      ],
      [
        [1534, 4399],
        [28, 1],
        [24, 1],
        [38, -3],
        [30, 0],
      ],
      [
        [2107, 4208],
        [57, 0],
        [0, -191],
      ],
      [
        [2164, 4017],
        [1, -574],
      ],
      [
        [2165, 3443],
        [-28, 1],
      ],
      [
        [2137, 3444],
        [-38, -1],
        [-72, 0],
        [-15, 1],
        [-46, 0],
      ],
      [
        [1966, 3444],
        [0, 223],
        [-1, 21],
        [0, 162],
        [0, 357],
      ],
      [
        [1965, 4207],
        [32, 1],
        [63, -1],
        [47, 1],
      ],
      [
        [3025, 4400],
        [0, -113],
        [-2, -18],
      ],
      [
        [3023, 4269],
        [-2, 3],
        [-12, -14],
        [-15, 4],
        [-7, -26],
        [-7, -9],
        [-8, -22],
      ],
      [
        [2972, 4205],
        [-2, 22],
        [7, 21],
        [-2, 16],
        [2, 144],
      ],
      [
        [2977, 4408],
        [12, -2],
        [36, -3],
        [0, -3],
      ],
      [
        [2922, 3980],
        [-2, -23],
      ],
      [
        [2920, 3957],
        [-3, -13],
        [0, -30],
        [5, -29],
        [1, -47],
        [6, -49],
        [3, -2],
        [1, -66],
      ],
      [
        [2933, 3721],
        [-19, 2],
        [-2, 241],
      ],
      [
        [2912, 3964],
        [5, 21],
        [5, -5],
      ],
      [
        [2876, 3786],
        [-2, 27],
      ],
      [
        [2874, 3813],
        [2, 12],
        [4, -19],
        [-4, -20],
      ],
      [
        [2649, 2300],
        [4, -55],
        [39, -13],
        [37, -14],
        [1, -41],
        [4, 1],
        [1, 39],
        [-1, 35],
        [2, 15],
        [7, -16],
        [8, -7],
      ],
      [
        [2751, 2244],
        [1, -83],
        [4, -93],
        [8, -122],
        [13, -131],
        [-2, -9],
        [1, -61],
        [5, -68],
        [8, -137],
        [2, -42],
        [0, -44],
        [-3, -158],
        [-3, -3],
        [-3, -49],
        [1, -16],
        [-5, -36],
        [-2, 9],
        [-6, -15],
        [-9, -8],
        [-2, 20],
        [1, 29],
        [-7, 85],
        [-5, 15],
        [-4, -11],
        [-3, 47],
        [-1, 38],
        [-6, 43],
        [-2, 28],
        [1, 41],
        [-3, 8],
        [1, -24],
        [-3, -7],
        [-9, 104],
        [-4, 26],
        [9, 76],
        [-6, -4],
        [-4, -24],
        [-3, 38],
        [5, 104],
        [1, 87],
        [-4, 21],
        [-1, 28],
        [-5, 6],
        [-7, 46],
        [-5, 19],
        [0, 28],
        [-4, 11],
        [-3, 31],
        [-11, 42],
        [-9, -10],
        [0, -29],
        [-3, 5],
        [-12, -35],
        [-12, -9],
        [0, 21],
        [-3, 25],
        [-15, 57],
        [-10, 24],
        [-10, 6],
        [-8, -4],
        [-17, -18],
      ],
      [
        [2703, 3063],
        [-6, -41],
        [0, -20],
        [9, -40],
        [3, 3],
        [5, -42],
        [1, -22],
        [4, -40],
        [7, -24],
        [3, -35],
        [8, -33],
        [0, -22],
        [5, -35],
        [7, -29],
        [2, -32],
        [1, -40],
        [3, -14],
        [5, -51],
        [0, -33],
        [7, -16],
      ],
      [
        [2767, 2497],
        [-7, -65],
        [-2, -34],
        [-3, -29],
        [0, -30],
        [-3, -14],
        [-1, -81],
      ],
      [
        [2632, 3060],
        [37, 1],
      ],
      [
        [2669, 3061],
        [20, -1],
        [14, 3],
      ],
      [
        [640, 0],
        [-7, 17],
        [-1, 16],
        [1, 43],
        [-5, 73],
        [4, 24],
        [2, 34],
        [-2, 22],
        [1, 23],
        [8, -27],
        [9, -20],
        [5, -29],
        [0, -26],
        [8, -40],
        [-5, -34],
        [-8, -15],
        [-7, -25],
        [-3, -36],
      ],
      [
        [613, 397],
        [3, -26],
        [4, 11],
        [9, -30],
        [-1, -27],
        [-9, -14],
        [-2, 6],
        [-1, 33],
        [-5, 7],
        [-1, 19],
        [3, 21],
      ],
      [
        [602, 432],
        [-3, -20],
        [-7, 0],
        [2, 22],
        [8, -2],
      ],
      [
        [574, 525],
        [3, -45],
        [-2, -26],
        [-6, -5],
        [-4, 54],
        [4, 1],
        [5, 21],
      ],
      [
        [531, 626],
        [3, -2],
        [2, -20],
        [-1, -28],
        [-4, -18],
        [-9, 22],
        [1, 31],
        [8, 15],
      ],
      [
        [1908, 4871],
        [0, -472],
      ],
      [
        [1908, 4399],
        [-31, -1],
        [-54, 0],
      ],
      [
        [1823, 4398],
        [-85, 1],
      ],
      [
        [1738, 4399],
        [0, 349],
        [4, 62],
        [-2, 16],
        [-6, 3],
        [-2, 26],
        [6, 68],
        [3, 6],
        [3, 29],
        [-1, 17],
        [4, 23],
        [1, 34],
        [6, 56],
        [-2, 26],
        [-7, 14],
        [-4, 32],
      ],
      [
        [1741, 5160],
        [0, 34],
        [-3, 33],
        [0, 16],
        [0, 255],
        [0, 236],
      ],
      [
        [1738, 5734],
        [28, 0],
      ],
      [
        [1766, 5734],
        [0, -195],
        [9, -54],
        [1, -52],
        [5, -23],
        [6, -8],
        [0, -14],
        [11, -51],
        [1, -21],
        [8, -20],
        [0, -12],
        [8, 1],
        [-4, -71],
        [-1, -45],
        [3, -29],
        [-5, -21],
        [2, -20],
        [-1, -21],
        [6, -20],
        [7, 26],
        [3, 21],
        [5, -19],
        [-1, -15],
        [3, -37],
        [5, -39],
        [3, -13],
        [0, -37],
        [3, -16],
        [6, -2],
        [4, -61],
        [3, -11],
        [3, 18],
        [9, -1],
        [7, 17],
        [3, -10],
        [7, 9],
        [2, -11],
        [5, 8],
        [7, 39],
        [4, -33],
        [5, -20],
      ],
      [
        [2489, 4496],
        [53, -3],
        [28, 0],
      ],
      [
        [2570, 4493],
        [-1, -37],
        [4, -43],
        [5, -70],
      ],
      [
        [2578, 4343],
        [0, -450],
        [-3, -35],
        [3, -40],
        [1, -34],
        [-4, -27],
        [-1, -25],
        [-5, -41],
        [-3, -3],
        [0, -24],
        [-2, -9],
        [-1, -45],
        [0, -13],
      ],
      [
        [2563, 3597],
        [-3, -27],
        [2, -34],
        [-11, -17],
        [-1, -20],
        [2, -25],
        [-3, -16],
        [-11, 29],
        [-3, -2],
        [-4, -33],
        [1, -11],
      ],
      [
        [2532, 3441],
        [-5, 2],
        [-6, 55],
        [2, 12],
        [-2, 37],
        [0, 29],
        [-9, 41],
        [-3, -4],
        [-3, 25],
        [-9, 38],
        [0, 31],
        [5, 49],
        [-1, 18],
        [3, 23],
        [-4, 13],
        [-6, 9],
        [-3, -18],
        [-3, 11],
        [-1, 63],
        [-10, 41],
        [-9, 49],
        [-3, 58],
        [-1, 39],
        [3, 27],
      ],
      [
        [2467, 4089],
        [0, 35],
        [8, 21],
        [1, 29],
        [4, 19],
        [0, 33],
        [-4, 27],
        [2, 34],
        [11, 9],
        [9, 24],
        [0, 29],
        [4, 13],
        [1, 37],
        [0, 24],
        [-7, 18],
        [-1, 20],
        [-6, 35],
      ],
      [
        [2655, 4340],
        [0, -228],
        [0, -266],
      ],
      [
        [2655, 3846],
        [-2, -9],
        [2, -52],
        [-5, -1],
        [-5, -18],
        [-8, 9],
        [1, -38],
        [-5, -16],
        [-2, -24],
        [-5, -9],
        [-3, -48],
        [-3, -13],
        [-6, 18],
        [-1, 22],
        [-7, -24],
        [1, -21],
        [-7, -7],
        [-1, 19],
        [-8, -19],
        [-2, -20],
        [-7, 28],
        [-4, -6],
        [-2, 13],
        [-3, -13],
        [-7, -2],
        [-3, -18],
      ],
      [
        [2578, 4343],
        [3, -12],
        [8, 0],
        [9, 22],
      ],
      [
        [2598, 4353],
        [23, 0],
        [34, 0],
        [0, -13],
      ],
      [
        [2473, 4685],
        [0, -28],
        [4, -19],
        [-3, -23],
        [1, -43],
        [2, -30],
        [10, -22],
        [2, -24],
      ],
      [
        [2467, 4089],
        [-3, 7],
        [-6, 38],
        [-3, -1],
        [-40, -5],
        [-39, -2],
        [-33, 3],
      ],
      [
        [2343, 4129],
        [-3, 25],
        [2, 49],
        [-3, 43],
        [0, 48],
        [-5, 17],
        [-1, 26],
        [2, 23],
        [-2, 33],
        [-4, 13],
        [-5, 86],
      ],
      [
        [2324, 4492],
        [-5, 41],
        [2, 29],
        [1, 37],
        [2, 14],
        [-3, 19],
        [1, 33],
        [-2, 16],
        [4, 4],
      ],
      [
        [2324, 4685],
        [144, 0],
        [5, 0],
      ],
      [
        [2356, 4017],
        [3, -18],
        [9, -14],
        [-6, -56],
        [4, -18],
        [4, -45],
        [6, -10],
        [0, -412],
      ],
      [
        [2376, 3444],
        [-156, 0],
        [-55, -1],
      ],
      [
        [2164, 4017],
        [5, 0],
        [187, 0],
      ],
      [
        [2718, 3716],
        [-1, -57],
        [4, -37],
        [4, -28],
        [2, -22],
        [5, -22],
        [4, -3],
      ],
      [
        [2736, 3547],
        [-11, -51],
        [-11, -29],
        [0, -14],
        [-4, -13],
        [0, -16],
        [-6, -8],
        [-1, -21],
        [-16, -27],
      ],
      [
        [2687, 3368],
        [0, -3],
        [-24, 2],
        [-22, 6],
        [-5, -2],
        [-32, 8],
        [-36, -5],
        [-6, 9],
        [1, -35],
        [-36, 2],
        [-3, -2],
      ],
      [
        [2524, 3348],
        [1, 24],
        [5, -8],
        [2, 77],
      ],
      [
        [2655, 3846],
        [11, 0],
        [5, -40],
        [1, -17],
        [9, -7],
        [6, -26],
        [5, 13],
        [10, -14],
        [4, 19],
        [4, 6],
        [1, -32],
        [3, -6],
        [4, -26],
      ],
      [
        [2474, 2682],
        [3, -22],
        [-2, -9],
        [-1, -38],
        [5, -24],
        [0, -57],
        [-3, -44],
        [-7, -27],
        [-2, -43],
        [-2, 4],
        [-1, -70],
        [-3, -2],
        [2, -37],
        [-2, -14],
        [54, 0],
        [-3, -63],
        [4, -41],
        [1, -32],
        [4, -20],
      ],
      [
        [2521, 2143],
        [-9, -26],
        [0, -19],
        [7, -12],
        [3, 30],
        [6, -30],
        [-1, -24],
        [-3, -11],
        [-7, 10],
        [1, -18],
        [-2, -27],
        [5, -24],
        [9, -7],
        [3, -29],
        [3, -4],
        [-5, -32],
        [-5, 6],
        [-4, 33],
        [-10, 18],
        [0, 33],
        [-6, -11],
        [1, -27],
        [-3, -25],
        [-3, -4],
        [-3, 28],
        [-7, 1],
        [-2, -29],
        [-4, -9],
        [-5, 18],
        [-4, 2],
        [-3, 47],
        [-7, 21],
        [-2, -3],
        [-3, 40],
        [-7, -5],
        [0, 24],
        [-8, -23],
        [1, -18],
        [-5, -17],
        [-9, 8],
        [-10, 27],
        [-7, 11],
        [-16, -9],
        [-2, -8],
      ],
      [
        [2398, 2049],
        [-2, 19],
        [6, 68],
        [-2, 37],
        [2, 20],
        [-1, 26],
        [3, 19],
        [3, 50],
        [0, 40],
        [-8, 78],
        [0, 41],
        [-7, 42],
        [0, 196],
      ],
      [
        [3046, 5029],
        [12, 26],
        [-2, 13],
        [5, 30],
        [4, 13],
        [-1, 12],
        [5, 18],
        [-1, 33],
        [2, 50],
        [5, 17],
        [1, 53],
        [22, 147],
        [6, -7],
        [0, -35],
        [4, -13],
        [9, 21],
        [6, 0],
        [4, 14],
        [8, -31],
        [4, -25],
        [1, -214],
        [-1, -51],
        [10, -14],
        [-2, -22],
        [3, -21],
        [-2, -18],
        [4, -30],
        [5, 7],
        [5, -68],
        [-6, -31],
        [-3, 12],
        [-3, -21],
        [-4, 5],
        [0, -18],
        [-6, 2],
        [-8, -40],
        [-2, 28],
        [-3, 2],
        [1, -30],
        [-6, -15],
        [-2, 24],
        [-3, -12],
        [-7, 0],
        [0, 28],
        [-5, -6],
        [1, -20],
        [-4, -42],
        [1, -12],
        [-6, -23],
        [-5, 9],
        [-3, -24],
        [-4, -3],
        [-4, -20],
        [-4, 4],
        [-1, 21],
        [-7, -34],
        [2, -21],
        [-5, -7],
        [0, -18],
        [-5, -22],
        [-5, -50],
      ],
      [
        [3056, 4600],
        [-3, 14],
        [0, 19],
        [-4, 22],
        [-2, 250],
        [-1, 124],
      ],
      [
        [2904, 3626],
        [2, 0],
        [-1, 0],
        [-1, 0],
      ],
      [
        [2933, 3721],
        [-6, -80],
      ],
      [
        [2927, 3641],
        [-4, -3],
        [-8, -12],
      ],
      [
        [2915, 3626],
        [-6, -8],
        [0, 31],
        [-2, 13],
        [3, 13],
        [-4, 32],
        [-2, -14],
        [-6, 3],
        [-2, 35],
        [2, 0],
        [0, 45],
        [2, 18],
        [-2, 60],
        [3, 36],
        [5, 6],
        [0, 37],
        [-3, -5],
        [0, -18],
        [-8, -25],
        [-2, -21],
        [0, -56],
        [-3, -26],
        [1, -44],
        [4, -30],
        [-1, -23],
        [3, -23],
        [-2, -16],
        [-6, 30],
        [-10, 15],
        [-2, 29],
        [-6, -16],
        [-2, 23],
        [5, 29],
      ],
      [
        [2874, 3756],
        [2, 30],
      ],
      [
        [2874, 3813],
        [-4, 18],
        [-6, 10],
        [0, 28],
        [-3, 15],
        [-4, 4],
      ],
      [
        [2857, 3888],
        [-4, 53],
        [-4, 0],
        [-5, 18],
        [-3, -15],
        [-5, 1],
        [-1, -21],
        [-8, 14],
        [-6, -28],
        [-3, 6],
        [-6, -33],
        [-6, -17],
        [1, 98],
      ],
      [
        [2807, 3964],
        [105, 0],
      ],
      [
        [3053, 4565],
        [1, -34],
        [-1, -27],
        [-5, -25],
        [0, -29],
        [6, -4],
        [4, -31],
        [0, -24],
        [3, -6],
        [0, -22],
        [8, -19],
        [9, 18],
        [-2, -26],
        [-13, -23],
        [-5, -1],
        [-3, 18],
        [-5, -6],
        [0, -13],
        [-5, -9],
      ],
      [
        [3045, 4302],
        [-3, 35],
      ],
      [
        [3042, 4337],
        [0, 6],
      ],
      [
        [3042, 4343],
        [-3, 14],
        [-2, 45],
        [-4, 0],
        [-8, -2],
      ],
      [
        [2977, 4408],
        [0, 7],
        [6, 126],
      ],
      [
        [2983, 4541],
        [23, -3],
      ],
      [
        [3006, 4538],
        [34, -7],
        [3, 18],
        [7, 19],
        [3, -3],
      ],
      [
        [2598, 4353],
        [5, 25],
        [4, 43],
        [4, 26],
        [3, 36],
        [1, 52],
        [0, 57],
        [-9, 111],
        [3, 42],
        [-2, 50],
        [6, 51],
        [2, 43],
        [-1, 23],
        [5, 9],
        [0, 31],
        [8, 9],
        [5, 34],
        [0, -69],
        [3, -3],
        [3, 35],
        [1, 58],
        [2, 15],
        [8, 9],
        [-3, 41],
        [5, 35],
        [7, 2],
        [7, -22],
        [7, -3],
        [3, -28],
        [6, -2],
        [9, -25],
        [3, 1],
        [4, -41],
        [-3, -21],
        [3, -29],
        [2, -32],
        [-2, -71],
        [-6, -18],
        [-1, -37],
        [-7, -12],
        [-4, -44],
        [2, -17],
        [6, -15],
        [6, 24],
        [6, 49],
        [10, 19],
        [5, -15],
        [3, -27],
        [3, -80],
        [0, -39],
        [3, -48],
        [-3, -69],
        [-4, -11],
        [-1, 25],
        [-3, -7],
        [-3, -58],
        [-6, -21],
        [-2, -44],
        [-7, -37],
        [0, -16],
      ],
      [
        [2694, 4347],
        [-39, -7],
      ],
      [
        [2635, 5110],
        [1, -23],
        [-4, -4],
        [1, 33],
        [2, -6],
      ],
      [
        [2496, 5270],
        [11, 20],
        [5, 23],
        [12, 9],
        [8, 29],
        [4, 1],
        [3, 20],
        [9, 28],
        [4, 24],
        [7, 15],
        [6, -13],
        [-11, -59],
        [-2, -19],
        [0, -36],
        [5, 27],
        [10, -4],
        [8, -19],
        [7, -52],
        [3, -10],
        [7, 9],
        [2, -12],
        [7, -6],
        [16, 44],
        [8, 4],
        [10, -2],
        [7, 15],
        [6, 1],
        [1, -54],
        [5, -7],
        [6, 8],
        [2, -12],
        [4, 16],
        [8, 5],
        [1, -67],
        [3, -28],
        [6, -8],
        [1, 19],
        [5, 0],
        [3, -20],
        [-3, -14],
        [-15, 12],
        [-8, -8],
        [-8, 23],
        [-2, -21],
        [1, -18],
        [-4, 4],
        [-5, 27],
        [-9, 15],
        [-5, 1],
        [-4, -25],
        [-8, -6],
        [-8, 5],
        [-3, -10],
        [-1, -21],
        [-9, -18],
        [1, 25],
        [-4, 5],
        [-2, -26],
        [-6, -1],
        [-3, -11],
        [-5, -45],
        [-8, -58],
        [1, -5],
      ],
      [
        [2576, 4989],
        [-4, 20],
        [2, 27],
        [-7, 4],
        [3, 26],
        [0, 34],
        [-5, 23],
        [-4, 24],
        [-12, 19],
        [-4, -7],
        [-12, 29],
        [-29, 38],
        [-3, 33],
        [-5, 11],
      ],
      [
        [2541, 5539],
        [-7, -24],
        [-4, -3],
        [1, 19],
        [18, 45],
        [-4, -31],
        [-4, -6],
      ],
      [
        [2324, 4685],
        [0, 343],
        [-7, 22],
        [-5, 36],
        [8, 41],
        [1, 22],
      ],
      [
        [2321, 5149],
        [-1, 76],
        [-4, 20],
        [-2, 42],
        [0, 51],
        [-1, 8],
        [-1, 123],
        [-5, 65],
        [-3, 36],
        [0, 77],
        [1, 27],
        [-3, 60],
      ],
      [
        [2302, 5734],
        [59, 0],
        [0, 73],
        [5, -2],
        [4, -14],
        [4, -100],
        [3, -11],
        [9, -3],
        [1, -10],
        [11, -4],
        [1, -21],
        [10, 5],
        [0, 9],
        [7, 10],
        [6, -4],
        [8, -16],
        [2, -19],
        [4, 2],
        [4, -43],
        [2, 18],
        [7, 8],
        [1, -18],
        [9, -12],
        [0, -17],
        [4, -14],
        [8, 8],
        [5, 18],
        [8, 12],
        [2, -28],
        [5, 6],
        [6, -6],
        [6, 4],
        [8, -24],
        [7, 4],
        [0, -10],
        [-10, -24],
        [-13, -19],
        [-9, -20],
        [-12, -49],
        [-5, -31],
        [-8, -34],
        [-13, -46],
        [2, -16],
      ],
      [
        [2450, 5296],
        [-2, 9],
        [-6, -16],
        [0, -113],
        [-2, -11],
        [-8, -16],
        [-6, -41],
        [-1, -27],
        [3, -2],
        [4, -24],
        [-3, -29],
        [0, -33],
        [-2, -70],
        [8, -34],
        [6, -3],
        [3, -21],
        [8, -21],
        [2, -25],
        [8, -33],
        [5, -7],
        [5, -42],
        [-1, -30],
        [2, -22],
      ],
      [
        [2553, 2179],
        [-3, -8],
        [-7, 4],
        [-3, 12],
        [-7, -8],
        [-9, -22],
        [-3, -14],
      ],
      [
        [2498, 3062],
        [53, 0],
        [7, 0],
      ],
      [
        [2524, 3348],
        [-2, 0],
        [-2, 0],
        [1, -47],
        [-6, -48],
      ],
      [
        [2376, 3349],
        [0, 95],
      ],
      [
        [2356, 4017],
        [-7, 50],
        [-6, 62],
      ],
      [
        [2108, 5151],
        [0, -181],
        [-1, 0],
      ],
      [
        [2107, 4970],
        [-53, 1],
        [-90, 0],
        [-56, 0],
        [0, -100],
      ],
      [
        [1766, 5734],
        [130, -1],
        [58, 1],
        [154, 0],
      ],
      [
        [2108, 5734],
        [0, -217],
        [0, -366],
      ],
      [
        [2107, 4208],
        [0, 382],
      ],
      [
        [2107, 4590],
        [21, 0],
        [49, -1],
        [88, 0],
        [1, -10],
        [15, -34],
        [4, 19],
        [4, -4],
        [13, 0],
        [15, -36],
        [2, -27],
        [5, -5],
      ],
      [
        [1823, 4398],
        [0, -954],
      ],
      [
        [1654, 4398],
        [37, -1],
        [47, 2],
      ],
      [
        [3006, 4538],
        [-2, 14],
        [0, 28],
        [3, 11],
        [-1, 27],
        [3, 81],
        [5, 37],
        [2, 43],
        [3, 16],
        [-1, 47],
        [10, 17],
        [5, 33],
        [-3, 31],
        [4, 32],
        [0, 18],
      ],
      [
        [3034, 4973],
        [4, 49],
        [6, -5],
        [2, 12],
      ],
      [
        [3056, 4600],
        [-3, -35],
      ],
      [
        [2962, 4152],
        [-5, -13],
        [-2, -29],
        [8, -14],
        [0, -22],
        [-3, -103],
        [-9, -76],
        [-6, -22],
        [-5, -48],
        [-3, 31],
        [-8, 16],
        [-10, 42],
        [-1, 28],
        [0, 4],
        [2, 11],
      ],
      [
        [2922, 3980],
        [8, 15],
        [0, 15],
        [9, 31],
        [2, 17],
        [-9, 39],
        [0, 24],
        [-3, 6],
        [-1, 22],
        [5, 33],
        [-3, 20],
        [7, 40],
        [2, 21],
        [4, 13],
      ],
      [
        [2943, 4276],
        [13, -41],
        [9, -28],
        [-3, -55],
      ],
      [
        [2137, 3444],
        [0, -95],
      ],
      [
        [2137, 3349],
        [-1, 0],
        [0, -474],
        [0, -193],
        [0, -192],
        [-101, 0],
        [-1, -18],
        [3, -22],
      ],
      [
        [2037, 2450],
        [-48, 0],
        [0, -87],
        [-24, 0],
      ],
      [
        [2972, 4205],
        [13, -15],
        [2, 11],
        [10, 0],
        [6, 6],
        [8, 31],
        [1, -22],
        [5, -10],
        [-11, -28],
        [-22, -42],
        [-9, -8],
        [-6, 2],
        [-5, -9],
        [-2, 31],
      ],
      [
        [2943, 4276],
        [-2, 14],
        [-4, 1],
        [-5, 32],
        [1, 29],
        [-4, 22],
        [-2, -2],
        [-3, 27],
        [-125, 0],
        [0, 48],
        [0, 3],
      ],
      [
        [2799, 4450],
        [17, 54],
        [3, 26],
        [5, 18],
        [-2, 32],
        [-2, 7],
        [-2, 52],
        [17, 22],
        [15, -1],
        [6, -5],
        [6, -21],
        [4, 8],
        [12, -1],
        [8, 14],
        [8, 34],
        [5, 1],
        [0, 52],
        [3, 31],
        [-7, 21],
        [2, 24],
        [11, 32],
        [4, 28],
        [14, 64],
        [13, 32],
        [19, -5],
        [23, 4],
      ],
      [
        [2981, 4973],
        [1, -39],
        [-2, -36],
        [3, -34],
        [-1, -37],
        [-3, -39],
        [2, -52],
        [-1, -16],
        [4, -31],
        [-1, -132],
        [0, -16],
      ],
      [
        [2909, 3359],
        [4, -77],
        [-8, 8],
        [-1, -10],
        [-10, -11],
        [-1, -11],
        [-7, -3],
        [0, -13],
        [8, 9],
        [1, -8],
        [9, 9],
        [3, -18],
        [5, 8],
        [2, -46],
        [-2, -22],
        [-3, -2],
        [-8, -47],
        [-9, -2],
        [-2, -33],
        [4, -32],
        [4, -6],
        [-6, -54],
        [-6, 7],
        [-9, -6],
        [-6, -11],
        [-10, -37],
        [-7, -48],
        [-4, -60],
        [-6, 13],
        [-11, -12],
      ],
      [
        [2833, 2844],
        [-32, 181],
        [-32, 4],
        [1, 21],
        [-5, 33],
        [-3, -12],
        [0, 20],
        [-35, 10],
        [-8, -8],
        [-6, -17],
        [-10, -13],
      ],
      [
        [2669, 3061],
        [1, 45],
        [5, 4],
        [3, 31],
        [7, 29],
        [7, 1],
        [7, 29],
        [8, 10],
        [6, 43],
        [4, 13],
        [1, -19],
        [11, 37],
        [5, -8],
        [4, 36],
        [5, 9],
        [1, 45],
      ],
      [
        [2744, 3366],
        [20, -5],
        [19, -3],
        [23, -1],
        [103, 2],
      ],
      [
        [2321, 5149],
        [-213, 2],
      ],
      [
        [2108, 5734],
        [194, 0],
      ],
      [
        [2777, 4138],
        [-4, -10],
        [2, -21],
        [0, -29],
        [-4, -46],
        [-3, -70],
        [-11, -62],
        [-3, -8],
        [-4, 12],
        [-3, -27],
        [-3, 1],
        [-4, -36],
        [1, -22],
        [-3, -18],
        [-4, 29],
        [-5, -46],
        [1, -29],
        [-3, -11],
        [-1, -25],
        [-8, -4],
      ],
      [
        [2694, 4347],
        [11, -26],
        [3, -15],
        [3, 14],
        [6, -30],
        [4, -9],
        [14, 25],
        [7, -6],
        [9, 36],
        [12, 34],
        [14, 24],
      ],
      [
        [2777, 4394],
        [0, -256],
      ],
      [
        [2380, 2803],
        [-11, 21],
        [-3, 22],
        [-7, 18],
        [-2, -16],
        [-8, 1],
        [-1, 10],
        [-7, -19],
        [-3, 11],
        [-6, -10],
        [-5, -29],
        [-2, 17],
        [-6, 14],
        [-7, 0],
        [-2, 21],
        [-7, -42],
        [-2, 24],
        [-3, -8],
        [-3, 16],
        [-7, 15],
        [-5, -25],
        [-2, 26],
        [-4, 3],
        [-2, 21],
        [-6, 8],
        [-3, -18],
        [-3, 16],
        [-5, -2],
        [-6, 17],
        [-6, -2],
        [-2, 36],
        [-9, 2],
        [-4, -6],
        [-6, 37],
        [-2, -3],
        [0, 370],
        [-52, 0],
        [-34, 0],
      ],
      [
        [1534, 4399],
        [-4, 22],
        [-2, 61],
        [0, 43],
        [-4, 33],
        [3, 32],
        [2, 51],
        [4, 54],
        [2, 48],
        [3, 162],
        [0, 22],
        [3, 71],
        [1, 99],
        [-2, 54],
        [1, 32],
        [12, 29],
      ],
      [
        [1553, 5212],
        [5, -22],
        [4, 5],
        [3, 2],
        [6, -20],
        [3, -23],
        [1, -57],
        [15, -21],
        [12, 30],
        [8, 3],
        [9, -10],
        [1, -13],
        [16, 27],
        [3, -9],
        [9, 5],
        [7, 19],
        [12, 17],
        [12, 4],
        [4, 12],
        [58, -1],
      ],
      [
        [2807, 3964],
        [-30, 0],
        [0, 174],
      ],
      [
        [2777, 4394],
        [5, 11],
        [17, 45],
      ],
      [
        [3045, 4302],
        [-6, -4],
        [3, 39],
      ],
      [
        [3042, 4343],
        [-4, 3],
        [-3, -28],
        [-1, -40],
        [-11, -9],
      ],
      [
        [2833, 2844],
        [-5, -10],
        [-6, -31],
        [-6, -49],
        [-1, -40],
        [-5, -31],
        [-6, 0],
        [-2, -23],
        [-6, -25],
        [-4, -28],
        [-6, -11],
        [-6, -29],
        [-1, -14],
        [-6, -16],
        [-6, -40],
      ],
      [
        [2107, 4590],
        [0, 380],
      ],
      [
        [2687, 3368],
        [57, -2],
      ],
      [
        [2398, 2049],
        [-5, -1],
        [-14, -26],
        [-6, 15],
        [-1, 31],
        [-3, -22],
        [-3, 5],
        [-1, -27],
        [3, -11],
        [0, -36],
        [-5, -37],
        [-9, -47],
        [-17, -51],
        [-2, 9],
        [-5, -13],
        [0, 12],
        [-7, -9],
        [-3, 24],
        [-2, -5],
        [7, -49],
        [-5, -16],
        [-5, 10],
        [-1, -35],
        [-7, -35],
        [-6, -66],
        [-4, -69],
        [-3, 5],
        [-1, -25],
        [3, 6],
        [-2, -50],
        [-2, -2],
        [0, -28],
        [3, -16],
        [1, -57],
        [3, -20],
        [0, -37],
        [3, -32],
        [-9, -20],
        [-3, 25],
        [-7, 10],
        [-9, -3],
        [-8, 32],
        [-5, 3],
        [-5, 25],
        [-6, 8],
        [-4, 24],
        [-2, 58],
        [-5, 34],
        [0, 30],
        [-2, 31],
        [1, 27],
        [-4, 30],
        [-3, 4],
        [-5, 27],
        [-1, 34],
        [-5, 32],
        [-6, 26],
        [-3, 57],
        [-2, 16],
        [-4, 46],
        [-1, 38],
        [-4, 27],
        [-6, 24],
        [-1, 16],
        [-6, 15],
        [-4, 42],
        [-13, 9],
        [-7, -2],
        [-7, 15],
        [-1, -20],
        [-7, -6],
        [-5, -40],
        [-3, -64],
        [-2, -1],
        [-4, -37],
        [-5, -1],
        [-7, 29],
        [-17, 47],
        [-4, 25],
        [-6, 24],
        [-5, 54],
        [-1, 49],
        [-4, 40],
        [-2, 35],
        [-3, 22],
        [-11, 32],
        [-6, 44],
        [-4, 15],
        [-6, 38],
        [-7, 20],
        [-5, 50],
        [-4, 11],
      ],
      [
        [1908, 4399],
        [0, -192],
        [57, 0],
      ],
      [
        [2981, 4973],
        [30, -2],
        [23, 2],
      ],
      [
        [2927, 3641],
        [-4, -32],
        [-3, -12],
        [-3, -44],
        [-6, -71],
        [-5, -15],
        [-1, 27],
        [2, 58],
        [8, 74],
      ],
      [
        [2874, 3756],
        [-4, -8],
        [-2, -28],
        [1, -19],
        [8, 6],
        [1, -31],
        [10, -12],
        [3, -24],
        [8, -26],
        [-4, -54],
        [4, -41],
        [-4, -20],
        [-1, -24],
        [4, -15],
        [-4, -23],
        [-6, 30],
        [-1, -10],
        [5, -22],
        [14, -5],
        [3, -71],
      ],
      [
        [2736, 3547],
        [-1, -16],
        [4, -32],
        [5, -16],
        [4, 1],
        [5, 25],
        [4, -20],
        [7, 11],
        [13, 36],
        [1, -11],
        [5, 17],
        [0, 34],
        [4, 30],
        [5, 29],
        [2, 34],
        [6, 36],
        [2, 44],
        [5, -27],
        [4, -8],
        [3, 16],
        [6, 68],
        [4, -17],
        [13, 77],
        [2, 57],
        [15, -64],
        [3, 37],
      ],
      [
        [1553, 5212],
        [-5, 7],
        [-4, -12],
        [-6, 17],
        [1, 26],
        [4, 14],
        [-6, 40],
        [-4, 103],
        [-2, 14],
        [-3, 73],
        [-6, 28],
        [-2, 56],
        [3, 38],
        [6, -18],
        [11, -24],
        [8, 1],
        [8, -9],
        [8, 9],
        [3, -16],
        [7, 1],
        [5, -42],
        [3, 3],
        [1, -56],
        [2, -52],
        [3, 6],
        [-3, 43],
        [1, 43],
        [4, 44],
        [-3, 18],
        [-1, 31],
        [-3, 35],
        [2, 25],
        [-2, 29],
        [-5, 4],
        [-4, 22],
        [1, 21],
        [163, 0],
      ],
      [
        [1576, 5602],
        [4, 9],
        [0, -39],
        [-5, 15],
        [1, 15],
      ],
      [
        [1568, 5655],
        [3, 25],
        [4, -30],
        [-1, -27],
        [-7, 8],
        [1, 24],
      ],
      [
        [2576, 4989],
        [-1, -23],
        [-6, -4],
        [-4, -44],
        [-2, -30],
        [3, -6],
        [5, 20],
        [4, 38],
        [6, 15],
        [5, 48],
        [6, 10],
        [-1, -25],
        [-4, -23],
        [-8, -79],
        [-2, -44],
        [0, -32],
        [-3, -10],
        [-2, -43],
        [1, -37],
        [-3, -24],
        [-3, -59],
        [0, -47],
        [4, -42],
        [-1, -55],
      ],
      [
        [2450, 5296],
        [6, -2],
        [20, 33],
        [8, 17],
        [2, -13],
        [-4, -25],
        [9, -33],
        [5, -3],
      ],
    ],
  };
  Datamap.prototype.usgTopo = '__USG__';
  Datamap.prototype.uzbTopo = '__UZB__';
  Datamap.prototype.vatTopo = '__VAT__';
  Datamap.prototype.vctTopo = '__VCT__';
  Datamap.prototype.venTopo = '__VEN__';
  Datamap.prototype.vgbTopo = '__VGB__';
  Datamap.prototype.virTopo = '__VIR__';
  Datamap.prototype.vnmTopo = '__VNM__';
  Datamap.prototype.vutTopo = '__VUT__';
  Datamap.prototype.wlfTopo = '__WLF__';
  Datamap.prototype.wsbTopo = '__WSB__';
  Datamap.prototype.wsmTopo = '__WSM__';
  Datamap.prototype.yemTopo = '__YEM__';
  Datamap.prototype.zafTopo = '__ZAF__';
  Datamap.prototype.zmbTopo = '__ZMB__';
  Datamap.prototype.zweTopo = '__ZWE__';

  /**************************************
                Utilities
  ***************************************/

  // Convert lat/lng coords to X / Y coords
  Datamap.prototype.latLngToXY = function (lat, lng) {
    return this.projection([lng, lat]);
  };

  // Add <g> layer to root SVG
  Datamap.prototype.addLayer = function (className, id, first) {
    var layer;
    if (first) {
      layer = this.svg.insert('g', ':first-child');
    } else {
      layer = this.svg.append('g');
    }
    return layer.attr('id', id || '').attr('class', className || '');
  };

  Datamap.prototype.updateChoropleth = function (data, options) {
    var svg = this.svg;
    var that = this;

    // When options.reset = true, reset all the fill colors to the defaultFill and kill all data-info
    if (options && options.reset === true) {
      svg
        .selectAll('.datamaps-subunit')
        .attr('data-info', function () {
          return '{}';
        })
        .transition()
        .style('fill', this.options.fills.defaultFill);
    }

    for (var subunit in data) {
      if (data.hasOwnProperty(subunit)) {
        var color;
        var subunitData = data[subunit];
        if (!subunit) {
          continue;
        } else if (typeof subunitData === 'string') {
          color = subunitData;
        } else if (typeof subunitData.color === 'string') {
          color = subunitData.color;
        } else if (typeof subunitData.fillColor === 'string') {
          color = subunitData.fillColor;
        } else {
          color = this.options.fills[subunitData.fillKey];
        }
        // If it's an object, overriding the previous data
        if (subunitData === Object(subunitData)) {
          this.options.data[subunit] = defaults(
            subunitData,
            this.options.data[subunit] || {}
          );
          var geo = this.svg
            .select('.' + subunit)
            .attr('data-info', JSON.stringify(this.options.data[subunit]));
        }
        svg
          .selectAll('.' + subunit)
          .transition()
          .style('fill', color);
      }
    }
  };

  Datamap.prototype.updatePopup = function (element, d, options) {
    var self = this;
    element.on('mousemove', null);
    element.on('mousemove', function (event) {
      var position = d3.pointer(event);
      d3.select(self.svg._groups[0][0].parentNode)
        .select('.datamaps-hoverover')
        .style('top', position[1] + 30 + 'px')
        .html(function () {
          var data = JSON.parse(element.attr('data-info'));
          try {
            return options.popupTemplate(d, data);
          } catch (e) {
            return '';
          }
        })
        .style('left', position[0] + 'px');
    });

    d3.select(self.svg._groups[0][0].parentNode)
      .select('.datamaps-hoverover')
      .style('display', 'block');
  };

  Datamap.prototype.addPlugin = function (name, pluginFn) {
    var self = this;
    if (typeof Datamap.prototype[name] === 'undefined') {
      Datamap.prototype[name] = function (
        data,
        options,
        callback,
        createNewLayer
      ) {
        var layer;
        if (typeof createNewLayer === 'undefined') {
          createNewLayer = false;
        }

        if (typeof options === 'function') {
          callback = options;
          options = undefined;
        }

        options = defaults(options || {}, self.options[name + 'Config']);

        // Add a single layer, reuse the old layer
        if (!createNewLayer && this.options[name + 'Layer']) {
          layer = this.options[name + 'Layer'];
          options = options || this.options[name + 'Options'];
        } else {
          layer = this.addLayer(name);
          this.options[name + 'Layer'] = layer;
          this.options[name + 'Options'] = options;
        }
        pluginFn.apply(this, [layer, data, options]);
        if (callback) {
          callback(layer);
        }
      };
    }
  };

  // Expose library
  if (typeof exports === 'object') {
    d3 = require('d3');
    topojson = require('topojson');
    module.exports = Datamap;
  } else if (typeof define === 'function' && define.amd) {
    define('datamaps', ['require', 'd3', 'topojson'], function (require) {
      d3 = require('d3');
      topojson = require('topojson');

      return Datamap;
    });
  } else {
    window.Datamap = window.Datamaps = Datamap;
  }

  if (window.jQuery) {
    window.jQuery.fn.datamaps = function (options, callback) {
      options = options || {};
      options.element = this[0];
      var datamap = new Datamap(options);
      if (typeof callback === 'function') {
        callback(datamap, options);
      }
      return this;
    };
  }
})();
