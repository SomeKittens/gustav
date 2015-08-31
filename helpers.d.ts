/// <reference path="typings/tsd.d.ts" />
/// <reference path="index.d.ts" />
import Gustav from './index';
import { Observable } from 'rx';
export declare class FileSource extends Gustav.Source {
    filename: string;
    lineSeparator: string;
    watchOptions: {};
    fromStart: boolean;
    constructor(filename: string, lineSeparator?: string, watchOptions?: {}, fromStart?: boolean);
    run(): any;
}
export declare class PostgresSource extends Gustav.Source {
    config: any;
    exec: Function;
    constructor(config: any);
    run(): Observable<{}>;
}
