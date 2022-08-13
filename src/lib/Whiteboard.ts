import { median } from "./utils";

export default class Whiteboard {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    // All elements drawn onto the whiteboard.
    assets: Asset[];

    isDrawing: boolean;
    prevPoint: Point;
    _currentAsset: Asset;

    // Brush settings
    brushColor: string = "rgba(0,0,0,0.2)";
    brushSize: number = 2;

    constructor(c: HTMLCanvasElement) {
        this.canvas = c;

        // Initialize fields
        this.ctx = this.canvas.getContext("2d");
        this.assets = [];
        this.isDrawing = false;

        // Set associated functions
        this.canvas.onmousedown = (e: MouseEvent) => {this.mousedown(e)};
        this.canvas.onmousemove = (e: MouseEvent) => {this.mousemove(e)};
        this.canvas.onmouseup = (e: MouseEvent) => {this.mouseup(e)};

        this.canvas.ontouchstart = (e: TouchEvent) => {this.touchstart(e)};
        this.canvas.ontouchmove = (e: TouchEvent) => {this.touchmove(e)};
        this.canvas.ontouchend = (e: TouchEvent) => {this.touchend(e)};
    }

    touchstart(e: TouchEvent): void {
        if (e.touches.length === 1) {
            let e2 = {x: e.touches[0].clientX, y: e.touches[0].clientY}
            // @ts-ignore
            this.mousedown(e2)
        }
    }

    touchmove(e: TouchEvent): void {
        if (e.touches.length === 1) {
            let e2 = {x: e.touches[0].clientX, y: e.touches[0].clientY}
            // @ts-ignore
            this.mousemove(e2)
        }
    }

    touchend(e: TouchEvent): void {
        if (e.touches.length === 0) {
            // @ts-ignore
            this.mouseup(e)
        } 
    }

    mousedown(e: MouseEvent): void {
        // Begin drawing sequence
        this.isDrawing = true;

        // Establish new asset
        if (!this.prevPoint) {
            this.prevPoint = new Point(e.x, e.y);
            this.assets.push(new LineAsset(new Point(e.x, e.y)));
            this.currentAsset.brushColor = this.brushColor.valueOf();
            this.currentAsset.brushSize = this.brushSize.valueOf();
        }
    }

    mousemove(e: MouseEvent): void {
        if (this.isDrawing) {

            // Math for calculating straight lines when holding shift!
            if (e.shiftKey) {
                if (this.currentAsset.points.length < 2) {
                    this.currentAsset.points.push(this.currentAsset.points[0].clone());
                }
                let ratio = Math.abs(e.x - this.currentAsset.points[this.currentAsset.points.length-2].x) / Math.abs(e.y - this.currentAsset.points[this.currentAsset.points.length-2].y);
                if (ratio > 1.5) {
                    this.currentAsset.points.splice(this.currentAsset.points.length-1, 1, new Point(e.x, this.currentAsset.points[this.currentAsset.points.length-2].y))
                } else if (ratio < 0.5) {
                    this.currentAsset.points.splice(this.currentAsset.points.length-1, 1, new Point(this.currentAsset.points[this.currentAsset.points.length-2].x, e.y))
                } else {
                    let r = this.currentAsset.points[this.currentAsset.points.length-2].distance(new Point(e.x, e.y));
                    this.currentAsset.points.splice(this.currentAsset.points.length-1, 1, new Point(this.currentAsset.points[this.currentAsset.points.length-2].x + (e.x - this.currentAsset.points[this.currentAsset.points.length-2].x < 0 ? -1 : 1) * r * Math.cos(Math.PI/4),this.currentAsset.points[this.currentAsset.points.length-2].y + (e.y - this.currentAsset.points[this.currentAsset.points.length-2].y < 0 ? -1 : 1) * r * Math.sin(Math.PI/4)))
                }
            } else {
                // Append new points to asset            
                this.currentAsset.points.push(new Point(e.x, e.y))
            }


            // this.currentAsset.points = this.resample(this.currentAsset);
            
            // Update viewport
            this.draw();
        }
    }

