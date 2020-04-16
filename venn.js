var circletexts = {
    "1": null,
    "2": null,
    "3": null,
    "4": null,
    "12": null,
    "23": null,
    "34": null,
    "41": null,
    "123": null,
    "234": null,
    "341": null,
    "412": null,
    "1234": null
};
var defaultColors = ["#ff0000", "#00ff00", "#0000ff", "#aaaaaa"];
var defaultOpacity = 0.3;
var color2EllipseSelector = {};
for (var i = 0; i < 4; i++) {
    color2EllipseSelector["#color_text" + i] = "#ellipse" + i;
}
var emptyCaption = "[]";

function zp(str) {
    if (str.length < 2) {
        return "0" + str;
    } else {
        return str;
    }
}
function setCircleColor(selector, value) {
    $(selector)
        .attr("fill", value)
        .css("stroke", value);
}

function drawCircle(current, total, color) {
    var svg = $("#output svg")[0];

    var theta = (current / total) * Math.PI * 2;

    // offsets.
    var cx = 50 + Math.round(Math.cos(theta) * 50) / 3;
    var cy = 50 - Math.round(Math.sin(theta) * 50) / 3;

    // Expressed as percentage of total SVG width.
    var radius = 460 / (+total + 12);

    var id = "ellipse" + current;
    svg.innerHTML += [
        "\n<ellipse",
        ' id="',
        id,
        '" name="ellipse"',
        ' cx="',
        cx,
        '%" cy="',
        cy,
        '%" rx="',
        radius,
        '%" ry="',
        radius,
        '%" fill="',
        color,
        '" opacity="',
        defaultOpacity,
        '" style="stroke:',
        color,
        '; stroke-opacity: 0.5"></ellipse>'
    ].join("");

    return {
        cx: cx,
        cy: cy,
        radius: radius,
        theta: theta
    };
}

function drawCenteredText(key, x, y) {
    var svg = $("#output svg")[0];

    svg.innerHTML += "<text y='" + y + "' text-anchor='middle'></text>";
    svg.lastChild.id = key + ":" + x;
    svg.lastChild.innerHTML = circletexts[key]
        ? textToTspans(circletexts[key], svg.lastChild)
        : "<tspan x='" + x + "'>" + emptyCaption + "</tspan>";
}

function textToTspans(text, textelement) {
    var textlines = text.split("\n");
    var fontsize = parseInt(
        $(textelement)
            .closest("svg")
            .css("font-size")
    );

    if (
        textlines.length === 0 ||
        (textlines.length === 1 && textlines[0] === "")
    ) {
        textlines = [emptyCaption];
    }

    return textlines
        .map(function(snippet, i) {
            return [
                "<tspan x='",
                $(textelement)
                    .attr("id")
                    .split(":")[1],
                "' dy='",
                i === 0 ? (fontsize / -2) * (textlines.length - 1) : fontsize,
                "'>",
                snippet,
                "</tspan>"
            ].join("");
        })
        .join("");
}
function onColorTextChange() {
    var color = $(this).val();
    var colorSelector = "#" + $(this).attr("id");
    var ellipseId = color2EllipseSelector[colorSelector];
    $(ellipseId)
        .attr("fill", color)
        .css("stroke", color);
}
function onOpacityChange() {
    var value = $(this).val();
    $("ellipse").attr("opacity", value);
    $(this)
        .next("#range-value")
        .html(value);
}

function removeEmptyCaptions(svg) {
    svg.find("text tspan").text(function() {
        var val = $(this).text();
        return val == emptyCaption ? "" : val;
    });
}
function addEmptyCaptions(svg) {
    svg.find("text tspan").text(function() {
        var val = $(this).text();
        return val == "" ? emptyCaption : val;
    });
}

function exportSVG() {
    var svg = $("#output svg");

    removeEmptyCaptions(svg);

    var svgData = svg[0].outerHTML;
    var svgBlob = new Blob([svgData], {
        type: "image/svg+xml;charset=utf-8"
    });
    var svgUrl = URL.createObjectURL(svgBlob);
    var link = document.createElement("a");
    link.href = svgUrl;
    link.download = "venn_diagram.svg";
    document.body.appendChild(link);
    link.click();

    addEmptyCaptions(svg);
}

function exportPNG() {
    var svg = $("#output svg");
    var $canvas = $("<canvas>")
        .attr("height", svg.attr("height"))
        .attr("width", svg.attr("width"))
        .css("display", "none")
        .appendTo("#output");

    var context = $canvas[0].getContext("2d");

    removeEmptyCaptions(svg);

    //  var imgsrc = 'data:image/svg+xml;base64,'+ btoa(svg.html());
    var imgsrc = "data:image/svg+xml;base64," + btoa(svg[0].outerHTML);
    var image = new Image();
    image.addEventListener(
        "load",
        function() {
            context.fillStyle = "white";
            context.fillRect(0, 0, $canvas[0].width, $canvas[0].height);
            context.drawImage(image, 0, 0);

            var link = document.createElement("a");
            link.download = "venn_diagram.png";
            link.href = $canvas[0].toDataURL();
            link.click();

            $canvas.remove();
        },
        false
    );
    image.addEventListener("error", function(ev, err) {
        console.error(this);
    });
    image.src = imgsrc;

    addEmptyCaptions(svg);
}

