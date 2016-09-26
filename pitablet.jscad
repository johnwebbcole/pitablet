// title      : pitablet
// author     : John Cole
// license    : ISC License
// file       : pitablet.jscad

/* exported main, getParameterDefinitions */

function getParameterDefinitions() {

    return [{
        name: 'resolution',
        type: 'choice',
        values: [0, 1, 2, 3, 4],
        captions: ['very low (6,16)', 'low (8,24)', 'normal (12,32)', 'high (24,64)', 'very high (48,128)'],
        initial: 2,
        caption: 'Resolution:'
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

    var unitCube = util.unitCube();

    var outside = Parts.Cube([164.9, 100, 3.4])
        .align(unitCube, 'xy')
        .color('orange');

    var bezel2 = Parts.Cube([156.7, 89.1, 1.8])
        .snap(outside, 'z', 'outside-')
        .snap(outside, 'xy', 'inside+')
        .translate([-5.49, -3.57, 0])
        .color('green');

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

    // var BPlus = RaspberryPi.BPlus();
    //
    // var Pads = RaspberryPi.BPlusMounting.pads(BPlus.parts.mb, {
    //     height: 9
    // });
    //
    // var Hat = RaspberryPi.Hat().snap('mb', Pads.parts.pad1, 'z', 'outside-');

    // var Mount = RaspberryPi.BPlusMounting.pads(BPlus.parts.mb, {
    //         height: 7
    //     }).snap('pad1', Hat.parts.mb, 'z', 'outside-')
    //     .map(function (part) {
    //         return part.fillet(-2, 'z+');
    //     });
    //
    var screw = Parts.Hardware.FlatHeadScrew(5.38, 1.7, 2.84, 12.7 - 1.7).combine('head,thread').rotateX(180);
    //
    // var piscrews = Mount.clone(function (part) {
    //     return screw.rotateX(180).align(part, 'xy').snap(Hat.parts.mb, 'z', 'inside-');
    // });

    // console.log('piscrews', piscrews);

    // BPlus.add(Hat, 'hat', false, 'hat');
    // BPlus.add(Pads);
    // // BPlus.add(Mount, 'mount', false, 'mount');
    // // BPlus.add(piscrews, 'screws', true, 'screws');
    //
    // BPlus = BPlus.rotate(outside, 'x', 180);
    //
    // var pos = util.array.add(
    //     BPlus.parts.mb.calcSnap(outside, 'z', 'outside+'),
    //     BPlus.parts.mb.calcSnap(outside, 'x', 'inside+'),
    //     BPlus.parts.mb.calcAlign(outside, 'y'), [0, 0, -5]);
    //
    // BPlus = BPlus
    //     .map(function (part) {
    //         return part
    //             .translate(pos);
    //     });

    var thickness = 2;
    // var depth = bezel.getBounds()[1].z - BPlus.parts.mount.getBounds()[0].z + (thickness * 2);
    var depth = 15;
    // console.log('diff', depth, BPlus.parts.mount.getBounds(), bezel.getBounds());

    // console.log('BPlus', BPlus.parts);

    var boxsize = outside.enlarge(20, 15, 0).size();

    // console.log('boxsize', boxsize);
    // var chamfer = thickness / 2;
    var box = Boxes.Hollow(Parts.Board(boxsize.x, boxsize.y, 5, depth), thickness)
        .align(outside, 'xy')
        .snap(bezel, 'z', 'inside+')
        .translate([0, 0, thickness])
        .color('gray');
    // var box = Boxes.Rectangle(boxsize, thickness, function (box) {
    //     return box
    //         .rotateY(90)
    //         .chamfer(chamfer, 'z+')
    //         .chamfer(chamfer, 'z-')
    //         .rotateY(-90)
    //         .chamfer(chamfer, 'z+')
    //         .chamfer(chamfer, 'z-')
    //         .align(outside, 'xyz');
    // });

    box = Boxes.RabetTopBottom(box, thickness, 0.3, {
        removableTop: true,
        removableBottom: true
    });

    // return box.combine('top,bottom')
    var lcdcutout = lcd.enlarge([0, 0, thickness - lcd.size().z])
        .snap(bezel, 'z', 'outside-')
        .chamfer(-thickness + 0.001, 'z+');



    function corners(bar, foo, orientation) {
        return util.group('one,two,three,four', [
            bar.snap(foo, 'xy', orientation + '+'),
            bar.snap(foo, 'x', orientation + '+').snap(foo, 'y', orientation + '-'),
            bar.snap(foo, 'xy', orientation + '-'),
            bar.snap(foo, 'x', orientation + '-').snap(foo, 'y', orientation + '+')

        ]);
    }
    // var supports = corners(Parts.Cylinder(10, depth - (thickness * 3))
    //         .snap(screensupport, 'z', 'outside+'), screensupport, 'inside')
    //     .map(function (part) {
    //         return part.fillet(-1, 'z-');
    //     });


    // var screws = supports.clone(function (part) {
    //     return screw.align(part, 'xy').snap(box.parts.top, 'z', 'inside+');
    // });

    // console.log('BPlus', BPlus);
    // return BPlus.combine('screws');
    var parts = {
        top: function () {
            var top = box.parts.top.subtract(
                union([
                    lcdcutout,
                    outside,
                    bezel
                ])
            );

            // console.log('box', box);

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

            return union([top, screensupport])
                // .subtract(screws.map(function (screw) {
                //     return screw.enlarge([0.42, 0.42, 0]);
                // }).combine());
        },
        bottom: function () {
            return union([
                    supports.combine(),
                    box.parts.bottom,
                    BPlus.combine('mount')
                ])
                .subtract(
                    union([screws.map(function (screw) {
                            return screw.enlarge([-0.6, -0.6, 4]);
                        }).combine(),
                        outside.enlarge([1, 1, 1]),
                        BPlus.combine('screwspad1,screwspad2,screwspad3,screwspad4', undefined, function (screw) {
                            return screw.enlarge([-0.6, -0.6, 4]);
                        })
                    ]));
        },
        assembled: function () {
            return union([outside, bezel, lcd, parts.top(), box.parts.bottom]);
        }
    }

    return parts['assembled']();
}

// ********************************************************
// Other jscad libraries are injected here.  Do not remove.
// Install jscad libraries using NPM
// ********************************************************
// include:js
// endinject
