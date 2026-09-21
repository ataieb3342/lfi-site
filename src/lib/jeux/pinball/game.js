// @ts-nocheck — jeu écrit en JavaScript simple, servi tel quel : pas vérifié par TypeScript.
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const livesElement = document.getElementById("lives");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const GRAVITY = 750;
const SUBSTEPS = 8;

const vortexImage = new Image();
const vortexSize = 34;

vortexImage.src =
    "vortex.png";
let score = 0;
let lives = 3;

let gameOver = false;
let lastTime = performance.now();

const keys = {
    left: false,
    right: false
};


/*
|--------------------------------------------------------------------------
| Bille
|--------------------------------------------------------------------------
*/

const ball = {
    x: 715,
    y: 780,

    radius: 10,

    vx: 0,
    vy: 0,

    ready: true,
    inLaunchLane: true,

    lastTunnelUse: 0
};

function drawVortex(
    x,
    y,
    size,
    rotation = 0
) {

    if (!vortexImage.complete) {
        return;
    }

    ctx.save();

    ctx.translate(x, y);
    ctx.rotate(rotation);

    ctx.drawImage(
        vortexImage,
        -size / 2,
        -size / 2,
        size,
        size
    );

    ctx.restore();
}

/*
|--------------------------------------------------------------------------
| Création de l'arrondi supérieur
|--------------------------------------------------------------------------
*/

function createArcSegments(
    cx,
    cy,
    radiusX,
    radiusY,
    startAngle,
    endAngle,
    steps
) {

    const segments = [];

    let prevX =
        cx + Math.cos(startAngle) * radiusX;

    let prevY =
        cy + Math.sin(startAngle) * radiusY;


    for (let i = 1; i <= steps; i++) {

        const t =
            i / steps;

        const angle =
            startAngle +
            (endAngle - startAngle) * t;

        const x =
            cx + Math.cos(angle) * radiusX;

        const y =
            cy + Math.sin(angle) * radiusY;


        segments.push({
            x1: prevX,
            y1: prevY,
            x2: x,
            y2: y
        });


        prevX = x;
        prevY = y;
    }


    return segments;
}

function pointOnEllipse(
    cx,
    cy,
    radiusX,
    radiusY,
    angle
) {

    return {
        x: cx + Math.cos(angle) * radiusX,
        y: cy + Math.sin(angle) * radiusY
    };
}


function createSemicircleBetweenPoints(
    pointA,
    pointB,
    bulge = -1,
    steps = 14
) {

    const segments = [];

    const mx =
        (pointA.x + pointB.x) / 2;

    const my =
        (pointA.y + pointB.y) / 2;


    const hx =
        (pointB.x - pointA.x) / 2;

    const hy =
        (pointB.y - pointA.y) / 2;


    /*
    |--------------------------------------------------------------------------
    | Vecteur perpendiculaire
    |--------------------------------------------------------------------------
    |
    | bulge = -1 : demi-cercle vers l'extérieur du plateau
    | bulge =  1 : demi-cercle vers l'intérieur
    |
    */

    const px =
        -hy * bulge;

    const py =
        hx * bulge;


    let previousX =
        pointA.x;

    let previousY =
        pointA.y;


    for (
        let i = 1;
        i <= steps;
        i++
    ) {

        const angle =
            Math.PI -
            (Math.PI * i / steps);


        const x =
            mx +
            hx * Math.cos(angle) +
            px * Math.sin(angle);


        const y =
            my +
            hy * Math.cos(angle) +
            py * Math.sin(angle);


        segments.push({
            x1: previousX,
            y1: previousY,
            x2: x,
            y2: y
        });


        previousX = x;
        previousY = y;
    }


    return segments;
}

/*
|--------------------------------------------------------------------------
| Contour du terrain
|--------------------------------------------------------------------------
*/

const walls = [

    // Côté gauche
    {
        x1: 50,
        y1: 200,
        x2: 50,
        y2: 850
    },

    // Bas gauche
    {
        x1: 50,
        y1: 850,
        x2: 195,
        y2: 960
    },

    // Bas droit
    {
        x1: 650,
        y1: 850,
        x2: 505,
        y2: 960
    }

];


/*
|--------------------------------------------------------------------------
| Alcôve en haut à gauche
|--------------------------------------------------------------------------
*/

const pocketStartAngle =
    Math.PI * 1.12;

const pocketEndAngle =
    Math.PI * 1.30;


const pocketStart =
    pointOnEllipse(
        350,
        190,
        300,
        125,
        pocketStartAngle
    );


const pocketEnd =
    pointOnEllipse(
        350,
        190,
        300,
        125,
        pocketEndAngle
    );


/*
|--------------------------------------------------------------------------
| Nouveau contour supérieur
|--------------------------------------------------------------------------
*/

const topArcWalls = [

    /*
    | Partie gauche avant l'alcôve
    */

    ...createArcSegments(
        350,
        190,
        300,
        125,
        Math.PI,
        pocketStartAngle,
        8
    ),


    /*
    | Demi-cercle de l'alcôve
    */

    ...createSemicircleBetweenPoints(
        pocketStart,
        pocketEnd,
        -1,
        14
    ),


    /*
    | Reste du haut du plateau
    */

    ...createArcSegments(
        350,
        190,
        300,
        125,
        pocketEndAngle,
        Math.PI * 2,
        18
    )

];


const playfieldWalls = [
    ...walls,
    ...topArcWalls
];


/*
|--------------------------------------------------------------------------
| Bumpers principaux
|--------------------------------------------------------------------------
*/

