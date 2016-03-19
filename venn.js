
var circletexts = {
  "1" : null,
  "2" : null,
  "3" : null,
  "4" : null,
  "12" : null,
  "23" : null,
  "34" : null,
  "41" : null,
  "123" : null,
  "234" : null,
  "341" : null,
  "412" : null,
  "1234" : null
};

function zp(str) {
  if(str.length < 2) {
    return "0" + str;
  } else {
    return str;
  }
} 

function drawCircle(current, total) {

  var svg = $("#output svg")[0];

  var theta = current / total * Math.PI * 2;

  // offsets.
  var cx = 50 - Math.round(Math.cos(theta) * 50)/ 3;
  var cy = 50 - Math.round(Math.sin(theta) * 50)/ 3;

  // Expressed as percentage of total SVG width.
  var radius = 390 / (+total + 12);

  var fr = Math.floor(Math.random() * 255);
  var fg = Math.floor(Math.random() * 255);
  var fb = Math.floor(Math.random() * 255);


  svg.innerHTML += [
    '\n<ellipse cx="',
    cx, '%" cy="',
    cy, '%" rx="',
    radius,
    '%" ry="',
    radius, 
    '%" fill="rgba(',
    fr.toString(10),
    ", " ,
    fg.toString(10),
    ", " ,
    fb.toString(10),
    ', 0.3)" style="stroke:#',
    zp(Math.floor((fr/2)).toString(16)),
    zp(Math.floor((fg/2)).toString(16)),
    zp(Math.floor((fb/2)).toString(16)), 
    '; stroke-opacity: 0.5"></ellipse>'
  ].join("");

  return {
    cx: cx,
    cy: cy,
    theta: theta
  };
}

function drawCenteredText(key, x, y) {

  var svg = $("#output svg")[0];

  svg.innerHTML += "<text y='"
                   + y
                   + "' text-anchor='middle'></text>";
  svg.lastChild.id = key + ":" + x ;
  svg.lastChild.innerHTML = circletexts[key] 
                            ? textToTspans(circletexts[key], svg.lastChild) 
                            : "<tspan x='" + x + "'>[]</tspan>";
}

function textToTspans(text, textelement) {
  var textlines = text.split("\n");
  var fontsize = parseInt($(textelement).closest("svg").css("font-size"));

  if(textlines.length === 0 || textlines.length === 1 && textlines[0] === "") {
    textlines = ["[]"];
  }

  return textlines.map(function(snippet, i) {
    return ["<tspan x='",
            $(textelement).attr("id").split(":")[1],
            "' dy='",
            i === 0 ? fontsize / -2 * (textlines.length - 1) : fontsize,
            "'>",
            snippet,
            "</tspan>"
          ].join("");
  }).join("");
}

$("#output").on("click", "svg text", function(ev) {
  var textout = ev.currentTarget;
  var $div;
  var key = $(textout).attr("id").split(":")[0];
  var $textarea = $("<textarea></textarea>");

  $("#output").append(
    $div = $("<div>").css({"position":"absolute", left: $(this).offset().left, top: $(this).offset().top })
            .append($textarea.text(
              $(textout).children().map(function() {
                return $(this).text();
              }).get().join("\n")
            ))
            .append("<br>")
            .append($("<button>Update</button>").on("click", function() {
              circletexts[key] = $textarea.val();
              $(textout).html(textToTspans($textarea.val(), textout));
              $div.remove();
            }))
  );
  $textarea.focus();
});

function permuteCenters(fullcount, primitive_centers) {

  var initial_fill = new Array(+fullcount).fill(0).map(function(_, i) {
    return (i + 1);
  });
  var keyed_object = initial_fill.reduce(function(obj, i) {
    var key = "", key_array;
    for(var j = 0; j < fullcount - 1; j++) {
      key = key + ((i + j - 1) % fullcount + 1).toString(10);
      key_array = key.split("");

      var theta = key_array.reduce(function(accumulator, idx, _i) {
        if(_i > 0 && +idx < +key_array[0]) {
          accumulator += Math.PI + Math.PI;
        }
        return accumulator + primitive_centers[idx].theta;
      }, 0) / key.length;

      var placement_r = key.split("").reduce(function(accumulator, idx) {
        var item = primitive_centers[idx];
        var offset_x = 50 - item.cx;
        var offset_y = 50 - item.cy;
        return accumulator + Math.sqrt(offset_x * offset_x + offset_y * offset_y);
      }, 0) / key.length;

      obj[key] = {
        cx : 50 - placement_r * Math.cos(theta) / key.length * (+fullcount + 4)/4,
        cy : 50 - placement_r * Math.sin(theta) / key.length * (+fullcount + 4)/4,
        theta : theta
      };
    }
    return obj;
  }, {});
  keyed_object[initial_fill.join("")] = {cx: 50, cy: 50, theta: 0};
  return keyed_object;
}


$("#size_selector").on("change", function() {
  var ncircs = $(this).val(),
      _nc = ncircs;
  var placement;
  var numbers = [];
  var centers = {};
  $("#output svg").html("");
  while(_nc--) {
    centers[_nc + 1] = placement = drawCircle(_nc, ncircs);
    numbers.unshift((_nc + 1).toString(10));
  }
  var permutedCenters = permuteCenters(ncircs, centers);
  Object.keys(permutedCenters).forEach(function(key) {
    var ctr = permutedCenters[key];
    drawCenteredText(key, Math.round(ctr.cx) + "%", Math.round(ctr.cy) + "%");
  });
});

$("#size_textbox").on("change", function() {
  var val = $(this).val();
  var fontsize;
  if(+val > 0) {
    $("#output svg")
    .attr("width", val)
    .attr("height", val)
    .css("font-size", function() {
      return (fontsize = this.width.baseVal.value / 40);
    }).find("text").each(function(_, text) {
      var $tspans = $(text).find("tspan");
      var length = $tspans.length;
      $tspans.attr("dy", function(i) {
        return i === 0 ? fontsize / -2 * (length - 1) : fontsize;
      });
    });
  }
});


$("#size_selector").trigger("change");


$("#color_button").on("click", function() {
  $("#output ellipse").each(function() {
    var fr = Math.floor(Math.random() * 255),
      fg = Math.floor(Math.random() * 255),
      fb = Math.floor(Math.random() * 255);

    $(this).attr(
      "fill",
      "rgba(" + fr + ", " + fg + ", " + fb + ", 0.3)"
    ).css(
      "stroke",
      '#' + 
        zp(Math.floor((fr/2)).toString(16)) +
        zp(Math.floor((fg/2)).toString(16)) +
        zp(Math.floor((fb/2)).toString(16))
    );
  });
});

$("#export_button").on("click", function() {

  var svg = $("#output svg");
  var $canvas = $("<canvas>")
                .attr("height", svg.attr("height"))
                .attr("width", svg.attr("width"))
                .css("display", "none")
                .appendTo("#output");

  var context = $canvas[0].getContext("2d");

//  var imgsrc = 'data:image/svg+xml;base64,'+ btoa(svg.html());
  var imgsrc = 'data:image/svg+xml;base64,'+ btoa(svg[0].outerHTML);
  var image = new Image();
  image.addEventListener("load", function() {
    context.fillStyle = "white";
    context.fillRect(0, 0, $canvas[0].width, $canvas[0].height);
    context.drawImage(image, 0, 0);

    var link = document.createElement('a');
    link.download = svg.find("text:last").text() + ".png";
    link.href = $canvas[0].toDataURL();
    link.click();

    $canvas.remove();
  }, false);
  image.addEventListener("error", function(ev, err) {
    console.error(this);
  });
  image.src = imgsrc;
});