    mouseup(e: MouseEvent): void {
        // End drawing sequence
        this.isDrawing = false;
        this.prevPoint = null;
        
        // CTRL: Auto-convert to square shape on mouseup
        if (e.ctrlKey && this.currentAsset.loopDistance <= 30) {
            // Calculate corners and if they meet a threshold, just convert to bounding box square (this should be made better)
            let corners = this.getCorners(this.resample(this.currentAsset));
            if (corners.length < 7 && corners.length >= 5) {
                this.convertToSquare(this.currentAsset);
            }
        }

        // Save space right now
        // this.resample(this.currentAsset, true);     
        
        // Update to show new shapes
        this.draw();
    }

    keydown(e: KeyboardEvent) {
        // S: straighten
        if (e.code === 'KeyS' && this.currentAsset !== undefined) {
            // Default straightening, draws lines between found corners
            if (!this.currentAsset.straightened) {
                this.currentAsset.points = this.getCorners(this.resample(this.currentAsset));
                this.currentAsset.straightened = true;
            } else {
                // Secondary straightening, makes lines vertical/horizontal
                for (let i = 0; i < this.currentAsset.points.length - 1; i++) {
                    // Calculate the distances between each of the points x and y coordinates
                    let xDist = Math.abs(this.currentAsset.points[i].x - this.currentAsset.points[i+1].x);
                    let yDist = Math.abs(this.currentAsset.points[i].y - this.currentAsset.points[i+1].y);

                    // Find the ration to determine whether the line is vertical or horizontal
                    let ratio = xDist/yDist;
                    if (ratio < 0.2) {
                        // If the ratio is small, we straighten both points to their averaged x values (vertical straightening)
                        let avgX = (this.currentAsset.points[i].x + this.currentAsset.points[i+1].x) / 2;
                        this.currentAsset.points[i].x = avgX;
                        this.currentAsset.points[i+1].x = avgX;
                    } else if (ratio > 0.8) {
                        // If the ratio is large, we straighten both points to their averaged y values (horizontal straightening)
                        let avgY = (this.currentAsset.points[i].y + this.currentAsset.points[i+1].y) / 2;
                        this.currentAsset.points[i].y = avgY;
                        this.currentAsset.points[i+1].y = avgY;
                    }
                }
            }
            
            this.draw();
        }
    }

    get currentAsset() {
        return this.assets[this.assets.length - 1];
    }

    convertToSquare(a: Asset) {
        let bounds = a.bounds;
        a.points = [bounds[0], new Point(bounds[1].x, bounds[0].y), bounds[1], new Point(bounds[0].x, bounds[1].y), bounds[0]];
    }

    resample(a: Asset, mergeOld: boolean = false): Point[] {        
        // Get the resample spacing by dividing through bounding box diagonal
        let resampleSpacing = Math.max(a.bounds[0].distance(a.bounds[1]) / 80, 0.5);

        // Create resampled array and add first element
        let resampled: Point[] = [];
        resampled.push(a.points[0].clone())

        let d1 = 0;
        for (let i = 1; i < a.points.length; i++) {
            let d = a.points[i-1].distance(a.points[i]);

            if (d1 + d >= resampleSpacing) {
                let q = new Point(
                    a.points[i-1].x + ((resampleSpacing - d1)/d) * (a.points[i].x-a.points[i-1].x),
                    a.points[i-1].y + ((resampleSpacing - d1)/d) * (a.points[i].y-a.points[i-1].y),
                );
                if (mergeOld) {
                    a.points.splice(i, 0, q.clone());
                } else {
                    resampled.push(q);
                }
                
                // a.points.splice(i, 0, q.clone());

                d1 = 0;
            } else {
                d1 += d;
            }
        }

        console.log("Resampled")
        return resampled;
    }

    getCorners(points: Point[]): Point[] {
        let corners = [];
        corners.push(0);

        let w = 3;
        let straws: number[] = [];

        for (let i = w; i < points.length - w; i++) {
            straws.push(points[i-w].distance(points[i+w]));
        }

        let t = median(straws) * 0.95;

        console.log("Straws calculated")

        for (let i = w; i < points.length - w; i++) {
            if (straws[i-w] < t) {
                let localMin = Infinity;
                let localMinIndex = i;

                while (i < straws.length && straws[i-w] < t) {
                    if (straws[i-w] < localMin) {
                        localMin = straws[i-w];
                        localMinIndex = i;
                    }
                    i++;
                }

                corners.push(localMinIndex);
            }
        }

        console.log("Basic pass completed")

        corners.push(points.length-1);
        console.log(corners.length)
        corners = this.post_process_corners(points, corners, straws);
        return corners.map(c => points[c]);
    }