const bumpers = [

    // Gauche
    {
        x: 285,
        y: 280,
        radius: 26,
        value: 150,
        lastHit: 0
    },

    // Bas / centre
    {
        x: 350,
        y: 390,
        radius: 26,
        value: 200,
        lastHit: 0
    },

    // Droite
    {
        x: 405,
        y: 240,
        radius: 26,
        value: 200,
        lastHit: 0
    },

    {
    // Bumper dans l'alcôve supérieure gauche
    x: 110,
    y: 95,

    radius: 16,

    value: 400,
    lastHit: 0
},

];

const lowerArcBumper = {
    x: 350,
    y: 390,

    radius: 42,
    thickness: 5,

    startAngle: Math.PI * 0.30,
    endAngle: Math.PI * 1.00,

    value: 250,
    lastHit: 0
};

/*
|--------------------------------------------------------------------------
| Parois basses
|--------------------------------------------------------------------------
*/

const lowerWalls = [

    // Gauche
    {
        x1: 200,
        y1: 860,
        x2: 130,
        y2: 780
    },

    {
        x1: 100,
        y1: 650,
        x2: 124,
        y2: 774
    },


    // Droite
    {
        x1: 500,
        y1: 860,
        x2: 570,
        y2: 780
    },

    {
        x1: 600,
        y1: 650,
        x2: 575,
        y2: 774
    }

];


/*
|--------------------------------------------------------------------------
| Triangles
|--------------------------------------------------------------------------
*/

const triangleBumpers = [

    {
        side: "left",
        wallOnly: true,

        points: [
            { x: 170, y: 660 },
            { x: 180, y: 740 },
            { x: 240, y: 790 }
        ]
    },


    {
        side: "right",

        points: [
            { x: 530, y: 660 },
            { x: 520, y: 740 },
            { x: 465, y: 790 }
        ]
    }

];

const upperLeftGuideTriangle = {
    side: "left",
    points: [
        // pointe vers le bord incurvé gauche
        { x: 160, y: 190 },

        // base du triangle tournée vers le bumper en haut à gauche
        { x: 210, y: 185 },
        { x: 180, y: 255 }
    ]
};

const upperTriangleBumpers = [

    // Obstacle 1 : en haut à gauche
    {
        side: "left",
        points: [
            { x: 50, y: 420 },
            { x: 50, y: 520 },
            { x: 90, y: 590 }
        ]
    },

    // Obstacle 2 : en haut à droite
    {
        side: "right",
        points: [
            { x: 650, y: 500 },
            { x: 570, y: 570 },
            { x: 650, y: 570 }
        ]
    }

];


/*
|--------------------------------------------------------------------------
| Couloir de lancement extérieur
|--------------------------------------------------------------------------
|
| Terrain jusqu'à x = 650
| Couloir entre x = 650 et x = 750
|
*/

const oneWayTunnel = {

    entry: {
        x: 620,
        y: 495,
        radius: 28
    },

    // Sortie vers l'alcôve en haut à gauche
    exit: {
        x: 180,
        y: 160,
        radius: 18
    },

    cooldown: 300
};

const rescueVortices = [

    {
        x: 80,
        y: 820,
        radius: 15,
        inside: false
    },

    {
        x: 620,
        y: 820,
        radius: 15,
        inside: false
    }

];

const rescueVortexSize = 30;

// 35 % de chance d'être sauvé
const RESCUE_CHANCE = 1;

const launchLaneWall = {

    x1: 650,
    y1: 300,

    x2: 650,
    y2: 850

};


const launchLaneOuterWall = {

    x1: 750,
    y1: 200,

    x2: 750,
    y2: 880

};


/*
|--------------------------------------------------------------------------
| Flippers
|--------------------------------------------------------------------------
*/

class Flipper {

    constructor(
        x,
        y,
        length,
        side
    ) {

        this.x = x;
        this.y = y;

        this.length = length;
        this.side = side;

        this.thickness = 13;
        this.speed = 12;

        this.angularVelocity = 0;


        if (side === "left") {

            this.restAngle = 0.22;
            this.activeAngle = -0.55;

        } else {

            this.restAngle =
                Math.PI - 0.22;

            this.activeAngle =
                Math.PI + 0.55;
        }


        this.angle =
            this.restAngle;

        this.targetAngle =
            this.restAngle;
    }


    update(dt, active) {

        this.targetAngle =
            active
                ? this.activeAngle
                : this.restAngle;


        const oldAngle =
            this.angle;

        const difference =
            this.targetAngle -
            this.angle;


        this.angle +=
            difference *
            Math.min(
                1,
                this.speed * dt
            );


        this.angularVelocity =
            (
                this.angle -
                oldAngle
            ) /
            Math.max(
                dt,
                0.001
            );
    }


    getEndPoint() {

        return {

            x:
                this.x +
                Math.cos(this.angle) *
                this.length,

            y:
                this.y +
                Math.sin(this.angle) *
                this.length

        };
    }


    draw() {

        const end =
            this.getEndPoint();


        ctx.beginPath();

        ctx.moveTo(
            this.x,
            this.y
        );

        ctx.lineTo(
            end.x,
            end.y
        );


        ctx.lineWidth =
            this.thickness * 2;

        ctx.lineCap =
            "round";

        ctx.strokeStyle =
            "#ff536c";

        ctx.shadowColor =
            "#ff3155";

        ctx.shadowBlur =
            10;

        ctx.stroke();

        ctx.shadowBlur =
            0;


        // Pivot
        ctx.beginPath();

        ctx.arc(
            this.x,
            this.y,
            16,
            0,
            Math.PI * 2
        );

        ctx.fillStyle =
            "#ffd966";

        ctx.fill();
    }
}