$("#output").on("click", "svg text", function(ev) {
    var textout = ev.currentTarget;
    var $div;
    var key = $(textout)
        .attr("id")
        .split(":")[0];
    var $textarea = $("<textarea></textarea>");

    $("#output").append(
        ($div = $("<div>")
            .css({
                position: "absolute",
                left: $(this).offset().left,
                top: $(this).offset().top
            })
            .append(
                $textarea.text(
                    $(textout)
                        .children()
                        .map(function() {
                            return $(this).text();
                        })
                        .get()
                        .join("\n")
                )
            )
            .append("<br>")
            .append(
                $("<button>Update</button>").on("click", function() {
                    circletexts[key] = $textarea.val();
                    $(textout).html(textToTspans($textarea.val(), textout));
                    $div.remove();
                })
            ))
    );
    $textarea.focus();
});

function permuteCenters(fullcount, primitive_centers) {
    fullcount = +fullcount;

    var initial_fill = new Array(fullcount).fill(0).map(function(_, i) {
        return i + 1;
    });
    var keyed_object = initial_fill.reduce(function(obj, i) {
        var key = "",
            key_array;
        for (var j = 0; j < fullcount - 1; j++) {
            key = key + (((i + j - 1) % fullcount) + 1).toString(10);
            key_array = key.split("");

            var theta =
                key_array.reduce(function(accumulator, idx, _i) {
                    if (_i > 0 && +idx < +key_array[0]) {
                        accumulator += Math.PI + Math.PI;
                    }
                    return accumulator + primitive_centers[idx].theta;
                }, 0) / key.length;

            var placement_r =
                key.split("").reduce(function(accumulator, idx) {
                    var item = primitive_centers[idx];
                    var offset_x = Math.abs(50 - item.cx) + item.radius; // measure to edge, not center
                    var offset_y = Math.abs(50 - item.cy) + item.radius;
                    return (
                        accumulator +
                        Math.sqrt(offset_x * offset_x + offset_y * offset_y)
                    );
                }, 0) / key.length;

            obj[key] = {
                cx:
                    50 +
                    (placement_r *
                        Math.cos(theta) *
                        Math.pow(0.6, key.length) *
                        (fullcount + 4)) /
                        7,
                cy:
                    50 -
                    (placement_r *
                        Math.sin(theta) *
                        Math.pow(0.6, key.length) *
                        (fullcount + 4)) /
                        7,
                theta: theta
            };
        }
        return obj;
    }, {});
    keyed_object[initial_fill.join("")] = {cx: 50, cy: 50, theta: 0};
    return keyed_object;
}

$("#size_selector").on("change", function() {
    colors = $('[id^="color_text"]')
        .map(function() {
            return $(this).val();
        })
        .get();
    var ncircs = $(this).val(),
        _nc = ncircs;
    var placement;
    var numbers = [];
    var centers = {};
    $("#output svg").html("");
    while (_nc--) {
        centers[_nc + 1] = placement = drawCircle(_nc, ncircs, colors[_nc]);
        numbers.unshift((_nc + 1).toString(10));
    }
    var permutedCenters = permuteCenters(ncircs, centers);
    Object.keys(permutedCenters).forEach(function(key) {
        var ctr = permutedCenters[key];
        drawCenteredText(
            key,
            Math.round(ctr.cx) + "%",
            Math.round(ctr.cy) + "%"
        );
    });
    $("#color_text2").toggle(ncircs >= 3);
    $("#color_text3").toggle(ncircs >= 4);
    var range_value = $("#opacity_range").val();
    console.log("range_value:", range_value);
    $("#range-value").text(range_value);
});

$("#size_textbox").on("change", function() {
    var val = $(this).val();
    var fontsize;
    if (+val > 0) {
        $("#output svg")
            .attr("width", val)
            .attr("height", val)
            .css("font-size", function() {
                return (fontsize = this.width.baseVal.value / 30);
            })
            .find("text")
            .each(function(_, text) {
                var $tspans = $(text).find("tspan");
                var length = $tspans.length;
                $tspans.attr("dy", function(i) {
                    return i === 0 ? (fontsize / -2) * (length - 1) : fontsize;
                });
            });
    }
});

$("#size_selector").trigger("change");

$('[id^="color_text"]').on("change", onColorTextChange);
$("#opacity_range").on("input", onOpacityChange);

$("#export_png_button").on("click", exportPNG);
$("#export_svg_button").on("click", exportSVG);
