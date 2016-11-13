// title      : pitablet
// author     : John Cole
// license    : ISC License
// file       : pitablet.jscad

/* exported main, getParameterDefinitions, RaspberryPi, Boxes, _ */

function PiTablet(params) {
    var unitCube = util.unitCube();

    var outside = Parts.Cube([164.9, 100, 3.4])
        .align(unitCube, 'xy')
        .color('orange');

    // var bezel2 = Parts.Cube([156.7, 89.1, 1.8])
    //     .snap(outside, 'z', 'outside-')
    //     .snap(outside, 'xy', 'inside+')
    //     .translate([-5.49, -3.57, 0])
    //     .color('green');

    var bezel = Parts.Cube([161.5, 96.5, 1.8])
        .snap(outside, 'z', 'outside-')
        .snap(outside, 'xy', 'inside+')
        .translate([-2.5, -1, 0])
        .color('green');

    var lcd = Parts.Cube([154.08, 85.92, 1.81])
        .snap(outside, 'z', 'outside-')
        .snap(outside, 'xy', 'inside+')
        .translate([-6.9, -4.78, 0])
        .color('black');

    var thickness = 2;
    var depth = 15;

    // var boxsize = outside.enlarge(20, 15, 0).size();
    var boxsize = outside.size().plus(new CSG.Vector3D(18 + thickness, 13 + thickness, 0)).dividedBy(2);

    var box = util.group();

    box.add(CSG.cube({
        radius: [boxsize.x, boxsize.y, depth / 2]
    }), 'outline', true);

    var board = CAG.roundedRectangle({
        center: [boxsize.x, boxsize.y, 0],
        radius: [boxsize.x, boxsize.y],
        roundradius: 5
    });

    var taperangle = params.taperangle;
    var taper = util.triangle.solve90SA({
        a: depth,
        B: taperangle
    });
    var inset = -taper.b * 2;
    box.add(util.poly2solid(board, util.enlarge(board, [inset, inset]), depth)
        .align(box.parts.outline, 'xyz'), 'tapered', true);

    box.add(box.parts.outline.enlarge([50, 50, 0]).subtract(box.parts.tapered), 'exterior', true);

    box.add(Boxes.Hollow(box.parts.tapered, thickness, function (inside) {
            return inside.bisect('z', 4 - thickness).parts.positive;
            // return inside;
        })
        .align(outside, 'xy')
        .snap(bezel, 'z', 'inside+')
        .translate([0, 0, thickness])
        .color('gray'), 'hollow', true);

    box.add(Boxes.RabettTopBottom(box.parts.hollow, thickness, 0.25, {
        removableTop: true,
        removableBottom: false
    }));

    var lcdcutout = lcd.enlarge([0, 0, thickness - lcd.size().z])
        .snap(bezel, 'z', 'outside-')
        .chamfer(-thickness + 0.001, 'z+');

    var screw = Parts.Hardware.FlatHeadScrew(4.7, 1.5, 2.84, 9.0 - 1.5).combine('head,thread').rotateX(180);

    function corners(o, to, orientation, x, y) {
        x = x || 0;
        y = y || 0;
        return util.group('one,two,three,four', [
            o.snap(to, 'x', orientation + '+').snap(to, 'y', orientation + '+').translate([x, y, 0]),
            o.snap(to, 'x', orientation + '+').snap(to, 'y', orientation + '-').translate([x, -y, 0]),
            o.snap(to, 'x', orientation + '-').snap(to, 'y', orientation + '-').translate([-x, -y, 0]),
            o.snap(to, 'x', orientation + '-').snap(to, 'y', orientation + '+').translate([-x, y, 0])
        ]);
    }

    var top = box.parts.top.subtract(
        union([
            lcdcutout,
            outside,
            bezel
        ])
    );

    // function createRibs(object, axis) {
    //     var otheraxis = 'xy'.replace(axis, '');
    //     var size = util.axisApply(axis, function () {
    //         return object.size()[axis];
    //     }, [1, 1, 1]);
    //     var rib = Parts.Cube(size)
    //         .align(object, axis)
    //         .snap(object, otheraxis, 'inside-')
    //         .snap(object, 'z', 'inside-')
    //         .translate([0, 0, thickness])
    //         .fillet(-0.9, 'z-');
    //
    //     var ribs = union(util.segment(object, 10, otheraxis).map(function (position) {
    //         return rib.translate(util.axisApply(otheraxis, function () {
    //             return position;
    //         }));
    //     }));
    //     return ribs;
    // }
    //
    // box.add(union([createRibs(box.parts.bottom, 'x'), createRibs(box.parts.bottom, 'y')]).color('darkgray'), 'ribs');

    var screensupport = box.parts.top
        .enlarge([-thickness, -thickness, 0])
        .snap(top, 'z', 'outside+')
        .subtract(
            union([
                outside,
                bezel
            ]).enlarge([1, 1, 0])
        )
        .color('red');

    box.add(corners(Parts.Cylinder(40, depth - (thickness * 3))
            .snap(screensupport, 'z', 'outside+'),
            screensupport, 'inside', 20, 20)
        .map(function (part) {
            return part.fillet(-1, 'z-').intersect(box.parts.tapered).color('green');
        }), 'supports');


    var screws = corners(Parts.Cylinder(10, 1), screensupport, 'inside')
        .map(function (part) {
            return screw.align(part, 'xy').snap(box.parts.top, 'z', 'inside+');
        });

    var BPlus = RaspberryPi.BPlus();

    BPlus.add(RaspberryPi.BPlusMounting.holes(BPlus.parts.mb, {
        height: 70,
        diameter: 3.05 // 2.75 clearance for M2.5 screw http://www.littlemachineshop.com/reference/tapdrillsizes.pdf
    }), 'holes', true);

    BPlus.add(RaspberryPi.Parts.UsbWifiAdapter(BPlus.parts.usb2, 0).enlarge([1, 1, 1]), 'usb20Clearance', true);
    BPlus.add(RaspberryPi.Parts.UsbWifiAdapter(BPlus.parts.usb2, 1).enlarge([1, 1, 1]), 'usb21Clearance', true);
    BPlus.add(RaspberryPi.Parts.UsbWifiAdapter(BPlus.parts.usb1, 0).enlarge([1, 1, 1]), 'usb10Clearance', true);
    BPlus.add(RaspberryPi.Parts.UsbWifiAdapter(BPlus.parts.usb1, 1).enlarge([1, 1, 1]), 'usb11Clearance', true);
    BPlus.add(BPlus.parts.ethernet.color('blue').snap(BPlus.parts.ethernet, 'x', 'outside-'), 'ethernetClearance', true);

    // add 5mm to the area where the screen ribbon cable will go.
    BPlus.add(Parts.Cube([1, 5 - thickness, 1])
        .align(BPlus.parts.mb, 'xz')
        .snap(BPlus.parts.mb, 'y', 'outside+'), 'ribbonGap');

    // add 5mm to the area where the sd card will go.
    BPlus.add(Parts.Cube([5 - thickness, 1, 1])
        .align(BPlus.parts.mb, 'yz')
        .snap(BPlus.parts.mb, 'x', 'outside+'), 'sdGap');
    // console.log('BPlus', BPlus.parts)
    var Pads = RaspberryPi.BPlusMounting.pads(BPlus.parts.mb, {
        height: 9
    });

    var Hat = RaspberryPi.Hat().snap('mb', Pads.parts.pad1, 'z', 'outside-');

    Hat.add(
        RaspberryPi.Parts.MicroUsb()
        .snap(Hat.parts.mb, 'y', 'inside-')
        .snap(Hat.parts.mb, 'z', 'outside+')
        .midlineTo('x', 52.71), 'touchusb');

    BPlus.add(RaspberryPi.BPlusMounting.pads(BPlus.parts.mb, {
            height: thickness
        }).map(function (part) {
            return part.fillet(-thickness + 1, 'z-');
        })
        .snap('pad1', BPlus.parts.mb, 'z', 'outside+'), 'mount', false, 'mount');

    BPlus.add(Hat, 'hat', false, 'hat');

    var picaseheight = BPlus.combine('mb,usb1').size().z;
    var hatsupportheight = picaseheight - BPlus.combine('mb,hat').size().z;

    BPlus.add(RaspberryPi.BPlusMounting.pads(BPlus.parts.hatmb, {
            height: hatsupportheight - thickness
        })
        .snap('pad1', BPlus.parts.hatmb, 'z', 'outside-')
        .map(function (part) {
            return part.fillet(-1.5, 'z+');
        }), 'hatsupports');

    BPlus.add(RaspberryPi.Parts.MicroUsbPlug(BPlus.parts.microusb), 'powerplug', true);
    BPlus.add(RaspberryPi.Parts.MicroUsbPlug(BPlus.parts.hattouchusb), 'touchusbplug', true);

    BPlus = BPlus.rotate(outside, 'y', 180);

    var pioffset = util.triangle.solve90SA({
        a: picaseheight + depth,
        B: taperangle
    });

    var pos = util.array.add(
        BPlus.parts.mb.calcSnap(box.parts.bottom, 'z', 'outside+'),
        BPlus.parts.mb.calcSnap(box.parts.bottom, 'x', 'inside-'),
        BPlus.parts.mb.calcSnap(box.parts.bottom, 'y', 'inside+'), [30, -pioffset.b - (2), 0]);

    BPlus = BPlus
        .map(function (part) {
            return part
                .translate(pos);
        });

    var leftcutouts = BPlus.combine('ethernet,usb1,usb2', {}, function (part) {
            return part.enlarge([1, 1, 1]);
        })
        .union(BPlus.combine('usb1flange,usb2flange').enlarge(2, 1, 1))
        .union(BPlus.combine('ethernetClearance,usb10Clearance,usb11Clearance,usb20Clearance,usb21Clearance'));

    // console.log('BPlus', BPlus);
    var bottomcutouts = union(BPlus.combine('powerplug,touchusbplug', {}, function (part) {
        return part.enlarge([2, 2, 2]).translate([0, thickness, -1]);
    }));

    // var interior = BPlus.combine('mb,ethernet,avjack,microsd,hatsupports');
    var interior = BPlus.combine('mb,ribbonGap,sdGap,hatsupports');
    var pisize = interior.enlarge([thickness * 2, thickness * 2, 0]).size();
    // console.log('pisize', pisize);
    var pioutline = Parts.Board(pisize.x, pisize.y, 5, pisize.z + (thickness * 3))
        .color('purple', 0.25);

    var pibox = Boxes.Hollow(pioutline, thickness);

    var picase = Boxes.Rabett(pibox, thickness, 0.5, -thickness, 0)
        .snap('bottom', box.parts.bottom, 'z', 'outside+', thickness)
        .align('bottom', interior, 'xy');

    pioutline = pioutline.snap(picase.parts.bottom, 'z', 'inside-')
        .align(interior, 'xy');

    var picase_seat = box.parts.bottom.intersect(picase.parts.bottom)
        .enlarge([thickness, thickness, 2])
        .snap(box.parts.bottom, 'z', 'inside-');

    var gusset = Parts.Cube([20, pisize.y + 2, 2])
        .snap(box.parts.bottom, 'z', 'inside-', thickness)
        .align(pioutline, 'y')
        .color('red');

    var pimount = util.group();
    pimount.add(gusset.align(BPlus.parts.mountpad1, 'x'), 'gusset1');
    pimount.add(gusset.align(BPlus.parts.mountpad2, 'x'), 'gusset2');
    pimount.add(BPlus.parts.mount.snap(gusset, 'z', 'outside+'), 'pads');

    var nut = Parts.Hexagon(5.5, 1.5).enlarge([0.25, 0.25, 0]).color('gray');

    pimount.add(BPlus.pick('mountpad1,mountpad2,mountpad3,mountpad4', function (part) {
        return nut
            .align(part, 'xy')
            .snap(gusset, 'z', 'inside+');
    }), 'nuts', true);

    // http://www.spaenaur.com/pdf/sectionR/R11.pdf
    var m2_5screw = Parts.Hardware.PanHeadScrew(4.5, 2.5, 2.5, 19, 6)
        .combine('head,thread,headClearSpace')
        .enlarge([0.5, 0.5, 0])
        .snap(gusset, 'z', 'inside+');

    pimount.add(BPlus.pick('mountpad1,mountpad2,mountpad3,mountpad4', function (part) {
        return m2_5screw
            .align(part, 'xy');
    }), 'bolts', true);

    var piBoardHoles = RaspberryPi.BPlusMounting.holes(
        BPlus.parts.mb, {
            height: 50,
            diameter: 3.05 // 2.75 clearance for M2.5 screw http://www.littlemachineshop.com/reference/tapdrillsizes.pdf
        });
    var parts = {
        top: function () {
            return union([top, screensupport])
                .subtract(screws.map(function (screw) {
                    return screw.enlarge([0.3, 0.3, 0]);
                }).combine());
        },
        bottom: function () {
            return union([
                    box.combine('bottom,supports')
                    .subtract(outside.enlarge([0.75, 0.75, 0.75]))
                    .subtract(pioutline.enlarge([-thickness, -thickness, 10])),
                    picase_seat.color('orange'),
                    pimount.combine().subtract(pimount.combine('nuts,bolts'))
                    // gussets.combine().subtract(nuts.combine())
                ]).subtract(piBoardHoles.combine())
                .subtract(screws.map(function (screw) {
                    return screw.enlarge([-0.6, -0.6, 2]);
                }).combine());
        },
        picase: function () {
            return union([
                picase.combine('bottom')
                .union(BPlus.combine('hatsupports'))
                .subtract(
                    union([
                        leftcutouts,
                        bottomcutouts,
                        pimount.parts.bolts,
                        BPlus.combine('holes')
                    ]))
                .color('lightblue', 0.6)
                // .union(BPlus.combine('usb1flange,usb2flange').enlarge(2, 1, 1))
            ]);
        },
        assembled: function () {
            return union([
                outside,
                bezel,
                lcd,
                parts.top().color('gray', 0.6),
                BPlus.combine(),
                parts.bottom().color('gray', 0.6),
                parts.picase(),
            ]).rotateX(taperangle - 90).Zero();
        }
    };

    return parts[params.part]();
}