const leftFlipper =
    new Flipper(
        220,
        880,
        105,
        "left"
    );


const rightFlipper =
    new Flipper(
        480,
        880,
        105,
        "right"
    );


/*
|--------------------------------------------------------------------------
| Contrôles
|--------------------------------------------------------------------------
*/

window.addEventListener(
    "keydown",
    event => {

        if (
            event.code === "ArrowLeft" ||
            event.code === "KeyA"
        ) {

            keys.left = true;
            event.preventDefault();
        }


        if (
            event.code === "ArrowRight" ||
            event.code === "KeyD"
        ) {

            keys.right = true;
            event.preventDefault();
        }


        if (
            event.code === "Space"
        ) {

            event.preventDefault();
            launchBall();
        }


        if (
            event.code === "KeyR"
        ) {

            restartGame();
        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        if (
            event.code === "ArrowLeft" ||
            event.code === "KeyA"
        ) {

            keys.left = false;
        }


        if (
            event.code === "ArrowRight" ||
            event.code === "KeyD"
        ) {

            keys.right = false;
        }

    }
);


/*
|--------------------------------------------------------------------------
| Lancement de la bille
|--------------------------------------------------------------------------
*/

    function launchBall() {

    if (
        gameOver ||
        !ball.ready
    ) {
        return;
    }


    ball.ready = false;
    ball.inLaunchLane = true;

    ball.vx = 0;
    ball.vy = -1150;
}


/*
|--------------------------------------------------------------------------
| Collision segment
|--------------------------------------------------------------------------
*/

function collideWithSegment(
    ball,
    x1,
    y1,
    x2,
    y2,
    thickness = 5,
    bounce = 1
) {

    const dx =
        x2 - x1;

    const dy =
        y2 - y1;


    const lengthSquared =
        dx * dx +
        dy * dy;


    if (lengthSquared === 0) {
        return false;
    }


    let t =
        (
            (ball.x - x1) * dx +
            (ball.y - y1) * dy
        ) /
        lengthSquared;


    t =
        Math.max(
            0,
            Math.min(
                1,
                t
            )
        );


    const closestX =
        x1 + t * dx;

    const closestY =
        y1 + t * dy;


    let nx =
        ball.x - closestX;

    let ny =
        ball.y - closestY;


    let distance =
        Math.sqrt(
            nx * nx +
            ny * ny
        );


    const minimumDistance =
        ball.radius +
        thickness;


    if (distance === 0) {

        distance =
            0.001;

        nx = 0;
        ny = -1;
    }


    if (
        distance <
        minimumDistance
    ) {

        nx /= distance;
        ny /= distance;


        const overlap =
            minimumDistance -
            distance;


        ball.x +=
            nx * overlap;

        ball.y +=
            ny * overlap;


        const velocityAlongNormal =
            ball.vx * nx +
            ball.vy * ny;


        if (
            velocityAlongNormal < 0
        ) {

            ball.vx -=
                2 *
                velocityAlongNormal *
                nx;

            ball.vy -=
                2 *
                velocityAlongNormal *
                ny;


            ball.vx *=
                bounce;

            ball.vy *=
                bounce;
        }


        return true;
    }


    return false;
}


/*
|--------------------------------------------------------------------------
| Collision bumper
|--------------------------------------------------------------------------
*/

function collideWithBumper(
    ball,
    bumper
) {

    const dx =
        ball.x -
        bumper.x;

    const dy =
        ball.y -
        bumper.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const minimumDistance =
        ball.radius +
        bumper.radius;


    if (
        distance > 0 &&
        distance < minimumDistance
    ) {

        const nx =
            dx / distance;

        const ny =
            dy / distance;


        const overlap =
            minimumDistance -
            distance;


        ball.x +=
            nx * overlap;

        ball.y +=
            ny * overlap;


        const speed =
            380;


        ball.vx =
            nx * speed;

        ball.vy =
            ny * speed;


        const now =
            performance.now();


        if (
            now -
            bumper.lastHit >
            160
        ) {

            bumper.lastHit =
                now;

            addScore(
                bumper.value
            );
        }
    }
}


/*
|--------------------------------------------------------------------------
| Collision flipper
|--------------------------------------------------------------------------
*/

function collideWithFlipper(
    ball,
    flipper,
    active
) {

    const end =
        flipper.getEndPoint();


    const collision =
        collideWithSegment(
            ball,

            flipper.x,
            flipper.y,

            end.x,
            end.y,

            flipper.thickness,

            0.90
        );


    if (
        collision &&
        active &&
        Math.abs(
            flipper.angularVelocity
        ) > 0.5
    ) {

        ball.vy -=
            580;


        if (
            flipper.side === "left"
        ) {

            ball.vx +=
                210;

        } else {

            ball.vx -=
                210;
        }
    }
}


/*
|--------------------------------------------------------------------------
| Collision triangles
|--------------------------------------------------------------------------
*/

function collideWithTriangleBumper(
    ball,
    triangle
) {

    const p1 =
        triangle.points[0];

    const p2 =
        triangle.points[1];

    const p3 =
        triangle.points[2];


    let touched =
        false;


    if (
        collideWithSegment(
            ball,
            p1.x,
            p1.y,
            p2.x,
            p2.y,
            3,
            0.92
        )
    ) {

        touched = true;
    }


    if (
        collideWithSegment(
            ball,
            p2.x,
            p2.y,
            p3.x,
            p3.y,
            3,
            0.92
        )
    ) {

        touched = true;
    }


    if (
        collideWithSegment(
            ball,
            p3.x,
            p3.y,
            p1.x,
            p1.y,
            3,
            0.92
        )
    ) {

        touched = true;
    }


    if (touched) {

        if (
            ball.vy > -220
        ) {

            ball.vy -= 10;
        }


        if (
            triangle.side === "left"
        ) {

            ball.vx += 20;

        } else {

            ball.vx -= 20;
        }
    }
}

function collideWithTriangleWall(
    ball,
    triangle
) {

    const p1 = triangle.points[0];
    const p2 = triangle.points[1];
    const p3 = triangle.points[2];

    collideWithSegment(
        ball,
        p1.x, p1.y,
        p2.x, p2.y,
        3,
        0.88
    );

    collideWithSegment(
        ball,
        p2.x, p2.y,
        p3.x, p3.y,
        3,
        0.88
    );

    collideWithSegment(
        ball,
        p3.x, p3.y,
        p1.x, p1.y,
        3,
        0.88
    );
}


/*
|--------------------------------------------------------------------------
| Collision petit obstacle
|--------------------------------------------------------------------------
*/

function collideWithPost(
    ball,
    post
) {

    const dx =
        ball.x - post.x;

    const dy =
        ball.y - post.y;


    const distance =
        Math.sqrt(
            dx * dx +
            dy * dy
        );


    const minimumDistance =
        ball.radius +
        post.radius;


    if (
        distance > 0 &&
        distance < minimumDistance
    ) {

        const nx =
            dx / distance;

        const ny =
            dy / distance;


        const overlap =
            minimumDistance -
            distance;


        ball.x +=
            nx * overlap;

        ball.y +=
            ny * overlap;


        const velocityAlongNormal =
            ball.vx * nx +
            ball.vy * ny;


        if (
            velocityAlongNormal < 0
        ) {

            ball.vx -=
                2 *
                velocityAlongNormal *
                nx;

            ball.vy -=
                2 *
                velocityAlongNormal *
                ny;


            ball.vx *= 0.9;
            ball.vy *= 0.9;
        }
    }
}

function collideWithArcBumper(ball, arc) {

    const arcSegments =
        createArcSegments(
            arc.x,
            arc.y,
            arc.radius,
            arc.radius,
            arc.startAngle,
            arc.endAngle,
            14
        );

    let touched = false;

    for (const segment of arcSegments) {

        const hit =
            collideWithSegment(
                ball,
                segment.x1,
                segment.y1,
                segment.x2,
                segment.y2,
                arc.thickness,
                0.93
            );

        if (hit) {
            touched = true;
        }
    }

    if (touched) {

        /*
        |--------------------------------------------------------------------------
        | Bonus si la bille touche la face du bas
        |--------------------------------------------------------------------------
        */

        if (ball.y > arc.y) {

            const now = performance.now();

            if (now - arc.lastHit > 160) {
                arc.lastHit = now;
                addScore(arc.value);
            }

            // petit renvoi vers le haut
            ball.vy -= 80;
        }
    }
}

/*
|--------------------------------------------------------------------------
| Score
|--------------------------------------------------------------------------
*/

function addScore(points) {

    score += points;

    scoreElement.textContent =
        score;
}


/*
|--------------------------------------------------------------------------
| Mise à jour physique
|--------------------------------------------------------------------------
*/

function useOneWayTunnel(ball) {

    const now = performance.now();

    if (
        now - ball.lastTunnelUse <
        oneWayTunnel.cooldown
    ) {
        return;
    }

    const dx =
        ball.x - oneWayTunnel.entry.x;

    const dy =
        ball.y - oneWayTunnel.entry.y;

    const distance =
        Math.hypot(dx, dy);

    const entryRadius =
        ball.radius +
        oneWayTunnel.entry.radius;

    /*
    |--------------------------------------------------------------------------
    | Entrée autorisée uniquement en 1
    |--------------------------------------------------------------------------
    |
    | On demande que la bille arrive globalement
    | vers la gauche / vers l'entrée.
    |
    */

    const correctDirection =
        ball.vx < -30;

    if (
        distance < entryRadius &&
        correctDirection
    ) {

       ball.x =
    oneWayTunnel.exit.x;

ball.y =
    oneWayTunnel.exit.y;


/*
|--------------------------------------------------------------------------
| Projection vers l'alcôve
|--------------------------------------------------------------------------
*/

ball.vx = -680;
ball.vy = -420;

ball.lastTunnelUse =
    now;
    }
}

function update(dt) {
     if (
        gameOver
    ) {
        return;
    }

    leftFlipper.update(
        dt,
        keys.left
    );

    rightFlipper.update(
        dt,
        keys.right
    );


    /*
    |--------------------------------------------------------------------------
    | Bille en attente
    |--------------------------------------------------------------------------
    */

    if (ball.ready) {

        ball.x = 715;
        ball.y = 780;

        return;
    }


    const step =
        dt / SUBSTEPS;


    for (
        let i = 0;
        i < SUBSTEPS;
        i++
    ) {

        /*
        |--------------------------------------------------------------------------
        | Gravité et déplacement
        |--------------------------------------------------------------------------
        */

        ball.vy +=
            GRAVITY * step;


        ball.x +=
            ball.vx * step;

        ball.y +=
            ball.vy * step;


        ball.vx *=
            0.9995;

        ball.vy *=
            0.9995;

            useOneWayTunnel(ball);
            checkRescueVortices(ball);


        /*
        |--------------------------------------------------------------------------
        | Sortie du lanceur
        |--------------------------------------------------------------------------
        */

        if (
            ball.inLaunchLane &&
            ball.y < 230
        ) {

            ball.vx = -700;
            ball.vy = -340;
        }


        /*
        * La bille est vraiment sur le terrain.
        */

        if (
            ball.inLaunchLane &&
            ball.x < 640
        ) {

            ball.inLaunchLane =
                false;
        }


        /*
        |--------------------------------------------------------------------------
        | Contour du terrain
        |--------------------------------------------------------------------------
        */

        for (
            const wall
            of playfieldWalls
        ) {

            collideWithSegment(
                ball,

                wall.x1,
                wall.y1,

                wall.x2,
                wall.y2,

                5,
                0.91
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Couloir du lanceur
        |--------------------------------------------------------------------------
        */

        collideWithSegment(
            ball,

            launchLaneWall.x1,
            launchLaneWall.y1,

            launchLaneWall.x2,
            launchLaneWall.y2,

            4,
            0.90
        );


        collideWithSegment(
            ball,

            launchLaneOuterWall.x1,
            launchLaneOuterWall.y1,

            launchLaneOuterWall.x2,
            launchLaneOuterWall.y2,

            4,
            0.90
        );


        /*
        |--------------------------------------------------------------------------
        | Clapet anti-retour
        |--------------------------------------------------------------------------
        */

        if (
            !ball.inLaunchLane
        ) {

            collideWithSegment(
                ball,

                650,
                190,

                650,
                300,

                5,
                0.90
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Parois basses
        |--------------------------------------------------------------------------
        */

        for (
            const wall
            of lowerWalls
        ) {

            collideWithSegment(
                ball,

                wall.x1,
                wall.y1,

                wall.x2,
                wall.y2,

                3,
                0.88
            );
        }


        /*
        |--------------------------------------------------------------------------
        | Triangles
        |--------------------------------------------------------------------------
        */

        for (
            const triangle
            of triangleBumpers
        ) {

            collideWithTriangleBumper(
                ball,
                triangle
            );
        }

        collideWithTriangleBumper(
    ball,
    upperLeftGuideTriangle
);

       for (
    const triangle
    of upperTriangleBumpers
) {

    if (
        triangle.wallOnly
    ) {

        collideWithTriangleWall(
            ball,
            triangle
        );

    } else {

        collideWithTriangleBumper(
            ball,
            triangle
        );
    }
}

function checkRescueVortices(ball) {

    for (const vortex of rescueVortices) {

        const dx =
            ball.x - vortex.x;

        const dy =
            ball.y - vortex.y;

        const distance =
            Math.hypot(dx, dy);

        const touching =
            distance <
            ball.radius +
            vortex.radius;


        /*
        |--------------------------------------------------------------------------
        | La bille vient d'entrer dans le vortex
        |--------------------------------------------------------------------------
        */

        if (
            touching &&
            !vortex.inside
        ) {

            vortex.inside = true;


            /*
            |--------------------------------------------------------------------------
            | Tirage aléatoire du sauvetage
            |--------------------------------------------------------------------------
            */

            if (
                Math.random() <
                RESCUE_CHANCE
            ) {

                /*
                |--------------------------------------------------------------------------
                | Réapparition à la sortie du tunnel principal
                |--------------------------------------------------------------------------
                */

                ball.x =
                    oneWayTunnel.exit.x;

                ball.y =
                    oneWayTunnel.exit.y;


                /*
                |--------------------------------------------------------------------------
                | Petite impulsion de sortie
                |--------------------------------------------------------------------------
                */

                ball.vx = -100;
                ball.vy = -70;


                /*
                |--------------------------------------------------------------------------
                | Réinitialisation des vortex
                |--------------------------------------------------------------------------
                */

                for (
                    const rescue
                    of rescueVortices
                ) {

                    rescue.inside =
                        false;
                }


                return;
            }
        }


        /*
        |--------------------------------------------------------------------------
        | La bille est sortie de la zone
        |--------------------------------------------------------------------------
        */

        if (!touching) {

            vortex.inside =
                false;
        }
    }
}

        /*
        |--------------------------------------------------------------------------
        | Bumpers
        |--------------------------------------------------------------------------
        */

        for (
            const bumper
            of bumpers
        ) {

            collideWithBumper(
                ball,
                bumper
            );
        }

        collideWithArcBumper(
    ball,
    lowerArcBumper
);


        /*
        |--------------------------------------------------------------------------
        | Flippers
        |--------------------------------------------------------------------------
        */

        collideWithFlipper(
            ball,
            leftFlipper,
            keys.left
        );


        collideWithFlipper(
            ball,
            rightFlipper,
            keys.right
        );


        /*
        |--------------------------------------------------------------------------
        | Sécurité plafond
        |--------------------------------------------------------------------------
        */

        const topLimit =
            40 +
            ball.radius;


        if (
            ball.y <
            topLimit
        ) {

            ball.y =
                topLimit;

            ball.vy =
                Math.abs(
                    ball.vy
                ) *
                0.90;
        }


        /*
        |--------------------------------------------------------------------------
        | Sécurité gauche
        |--------------------------------------------------------------------------
        */

        const leftLimit =
            40 +
            ball.radius;


        if (
            ball.x <
            leftLimit
        ) {

            ball.x =
                leftLimit;

            ball.vx =
                Math.abs(
                    ball.vx
                ) *
                0.90;
        }


        /*
        |--------------------------------------------------------------------------
        | Sécurité droite
        |--------------------------------------------------------------------------
        |
        | Dans le lanceur : jusqu'à x 750
        | Sur le terrain : jusqu'à x 650
        |
        */

        const rightLimit =
            ball.inLaunchLane
                ? 750 - ball.radius
                : 650 - ball.radius;


        if (
            ball.x >
            rightLimit
        ) {

            ball.x =
                rightLimit;

            ball.vx =
                -Math.abs(
                    ball.vx
                ) *
                0.90;
        }

    }


    /*
    |--------------------------------------------------------------------------
    | Bille perdue
    |--------------------------------------------------------------------------
    */

    if (
        ball.y >
        HEIGHT + 40
    ) {

        loseBall();
    }
}


/*
|--------------------------------------------------------------------------
| Gestion des billes
|--------------------------------------------------------------------------
*/

function loseBall() {

    lives--;

    livesElement.textContent =
        lives;


    /*
    |--------------------------------------------------------------------------
    | Plus aucune bille
    |--------------------------------------------------------------------------
    */

    if (
        lives <= 0
    ) {

        gameOver = true;

        ball.ready = false;

        ball.vx = 0;
        ball.vy = 0;

        return;
    }


    /*
    |--------------------------------------------------------------------------
    | Il reste une bille
    |--------------------------------------------------------------------------
    */

    resetBall();
}


function resetBall() {

    ball.x = 715;
    ball.y = 780;

    ball.vx = 0;
    ball.vy = 0;

    ball.ready = true;
    ball.inLaunchLane = true;
    ball.lastTunnelUse = 0;
}


function restartGame() {

    score = 0;
    lives = 3;

    gameOver = false;


    scoreElement.textContent =
        score;

    livesElement.textContent =
        lives;


    resetBall();
}


/*
|--------------------------------------------------------------------------
| Dessin du plateau
|--------------------------------------------------------------------------
*/

function drawOneWayTunnel() {

    const spin =
        performance.now() * 0.002;

    /*
    |--------------------------------------------------------------------------
    | Vortex d'entrée
    |--------------------------------------------------------------------------
    */

    drawVortex(
        oneWayTunnel.entry.x,
        oneWayTunnel.entry.y,
        vortexSize,
        spin
    );

    /*
    |--------------------------------------------------------------------------
    | Vortex de sortie
    |--------------------------------------------------------------------------
    */

    drawVortex(
        oneWayTunnel.exit.x,
        oneWayTunnel.exit.y,
        vortexSize,
        -spin
    );
}

function drawRescueVortices() {

    const spin =
        performance.now() * 0.002;

    drawVortex(
        rescueVortices[0].x,
        rescueVortices[0].y,
        rescueVortexSize,
        spin
    );

    drawVortex(
        rescueVortices[1].x,
        rescueVortices[1].y,
        rescueVortexSize,
        -spin
    );
}

function drawArrow(
    x1,
    y1,
    x2,
    y2
) {

    const headLength = 14;

    const angle =
        Math.atan2(
            y2 - y1,
            x2 - x1
        );


    /*
    |--------------------------------------------------------------------------
    | Ligne
    |--------------------------------------------------------------------------
    */

    ctx.beginPath();

    ctx.moveTo(
        x1,
        y1
    );

    ctx.lineTo(
        x2,
        y2
    );

    ctx.stroke();


    /*
    |--------------------------------------------------------------------------
    | Pointe
    |--------------------------------------------------------------------------
    */

    ctx.beginPath();

    ctx.moveTo(
        x2,
        y2
    );

    ctx.lineTo(
        x2 -
        headLength *
        Math.cos(
            angle -
            Math.PI / 6
        ),

        y2 -
        headLength *
        Math.sin(
            angle -
            Math.PI / 6
        )
    );

    ctx.lineTo(
        x2 -
        headLength *
        Math.cos(
            angle +
            Math.PI / 6
        ),

        y2 -
        headLength *
        Math.sin(
            angle +
            Math.PI / 6
        )
    );

    ctx.closePath();

    ctx.fill();
}

function drawTable() {

    /*
    * Fond
    */

    ctx.fillStyle =
        "#020713";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /*
    * Étoiles
    */

    ctx.fillStyle =
        "#ffffff";


    for (
        let i = 0;
        i < 45;
        i++
    ) {

        const x =
            (i * 137) %
            WIDTH;

        const y =
            (i * 271) %
            HEIGHT;


        ctx.fillRect(
            x,
            y,
            2,
            2
        );
    }


    /*
    * Cercle décoratif
    */

    ctx.beginPath();

    ctx.arc(
        350,
        395,
        215,
        0,
        Math.PI * 2
    );

    ctx.strokeStyle =
        "#173f64";

    ctx.lineWidth =
        3;

    ctx.stroke();


    /*
    |--------------------------------------------------------------------------
    | Contour du terrain
    |--------------------------------------------------------------------------
    */

    ctx.strokeStyle =
        "#61cfff";

    ctx.lineWidth =
        9;

    ctx.lineCap =
        "round";

    ctx.shadowColor =
        "#32aaff";

    ctx.shadowBlur =
        8;


    for (
        const wall
        of playfieldWalls
    ) {

        ctx.beginPath();

        ctx.moveTo(
            wall.x1,
            wall.y1
        );

        ctx.lineTo(
            wall.x2,
            wall.y2
        );

        ctx.stroke();
    }


    /*
    |--------------------------------------------------------------------------
    | Mur gauche du lanceur
    |--------------------------------------------------------------------------
    */

    ctx.lineWidth =
        5;

    ctx.beginPath();

    ctx.moveTo(
        launchLaneWall.x1,
        launchLaneWall.y1
    );

    ctx.lineTo(
        launchLaneWall.x2,
        launchLaneWall.y2
    );

    ctx.stroke();


    /*
    |--------------------------------------------------------------------------
    | Mur droit du lanceur
    |--------------------------------------------------------------------------
    */

    ctx.beginPath();

    ctx.moveTo(
        launchLaneOuterWall.x1,
        launchLaneOuterWall.y1
    );

    ctx.lineTo(
        launchLaneOuterWall.x2,
        launchLaneOuterWall.y2
    );

    ctx.stroke();


    ctx.shadowBlur =
        0;


    /*
    * Texte central
    */

    ctx.fillStyle =
        "#315779";

    ctx.font =
        "26px Courier New";

    ctx.textAlign =
        "center";


    ctx.fillText(
        "SPACE",
        350,
        600
    );


    ctx.fillText(
        "DSN",
        350,
        630
    );
}


/*
|--------------------------------------------------------------------------
| Dessin des bumpers
|--------------------------------------------------------------------------
*/

function drawBumpers() {

    for (
        const bumper
        of bumpers
    ) {

        ctx.beginPath();

        ctx.arc(
            bumper.x,
            bumper.y,
            bumper.radius,
            0,
            Math.PI * 2
        );


        ctx.fillStyle =
            "#8d2cff";

        ctx.shadowColor =
            "#a82fff";

        ctx.shadowBlur =
            13;

        ctx.fill();


        ctx.beginPath();

        ctx.arc(
            bumper.x,
            bumper.y,
            Math.max(
                6,
                bumper.radius - 7
            ),
            0,
            Math.PI * 2
        );


        ctx.strokeStyle =
            "#ffdd4d";

        ctx.lineWidth =
            3;

        ctx.stroke();
    }


    ctx.shadowBlur =
        0;
}

function drawLowerArcBumper() {

    ctx.beginPath();

    ctx.arc(
        lowerArcBumper.x,
        lowerArcBumper.y,
        lowerArcBumper.radius,
        lowerArcBumper.startAngle,
        lowerArcBumper.endAngle
    );

    ctx.strokeStyle = "#39d9ff";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";

    ctx.shadowColor = "#24bfff";
    ctx.shadowBlur = 8;

    ctx.stroke();

    ctx.shadowBlur = 0;
}

/*
|--------------------------------------------------------------------------
| Dessin des parois basses
|--------------------------------------------------------------------------
*/

function drawLowerWalls() {

    ctx.strokeStyle =
        "#39d9ff";

    ctx.lineWidth =
        6;

    ctx.lineCap =
        "round";

    ctx.shadowColor =
        "#24bfff";

    ctx.shadowBlur =
        8;


    for (
        const wall
        of lowerWalls
    ) {

        ctx.beginPath();

        ctx.moveTo(
            wall.x1,
            wall.y1
        );

        ctx.lineTo(
            wall.x2,
            wall.y2
        );

        ctx.stroke();
    }


    ctx.shadowBlur =
        0;
}


/*
|--------------------------------------------------------------------------
| Triangle avec angles arrondis
|--------------------------------------------------------------------------
*/

function drawRoundedTriangle(
    ctx,
    points,
    radius = 12
) {

    const roundedPoints =
        [];


    for (
        let i = 0;
        i < 3;
        i++
    ) {

        const previous =
            points[
                (i + 2) % 3
            ];

        const current =
            points[i];

        const next =
            points[
                (i + 1) % 3
            ];


        const dx1 =
            previous.x -
            current.x;

        const dy1 =
            previous.y -
            current.y;

        const dx2 =
            next.x -
            current.x;

        const dy2 =
            next.y -
            current.y;


        const length1 =
            Math.hypot(
                dx1,
                dy1
            );

        const length2 =
            Math.hypot(
                dx2,
                dy2
            );


        const r =
            Math.min(
                radius,
                length1 / 3,
                length2 / 3
            );


        roundedPoints.push({

            start: {
                x:
                    current.x +
                    dx1 /
                    length1 *
                    r,

                y:
                    current.y +
                    dy1 /
                    length1 *
                    r
            },


            corner: {
                x: current.x,
                y: current.y
            },


            end: {
                x:
                    current.x +
                    dx2 /
                    length2 *
                    r,

                y:
                    current.y +
                    dy2 /
                    length2 *
                    r
            }

        });
    }


    ctx.beginPath();


    ctx.moveTo(
        roundedPoints[0].end.x,
        roundedPoints[0].end.y
    );


    for (
        let i = 1;
        i <= 3;
        i++
    ) {

        const point =
            roundedPoints[
                i % 3
            ];


        ctx.lineTo(
            point.start.x,
            point.start.y
        );


        ctx.quadraticCurveTo(
            point.corner.x,
            point.corner.y,
            point.end.x,
            point.end.y
        );
    }


    ctx.closePath();
}


/*
|--------------------------------------------------------------------------
| Dessin triangles
|--------------------------------------------------------------------------
*/

function drawTriangleBumpers() {

    ctx.fillStyle =
        "#0d1f2f";

    ctx.strokeStyle =
        "#39d9ff";

    ctx.lineWidth =
        4;

    ctx.shadowColor =
        "#24bfff";

    ctx.shadowBlur =
        8;


    for (
        const triangle
        of triangleBumpers
    ) {

        drawRoundedTriangle(
            ctx,
            triangle.points,
            12
        );

        ctx.fill();
        ctx.stroke();
    }


    ctx.shadowBlur =
        0;
}

/*
|--------------------------------------------------------------------------
| Dessin triangles supérieurs
|--------------------------------------------------------------------------
*/

function drawUpperTriangleBumpers() {

    ctx.fillStyle =
        "#0d1f2f";

    ctx.strokeStyle =
        "#39d9ff";

    ctx.lineWidth =
        4;

    ctx.shadowColor =
        "#24bfff";

    ctx.shadowBlur =
        8;


    for (
        const triangle
        of upperTriangleBumpers
    ) {

        drawRoundedTriangle(
            ctx,
            triangle.points,
            12
        );

        ctx.fill();
        ctx.stroke();
    }


    ctx.shadowBlur =
        0;
}

function drawUpperLeftGuideTriangle() {

    ctx.fillStyle =
        "#0d1f2f";

    ctx.strokeStyle =
        "#39d9ff";

    ctx.lineWidth =
        4;

    ctx.shadowColor =
        "#24bfff";

    ctx.shadowBlur =
        8;

    drawRoundedTriangle(
        ctx,
        upperLeftGuideTriangle.points,
        12
    );

    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur =
        0;
}

/*
|--------------------------------------------------------------------------
| Dessin bille
|--------------------------------------------------------------------------
*/

function drawBall() {

    ctx.beginPath();

    ctx.arc(
        ball.x,
        ball.y,
        ball.radius,
        0,
        Math.PI * 2
    );


    const gradient =
        ctx.createRadialGradient(

            ball.x - 4,
            ball.y - 5,
            2,

            ball.x,
            ball.y,
            ball.radius
        );


    gradient.addColorStop(
        0,
        "#ffffff"
    );

    gradient.addColorStop(
        0.5,
        "#d5dde4"
    );

    gradient.addColorStop(
        1,
        "#57616a"
    );


    ctx.fillStyle =
        gradient;

    ctx.shadowColor =
        "#ffffff";

    ctx.shadowBlur =
        7;

    ctx.fill();

    ctx.shadowBlur =
        0;
}


/*
|--------------------------------------------------------------------------
| Message lancement
|--------------------------------------------------------------------------
*/

function drawReadyMessage() {

    if (!ball.ready) {
        return;
    }


    ctx.fillStyle =
        "#ffd966";

    ctx.font =
        "18px Courier New";

    ctx.textAlign =
        "center";


    ctx.fillText(
        "ESPACE POUR LANCER",
        350,
        790
    );
}


/*
|--------------------------------------------------------------------------
| Dessin complet
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Écran Game Over
|--------------------------------------------------------------------------
*/

function drawGameOver() {

    if (
        !gameOver
    ) {
        return;
    }


    ctx.save();


    /*
    |--------------------------------------------------------------------------
    | Fond sombre transparent
    |--------------------------------------------------------------------------
    */

    ctx.fillStyle =
        "rgba(0, 0, 0, 0.78)";

    ctx.fillRect(
        0,
        0,
        WIDTH,
        HEIGHT
    );


    /*
    |--------------------------------------------------------------------------
    | Titre
    |--------------------------------------------------------------------------
    */

    ctx.textAlign =
        "center";


    ctx.fillStyle =
        "#ff536c";

    ctx.shadowColor =
        "#ff3155";

    ctx.shadowBlur =
        15;


    ctx.font =
        "bold 48px Courier New";


    ctx.fillText(
        "PARTIE TERMINÉE",
        WIDTH / 2,
        HEIGHT / 2 - 80
    );


    /*
    |--------------------------------------------------------------------------
    | Score final
    |--------------------------------------------------------------------------
    */

    ctx.shadowBlur =
        0;


    ctx.fillStyle =
        "#ffd966";

    ctx.font =
        "bold 32px Courier New";


    ctx.fillText(
        "SCORE FINAL",
        WIDTH / 2,
        HEIGHT / 2
    );


    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "40px Courier New";


    ctx.fillText(
        score,
        WIDTH / 2,
        HEIGHT / 2 + 55
    );


    /*
    |--------------------------------------------------------------------------
    | Recommencer
    |--------------------------------------------------------------------------
    */

    ctx.fillStyle =
        "#39d9ff";

    ctx.font =
        "20px Courier New";


    ctx.fillText(
        "R : RECOMMENCER",
        WIDTH / 2,
        HEIGHT / 2 + 130
    );


    ctx.restore();
}

function draw() {

    drawTable();

    drawLowerWalls();

    drawTriangleBumpers();

    drawUpperTriangleBumpers();

    drawUpperLeftGuideTriangle();

    drawBumpers();

   drawLowerArcBumper();

leftFlipper.draw();
rightFlipper.draw();

drawOneWayTunnel();
drawRescueVortices();

drawBall();

drawReadyMessage();

/*
|--------------------------------------------------------------------------
| Toujours en dernier
|--------------------------------------------------------------------------
*/

drawGameOver();
}


/*
|--------------------------------------------------------------------------
| Boucle principale
|--------------------------------------------------------------------------
*/

function gameLoop(
    currentTime
) {

    let dt =
        (
            currentTime -
            lastTime
        ) /
        1000;


    lastTime =
        currentTime;


    dt =
        Math.min(
            dt,
            0.025
        );


    update(dt);

    draw();


    requestAnimationFrame(
        gameLoop
    );
}


requestAnimationFrame(
    gameLoop
);