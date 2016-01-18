import {Observable, Subscription} from '@reactivex/rxjs';

export interface IMetaConfig {
  gid?: string | number;
  external?: string;
}

export interface INodeDef {
  name: string;
  type?: string;
  config?: any;
  metaConfig?: IMetaConfig;
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

export interface ICoupler {
  config?: any;
  defaultName: string;
  getClient?(): any;
  from(name: string): Observable<any>;
  to(name: string, iO: Observable<any>): Subscription<any>;
}