function getParameterDefinitions() {
    var parts = {
        picase: 'picase',
        top: 'Top',
        bottom: 'Bottom',
        assembled: 'Assembled'
    };

    return [{
        name: 'resolution',
        type: 'choice',
        values: [0, 1, 2, 3, 4],
        captions: ['very low (6,16)', 'low (8,24)', 'normal (12,32)', 'high (24,64)', 'very high (48,128)'],
        initial: 0,
        caption: 'Resolution:'
    }, {
        name: 'taperangle',
        type: 'number',
        initial: 15,
        caption: 'Taper Angle:'
    }, {
        name: 'part',
        type: 'choice',
        values: _.keys(parts),
        captions: _.values(parts),
        initial: 'assembled',
        caption: 'Part:'
    }];
}

function main(params) {
    // params = {
    //     resolution: 2
    // };
    var resolutions = [
        [6, 16],
        [8, 24],
        [12, 32],
        [24, 64],
        [48, 128]
    ];
    CSG.defaultResolution3D = resolutions[params.resolution][0];
    CSG.defaultResolution2D = resolutions[params.resolution][1];
    util.init(CSG);

    return PiTablet(params);
}

// ********************************************************
// Other jscad libraries are injected here.  Do not remove.
// Install jscad libraries using NPM
// ********************************************************
// include:js
// endinject
