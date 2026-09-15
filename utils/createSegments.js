import Segment from "../models/Segment";

export function createSegments(sizes) {
    return Object.entries(sizes).map(([name, size]) => new Segment(name, size));
}