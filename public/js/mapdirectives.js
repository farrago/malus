'use strict';

/* Directives */


angular.module('map.directives', []).
  directive('malusMap', function () {

    //
    // constants
    //
    var textPad = 5;
    var margin = { top: 0, right: 10, bottom: 0, left: 30 };

    var xMax = 400;
    var yMax = 700;

    var viewBox = { width: (xMax * 2), height: (yMax * 2) };

    return {
      restrict: 'E',
      scope: {
        systems: '=',
        selection: '='
      },
      link: function (scope, element, attrs) {

        console.log("Scope", scope);
        console.log("Element: ", element);
        var divWidth = $(element[0]).parent().width();
        console.log("Width:", divWidth);

        var ratio = 7 / 4;
        var divHeight = divWidth * ratio;
        console.log("Calculated Height:", divHeight);

        var x = d3.scale.linear()
            .range([0, viewBox.width]);

        var y = d3.scale.linear()
            .range([0, viewBox.height]);

        var color = d3.scale.category10();

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("top")
            .tickSubdivide(4);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")
            .tickSubdivide(1);

        x.domain([0, xMax]);
        y.domain([0, yMax]);

        // set up initial svg object
        var svg = d3.select(element[0]).append("svg")
            .attr("width", divWidth)
            .attr("height", divHeight)
            .attr("viewBox","0 0 " + (viewBox.width + margin.left + margin.right) + " " + (viewBox.height + margin.top + margin.bottom))
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //
        // Do all the processing inside a watch of 'val' so that
        // it will refresh when the data refreshes
        //
        scope.$watch('systems', function (newVal, oldVal) {

          //
          // clear the elements inside of the directive
          //
          svg.selectAll('*').remove();


          // if 'val' is undefined, exit
          if (!newVal) {
            console.log("Exiting with no newVal");
            return;
          }

          svg.append("g")
            .attr("class", "x axis")
            .call(xAxis)
          .append("text")
            .attr("class", "label")
            .attr("x", +15)
            .attr("y", -10)
            .text("Light Years");

          svg.append("g")
              .attr("class", "y axis")
              .call(yAxis);

          //
          // Output the planets
          //
          var planet = svg.selectAll(".planet")
            .data(newVal)
          .enter().append("g")
            .attr("class", "planet")
            .attr("transform", function (d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; })
            .on("mousedown", function (d) {
              var data = d;
              scope.$apply(function (scope, d) { scope.selection = data.id });
            });

          planet.append("title")
              .text(function (d) { return d.name + "(" + d.economy + ") : {" + d.x + ", " + d.y + "}"; });

          planet.append("circle")
              .attr("r", function (d) { return 3.5; })
              .style("fill", function (d) { return color(d.economy); });

          planet.append("text")
              .attr("x", textPad)
              .attr("dy", ".3em")
              .style("text-anchor", "left")
              .text(function (d) { return d.name + " (" + d.economy + ")"; });

          //
          // Output the legend
          //
          var legend = svg.selectAll(".legend")
              .data(color.domain())
            .enter().append("g")
              .attr("class", "legend")
              .attr("transform", function (d, i) { return "translate(0," + i * 20 + ")"; });

          legend.append("rect")
              .attr("x", textPad)
              .attr("y", textPad)
              .attr("width", 18)
              .attr("height", 18)
              .style("fill", color);

          legend.append("text")
              .attr("x", 18 + (2 * textPad))
              .attr("y", textPad + 9)
              .attr("dy", ".35em")
              .style("text-anchor", "start")
              .text(function (d) { return d; });

        }, true) // End $watch of val - note we watch the value not the existence
      }
    };
  });
