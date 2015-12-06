import {Observable, Subscription} from '@reactivex/rxjs';

export interface INodeDef {
  name: string;
  type?: string;
  config?: any;
  dataFrom?: number[] | number; // Only on non-source nodes
  id: number;
}

export interface ISourceNode {
  (config?): Observable<any>;
}

export interface ITransfNode {
  (iO: Observable<any>): Observable<any>;
  (config: Object, iO: Observable<any>): Observable<any>;
}

export interface ISinkNode {
  (iO: Observable<any>): Subscription<any>;
  (config: Object, iO: Observable<any>): Subscription<any>;
}