    post_process_corners(points: Point[], corners: number[], straws: number[]): number[] {
        // Extremely simplified post processing
        for (let i = 1; i < corners.length - 1; i++) {
            let c1 = corners[i-1];
            let c2 = corners[i+1];
            if (this.is_line(points, c1, c2)) {
                corners.splice(i, 1);
                i--;
            }
        }

        // TODO: hook removal
        return corners;
    }

    halfway_corner(straws: number[], a: number, b: number): number {
        let quarter = (b-a)/4;
        let minValue = Infinity;
        let minIndex = a;

        for (let i = a + quarter; i < b - quarter; i++) {
            if (straws[i] < minValue) {
                minValue = straws[i];
                minIndex = i;
            }
        }

        return minIndex;
    }

    is_line(points: Point[], a: number, b: number): boolean {
        let threshold = 0.95;
        let distance = points[a].distance(points[b]);
        let pathDistance = this.path_distance(points, a, b);

        return distance/pathDistance > threshold;
    }

    path_distance(points: Point[], a: number, b: number): number {
        let d = 0;
        for (let i = a; i < b-1; i++) {
            d += points[i].distance(points[i+1]);
        }
        return d;
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.lineCap = "round";
        this.ctx.lineJoin = "round";

        for (let a of this.assets) {
            this.ctx.strokeStyle = a.brushColor;
            this.ctx.lineWidth = a.brushSize;

            this.ctx.beginPath();
            for (let i = 0; i < a.points.length-1; i++) {
                this.ctx.moveTo(a.points[i].x, a.points[i].y);
                this.ctx.lineTo(a.points[i+1].x, a.points[i+1].y);
            }   

            this.ctx.closePath();
            this.ctx.stroke();         
        }
    }

    loadJson(wb: Whiteboard) {
        this.assets = wb.assets.map(a => {
            let b = new Asset();
            b.points = a.points;
            b.brushColor = a.brushColor;
            b.brushSize = a.brushSize;
            b.straightened = a.straightened;
            return b;
        })
        this.draw();
    }
}

class Point {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    distance(p: Point): number {
        return Math.sqrt(Math.pow((this.x - p.x), 2) + Math.pow((this.y - p.y), 2))
    }

    clone(): Point {
        return new Point(this.x, this.y);
    }
}

class Asset {
    points: Point[];
    _bounds: [Point, Point];
    _loopDistance: number;
    _encoding: string;
    straightened: boolean = false;
    brushColor: string = "rgba(0, 0, 0)";
    brushSize: number = 5;

    get loopDistance() {
        if (this.points[0] == this.points[this.points.length - 1]) {
            return 0;
        }
        return this.points[0].distance(this.points[this.points.length - 1])
    }

    get bounds() {
        // Should optimize this, but this is a bad way.
        // if (this._bounds) {
        //     return this._bounds;
        // }

        let pLeast = new Point(this.points[0].x, this.points[0].y);
        let pGreatest = new Point(this.points[0].x, this.points[0].y);
        for (let p of this.points) {
            if (p.y < pLeast.y) {
                pLeast.y = p.y;
            }

            if (p.x < pLeast.x) {
                pLeast.x = p.x;
            }

            if (p.x > pGreatest.x) {
                pGreatest.x = p.x;
            }

            if (p.y > pGreatest.y) {
                pGreatest.y = p.y;
            }
        }
        this._bounds = [pLeast, pGreatest];
        return this._bounds;
    }

    get encoding() {
        return this.points.map(p => p.x + "|" + p.y).join("|");
    }
}

class LineAsset extends Asset {

    constructor(p1: Point) {
        super();
        this.points = [p1];
    }

    add(p: Point) {
        this.points.push(p);
    }
}