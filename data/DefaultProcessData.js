import Process from "../models/Process";
import {createSegments} from "../utils/createSegments";

const PROCESS_DEFINITIONS = [
    {id: 'P1', name: 'Calculadora', segments: {'code': 60, 'data': 20, 'stack': 20}},
    {id: 'P2', name: 'Word', segments: {'code': 300, 'data': 150, 'stack': 50}},
    {id: 'P3', name: 'Excel', segments: {'code': 350, 'data': 200, 'stack': 60}},
    {id: 'P4', name: 'Chrome', segments: {'code': 500, 'data': 300, 'stack': 100}},// 'heap': 400,  'extensiones': 200}
    {id: 'P5', name: 'Spotify', segments: {'code': 150, 'data': 100, 'cache': 80, 'stack': 30}},
];

// creamos los proceso por defecto con el createSegments que os crea segun las definiciones
export function createDefaultProcesses() {
    return PROCESS_DEFINITIONS.map(
        ({id, name, segments}) => new Process(id, name, createSegments(segments))
    );
}